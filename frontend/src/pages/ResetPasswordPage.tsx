import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/axios';
import { isAxiosError } from 'axios';
import { LockClosedIcon } from '@heroicons/react/outline';
import AuthFrame from '../components/AuthFrame';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('הקישור איפוס הסיסמה אינו תקין או חסר');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/reset-password', {
        token,
        password,
      });
      setMessage('הסיסמא עודכנה, מועבר להתחברות');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      let errMsg = 'שגיאה באיפוס הסיסמה';
      if (isAxiosError(err) && err.response?.data?.error) {
        const srv = err.response.data.error;
        if (srv === 'Token and password are required') {
          errMsg = 'יש לצרף טוקן וסיסמה';
        } else if (srv === 'Invalid or expired reset token') {
          errMsg = 'הקישור פג תוקף או אינו תקין';
        } else if (srv === 'User not found') {
          errMsg = 'המשתמש לא נמצא';
        } else if (srv === 'Password too short') {
          errMsg = 'הסיסמה קצרה מדי (לפחות 8 תווים)';
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <AuthFrame
        title="איפוס סיסמה"
        subtitle="הקישור חסר או לא תקין, ולכן לא ניתן להמשיך."
        icon={<LockClosedIcon className="h-6 w-6" />}
        mode="compact"
        stepLabels={["התחברות", "איפוס", "דשבורד", "פרופיל", "המשך עבודה"]}
        currentStep={1}
      >
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
          {error}
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="איפוס סיסמה"
      subtitle="הזן סיסמה חדשה לקישור האיפוס שנשלח אליך."
      icon={<LockClosedIcon className="h-6 w-6" />}
      footer={
        <p className="text-center text-sm text-slate-500">
          לאחר האיפוס נשלח אותך אוטומטית למסך ההתחברות.
        </p>
      }
    >
      <div className="space-y-5">
        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">אישור סיסמה</label>
              <input
                type="password"
                value={confirm}
                dir="ltr"
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'שולח…' : 'אפס סיסמה'}
            </button>
          </form>
        )}
      </div>
    </AuthFrame>
  );
}
