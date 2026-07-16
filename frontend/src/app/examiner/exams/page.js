"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaEye,
  FaFileAlt,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

const STATUS_FILTERS = [
  { value: "all", label: "All Exams" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ExaminerExamsPage() {
  const [exams, setExams] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const loadExams = async () => {
    try {
      setLoading(true);

      const response = await api.get("/exam/all", {
        headers: getHeaders(),
      });

      setExams(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to load exams"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (examId, status) => {
    const action =
      status === "published"
        ? "publish"
        : `change this exam to ${status}`;

    const confirmed = window.confirm(
      `Are you sure you want to ${action}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(examId);

      await api.patch(
        `/exam/${examId}/status`,
        { status },
        {
          headers: getHeaders(),
        }
      );

      toast.success(
        status === "published"
          ? "Exam published successfully"
          : "Exam status updated"
      );

      await loadExams();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to update the exam status"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const deleteExam = async (exam) => {
    const confirmed = window.confirm(
      `Delete "${exam.exam_name}" permanently?\n\nOnly draft or cancelled exams without student assignments can be deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(exam.exam_id);

      await api.delete(
        `/exam/delete/${exam.exam_id}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Exam deleted successfully");
      await loadExams();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the exam"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesStatus =
        statusFilter === "all" ||
        exam.status === statusFilter;

      const matchesSearch =
        !query ||
        exam.exam_name?.toLowerCase().includes(query) ||
        exam.exam_type?.toLowerCase().includes(query) ||
        exam.subject?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [exams, search, statusFilter]);

  const statistics = useMemo(() => {
    return exams.reduce(
      (result, exam) => {
        result.total += 1;

        if (result[exam.status] !== undefined) {
          result[exam.status] += 1;
        }

        return result;
      },
      {
        total: 0,
        draft: 0,
        published: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      }
    );
  }, [exams]);

  return (
    <DashboardLayout
      role="Examiner"
      title="Exam Management"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Exam Builder
            </h1>

            <p className="mt-2 text-slate-400">
              Create, configure, publish, and manage your
              examinations.
            </p>
          </div>

          <Link
            href="/examiner/exams/create"
            className="flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700"
          >
            <FaPlus />
            Create New Exam
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Exams"
            value={statistics.total}
          />

          <StatCard
            title="Draft Exams"
            value={statistics.draft}
          />

          <StatCard
            title="Published"
            value={statistics.published}
          />

          <StatCard
            title="Completed"
            value={statistics.completed}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by exam name, type, or subject..."
                className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none transition focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(filter.value)
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === filter.value
                      ? "bg-purple-600 text-white"
                      : "border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900 p-12 text-center text-slate-400">
              Loading exams...
            </div>
          ) : filteredExams.length === 0 ? (
            <EmptyExamState
              hasExams={exams.length > 0}
            />
          ) : (
            <div className="mt-7 grid gap-5 xl:grid-cols-2">
              {filteredExams.map((exam) => (
                <ExamCard
                  key={exam.exam_id}
                  exam={exam}
                  processing={
                    processingId === exam.exam_id
                  }
                  onPublish={() =>
                    updateStatus(
                      exam.exam_id,
                      "published"
                    )
                  }
                  onCancel={() =>
                    updateStatus(
                      exam.exam_id,
                      "cancelled"
                    )
                  }
                  onDelete={() =>
                    deleteExam(exam)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function ExamCard({
  exam,
  processing,
  onPublish,
  onCancel,
  onDelete,
}) {
  const canDelete = ["draft", "cancelled"].includes(
    exam.status
  );

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={exam.status} />

            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium capitalize text-blue-300">
              {exam.exam_type}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold">
            {exam.exam_name}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {exam.subject ||
              "Subjects will be configured through sections"}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl text-purple-300">
          <FaFileAlt />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InfoItem
          icon={<FaClock />}
          label="Duration"
          value={`${exam.duration} minutes`}
        />

        <InfoItem
          icon={<FaFileAlt />}
          label="Marks"
          value={`${exam.total_marks || 0} total`}
        />

        <InfoItem
          icon={<FaCalendarAlt />}
          label="Starts"
          value={formatDateTime(exam.start_time)}
        />

        <InfoItem
          icon={<FaCalendarAlt />}
          label="Ends"
          value={formatDateTime(exam.end_time)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/examiner/exams/${exam.exam_id}`}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold transition hover:bg-purple-700"
        >
          <FaEdit />
          Open Builder
        </Link>

        <Link
          href={`/examiner/exams/${exam.exam_id}/preview`}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
        >
          <FaEye />
          Preview
        </Link>

        {exam.status === "draft" && (
          <button
            type="button"
            onClick={onPublish}
            disabled={processing}
            className="flex items-center gap-2 rounded-xl border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/10 disabled:opacity-50"
          >
            <FaUpload />
            Publish
          </button>
        )}

        {exam.status === "published" && (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-xl border border-orange-500/30 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/10 disabled:opacity-50"
          >
            Cancel Exam
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={processing}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <FaTrash />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-4xl font-bold text-purple-300">
        {value}
      </p>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-yellow-500/15 text-yellow-300",
    published: "bg-blue-500/15 text-blue-300",
    active: "bg-green-500/15 text-green-300",
    completed: "bg-purple-500/15 text-purple-300",
    cancelled: "bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] ||
        "bg-slate-500/15 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyExamState({ hasExams }) {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-white/10 p-14 text-center">
      <FaFileAlt className="mx-auto text-5xl text-purple-400" />

      <h2 className="mt-5 text-2xl font-bold">
        {hasExams
          ? "No matching exams"
          : "No exams created yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-slate-400">
        {hasExams
          ? "Change the search text or status filter."
          : "Create your first draft exam and configure its sections, questions, schedule, and proctoring settings."}
      </p>

      {!hasExams && (
        <Link
          href="/examiner/exams/create"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700"
        >
          <FaPlus />
          Create First Exam
        </Link>
      )}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
}