import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSignedImage } from "@/hooks/useSignedImage";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Mail, Phone, User as UserIcon, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/items/$id")({
  head: () => ({ meta: [{ title: "Item — FoundIt" }] }),
  component: ItemDetail,
});

type Detail = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "lost" | "found" | "returned";
  location: string;
  item_date: string;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  user_id: string;
  created_at: string;
};

function ItemDetail() {
  const { id } = useParams({ from: "/items/$id" });
  const { user } = useAuth();
  const [item, setItem] = useState<Detail | null>(null);
  const [posterName, setPosterName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const imgUrl = useSignedImage(item?.image_url ?? null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
      setItem(data as Detail | null);
      if (data) {
        const { data: p } = await supabase.from("profiles").select("display_name").eq("id", data.user_id).maybeSingle();
        setPosterName(p?.display_name ?? "Community member");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen"><Navbar /><div className="py-20 text-center text-muted-foreground">Loading…</div></div>;
  if (!item) return (
    <div className="min-h-screen"><Navbar />
      <div className="py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Item not found</h2>
        <Button asChild className="mt-4"><Link to="/">Back to board</Link></Button>
      </div>
    </div>
  );

  const statusClass = item.status === "lost" ? "bg-lost text-lost-foreground"
    : item.status === "found" ? "bg-found text-found-foreground"
    : "bg-returned text-returned-foreground";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        <article className="paper-card overflow-hidden rounded-2xl">
          {imgUrl && (
            <div className="aspect-[16/9] overflow-hidden bg-muted">
              <img src={imgUrl} alt={item.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className={`uppercase ${statusClass}`}>{item.status}</Badge>
              <Badge variant="outline">{item.category}</Badge>
            </div>
            <h1 className="font-display text-4xl font-black leading-tight">{item.title}</h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(item.item_date).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1.5"><UserIcon className="h-4 w-4" />Posted by {posterName}</span>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-foreground/90">{item.description}</p>

            <div className="mt-8 rounded-xl border border-border bg-secondary/50 p-5">
              <h2 className="font-display text-lg font-bold">Contact the poster</h2>
              {user ? (
                <div className="mt-3 space-y-3">
                  {user.id !== item.user_id && (
                    <Button asChild size="sm" className="gap-1">
                      <Link to="/messages/$userId" params={{ userId: item.user_id }}>
                        <MessageSquare className="h-4 w-4" /> Message {posterName}
                      </Link>
                    </Button>
                  )}
                  <div className="space-y-2">
                    {item.contact_email && (
                      <a href={`mailto:${item.contact_email}`} className="inline-flex items-center gap-2 text-sm text-foreground hover:text-accent">
                        <Mail className="h-4 w-4" /> {item.contact_email}
                      </a>
                    )}
                    {item.contact_phone && (
                      <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-accent">
                        <Phone className="h-4 w-4" /> {item.contact_phone}
                      </a>
                    )}
                    {!item.contact_email && !item.contact_phone && user.id !== item.user_id && (
                      <p className="text-sm text-muted-foreground">No contact info — use messaging above.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Sign in to message the poster and view contact details.</p>
                  <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
