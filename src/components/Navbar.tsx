import { Link, useNavigate } from "@tanstack/react-router";
import { Search, PlusCircle, LogOut, User as UserIcon, ShieldCheck, MessageSquare, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const unread = useUnreadCount();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Search className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            FoundIt<span className="text-accent">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link to="/home" className="rounded-md px-3 py-2 text-foreground/70 hover:bg-secondary hover:text-foreground">
            Browse
          </Link>
          {user && (
            <Link to="/my-items" className="rounded-md px-3 py-2 text-foreground/70 hover:bg-secondary hover:text-foreground">
              My posts
            </Link>
          )}
          {user && (
            <Link to="/messages" className="relative rounded-md px-3 py-2 text-foreground/70 hover:bg-secondary hover:text-foreground">
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" />Messages</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {unread}
                </span>
              )}
            </Link>
          )}
          {user && (
            <Link to="/admin" className="rounded-md px-3 py-2 text-foreground/70 hover:bg-secondary hover:text-foreground">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" />{isAdmin ? "Admin" : "Claim admin"}</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Button asChild size="sm" className="gap-1">
                <Link to="/report"><PlusCircle className="h-4 w-4" />Report</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link to="/login"><UserIcon className="h-4 w-4" />Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
