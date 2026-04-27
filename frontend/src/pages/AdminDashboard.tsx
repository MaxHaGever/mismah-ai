import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import axios from "../lib/axios";
import {
  TrashIcon,
  DocumentSearchIcon,
} from "@heroicons/react/outline";

interface AdminUser {
  _id: string;
  email: string;
  companyName?: string;
  isAdmin: boolean;
  hasAcceptedTerms?: boolean;
  authProvider?: "local" | "google";
  monthlyDocumentLimit?: number;
  usedThisMonth?: number;
  documentsLeft?: number;
}

interface ReportLog {
  _id: string;
  user: { email: string };
  type: string;
  prompt: string;
  createdAt: string;
  pdfUrl?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const staticBaseUrl = import.meta.env.VITE_STATIC_URL?.replace(/\/+$/, "") || "";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showReports, setShowReports] = useState(false);
  const [quotaDrafts, setQuotaDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/admin/users");
      setUsers(Array.isArray(res.data.users) ? res.data.users : res.data);
    } catch {
      setError("שגיאה בטעינת המשתמשים");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get("/admin/reports");
      setReports(res.data.reports || []);
    } catch {
      alert("שגיאה בטעינת הדוחות");
    }
  };

  const updateQuota = async (id: string) => {
    const rawValue = quotaDrafts[id];
    const monthlyDocumentLimit = Number(rawValue);

    if (!Number.isInteger(monthlyDocumentLimit) || monthlyDocumentLimit < 1) {
      return alert("יש להזין מכסה חודשית חוקית");
    }

    try {
      await axios.patch(`/admin/users/${id}/quota`, { monthlyDocumentLimit });
      fetchUsers();
    } catch {
      alert("שגיאה בעדכון מכסת המסמכים");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("אתה בטוח שברצונך למחוק משתמש זה?")) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch {
      alert("שגיאה במחיקת המשתמש");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) return alert("אימייל לא תקין");
    try {
      await axios.post("/admin/users/invite", { email: inviteEmail });
      alert("המשתמש הוזמן והאימייל נשלח");
      setInviteEmail("");
      fetchUsers();
    } catch {
      alert("שגיאה בשליחת הזמנה");
    }
  };

  const handleToggleReports = () => {
    setShowReports(!showReports);
    if (!reports.length) fetchReports();
  };

  if (user === null) return null; 

  if (!user.isAdmin) return <Navigate to="/documents" replace />;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-100 dark:bg-slate-900" dir="rtl">
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 p-6 rounded shadow space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">לוח ניהול</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          חשבון האדמין היחיד במערכת הוא {user.email}.
        </p>

        {/* Invite User */}
        <div className="flex gap-3 items-center">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="הזן אימייל להזמנה"
            className="flex-1 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600"
          />
          <button
            onClick={handleInvite}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md"
          >
            הזמן משתמש
          </button>
        </div>

        {/* Users Table */}
        {loading && <p className="text-gray-500 dark:text-gray-300">טוען משתמשים...</p>}
        {error && <p className="text-red-500 bg-red-100 py-2 px-3 rounded">{error}</p>}

        {!loading && users.length > 0 && (
          <table className="w-full text-sm border-collapse mt-4">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 text-right">
                <th className="p-2 border">אימייל</th>
                <th className="p-2 border">חברה</th>
                <th className="p-2 border">סוג התחברות</th>
                <th className="p-2 border">אדמין</th>
                <th className="p-2 border">הסכים לתנאים</th>
                <th className="p-2 border">השימוש החודש</th>
                <th className="p-2 border">נותרו</th>
                <th className="p-2 border">מכסה חודשית</th>
                <th className="p-2 border">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t text-right">
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.companyName || "—"}</td>
                  <td className="p-2 border">{u.authProvider === "google" ? "Google" : "סיסמה"}</td>
                  <td className="p-2 border">{u.isAdmin ? "✔️" : "—"}</td>
                  <td className="p-2 border">{u.hasAcceptedTerms ? "✔️" : "—"}</td>
                  <td className="p-2 border">{u.usedThisMonth ?? 0}</td>
                  <td className="p-2 border">{u.documentsLeft ?? (u.monthlyDocumentLimit ?? 5)}</td>
                  <td className="p-2 border">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quotaDrafts[u._id] ?? String(u.monthlyDocumentLimit ?? 5)}
                        onChange={(e) =>
                          setQuotaDrafts((prev) => ({
                            ...prev,
                            [u._id]: e.target.value,
                          }))
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => updateQuota(u._id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        שמור
                      </button>
                    </div>
                  </td>
                  <td className="p-2 border flex gap-2 justify-end">
                    <button
                      onClick={() => remove(u._id)}
                      title="מחק"
                      className="text-red-600 hover:underline text-xs"
                    >
                      <TrashIcon className="h-4 w-4 inline" /> מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Toggle Reports */}
        <div className="text-left pt-4">
          <button
            onClick={handleToggleReports}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            <DocumentSearchIcon className="h-5 w-5" />
            {showReports ? "הסתר דוחות" : "הצג דוחות משתמשים"}
          </button>
        </div>

        {/* Reports List */}
        {showReports && (
          <div className="space-y-4 pt-4">
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">אין דוחות להצגה.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700 text-right">
                    <th className="p-2 border">אימייל</th>
                    <th className="p-2 border">סוג</th>
                    <th className="p-2 border">שאלה</th>
                    <th className="p-2 border">PDF</th>
                    <th className="p-2 border">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((log) => (
                    <tr key={log._id} className="border-t text-right">
                      <td className="p-2 border">{log.user?.email}</td>
                      <td className="p-2 border">{log.type}</td>
                      <td className="p-2 border max-w-xs truncate">{log.prompt}</td>
                      <td className="p-2 border">
                        {log.pdfUrl ? (
<a
  href={log.pdfUrl.startsWith("http") ? log.pdfUrl : `${staticBaseUrl}/${log.pdfUrl.replace(/^\/+/, "")}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:underline"
>
  צפה
</a>

                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 border">
                        {new Date(log.createdAt).toLocaleString("he-IL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
