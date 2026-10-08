import React from "react";
const paths = {
  callouts: "M4 10l14-6v16L4 14z M4 10H2v4h2 M7 15l2 6h4l-3-5",
  resources: "M3 4h7l2 3h9v13H3z M7 12h10 M7 16h7",
  application: "M3 4h18v13H3z M8 21h8 M12 17v4 M7 8h4 M7 12h10",
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  live: "M3 5h13v14H3z M16 9l5-3v12l-5-3",
  observations:
    "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  terminology:
    "M12 5v16 M12 5C8 2 3 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 1",
  executions: "M3 17l6-6 4 4 8-11 M15 4h6v6 M3 3v18h18",
  achievements:
    "M8 3h8v6a4 4 0 0 1-8 0z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 13v7 M7 21h10",
  mentorship:
    "M9 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M1 21v-3a5 5 0 0 1 10 0v3 M13 21v-3a5 5 0 0 1 10 0v3",
  questions:
    "M21 11a9 9 0 0 1-9 9H4l-3 2 2-6a9 9 0 1 1 18-5z M9 8a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 15h.01",
  notifications:
    "M5 16h14l-2-3V8a5 5 0 0 0-10 0v5z M10 20a2 2 0 0 0 4 0 M12 1v2",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3l-1 3-3 1-2 3 2 2-1 3 3 2 2-1 3 2 3-2 2 1 3-2-1-3 2-2-2-3-3-1-1-3z",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2",
  billing: "M2 5h20v14H2z M2 10h20 M6 15h3",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  chevron: "M9 5l7 7-7 7",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6",
  plus: "M12 5v14 M5 12h14",
  close: "M5 5l14 14 M19 5L5 19",
  check: "M4 12l5 5L20 6",
  lock: "M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4",
  play: "M8 4l12 8-12 8z",
  calendar: "M3 5h18v16H3z M7 2v6 M17 2v6 M3 11h18",
  save: "M6 3h12v18l-6-4-6 4z",
  logout: "M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  shield: "M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6",
  image: "M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M16 7h.01",
  send: "M2 3l20 9-20 9 4-9z M6 12h16",
  external: "M14 3h7v7 M21 3L10 14 M10 3H3v18h18v-7",
  refresh: "M20 7a9 9 0 1 0 1 9 M20 2v6h-6",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 6v6l4 2",
  volume: "M3 9h4l5-4v14l-5-4H3z M16 7c4 3 4 7 0 10",
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}
