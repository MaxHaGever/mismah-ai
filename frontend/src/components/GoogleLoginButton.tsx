import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number>
          ) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onCredential: (credential: string) => void;
}

export default function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    clientId ? "loading" : "missing"
  );

  useEffect(() => {
    if (!clientId) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    const renderButton = () => {
      const googleAccounts = window.google?.accounts?.id;

      if (!googleAccounts || !containerRef.current) {
        return false;
      }

      containerRef.current.innerHTML = "";
      googleAccounts.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
        ux_mode: "popup",
      });

      googleAccounts.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
        shape: "pill",
        width: 320,
        logo_alignment: "left",
      });
      setStatus("ready");
      return true;
    };

    if (renderButton()) {
      return () => {
        cancelled = true;
      };
    }

    intervalId = window.setInterval(() => {
      if (!cancelled && renderButton() && intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }, 120);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return (
      <div className="w-full max-w-[320px] space-y-2">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm opacity-80"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-700">
            G
          </span>
          המשך עם Google
        </button>
        <p className="text-center text-xs leading-5 text-slate-500">
          כדי להפעיל את הכניסה הזו צריך להגדיר <span className="font-semibold text-slate-700">VITE_GOOGLE_CLIENT_ID</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] space-y-2">
      <div ref={containerRef} className="flex justify-center" />
      {status !== "ready" ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
          טוען התחברות עם Google...
        </div>
      ) : null}
    </div>
  );
}
