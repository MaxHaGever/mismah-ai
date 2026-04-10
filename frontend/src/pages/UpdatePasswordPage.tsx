import React, { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { isAxiosError, type AxiosError } from "axios";
import { useAuth } from "../hooks/useAuth";
import { KeyIcon } from "@heroicons/react/outline";
import AuthFrame from "../components/AuthFrame";

export default function UpdatePasswordPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const returnTo = useMemo(
    () => (typeof location.state?.from === "string" ? location.state.from : "/dashboard"),
    [location.state]
  );
  const frameContext = returnTo === "/dashboard" ? "app" : "auth";
  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.authProvider === "google") {
    return <Navigate to={returnTo} replace />;
  }

  function isApiError(err: unknown): err is AxiosError<{ error: string }> {
    return isAxiosError(err) && typeof err.response?.data?.error === "string";
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (newPassword !== confirmPassword) {
    setError("הסיסמאות החדשות לא תואמות");
    return;
  }

  setLoading(true);
  try {
    await axiosInstance.patch(
      "/update-password",
      { oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSuccess("הסיסמה עודכנה בהצלחה!");
    const refreshedUser = await refreshUser();

    setTimeout(() => {
      if (!refreshedUser) {
        navigate("/login", { replace: true });
      } else if (!refreshedUser.hasAcceptedTerms) {
        navigate("/terms", { replace: true });
      } else if (!refreshedUser.companyName) {
        navigate("/setup-profile", { replace: true });
      } else {
        navigate(returnTo, { replace: true });
      }
    }, 1000);
  } catch (err: unknown) {
    setError(
      isApiError(err) ? err.response!.data.error : "שגיאה בעדכון הסיסמה"
    );
    console.error("Update password error:", err);
  } finally {
    setLoading(false);
  }
};


  return (
    <AuthFrame
      title="עדכון סיסמה"
      subtitle="עדכון סיסמה פשוט, בלי מסלולי משנה מיותרים."
      icon={<KeyIcon className="h-6 w-6" />}
      mode="compact"
      context={frameContext}
      homeTo={returnTo}
      footer={
        <div className="flex justify-center text-sm">
          <button
            type="button"
            onClick={() => navigate(returnTo, { replace: true })}
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
        {success && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">סיסמה נוכחית</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">אשר סיסמה חדשה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "שומר..." : "עדכן סיסמה"}
          </button>
        </form>
      </div>
    </AuthFrame>
  );
}
