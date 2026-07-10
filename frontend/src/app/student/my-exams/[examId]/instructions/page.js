"use client";

import { use, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import {
  FaCamera,
  FaMicrophone,
  FaDesktop,
  FaEye,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";

export default function InstructionsPage({ params }) {
  const { examId } = use(params);

  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/student/login";
      return;
    }

    const userRes = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const examRes = await api.get(`/exam/${examId}`);

    setUser(userRes.data);
    setExam(examRes.data);
  };

  if (!user || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading Instructions...
      </div>
    );
  }

  return (
    <DashboardLayout role="Student" title="Exam Instructions" user={user.name}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{exam.exam_name}</h1>
          <p className="mt-2 text-slate-400">
            Read all instructions carefully before starting AI verification.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Info title="Student" value={user.name} />
          <Info title="Student ID" value={user.roll} />
          <Info title="Subject" value={exam.subject} />
          <Info title="Duration" value={`${exam.duration} Minutes`} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">Exam Rules</h2>

            <ul className="space-y-3 text-slate-300">
              <li>✅ Camera and microphone must remain active.</li>
              <li>✅ Do not switch tabs or open another window.</li>
              <li>✅ Do not minimize or leave fullscreen mode.</li>
              <li>✅ Only one face should be visible.</li>
              <li>✅ Copy, paste, right-click, and shortcuts are restricted.</li>
              <li>✅ Suspicious activity will be recorded.</li>
              <li>✅ Timer will auto-submit when time ends.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">Verification Required</h2>

            <Check icon={<FaCamera />} text="Webcam Permission" />
            <Check icon={<FaMicrophone />} text="Microphone Permission" />
            <Check icon={<FaEye />} text="Face Presence Check" />
            <Check icon={<FaDesktop />} text="Fullscreen Mode" />
            <Check icon={<FaShieldAlt />} text="AI Monitoring Ready" />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 accent-blue-600"
            />
            <span className="text-slate-300">
              I have read and understood all exam rules. I agree that AI
              proctoring will monitor my exam activity.
            </span>
          </label>
        </div>

        <button
          disabled={!agree}
          onClick={() =>
            (window.location.href = `/student/my-exams/${examId}/verification`)
          }
          className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start AI Verification
          <FaArrowRight />
        </button>
      </div>
    </DashboardLayout>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Check({ icon, text }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-blue-400">{icon}</div>
      <span>{text}</span>
    </div>
  );
}