from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam_question import ExamQuestion
from app.models.exam_section import ExamSection
from app.models.question_bank_set import QuestionBankSet
from app.models.question_library_subject import (
    QuestionLibrarySubject,
)
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.exam_section import (
    ExamSectionCreate,
    ExamSectionResponse,
    ExamSectionUpdate,
)
from app.services.exam_access import require_exam_owner
from app.services.question_library_access import (
    require_library_access,
)

router = APIRouter()


def get_section_or_404(
    section_id: int,
    db: Session,
) -> ExamSection:
    section = (
        db.query(ExamSection)
        .filter(ExamSection.section_id == section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Exam section not found",
        )

    return section


def validate_library_subject(
    bank_id: int,
    library_subject_id: int,
    current_user: User,
    db: Session,
):
    library = require_library_access(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    subject = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.library_subject_id
            == library_subject_id,
            QuestionLibrarySubject.bank_id == bank_id,
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail=(
                "The selected subject does not belong "
                "to the selected question library"
            ),
        )

    return library, subject


def serialize_section(
    section: ExamSection,
    db: Session,
):
    library_title = None

    if section.bank_id:
        library_title = (
            db.query(QuestionBankSet.title)
            .filter(
                QuestionBankSet.bank_id
                == section.bank_id
            )
            .scalar()
        )

    question_count = (
        db.query(func.count(ExamQuestion.id))
        .filter(
            ExamQuestion.exam_id == section.exam_id,
            ExamQuestion.section_id == section.section_id,
        )
        .scalar()
        or 0
    )

    return {
        "section_id": section.section_id,
        "exam_id": section.exam_id,
        "section_title": section.section_title,
        "subject": section.subject,
        "bank_id": section.bank_id,
        "library_subject_id":
            section.library_subject_id,
        "section_order": section.section_order,
        "question_limit": section.question_limit,
        "total_marks": section.total_marks,
        "negative_marks": section.negative_marks,
        "randomize_questions":
            section.randomize_questions,
        "question_count": question_count,
        "library_title": library_title,
    }


@router.post(
    "/exam/{exam_id}",
    response_model=ExamSectionResponse,
    status_code=201,
)
def create_exam_section(
    exam_id: int,
    data: ExamSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    exam = require_exam_owner(
        exam_id=exam_id,
        current_user=current_user,
        db=db,
    )

    if exam.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=(
                "Sections can only be added "
                "while the exam is in draft status"
            ),
        )

    library, subject = validate_library_subject(
        bank_id=data.bank_id,
        library_subject_id=data.library_subject_id,
        current_user=current_user,
        db=db,
    )

    duplicate = (
        db.query(ExamSection)
        .filter(
            ExamSection.exam_id == exam_id,
            func.lower(ExamSection.section_title)
            == data.section_title.lower(),
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "This exam already contains a section "
                "with the same title"
            ),
        )

    section = ExamSection(
        exam_id=exam_id,
        section_title=data.section_title,
        subject=subject.subject_name,
        bank_id=library.bank_id,
        library_subject_id=subject.library_subject_id,
        section_order=data.section_order,
        question_limit=data.question_limit,
        total_marks=data.total_marks,
        negative_marks=data.negative_marks,
        randomize_questions=data.randomize_questions,
    )

    db.add(section)
    db.commit()
    db.refresh(section)

    return serialize_section(section, db)


@router.get(
    "/exam/{exam_id}",
    response_model=list[ExamSectionResponse],
)
def get_exam_sections(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    require_exam_owner(
        exam_id=exam_id,
        current_user=current_user,
        db=db,
    )

    sections = (
        db.query(ExamSection)
        .filter(ExamSection.exam_id == exam_id)
        .order_by(
            ExamSection.section_order.asc(),
            ExamSection.section_id.asc(),
        )
        .all()
    )

    return [
        serialize_section(section, db)
        for section in sections
    ]


@router.put(
    "/{section_id}",
    response_model=ExamSectionResponse,
)
def update_exam_section(
    section_id: int,
    data: ExamSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    section = get_section_or_404(
        section_id=section_id,
        db=db,
    )

    exam = require_exam_owner(
        exam_id=section.exam_id,
        current_user=current_user,
        db=db,
    )

    if exam.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=(
                "Sections can only be modified "
                "while the exam is in draft status"
            ),
        )

    library, subject = validate_library_subject(
        bank_id=data.bank_id,
        library_subject_id=data.library_subject_id,
        current_user=current_user,
        db=db,
    )

    duplicate = (
        db.query(ExamSection)
        .filter(
            ExamSection.exam_id == section.exam_id,
            func.lower(ExamSection.section_title)
            == data.section_title.lower(),
            ExamSection.section_id != section_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "This exam already contains a section "
                "with the same title"
            ),
        )

    section.section_title = data.section_title
    section.subject = subject.subject_name
    section.bank_id = library.bank_id
    section.library_subject_id = (
        subject.library_subject_id
    )
    section.section_order = data.section_order
    section.question_limit = data.question_limit
    section.total_marks = data.total_marks
    section.negative_marks = data.negative_marks
    section.randomize_questions = (
        data.randomize_questions
    )

    db.commit()
    db.refresh(section)

    return serialize_section(section, db)


@router.delete("/{section_id}")
def delete_exam_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    section = get_section_or_404(
        section_id=section_id,
        db=db,
    )

    exam = require_exam_owner(
        exam_id=section.exam_id,
        current_user=current_user,
        db=db,
    )

    if exam.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=(
                "Sections can only be deleted "
                "while the exam is in draft status"
            ),
        )

    question_count = (
        db.query(func.count(ExamQuestion.id))
        .filter(
            ExamQuestion.section_id == section_id
        )
        .scalar()
        or 0
    )

    if question_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Remove the assigned questions before "
                "deleting this section"
            ),
        )

    db.delete(section)
    db.commit()

    return {
        "message": "Exam section deleted successfully",
    }