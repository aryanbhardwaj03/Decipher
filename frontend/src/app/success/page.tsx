"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative bg-card p-6 rounded-full border-4 border-primary shadow-2xl shadow-primary/20">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
          className="absolute -top-4 -right-4"
        >
          <Sparkles className="w-8 h-8 text-yellow-500" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
          className="absolute -bottom-2 -left-6"
        >
          <Zap className="w-10 h-10 text-primary" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
      >
        Payment Successful!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-muted-foreground max-w-md mx-auto mb-8"
      >
        Thank you for upgrading. You are now subscribed to the <strong className="text-foreground">{plan}</strong> plan. Your account has been instantly upgraded.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link href="/dashboard">
          <Button className="h-12 px-8 text-base rounded-full shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" className="h-12 px-8 text-base rounded-full border-2">
            Manage Subscription
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto py-16">
        <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </AppLayout>
  );
}
