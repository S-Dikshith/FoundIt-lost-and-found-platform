import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdminUser = {
  id: string;
  display_name: string;
  contact_email: string | null;
  created_at: string;
  is_admin: boolean;
  post_count: number;
};

type AdminRoleRow = Pick<Database["public"]["Tables"]["user_roles"]["Row"], "user_id">;
type ItemOwnerRow = Pick<Database["public"]["Tables"]["items"]["Row"], "user_id">;

async function assertAdmin(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Admin access required");
  }
}

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) throw countError;
    if ((count ?? 0) > 0) return false;

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });

    if (error) throw error;
    return true;
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id,display_name,contact_email,created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const [{ data: roles, error: rolesError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabaseAdmin.from("user_roles").select("user_id,role").eq("role", "admin"),
        supabaseAdmin.from("items").select("user_id"),
      ]);

    if (rolesError) throw rolesError;
    if (itemsError) throw itemsError;

    const adminIds = new Set(((roles ?? []) as AdminRoleRow[]).map((role) => role.user_id));
    const postCounts = new Map<string, number>();
    for (const item of (items ?? []) as ItemOwnerRow[]) {
      postCounts.set(item.user_id, (postCounts.get(item.user_id) ?? 0) + 1);
    }

    return ((profiles ?? []) as AdminUser[]).map((profile) => ({
      ...profile,
      is_admin: adminIds.has(profile.id),
      post_count: postCounts.get(profile.id) ?? 0,
    }));
  });

export const setUserAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), isAdmin: z.boolean() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    if (data.isAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
      return { ok: true };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");

    if (error) throw error;
    return { ok: true };
  });
