"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaBookOpen,
  FaEdit,
  FaLayerGroup,
  FaPlus,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

const emptySectionForm = {
  section_title: "",
  bank_id: "",
  library_subject_id: "",
  section_order: 1,
  question_limit: 0,
  total_marks: 0,
  negative_marks: 0,
  randomize_questions: false,
};

export default function ExamBuilderPage({ params }) {
  const { examId } = use(params);

  const numericExamId = Number(examId);

  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [librarySubjects, setLibrarySubjects] =
    useState([]);

  const [form, setForm] = useState(
    emptySectionForm
  );

  const [editingSectionId, setEditingSectionId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] =
    useState(false);
  const [savingSection, setSavingSection] =
    useState(false);
  const [processingSectionId, setProcessingSectionId] =
    useState(null);

  useEffect(() => {
    loadBuilder();
  }, [examId]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const handleApiError = (
    error,
    fallbackMessage
  ) => {
    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      handleUnauthorized();
      return;
    }

    toast.error(
      error.response?.data?.detail ||
        fallbackMessage
    );
  };

  const loadBuilder = async () => {
    try {
      setLoading(true);

      const [
        examResponse,
        sectionsResponse,
        librariesResponse,
      ] = await Promise.all([
        api.get(`/exam/${numericExamId}`, {
          headers: getHeaders(),
        }),

        api.get(
          `/exam-sections/exam/${numericExamId}`,
          {
            headers: getHeaders(),
          }
        ),

        api.get("/question-libraries/all", {
          headers: getHeaders(),
        }),
      ]);

      setExam(examResponse.data);
      setSections(sectionsResponse.data);
      setLibraries(librariesResponse.data);
    } catch (error) {
      handleApiError(
        error,
        "Unable to load the Exam Builder"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLibrarySubjects = async (
    bankId,
    selectedSubjectId = ""
  ) => {
    if (!bankId) {
      setLibrarySubjects([]);

      setForm((previous) => ({
        ...previous,
        bank_id: "",
        library_subject_id: "",
      }));

      return;
    }

    try {
      setLoadingSubjects(true);

      const response = await api.get(
        `/question-libraries/${bankId}/subjects`,
        {
          headers: getHeaders(),
        }
      );

      setLibrarySubjects(response.data);

      setForm((previous) => ({
        ...previous,
        bank_id: String(bankId),
        library_subject_id: selectedSubjectId
          ? String(selectedSubjectId)
          : "",
      }));
    } catch (error) {
      handleApiError(
        error,
        "Unable to load library subjects"
      );
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    if (name === "bank_id") {
      loadLibrarySubjects(value);
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const resetSectionForm = () => {
    setForm({
      ...emptySectionForm,
      section_order: sections.length + 1,
    });

    setLibrarySubjects([]);
    setEditingSectionId(null);
  };

  const validateSectionForm = () => {
    if (!form.section_title.trim()) {
      toast.error("Enter a section title");
      return false;
    }

    if (!form.bank_id) {
      toast.error("Select a question library");
      return false;
    }

    if (!form.library_subject_id) {
      toast.error("Select a library subject");
      return false;
    }

    if (Number(form.section_order) < 1) {
      toast.error(
        "Section order must be at least 1"
      );
      return false;
    }

    return true;
  };

  const saveSection = async (event) => {
    event.preventDefault();

    if (!validateSectionForm()) {
      return;
    }

    const payload = {
      section_title:
        form.section_title.trim(),

      bank_id: Number(form.bank_id),

      library_subject_id: Number(
        form.library_subject_id
      ),

      section_order: Number(
        form.section_order
      ),

      question_limit: Number(
        form.question_limit
      ),

      total_marks: Number(
        form.total_marks
      ),

      negative_marks: Number(
        form.negative_marks
      ),

      randomize_questions:
        form.randomize_questions,
    };

    try {
      setSavingSection(true);

      if (editingSectionId) {
        await api.put(
          `/exam-sections/${editingSectionId}`,
          payload,
          {
            headers: getHeaders(),
          }
        );

        toast.success(
          "Exam section updated successfully"
        );
      } else {
        await api.post(
          `/exam-sections/exam/${numericExamId}`,
          payload,
          {
            headers: getHeaders(),
          }
        );

        toast.success(
          "Exam section added successfully"
        );
      }

      resetSectionForm();
      await loadBuilder();
    } catch (error) {
      handleApiError(
        error,
        editingSectionId
          ? "Unable to update the section"
          : "Unable to add the section"
      );
    } finally {
      setSavingSection(false);
    }
  };

  const startEditingSection = async (
    section
  ) => {
    setEditingSectionId(section.section_id);

    setForm({
      section_title: section.section_title,
      bank_id: String(
        section.bank_id || ""
      ),
      library_subject_id: String(
        section.library_subject_id || ""
      ),
      section_order: section.section_order,
      question_limit:
        section.question_limit,
      total_marks: section.total_marks,
      negative_marks:
        section.negative_marks,
      randomize_questions:
        section.randomize_questions,
    });

    await loadLibrarySubjects(
      section.bank_id,
      section.library_subject_id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteSection = async (section) => {
    const confirmed = window.confirm(
      `Delete the section "${section.section_title}"?\n\nA section containing assigned questions cannot be deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingSectionId(
        section.section_id
      );

      await api.delete(
        `/exam-sections/${section.section_id}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success(
        "Exam section deleted successfully"
      );

      if (
        editingSectionId ===
        section.section_id
      ) {
        resetSectionForm();
      }

      await loadBuilder();
    } catch (error) {
      handleApiError(
        error,
        "Unable to delete the section"
      );
    } finally {
      setProcessingSectionId(null);
    }
  };

  const statistics = useMemo(() => {
    return sections.reduce(
      (result, section) => {
        result.sections += 1;
        result.questions +=
          section.question_count || 0;
        result.totalMarks += Number(
          section.total_marks || 0
        );
        result.questionLimit += Number(
          section.question_limit || 0
        );

        return result;
      },
      {
        sections: 0,
        questions: 0,
        totalMarks: 0,
        questionLimit: 0,
      }
    );
  }, [sections]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading Exam Builder...
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Exam not found.
      </main>
    );
  }

  const editable =
    exam.status === "draft";

  return (
    <DashboardLayout
      role="Examiner"
      title="Exam Builder"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <Link
          href="/examiner/exams"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <FaArrowLeft />
          Back to Exams
        </Link>

        <ExamHeader
          exam={exam}
          statistics={statistics}
        />

        {!editable && (
          <div className="mt-7 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
            This exam is currently{" "}
            <strong>{exam.status}</strong>.
            Sections can only be changed while the exam is
            in draft status.
          </div>
        )}

        <div className="mt-7 grid gap-7 xl:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 xl:sticky xl:top-28">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl text-purple-300">
                {editingSectionId ? (
                  <FaEdit />
                ) : (
                  <FaPlus />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {editingSectionId
                    ? "Edit Section"
                    : "Add Section"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Connect this section to one subject in an
                  accessible question library.
                </p>
              </div>
            </div>

            <form
              onSubmit={saveSection}
              className="mt-7 space-y-5"
            >
              <InputField
                label="Section Title"
                name="section_title"
                value={form.section_title}
                onChange={handleChange}
                placeholder="Example: Mathematics"
                disabled={!editable}
              />

              <SelectField
                label="Question Library"
                name="bank_id"
                value={form.bank_id}
                onChange={handleChange}
                disabled={!editable}
              >
                <option value="">
                  Select question library
                </option>

                {libraries.map((library) => (
                  <option
                    key={library.bank_id}
                    value={library.bank_id}
                  >
                    {library.title}
                    {library.is_owner
                      ? " (Owned)"
                      : " (Shared)"}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Library Subject"
                name="library_subject_id"
                value={form.library_subject_id}
                onChange={handleChange}
                disabled={
                  !editable ||
                  !form.bank_id ||
                  loadingSubjects
                }
              >
                <option value="">
                  {loadingSubjects
                    ? "Loading subjects..."
                    : "Select library subject"}
                </option>

                {librarySubjects.map((subject) => (
                  <option
                    key={
                      subject.library_subject_id
                    }
                    value={
                      subject.library_subject_id
                    }
                  >
                    {subject.subject_name} (
                    {subject.question_count || 0}{" "}
                    questions)
                  </option>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Section Order"
                  name="section_order"
                  type="number"
                  min="1"
                  value={form.section_order}
                  onChange={handleChange}
                  disabled={!editable}
                />

                <InputField
                  label="Question Limit"
                  name="question_limit"
                  type="number"
                  min="0"
                  value={form.question_limit}
                  onChange={handleChange}
                  disabled={!editable}
                />

                <InputField
                  label="Total Marks"
                  name="total_marks"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.total_marks}
                  onChange={handleChange}
                  disabled={!editable}
                />

                <InputField
                  label="Negative Marks"
                  name="negative_marks"
                  type="number"
                  min="0"
                  step="0.25"
                  value={form.negative_marks}
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              <ToggleField
                label="Randomize Questions"
                name="randomize_questions"
                checked={
                  form.randomize_questions
                }
                onChange={handleChange}
                disabled={!editable}
              />

              {editable && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingSection}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaSave />

                    {savingSection
                      ? "Saving..."
                      : editingSectionId
                      ? "Update Section"
                      : "Add Section"}
                  </button>

                  {editingSectionId && (
                    <button
                      type="button"
                      onClick={resetSectionForm}
                      disabled={savingSection}
                      className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <h2 className="text-2xl font-bold">
                Exam Sections
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Students will be able to switch between
                these subject-wise sections during the exam.
              </p>
            </div>

            {sections.length === 0 ? (
              <EmptySections />
            ) : (
              <div className="mt-6 space-y-4">
                {sections.map((section) => (
                  <SectionCard
                    key={section.section_id}
                    section={section}
                    editable={editable}
                    processing={
                      processingSectionId ===
                      section.section_id
                    }
                    onEdit={() =>
                      startEditingSection(section)
                    }
                    onDelete={() =>
                      deleteSection(section)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExamHeader({ exam, statistics }) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge
              text={exam.status}
              color={
                exam.status === "draft"
                  ? "orange"
                  : exam.status === "published"
                  ? "blue"
                  : "green"
              }
            />

            <Badge
              text={exam.exam_type}
              color="purple"
            />
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            {exam.exam_name}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            {exam.instructions ||
              "No exam instructions have been added."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryItem
            label="Sections"
            value={statistics.sections}
          />

          <SummaryItem
            label="Questions"
            value={statistics.questions}
          />

          <SummaryItem
            label="Limit"
            value={statistics.questionLimit}
          />

          <SummaryItem
            label="Marks"
            value={statistics.totalMarks}
          />
        </div>
      </div>
    </section>
  );
}

function SectionCard({
  section,
  editable,
  processing,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl text-purple-300">
            <FaLayerGroup />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold">
                {section.section_order}.{" "}
                {section.section_title}
              </h3>

              <Badge
                text={section.subject}
                color="blue"
              />
            </div>

            <p className="mt-2 text-sm text-slate-400">
              <FaBookOpen className="mr-2 inline" />
              {section.library_title ||
                "Question Library"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                text={`${section.question_count || 0} Assigned`}
                color="green"
              />

              <Badge
                text={
                  section.question_limit > 0
                    ? `${section.question_limit} Question Limit`
                    : "No Question Limit"
                }
                color="purple"
              />

              <Badge
                text={`${section.total_marks || 0} Marks`}
                color="orange"
              />

              <Badge
                text={`${section.negative_marks || 0} Negative`}
                color="red"
              />

              {section.randomize_questions && (
                <Badge
                  text="Randomized"
                  color="blue"
                />
              )}
            </div>
          </div>
        </div>

        {editable && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={processing}
              title="Edit section"
              className="rounded-xl border border-blue-500/30 p-3 text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-50"
            >
              <FaEdit />
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={processing}
              title="Delete section"
              className="rounded-xl border border-red-500/30 p-3 text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <button
          type="button"
          disabled
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-500"
        >
          Manage Questions — Next Step
        </button>
      </div>
    </article>
  );
}

function EmptySections() {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-12 text-center">
      <FaLayerGroup className="mx-auto text-5xl text-purple-400" />

      <h3 className="mt-5 text-2xl font-bold">
        No sections added yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-slate-400">
        Add one section for a regular subject exam or
        multiple sections for entrance, competitive, and
        placement examinations.
      </p>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type={type}
        name={name}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  disabled,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  name,
  checked,
  onChange,
  disabled,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
      <span className="text-sm font-medium text-slate-200">
        {label}
      </span>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-5 w-5 accent-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Badge({ text, color }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-300",
    purple:
      "bg-purple-500/15 text-purple-300",
    green: "bg-green-500/15 text-green-300",
    orange:
      "bg-orange-500/15 text-orange-300",
    red: "bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[color] || styles.blue
      }`}
    >
      {text}
    </span>
  );
}