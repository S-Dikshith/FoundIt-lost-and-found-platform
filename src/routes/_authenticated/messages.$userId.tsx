import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages/$userId")({
  head: () => ({ meta: [{ title: "Chat — FoundIt" }] }),
  component: ChatThread,
});

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function ChatThread() {
  const { userId } = useParams({ from: "/_authenticated/messages/$userId" });
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherName, setOtherName] = useState("Conversation");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("messages" as any)
        .select("id,sender_id,recipient_id,body,read_at,created_at")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user!.id})`)
        .order("created_at", { ascending: true })
        .limit(500);
      if (cancelled) return;
      const msgs = (data ?? []) as unknown as Msg[];
      setMessages(msgs);
      const unreadIds = msgs.filter((m) => m.recipient_id === user!.id && !m.read_at).map((m) => m.id);
      if (unreadIds.length) {
        await supabase.from("messages" as any).update({ read_at: new Date().toISOString() }).in("id", unreadIds);
      }
    }
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle().then(({ data }: any) => {
      if (data?.display_name) setOtherName(data.display_name);
    });
    load();
    const ch = supabase
      .channel(`thread-${user.id}-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user!.id && m.recipient_id === userId) || (m.sender_id === userId && m.recipient_id === user!.id)) {
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.recipient_id === user!.id) {
            supabase.from("messages" as any).update({ read_at: new Date().toISOString() }).eq("id", m.id);
          }
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user?.id, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !user) return;
    if (text.length > 2000) { toast.error("Too long"); return; }
    setSending(true);
    const { error } = await supabase.from("messages" as any).insert({
      sender_id: user.id, recipient_id: userId, body: text,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <Link to="/messages" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All conversations
        </Link>
        <div className="paper-card flex flex-1 flex-col overflow-hidden rounded-2xl">
          <div className="border-b border-border px-5 py-3">
            <h1 className="font-display text-xl font-bold">{otherName}</h1>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No messages yet — say hi 👋</p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" maxLength={2000} />
            <Button type="submit" disabled={sending || !body.trim()} className="gap-1">
              <Send className="h-4 w-4" /> Send
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
