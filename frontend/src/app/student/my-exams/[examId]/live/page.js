"use client";

import { use, useEffect, useState } from "react";
import {
  FaFlag,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaVideo,
} from "react-icons/fa";

const sampleQuestions = [
  {
    id: 1,
    question: "What is Artificial Intelligence?",
    type: "short",
  },
  {
    id: 2,
    question: "Which of the following is a type of Machine Learning?",
    type: "mcq",
    options: ["Supervised Learning", "Compiler Design", "Operating System", "HTML"],
  },
  {
    id: 3,
    question: "Explain AI proctoring in online examinations.",
    type: "long",
  },
];

export default function LiveExamPage({ params }) {
  const { examId } = use(params);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [violations, setViolations] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Time is over. Exam submitted automatically.");
          window.location.href = `/student/results`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => v + 1);
        alert("Warning: Tab switching is not allowed.");
      }
    };

    const blockAction = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("contextmenu", blockAction);
    document.addEventListener("copy", blockAction);
    document.addEventListener("paste", blockAction);
    document.addEventListener("cut", blockAction);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", blockAction);
      document.removeEventListener("copy", blockAction);
      document.removeEventListener("paste", blockAction);
      document.removeEventListener("cut", blockAction);
    };
  }, [examId]);

  const question = sampleQuestions[current];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleFlag = () => {
    if (flagged.includes(question.id)) {
      setFlagged(flagged.filter((id) => id !== question.id));
    } else {
      setFlagged([...flagged, question.id]);
    }
  };

  const submitExam = () => {
    const confirmSubmit = confirm("Are you sure you want to submit the exam?");
    if (confirmSubmit) {
      window.location.href = "/student/results";
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold">Secure Live Exam</h1>
          <p className="text-sm text-slate-400">Exam ID: {examId}</p>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-400">Time Remaining</p>
          <h2
            className={`text-3xl font-bold ${
              timeLeft <= 30 ? "text-red-400" : "text-green-400"
            }`}
          >
            {formatTime(timeLeft)}
          </h2>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-300">
          Violations: {violations}
        </div>
      </header>

      <section className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-blue-500/20 px-4 py-1 text-sm text-blue-300">
              Question {current + 1} of {sampleQuestions.length}
            </span>

            <button
              onClick={toggleFlag}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
                flagged.includes(question.id)
                  ? "bg-yellow-500 text-black"
                  : "border border-yellow-500 text-yellow-400"
              }`}
            >
              <FaFlag />
              {flagged.includes(question.id) ? "Flagged" : "Flag"}
            </button>
          </div>

          <h2 className="mb-6 text-2xl font-bold">{question.question}</h2>

          {question.type === "mcq" ? (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option}
                  className="block rounded-xl border border-white/10 bg-slate-900 p-4"
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    className="mr-3"
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[question.id] || ""}
              onChange={(e) =>
                setAnswers({ ...answers, [question.id]: e.target.value })
              }
              placeholder="Write your answer here..."
              className="min-h-64 w-full rounded-2xl border border-white/10 bg-slate-900 p-5 outline-none focus:border-blue-500"
            />
          )}

          <div className="mt-8 flex justify-between">
            <button
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 disabled:opacity-40"
            >
              <FaChevronLeft />
              Previous
            </button>

            {current === sampleQuestions.length - 1 ? (
              <button
                onClick={submitExam}
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-700"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrent(current + 1)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
              >
                Next
                <FaChevronRight />
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-xl font-bold">AI Monitoring</h3>

            <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-slate-900">
              <FaVideo className="text-4xl text-blue-400" />
            </div>

            <Status text="Camera Active" />
            <Status text="Microphone Active" />
            <Status text="Fullscreen Enabled" />
            <Status text="AI Proctoring Running" />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-xl font-bold">Question Palette</h3>

            <div className="grid grid-cols-5 gap-3">
              {sampleQuestions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(index)}
                  className={`h-10 rounded-xl font-bold ${
                    current === index
                      ? "bg-blue-600"
                      : flagged.includes(q.id)
                      ? "bg-yellow-500 text-black"
                      : answers[q.id]
                      ? "bg-green-600"
                      : "bg-slate-800"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p>🟦 Current</p>
              <p>🟩 Answered</p>
              <p>🟨 Flagged</p>
              <p>⬛ Unanswered</p>
            </div>
          </div>

          <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-red-300">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <FaExclamationTriangle />
              Security Notice
            </div>
            <p className="text-sm">
              Do not switch tabs, leave fullscreen, copy/paste, or open another
              window during the exam.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Status({ text }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm text-green-400">
      ● {text}
    </p>
  );
}