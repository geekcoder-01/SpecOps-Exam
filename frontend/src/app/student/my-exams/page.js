"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import {
  FaBookOpen,
  FaClock,
  FaCalendarAlt,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

export default function MyExamsPage() {
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUser();
    fetchExams();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    const res = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUser(res.data);
  };

const fetchExams = async () => {
    const token = localStorage.getItem("token");

    const res = await api.get("/student-exam/my-exams", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    setExams(res.data);
};

  const filteredExams = exams.filter((exam) =>
    exam.exam_name.toLowerCase().includes(search.toLowerCase()) ||
    exam.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading My Exams...
      </div>
    );
  }

  return (
    <DashboardLayout role="Student" title="My Exams" user={user.name}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">My Exams</h1>
          <p className="mt-2 text-slate-400">
            View your assigned exams and start the secure verification process.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams..."
            className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h2 className="text-2xl font-bold">No exams found</h2>
          <p className="mt-2 text-slate-400">
            Exams created by examiners will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam) => (
            <div
              key={exam.exam_id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:border-blue-500/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                  Upcoming
                </span>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                  Active
                </span>
              </div>

              <h2 className="text-2xl font-bold">{exam.exam_name}</h2>

              <div className="mt-5 space-y-3 text-slate-300">
                <p className="flex items-center gap-3">
                  <FaBookOpen className="text-blue-400" />
                  {exam.subject}
                </p>

                <p className="flex items-center gap-3">
                  <FaClock className="text-green-400" />
                  {exam.duration} Minutes
                </p>

                <p className="flex items-center gap-3">
                  <FaCalendarAlt className="text-purple-400" />
                  {new Date(exam.start_time).toLocaleString()}
                </p>
              </div>

              <a
                href={`/student/my-exams/${exam.exam_id}`}
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
              >
                View Details
                <FaArrowRight />
              </a>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}