import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedQuestion:
    question_text: str
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int = 1
    difficulty_level: str = "Medium"
    confidence_score: int = 60


QUESTION_START_PATTERN = re.compile(
    r"^\s*(?:Q(?:uestion)?\s*)?(\d+)[\.\)\:\-]\s*(.+)$",
    re.IGNORECASE,
)

OPTION_PATTERN = re.compile(
    r"^\s*[\(\[]?([A-Da-d])[\)\]\.\:\-]\s*(.+)$"
)

ANSWER_PATTERN = re.compile(
    r"^\s*(?:answer|ans|correct\s*answer)\s*[:\-]\s*(.+)$",
    re.IGNORECASE,
)

MARKS_PATTERN = re.compile(
    r"(?:marks?|points?)\s*[:\-]?\s*(\d+)",
    re.IGNORECASE,
)


def parse_questions(extracted_text: str) -> list[ParsedQuestion]:
    if not extracted_text or not extracted_text.strip():
        return []

    lines = normalize_lines(extracted_text)

    question_blocks = split_question_blocks(lines)

    parsed_questions = []

    for block in question_blocks:
        parsed_question = parse_question_block(block)

        if parsed_question:
            parsed_questions.append(parsed_question)

    return parsed_questions


def normalize_lines(text: str) -> list[str]:
    normalized_text = text.replace("\r\n", "\n").replace("\r", "\n")

    lines = []

    for raw_line in normalized_text.split("\n"):
        cleaned_line = " ".join(raw_line.strip().split())

        if cleaned_line:
            lines.append(cleaned_line)

    return lines


def split_question_blocks(lines: list[str]) -> list[list[str]]:
    blocks = []
    current_block = []

    for line in lines:
        question_match = QUESTION_START_PATTERN.match(line)

        if question_match:
            if current_block:
                blocks.append(current_block)

            current_block = [question_match.group(2).strip()]
        else:
            if current_block:
                current_block.append(line)

    if current_block:
        blocks.append(current_block)

    # If numbering was not detected, try paragraph-based parsing.
    if not blocks and lines:
        blocks = split_unnumbered_questions(lines)

    return blocks


def split_unnumbered_questions(
    lines: list[str],
) -> list[list[str]]:
    blocks = []
    current_block = []

    for line in lines:
        starts_like_question = (
            line.endswith("?")
            or line.lower().startswith(
                (
                    "what ",
                    "why ",
                    "how ",
                    "when ",
                    "where ",
                    "who ",
                    "which ",
                    "define ",
                    "explain ",
                    "describe ",
                    "calculate ",
                    "solve ",
                    "find ",
                    "write ",
                    "state ",
                )
            )
        )

        if starts_like_question and current_block:
            blocks.append(current_block)
            current_block = [line]
        else:
            current_block.append(line)

    if current_block:
        blocks.append(current_block)

    return blocks


def parse_question_block(
    block: list[str],
) -> Optional[ParsedQuestion]:
    if not block:
        return None

    question_lines = []
    options = {}
    answer = None
    marks = 1

    for line in block:
        option_match = OPTION_PATTERN.match(line)

        if option_match:
            option_key = option_match.group(1).upper()
            option_value = option_match.group(2).strip()

            options[option_key] = option_value
            continue

        answer_match = ANSWER_PATTERN.match(line)

        if answer_match:
            answer = normalize_answer(
                answer_match.group(1).strip()
            )
            continue

        marks_match = MARKS_PATTERN.search(line)

        if marks_match:
            marks = max(1, int(marks_match.group(1)))

            cleaned_line = MARKS_PATTERN.sub("", line).strip(
                " [](){}-:"
            )

            if cleaned_line:
                question_lines.append(cleaned_line)

            continue

        question_lines.append(line)

    question_text = clean_question_text(question_lines)

    if not question_text:
        return None

    question_type = detect_question_type(
        question_text=question_text,
        options=options,
        answer=answer,
    )

    confidence_score = calculate_confidence(
        question_type=question_type,
        options=options,
        answer=answer,
    )

    return ParsedQuestion(
        question_text=question_text,
        question_type=question_type,
        option_a=options.get("A"),
        option_b=options.get("B"),
        option_c=options.get("C"),
        option_d=options.get("D"),
        correct_answer=answer,
        marks=marks,
        difficulty_level="Medium",
        confidence_score=confidence_score,
    )


def detect_question_type(
    question_text: str,
    options: dict[str, str],
    answer: Optional[str],
) -> str:
    lower_question = question_text.lower().strip()

    if len(options) >= 2:
        if answer and "," in answer:
            return "multi_select"

        return "mcq"

    if answer and answer.lower() in {"true", "false"}:
        return "true_false"

    if "____" in question_text or "blank" in lower_question:
        return "fill_blank"

    if lower_question.startswith(
        (
            "calculate",
            "solve",
            "find the value",
            "find value",
            "evaluate",
        )
    ):
        return "numerical"

    if lower_question.startswith(
        (
            "explain",
            "describe",
            "discuss",
            "compare",
            "elaborate",
            "write an essay",
        )
    ):
        return "long_answer"

    if lower_question.startswith(
        (
            "define",
            "state",
            "name",
            "list",
            "what is",
            "who is",
            "when is",
            "where is",
        )
    ):
        return "short_answer"

    return "short_answer"


def normalize_answer(answer: str) -> str:
    cleaned_answer = answer.strip()

    option_match = re.match(
        r"^[\(\[]?([A-Da-d])[\)\]\.\s]*$",
        cleaned_answer,
    )

    if option_match:
        return option_match.group(1).upper()

    multiple_options = re.findall(
        r"\b([A-Da-d])\b",
        cleaned_answer,
    )

    if len(multiple_options) > 1:
        unique_answers = []

        for option in multiple_options:
            normalized = option.upper()

            if normalized not in unique_answers:
                unique_answers.append(normalized)

        return ",".join(unique_answers)

    if cleaned_answer.lower() == "true":
        return "True"

    if cleaned_answer.lower() == "false":
        return "False"

    return cleaned_answer


def clean_question_text(lines: list[str]) -> str:
    if not lines:
        return ""

    text = " ".join(lines).strip()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text


def calculate_confidence(
    question_type: str,
    options: dict[str, str],
    answer: Optional[str],
) -> int:
    confidence = 50

    if question_type in {
        "mcq",
        "multi_select",
    }:
        confidence += min(len(options), 4) * 8

        if answer:
            confidence += 15

    elif question_type == "true_false":
        confidence += 30

    elif answer:
        confidence += 15

    return min(confidence, 100)