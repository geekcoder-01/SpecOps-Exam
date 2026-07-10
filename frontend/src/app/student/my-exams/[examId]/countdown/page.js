"use client";

import { use, useEffect, useState } from "react";
import { FaCheckCircle, FaShieldAlt } from "react-icons/fa";

export default function CountdownPage({ params }) {
  const { examId } = use(params);
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count === 0) {
      window.location.href = `/student/my-exams/${examId}/live`;
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, examId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-600/20 text-4xl text-green-400">
          <FaShieldAlt />
        </div>

        <h1 className="text-4xl font-bold">AI Verification Completed</h1>

        <div className="mt-6 space-y-3 text-slate-300">
          <p className="flex items-center justify-center gap-2">
            <FaCheckCircle className="text-green-400" /> Camera Verified
          </p>
          <p className="flex items-center justify-center gap-2">
            <FaCheckCircle className="text-green-400" /> Microphone Verified
          </p>
          <p className="flex items-center justify-center gap-2">
            <FaCheckCircle className="text-green-400" /> Fullscreen Enabled
          </p>
          <p className="flex items-center justify-center gap-2">
            <FaCheckCircle className="text-green-400" /> AI Monitoring Active
          </p>
        </div>

        <p className="mt-8 text-slate-400">Your exam will begin in</p>

        <div className="mt-4 text-8xl font-extrabold text-blue-400">
          {count}
        </div>

        <p className="mt-6 text-sm text-red-300">
          Do not switch tabs, minimize the browser, or exit fullscreen.
        </p>
      </div>
    </main>
  );
}