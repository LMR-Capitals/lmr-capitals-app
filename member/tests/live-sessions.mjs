import assert from "node:assert/strict";
import {
  sessionBlocks,
  sessionsForBlock,
  selectRoomSession,
  validSessionBlock,
  sessionBlockLabel,
} from "../live-sessions.mjs";
assert.deepEqual(
  sessionBlocks.map((block) => block.label),
  ["Asia", "London", "NY AM", "NY PM"],
);
const sessions = [
  {
    id: "asia",
    session_block: "asia",
    starts_at: "2026-10-06T00:00:00Z",
    status: "scheduled",
  },
  {
    id: "london-live",
    session_block: "london",
    starts_at: "2026-10-05T07:00:00Z",
    status: "live",
  },
  {
    id: "london-next",
    session_block: "london",
    starts_at: "2026-10-06T07:00:00Z",
    status: "scheduled",
  },
  { id: "old", starts_at: "2026-10-05T12:00:00Z", status: "ended" },
];
assert.equal(
  selectRoomSession(sessionsForBlock(sessions, "asia"), "london-live").id,
  "asia",
  "A selected session in another room cannot leak into this room",
);
assert.equal(
  selectRoomSession(sessionsForBlock(sessions, "london"), null).id,
  "london-live",
);
assert.equal(
  selectRoomSession(sessionsForBlock(sessions, "ny_pm"), null),
  undefined,
);
assert.deepEqual(
  sessionsForBlock(sessions, "unassigned").map((session) => session.id),
  ["old"],
  "Legacy rows stay reachable until assigned",
);
assert.equal(sessionBlockLabel("ny_am"), "NY AM");
assert.equal(validSessionBlock("new_york"), false);
assert.equal(validSessionBlock(null), false);
assert.equal(
  selectRoomSession(
    [
      { id: "late", status: "scheduled", starts_at: "2026-10-07T07:00:00Z" },
      { id: "soon", status: "scheduled", starts_at: "2026-10-06T07:00:00Z" },
    ],
    null,
    Date.parse("2026-10-05T07:00:00Z"),
  ).id,
  "soon",
);
console.log(
  "Four live rooms passed: correct labels, scoped selection, empty states, upcoming ordering and legacy preservation.",
);
