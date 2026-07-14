"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaEdit,
  FaFilter,
  FaRobot,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "@/services/api";

const QUESTION_TYPES = [
  { value: "mcq", label: "Single Correct MCQ" },
  { value: "multi_select", label: "Multiple Correct MCQ" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "numerical", label: "Numerical Answer" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "image_upload", label: "Image Upload Answer" },
  { value: "file_upload", label: "File Upload Answer" },
];

const emptyEditForm = {
  question_text: "",
  question_type: "mcq",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "",
  marks: 1,
  difficulty_level: "Medium",
  confidence_score: "",
  review_notes: "",
};

export default function ReviewQueue({
  bankId,
  subjects,
  onApproved,
}) {
  const [drafts, setDrafts] = useState([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [editingDraft, setEditingDraft] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, [bankId, status]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loadDrafts = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/draft-questions/library/${bankId}`,
        {
          params: {
            status,
          },
          headers: getHeaders(),
        }
      );

      setDrafts(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/examiner/login";
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to load the review queue"
      );
    } finally {
      setLoading(false);
    }
  };

  const subjectMap = useMemo(() => {
    return subjects.reduce((map, subject) => {
      map[subject.library_subject_id] = subject.subject_name;
      return map;
    }, {});
  }, [subjects]);

  const filteredDrafts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drafts.filter((draft) => {
      const matchesSearch =
        !query ||
        draft.question_text?.toLowerCase().includes(query) ||
        draft.question_type?.toLowerCase().includes(query) ||
        draft.source_type?.toLowerCase().includes(query);

      const matchesSource =
        sourceFilter === "all" ||
        draft.source_type === sourceFilter;

      const matchesSubject =
        subjectFilter === "all" ||
        String(draft.library_subject_id) ===
          String(subjectFilter);

      return matchesSearch && matchesSource && matchesSubject;
    });
  }, [drafts, search, sourceFilter, subjectFilter]);

  const approveDraft = async (draftId) => {
    const confirmed = window.confirm(
      "Approve this question and add it to the Question Library?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(draftId);

      await api.post(
        `/draft-questions/${draftId}/approve`,
        {},
        {
          headers: getHeaders(),
        }
      );

      toast.success("Question approved and added to the library");
      await loadDrafts();

      if (onApproved) {
        await onApproved();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to approve the question"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDraft = async (draftId) => {
    const confirmed = window.confirm(
      "Reject this draft question?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(draftId);

      await api.post(
        `/draft-questions/${draftId}/reject`,
        {},
        {
          headers: getHeaders(),
        }
      );

      toast.success("Draft question rejected");
      await loadDrafts();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to reject the question"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const deleteDraft = async (draftId) => {
    const confirmed = window.confirm(
      "Permanently delete this draft question?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(draftId);

      await api.delete(
        `/draft-questions/${draftId}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Draft question deleted");
      await loadDrafts();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the draft"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (draft) => {
    setEditingDraft(draft);

    setEditForm({
      question_text: draft.question_text || "",
      question_type: draft.question_type || "mcq",
      option_a: draft.option_a || "",
      option_b: draft.option_b || "",
      option_c: draft.option_c || "",
      option_d: draft.option_d || "",
      correct_answer: draft.correct_answer || "",
      marks: draft.marks || 1,
      difficulty_level: draft.difficulty_level || "Medium",
      confidence_score:
        draft.confidence_score === null ||
        draft.confidence_score === undefined
          ? ""
          : draft.confidence_score,
      review_notes: draft.review_notes || "",
    });
  };

  const closeEditModal = () => {
    setEditingDraft(null);
    setEditForm(emptyEditForm);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveDraftEdit = async (event) => {
    event.preventDefault();

    if (!editForm.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (Number(editForm.marks) < 1) {
      toast.error("Marks must be at least 1");
      return;
    }

    try {
      setSavingEdit(true);

      await api.put(
        `/draft-questions/${editingDraft.draft_id}`,
        {
          question_text: editForm.question_text.trim(),
          question_type: editForm.question_type,

          option_a: editForm.option_a.trim() || null,
          option_b: editForm.option_b.trim() || null,
          option_c: editForm.option_c.trim() || null,
          option_d: editForm.option_d.trim() || null,

          correct_answer:
            editForm.correct_answer.trim() || null,

          marks: Number(editForm.marks),
          difficulty_level: editForm.difficulty_level,

          confidence_score:
            editForm.confidence_score === ""
              ? null
              : Number(editForm.confidence_score),

          review_notes:
            editForm.review_notes.trim() || null,
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Draft question updated");
      closeEditModal();
      await loadDrafts();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to update the draft question"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <section className="mt-7">
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          title="Pending"
          value={status === "pending" ? drafts.length : "View"}
          active={status === "pending"}
          onClick={() => setStatus("pending")}
          color="yellow"
        />

        <StatusCard
          title="Approved"
          value={status === "approved" ? drafts.length : "View"}
          active={status === "approved"}
          onClick={() => setStatus("approved")}
          color="green"
        />

        <StatusCard
          title="Rejected"
          value={status === "rejected" ? drafts.length : "View"}
          active={status === "rejected"}
          onClick={() => setStatus("rejected")}
          color="red"
        />
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {status === "pending"
                ? "Pending Review"
                : status === "approved"
                ? "Approved Drafts"
                : "Rejected Drafts"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Review questions imported from files or generated by AI
              before saving them to the library.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDrafts}
            className="w-fit rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:border-purple-500"
          >
            Refresh Queue
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search draft questions..."
              className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none focus:border-purple-500"
            />
          </div>

          <label className="relative">
            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none focus:border-purple-500"
            >
              <option value="all">All Sources</option>
              <option value="import">Imported</option>
              <option value="ai_generated">AI Generated</option>
              <option value="manual">Manual Draft</option>
            </select>
          </label>

          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
          >
            <option value="all">All Subjects</option>

            {subjects.map((subject) => (
              <option
                key={subject.library_subject_id}
                value={subject.library_subject_id}
              >
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
            Loading review queue...
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <FaRobot className="mx-auto text-5xl text-purple-400" />

            <h3 className="mt-4 text-xl font-bold">
              No {status} draft questions
            </h3>

            <p className="mt-2 text-slate-400">
              Imported and AI-generated questions will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.draft_id}
                draft={draft}
                subjectName={
                  subjectMap[draft.library_subject_id] ||
                  "Unknown Subject"
                }
                processing={
                  processingId === draft.draft_id
                }
                onEdit={() => openEditModal(draft)}
                onApprove={() =>
                  approveDraft(draft.draft_id)
                }
                onReject={() =>
                  rejectDraft(draft.draft_id)
                }
                onDelete={() =>
                  deleteDraft(draft.draft_id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {editingDraft && (
        <EditDraftModal
          form={editForm}
          handleChange={handleEditChange}
          onSubmit={saveDraftEdit}
          onClose={closeEditModal}
          saving={savingEdit}
        />
      )}
    </section>
  );
}

function DraftCard({
  draft,
  subjectName,
  processing,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}) {
  const options = [
    draft.option_a,
    draft.option_b,
    draft.option_c,
    draft.option_d,
  ].filter(Boolean);

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge text={subjectName} color="blue" />

            <Badge
              text={formatQuestionType(draft.question_type)}
              color="purple"
            />

            <Badge
              text={formatSourceType(draft.source_type)}
              color="orange"
            />

            <Badge
              text={`${draft.marks} Marks`}
              color="green"
            />

            {draft.confidence_score !== null &&
              draft.confidence_score !== undefined && (
                <Badge
                  text={`${draft.confidence_score}% Confidence`}
                  color={
                    draft.confidence_score >= 80
                      ? "green"
                      : draft.confidence_score >= 50
                      ? "yellow"
                      : "red"
                  }
                />
              )}
          </div>

          <h3 className="mt-5 text-xl font-bold">
            {draft.question_text}
          </h3>

          {options.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {options.map((option, index) => (
                <div
                  key={`${draft.draft_id}-${index}`}
                  className="rounded-xl border border-white/10 bg-slate-950 p-4 text-slate-300"
                >
                  <span className="mr-2 font-bold text-purple-400">
                    {String.fromCharCode(65 + index)}.
                  </span>

                  {option}
                </div>
              ))}
            </div>
          )}

          {draft.correct_answer && (
            <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-green-400">
                Correct / Model Answer
              </p>

              <p className="mt-2 text-green-100">
                {draft.correct_answer}
              </p>
            </div>
          )}

          {draft.review_notes && (
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-400">
                Review Notes
              </p>

              <p className="mt-2 text-blue-100">
                {draft.review_notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
          {draft.status === "pending" && (
            <>
              <ActionButton
                text="Edit"
                icon={<FaEdit />}
                onClick={onEdit}
                disabled={processing}
                color="blue"
              />

              <ActionButton
                text="Approve"
                icon={<FaCheck />}
                onClick={onApprove}
                disabled={processing}
                color="green"
              />

              <ActionButton
                text="Reject"
                icon={<FaTimes />}
                onClick={onReject}
                disabled={processing}
                color="red"
              />
            </>
          )}

          {draft.status !== "approved" && (
            <ActionButton
              text="Delete"
              icon={<FaTrash />}
              onClick={onDelete}
              disabled={processing}
              color="gray"
            />
          )}
        </div>
      </div>
    </article>
  );
}

function EditDraftModal({
  form,
  handleChange,
  onSubmit,
  onClose,
  saving,
}) {
  const showOptions = ["mcq", "multi_select"].includes(
    form.question_type
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-5">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#020617] p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Edit Draft Question
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Correct any AI extraction or generation mistakes before
              approval.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-3 text-slate-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">
              Question
            </span>

            <textarea
              name="question_text"
              value={form.question_text}
              onChange={handleChange}
              className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-purple-500"
            />
          </label>

          <SelectField
            label="Question Type"
            name="question_type"
            value={form.question_type}
            onChange={handleChange}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Difficulty"
            name="difficulty_level"
            value={form.difficulty_level}
            onChange={handleChange}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </SelectField>

          <InputField
            label="Marks"
            name="marks"
            type="number"
            min="1"
            value={form.marks}
            onChange={handleChange}
          />

          <InputField
            label="Confidence Score"
            name="confidence_score"
            type="number"
            min="0"
            max="100"
            value={form.confidence_score}
            onChange={handleChange}
          />

          {showOptions && (
            <>
              <InputField
                label="Option A"
                name="option_a"
                value={form.option_a}
                onChange={handleChange}
              />

              <InputField
                label="Option B"
                name="option_b"
                value={form.option_b}
                onChange={handleChange}
              />

              <InputField
                label="Option C"
                name="option_c"
                value={form.option_c}
                onChange={handleChange}
              />

              <InputField
                label="Option D"
                name="option_d"
                value={form.option_d}
                onChange={handleChange}
              />
            </>
          )}

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">
              Correct / Model Answer
            </span>

            <textarea
              name="correct_answer"
              value={form.correct_answer}
              onChange={handleChange}
              className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-purple-500"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">
              Review Notes
            </span>

            <textarea
              name="review_notes"
              value={form.review_notes}
              onChange={handleChange}
              placeholder="Add corrections or reviewer notes..."
              className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-purple-500"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-slate-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusCard({
  title,
  value,
  active,
  onClick,
  color,
}) {
  const activeStyles = {
    yellow: "border-yellow-500 bg-yellow-500/10",
    green: "border-green-500 bg-green-500/10",
    red: "border-red-500 bg-red-500/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? activeStyles[color]
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </button>
  );
}

function ActionButton({
  text,
  icon,
  onClick,
  disabled,
  color,
}) {
  const styles = {
    blue: "border-blue-500/30 text-blue-300 hover:bg-blue-500/10",
    green:
      "border-green-500/30 text-green-300 hover:bg-green-500/10",
    red: "border-red-500/30 text-red-300 hover:bg-red-500/10",
    gray: "border-white/10 text-slate-300 hover:bg-white/5",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50 ${styles[color]}`}
    >
      {icon}
      {text}
    </button>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
      >
        {children}
      </select>
    </label>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  min,
  max,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">
        {label}
      </span>

      <input
        type={type}
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
      />
    </label>
  );
}

function Badge({ text, color }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-300",
    purple: "bg-purple-500/15 text-purple-300",
    orange: "bg-orange-500/15 text-orange-300",
    green: "bg-green-500/15 text-green-300",
    yellow: "bg-yellow-500/15 text-yellow-300",
    red: "bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[color] || styles.blue
      }`}
    >
      {text}
    </span>
  );
}

function formatQuestionType(type) {
  return (
    QUESTION_TYPES.find((item) => item.value === type)?.label ||
    type
  );
}

function formatSourceType(sourceType) {
  if (sourceType === "ai_generated") {
    return "AI Generated";
  }

  if (sourceType === "import") {
    return "Imported";
  }

  if (sourceType === "manual") {
    return "Manual Draft";
  }

  return sourceType;
}