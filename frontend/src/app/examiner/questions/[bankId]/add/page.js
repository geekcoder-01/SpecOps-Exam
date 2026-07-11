"use client";

import { use, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuestionBuilder from "@/components/questions/QuestionBuilder";
import api from "@/services/api";

export default function AddQuestionPage({ params }) {
  const { bankId } = use(params);

  const [library, setLibrary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [bankId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/examiner/login";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [libraryResponse, subjectsResponse] = await Promise.all([
        api.get(`/question-libraries/${bankId}`, { headers }),
        api.get(`/question-libraries/${bankId}/subjects`, { headers }),
      ]);

      setLibrary(libraryResponse.data);
      setSubjects(subjectsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/examiner/login";
        return;
      }

      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading Question Builder...
      </div>
    );
  }

  if (!library) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Question library not found.
      </div>
    );
  }

  return (
    <DashboardLayout role="Examiner" title="Add Question">
      <QuestionBuilder
        bankId={Number(bankId)}
        library={library}
        subjects={subjects}
      />
    </DashboardLayout>
  );
}