"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaSave,
  FaShieldAlt,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

const initialForm = {
  exam_name: "",
  exam_type: "regular",
  subject: "",
  instructions: "",

  duration: 60,
  start_time: "",
  end_time: "",

  total_marks: 0,
  passing_marks: 0,
  negative_marks: 0,

  randomize_questions: false,
  randomize_options: false,
  allow_calculator: false,

  require_fullscreen: true,
  browser_lock_enabled: true,

  camera_required: true,
  microphone_required: false,

  face_detection_enabled: true,
  multiple_face_detection_enabled: true,
  mobile_detection_enabled: true,
  tab_switch_detection_enabled: true,
  audio_detection_enabled: false,
};

export default function CreateExamPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/examiner/login";
  };

  const createExam = async (event) => {
    event.preventDefault();

    if (!form.exam_name.trim()) {
      toast.error("Exam name is required");
      return;
    }

    if (!form.start_time || !form.end_time) {
      toast.error("Start and end times are required");
      return;
    }

    const startTime = new Date(form.start_time);
    const endTime = new Date(form.end_time);

    if (endTime <= startTime) {
      toast.error(
        "End time must be later than start time"
      );
      return;
    }

    if (
      Number(form.total_marks) > 0 &&
      Number(form.passing_marks) >
        Number(form.total_marks)
    ) {
      toast.error(
        "Passing marks cannot exceed total marks"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/exam/create",
        {
          exam_name: form.exam_name.trim(),
          exam_type: form.exam_type,

          subject: form.subject.trim() || null,
          instructions:
            form.instructions.trim() || null,

          duration: Number(form.duration),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),

          total_marks: Number(form.total_marks),
          passing_marks: Number(
            form.passing_marks
          ),
          negative_marks: Number(
            form.negative_marks
          ),

          randomize_questions:
            form.randomize_questions,
          randomize_options:
            form.randomize_options,
          allow_calculator:
            form.allow_calculator,

          require_fullscreen:
            form.require_fullscreen,
          browser_lock_enabled:
            form.browser_lock_enabled,

          camera_required:
            form.camera_required,
          microphone_required:
            form.microphone_required,

          face_detection_enabled:
            form.face_detection_enabled,
          multiple_face_detection_enabled:
            form.multiple_face_detection_enabled,
          mobile_detection_enabled:
            form.mobile_detection_enabled,
          tab_switch_detection_enabled:
            form.tab_switch_detection_enabled,
          audio_detection_enabled:
            form.audio_detection_enabled,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      toast.success("Draft exam created successfully");

      router.push(
        `/examiner/exams/${response.data.exam_id}`
      );
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Unable to create the exam"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="Examiner"
      title="Create Exam"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl">
        <Link
          href="/examiner/exams"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <FaArrowLeft />
          Back to Exams
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Create New Exam
          </h1>

          <p className="mt-2 text-slate-400">
            Create the initial draft. Sections and questions
            will be configured after saving.
          </p>
        </div>

        <form
          onSubmit={createExam}
          className="mt-8 space-y-7"
        >
          <FormSection
            icon={<FaSave />}
            title="Basic Details"
            description="General information that identifies the examination."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Exam Name"
                name="exam_name"
                value={form.exam_name}
                onChange={handleChange}
                placeholder="Example: Java End Semester Examination"
                required
              />

              <SelectField
                label="Exam Type"
                name="exam_type"
                value={form.exam_type}
                onChange={handleChange}
              >
                <option value="regular">
                  Regular Exam
                </option>
                <option value="competitive">
                  Competitive Exam
                </option>
                <option value="entrance">
                  Entrance Exam
                </option>
                <option value="placement">
                  Placement Assessment
                </option>
                <option value="mock">
                  Mock Test
                </option>
              </SelectField>

              <InputField
                label="Primary Subject (Optional)"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Multi-subject exams will use sections"
              />

              <InputField
                label="Duration in Minutes"
                name="duration"
                type="number"
                min="1"
                max="1440"
                value={form.duration}
                onChange={handleChange}
                required
              />

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Instructions
                </span>

                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  placeholder="Enter exam rules and instructions..."
                  className="min-h-40 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none transition focus:border-purple-500"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={<FaCalendarAlt />}
            title="Schedule"
            description="Control when students can access the examination."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Start Time"
                name="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={handleChange}
                required
              />

              <InputField
                label="End Time"
                name="end_time"
                type="datetime-local"
                value={form.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection
            icon={<FaClock />}
            title="Marks and Randomization"
            description="Initial marks may later be recalculated from the selected questions."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <InputField
                label="Total Marks"
                name="total_marks"
                type="number"
                min="0"
                step="0.5"
                value={form.total_marks}
                onChange={handleChange}
              />

              <InputField
                label="Passing Marks"
                name="passing_marks"
                type="number"
                min="0"
                step="0.5"
                value={form.passing_marks}
                onChange={handleChange}
              />

              <InputField
                label="Negative Marks"
                name="negative_marks"
                type="number"
                min="0"
                step="0.25"
                value={form.negative_marks}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <ToggleField
                label="Shuffle Questions"
                name="randomize_questions"
                checked={form.randomize_questions}
                onChange={handleChange}
              />

              <ToggleField
                label="Shuffle MCQ Options"
                name="randomize_options"
                checked={form.randomize_options}
                onChange={handleChange}
              />

              <ToggleField
                label="Allow Calculator"
                name="allow_calculator"
                checked={form.allow_calculator}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          <FormSection
            icon={<FaShieldAlt />}
            title="Security and AI Proctoring"
            description="These settings will control the live examination environment."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ToggleField
                label="Require Fullscreen"
                name="require_fullscreen"
                checked={form.require_fullscreen}
                onChange={handleChange}
              />

              <ToggleField
                label="Browser Lock"
                name="browser_lock_enabled"
                checked={form.browser_lock_enabled}
                onChange={handleChange}
              />

              <ToggleField
                label="Camera Required"
                name="camera_required"
                checked={form.camera_required}
                onChange={handleChange}
              />

              <ToggleField
                label="Microphone Required"
                name="microphone_required"
                checked={form.microphone_required}
                onChange={handleChange}
              />

              <ToggleField
                label="Face Detection"
                name="face_detection_enabled"
                checked={form.face_detection_enabled}
                onChange={handleChange}
              />

              <ToggleField
                label="Multiple Face Detection"
                name="multiple_face_detection_enabled"
                checked={
                  form.multiple_face_detection_enabled
                }
                onChange={handleChange}
              />

              <ToggleField
                label="Mobile Detection"
                name="mobile_detection_enabled"
                checked={form.mobile_detection_enabled}
                onChange={handleChange}
              />

              <ToggleField
                label="Tab Switch Detection"
                name="tab_switch_detection_enabled"
                checked={
                  form.tab_switch_detection_enabled
                }
                onChange={handleChange}
              />

              <ToggleField
                label="Audio Detection"
                name="audio_detection_enabled"
                checked={form.audio_detection_enabled}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-7 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSave />
              {saving
                ? "Creating Exam..."
                : "Create Draft Exam"}
            </button>

            <Link
              href="/examiner/exams"
              className="rounded-xl border border-white/10 px-7 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl text-purple-300">
          {icon}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-7">{children}</div>
    </section>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type={type}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
      >
        {children}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  name,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
      <span className="text-sm font-medium text-slate-200">
        {label}
      </span>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-purple-600"
      />
    </label>
  );
}