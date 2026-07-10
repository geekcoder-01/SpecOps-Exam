"use client";

import { use, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FaCamera,
  FaMicrophone,
  FaDesktop,
  FaWifi,
  FaCheckCircle,
} from "react-icons/fa";

export default function VerificationPage({ params }) {
  const { examId } = use(params);

  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [internet, setInternet] = useState(navigator.onLine);

  useEffect(() => {
    checkDevices();

    const online = () => setInternet(true);
    const offline = () => setInternet(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  async function checkDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setCamera(true);
      setMicrophone(true);
    } catch (err) {
      console.log(err);
    }
  }

  async function enableFullscreen() {
    await document.documentElement.requestFullscreen();
    setFullscreen(true);
  }

  const allVerified =
    camera &&
    microphone &&
    fullscreen &&
    internet;

  return (
    <DashboardLayout
      role="Student"
      title="AI Verification"
      user="Student"
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <h1 className="text-3xl font-bold mb-2">
          AI Verification
        </h1>

        <p className="text-slate-400 mb-8">
          Complete all checks before entering the secure examination.
        </p>

        <div className="space-y-5">

          <Status
            icon={<FaCamera />}
            title="Camera"
            status={camera}
          />

          <Status
            icon={<FaMicrophone />}
            title="Microphone"
            status={microphone}
          />

          <Status
            icon={<FaWifi />}
            title="Internet Connection"
            status={internet}
          />

          <Status
            icon={<FaDesktop />}
            title="Fullscreen Mode"
            status={fullscreen}
          />

        </div>

        {!fullscreen && (

          <button
            onClick={enableFullscreen}
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Enable Fullscreen
          </button>

        )}

        {allVerified && (

          <button
            onClick={() =>
              window.location.href =
                `/student/my-exams/${examId}/countdown`
            }
            className="mt-8 ml-4 rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-700"
          >
            Continue
          </button>

        )}

      </div>
    </DashboardLayout>
  );
}

function Status({ icon, title, status }) {

  return (

    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-5">

      <div className="flex items-center gap-4">

        <div className="text-blue-400 text-2xl">
          {icon}
        </div>

        <span>{title}</span>

      </div>

      {status ? (

        <div className="flex items-center gap-2 text-green-400">

          <FaCheckCircle />

          Verified

        </div>

      ) : (

        <span className="text-red-400">
          Pending
        </span>

      )}

    </div>

  );
}