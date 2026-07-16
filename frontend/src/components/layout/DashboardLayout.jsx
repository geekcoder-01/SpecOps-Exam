"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardNavbar from "./DashboardNavbar";
import api from "@/services/api";

export default function DashboardLayout({
  role,
  title,
  children,
}) {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    loadLoggedInUser();
  }, []);

  const loadLoggedInUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        redirectToLogin();
        return;
      }

      const response = await api.get("/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data;

      if (
        role &&
        profile.role?.toLowerCase() !== role.toLowerCase()
      ) {
        localStorage.clear();
        redirectToLogin();
        return;
      }

      setLoggedInUser(profile);

      localStorage.setItem("user", JSON.stringify(profile));
      localStorage.setItem("role", profile.role);
    } catch (error) {
      console.error("Unable to load logged-in user:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.clear();
        redirectToLogin();
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const redirectToLogin = () => {
    const loginPath =
      role?.toLowerCase() === "examiner"
        ? "/examiner/login"
        : role?.toLowerCase() === "admin"
        ? "/admin/login"
        : "/student/login";

    window.location.href = loginPath;
  };

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading dashboard...
      </main>
    );
  }

  if (!loggedInUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <DashboardSidebar role={loggedInUser.role} />

      <DashboardNavbar
        title={title}
        user={loggedInUser}
      />

      <section className="ml-64 pt-20">
        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}