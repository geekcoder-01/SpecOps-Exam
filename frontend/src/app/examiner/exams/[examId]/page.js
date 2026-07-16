"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaLayerGroup } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

export default function ExamBuilderPage({ params }) {
  const { examId } = use(params);

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/exam/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      setExam(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to load the exam"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="Examiner"
      title="Exam Builder"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl">
        <Link
          href="/examiner/exams"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <FaArrowLeft />
          Back to Exams
        </Link>

        {loading ? (
          <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
            Loading exam...
          </div>
        ) : exam ? (
          <section className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-8">
            <FaLayerGroup className="text-5xl text-purple-400" />

            <p className="mt-5 text-sm uppercase tracking-wider text-purple-300">
              {exam.status} · {exam.exam_type}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {exam.exam_name}
            </h1>

            <p className="mt-3 text-slate-400">
              The exam foundation is ready. The next step will
              add subject-wise sections and question selection.
            </p>
          </section>
        ) : (
          <div className="mt-7 text-slate-400">
            Exam not found.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}