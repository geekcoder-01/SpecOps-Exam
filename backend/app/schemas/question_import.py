from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QuestionImportResponse(BaseModel):
    import_id: int
    bank_id: int
    library_subject_id: int
    created_by: int

    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int

    status: str
    error_message: Optional[str] = None
    extracted_text: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True