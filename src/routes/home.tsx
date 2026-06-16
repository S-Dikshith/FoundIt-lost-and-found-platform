import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ItemCard, CATEGORIES, type ItemRow } from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, MapPin, HandHeart } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "FoundIt — Lost & Found Community Portal" },
      { name: "description", content: "Browse lost & found listings from your community. Report missing items or post things you've found." },
    ],
  }),
  component: Home,
});

type Status = "all" | "lost" | "found" | "returned";

function Home() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("items")
      .select("id,title,description,category,status,location,item_date,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(120)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setItems((data ?? []) as ItemRow[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!`${i.title} ${i.description} ${i.location}`.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [items, q, status, category]);

  const counts = useMemo(() => ({
    lost: items.filter((i) => i.status === "lost").length,
    found: items.filter((i) => i.status === "found").length,
    returned: items.filter((i) => i.status === "returned").length,
  }), [items]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge variant="outline" className="mb-4 border-accent bg-accent/15 text-accent-foreground">
                <Sparkles className="mr-1 h-3 w-3" /> Community noticeboard
              </Badge>
              <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
                Lost something?<br />
                <span className="text-accent">Found something?</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                A friendly noticeboard for reuniting people with their things. Browse listings, post what you've lost or found, and help someone get their belongings back.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/report"><HandHeart className="h-4 w-4" />Report an item</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#browse">Browse listings</a>
                </Button>
              </div>
              <div className="mt-8 flex gap-6 text-sm">
                <Stat label="Lost" value={counts.lost} dotClass="bg-lost" />
                <Stat label="Found" value={counts.found} dotClass="bg-found" />
                <Stat label="Returned" value={counts.returned} dotClass="bg-returned" />
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="paper-card tape absolute right-6 top-2 w-64 -rotate-3 rounded-lg p-4">
                <Badge className="bg-lost text-lost-foreground">LOST</Badge>
                <h3 className="mt-2 font-display text-lg font-bold">Black wallet</h3>
                <p className="text-xs text-muted-foreground">Central Library, 2nd floor</p>
              </div>
              <div className="paper-card tape absolute left-2 top-32 w-64 rotate-2 rounded-lg p-4">
                <Badge className="bg-found text-found-foreground">FOUND</Badge>
                <h3 className="mt-2 font-display text-lg font-bold">Silver keys</h3>
                <p className="text-xs text-muted-foreground">Platform 4 bench</p>
              </div>
              <div className="paper-card tape absolute right-16 top-64 w-56 -rotate-2 rounded-lg p-4">
                <Badge className="bg-returned text-returned-foreground">RETURNED</Badge>
                <h3 className="mt-2 font-display text-lg font-bold">Blue backpack</h3>
                <p className="text-xs text-muted-foreground">Thank you Priya!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <section id="browse" className="mx-auto max-w-6xl px-4 py-12">
        <div className="paper-card mb-8 flex flex-col gap-3 rounded-xl p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, description, or location…"
              className="pl-9"
              maxLength={120}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="found">Found</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading listings…</div>
        ) : filtered.length === 0 ? (
          <div className="paper-card rounded-xl py-16 text-center">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-display text-xl font-bold">No listings yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0 ? "Be the first to post on the noticeboard." : "Try clearing the filters."}
            </p>
            <Button asChild className="mt-5"><Link to="/report">Report an item</Link></Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with care · A community noticeboard for lost & found.
      </footer>
    </div>
  );
}

function Stat({ label, value, dotClass }: { label: string; value: number; dotClass: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="font-display text-2xl font-bold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
