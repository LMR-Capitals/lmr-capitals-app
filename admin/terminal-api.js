import { journalImageUrl } from "../member/journal-media.mjs";
import { sb, checked, fetchJournalSources, fetchQuestions } from "../member/api";
export const emptyDesk = {
  posts: [],
  adminPosts: [],
  sessions: [],
  notifications: [],
  questions: [],
  mentorship: [],
  journalEntries: [],
};
// The admin desk deliberately has no dependency on subscriptions or learner progress.
export async function fetchTerminalWorkspace() {
  const [posts, sessions, notifications, questions, mentorship] =
    await Promise.all([
      checked(
        sb
          .from("circle_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
      checked(
        sb
          .from("circle_live_sessions")
          .select("*")
          .order("starts_at")
          .limit(30),
      ),
      checked(
        sb
          .from("circle_notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ),
      fetchQuestions(true),
      checked(
        sb
          .from("circle_mentorship_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ),
    ]);
  const enriched = await Promise.all(
    posts.map(async (post) => {
      if (!post.image_path)
        return { ...post, image_url: journalImageUrl(post.source_image) };
      const { data, error } = await sb.storage
        .from("circle-media")
        .createSignedUrl(post.image_path, 300);
      return {
        ...post,
        image_url: error ? null : data.signedUrl,
        media_error: !!error,
      };
    }),
  );
  const journal = await fetchJournalSources();
  return {
    ...journal,
    posts: enriched.filter((post) => post.status === "published"),
    adminPosts: enriched,
    sessions,
    notifications,
    questions,
    mentorship,
  };
}
