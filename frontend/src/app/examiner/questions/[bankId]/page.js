"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import toast, { Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaBookOpen,
  FaBrain,
  FaCheckCircle,
  FaEdit,
  FaFilePdf,
  FaLayerGroup,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

export default function QuestionLibraryWorkspace({ params }) {
  const { bankId } = use(params);

  const [library, setLibrary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [subjectName, setSubjectName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingSubject, setAddingSubject] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [bankId]);

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const redirectToExaminerLogin = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const loadWorkspace = async () => {
    try {
      setLoading(true);

      const [libraryResponse, subjectsResponse] = await Promise.all([
        api.get(`/question-libraries/${bankId}`, {
          headers: getHeaders(),
        }),
        api.get(`/question-libraries/${bankId}/subjects`, {
          headers: getHeaders(),
        }),
      ]);

      setLibrary(libraryResponse.data);
      setSubjects(subjectsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        redirectToExaminerLogin();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to load the question library"
      );
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (event) => {
    event.preventDefault();

    if (!subjectName.trim()) {
      toast.error("Enter a subject name");
      return;
    }

    try {
      setAddingSubject(true);

      await api.post(
        `/question-libraries/${bankId}/subjects`,
        {
          subject_name: subjectName.trim(),
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Subject added successfully");
      setSubjectName("");
      await loadWorkspace();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to add subject"
      );
    } finally {
      setAddingSubject(false);
    }
  };

  const renameSubject = async (subject) => {
    const newName = window.prompt(
      "Enter the new subject name:",
      subject.subject_name
    );

    if (!newName || !newName.trim()) return;

    try {
      await api.put(
        `/question-libraries/subjects/${subject.library_subject_id}`,
        {
          subject_name: newName.trim(),
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Subject updated");
      await loadWorkspace();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to update subject"
      );
    }
  };

  const deleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `Delete "${subject.subject_name}"? Subjects containing questions cannot be deleted.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/question-libraries/subjects/${subject.library_subject_id}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Subject deleted");
      await loadWorkspace();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to delete subject"
      );
    }
  };

  const questions = library?.questions || [];

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return questions;

    return questions.filter((question) => {
      return (
        question.question_text?.toLowerCase().includes(query) ||
        question.question_type?.toLowerCase().includes(query) ||
        question.subject?.toLowerCase().includes(query) ||
        question.difficulty_level?.toLowerCase().includes(query)
      );
    });
  }, [questions, search]);

  const questionStatistics = useMemo(() => {
    return questions.reduce(
      (statistics, question) => {
        const type = question.question_type?.toLowerCase();

        statistics.total += 1;

        if (type === "mcq") {
          statistics.mcq += 1;
        } else if (type === "multi_select") {
          statistics.multiSelect += 1;
        } else if (type === "short_answer") {
          statistics.shortAnswer += 1;
        } else if (type === "long_answer") {
          statistics.longAnswer += 1;
        } else if (type === "image_upload") {
          statistics.imageUpload += 1;
        } else {
          statistics.other += 1;
        }

        return statistics;
      },
      {
        total: 0,
        mcq: 0,
        multiSelect: 0,
        shortAnswer: 0,
        longAnswer: 0,
        imageUpload: 0,
        other: 0,
      }
    );
  }, [questions]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading question library...
      </div>
    );
  }

  if (!library) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Question library not found.
      </div>
    );
  }

  return (
    <DashboardLayout
      role="Examiner"
      title="Question Library Workspace"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <Link
          href="/examiner/questions"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <FaArrowLeft />
          Back to Question Libraries
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-600/20 text-3xl text-purple-400">
                <FaBookOpen />
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">
                  Question Libraries / {library.title}
                </p>

                <h1 className="text-3xl font-bold">{library.title}</h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge text={library.subject} color="blue" />

                  {library.purpose && (
                    <Badge text={library.purpose} color="purple" />
                  )}

                  <Badge
                    text={`${library.question_count || 0} Questions`}
                    color="green"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SummaryItem
                label="Subjects"
                value={subjects.length}
              />

              <SummaryItem
                label="Questions"
                value={library.question_count || 0}
              />

              <SummaryItem
                label="Status"
                value="Active"
              />
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          <WorkspaceTab
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<FaLayerGroup />}
            text="Overview"
          />

          <WorkspaceTab
            active={activeTab === "questions"}
            onClick={() => setActiveTab("questions")}
            icon={<FaQuestionCircle />}
            text="Questions"
          />

          <WorkspaceTab
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            icon={<FaFilePdf />}
            text="Upload PDF"
          />

          <WorkspaceTab
            active={activeTab === "generator"}
            onClick={() => setActiveTab("generator")}
            icon={<FaBrain />}
            text="AI Generator"
          />

          <WorkspaceTab
            active={activeTab === "review"}
            onClick={() => setActiveTab("review")}
            icon={<FaCheckCircle />}
            text="Review"
          />
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            library={library}
            subjects={subjects}
            statistics={questionStatistics}
            subjectName={subjectName}
            setSubjectName={setSubjectName}
            addSubject={addSubject}
            addingSubject={addingSubject}
            renameSubject={renameSubject}
            deleteSubject={deleteSubject}
          />
        )}

        {activeTab === "questions" && (
          <QuestionsTab
            questions={filteredQuestions}
            subjects={subjects}
            search={search}
            setSearch={setSearch}
            bankId={bankId}
          />
        )}

        {activeTab === "upload" && <UploadPdfTab />}

        {activeTab === "generator" && <AiGeneratorTab />}

        {activeTab === "review" && <ReviewTab />}
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({
  library,
  subjects,
  statistics,
  subjectName,
  setSubjectName,
  addSubject,
  addingSubject,
  renameSubject,
  deleteSubject,
}) {
  return (
    <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_420px]">
      <section className="space-y-7">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatisticCard
            title="Total Questions"
            value={statistics.total}
          />

          <StatisticCard title="MCQ" value={statistics.mcq} />

          <StatisticCard
            title="Multiple Select"
            value={statistics.multiSelect}
          />

          <StatisticCard
            title="Short Answers"
            value={statistics.shortAnswer}
          />

          <StatisticCard
            title="Long Answers"
            value={statistics.longAnswer}
          />

          <StatisticCard
            title="Image Upload"
            value={statistics.imageUpload}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Library Information</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InformationRow label="Title" value={library.title} />
            <InformationRow label="Subject" value={library.subject} />

            <InformationRow
              label="Purpose"
              value={library.purpose || "No specific purpose"}
            />

            <InformationRow
              label="Questions"
              value={library.question_count || 0}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Library Subjects</h2>

          <p className="mt-1 text-sm text-slate-400">
            Add one subject for a regular library or multiple subjects for
            competitive-exam libraries.
          </p>
        </div>

        <form onSubmit={addSubject} className="flex gap-3">
          <input
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder="Example: Mathematics"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
          />

          <button
            type="submit"
            disabled={addingSubject}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-semibold transition hover:bg-purple-700 disabled:opacity-60"
          >
            <FaPlus />
            Add
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-slate-400">
              No subjects have been added yet.
            </div>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.library_subject_id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4"
              >
                <div>
                  <h3 className="font-semibold">
                    {subject.subject_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {subject.question_count}{" "}
                    {subject.question_count === 1
                      ? "question"
                      : "questions"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => renameSubject(subject)}
                    className="rounded-lg border border-white/10 p-2 text-blue-400 hover:bg-blue-500/10"
                    title="Rename subject"
                  >
                    <FaEdit />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSubject(subject)}
                    className="rounded-lg border border-white/10 p-2 text-red-400 hover:bg-red-500/10"
                    title="Delete subject"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function QuestionsTab({
  questions,
  subjects,
  search,
  setSearch,
  bankId,
}) {
  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Questions</h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage all manually created, imported, and AI-generated questions
            in this library.
          </p>
        </div>

        <Link
          href={`/examiner/questions/${bankId}/add`}
          className="flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-700"
        >
          <FaPlus />
          Add Question
        </Link>
      </div>

      <div className="relative mt-6 max-w-lg">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none transition focus:border-purple-500"
        />
      </div>

      {subjects.length === 0 && (
        <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Add at least one library subject before creating new questions.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <FaQuestionCircle className="mx-auto text-4xl text-purple-400" />

            <h3 className="mt-4 text-xl font-bold">
              No questions found
            </h3>

            <p className="mt-2 text-slate-400">
              Add questions manually or import them from a PDF.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <article
              key={question.questionbank_id}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {question.question_text}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      text={question.question_type}
                      color="purple"
                    />

                    <Badge
                      text={question.subject}
                      color="blue"
                    />

                    <Badge
                      text={`${question.marks} Marks`}
                      color="green"
                    />

                    <Badge
                      text={question.difficulty_level}
                      color="orange"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Edit question"
                    className="rounded-lg border border-white/10 p-2 text-blue-400 hover:bg-blue-500/10"
                  >
                    <FaEdit />
                  </button>

                  <button
                    type="button"
                    title="Delete question"
                    className="rounded-lg border border-white/10 p-2 text-red-400 hover:bg-red-500/10"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function UploadPdfTab() {
  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-7">
      <h2 className="text-2xl font-bold">Upload Question PDF</h2>

      <p className="mt-2 text-slate-400">
        Upload a question-bank PDF. AI extraction and examiner review will be
        connected in the next stage.
      </p>

      <div className="mt-7 rounded-3xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 p-14 text-center">
        <FaFilePdf className="mx-auto text-6xl text-purple-400" />

        <h3 className="mt-5 text-2xl font-bold">
          Drag and drop your PDF here
        </h3>

        <p className="mt-2 text-slate-400">
          PDF files only. AI will extract questions for review.
        </p>

        <button
          type="button"
          className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700"
        >
          Choose PDF
        </button>
      </div>
    </section>
  );
}

function AiGeneratorTab() {
  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-7">
      <h2 className="text-2xl font-bold">AI Question Generator</h2>

      <p className="mt-2 text-slate-400">
        Generate draft questions by subject, topic, difficulty, and question
        type. This feature will be connected after the library workflow is
        complete.
      </p>

      <div className="mt-7 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-blue-200">
        AI-generated questions will always require examiner review before they
        are saved or published.
      </div>
    </section>
  );
}

function ReviewTab() {
  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-7">
      <h2 className="text-2xl font-bold">Question Review Queue</h2>

      <p className="mt-2 text-slate-400">
        AI-extracted and AI-generated draft questions will appear here for
        approval, editing, or rejection.
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-12 text-center">
        <FaCheckCircle className="mx-auto text-5xl text-green-400" />

        <h3 className="mt-4 text-xl font-bold">
          No questions awaiting review
        </h3>
      </div>
    </section>
  );
}

function WorkspaceTab({ active, onClick, icon, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-purple-600 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function StatisticCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-3 text-4xl font-bold text-purple-300">
        {value}
      </p>
    </div>
  );
}

function InformationRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function Badge({ text, color }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-300",
    purple: "bg-purple-500/15 text-purple-300",
    green: "bg-green-500/15 text-green-300",
    orange: "bg-orange-500/15 text-orange-300",
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