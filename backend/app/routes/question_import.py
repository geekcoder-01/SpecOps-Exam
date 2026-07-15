import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.draft_question import DraftQuestion
from app.models.question_bank_set import QuestionBankSet
from app.models.question_import import QuestionImport
from app.models.question_library_subject import QuestionLibrarySubject
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.question_import import (
    QuestionImportProcessResponse,
    QuestionImportResponse,
)
from app.services.question_import.question_parser import (
    parse_questions,
)
from app.services.question_import.text_extractor import (
    TextExtractionError,
    extract_text,
)

router = APIRouter()


UPLOAD_DIRECTORY = Path("uploads/question-imports")

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def get_import_or_404(
    import_id: int,
    db: Session,
) -> QuestionImport:
    import_job = (
        db.query(QuestionImport)
        .filter(QuestionImport.import_id == import_id)
        .first()
    )

    if not import_job:
        raise HTTPException(
            status_code=404,
            detail="Question import job not found",
        )

    return import_job


def verify_import_owner(
    import_job: QuestionImport,
    current_user: User,
):
    if import_job.created_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another examiner's import",
        )


def get_library_and_subject(
    bank_id: int,
    library_subject_id: int,
    db: Session,
):
    library = (
        db.query(QuestionBankSet)
        .filter(QuestionBankSet.bank_id == bank_id)
        .first()
    )

    if not library:
        raise HTTPException(
            status_code=404,
            detail="Question library not found",
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
                "to this question library"
            ),
        )

    return library, subject


def validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was selected",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. Allowed formats: "
                "PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP"
            ),
        )

    return extension


@router.post(
    "/upload",
    response_model=QuestionImportResponse,
    status_code=201,
)
def upload_question_file(
    bank_id: int = Form(...),
    library_subject_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    get_library_and_subject(
        bank_id=bank_id,
        library_subject_id=library_subject_id,
        db=db,
    )

    extension = validate_file(file)

    UPLOAD_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    stored_filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIRECTORY / stored_filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = destination.stat().st_size

        if file_size == 0:
            destination.unlink(missing_ok=True)

            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty",
            )

        if file_size > MAX_FILE_SIZE:
            destination.unlink(missing_ok=True)

            raise HTTPException(
                status_code=400,
                detail="File size must not exceed 20 MB",
            )

        import_job = QuestionImport(
            bank_id=bank_id,
            library_subject_id=library_subject_id,
            created_by=current_user.user_id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_type=extension.removeprefix("."),
            file_path=str(destination),
            file_size=file_size,
            status="uploaded",
            error_message=None,
            extracted_text=None,
        )

        db.add(import_job)
        db.commit()
        db.refresh(import_job)

        return import_job

    except HTTPException:
        raise

    except Exception as error:
        destination.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Unable to upload file: {str(error)}",
        ) from error

    finally:
        file.file.close()


@router.get(
    "/library/{bank_id}",
    response_model=list[QuestionImportResponse],
)
def get_library_imports(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    library = (
        db.query(QuestionBankSet)
        .filter(QuestionBankSet.bank_id == bank_id)
        .first()
    )

    if not library:
        raise HTTPException(
            status_code=404,
            detail="Question library not found",
        )

    return (
        db.query(QuestionImport)
        .filter(
            QuestionImport.bank_id == bank_id,
            QuestionImport.created_by == current_user.user_id,
        )
        .order_by(QuestionImport.import_id.desc())
        .all()
    )


@router.get(
    "/{import_id}",
    response_model=QuestionImportResponse,
)
def get_import_job(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    import_job = get_import_or_404(import_id, db)

    verify_import_owner(
        import_job=import_job,
        current_user=current_user,
    )

    return import_job


@router.post(
    "/{import_id}/process",
    response_model=QuestionImportProcessResponse,
)
def process_question_import(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    import_job = get_import_or_404(import_id, db)

    verify_import_owner(
        import_job=import_job,
        current_user=current_user,
    )

    get_library_and_subject(
        bank_id=import_job.bank_id,
        library_subject_id=import_job.library_subject_id,
        db=db,
    )

    if import_job.status == "processing":
        raise HTTPException(
            status_code=400,
            detail="This import is already being processed",
        )

    import_job.status = "processing"
    import_job.error_message = None

    db.commit()
    db.refresh(import_job)

    try:
        extracted_text = extract_text(import_job.file_path)

        parsed_questions = parse_questions(extracted_text)

        if not parsed_questions:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Text was extracted, but no recognizable "
                    "questions were found"
                ),
            )

        # Remove old pending/rejected drafts before reprocessing.
        db.query(DraftQuestion).filter(
            DraftQuestion.import_id == import_job.import_id,
            DraftQuestion.status.in_(["pending", "rejected"]),
        ).delete(
            synchronize_session=False,
        )

        drafts_created = 0

        for parsed in parsed_questions:
            draft = DraftQuestion(
                bank_id=import_job.bank_id,
                library_subject_id=import_job.library_subject_id,
                import_id=import_job.import_id,
                created_by=current_user.user_id,
                source_type="import",
                question_text=parsed.question_text,
                question_type=parsed.question_type,
                option_a=parsed.option_a,
                option_b=parsed.option_b,
                option_c=parsed.option_c,
                option_d=parsed.option_d,
                correct_answer=parsed.correct_answer,
                marks=parsed.marks,
                difficulty_level=parsed.difficulty_level,
                status="pending",
                confidence_score=parsed.confidence_score,
                review_notes=None,
            )

            db.add(draft)
            drafts_created += 1

        import_job.extracted_text = extracted_text
        import_job.status = "completed"
        import_job.error_message = None

        db.commit()
        db.refresh(import_job)

        return {
            "message": (
                "Question file processed successfully. "
                "Draft questions are ready for review."
            ),
            "import_id": import_job.import_id,
            "status": import_job.status,
            "drafts_created": drafts_created,
            "extracted_text_length": len(extracted_text),
        }

    except TextExtractionError as error:
        db.rollback()

        import_job = get_import_or_404(import_id, db)
        import_job.status = "failed"
        import_job.error_message = str(error)

        db.commit()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except HTTPException as error:
        db.rollback()

        import_job = get_import_or_404(import_id, db)
        import_job.status = "failed"
        import_job.error_message = str(error.detail)

        db.commit()

        raise

    except Exception as error:
        db.rollback()

        import_job = get_import_or_404(import_id, db)
        import_job.status = "failed"
        import_job.error_message = str(error)

        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while processing the question file",
        ) from error


@router.delete("/{import_id}")
def delete_import_job(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    import_job = get_import_or_404(import_id, db)

    verify_import_owner(
        import_job=import_job,
        current_user=current_user,
    )

    if import_job.status == "processing":
        raise HTTPException(
            status_code=400,
            detail="A processing import cannot be deleted",
        )

    approved_draft_count = (
        db.query(DraftQuestion)
        .filter(
            DraftQuestion.import_id == import_id,
            DraftQuestion.status == "approved",
        )
        .count()
    )

    if approved_draft_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "This import contains approved questions "
                "and cannot be deleted"
            ),
        )

    db.query(DraftQuestion).filter(
        DraftQuestion.import_id == import_id
    ).delete(
        synchronize_session=False,
    )

    file_path = Path(import_job.file_path)

    if file_path.exists():
        file_path.unlink()

    db.delete(import_job)
    db.commit()

    return {
        "message": "Question import deleted successfully",
    }