import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import ProfileSetupPage from "./pages/ProfilePageSetup";
import Dashboard from "./pages/Dashboard";
import DocumentMenuPage from "./pages/DocumentMenuPage";
import SimpleDocumentPage from "./pages/SimpleDocumentPage";
import TermsPage from "./pages/TermsPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "./context/AuthProvider";
import "./index.css";
import OnboardingGuard from "./components/OnboardingGuard";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/setup-profile" element={<ProfileSetupPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
  path="/dashboard"
  element={
    <OnboardingGuard>
      <Dashboard />
    </OnboardingGuard>
  }
/>
        <Route
          path="/documents"
          element={
            <OnboardingGuard>
              <DocumentMenuPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/documents/:type"
          element={
            <OnboardingGuard>
              <SimpleDocumentPage />
            </OnboardingGuard>
          }
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/app"
          element={
            <OnboardingGuard>
              <DocumentMenuPage />
            </OnboardingGuard>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}
