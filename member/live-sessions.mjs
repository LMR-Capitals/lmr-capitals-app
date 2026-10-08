export const sessionBlocks = [
  { id: "asia", label: "Asia" },
  { id: "london", label: "London" },
  { id: "ny_am", label: "NY AM" },
  { id: "ny_pm", label: "NY PM" },
];
export const validSessionBlock = (id) =>
  sessionBlocks.some((block) => block.id === id);
export const sessionBlockLabel = (id) =>
  sessionBlocks.find((block) => block.id === id)?.label || "Unassigned";
export function sessionsForBlock(sessions, block) {
  return sessions.filter((session) =>
    block === "unassigned"
      ? !validSessionBlock(session.session_block)
      : session.session_block === block,
  );
}
export function selectRoomSession(sessions, selectedId, now = Date.now()) {
  const selected = sessions.find((session) => session.id === selectedId);
  if (selected) return selected;
  const live = sessions.find((session) => session.status === "live");
  if (live) return live;
  const upcoming = sessions
    .filter(
      (session) =>
        session.status === "scheduled" && Date.parse(session.starts_at) >= now,
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  if (upcoming.length) return upcoming[0];
  return [...sessions]
    .filter((session) => session.status !== "cancelled")
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))[0];
}
