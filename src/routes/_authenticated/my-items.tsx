import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { ItemCard, type ItemRow } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Trash2, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-items")({
  head: () => ({ meta: [{ title: "My posts — FoundIt" }] }),
  component: MyItems,
});

function MyItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("id,title,description,category,status,location,item_date,image_url,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as ItemRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function markReturned(id: string) {
    const { error } = await supabase.from("items").update({ status: "returned" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as returned 🎉");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-black tracking-tight">My posts</h1>
            <p className="mt-1 text-muted-foreground">Manage everything you've pinned to the board.</p>
          </div>
          <Button asChild className="gap-2"><Link to="/report"><PlusCircle className="h-4 w-4" />New post</Link></Button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="paper-card rounded-xl py-16 text-center">
            <h3 className="font-display text-xl font-bold">No posts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Lost or found something? Pin it.</p>
            <Button asChild className="mt-5"><Link to="/report">Report an item</Link></Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <ItemCard item={item} />
                <div className="flex gap-2">
                  {item.status !== "returned" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => markReturned(item.id)}>
                      <CheckCircle2 className="h-4 w-4" />Mark returned
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
