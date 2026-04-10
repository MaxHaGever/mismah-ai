import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { isAxiosError, type AxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { OfficeBuildingIcon } from "@heroicons/react/outline";
import AuthFrame from "../components/AuthFrame";

export default function ProfileSetupPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const isEditingExistingProfile = Boolean(user?.companyName);
  const frameContext = isEditingExistingProfile ? "app" : "auth";

  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [companyAddress, setCompanyAddress] = useState(user?.companyAddress || "");
  const [companyPhone, setCompanyPhone] = useState(user?.companyPhone || "");
  const [companyPhone2, setCompanyPhone2] = useState(user?.companyPhone2 || "");
  const [companyEmail, setCompanyEmail] = useState(user?.companyEmail || "");
  const [companyWebsite, setCompanyWebsite] = useState(user?.companyWebsite || "");
  const [companyId, setCompanyId] = useState(user?.companyId || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  function isApiError(err: unknown): err is AxiosError<{ error: string }> {
    return isAxiosError(err) && typeof err.response?.data?.error === "string";
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let logoUrl = user?.companyLogo;
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadRes = await axiosInstance.post("/uploads/logo", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        logoUrl = uploadRes.data.url;
      }

      const payload = {
        companyName,
        companyAddress,
        companyPhone,
        companyPhone2,
        companyEmail,
        companyWebsite,
        companyId,
        ...(logoUrl && { companyLogo: logoUrl }),
      };

      const profileRes = await axiosInstance.patch("/update-profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateUser(profileRes.data.user);
      navigate(isEditingExistingProfile ? "/dashboard" : "/documents");
    } catch (err: unknown) {
      setError(isApiError(err) ? err.response!.data.error : "שגיאה בעדכון הפרופיל");
      console.error("Profile update error:", err);
    }
  };

  const fields: [string, string, React.Dispatch<React.SetStateAction<string>>][] = [
    ["שם החברה", companyName, setCompanyName],
    ["כתובת החברה", companyAddress, setCompanyAddress],
    ["טלפון", companyPhone, setCompanyPhone],
    ["טלפון נוסף", companyPhone2, setCompanyPhone2],
    ["אימייל", companyEmail, setCompanyEmail],
    ["אתר אינטרנט", companyWebsite, setCompanyWebsite],
    ["ח.פ.", companyId, setCompanyId],
  ];

  return (
    <AuthFrame
      title="פרטי חברה"
      subtitle={isEditingExistingProfile ? "עדכון פרטי העסק שיופיעו בדוחות." : "ממלאים את פרטי העסק כדי להתחיל ליצור דוחות."}
      icon={<OfficeBuildingIcon className="h-6 w-6" />}
      mode="compact"
      context={frameContext}
      homeTo="/dashboard"
      footer={
        <div className="flex justify-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="font-medium text-cyan-700 hover:underline"
          >
            חזרה
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map(([label, value, setter], idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          ))}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              לוגו חברה (אופציונלי)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {isEditingExistingProfile ? "שמור פרטים" : "שמור והמשך"}
          </button>
        </form>
      </div>
    </AuthFrame>
  );
}
