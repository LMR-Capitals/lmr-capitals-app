import { createClient } from "@supabase/supabase-js";
import { config, preview } from "../member/config.js";

// Life OS runs as a same-origin iframe inside the member app. Re-discovering the
// Supabase session here with a second GoTrue client that shares the member app's
// storage key deadlocks on the shared navigator.locks lock (the page hung on
// "Loading your private workspace…"). Instead we use an isolated, in-memory client
// and adopt the already-verified admin session the parent hands us. No persistence
// and no auto-refresh here, so this client never contends on the lock and never
// races the parent on refresh-token rotation — the parent owns refresh and re-pushes.
export const lifeOsClient = preview
  ? null
  : createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        storageKey: "sb-lmr-life-os",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

// Resolves once the parent's session has been adopted (or after a short fallback
// wait, so the normal verify gate still shows if we are opened outside the app).
let settle;
export const sessionReady = new Promise((resolve) => {
  settle = resolve;
});

if (preview || typeof window === "undefined" || window.parent === window) {
  settle?.(true); // preview or opened top-level: nothing to adopt
} else {
  let done = false;
  const finish = (ok) => {
    if (!done) {
      done = true;
      settle?.(ok);
    }
  };
  const adopt = async (payload) => {
    if (
      !payload ||
      payload.type !== "lmr-life-os-session" ||
      !payload.access_token ||
      !payload.refresh_token
    )
      return;
    try {
      await lifeOsClient.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      finish(true);
    } catch {
      /* keep waiting for a valid push */
    }
  };
  // Keep listening so a later parent token refresh propagates in.
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    adopt(event.data);
  });
  try {
    window.parent.postMessage({ type: "lmr-life-os-request-session" }, location.origin);
  } catch {
    /* ignore */
  }
  setTimeout(() => finish(false), 4000);
}
