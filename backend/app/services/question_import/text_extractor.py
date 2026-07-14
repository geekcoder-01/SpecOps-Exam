from pathlib import Path

from docx import Document
from PIL import Image
from pypdf import PdfReader
import pytesseract


SUPPORTED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


class TextExtractionError(Exception):
    """Raised when text cannot be extracted from an uploaded file."""


def extract_text(file_path: str) -> str:
    path = Path(file_path)

    if not path.exists():
        raise TextExtractionError("Uploaded source file was not found")

    extension = path.suffix.lower()

    if extension == ".pdf":
        text = extract_pdf_text(path)

    elif extension == ".docx":
        text = extract_docx_text(path)

    elif extension in SUPPORTED_IMAGE_EXTENSIONS:
        text = extract_image_text(path)

    elif extension == ".doc":
        raise TextExtractionError(
            "Legacy DOC processing is not available yet. "
            "Please convert the file to DOCX and upload it again."
        )

    else:
        raise TextExtractionError(
            f"Unsupported file format: {extension}"
        )

    cleaned_text = clean_extracted_text(text)

    if not cleaned_text:
        raise TextExtractionError(
            "No readable text could be extracted from the file"
        )

    return cleaned_text


def extract_pdf_text(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
    except Exception as error:
        raise TextExtractionError(
            f"Unable to open the PDF file: {error}"
        ) from error

    extracted_pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception as error:
            raise TextExtractionError(
                f"Unable to read PDF page {page_number}: {error}"
            ) from error

        if page_text.strip():
            extracted_pages.append(page_text)

    if not extracted_pages:
        raise TextExtractionError(
            "The PDF does not contain extractable text. "
            "It may be scanned and will require OCR."
        )

    return "\n\n".join(extracted_pages)


def extract_docx_text(path: Path) -> str:
    try:
        document = Document(str(path))
    except Exception as error:
        raise TextExtractionError(
            f"Unable to open the Word document: {error}"
        ) from error

    extracted_parts = []

    for paragraph in document.paragraphs:
        paragraph_text = paragraph.text.strip()

        if paragraph_text:
            extracted_parts.append(paragraph_text)

    for table in document.tables:
        for row in table.rows:
            row_values = []

            for cell in row.cells:
                cell_text = cell.text.strip()

                if cell_text:
                    row_values.append(cell_text)

            if row_values:
                extracted_parts.append(" | ".join(row_values))

    return "\n".join(extracted_parts)


def extract_image_text(path: Path) -> str:
    try:
        with Image.open(path) as image:
            return pytesseract.image_to_string(image)
    except pytesseract.TesseractNotFoundError as error:
        raise TextExtractionError(
            "Tesseract OCR is not installed or cannot be found"
        ) from error
    except Exception as error:
        raise TextExtractionError(
            f"Unable to process the image: {error}"
        ) from error


def clean_extracted_text(text: str) -> str:
    lines = []

    for line in text.replace("\r\n", "\n").split("\n"):
        cleaned_line = " ".join(line.split())

        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines).strip()