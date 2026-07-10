"use client";

import { useEffect, useState } from "react";
import {
  FaCamera,
  FaEnvelope,
  FaIdCard,
  FaLock,
  FaPhone,
  FaSave,
  FaUser,
  FaUserShield,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";

const emptyPasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export default function UserProfile({ expectedRole }) {
  const [user, setUser] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    department: "",
    semester: "",
    designation: "",
  });

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  const loadProfile = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        redirectToLogin();
        return;
      }

      const response = await api.get("/profile/me", {
        headers: getHeaders(),
      });

      const profile = response.data;

      if (
        expectedRole &&
        profile.role?.toLowerCase() !== expectedRole.toLowerCase()
      ) {
        localStorage.clear();
        redirectToLogin();
        return;
      }

      setUser(profile);

      setProfileForm({
        name: profile.name || "",
        phone: profile.phone || "",
        department: profile.department || "",
        semester: profile.semester || "",
        designation: profile.designation || "",
      });

      localStorage.setItem("user", JSON.stringify(profile));
      localStorage.setItem("role", profile.role);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        redirectToLogin();
        return;
      }

      toast.error(
        error.response?.data?.detail || "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const redirectToLogin = () => {
    const route =
      expectedRole?.toLowerCase() === "examiner"
        ? "/examiner/login"
        : "/student/login";

    window.location.href = route;
  };

  const handleProfileChange = (event) => {
    setProfileForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordChange = (event) => {
    setPasswordForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const updateProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSavingProfile(true);

      await api.put(
        "/profile/update",
        {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim() || null,
          department: profileForm.department.trim() || null,
          semester:
            user.role?.toLowerCase() === "student"
              ? profileForm.semester.trim() || null
              : null,
          designation:
            user.role?.toLowerCase() === "examiner"
              ? profileForm.designation.trim() || null
              : null,
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Profile updated successfully");
      await loadProfile();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      toast.error("Please complete all password fields");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("New password must contain at least 6 characters");
      return;
    }

    if (
      passwordForm.new_password !== passwordForm.confirm_password
    ) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (
      passwordForm.current_password === passwordForm.new_password
    ) {
      toast.error(
        "New password must be different from the current password"
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        "/profile/change-password",
        {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        },
        {
          headers: getHeaders(),
        }
      );

      toast.success("Password changed successfully");
      setPasswordForm(emptyPasswordForm);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isStudent = user.role?.toLowerCase() === "student";

  return (
    <DashboardLayout
      role={user.role}
      title="My Profile"
      user={user.name}
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>

          <p className="mt-2 text-slate-400">
            Manage your personal information and account security.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-center">
              <div className="relative mx-auto h-28 w-28">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-500/30 bg-blue-600/15 text-5xl text-blue-400">
                  <FaUser />
                </div>

                <button
                  type="button"
                  title="Profile image upload will be added later"
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                >
                  <FaCamera />
                </button>
              </div>

              <h2 className="mt-5 text-2xl font-bold">{user.name}</h2>

              <p className="mt-1 text-slate-400">{user.role}</p>

              <span className="mt-4 inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-300">
                {user.roll}
              </span>
            </div>

            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
              <ProfileSummary
                icon={<FaEnvelope />}
                label="Email"
                value={user.email}
              />

              <ProfileSummary
                icon={<FaIdCard />}
                label={isStudent ? "Student ID" : "Examiner ID"}
                value={user.roll}
              />

              <ProfileSummary
                icon={<FaUserShield />}
                label="Role"
                value={user.role}
              />
            </div>
          </aside>

          <section>
            <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
              <TabButton
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
                icon={<FaUser />}
                text="Personal Details"
              />

              <TabButton
                active={activeTab === "password"}
                onClick={() => setActiveTab("password")}
                icon={<FaLock />}
                text="Change Password"
              />
            </div>

            {activeTab === "profile" && (
              <form
                onSubmit={updateProfile}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">
                    Personal Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Email, role, and generated ID cannot be changed.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    required
                  />

                  <InputField
                    label="Phone Number"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter phone number"
                    icon={<FaPhone />}
                  />

                  <InputField
                    label="Department"
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                    placeholder="Enter department"
                  />

                  {isStudent ? (
                    <InputField
                      label="Semester"
                      name="semester"
                      value={profileForm.semester}
                      onChange={handleProfileChange}
                      placeholder="Example: 6th Semester"
                    />
                  ) : (
                    <InputField
                      label="Designation"
                      name="designation"
                      value={profileForm.designation}
                      onChange={handleProfileChange}
                      placeholder="Example: Assistant Professor"
                    />
                  )}

                  <ReadOnlyField
                    label="Email Address"
                    value={user.email}
                  />

                  <ReadOnlyField
                    label={isStudent ? "Student ID" : "Examiner ID"}
                    value={user.roll}
                  />

                  <ReadOnlyField label="Role" value={user.role} />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="mt-7 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaSave />

                  {savingProfile
                    ? "Saving Changes..."
                    : "Save Profile"}
                </button>
              </form>
            )}

            {activeTab === "password" && (
              <form
                onSubmit={changePassword}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">
                    Change Password
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Use a strong password that you do not use elsewhere.
                  </p>
                </div>

                <div className="max-w-xl space-y-5">
                  <PasswordField
                    label="Current Password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                  />

                  <PasswordField
                    label="New Password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                  />

                  <PasswordField
                    label="Confirm New Password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="mt-7 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaLock />

                  {changingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, icon, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-blue-500"
      />
    </label>
  );
}

function PasswordField({ label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-purple-500"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-400">
        {label}
      </p>

      <div className="rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3 text-slate-500">
        {value || "Not available"}
      </div>
    </div>
  );
}

function ProfileSummary({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-blue-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm text-slate-300">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}