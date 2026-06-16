import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome to FoundIt" },
      { name: "description", content: "Choose how you'd like to continue on FoundIt." },
    ],
  }),
  component: RoleSelection,
});

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />

      <div className="z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        <div className="mb-12 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Search className="h-6 w-6" />
          </span>
          <span className="font-display text-4xl font-bold tracking-tight">FoundIt<span className="text-accent">.</span></span>
        </div>

        <div className="paper-card p-8 rounded-3xl w-full border border-border/50 shadow-2xl shadow-foreground/5 scale-up-animation">
          <h1 className="font-display text-3xl font-black text-foreground mb-3">Welcome to FoundIt</h1>
          <p className="text-muted-foreground mb-10 text-lg">Choose how you'd like to continue.</p>

          <div className="grid gap-4 w-full">
            <Button 
              size="lg" 
              className="h-16 text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate({ to: "/login" })}
            >
              Continue as User
            </Button>
            
            <div className="relative my-2 text-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-3 z-10 relative">or</span>
              <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border/50" />
            </div>

            <Button 
              variant="outline" 
              size="lg" 
              className="h-16 text-lg font-bold rounded-2xl border-2 transition-all hover:bg-accent/10 hover:border-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate({ to: "/admin-login" })}
            >
              Continue as Admin
            </Button>
          </div>
        </div>

        <footer className="mt-12 text-sm text-muted-foreground animate-pulse">
          Helping communities stay connected.
        </footer>
      </div>
    </div>
  );
}
