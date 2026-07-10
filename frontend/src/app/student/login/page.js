"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaVideo,
  FaMicrophone,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api from "@/services/api";

export default function StudentLogin() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const loginResponse = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const token = loginResponse.data.access_token;

      const userResponse = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const loggedInUser = userResponse.data;

      if (loggedInUser.role?.toLowerCase() !== "student") {
        toast.error("This account is not registered");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", loggedInUser.role);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      toast.success("Student login successful");

      setTimeout(() => {
        router.push("/student/dashboard");
      }, 700);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Toaster position="top-right" />

      <div className="grid min-h-screen md:grid-cols-2">
        <section className="hidden flex-col justify-center bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950 p-12 md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <FaShieldAlt />
            </div>

            <h1 className="text-3xl font-bold text-blue-400">
              SpecOps Exam
            </h1>
          </div>

          <h2 className="max-w-xl text-5xl font-extrabold leading-tight">
            Secure Student Exam Access
          </h2>

          <p className="mt-5 max-w-lg text-slate-300">
            Login to access assigned examinations, complete camera and
            microphone verification, attempt AI-proctored exams, and view your
            performance.
          </p>

          <div className="mt-10 grid max-w-lg gap-4">
            <InfoCard
              icon={<FaVideo />}
              title="Camera Verification"
              text="Webcam access is required before starting an examination."
            />

            <InfoCard
              icon={<FaMicrophone />}
              title="Microphone Check"
              text="Microphone permission must remain enabled during the exam."
            />

            <InfoCard
              icon={<FaShieldAlt />}
              title="AI Monitoring"
              text="Face presence, fullscreen status, and browser activity are monitored."
            />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">Student Login</h2>

              <p className="mt-2 text-sm text-slate-400">
                Continue to your secure student dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Email Address
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 text-white outline-none transition focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login as Student"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              New to SpecOps Exam?{" "}
              <a
                href="/register"
                className="text-blue-400 hover:underline"
              >
                Create account
              </a>
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
      <div className="mb-3 text-2xl text-blue-400">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  );
}