import { preview } from "./config";
// Only the three-pane comparison joins a temporary, page-specific channel.
// No account data, persisted browser storage or backend client is involved.
export function previewDeskChannel() {
  const group = new URLSearchParams(location.search).get("preview_group");
  return preview &&
    group &&
    /^[a-zA-Z0-9-]{1,80}$/.test(group) &&
    typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(`lmr-preview-${group}`)
    : null;
}
export function previewDeskMessage(data) {
  return {
    type: "desk-update",
    posts: data.posts,
    sessions: data.sessions,
    notifications: data.notifications.filter(
      (notice) => !notice.target_user_id,
    ),
  };
}
