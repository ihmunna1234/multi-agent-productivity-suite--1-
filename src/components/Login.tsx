import React, { useState, useEffect, useCallback } from "react";
import { Lock, ShieldCheck, ArrowRight, Loader2, BrainCircuit } from "lucide-react";
import { login } from "../utils/api";

export default function Login() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(passcode);
    setIsLoading(false);

    if (success) {
      // Reload so the app re-checks the token and renders the workspace
      window.location.reload();
    } else {
      setError("Invalid passcode. Please try again.");
      setPasscode("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* App branding above the card */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 className="font-bold text-on-background text-base tracking-tight leading-none">
              Injamus's AI Workspace
            </h1>
            <span className="text-[10px] text-primary font-semibold tracking-widest uppercase mt-1 block">
              Multi-Agent Suite
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto">
              <ShieldCheck size={30} />
            </div>

            <h2 className="text-2xl font-bold text-center text-on-background mb-2 tracking-tight">
              Workspace Secured
            </h2>
            <p className="text-center text-on-surface-variant text-sm mb-8">
              Enter your access passcode to unlock all AI tools.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-background text-sm placeholder-on-surface-variant/50"
                    placeholder="Enter passcode..."
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="mt-2.5 text-xs text-red-500 font-medium flex items-center gap-1.5">
                    <span>⚠</span> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !passcode.trim()}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer gap-2"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Unlock Workspace
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-surface-container-low px-8 py-4 border-t border-outline-variant/50">
            <p className="text-xs text-center text-on-surface-variant">
              🔒 Protected by JWT Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
