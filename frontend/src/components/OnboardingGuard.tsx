import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.hasAcceptedTerms) {
    return <Navigate to="/terms" replace />;
  }

  if (!user.companyName) {
    return <Navigate to="/setup-profile" replace />;
  }

  return <>{children}</>;
}
