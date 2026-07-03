"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Paintbrush,
  Brain,
  FolderOpen,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Check,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/components/providers/ThemeProvider";
import { showToast } from "@/components/ui/Toaster";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  apiChangePassword,
  apiUploadAvatar,
  apiUpdateProfile,
  apiExportData,
  apiDeleteAllData,
  apiCancelSubscription,
} from "@/lib/api";
import { API_BASE } from "@/lib/constants";

interface SettingsPageProps {
  searchParams?: { tab?: string };
}

export default function SettingsPage({ searchParams }: SettingsPageProps) {
  const router = useRouter();
  const initialTab = typeof searchParams?.tab === "string" ? searchParams.tab : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { theme, setTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Paintbrush },
    { id: "ai", label: "AI Preferences", icon: Brain },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  const getInitials = (userName?: string, email?: string) => {
    if (userName) {
      const parts = userName.trim().split(" ");
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return userName.substring(0, 2).toUpperCase();
    }
    return email ? email[0].toUpperCase() : "U";
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await apiUpdateProfile(name);
      await refreshUser();
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        await apiUploadAvatar(file);
        await refreshUser();
        showToast("Avatar updated successfully", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to upload avatar", "error");
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    try {
      setIsLoading(true);
      await apiChangePassword(oldPassword, newPassword);
      showToast("Password changed successfully", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAI = () => {
    showToast("AI preferences saved", "success");
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      showToast("Preparing data export...", "info");
      await apiExportData();
      showToast("Data exported successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to export data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all your documents and data?"
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      await apiDeleteAllData();
      showToast("All data deleted successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePro = () => {
    router.push("/pricing");
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will be downgraded to the Free plan."
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      await apiCancelSubscription();
      await refreshUser();
      showToast("Subscription cancelled successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to cancel subscription", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmailNotifications(event.target.checked);
    showToast(
      `Email notifications ${event.target.checked ? "enabled" : "disabled"}`,
      "success"
    );
  };

  const handleThemeChange = (nextTheme: string) => {
    setTheme(nextTheme as any);
    showToast("Theme changed", "success");
  };

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}

            <div className="my-4 border-t border-border" />
            <button
              onClick={() => logout()}
              className="flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="flex-1 max-w-3xl">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your public profile and personal details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-sm text-3xl font-bold text-muted-foreground overflow-hidden">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}?t=${new Date().getTime()}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user?.name, user?.email)
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUploadAvatar} variant="outline" disabled={isLoading}>
                          Upload Avatar
                        </Button>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input
                          type="email"
                          readOnly
                          className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground focus-visible:outline-none"
                          value={user?.email || ""}
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        placeholder="••••••••"
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="••••••••"
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="••••••••"
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <Button onClick={handleChangePassword} variant="outline" disabled={isLoading}>
                      Update Password
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {["light", "dark", "system"].map((themeOption) => (
                        <div
                          key={themeOption}
                          onClick={() => handleThemeChange(themeOption)}
                          className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                            theme === themeOption
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <div
                            className={`w-full h-24 rounded-md border shadow-sm flex items-center justify-center ${
                              themeOption === "dark"
                                ? "bg-slate-900 border-slate-800"
                                : themeOption === "light"
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-gradient-to-br from-slate-50 to-slate-900 border-slate-300"
                            }`}
                          >
                            {theme === themeOption && (
                              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium capitalize">{themeOption}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "ai" && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Preferences</CardTitle>
                  <CardDescription>Configure how the AI responds and processes your documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Global Default Model</label>
                    <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option>GPT-4o</option>
                      <option>Claude 3.5 Sonnet</option>
                      <option>Gemini 1.5 Pro</option>
                      <option>Ollama (Local)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-4 text-primary">Feature-Specific Models</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Chat Responses</label>
                        <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option>Use Global Default</option>
                          <option>GPT-4o</option>
                          <option>Claude 3.5 Sonnet</option>
                          <option>Gemini 1.5 Pro</option>
                          <option>Ollama (Local)</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Quiz Generation</label>
                        <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option>Use Global Default</option>
                          <option>GPT-4o</option>
                          <option>Claude 3.5 Sonnet</option>
                          <option>Gemini 1.5 Pro</option>
                          <option>Ollama (Local)</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Flashcards Generation</label>
                        <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option>Use Global Default</option>
                          <option>GPT-4o</option>
                          <option>Claude 3.5 Sonnet</option>
                          <option>Gemini 1.5 Pro</option>
                          <option>Ollama (Local)</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Document Summaries</label>
                        <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <option>Use Global Default</option>
                          <option>GPT-4o</option>
                          <option>Claude 3.5 Sonnet</option>
                          <option>Gemini 1.5 Pro</option>
                          <option>Ollama (Local)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium flex justify-between">
                        <span>Creativity / Temperature</span>
                        <span className="text-muted-foreground">Balanced (0.7)</span>
                      </label>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-primary" />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Summary Length</label>
                      <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option>Short (1 paragraph)</option>
                        <option>Medium (1 page)</option>
                        <option>Detailed (Comprehensive)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Auto-generate Mind Maps</p>
                        <p className="text-xs text-muted-foreground">Create a mind map automatically upon upload</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  </div>

                  <Button onClick={handleSaveAI}>Save AI Settings</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "documents" && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Manage how your documents are stored and processed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Auto-delete after 30 days</p>
                      <p className="text-xs text-muted-foreground">Automatically remove old documents to save space</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">High Quality OCR</p>
                      <p className="text-xs text-muted-foreground">Use advanced OCR for images. Processing may take longer.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose what we notify you about.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Email Notifications</h4>
                      <p className="text-xs text-muted-foreground">Receive emails about new features and weekly reports.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailNotifications}
                        onChange={handleToggleEmail}
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Browser Notifications</h4>
                      <p className="text-xs text-muted-foreground">Get notified when document processing is complete.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "privacy" && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>Manage your data retention and privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 border p-4 rounded-lg">
                    <h4 className="font-medium text-sm">Export Data</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Download a ZIP file containing all your documents, summaries, and chats.
                    </p>
                    <Button variant="outline" className="w-fit" onClick={handleExportData} disabled={isLoading}>
                      Export All Data
                    </Button>
                  </div>
                  <div className="grid gap-2 border p-4 rounded-lg border-red-500/20 bg-red-500/5">
                    <h4 className="font-medium text-sm text-red-500">Delete All Documents</h4>
                    <p className="text-xs text-red-500/80 mb-2">
                      This will permanently delete all your documents and generated data. This cannot be undone.
                    </p>
                    <Button variant="destructive" className="w-fit" onClick={handleDeleteAccount} disabled={isLoading}>
                      Delete All Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>Manage your subscription plan and billing history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.plan === "Pro" ? (
                    <>
                      <div className="p-6 rounded-xl border-2 border-primary bg-primary/5 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg text-primary">Pro Plan</h4>
                          <p className="text-sm text-muted-foreground">
                            You are currently on the Pro tier. Enjoy unlimited access.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl mb-1">
                            Active<span className="text-sm font-normal text-muted-foreground" />
                          </p>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline" onClick={handleCancelSubscription} disabled={isLoading}>
                        Cancel Subscription
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-6 rounded-xl border-2 border-primary bg-primary/5 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg text-primary">Free Plan</h4>
                          <p className="text-sm text-muted-foreground">
                            You are currently on the free tier (local models only).
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl mb-1">
                            ₹0<span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </p>
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleUpgradePro} disabled={isLoading}>
                        Upgrade to Pro
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
