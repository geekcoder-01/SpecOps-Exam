"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaPlus,
  FaSave,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import api from "@/services/api";
import QuestionBasicInfo from "./QuestionBasicInfo";
import MCQForm from "./MCQForm";
import TrueFalseForm from "./TrueFalseForm";
import ShortAnswerForm from "./ShortAnswerForm";
import LongAnswerForm from "./LongAnswerForm";
import NumericalForm from "./NumericalForm";
import ImageUploadForm from "./ImageUploadForm";
import QuestionPreview from "./QuestionPreview";

const initialForm = {
  library_subject_id: "",
  question_type: "mcq",
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "",
  multiple_answers: [],
  marks: 1,
  difficulty_level: "Easy",
};

export default function QuestionBuilder({
  bankId,
  library,
  subjects,
}) {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const selectedSubject = subjects.find(
    (subject) =>
      String(subject.library_subject_id) ===
      String(form.library_subject_id)
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetTypeSpecificFields = (questionType) => {
    setForm((previous) => ({
      ...previous,
      question_type: questionType,
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "",
      multiple_answers: [],
    }));
  };

  const validateForm = () => {
    if (!form.library_subject_id) {
      toast.error("Select a library subject");
      return false;
    }

    if (!form.question_text.trim()) {
      toast.error("Enter the question text");
      return false;
    }

    if (Number(form.marks) < 1) {
      toast.error("Marks must be at least 1");
      return false;
    }

    if (
      form.question_type === "mcq" ||
      form.question_type === "multi_select"
    ) {
      const options = [
        form.option_a,
        form.option_b,
        form.option_c,
        form.option_d,
      ];

      if (options.some((option) => !option.trim())) {
        toast.error("Enter all four options");
        return false;
      }
    }

    if (
      form.question_type === "mcq" &&
      !form.correct_answer
    ) {
      toast.error("Select the correct option");
      return false;
    }

    if (
      form.question_type === "multi_select" &&
      form.multiple_answers.length === 0
    ) {
      toast.error("Select at least one correct option");
      return false;
    }

    if (
      [
        "true_false",
        "fill_blank",
        "numerical",
        "short_answer",
        "long_answer",
      ].includes(form.question_type) &&
      !form.correct_answer.trim()
    ) {
      toast.error("Enter the correct or model answer");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    let correctAnswer = form.correct_answer;

    if (form.question_type === "multi_select") {
      correctAnswer = form.multiple_answers.join(",");
    }

    return {
      bank_id: bankId,
      library_subject_id: Number(form.library_subject_id),
      question_text: form.question_text.trim(),
      question_type: form.question_type,

      option_a:
        form.option_a.trim() || null,
      option_b:
        form.option_b.trim() || null,
      option_c:
        form.option_c.trim() || null,
      option_d:
        form.option_d.trim() || null,

      correct_answer:
        correctAnswer?.trim() || null,

      marks: Number(form.marks),
      difficulty_level: form.difficulty_level,
      subject: selectedSubject?.subject_name || library.subject,
    };
  };

  const saveQuestion = async (addAnother = false) => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      await api.post(
        "/question/add-question",
        buildPayload(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Question saved successfully");

      if (addAnother) {
        setForm((previous) => ({
          ...initialForm,
          library_subject_id: previous.library_subject_id,
          question_type: previous.question_type,
          difficulty_level: previous.difficulty_level,
          marks: previous.marks,
        }));
      } else {
        setTimeout(() => {
          router.push(`/examiner/questions/${bankId}`);
        }, 700);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to save question"
      );
    } finally {
      setSaving(false);
    }
  };

  const renderTypeForm = () => {
    switch (form.question_type) {
      case "mcq":
      case "multi_select":
        return (
          <MCQForm
            form={form}
            handleChange={handleChange}
            updateField={updateField}
          />
        );

      case "true_false":
        return (
          <TrueFalseForm
            form={form}
            updateField={updateField}
          />
        );

      case "fill_blank":
      case "short_answer":
        return (
          <ShortAnswerForm
            form={form}
            handleChange={handleChange}
          />
        );

      case "long_answer":
        return (
          <LongAnswerForm
            form={form}
            handleChange={handleChange}
          />
        );

      case "numerical":
        return (
          <NumericalForm
            form={form}
            handleChange={handleChange}
          />
        );

      case "image_upload":
      case "file_upload":
        return (
          <ImageUploadForm
            questionType={form.question_type}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Toaster position="top-right" />

      <button
        type="button"
        onClick={() =>
          router.push(`/examiner/questions/${bankId}`)
        }
        className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <FaArrowLeft />
        Back to Library
      </button>

      <div className="mb-8">
        <p className="text-sm text-purple-400">
          {library.title}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Create Question
        </h1>

        <p className="mt-2 text-slate-400">
          Create a question and preview how it will appear to students.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8">
          <h2 className="text-xl font-bold text-yellow-200">
            No library subject available
          </h2>

          <p className="mt-2 text-yellow-100/70">
            Return to the library Overview tab and add at least one
            subject before creating questions.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1fr_430px]">
          <section className="space-y-6">
            <QuestionBasicInfo
              form={form}
              subjects={subjects}
              handleChange={handleChange}
              onQuestionTypeChange={resetTypeSpecificFields}
            />

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Question
                </span>

                <textarea
                  name="question_text"
                  value={form.question_text}
                  onChange={handleChange}
                  placeholder="Enter the complete question..."
                  className="min-h-36 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none transition focus:border-purple-500"
                />
              </label>

              <div className="mt-6">
                {renderTypeForm()}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveQuestion(false)}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                <FaSave />
                {saving ? "Saving..." : "Save Question"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => saveQuestion(true)}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-60"
              >
                <FaPlus />
                Save and Add Another
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(`/examiner/questions/${bankId}`)
                }
                className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
          </section>

          <QuestionPreview
            form={form}
            subject={selectedSubject?.subject_name}
          />
        </div>
      )}
    </div>
  );
}