import {newestJournalFirst} from "./journal-order.mjs";
import {fetchPublications} from "./publications.mjs";
import { createClient } from "@supabase/supabase-js";
import { config, preview, safeHttps } from "./config";
import { journalImageUrl } from "./journal-media.mjs";
import { resolveWorkspaceAccess } from "./workspace-access.mjs";
// Preview never constructs a client and cannot read or mutate production data.
export const sb = preview
  ? null
  : createClient(config.supabaseUrl, config.supabaseKey);
export async function checked(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
export async function access(user) {
  return resolveWorkspaceAccess(sb, user);
}
export async function fetchWorkspace(user, isAdmin = false) {
  const [
    posts,
    sessions,
    questions,
    notifications,
    reads,
    preferences,
    profile,
    mentorship,
    saved,
    learning,
  ] = await Promise.all([
    fetchPublications(sb,isAdmin),
    checked(
      sb
        .from("circle_live_sessions")
        .select("*")
        .order("starts_at", { ascending: true })
        .limit(30),
    ),
    fetchQuestions(isAdmin),
    checked(
      sb
        .from("circle_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ),
    checked(
      sb
        .from("circle_notification_reads")
        .select("notification_id")
        .eq("user_id", user.id),
    ),
    checked(
      sb
        .from("circle_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ),
    checked(
      sb
        .from("circle_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ),
    checked(
      sb
        .from("circle_mentorship_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ),
    checked(
      sb.from("circle_saved_posts").select("post_id").eq("user_id", user.id),
    ),
    checked(
      sb
        .from("circle_learning_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("chapter_no"),
    ),
  ]);
  const enriched = await Promise.all(
    posts.map(async (p) => {
      if (!p.image_path)
        return { ...p, image_url: journalImageUrl(p.source_image) };
      const { data, error } = await sb.storage
        .from("circle-media")
        .createSignedUrl(p.image_path, 300);
      return {
        ...p,
        image_url: error ? null : data.signedUrl,
        media_error: !!error,
      };
    }),
  );
  const journal = isAdmin ? await fetchJournalSources() : {};
  return {
    ...journal,
    posts: enriched.filter((p) => p.status === "published"),
    adminPosts: isAdmin ? enriched : [],
    sessions,
    questions,
    notifications,
    reads: reads.map((r) => r.notification_id),
    preferences: preferences || {
      live_alerts: true,
      post_alerts: true,
      mentorship_alerts: true,
    },
    profile: await enrichProfile(profile),
    mentorship,
    saved: saved.map((s) => s.post_id),
    learning,
  };
}
export async function invoke(name, body) {
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context.json();
      message = payload.error || message;
    } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function billing(action, plan) {
  const data = await invoke(
    action === "checkout" ? "create-checkout" : "create-billing-portal",
    action === "checkout"
      ? { plan, return_surface: "members", legal_version: config.legalVersion }
      : { return_surface: "members" },
  );
  const url = safeHttps(data.url);
  if (
    !url ||
    !["checkout.stripe.com", "billing.stripe.com"].includes(
      new URL(url).hostname,
    )
  )
    throw new Error(
      "Billing returned an invalid destination. Please contact LMR.",
    );
  window.location.assign(url);
}
export async function uploadMedia(file, user) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose an image smaller than 10 MB.");
  const path = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  await checked(
    sb.storage
      .from("circle-media")
      .upload(path, file, { contentType: file.type, upsert: false }),
  );
  return path;
}

export async function fetchAccount(user) {
  const [preferences, profile, mentorship, reads] = await Promise.all([
    checked(
      sb
        .from("circle_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ),
    checked(
      sb
        .from("circle_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ),
    checked(
      sb
        .from("circle_mentorship_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ),
    checked(sb.from("circle_notification_reads").select("notification_id").eq("user_id", user.id)),
  ]);
  return {
    preferences: preferences || {
      live_alerts: true,
      post_alerts: true,
      mentorship_alerts: true,
    },
    profile: await enrichProfile(profile),
    mentorship,
    reads: reads.map((row) => row.notification_id),
  };
}

export async function fetchJournalSources() {
  const { data, error } = await sb.rpc("circle_journal_sources");
  return error
    ? { journalEntries: [], journalError: error.message }
    : { journalEntries: newestJournalFirst(data || []).map(source => source.image_path ? {...source, image: `${config.supabaseUrl}/storage/v1/object/public/app-images/${source.image_path.split("/").map(encodeURIComponent).join("/")}`} : source), journalError: null };
}

async function enrichProfile(profile) {
  if (!profile?.avatar_path || profile.avatar_mode !== "custom") return profile || {};
  const {data,error} = await sb.storage.from("circle-avatars").createSignedUrl(profile.avatar_path,3600);
  return {...profile, avatar_url:error ? null : data.signedUrl};
}
export async function uploadAvatar(file,user) {
  const path = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  await checked(sb.storage.from("circle-avatars").upload(path,file,{contentType:file.type,upsert:false}));
  return path;
}
export async function copyJournalEntry(source,user) {
  let image;
  if(source.image_path) image = await checked(sb.storage.from("app-images").download(source.image_path));
  else if (/^data:image\/(?:png|jpeg|jpg|webp);base64,/.test(source.image)) image = await (await fetch(source.image)).blob();
  else throw new Error("Save an entry chart in your Journal before publishing this trade.");
  return uploadMedia(image,user);
}

// Never let recent answered questions displace the oldest unanswered requests.
export async function fetchQuestions(administrator = false) {
  if(!administrator) return checked(sb.from("circle_questions").select("*").order("created_at",{ascending:false}).limit(100));
  const waiting = []; let offset = 0;
  while(true) {
    const page = await checked(sb.from("circle_questions").select("*").eq("status","open").order("created_at").order("id").range(offset,offset+99));
    waiting.push(...page);
    if(page.length < 100) break;
    offset += 100;
  }
  const answered = await checked(sb.from("circle_questions").select("*").eq("status","answered").order("created_at",{ascending:false}).limit(50));
  return [...waiting,...answered];
}
