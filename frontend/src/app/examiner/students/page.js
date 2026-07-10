"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import { FaSearch, FaUserGraduate, FaEnvelope, FaIdCard } from "react-icons/fa";

export default function ExaminerStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");

    const res = await api.get("/users/students", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setStudents(res.data);
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase()) ||
    student.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="Examiner" title="Students" user="Examiner">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="mt-2 text-slate-400">
            View registered students and assign exams.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="text-2xl font-bold">No students found</h2>
            <p className="mt-2 text-slate-400">
              Registered students will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => (
              <div
                key={student.user_id}
                className="rounded-2xl border border-white/10 bg-slate-900 p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
                  <FaUserGraduate />
                </div>

                <h2 className="text-xl font-bold">{student.name}</h2>

                <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                  <FaEnvelope />
                  {student.email}
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <FaIdCard />
                  {student.roll}
                </p>

                <a
                  href="/examiner/assignments"
                  className="mt-5 block rounded-xl bg-purple-600 px-4 py-3 text-center font-semibold hover:bg-purple-700"
                >
                  Assign Exam
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}