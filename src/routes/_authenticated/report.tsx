import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { CATEGORIES } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({ meta: [{ title: "Report an item — FoundIt" }] }),
  component: ReportPage,
});

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(2000),
  category: z.string().min(1),
  status: z.enum(["lost", "found"]),
  location: z.string().trim().min(2).max(160),
  item_date: z.string().min(1),
  contact_email: z.string().email().max(255).optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
});

function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState<string>("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const obj = { ...Object.fromEntries(fd), status, category };
    const parsed = schema.safeParse(obj);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("item-images").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        image_url = path;
      }
      const { error } = await supabase.from("items").insert({
        ...parsed.data,
        user_id: user.id,
        contact_email: parsed.data.contact_email || null,
        contact_phone: parsed.data.contact_phone || null,
        image_url,
      });
      if (error) throw error;
      toast.success("Posted to the noticeboard");
      navigate({ to: "/my-items" });
    } catch (err: any) {
      toast.error(err.message || "Could not post item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
          <h1 className="font-display text-4xl font-black tracking-tight">Pin it to the board</h1>
          <p className="mt-2 text-muted-foreground">Share what you've lost or found — the more detail, the better.</p>
        </header>

        <form onSubmit={onSubmit} className="paper-card space-y-5 rounded-2xl p-6">
          <div>
            <Label className="mb-2 block">I am reporting…</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as "lost" | "found")} className="grid grid-cols-2 gap-3">
              <Label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 transition ${status === "lost" ? "border-lost bg-lost/10" : "border-border"}`}>
                <RadioGroupItem value="lost" className="sr-only" />
                <span className="h-2 w-2 rounded-full bg-lost" /> A LOST item
              </Label>
              <Label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 transition ${status === "found" ? "border-found bg-found/10" : "border-border"}`}>
                <RadioGroupItem value="found" className="sr-only" />
                <span className="h-2 w-2 rounded-full bg-found" /> A FOUND item
              </Label>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="title">Item name</Label>
            <Input id="title" name="title" required maxLength={120} placeholder="e.g. Black leather wallet" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item_date">Date {status === "lost" ? "lost" : "found"}</Label>
              <Input id="item_date" name="item_date" type="date" required max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" required maxLength={160} placeholder="Where exactly?" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required minLength={5} maxLength={2000} rows={4} placeholder="Describe distinguishing features, contents, anything that helps identify it." />
          </div>

          <div>
            <Label>Photo (optional, max 5 MB)</Label>
            <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted">
              <ImagePlus className="h-5 w-5" />
              {file ? file.name : "Click to upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {preview && <img src={preview} alt="" className="mt-3 max-h-48 rounded-lg object-cover" />}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact_email">Contact email (optional)</Label>
              <Input id="contact_email" name="contact_email" type="email" maxLength={255} defaultValue={user?.email ?? ""} />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact phone (optional)</Label>
              <Input id="contact_phone" name="contact_phone" type="tel" maxLength={40} />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Post to noticeboard
          </Button>
        </form>
      </main>
    </div>
  );
}
