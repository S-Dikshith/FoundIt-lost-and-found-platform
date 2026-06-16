import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Search, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — FoundIt" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded credentials: admin1 / admin@123
    if (username === "admin1" && password === "admin@123") {
      localStorage.setItem("foundit_admin_auth", "true");
      toast.success("Welcome, Administrator");
      navigate({ to: "/admin" });
    } else {
      toast.error("Invalid admin credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Search className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-bold">FoundIt<span className="text-accent">.</span></span>
        </Link>

        <div className="paper-card w-full rounded-2xl p-8 border border-border/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">Authorized access only</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Enter admin username"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Enter admin password"
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-bold" disabled={loading}>
              {loading ? "Verifying..." : "Login as Admin"}
            </Button>
          </form>
        </div>
        
        <p className="mt-8 text-xs text-center text-muted-foreground uppercase tracking-widest">
          FoundIt Security Protocol
        </p>
      </div>
    </div>
  );
}
