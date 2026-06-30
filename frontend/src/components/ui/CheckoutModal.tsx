"use client";

import { useState } from "react";
import { X, CreditCard, Building, Smartphone, CheckCircle2, Loader2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { showToast } from "./Toaster";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number; // in INR
}

type PaymentMethod = "card" | "upi" | "netbanking";
type CheckoutStatus = "idle" | "processing" | "success";

export function CheckoutModal({ isOpen, onClose, planName, planPrice }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [status, setStatus] = useState<CheckoutStatus>("idle");

  const handlePayment = async () => {
    setStatus("processing");
    
    // Simulate API call and payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setStatus("success");
    showToast(`Successfully subscribed to ${planName}!`, "success");
    
    // Close modal after showing success
    setTimeout(() => {
      setStatus("idle");
      onClose();
    }, 2000);
  };

  const resetAndClose = () => {
    if (status === "processing") return;
    setStatus("idle");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <h2 className="text-lg font-bold">Complete your purchase</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Lock className="w-3 h-3" /> Secure encrypted checkout
                  </p>
                </div>
                {status !== "processing" && status !== "success" && (
                  <button onClick={resetAndClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Success State */}
              {status === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
                  <p className="text-muted-foreground">
                    You have successfully upgraded to <strong className="text-foreground">{planName}</strong>.
                  </p>
                </motion.div>
              ) : (
                <div className="flex flex-col flex-1">
                  {/* Order Summary */}
                  <div className="px-6 py-5 bg-primary/5 border-b border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-muted-foreground">Plan</span>
                      <span className="text-sm font-bold text-foreground">{planName}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-sm font-semibold text-muted-foreground">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-primary">₹{planPrice}</span>
                        <span className="text-xs font-medium text-muted-foreground ml-1">/month</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold mb-3 text-foreground">Select Payment Method</h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <button 
                        onClick={() => setMethod("card")}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${method === "card" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Card</span>
                      </button>
                      <button 
                        onClick={() => setMethod("upi")}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${method === "upi" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
                      </button>
                      <button 
                        onClick={() => setMethod("netbanking")}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${method === "netbanking" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                      >
                        <Building className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Net Banking</span>
                      </button>
                    </div>

                    {/* Dynamic Form based on method */}
                    <div className="space-y-4 mb-6 min-h-[140px]">
                      {method === "card" && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold mb-1 block text-muted-foreground">Card Number</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold mb-1 block text-muted-foreground">Expiry</label>
                                <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold mb-1 block text-muted-foreground">CVC</label>
                                <input type="text" placeholder="123" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {method === "upi" && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-muted-foreground">UPI ID (VPA)</label>
                            <input type="text" placeholder="username@upi" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground" />
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> A payment request will be sent to your UPI app.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {method === "netbanking" && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-muted-foreground">Select Bank</label>
                            <select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground">
                              <option>HDFC Bank</option>
                              <option>State Bank of India</option>
                              <option>ICICI Bank</option>
                              <option>Axis Bank</option>
                              <option>Other Banks...</option>
                            </select>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              You will be redirected to your bank's secure portal to complete the payment.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <Button 
                      onClick={handlePayment} 
                      disabled={status === "processing"}
                      className="w-full h-12 relative overflow-hidden bg-primary text-primary-foreground hover:opacity-90"
                    >
                      {status === "processing" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                        </span>
                      ) : (
                        <span className="font-bold text-[15px]">Pay ₹{planPrice} Securely</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
