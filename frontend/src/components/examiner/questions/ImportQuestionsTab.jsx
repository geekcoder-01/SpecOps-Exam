"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaFileImport,
  FaPlay,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "@/services/api";

export default function ImportQuestionsTab({
  bankId,
  subjects,
  onProcessed,
}) {
  const fileInputRef = useRef(null);

  const [subjectId, setSubjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imports, setImports] = useState([]);

  const [loadingImports, setLoadingImports] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadImports();
  }, [bankId]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const loadImports = async () => {
    try {
      setLoadingImports(true);

      const response = await api.get(
        `/question-imports/library/${bankId}`,
        {
          headers: getHeaders(),
        }
      );

      setImports(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to load import history"
      );
    } finally {
      setLoadingImports(false);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const resetFileInput = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processImport = async (
    importId,
    automaticallyOpenReview = true
  ) => {
    try {
      setProcessingId(importId);

      const response = await api.post(
        `/question-imports/${importId}/process`,
        {},
        {
          headers: getHeaders(),
        }
      );

      const draftsCreated =
        response.data?.drafts_created || 0;

      toast.success(
        `${draftsCreated} draft question${
          draftsCreated === 1 ? "" : "s"
        } created successfully`
      );

      await loadImports();

      if (automaticallyOpenReview && onProcessed) {
        onProcessed();
      }

      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return false;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to process the question file"
      );

      await loadImports();
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const uploadAndProcess = async () => {
    if (!subjectId) {
      toast.error(
        "Select the subject where questions should be added"
      );
      return;
    }

    if (!selectedFile) {
      toast.error("Choose a question file");
      return;
    }

    const allowedExtensions = [
      "pdf",
      "docx",
      "jpg",
      "jpeg",
      "png",
      "webp",
    ];

    const extension =
      selectedFile.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      toast.error(
        "Supported formats: PDF, DOCX, JPG, JPEG, PNG and WEBP"
      );
      return;
    }

    const maximumSize = 20 * 1024 * 1024;

    if (selectedFile.size > maximumSize) {
      toast.error("File size must not exceed 20 MB");
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

      const uploadResponse = await api.post(
        "/question-imports/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      const importJob = uploadResponse.data;

      toast.success(
        "File uploaded. Extracting questions now..."
      );

      resetFileInput();
      await loadImports();

      await processImport(importJob.import_id, true);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

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
      setDeletingId(importId);

      await api.delete(
        `/question-imports/${importId}`,
        {
          headers: getHeaders(),
        }
      );

      toast.success("Import job deleted");
      await loadImports();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to delete the import job"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isBusy =
    uploading ||
    processingId !== null ||
    deletingId !== null;

  return (
    <section className="mt-7 space-y-7">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
        <div>
          <h2 className="text-2xl font-bold">
            Import Questions
          </h2>

          <p className="mt-2 max-w-3xl text-slate-400">
            Upload a PDF, DOCX, or image. The system will
            extract the text, detect individual questions and
            place them in the Review Queue.
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
            Add at least one library subject before importing
            questions.
          </div>
        ) : (
          <>
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
                  disabled={isBusy}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500 disabled:opacity-60"
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
                Supported formats: PDF, DOCX, JPG, JPEG, PNG
                and WEBP. Maximum size: 20 MB.
              </p>

              <label
                className={`mt-6 inline-flex rounded-xl px-6 py-3 font-semibold transition ${
                  isBusy
                    ? "cursor-not-allowed bg-purple-600/50"
                    : "cursor-pointer bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Choose File

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFile}
                  disabled={isBusy}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <div className="mx-auto mt-5 max-w-xl rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-left text-green-300">
                  <p className="font-semibold">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-sm text-green-200/70">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={uploadAndProcess}
              disabled={
                isBusy ||
                !subjectId ||
                !selectedFile
              }
              className="mt-7 flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <FaSyncAlt className="animate-spin" />
                  Uploading...
                </>
              ) : processingId !== null ? (
                <>
                  <FaSyncAlt className="animate-spin" />
                  Extracting Questions...
                </>
              ) : (
                <>
                  <FaPlay />
                  Upload and Process
                </>
              )}
            </button>

            <p className="mt-3 text-sm text-slate-500">
              After successful processing, you will be moved
              automatically to the Review Queue.
            </p>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Import History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              View uploaded source files and their processing
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadImports}
            disabled={isBusy}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-purple-500 disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>

        {loadingImports ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-slate-400">
            Loading import history...
          </div>
        ) : imports.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            No question files have been uploaded.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {imports.map((item) => {
              const processing =
                processingId === item.import_id;

              const deleting =
                deletingId === item.import_id;

              const canProcess = [
                "uploaded",
                "text_extracted",
                "failed",
              ].includes(item.status);

              return (
                <article
                  key={item.import_id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-all font-semibold">
                        {item.original_filename}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
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
                          text={formatStatus(item.status)}
                          color={getStatusColor(item.status)}
                        />
                      </div>

                      {item.error_message && (
                        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                          {item.error_message}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canProcess && (
                        <button
                          type="button"
                          onClick={() =>
                            processImport(
                              item.import_id,
                              true
                            )
                          }
                          disabled={isBusy}
                          className="flex items-center gap-2 rounded-xl border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/10 disabled:opacity-50"
                        >
                          {processing ? (
                            <FaSyncAlt className="animate-spin" />
                          ) : (
                            <FaPlay />
                          )}

                          {processing
                            ? "Processing..."
                            : item.status === "failed"
                            ? "Retry"
                            : "Process"}
                        </button>
                      )}

                      {item.status === "completed" && (
                        <button
                          type="button"
                          onClick={() =>
                            onProcessed?.()
                          }
                          className="rounded-xl border border-purple-500/30 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10"
                        >
                          Open Review Queue
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          deleteImport(item.import_id)
                        }
                        disabled={
                          isBusy ||
                          item.status === "processing"
                        }
                        className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrash />

                        {deleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
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

function getStatusColor(status) {
  if (status === "completed") {
    return "green";
  }

  if (status === "failed") {
    return "red";
  }

  if (status === "processing") {
    return "purple";
  }

  return "orange";
}

function formatStatus(status) {
  const labels = {
    uploaded: "Uploaded",
    processing: "Processing",
    text_extracted: "Text Extracted",
    completed: "Completed",
    failed: "Failed",
  };

  return labels[status] || status;
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