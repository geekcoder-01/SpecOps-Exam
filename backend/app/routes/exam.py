from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam import Exam
from app.models.exam_question import ExamQuestion
from app.models.exam_section import ExamSection
from app.models.student_exam import StudentExam
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.exam import (
    ExamCreate,
    ExamResponse,
    ExamStatusUpdate,
    ExamUpdate,
)
from app.services.exam_access import (
    get_exam_or_404,
    require_exam_owner,
)

router = APIRouter()


def serialize_exam(
    exam: Exam,
    current_user_id: int,
):
    return {
        "exam_id": exam.exam_id,
        "exam_name": exam.exam_name,
        "exam_type": exam.exam_type,
        "subject": exam.subject,
        "instructions": exam.instructions,
        "duration": exam.duration,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "negative_marks": exam.negative_marks,
        "randomize_questions": exam.randomize_questions,
        "randomize_options": exam.randomize_options,
        "allow_calculator": exam.allow_calculator,
        "require_fullscreen": exam.require_fullscreen,
        "browser_lock_enabled": exam.browser_lock_enabled,
        "camera_required": exam.camera_required,
        "microphone_required": exam.microphone_required,
        "face_detection_enabled":
            exam.face_detection_enabled,
        "multiple_face_detection_enabled":
            exam.multiple_face_detection_enabled,
        "mobile_detection_enabled":
            exam.mobile_detection_enabled,
        "tab_switch_detection_enabled":
            exam.tab_switch_detection_enabled,
        "audio_detection_enabled":
            exam.audio_detection_enabled,
        "status": exam.status,
        "created_by": exam.created_by,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
        "is_owner": (
            exam.created_by == current_user_id
        ),
    }


def apply_exam_data(
    exam: Exam,
    data: ExamCreate | ExamUpdate,
):
    exam.exam_name = data.exam_name
    exam.exam_type = data.exam_type
    exam.subject = data.subject
    exam.instructions = data.instructions

    exam.duration = data.duration
    exam.start_time = data.start_time
    exam.end_time = data.end_time

    exam.total_marks = data.total_marks
    exam.passing_marks = data.passing_marks
    exam.negative_marks = data.negative_marks

    exam.randomize_questions = (
        data.randomize_questions
    )
    exam.randomize_options = data.randomize_options
    exam.allow_calculator = data.allow_calculator

    exam.require_fullscreen = data.require_fullscreen
    exam.browser_lock_enabled = (
        data.browser_lock_enabled
    )

    exam.camera_required = data.camera_required
    exam.microphone_required = (
        data.microphone_required
    )

    exam.face_detection_enabled = (
        data.face_detection_enabled
    )
    exam.multiple_face_detection_enabled = (
        data.multiple_face_detection_enabled
    )
    exam.mobile_detection_enabled = (
        data.mobile_detection_enabled
    )
    exam.tab_switch_detection_enabled = (
        data.tab_switch_detection_enabled
    )
    exam.audio_detection_enabled = (
        data.audio_detection_enabled
    )


@router.post(
    "/create",
    response_model=ExamResponse,
    status_code=201,
)
def create_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    duplicate = (
        db.query(Exam)
        .filter(
            Exam.created_by == current_user.user_id,
            Exam.exam_name.ilike(data.exam_name),
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "You already have an exam with this name"
            ),
        )

    exam = Exam(
        created_by=current_user.user_id,
        status="draft",
    )

    apply_exam_data(exam, data)

    db.add(exam)
    db.commit()
    db.refresh(exam)

    return serialize_exam(
        exam,
        current_user.user_id,
    )


@router.get(
    "/all",
    response_model=list[ExamResponse],
)
def get_all_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    exams = (
        db.query(Exam)
        .filter(
            Exam.created_by == current_user.user_id
        )
        .order_by(Exam.exam_id.desc())
        .all()
    )

    return [
        serialize_exam(
            exam,
            current_user.user_id,
        )
        for exam in exams
    ]


@router.get(
    "/{exam_id}",
    response_model=ExamResponse,
)
def get_exam(
    exam_id: int,
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

    return serialize_exam(
        exam,
        current_user.user_id,
    )


@router.put(
    "/update/{exam_id}",
    response_model=ExamResponse,
)
def update_exam(
    exam_id: int,
    data: ExamUpdate,
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

    if exam.status not in {"draft", "published"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only draft or published exams can be edited"
            ),
        )

    duplicate = (
        db.query(Exam)
        .filter(
            Exam.created_by == current_user.user_id,
            Exam.exam_name.ilike(data.exam_name),
            Exam.exam_id != exam_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "You already have another exam "
                "with this name"
            ),
        )

    apply_exam_data(exam, data)

    db.commit()
    db.refresh(exam)

    return serialize_exam(
        exam,
        current_user.user_id,
    )


@router.patch(
    "/{exam_id}/status",
    response_model=ExamResponse,
)
def update_exam_status(
    exam_id: int,
    data: ExamStatusUpdate,
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

    if data.status == "published":
        section_count = (
            db.query(ExamSection)
            .filter(ExamSection.exam_id == exam_id)
            .count()
        )

        question_count = (
            db.query(ExamQuestion)
            .filter(ExamQuestion.exam_id == exam_id)
            .count()
        )

        if section_count == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Add at least one section "
                    "before publishing the exam"
                ),
            )

        if question_count == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Add at least one question "
                    "before publishing the exam"
                ),
            )

    exam.status = data.status

    db.commit()
    db.refresh(exam)

    return serialize_exam(
        exam,
        current_user.user_id,
    )


@router.delete("/delete/{exam_id}")
def delete_exam(
    exam_id: int,
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

    assignment_count = (
        db.query(StudentExam)
        .filter(StudentExam.exam_id == exam_id)
        .count()
    )

    if assignment_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "An assigned exam cannot be deleted"
            ),
        )

    if exam.status not in {"draft", "cancelled"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only draft or cancelled exams "
                "can be deleted"
            ),
        )

    db.delete(exam)
    db.commit()

    return {
        "message": "Exam deleted successfully",
    }