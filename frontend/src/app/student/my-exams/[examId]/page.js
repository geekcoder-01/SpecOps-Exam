"use client";

import { use, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import {
  FaBookOpen,
  FaClock,
  FaCalendarAlt,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";

export default function ExamDetailsPage({ params }) {
  const { examId } = use(params);

  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/student/login";
        return;
      }

      // Current logged-in user
      const userRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userRes.data.role !== "Student") {
        localStorage.clear();
        window.location.href = "/student/login";
        return;
      }

      setUser(userRes.data);

      // Exam details
      const examRes = await api.get(`/exam/${examId}`);

      setExam(examRes.data);

      setLoading(false);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/student/login";
        return;
      }

      alert("Unable to load exam details.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white text-xl">
        Loading Exam Details...
      </div>
    );
  }

  return (
    <DashboardLayout
      role="Student"
      title="Exam Details"
      user={user?.name || "Student"}
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 text-2xl">
            <FaShieldAlt />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {exam.exam_name}
            </h1>

            <p className="text-slate-400">
              Secure AI-Proctored Examination
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">

          <Info
            icon={<FaBookOpen />}
            label="Subject"
            value={exam.subject}
          />

          <Info
            icon={<FaClock />}
            label="Duration"
            value={`${exam.duration} Minutes`}
          />

          <Info
            icon={<FaCalendarAlt />}
            label="Start Time"
            value={new Date(exam.start_time).toLocaleString()}
          />

        </div>

        <div className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-6">

          <h2 className="text-xl font-bold mb-4">
            Before You Start
          </h2>

          <ul className="space-y-3 text-slate-300">

            <li>✅ Camera permission is mandatory.</li>

            <li>✅ Microphone permission is mandatory.</li>

            <li>✅ Do NOT switch tabs or open another window.</li>

            <li>✅ Do NOT minimize the browser.</li>

            <li>✅ Copy / Paste is disabled.</li>

            <li>✅ Right click is disabled.</li>

            <li>✅ Multiple faces are not allowed.</li>

            <li>✅ Suspicious activities will be recorded.</li>

            <li>✅ AI Proctoring starts immediately after verification.</li>

          </ul>

        </div>

        <a
          href={`/student/my-exams/${exam.exam_id}/instructions`}
          className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
        >
          Continue to Instructions
          <FaArrowRight />
        </a>

      </div>
    </DashboardLayout>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

      <div className="mb-3 text-2xl text-blue-400">
        {icon}
      </div>

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>

    </div>
  );
}