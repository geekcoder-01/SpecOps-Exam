"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  FaBan,
  FaCheck,
  FaClock,
  FaSearch,
  FaTimes,
  FaUndo,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  { value: "student", label: "Students" },
  { value: "examiner", label: "Examiners" },
];

export default function AdminUsersPage() {
  const searchParams = useSearchParams();

  const requestedStatus =
    searchParams.get("status") || "all";

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState(
      STATUS_FILTERS.some(
        (item) => item.value === requestedStatus
      )
        ? requestedStatus
        : "all"
    );

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState(null);

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
          "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (
    user,
    status
  ) => {
    let reason = null;

    if (status === "rejected") {
      reason = window.prompt(
        `Enter the rejection reason for ${user.name}:`
      );

      if (!reason?.trim()) {
        toast.error(
          "A rejection reason is required"
        );
        return;
      }
    }

    if (status === "suspended") {
      reason = window.prompt(
        `Enter the suspension reason for ${user.name}:`,
        "Account suspended by administrator"
      );

      if (reason === null) {
        return;
      }
    }

    const actions = {
      approved: "approve",
      rejected: "reject",
      suspended: "suspend",
      pending: "return to pending",
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${
        actions[status]
      } ${user.name}'s account?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(user.user_id);

      await api.patch(
        `/users/${user.user_id}/status`,
        {
          status,
          reason:
            reason?.trim() || null,
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success(
        `Account ${status} successfully`
      );

      await loadUsers();
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
          "Unable to update the account"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const role =
        user.role?.toLowerCase() || "";

      const status =
        user.status?.toLowerCase() || "";

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.roll?.toLowerCase().includes(query) ||
        user.department
          ?.toLowerCase()
          .includes(query);

      return (
        matchesRole &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  return (
    <DashboardLayout
      role="Admin"
      title="User Management"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-3xl font-bold">
            Account Approvals
          </h1>

          <p className="mt-2 text-slate-400">
            Verify new registrations and manage existing
            platform accounts.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-lg">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, email, ID, or department..."
                className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 outline-none transition focus:border-red-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-red-500"
              >
                {ROLE_FILTERS.map((filter) => (
                  <option
                    key={filter.value}
                    value={filter.value}
                  >
                    {filter.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-red-500"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option
                    key={filter.value}
                    value={filter.value}
                  >
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
            <span>
              Showing {filteredUsers.length} of{" "}
              {users.length} accounts
            </span>

            <button
              type="button"
              onClick={loadUsers}
              className="rounded-lg border border-white/10 px-3 py-2 transition hover:bg-white/5 hover:text-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
              Loading user accounts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-400">
              No matching user accounts found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.user_id}
                  user={user}
                  processing={
                    processingId === user.user_id
                  }
                  onStatusChange={
                    updateUserStatus
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function UserCard({
  user,
  processing,
  onStatusChange,
}) {
  const status =
    user.status?.toLowerCase() || "pending";

  const role =
    user.role?.toLowerCase() || "";

  const isAdmin = role === "admin";

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
              role === "examiner"
                ? "bg-purple-500/15 text-purple-300"
                : role === "student"
                ? "bg-blue-500/15 text-blue-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {role === "examiner" ? (
              <FaUserShield />
            ) : (
              <FaUserGraduate />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">
                {user.name}
              </h2>

              <RoleBadge role={user.role} />

              <StatusBadge status={status} />
            </div>

            <p className="mt-1 break-all text-sm text-slate-400">
              {user.email}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span>ID: {user.roll}</span>

              {user.department && (
                <span>
                  Department: {user.department}
                </span>
              )}

              <span>
                Registered:{" "}
                {formatDate(user.created_at)}
              </span>
            </div>

            {user.rejection_reason && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {user.rejection_reason}
              </div>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="flex flex-wrap gap-2">
            {status === "pending" && (
              <>
                <ActionButton
                  icon={<FaCheck />}
                  label="Approve"
                  className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  disabled={processing}
                  onClick={() =>
                    onStatusChange(
                      user,
                      "approved"
                    )
                  }
                />

                <ActionButton
                  icon={<FaTimes />}
                  label="Reject"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                  disabled={processing}
                  onClick={() =>
                    onStatusChange(
                      user,
                      "rejected"
                    )
                  }
                />
              </>
            )}

            {status === "approved" && (
              <ActionButton
                icon={<FaBan />}
                label="Suspend"
                className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                disabled={processing}
                onClick={() =>
                  onStatusChange(
                    user,
                    "suspended"
                  )
                }
              />
            )}

            {["rejected", "suspended"].includes(
              status
            ) && (
              <>
                <ActionButton
                  icon={<FaCheck />}
                  label="Approve"
                  className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  disabled={processing}
                  onClick={() =>
                    onStatusChange(
                      user,
                      "approved"
                    )
                  }
                />

                <ActionButton
                  icon={<FaUndo />}
                  label="Move to Pending"
                  className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                  disabled={processing}
                  onClick={() =>
                    onStatusChange(
                      user,
                      "pending"
                    )
                  }
                />
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  label,
  className,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      {disabled ? "Processing..." : label}
    </button>
  );
}

function RoleBadge({ role }) {
  const styles = {
    examiner:
      "bg-purple-500/15 text-purple-300",
    student:
      "bg-blue-500/15 text-blue-300",
    admin: "bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[role?.toLowerCase()] ||
        "bg-slate-500/15 text-slate-300"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending:
      "bg-yellow-500/15 text-yellow-300",
    approved:
      "bg-green-500/15 text-green-300",
    rejected:
      "bg-red-500/15 text-red-300",
    suspended:
      "bg-orange-500/15 text-orange-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] ||
        "bg-slate-500/15 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleDateString();
}