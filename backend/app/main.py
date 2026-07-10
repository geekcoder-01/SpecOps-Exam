from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base
from app.database import engine

# Models
from app.models.user import User
from app.models.question import Question
from app.models.exam import Exam
from app.models.exam_session import ExamSession
from app.models.answer import Answer
from app.models.result import Result
from app.models.exam_question import ExamQuestion
from app.models.student_exam import StudentExam
from app.models.question_bank_set import QuestionBankSet
from app.models.exam_section import ExamSection
from app.models.question_library_subject import QuestionLibrarySubject


# Routes
from app.routes import auth
from app.routes import question
from app.routes import exam
from app.routes import user
from app.routes import student_exam
from app.routes import exam_question
from app.routes import question_bank_set
from app.routes import profile
from app.routes import question_library_subject

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpecOps Exam API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    question.router,
    prefix="/question",
    tags=["Question Bank"]
)

app.include_router(
    exam.router,
    prefix="/exam",
    tags=["Exam Management"]
)

app.include_router(
    student_exam.router,
    prefix="/student-exam",
    tags=["Student Exam Assignment"]
)

app.include_router(
    user.router,
    prefix="/users",
    tags=["Users"]
)

app.include_router(
    exam_question.router,
    prefix="/exam-question",
    tags=["Exam Questions"]
)

app.include_router(
    question_bank_set.router,
    prefix="/question-libraries",
    tags=["Question Libraries"]
)

app.include_router(profile.router)

app.include_router(
    question_library_subject.router,
    prefix="/question-libraries",
    tags=["Question Library Subjects"]
)

@app.get("/")
def home():
    return {
        "message": "SpecOps Exam Backend Running"
    }