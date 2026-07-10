"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api from "@/services/api";

export default function Register() {
  const router = useRouter();

const [form, setForm] = useState({
  name: "",
  email: "",
  password: "",
  role: "Student",
});

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", form);

      toast.success("Account created successfully");

      setTimeout(() => {
        if (form.role === "Student") {
          router.push("/student/login");
        } else {
          router.push("/examiner/login");
        }
      }, 800);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
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
            <h1 className="text-3xl font-bold text-blue-400">SpecOps Exam</h1>
          </div>

          <h2 className="max-w-xl text-5xl font-extrabold leading-tight">
            Create Your Secure Exam Account
          </h2>

          <p className="mt-5 max-w-lg text-slate-300">
            Register as a Student or Examiner. Admin registration is disabled for security.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">Create Account</h2>
              <p className="mt-2 text-sm text-slate-400">
                Register to access SpecOps Exam
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
              />

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="Student">Student</option>
                <option value="Examiner">Examiner</option>
              </select>


              <button
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <a href="/student/login" className="text-blue-400 hover:underline">
                Login
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}