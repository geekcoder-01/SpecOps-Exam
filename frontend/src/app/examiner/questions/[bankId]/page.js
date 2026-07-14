"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaBrain,
  FaEdit,
  FaFileImport,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import LibraryHeader from "@/components/examiner/questions/LibraryHeader";
import WorkspaceTabs from "@/components/examiner/questions/WorkspaceTabs";
import ReviewQueue from "@/components/questions/ReviewQueue";

import api from "@/services/api";
import QuestionLibraryService from "@/services/questionLibraryService";

export default function QuestionLibraryWorkspace({ params }) {
  const { bankId } = use(params);

  const numericBankId = Number(bankId);

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

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const loadWorkspace = async () => {
    try {
      setLoading(true);

      const [libraryData, subjectsData] = await Promise.all([
        QuestionLibraryService.getLibrary(numericBankId),
        QuestionLibraryService.getSubjects(numericBankId),
      ]);

      setLibrary(libraryData);
      setSubjects(subjectsData);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
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

    const cleanedName = subjectName.trim();

    if (!cleanedName) {
      toast.error("Enter a subject name");
      return;
    }

    try {
      setAddingSubject(true);

      await api.post(
        `/question-libraries/${bankId}/subjects`,
        {
          subject_name: cleanedName,
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Subject added successfully");
      setSubjectName("");

      await loadWorkspace();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to add the subject"
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

    if (!newName?.trim()) {
      return;
    }

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

      toast.success("Subject updated successfully");
      await loadWorkspace();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to update the subject"
      );
    }
  };

  const deleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `Delete "${subject.subject_name}"?\n\nA subject containing questions cannot be deleted.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/question-libraries/subjects/${subject.library_subject_id}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Subject deleted successfully");
      await loadWorkspace();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the subject"
      );
    }
  };

  const deleteQuestion = async (questionId) => {
    const confirmed = window.confirm(
      "Permanently delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await QuestionLibraryService.deleteQuestion(questionId);

      toast.success("Question deleted successfully");
      await loadWorkspace();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the question"
      );
    }
  };

  const questions = library?.questions || [];

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return questions;
    }

    return questions.filter((question) => {
      return (
        question.question_text?.toLowerCase().includes(query) ||
        question.question_type?.toLowerCase().includes(query) ||
        question.subject?.toLowerCase().includes(query) ||
        question.difficulty_level?.toLowerCase().includes(query)
      );
    });
  }, [questions, search]);

  const statistics = useMemo(() => {
    return questions.reduce(
      (result, question) => {
        const type = question.question_type?.toLowerCase();

        result.total += 1;

        if (type === "mcq") {
          result.mcq += 1;
        } else if (type === "multi_select") {
          result.multiSelect += 1;
        } else if (type === "short_answer") {
          result.shortAnswer += 1;
        } else if (type === "long_answer") {
          result.longAnswer += 1;
        } else if (type === "true_false") {
          result.trueFalse += 1;
        } else if (type === "numerical") {
          result.numerical += 1;
        } else {
          result.other += 1;
        }

        return result;
      },
      {
        total: 0,
        mcq: 0,
        multiSelect: 0,
        shortAnswer: 0,
        longAnswer: 0,
        trueFalse: 0,
        numerical: 0,
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

        <LibraryHeader
          library={library}
          subjectsCount={subjects.length}
        />

        <WorkspaceTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <OverviewTab
            library={library}
            subjects={subjects}
            statistics={statistics}
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
            deleteQuestion={deleteQuestion}
          />
        )}

        {activeTab === "import" && (
          <ImportQuestionsTab
            bankId={numericBankId}
            subjects={subjects}
          />
        )}

        {activeTab === "generator" && (
          <AiGeneratorTab subjects={subjects} />
        )}

        {activeTab === "review" && (
          <ReviewQueue
            bankId={numericBankId}
            subjects={subjects}
            onApproved={loadWorkspace}
          />
        )}
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

          <StatisticCard
            title="Single MCQ"
            value={statistics.mcq}
          />

          <StatisticCard
            title="Multiple Correct"
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
            title="True / False"
            value={statistics.trueFalse}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">
            Library Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InformationRow
              label="Title"
              value={library.title}
            />

            <InformationRow
              label="Purpose"
              value={
                library.purpose || "No specific purpose"
              }
            />

            <InformationRow
              label="Subjects"
              value={subjects.length}
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
          <h2 className="text-2xl font-bold">
            Library Subjects
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Add one subject for a normal library or multiple
            subjects for a competitive-exam library.
          </p>
        </div>

        <form
          onSubmit={addSubject}
          className="flex gap-3"
        >
          <input
            value={subjectName}
            onChange={(event) =>
              setSubjectName(event.target.value)
            }
            placeholder="Example: Mathematics"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
          />

          <button
            type="submit"
            disabled={addingSubject}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaPlus />
            {addingSubject ? "Adding..." : "Add"}
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
                    {subject.question_count || 0}{" "}
                    {subject.question_count === 1
                      ? "question"
                      : "questions"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => renameSubject(subject)}
                    title="Rename subject"
                    className="rounded-lg border border-white/10 p-2 text-blue-400 transition hover:bg-blue-500/10"
                  >
                    <FaEdit />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSubject(subject)}
                    title="Delete subject"
                    className="rounded-lg border border-white/10 p-2 text-red-400 transition hover:bg-red-500/10"
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
  deleteQuestion,
}) {
  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Questions
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage manually created, imported, and AI-generated
            questions.
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
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search questions..."
          className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none transition focus:border-purple-500"
        />
      </div>

      {subjects.length === 0 && (
        <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Add at least one library subject before creating
          questions.
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
              Add questions manually, import a document, or
              generate questions using AI.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <article
              key={question.questionbank_id}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold">
                    {question.question_text}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      text={formatQuestionType(
                        question.question_type
                      )}
                      color="purple"
                    />

                    <Badge
                      text={question.subject || "Subject"}
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
                  <Link
                    href={`/examiner/questions/${bankId}/edit/${question.questionbank_id}`}
                    title="Edit question"
                    className="rounded-lg border border-white/10 p-2 text-blue-400 transition hover:bg-blue-500/10"
                  >
                    <FaEdit />
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      deleteQuestion(
                        question.questionbank_id
                      )
                    }
                    title="Delete question"
                    className="rounded-lg border border-white/10 p-2 text-red-400 transition hover:bg-red-500/10"
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

function ImportQuestionsTab({ bankId, subjects }) {
  const [subjectId, setSubjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imports, setImports] = useState([]);

  useEffect(() => {
    loadImports();
  }, [bankId]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loadImports = async () => {
    try {
      const response = await api.get(
        `/question-imports/library/${bankId}`,
        {
          headers: getHeaders(),
        }
      );

      setImports(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(
          "Unable to load question imports:",
          error
        );
      }
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const startImport = async () => {
    if (!subjectId) {
      toast.error(
        "Select the subject where questions will be added"
      );
      return;
    }

    if (!selectedFile) {
      toast.error("Choose a file to import");
      return;
    }

    const formData = new FormData();

    formData.append("bank_id", String(bankId));
    formData.append(
      "library_subject_id",
      String(subjectId)
    );
    formData.append("file", selectedFile);

    try {
      setUploading(true);

      await api.post(
        "/question-imports/upload",
        formData,
        {
          headers: {
            ...getHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Question file uploaded successfully");

      setSelectedFile(null);

      const fileInput =
        document.getElementById("question-import-file");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadImports();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to upload the question file"
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteImport = async (importId) => {
    const confirmed = window.confirm(
      "Delete this import job and its uploaded source file?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/question-imports/${importId}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Import job deleted");
      await loadImports();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the import"
      );
    }
  };

  return (
    <section className="mt-7 space-y-7">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
        <h2 className="text-2xl font-bold">
          Import Questions
        </h2>

        <p className="mt-2 text-slate-400">
          Upload PDF, Word, or image files. Extracted questions
          will enter the Review Queue before being saved.
        </p>

        <div className="mt-7 max-w-xl">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Add extracted questions to
            </span>

            <select
              value={subjectId}
              onChange={(event) =>
                setSubjectId(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
            >
              <option value="">
                Select library subject
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.library_subject_id}
                  value={subject.library_subject_id}
                >
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-7 rounded-3xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center">
          <FaFileImport className="mx-auto text-6xl text-purple-400" />

          <h3 className="mt-5 text-2xl font-bold">
            Choose a question file
          </h3>

          <p className="mt-2 text-slate-400">
            PDF, DOC, DOCX, JPG, JPEG, PNG, and WEBP are
            supported. Maximum size: 20 MB.
          </p>

          <label className="mt-6 inline-flex cursor-pointer rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700">
            Choose File

            <input
              id="question-import-file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mx-auto mt-5 max-w-xl rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
              Selected: {selectedFile.name}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={startImport}
          disabled={
            uploading || subjects.length === 0
          }
          className="mt-7 rounded-xl bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "Upload Question File"}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Import History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Uploaded source files and their processing status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadImports}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-purple-500"
          >
            Refresh
          </button>
        </div>

        {imports.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            No question files have been uploaded.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {imports.map((item) => (
              <div
                key={item.import_id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold">
                    {item.original_filename}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      text={item.file_type.toUpperCase()}
                      color="purple"
                    />

                    <Badge
                      text={formatFileSize(
                        item.file_size
                      )}
                      color="blue"
                    />

                    <Badge
                      text={item.status}
                      color={
                        item.status === "completed"
                          ? "green"
                          : item.status === "failed"
                          ? "red"
                          : "orange"
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    deleteImport(item.import_id)
                  }
                  className="flex w-fit items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  <FaTrash />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AiGeneratorTab({ subjects }) {
  const [form, setForm] = useState({
    library_subject_id: "",
    topic: "",
    difficulty: "Medium",
    count: 10,
    question_type: "mcq",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const generateQuestions = () => {
    if (!form.library_subject_id) {
      toast.error(
        "Select the subject where generated questions will be added"
      );
      return;
    }

    if (!form.topic.trim()) {
      toast.error("Enter a topic");
      return;
    }

    toast.success(
      "AI generation will be connected in the next stage. Generated questions will enter the Review Queue."
    );
  };

  return (
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-7">
      <h2 className="text-2xl font-bold">
        AI Question Generator
      </h2>

      <p className="mt-2 text-slate-400">
        Generate draft questions for a selected subject. All
        generated questions require examiner approval.
      </p>

      <div className="mt-7 grid max-w-3xl gap-5 md:grid-cols-2">
        <SelectField
          label="Library Subject"
          name="library_subject_id"
          value={form.library_subject_id}
          onChange={handleChange}
        >
          <option value="">
            Select library subject
          </option>

          {subjects.map((subject) => (
            <option
              key={subject.library_subject_id}
              value={subject.library_subject_id}
            >
              {subject.subject_name}
            </option>
          ))}
        </SelectField>

        <InputField
          label="Topic"
          name="topic"
          value={form.topic}
          onChange={handleChange}
          placeholder="Example: Object-Oriented Programming"
        />

        <SelectField
          label="Difficulty"
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </SelectField>

        <SelectField
          label="Question Type"
          name="question_type"
          value={form.question_type}
          onChange={handleChange}
        >
          <option value="mcq">
            Single Correct MCQ
          </option>

          <option value="multi_select">
            Multiple Correct MCQ
          </option>

          <option value="true_false">
            True / False
          </option>

          <option value="fill_blank">
            Fill in the Blank
          </option>

          <option value="numerical">
            Numerical
          </option>

          <option value="short_answer">
            Short Answer
          </option>

          <option value="long_answer">
            Long Answer
          </option>
        </SelectField>

        <InputField
          label="Number of Questions"
          name="count"
          type="number"
          min="1"
          max="100"
          value={form.count}
          onChange={handleChange}
        />
      </div>

      <button
        type="button"
        onClick={generateQuestions}
        disabled={subjects.length === 0}
        className="mt-7 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaBrain />
        Generate Questions
      </button>
    </section>
  );
}

function StatisticCard({ title, value }) {
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

function SelectField({
  label,
  name,
  value,
  onChange,
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
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
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
  placeholder,
  type = "text",
  min,
  max,
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
        max={max}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
      />
    </label>
  );
}

function Badge({ text, color }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-300",
    purple: "bg-purple-500/15 text-purple-300",
    green: "bg-green-500/15 text-green-300",
    orange: "bg-orange-500/15 text-orange-300",
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
  const labels = {
    mcq: "Single Correct MCQ",
    multi_select: "Multiple Correct MCQ",
    true_false: "True / False",
    fill_blank: "Fill in the Blank",
    numerical: "Numerical",
    short_answer: "Short Answer",
    long_answer: "Long Answer",
    image_upload: "Image Upload",
    file_upload: "File Upload",
  };

  return labels[type] || type;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 Bytes";
  }

  if (bytes < 1024) {
    return `${bytes} Bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}