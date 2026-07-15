from pydantic import BaseModel


class LibraryMemberAdd(BaseModel):
    examiner_id: int
    permission: str = "editor"