"use client";

import Link from "next/link";
import {
  FaBell,
  FaChevronDown,
  FaUserCircle,
} from "react-icons/fa";

export default function DashboardNavbar({
  title = "Dashboard",
  user,
}) {
  const role = user?.role || "User";
  const userName = user?.name || role;

  const profilePath =
    role.toLowerCase() === "examiner"
      ? "/examiner/profile"
      : role.toLowerCase() === "admin"
      ? "/admin/profile"
      : "/student/profile";

  return (
    <header className="fixed left-64 right-0 top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#020617]/90 px-8 text-white backdrop-blur-md">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>

        <p className="text-sm text-slate-400">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          className="relative rounded-xl border border-white/10 p-3 text-slate-300 transition hover:border-blue-500/40 hover:text-blue-400"
          aria-label="Notifications"
        >
          <FaBell />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <Link
          href={profilePath}
          className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-white/10 hover:bg-white/5"
        >
          <FaUserCircle className="text-3xl text-blue-400" />

          <div className="hidden text-left sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-white">
              {userName}
            </p>

            <p className="text-xs text-slate-400">
              {role}
            </p>
          </div>

          <FaChevronDown className="text-xs text-slate-500" />
        </Link>
      </div>
    </header>
  );
}