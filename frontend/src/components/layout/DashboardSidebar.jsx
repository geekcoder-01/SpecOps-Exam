"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaBookOpen,
  FaClipboardList,
  FaUsers,
  FaChartLine,
  FaUser,
  FaSignOutAlt,
  FaBullseye,
  FaEye,
  FaBrain,
  FaFileAlt,
  FaCog,
  FaLayerGroup,
} from "react-icons/fa";

const menus = {
  Student: [
    {
      name: "Dashboard",
      icon: <FaHome />,
      path: "/student/dashboard",
    },
    {
      name: "My Exams",
      icon: <FaClipboardList />,
      path: "/student/my-exams",
    },
    {
      name: "Mock Tests",
      icon: <FaBullseye />,
      path: "/student/mock-tests",
    },
    {
      name: "Performance",
      icon: <FaChartLine />,
      path: "/student/performance",
    },
    {
      name: "Results",
      icon: <FaFileAlt />,
      path: "/student/results",
    },
    {
      name: "Profile",
      icon: <FaUser />,
      path: "/student/profile",
    },
  ],

  Examiner: [
    {
      name: "Dashboard",
      icon: <FaHome />,
      path: "/examiner/dashboard",
    },
    {
      name: "Question Libraries",
      icon: <FaBookOpen />,
      path: "/examiner/questions",
    },
    {
      name: "Exams",
      icon: <FaClipboardList />,
      path: "/examiner/exams",
    },
    {
      name: "Mock Tests",
      icon: <FaBullseye />,
      path: "/examiner/mock-tests",
    },
    {
      name: "Students",
      icon: <FaUsers />,
      path: "/examiner/students",
    },
    {
      name: "Assign Exams",
      icon: <FaLayerGroup />,
      path: "/examiner/assignments",
    },
    {
      name: "Live Monitoring",
      icon: <FaEye />,
      path: "/examiner/monitoring",
    },
    {
      name: "AI Evaluation",
      icon: <FaBrain />,
      path: "/examiner/evaluation",
    },
    {
      name: "Results",
      icon: <FaChartLine />,
      path: "/examiner/results",
    },
    {
      name: "Profile",
      icon: <FaUser />,
      path: "/examiner/profile",
    },
  ],

  Admin: [
    {
      name: "Dashboard",
      icon: <FaHome />,
      path: "/admin/dashboard",
    },
    {
      name: "Users",
      icon: <FaUsers />,
      path: "/admin/users",
    },
    {
      name: "Reports",
      icon: <FaChartLine />,
      path: "/admin/reports",
    },
    {
      name: "Settings",
      icon: <FaCog />,
      path: "/admin/settings",
    },
    {
      name: "Profile",
      icon: <FaUser />,
      path: "/admin/profile",
    },
  ],
};

export default function DashboardSidebar({ role = "Student" }) {
  const pathname = usePathname();
  const roleMenu = menus[role] || menus.Student;

  const logout = () => {
    localStorage.clear();

    const loginPath =
      role.toLowerCase() === "examiner"
        ? "/examiner/login"
        : role.toLowerCase() === "admin"
        ? "/admin/login"
        : "/student/login";

    window.location.href = loginPath;
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#020617] p-5 text-white">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold">
          S
        </div>

        <div>
          <h1 className="text-xl font-bold text-blue-400">
            SpecOps Exam
          </h1>

          <p className="text-xs text-slate-500">{role} Portal</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {roleMenu.map((item) => {
          const active =
            pathname === item.path ||
            pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? role === "Examiner"
                    ? "bg-purple-600 text-white"
                    : role === "Admin"
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-5 flex w-full items-center gap-3 rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
      >
        <FaSignOutAlt />
        Logout
      </button>
    </aside>
  );
}