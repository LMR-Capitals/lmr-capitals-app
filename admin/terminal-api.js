import {enrichPublicationMedia} from "../member/workspace-loading.mjs";
import {fetchLiveExecutions} from "../member/executions.mjs";
import {config} from "../member/config";
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
export async function fetchTerminalWorkspace({includeExecutions=true, includeJournal=true} = {}) {
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
  const enriched = await enrichPublicationMedia(sb,posts);
  let liveExecutions = [], executionsError = null;
  try { if(includeExecutions) liveExecutions = await fetchLiveExecutions(sb,config.supabaseUrl); }
  catch(error) { executionsError = error.message; }
  const journal = includeJournal ? await fetchJournalSources() : {};
  return {
    ...journal,
    ...(includeExecutions ? {liveExecutions, executionsError} : {}),
    posts: enriched.filter((post) => post.status === "published"),
    adminPosts: enriched,
    sessions,
    notifications,
    questions,
    mentorship,
  };
}
