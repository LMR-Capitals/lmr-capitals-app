import React from "react";
import { sessionBlocks, sessionsForBlock } from "./live-sessions.mjs";
export default function SessionSwitcher({ sessions, value, onChange }) {
  return (
    <div
      className="session-blocks"
      role="group"
      aria-label="Live analysis sessions"
    >
      {sessionBlocks.map((block) => {
        const items = sessionsForBlock(sessions, block.id);
        const live = items.some((session) => session.status === "live");
        const scheduled = items.filter(
          (session) => session.status === "scheduled",
        ).length;
        return (
          <button
            key={block.id}
            aria-pressed={value === block.id}
            onClick={() => onChange(block.id)}
            type="button"
          >
            <strong>{block.label}</strong>
            <small className={live ? "room-is-live" : ""}>
              {live
                ? "Live now"
                : scheduled
                  ? `${scheduled} scheduled`
                  : "No session scheduled"}
            </small>
          </button>
        );
      })}
    </div>
  );
}
