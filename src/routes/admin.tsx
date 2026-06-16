import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listAdminUsers, setUserAdminRole } from "@/lib/admin.functions";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, Trash2, UserPlus, UserMinus, Search, LayoutDashboard, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — FoundIt" }] }),
  component: AdminPage,
});

type AdminItem = {
  id: string;
  title: string;
  status: "lost" | "found" | "returned";
  category: string;
  location: string;
  created_at: string;
  user_id: string;
};

type AdminUser = {
  id: string;
  display_name: string;
  contact_email: string | null;
  created_at: string;
  is_admin: boolean;
  post_count: number;
};

function DashboardCard({ title, value, icon, color }: { title: string; value: number; icon: ReactNode; color: string }) {
  return (
    <div className="paper-card rounded-2xl p-6 border border-border/50 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">Real-time</Badge>
      </div>
      <div className="text-muted-foreground text-sm font-medium mb-1">{title}</div>
      <div className="font-display text-4xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function PlaceholderCard({ title, description, action }: { title: string; description: string; action: string }) {
  return (
    <div className="paper-card rounded-2xl p-6 border border-border/50 bg-secondary/20 flex flex-col justify-between">
      <div>
        <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
      </div>
      <Button variant="outline" className="w-full justify-between" disabled>
        {action}
        <LayoutDashboard className="h-4 w-4 opacity-50" />
      </Button>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [isAdminAuth, setIsAdminAuth] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(true);

  const checkAdminAuth = useCallback(() => {
    const auth = localStorage.getItem("foundit_admin_auth");
    if (auth !== "true") {
      toast.error("Admin access required");
      navigate({ to: "/admin-login" });
      setIsAdminAuth(false);
    } else {
      setIsAdminAuth(true);
    }
  }, [navigate]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const loadItems = useCallback(async () => {
    const { data: its } = await supabase
      .from("items")
      .select("id,title,status,category,location,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((its ?? []) as AdminItem[]);
    
    // Load user profiles for the items
    if (its && its.length > 0) {
      const userIds = [...new Set(its.map(item => item.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", userIds);
      
      if (profs) {
        const profileMap: Record<string, string> = {};
        profs.forEach(prof => {
          profileMap[prof.id] = prof.display_name || "Anonymous";
        });
        setProfiles(profileMap);
      }
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await listAdminUsers();
      setUsers((data ?? []) as AdminUser[]);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isAdminAuth) {
      setBusy(true);
      Promise.all([loadItems(), loadUsers()]).finally(() => setBusy(false));
    }
  }, [isAdminAuth, loadItems, loadUsers]);

  async function removeItem(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    loadItems();
  }

  async function toggleAdmin(u: AdminUser) {
    try {
      await setUserAdminRole({ data: { userId: u.id, isAdmin: !u.is_admin } });
      toast.success(u.is_admin ? "Admin removed" : "Promoted to admin");
      loadUsers();
    } catch (err: unknown) {
      toast.error("Could not update role");
    }
  }

  if (isAdminAuth === null) return <div className="py-20 text-center">Verifying session...</div>;
  if (isAdminAuth === false) return null;

  const stats = {
    users: new Set(items.map(i => i.user_id)).size || users.length,
    lost: items.filter(i => i.status === 'lost').length,
    found: items.filter(i => i.status === 'found').length,
    returned: items.filter(i => i.status === 'returned').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-black tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-lg">System Overview & Management</p>
            </div>
          </div>
          <Button variant="outline" className="border-2 font-bold" onClick={() => { localStorage.removeItem("foundit_admin_auth"); window.location.reload(); }}>
            Sign Out
          </Button>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Total Users" value={stats.users} icon={<Users className="h-5 w-5" />} color="bg-blue-500/10 text-blue-500" />
          <DashboardCard title="Total Lost Items" value={stats.lost} icon={<Trash2 className="h-5 w-5" />} color="bg-red-500/10 text-red-500" />
          <DashboardCard title="Total Found Items" value={stats.found} icon={<Search className="h-5 w-5" />} color="bg-green-500/10 text-green-500" />
          <DashboardCard title="Total Returned Items" value={stats.returned} icon={<ShieldCheck className="h-5 w-5" />} color="bg-accent/10 text-accent" />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PlaceholderCard title="Manage Listings" description="Modify or remove community posts." action="View Listings" />
          <PlaceholderCard title="Manage Users" description="Monitor and moderate user accounts." action="Access Directory" />
          <PlaceholderCard title="Reports" description="Review flagged content and activity logs." action="Open Reports" />
        </div>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="paper-card overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Posted by</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {busy ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          Loading…
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No posts.
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => (
                        <tr key={i.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{i.title}</td>
                          <td className="px-4 py-3">
                            <Badge className="uppercase">{i.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{i.category}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {profiles[i.user_id] ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(i.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => removeItem(i.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="paper-card overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Posts</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No users.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{u.display_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.contact_email ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.post_count}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_admin ? (
                              <Badge className="bg-accent text-accent-foreground">Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleAdmin(u)}
                              className="gap-1"
                            >
                              {u.is_admin ? (
                                <>
                                  <UserMinus className="h-4 w-4" />
                                  Demote
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4" />
                                  Promote
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
