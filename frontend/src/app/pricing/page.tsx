"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toaster";
import { motion } from "framer-motion";
import Script from "next/script";

import { useAuth } from "@/components/providers/AuthProvider";
import { apiCreateOrder, apiVerifyPayment, apiGetXpHistory } from "@/lib/api";
import type { XPHistoryResponse } from "@/types";

export default function PricingPage() {
  const { user, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [xpData, setXpData] = useState<XPHistoryResponse | null>(null);

  useEffect(() => {
    if (user && user.plan !== "Pro" && user.plan !== "Plus") {
      apiGetXpHistory().then(setXpData).catch(console.error);
    }
  }, [user]);

  const hasXpPlus = (xpData?.weekly_xp || 0) >= 100;

  const handleUpgrade = async (name: string, price: number) => {
    setIsProcessing(true);
    try {
      // 1. Call backend to create Razorpay Order
      const order = await apiCreateOrder(name, price);

      // 2. Open Razorpay Checkout popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T7n4of4gFN8s1W", // Use env variable or fallback
        amount: order.amount,
        currency: order.currency,
        name: "Decipher",
        description: `Upgrade to ${name}`,
        order_id: order.order_id, // backend returns order_id
        handler: async function (response: any) {
          try {
            await apiVerifyPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              name
            );
            showToast(`Successfully upgraded to ${name}!`, "success");
            await refreshUser(); // Refresh user data to update the plan
            window.location.href = `/success?plan=${name}`;
          } catch (err) {
            showToast("Payment verification failed. Please contact support.", "error");
          }
        },
        prefill: {
          name: "Aryan",
          email: "aryan@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#F97316" // Orange
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        showToast("Payment failed. Please try again.", "error");
      });
      rzp.open();
    } catch (error) {
      showToast("Error initializing payment gateway.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Supercharge your research
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6"
          >
            Simple, transparent pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Choose the plan that fits your needs. Upgrade anytime to unlock unlimited AI processing.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Basic Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative flex flex-col p-8 rounded-[24px] bg-card border-2 border-border shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2 text-foreground">Basic</h3>
              <p className="text-muted-foreground text-[15px]">Perfect for trying out the platform.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl leading-none font-black text-foreground">Free</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "30 Document uploads",
                "Basic AI summaries",
                "Limited AI Chat",
                "Standard processing speed",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-[15px] font-medium text-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            {user?.plan === "Basic" || !user?.plan ? (
              <Button disabled className="w-full h-12 text-[15px] font-semibold bg-primary/50 text-primary-foreground rounded-xl border-0 shadow-sm cursor-not-allowed">
                Current Plan
              </Button>
            ) : (
              <Button disabled className="w-full h-12 text-[15px] font-semibold bg-muted text-muted-foreground rounded-xl border-0 shadow-sm cursor-not-allowed">
                Included in {user?.plan}
              </Button>
            )}
          </motion.div>

          {/* Plus Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative flex flex-col p-8 rounded-[24px] bg-card border-2 border-border shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2 text-foreground">Plus</h3>
              <p className="text-muted-foreground text-[15px]">Need more space without premium AI?</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl leading-none font-black text-foreground">₹5</span>
              <span className="text-muted-foreground font-medium text-[15px] ml-1">/month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Unlimited document uploads",
                "Unlimited cloud storage",
                "Basic AI summaries",
                "Limited AI Chat",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-[15px] font-medium text-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            {user?.plan === "Plus" || hasXpPlus ? (
              <Button disabled className="w-full h-12 text-[15px] font-semibold bg-primary/50 text-primary-foreground rounded-xl border-0 shadow-sm cursor-not-allowed">
                {hasXpPlus ? "Unlocked via XP" : "Current Plan"}
              </Button>
            ) : user?.plan === "Pro" ? (
              <Button disabled className="w-full h-12 text-[15px] font-semibold bg-muted text-muted-foreground rounded-xl border-0 shadow-sm cursor-not-allowed">
                Included in Pro
              </Button>
            ) : (
              <Button onClick={() => handleUpgrade("Plus", 5)} className="w-full h-12 text-[15px] font-semibold bg-primary hover:opacity-90 text-primary-foreground rounded-xl border-0 shadow-sm transition-opacity">
                Upgrade to Plus
              </Button>
            )}
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative flex flex-col p-8 rounded-[24px] bg-card shadow-xl border-2 border-primary shadow-primary/10"
          >
            <div className="absolute -top-3 inset-x-0 flex justify-center">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full">Most Popular</span>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2 text-foreground">
                Pro <Zap className="w-5 h-5 text-primary" fill="currentColor" />
              </h3>
              <p className="text-muted-foreground text-[15px]">Everything you need for serious research.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl leading-none font-black text-foreground">₹10</span>
              <span className="text-muted-foreground font-medium text-[15px] ml-1">/month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Unlimited document uploads",
                "Unlimited AI summaries & chat",
                "Unlimited quizzes & flashcards",
                "Unlimited mind maps",
                "Table & figure extraction",
                "Priority AI processing",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-[15px] font-medium text-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            {user?.plan === "Pro" ? (
              <Button disabled className="w-full h-12 text-[15px] font-semibold bg-primary/50 text-primary-foreground rounded-xl border-0 shadow-sm cursor-not-allowed">
                Current Plan
              </Button>
            ) : (
              <Button onClick={() => handleUpgrade("Pro", 10)} className="w-full h-12 text-[15px] font-semibold bg-primary hover:opacity-90 text-primary-foreground rounded-xl border-0 shadow-sm transition-opacity">
                Upgrade to Pro
              </Button>
            )}
          </motion.div>
        </div>

        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <p className="text-muted-foreground text-sm mb-4 font-medium uppercase tracking-wider">
            Supported Payment Methods
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              <span className="text-sm font-semibold">Credit/Debit Card</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>
              <span className="text-sm font-semibold">Net Banking</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-sm font-semibold">UPI Integration</span>
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground mt-4">
            Payments are processed securely via Razorpay. 
          </p>
        </motion.div>
      </main>
    </AppLayout>
  );
}
