"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUserShield,
  FaUsersCog,
  FaChartLine,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import api from "@/services/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Enter your email and password");
      return;
    }

    try {
      setLoading(true);

      const loginResponse = await api.post(
        "/auth/login",
        {
          email: form.email.trim(),
          password: form.password,
        }
      );

      const token =
        loginResponse.data.access_token;

      const userResponse = await api.get(
        "/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = userResponse.data;

      if (user.role?.toLowerCase() !== "admin") {
        toast.error(
          "This account does not have administrator access"
        );
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      toast.success("Administrator login successful");

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 600);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Administrator login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Toaster position="top-right" />

      <div className="grid min-h-screen md:grid-cols-2">
        <section className="hidden flex-col justify-center bg-gradient-to-br from-red-950 via-slate-950 to-purple-950 p-12 md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
              <FaShieldAlt />
            </div>

            <h1 className="text-3xl font-bold text-red-400">
              SpecOps Exam
            </h1>
          </div>

          <h2 className="max-w-xl text-5xl font-extrabold leading-tight">
            System Administration Portal
          </h2>

          <p className="mt-5 max-w-lg text-slate-300">
            Verify accounts, manage users, monitor
            examinations, and maintain the security of the
            examination platform.
          </p>

          <div className="mt-10 grid max-w-lg gap-4">
            <InfoCard
              icon={<FaUserShield />}
              title="Account Verification"
              text="Approve or reject new Student and Examiner registrations."
            />

            <InfoCard
              icon={<FaUsersCog />}
              title="User Management"
              text="Suspend, reactivate, and manage platform accounts."
            />

            <InfoCard
              icon={<FaChartLine />}
              title="System Monitoring"
              text="Monitor users, examinations, and platform activity."
            />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">
                Admin Login
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Authorized administrators only
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Email Address
                </span>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  Password
                </span>

                <div className="relative">
                  <input
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 outline-none transition focus:border-red-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Login as Administrator"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Administrator registration is disabled for
              security.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 text-2xl text-red-400">
        {icon}
      </div>

      <h3 className="font-bold">{title}</h3>

      <p className="mt-1 text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}