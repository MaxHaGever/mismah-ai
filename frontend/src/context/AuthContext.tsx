import React from "react";

export interface User {
  id: string;
  email: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyPhone2?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyId?: string;
  hasChangedPassword: boolean; 
  hasAcceptedTerms: boolean;  
  isAdmin: boolean;
  authProvider?: "local" | "google";
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error("login not implemented");
  },
  register: async () => {
    throw new Error("register not implemented");
  },
  loginWithGoogle: async () => {
    throw new Error("loginWithGoogle not implemented");
  },
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => null,
});
