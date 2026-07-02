import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Decipher — Decipher your Document",
  description:
    "Upload any document and unlock AI-powered summaries, quizzes, flashcards, notes, and more. Your intelligent study companion.",
  keywords: ["AI", "study", "flashcards", "summaries", "quiz", "student", "learning"],
};

import { GuestPrompt } from "@/components/layout/GuestPrompt";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing_client_id"}>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <NextTopLoader color="#f97316" showSpinner={false} />
                <GoogleAnalytics />
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
                <Toaster />
                <GuestPrompt />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
