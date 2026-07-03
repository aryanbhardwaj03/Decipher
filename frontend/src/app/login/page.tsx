"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { apiLogin, apiRegister, apiGoogleAuth, apiSendOtp } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { showToast } from "@/components/ui/Toaster";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("mode=signup")) {
      setIsLogin(false);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        console.log("Google token received:", tokenResponse);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch user info from Google");
        }
        
        const userInfo = await res.json();
        console.log("Google user info:", userInfo);
        
        const data = await apiGoogleAuth(userInfo.email, userInfo.name, userInfo.picture || "");
        login(data.access_token, data.user);
        showToast(`Welcome via Google, ${data.user.name}! 🎉`, "success");
        router.push("/dashboard");
      } catch (err: any) {
        console.error("Google Auth Error:", err);
        showToast(err.message || "Google auth failed on server", "error");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Error:", error);
      showToast("Google login failed or was cancelled", "error");
      setLoading(false);
    }
  });

  const isPasswordStrong = (pw: string) => {
    return (
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[a-z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pw)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      if (!isPasswordStrong(password)) {
        showToast("Password must be at least 8 chars with uppercase, lowercase, number, and special character.", "error");
        return;
      }

      if (!showOtp) {
        setLoading(true);
        try {
          await apiSendOtp(email);
          setShowOtp(true);
          showToast("Verification code sent to your email", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to send verification code", "error");
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    setLoading(true);

    try {
      const data = isLogin
        ? await apiLogin(email, password)
        : await apiRegister(email, password, name, otp);

      login(data.access_token, data.user);
      showToast(`Welcome${data.user.name ? ", " + data.user.name : ""}! 🎉`, "success");
      router.push("/dashboard");
    } catch (err: any) {
      showToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Top actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/logo-mark.png" alt="Decipher Logo" className="w-9 h-9 object-contain rounded-full bg-white p-[2px]" />
          <span className="text-xl font-bold tracking-tight gradient-text">Decipher</span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold tracking-tight mb-1">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isLogin
            ? "Sign in to sync your documents & history"
            : "Join to save your progress across devices"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {showOtp && !isLogin ? (
            <div className="relative animate-in fade-in slide-in-from-bottom-4">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50 text-center tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">We sent a verification code to {email}</p>
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-1"
            style={{ background: "var(--gradient-brand)" }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : (showOtp ? "Verify & Create Account" : "Create Account")}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 relative flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-medium">
            OR CONTINUE WITH
          </span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted transition-all text-foreground flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Google
        </button>

        {/* Toggle */}
        <p className="text-center text-xs text-muted-foreground mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

      </motion.div>
    </div>
  );
}
