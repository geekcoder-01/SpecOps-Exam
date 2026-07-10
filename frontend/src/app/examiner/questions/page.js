"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import {
  FaBookOpen,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaLayerGroup,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

const emptyForm = {
  title: "",
  subject: "",
  purpose: "",
};

export default function QuestionLibrariesPage() {
  const [libraries, setLibraries] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchLibraries = async () => {
    try {
      setLoading(true);

      const response = await api.get("/question-libraries/all", {
        headers: getAuthHeaders(),
      });

      setLibraries(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/examiner/login";
        return;
      }

      toast.error(
        error.response?.data?.detail || "Unable to load question libraries"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const createLibrary = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.subject.trim()) {
      toast.error("Title and subject are required");
      return;
    }

    try {
      setSaving(true);

      await api.post(
        "/question-libraries/create",
        {
          title: form.title.trim(),
          subject: form.subject.trim(),
          purpose: form.purpose.trim() || null,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      toast.success("Question library created successfully");
      setForm(emptyForm);
      setShowForm(false);
      await fetchLibraries();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to create question library"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLibrary = async (bankId) => {
    const confirmed = window.confirm(
      "Delete this question library? Libraries containing questions cannot be deleted."
    );

    if (!confirmed) return;

    try {
      await api.delete(`/question-libraries/${bankId}`, {
        headers: getAuthHeaders(),
      });

      toast.success("Question library deleted");
      await fetchLibraries();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to delete question library"
      );
    }
  };

  const filteredLibraries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return libraries;

    return libraries.filter((library) => {
      return (
        library.title.toLowerCase().includes(query) ||
        library.subject.toLowerCase().includes(query) ||
        (library.purpose || "").toLowerCase().includes(query)
      );
    });
  }, [libraries, search]);

  return (
    <DashboardLayout
      role="Examiner"
      title="Question Libraries"
      user="Examiner"
    >
      <Toaster position="top-right" />

      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Libraries</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Organize questions by title and subject. Open a library to add
            questions manually, import a PDF, or review AI-extracted questions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-700"
        >
          <FaPlus />
          Create Library
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createLibrary}
          className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Create Question Library</h2>
            <p className="mt-1 text-sm text-slate-400">
              Purpose is optional.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Library Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: Artificial Intelligence Midterm"
              required
            />

            <Field
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Example: Artificial Intelligence"
              required
            />

            <div className="md:col-span-2">
              <Field
                label="Purpose (Optional)"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Example: Mid Semester, Placement Practice, Revision"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Library"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-slate-300 hover:border-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, subject, or purpose..."
            className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none transition focus:border-purple-500"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
          {filteredLibraries.length}{" "}
          {filteredLibraries.length === 1 ? "library" : "libraries"}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-300">
          Loading question libraries...
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/15 text-3xl text-purple-400">
            <FaLayerGroup />
          </div>

          <h2 className="mt-5 text-2xl font-bold">
            No question libraries found
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-slate-400">
            Create your first library to organize manual questions, PDF imports,
            and AI-processed questions.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredLibraries.map((library) => (
            <LibraryCard
              key={library.bank_id}
              library={library}
              onDelete={deleteLibrary}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function LibraryCard({ library, onDelete }) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:border-purple-500/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-purple-600/20 text-2xl text-purple-400">
          <FaBookOpen />
        </div>

        <div className="flex gap-3">
          <Link
            href={`/examiner/questions/${library.bank_id}/edit`}
            title="Edit library"
            className="rounded-lg border border-white/10 p-2 text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/10"
          >
            <FaEdit />
          </Link>

          <button
            type="button"
            title="Delete library"
            onClick={() => onDelete(library.bank_id)}
            className="rounded-lg border border-white/10 p-2 text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-bold">{library.title}</h2>

      <div className="mt-4 space-y-3">
        <Detail label="Subject" value={library.subject} />

        {library.purpose && (
          <Detail label="Purpose" value={library.purpose} />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
        <div>
          <p className="text-sm text-slate-500">Questions</p>
          <p className="text-2xl font-bold text-purple-300">
            {library.question_count}
          </p>
        </div>

        <Link
          href={`/examiner/questions/${library.bank_id}`}
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-700"
        >
          Open Library
        </Link>
      </div>
    </article>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
      />
    </label>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-slate-300">{value}</p>
    </div>
  );
}