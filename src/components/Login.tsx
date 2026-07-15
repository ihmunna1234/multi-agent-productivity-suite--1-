import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { login } from "../utils/api";

export default function Login() {
  const [isOpen, setIsOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial state
    const token = localStorage.getItem("workspace_token");
    if (!token) {
      setIsOpen(true);
    }

    // Listen for unauthorized events to pop up the login screen
    const handleUnauthorized = () => {
      setIsOpen(true);
      setError("Session expired or unauthorized. Please log in again.");
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(passcode);
    
    setIsLoading(false);
    
    if (success) {
      setIsOpen(false);
      setPasscode("");
      // Refresh the page so all components can use the fresh token on mount
      window.location.reload(); 
    } else {
      setError("Invalid passcode. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto">
            <ShieldCheck size={28} />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-on-background mb-2 tracking-tight">
            Workspace Secured
          </h2>
          <p className="text-center text-on-surface-variant text-sm mb-8">
            Please enter your access passcode to continue to the AI tools.
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
                  className="block w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-background text-sm"
                  placeholder="Enter Passcode..."
                  required
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passcode.trim()}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
        <div className="bg-surface-container-low px-8 py-4 border-t border-outline-variant/50">
          <p className="text-xs text-center text-on-surface-variant">
            Protected by Vercel Edge & JWT Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
