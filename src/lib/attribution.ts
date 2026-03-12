/**
 * Attribution – save UTM and referral data to user_profiles.
 * Only updates when attribution is not yet set (first sign-in).
 */

import { getSupabase } from "./supabase";

export type AttributionInput = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ref?: string; // ?ref=USER_ID → referred_by_id
};

/**
 * Saves attribution to user_profiles. Only updates if signup_source and referred_by_id
 * are not already set (first sign-in attribution).
 */
export async function saveAttribution(
  userId: string,
  input: AttributionInput
): Promise<{ saved: boolean; error?: string }> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("signup_source, referred_by_id")
    .eq("user_id", userId)
    .single();

  // Only update if we have new data and profile hasn't been attributed yet
  const hasInput = input.utm_source || input.utm_medium || input.utm_campaign || input.ref;
  const alreadyAttributed = existing?.signup_source != null || existing?.referred_by_id != null;
  if (!hasInput || alreadyAttributed) {
    return { saved: false };
  }

  const updateFields: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (input.utm_source) updateFields.signup_source = input.utm_source;
  if (input.utm_medium) updateFields.utm_medium = input.utm_medium;
  if (input.utm_campaign) updateFields.utm_campaign = input.utm_campaign;
  if (input.ref) updateFields.referred_by_id = input.ref;

  const { error } = await supabase.from("user_profiles").upsert(
    { user_id: userId, ...updateFields },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[attribution save]", error);
    return { saved: false, error: error.message };
  }
  return { saved: true };
}
