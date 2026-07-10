"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FaUserGraduate,
  FaClipboardList,
  FaQuestionCircle,
  FaTasks,
  FaPlus,
  FaBook,
  FaUsers,
  FaChartLine,
} from "react-icons/fa";

export default function ExaminerDashboard() {
  return (
    <DashboardLayout
      role="Examiner"
      title="Examiner Dashboard"
      user="Examiner"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, Examiner 👋</h1>
        <p className="mt-2 text-slate-400">
          Manage exams, questions, assignments, and student evaluation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Students" value="12" icon={<FaUserGraduate />} color="blue" />
        <StatCard title="Exams" value="4" icon={<FaClipboardList />} color="purple" />
        <StatCard title="Questions" value="28" icon={<FaQuestionCircle />} color="green" />
        <StatCard title="Assigned" value="9" icon={<FaTasks />} color="orange" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-2xl font-bold">Quick Actions</h2>

          <div className="grid gap-4">
            <Action href="/examiner/exams" icon={<FaPlus />} title="Create / Manage Exams" />
            <Action href="/examiner/questions" icon={<FaBook />} title="Manage Question Bank" />
            <Action href="/examiner/assignments" icon={<FaUsers />} title="Assign Exams to Students" />
            <Action href="/examiner/results" icon={<FaChartLine />} title="View Results & Evaluation" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-2xl font-bold">Recent Exams</h2>

          <div className="space-y-4">
            <ExamRow name="AI Mid Semester" subject="Artificial Intelligence" status="Active" />
            <ExamRow name="ML Unit Test" subject="Machine Learning" status="Upcoming" />
            <ExamRow name="DS Final Test" subject="Data Structures" status="Draft" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    orange: "text-orange-400",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className={`text-3xl ${colors[color]}`}>{icon}</div>
      <p className="mt-4 text-slate-400">{title}</p>
      <h3 className="mt-2 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function Action({ href, icon, title }) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4 hover:border-purple-500"
    >
      <div className="text-xl text-purple-400">{icon}</div>
      <span className="font-semibold">{title}</span>
    </a>
  );
}

function ExamRow({ name, subject, status }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-slate-400">{subject}</p>
      </div>

      <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
        {status}
      </span>
    </div>
  );
}