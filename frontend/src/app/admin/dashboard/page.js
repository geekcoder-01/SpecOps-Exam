"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaUserGraduate,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/admin/login";
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/users/all", {
        headers: getHeaders(),
      });

      setUsers(response.data);
    } catch (error) {
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to load user information"
      );
    } finally {
      setLoading(false);
    }
  };

  const statistics = useMemo(() => {
    return users.reduce(
      (result, user) => {
        result.total += 1;

        const role =
          user.role?.toLowerCase() || "";

        const status =
          user.status?.toLowerCase() || "";

        if (role === "student") {
          result.students += 1;
        }

        if (role === "examiner") {
          result.examiners += 1;
        }

        if (status === "pending") {
          result.pending += 1;
        }

        if (status === "approved") {
          result.approved += 1;
        }

        if (
          status === "rejected" ||
          status === "suspended"
        ) {
          result.restricted += 1;
        }

        return result;
      },
      {
        total: 0,
        students: 0,
        examiners: 0,
        pending: 0,
        approved: 0,
        restricted: 0,
      }
    );
  }, [users]);

  const pendingUsers = useMemo(() => {
    return users
      .filter(
        (user) =>
          user.status?.toLowerCase() === "pending"
      )
      .slice(0, 5);
  }, [users]);

  return (
    <DashboardLayout
      role="Admin"
      title="Admin Dashboard"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-3xl font-bold">
            System Administration
          </h1>

          <p className="mt-2 text-slate-400">
            Manage account approvals, users, and platform
            security.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<FaUsers />}
            title="Total Users"
            value={statistics.total}
          />

          <StatCard
            icon={<FaClock />}
            title="Pending Approval"
            value={statistics.pending}
          />

          <StatCard
            icon={<FaUserShield />}
            title="Examiners"
            value={statistics.examiners}
          />

          <StatCard
            icon={<FaUserGraduate />}
            title="Students"
            value={statistics.students}
          />
        </div>

        <div className="mt-8 grid gap-7 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Pending Registrations
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Recently registered accounts awaiting
                  verification.
                </p>
              </div>

              <Link
                href="/admin/users?status=pending"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-700"
              >
                Manage Approvals
              </Link>
            </div>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-slate-400">
                Loading pending registrations...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <FaCheckCircle className="mx-auto text-4xl text-green-400" />

                <h3 className="mt-4 text-lg font-bold">
                  All caught up
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  There are no accounts awaiting approval.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {user.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <RoleBadge role={user.role} />

                      <Link
                        href={`/admin/users?user=${user.user_id}`}
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <h2 className="text-2xl font-bold">
              Account Status
            </h2>

            <div className="mt-6 space-y-4">
              <StatusSummary
                icon={<FaCheckCircle />}
                label="Approved"
                value={statistics.approved}
                className="text-green-400"
              />

              <StatusSummary
                icon={<FaClock />}
                label="Pending"
                value={statistics.pending}
                className="text-yellow-400"
              />

              <StatusSummary
                icon={<FaExclamationTriangle />}
                label="Restricted"
                value={statistics.restricted}
                className="text-red-400"
              />
            </div>

            <Link
              href="/admin/users"
              className="mt-7 block rounded-xl border border-white/10 px-5 py-3 text-center font-semibold text-slate-300 transition hover:bg-white/5"
            >
              View All Users
            </Link>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-2xl text-red-400">
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-4xl font-bold">
        {value}
      </p>
    </div>
  );
}

function StatusSummary({
  icon,
  label,
  value,
  className,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div
        className={`flex items-center gap-3 ${className}`}
      >
        {icon}

        <span className="font-medium text-slate-300">
          {label}
        </span>
      </div>

      <span className="text-xl font-bold">
        {value}
      </span>
    </div>
  );
}

function RoleBadge({ role }) {
  const examiner =
    role?.toLowerCase() === "examiner";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        examiner
          ? "bg-purple-500/15 text-purple-300"
          : "bg-blue-500/15 text-blue-300"
      }`}
    >
      {role}
    </span>
  );
}