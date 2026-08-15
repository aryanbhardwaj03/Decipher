"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, FileText, Activity, ShieldAlert, Download, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  // Email Broadcast State
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcastSubject || !broadcastContent) {
      alert("Please provide both a subject and HTML content.");
      return;
    }
    
    if (!confirm("Are you sure you want to broadcast this email to ALL real users?")) {
      return;
    }
    
    setIsBroadcasting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/broadcast-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          subject: broadcastSubject,
          html_content: broadcastContent
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to broadcast email");
      
      alert(data.message || "Email broadcast successfully queued!");
      setBroadcastSubject("");
      setBroadcastContent("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleViewDocument = async (docId: string, filename: string) => {
    try {
      setDownloadingDoc(docId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/documents/${docId}/file`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to download document from server.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document");
    } finally {
      setDownloadingDoc(null);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`, { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch Users (Only once initially)
        if (usersList.length === 0) {
          const usersRes = await fetch(`${API_BASE}/api/admin/users`, { headers });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsersList(usersData.users);
          }
          
          // Fetch Documents
          const docsRes = await fetch(`${API_BASE}/api/admin/documents`, { headers });
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            setDocumentsList(docsData.documents);
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
    };

    if (user?.role === "admin") {
      fetchAdminData();
      
      // Live traffic polling every 5 seconds
      const interval = setInterval(fetchAdminData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, usersList.length]);

  if (loading || user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const trafficData = stats?.traffic || [];

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform overview and user management</p>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_users || usersList.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_documents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Live Traffic (Reqs/min)</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {trafficData.length > 0 ? trafficData[trafficData.length - 1].hits : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Chart */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Website Traffic (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="hits" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Email Broadcast Section */}
        <Card className="mb-10 border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <CardTitle>Email Broadcast</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Send an email announcement to all verified, real users.</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Line</label>
                <input 
                  type="text" 
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. 🇮🇳 Happy 80th Independence Day from Decipher!" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Content (HTML)</label>
                <textarea 
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="<h1>Hello!</h1><p>Type your beautiful HTML email here...</p>" 
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleBroadcast}
                  disabled={isBroadcasting || !broadcastSubject || !broadcastContent}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-10 px-4 py-2 bg-primary text-primary-foreground gap-2"
                >
                  {isBroadcasting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isBroadcasting ? "Sending Broadcast..." : "Send Broadcast to All Users"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u, i) => (
                      <tr key={u.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="px-6 py-4 font-medium truncate max-w-[150px]">{u.name || 'Anonymous'}</td>
                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                    <tr>
                      <th className="px-6 py-4 font-medium">Filename</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsList.map((doc, i) => (
                      <tr key={doc.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="px-6 py-4 font-medium truncate max-w-[200px]" title={doc.filename}>{doc.filename}</td>
                        <td className="px-6 py-4 text-muted-foreground">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDocument(doc.id, doc.filename)}
                            disabled={downloadingDoc === doc.id}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-8 px-3 py-1 bg-primary text-primary-foreground"
                          >
                            {downloadingDoc === doc.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {documentsList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No documents found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </AppLayout>
  );
}
