import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — FoundIt" }] }),
  component: MessagesPage,
});

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type Convo = {
  otherId: string;
  name: string;
  last: string;
  at: string;
  unread: number;
};

type ProfileName = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name">;

function MessagesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/messages") {
    return <Outlet />;
  }

  return <MessagesIndex />;
}

function MessagesIndex() {
  const { user } = useAuth();
  const userId = user?.id;
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("id,sender_id,recipient_id,body,read_at,created_at")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(500);
      const msgs = (data ?? []) as unknown as Msg[];
      const map = new Map<string, Convo>();
      for (const m of msgs) {
        const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
        if (!map.has(otherId)) {
          map.set(otherId, { otherId, name: "…", last: m.body, at: m.created_at, unread: 0 });
        }
        if (m.recipient_id === userId && !m.read_at) {
          map.get(otherId)!.unread += 1;
        }
      }
      const ids = [...map.keys()];
      if (ids.length) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", ids);
        ((pr ?? []) as ProfileName[]).forEach((p) => {
          if (map.has(p.id)) map.get(p.id)!.name = p.display_name;
        });
      }
      if (!cancelled) {
        setConvos([...map.values()].sort((a, b) => b.at.localeCompare(a.at)));
        setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel("convos-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [userId]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-accent" />
          <h1 className="font-display text-4xl font-black tracking-tight">Messages</h1>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : convos.length === 0 ? (
          <div className="paper-card rounded-xl p-10 text-center text-muted-foreground">
            No conversations yet. Open any item and tap{" "}
            <span className="font-semibold text-foreground">Message owner</span> to start one.
          </div>
        ) : (
          <ul className="paper-card divide-y divide-border overflow-hidden rounded-xl">
            {convos.map((c) => (
              <li key={c.otherId}>
                <Link
                  to="/messages/$userId"
                  params={{ userId: c.otherId }}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/60"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{c.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{c.last}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
