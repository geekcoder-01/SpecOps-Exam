"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import {
  FaClipboardList,
  FaChartLine,
  FaVideo,
  FaClock,
} from "react-icons/fa";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <DashboardLayout
      role="Student"
      title="Student Dashboard"
      user={user.name}
    >
      <div className="grid gap-6 md:grid-cols-4">
        <DashboardCard
          title="Available Exams"
          value="3"
          icon={<FaClipboardList />}
          color="blue"
        />

        <DashboardCard
          title="Completed Exams"
          value="5"
          icon={<FaChartLine />}
          color="green"
        />

        <DashboardCard
          title="AI Monitoring"
          value="Ready"
          icon={<FaVideo />}
          color="purple"
        />

        <DashboardCard
          title="Student ID"
          value={user.roll}
          icon={<FaClock />}
          color="orange"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Student Information
          </h2>

          <div className="space-y-3">
            <p>
              <strong>Name:</strong> {user.name}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>

            <p>
              <strong>Student ID:</strong> {user.roll}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            System Status
          </h2>

          <Status text="Camera Ready" color="green" />
          <Status text="Microphone Ready" color="green" />
          <Status text="Internet Connected" color="green" />
          <Status text="AI Proctoring Available" color="blue" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function DashboardCard({ title, value, icon, color }) {
  const colors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className={`text-3xl ${colors[color]}`}>
        {icon}
      </div>

      <h3 className="mt-4 text-slate-400">
        {title}
      </h3>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Status({ text, color }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${colors[color]}`} />
      <span>{text}</span>
    </div>
  );
}