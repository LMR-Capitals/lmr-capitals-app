import {newestJournalFirst} from "./journal-order.mjs";
import { previewDeskChannel } from "./preview-sync";
import { demoJournalEntries } from "./journal-demo";
import {AchievementDetails, ObservationRecord} from "./journal-record";
import {journalTitle} from "./journal-media.mjs";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./member.css";
import Icon from "./icons";
import { chapters } from "./learning";
import { learningState } from "./learning-model.mjs";
import SocialLinks from "./socials";
import { guideUrl, policyUrl, policies } from "./guidelines.mjs";
import Auth from "./auth";
import Admin from "./admin";
import AdminHub from "./admin-hub";
import { circleUrl, canOpenJournal } from "./portal-flow.mjs";
import JournalWorkspace from "./journal-workspace";
import { administratorEntry, workspaceRole } from "./workspace-access.mjs";
import { studioSections, studioSection } from "./studio-model.mjs";
import { avatarSource } from "./profile-photo.mjs";
import { fetchTerminalWorkspace } from "../admin/terminal-api";
import { useAdminActions } from "./admin-actions";
import { sessionBlocks } from "./live-sessions.mjs";
import {
  Dashboard,
  Library,
  Feed,
  Gallery,
  Live,
  Mentorship,
  Questions,
  Notifications,
  Settings,
  Profile,
  Billing,
  FreeResources,
} from "./screens";
import { Logo, Button, Empty, Modal, AccountMenu, formatDate } from "./ui";
import { preview, config, safeEmbed, safeHttps, accountRegistrationReady } from "./config";
import { sb, checked, access, fetchWorkspace, fetchAccount, billing, uploadAvatar } from "./api";
import {
  demoPosts,
  demoSessions,
  demoNotifications,
  demoQuestions,
} from "./demo";
const premiumRoutes = [
  "live",
  "observations",
  "executions",
  "achievements",
  "mentorship",
  "callouts",
  "application",
];
const comparisonPreview =
  preview && !!new URLSearchParams(location.search).get("preview_group");
const initialPaidPreview =
  preview && new URLSearchParams(location.search).get("tier") === "paid";
const initialAdministratorPreview =
  preview && new URLSearchParams(location.search).get("tier") === "admin";
const navigation = [
  ["dashboard", "Dashboard", "Built on THE Chain Methodology."],
  [
    "live",
    "Live analysis",
    "Watch the reasoning. Ask the questions. Build your understanding.",
  ],
  [
    "observations",
    "LMR observations",
    "The full notes, context and charts from the LMR Journal.",
  ],
  [
    "terminology",
    "LMR terminology",
    "Learn the language. Understand the process.",
  ],
  [
    "resources",
    "Free resources",
    "Reference materials and free publications from the LMR desk.",
  ],
  [
    "executions",
    "LMR executions",
    "A visual record of the plan, the decision, and the review.",
  ],
  ["achievements", "Achievements", "The milestones behind the LMR journey."],
  [
    "mentorship",
    "Private mentorship",
    "A focused conversation about your learning and trading process.",
  ],
  [
    "questions",
    "Questions & answers",
    "Your questions. A direct conversation with the LMR desk.",
  ],
  [
    "application",
    "Trading Journal",
    "Plan, journal and review with THE Chain Methodology.",
  ],
  [
    "notifications",
    "Notifications",
    "Everything the LMR desk has shared with you.",
  ],
  ["profile", "Your profile", "Make your space your own."],
  ["settings", "Settings", "Manage your workspace and preferences."],
  [
    "billing",
    "Membership & billing",
    "Manage your access to the Inner Circle.",
  ],
  [
    "admin",
    "LMR Studio",
    "The admin workspace for your member community.",
  ],
  ["admin-hub", "Admin Hub", "Your accounts, subscriptions and journal database."],
  ["callouts", "LMR Callouts", "The conditions, context and invalidation behind the idea."],
  ...studioSections.map(({route, label, description}) => [route, label, description]),
];
const baseData = {
  learning: [],
  adminPosts: [],
  posts: [],
  sessions: [],
  questions: [],
  notifications: [],
  reads: [],
  preferences: {
    live_alerts: true,
    post_alerts: true,
    mentorship_alerts: true,
  },
  profile: {},
  mentorship: [],
  saved: [],
};
const legal = policies;
function App() {
  const [user, setUser] = useState(
      preview ? { id: initialAdministratorPreview ? "preview-admin" : "preview-member", email: initialAdministratorPreview ? "admin@lmrcapitals.com" : "member@example.com" } : null,
    ),
    [authReady, setAuthReady] = useState(preview),
    [accessState, setAccess] = useState(
      preview
        ? {
            entitled: initialPaidPreview || initialAdministratorPreview,
            admin: initialAdministratorPreview,
            adminVerified: initialAdministratorPreview,
            paid: initialPaidPreview,
            subscription: null,
          }
        : null,
    ),
    [data, setData] = useState(
      preview
        ? {
            ...baseData,
            adminPosts: initialAdministratorPreview ? demoPosts : [],
            posts: demoPosts,
            journalEntries: demoJournalEntries,
            sessions: demoSessions,
            questions: demoQuestions,
            notifications: demoNotifications,
            profile: {
              display_name: initialAdministratorPreview ? "Administrator" : "Member",
              timezone: "America/New_York",
              bio: "",
            },
          }
        : baseData,
    ),
    [route, setRoute] = useState(location.hash.slice(1) || (initialAdministratorPreview ? "admin" : "dashboard")),
    [search, setSearch] = useState(""),
    [menu, setMenu] = useState(false),
    [loading, setLoading] = useState(!preview),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [recovery, setRecovery] = useState(
      new URLSearchParams(location.search).get("recovery") === "1",
    );
  const timer = useRef(),
    authenticatedIdentity = useRef(null),
    menuButton = useRef(null),
    sidebar = useRef(null),
    requestGeneration = useRef(0),
    operation = useRef(false),
    lastCircleRoute = useRef(initialAdministratorPreview ? "admin" : "dashboard");
  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  useEffect(() => {
    const channel = previewDeskChannel();
    if (!channel) return;
    channel.onmessage = ({ data: message }) => {
      if (
        message?.type !== "desk-update" ||
        !Array.isArray(message.posts) ||
        !Array.isArray(message.sessions) ||
        !Array.isArray(message.notifications)
      )
        return;
      setData((current) => ({
        ...current,
        posts: message.posts,
        sessions: message.sessions,
        notifications: [
          ...message.notifications,
          ...current.notifications.filter((notice) => notice.target_user_id),
        ],
      }));
    };
    channel.postMessage({ type: "member-ready" });
    return () => channel.close();
  }, []);
  const go = (id) => {
    if (id === "application" && accessState && !canOpenJournal(accessState)) {
      id = "billing";
      const query = new URLSearchParams(location.search);
      query.set("next", "journal");
      history.replaceState(null, "", `${location.pathname}?${query}#billing`);
      setRoute("billing");
    }
    if (!preview && route === "application" && id !== "application") refresh(true);
    location.hash = id;
    setMenu(false);
    setSearch("");
  };
  useEffect(() => {
    if (route !== "application") lastCircleRoute.current = route === "admin-hub" ? "settings" : route;
  }, [route]);
  useEffect(() => {
    if (!menu) return;
    sidebar.current?.querySelector("button")?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      menuButton.current?.focus();
    };
  }, [menu]);
  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash.slice(1) || "dashboard");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (preview) return;
    let active = true;
    sb.auth.getSession().then(({ data, error }) => {
      if (active) {
        if (error) setError(error.message);
        authenticatedIdentity.current = data.session?.user?.id || null;
        setUser(data.session?.user || null);
        setAuthReady(true);
      }
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (active) {
        const nextIdentity = session?.user?.id || null;
        if (nextIdentity !== authenticatedIdentity.current) {
          ++requestGeneration.current;
          setAccess(null);
          setData(baseData);
          setLoading(!!nextIdentity);
          if (event === "SIGNED_IN") {
            history.replaceState(null, "", location.pathname + location.search);
            setRoute("dashboard");
          }
        }
        authenticatedIdentity.current = nextIdentity;
        setUser(session?.user || null);
        setAuthReady(true);
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const refresh = useCallback(
    async (quiet = false) => {
      if (preview) return;
      const generation = ++requestGeneration.current;
      if (!user) {
        setData(baseData);
        setAccess(null);
        setLoading(false);
        return;
      }
      if (!quiet) {
        setLoading(true);
        setError("");
      }
      let a;
      try {
        a = await access(user);
        if (generation !== requestGeneration.current) return;
        setAccess(a);
        if (a.admin && !a.adminVerified) { setData(baseData); return; }
        const next = a.admin
          ? { ...baseData, ...await fetchAccount(user), ...await fetchTerminalWorkspace() }
          : await fetchWorkspace(user, false);
        if (generation !== requestGeneration.current) return;
        setData(next);
      } catch (e) {
        if (generation === requestGeneration.current) {
          setError(`The ${a?.admin ? "administrator" : "member"} workspace could not load. ${e.message}`);
          setAccess(a || null);
          setData(baseData);
        }
      } finally {
        if (generation === requestGeneration.current) setLoading(false);
      }
    },
    [user],
  );
  useEffect(() => {
    refresh();
    return () => {
      requestGeneration.current++;
    };
  }, [refresh]);
  useEffect(() => {
    if (loading || !accessState || !user || recovery) return;
    if (preview) {
      if (route === "admin-hub") go("settings");
      else if (administratorEntry(accessState, route)) go("admin");
      return;
    }
    const administratorDestination = administratorEntry(accessState, route);
    if (administratorDestination) {
      if (accessState.adminVerified) {
        const requestedJournal = new URLSearchParams(location.search).get("next") === "journal";
        const target = requestedJournal ? "application" : "admin";
        history.replaceState(null, "", `${circleUrl}${location.search}#${target}`);
        setRoute(target);
      } else location.replace(administratorDestination);
      return;
    }
    if (route === "admin-hub") { go("settings"); return; }
    const requestedJournal = new URLSearchParams(location.search).get("next") === "journal";
    if (requestedJournal && canOpenJournal(accessState)) {
      const query = new URLSearchParams(location.search);
      query.delete("next");
      history.replaceState(null, "", `${location.pathname}${query.size ? `?${query}` : ""}#application`);
      setRoute("application");
    } else if ((route === "application" && !canOpenJournal(accessState)) || (requestedJournal && !canOpenJournal(accessState) && route === "dashboard")) go("application");
  }, [loading, accessState, route, user, recovery]);
  useEffect(() => {
    if (preview || !user) return;
    let pending = false;
    const sync = () => {
      if (document.visibilityState === "visible" && !pending) {
        pending = true;
        refresh(true).finally(() => (pending = false));
      }
    };
    const tick = setInterval(sync, 60000);
    window.addEventListener("focus", sync);
    return () => {
      clearInterval(tick);
      window.removeEventListener("focus", sync);
    };
  }, [user, refresh]);
  const run = async (fn) => {
    if (operation.current) return false;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
      operation.current = false;
    }
  };
  const recordLearning = (chapter, term, checkpoint_answers) =>
    run(async () => {
      let item;
      if (preview) {
        const state = learningState(chapters, data.learning),
          target = state.chapters[chapter - 1];
        if (!target?.unlocked)
          throw new Error("Complete the previous chapter first.");
        const existing = data.learning.find(
          (r) => r.chapter_no === chapter,
        ) || { chapter_no: chapter, reviewed_terms: [], completed_at: null };
        if (term && !target.terms.includes(term))
          throw new Error("This lesson does not belong to the chapter.");
        item = {
          ...existing,
          reviewed_terms: term
            ? [...new Set([...existing.reviewed_terms, term])]
            : existing.reviewed_terms,
        };
        if (checkpoint_answers) {
          if (!target.terms.every((id) => item.reviewed_terms.includes(id)))
            throw new Error("Study every lesson before the checkpoint.");
          if (
            checkpoint_answers.some(
              (answer, i) => answer !== target.terms[i],
            ) ||
            checkpoint_answers.length !== 2
          )
            throw new Error(
              "Revisit the definitions and try the checkpoint again.",
            );
          item.completed_at = existing.completed_at || new Date().toISOString();
        }
      } else {
        const result = await checked(
          sb.rpc("circle_record_learning", {
            chapter,
            term: term || null,
            checkpoint_answers: checkpoint_answers || null,
          }),
        );
        item = Array.isArray(result) ? result[0] : result;
        if (!item || item.chapter_no !== chapter)
          throw new Error(
            "Your progress could not be confirmed. Refresh and try again.",
          );
      }
      setData((d) => ({
        ...d,
        learning: [...d.learning.filter((r) => r.chapter_no !== chapter), item],
      }));
      if (checkpoint_answers)
        notify(
          `Chapter ${chapter} complete. ${chapter < chapters.length ? "Your next chapter is unlocked." : "Your Chain journey is complete."}`,
        );
    });
  const previewMembership = (paid) => {
    setAccess((a) => ({
      ...a,
      entitled: paid,
      paid,
      admin: false,
      adminVerified: false,
    }));
    setModal(null);
    setError("");
  };
  const save = async (id) =>
    run(async () => {
      const exists = data.saved.includes(id);
      if (!preview)
        await checked(
          exists
            ? sb
                .from("circle_saved_posts")
                .delete()
                .eq("user_id", user.id)
                .eq("post_id", id)
            : sb
                .from("circle_saved_posts")
                .insert({ user_id: user.id, post_id: id }),
        );
      setData((d) => ({
        ...d,
        saved: exists ? d.saved.filter((x) => x !== id) : [...d.saved, id],
      }));
      notify(exists ? "Removed from saved posts." : "Saved to your desk feed.");
    });
  const onRead = (id) =>
    run(async () => {
      if (!preview)
        await checked(
          sb
            .from("circle_notification_reads")
            .upsert(
              { user_id: user.id, notification_id: id },
              { onConflict: "user_id,notification_id" },
            ),
        );
      setData((d) => ({ ...d, reads: [...d.reads, id] }));
    });
  const onPreference = (key, value) =>
    run(async () => {
      const preferences = { ...data.preferences, [key]: value };
      if (!preview)
        await checked(
          sb
            .from("circle_preferences")
            .upsert({ ...preferences, user_id: user.id }),
        );
      setData((d) => ({ ...d, preferences }));
      notify(
        preview
          ? "Preview preference updated."
          : "Notification preference saved.",
      );
    });
  const onProfile = (e) => {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    const profile = {
      display_name: String(f.get("display_name")).trim(),
      timezone: String(f.get("timezone")),
      bio: String(f.get("bio")).trim(),
      avatar_mode: String(f.get("avatar_mode") || data.profile.avatar_mode || "provider"),
      avatar_path: data.profile.avatar_path || null,
    };
    run(async () => {
      if (!profile.display_name) throw new Error("Enter a display name.");
      const photo = f.get("avatar");
      if (photo?.size) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(photo.type) || photo.size > 5 * 1024 * 1024)
          throw new Error("Choose a PNG, JPEG or WebP photo under 5 MB.");
        profile.avatar_mode = "custom";
        profile.avatar_path = preview ? null : await uploadAvatar(photo, user);
        profile.avatar_url = preview ? URL.createObjectURL(photo) : null;
      }
      if (profile.avatar_mode !== "custom") profile.avatar_path = null;
      if (!preview) {
        const { avatar_url, ...record } = profile;
        await checked(sb.from("circle_profiles").upsert({ ...record, user_id: user.id }));
        if (profile.avatar_path) {
          const signed = await checked(sb.storage.from("circle-avatars").createSignedUrl(profile.avatar_path, 3600));
          profile.avatar_url = signed.signedUrl;
        }
      }
      setData((d) => ({ ...d, profile }));
      const photoInput = form.querySelector('[name="avatar"]');
      if(photoInput) photoInput.value = "";
      notify("Profile saved" + (preview ? " in this preview." : "."));
    });
  };
  const signout = () =>
    run(async () => {
      if (preview) {
        location.assign("/member/index.html");
        return;
      }
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      setData(baseData);
      setAccess(null);
      setUser(null);
    });
  const question = (post, session) => {
    if (session && !accessState?.entitled) {
      go("billing");
      return;
    }
    setModal({ type: "question", post, session });
  };
  const submitQuestion = (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      record = {
        user_id: user.id,
        title: String(f.get("title")).trim(),
        body: String(f.get("body")).trim(),
        status: "open",
        session_id: modal.session || null,
      };
    run(async () => {
      if (!user || user.is_anonymous) throw new Error("Sign in to submit your question.");
      if (record.session_id && !accessState?.entitled) throw new Error("Membership is required for live-session questions.");
      if (!record.title || !record.body)
        throw new Error("Add a question and its context.");
      const item = preview
        ? {
            ...record,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
        : await checked(
            sb.from("circle_questions").insert(record).select().single(),
          );
      setData((d) => ({ ...d, questions: [item, ...d.questions] }));
      setModal(null);
      go("questions");
      notify("Question submitted" + (preview ? " in preview." : "."));
    });
  };
  const requestMentorship = (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    const record = {
      user_id: user.id,
      goals: String(f.get("goals")).trim(),
      experience: String(f.get("experience")),
      availability: String(f.get("availability")).trim(),
      status: "pending",
    };
    run(async () => {
      if (!accessState?.paid)
        throw new Error("An active paid membership is required.");
      if (
        data.mentorship.some((r) =>
          ["pending", "reviewing", "approved", "scheduled"].includes(r.status),
        )
      )
        throw new Error(
          "You already have a request in progress. LMR will respond in your account.",
        );
      const item = preview
        ? {
            ...record,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
        : await checked(
            sb
              .from("circle_mentorship_requests")
              .insert(record)
              .select()
              .single(),
          );
      setData((d) => ({ ...d, mentorship: [item, ...d.mentorship] }));
      form.reset();
      notify(
        "Your mentorship request has been submitted" +
          (preview ? " in preview." : "."),
      );
    });
  };

  const {
    onPublish,
    onJournalPublish,
    onCreateObservation,
    onSession,
    onPostStatus,
    onSessionStatus,
    onSessionBlock,
    onAnnouncement,
    answer,
    replyMentorship,
  } = useAdminActions({ user, data, setData, run, refresh, notify });
  const legalModal = (type) => setModal({ type: "legal", kind: type });
  const modalView = modal && (
    <Modal
      title={
        modal.type === "legal"
          ? legal[modal.kind].title
          : modal.type === "question"
            ? "Ask the LMR desk"
            : journalTitle(modal.post)
      }
      onClose={() => setModal(null)}
    >
      {error && (
        <div className="banner error" role="alert">
          {error}
        </div>
      )}
      {modal.type === "legal" ? (
        <div className="legal-body">
          <p>{legal[modal.kind].draft && accountRegistrationReady ? "Read the current account policy before continuing." : legal[modal.kind].introduction}</p>
          <a className="button" href={
            config.legalApproved && modal.kind === "terms" && safeHttps(config.termsUrl) ? config.termsUrl :
            config.legalApproved && modal.kind === "privacy" && safeHttps(config.privacyUrl) ? config.privacyUrl : policyUrl(modal.kind)
          } target="_blank" rel="noreferrer">Read the full {legal[modal.kind].title.toLowerCase()} <Icon name="external" size={15} /></a>
          {legal[modal.kind].draft && !accountRegistrationReady && <p>Draft for review. New registration and paid enrollment are awaiting approval.</p>}

        </div>
      ) : modal.type === "question" ? (
        <form className="form-stack" onSubmit={submitQuestion}>
          <label>
            Your question
            <input
              name="title"
              defaultValue={modal.post ? `About: ${modal.post.title}` : ""}
              required
              maxLength="160"
            />
          </label>
          <label>
            Context
            <textarea
              name="body"
              required
              maxLength="5000"
              placeholder="What would you like LMR to explain?"
            />
          </label>
          <p className="form-help">
            Your question is private to you and the LMR admin team.
          </p>
          <Button gold disabled={busy} type="submit">
            {busy ? "Submitting…" : "Submit question"}
          </Button>
        </form>
      ) : (
        <>
          {modal.post.image_url && (
            <img
              className="modal-image"
              src={modal.post.image_url}
              alt={modal.post.image_caption || modal.post.title}
            />
          )}
          {modal.post.kind === "achievement" ? <AchievementDetails record={modal.post} /> : <p className="content-note">{modal.post.body}</p>}
          {modal.post.source_content && <ObservationRecord record={modal.post} />}
        </>
      )}
    </Modal>
  );
  if (!authReady)
    return (
      <div className="loading">
        <span className="spinner" />
        Checking your LMR session…
      </div>
    );
  if (!user || recovery)
    return (
      <>
        <Auth onLegal={legalModal} recovery={recovery} />
        {modalView}
      </>
    );
  if (!preview && !accessState && error)
    return <div className="terminal-gate"><Logo /><Empty icon="shield" title="We couldn't verify your workspace." body={error}><Button gold onClick={() => refresh()}>Try again</Button><Button onClick={signout}>Sign out</Button></Empty></div>;
  if ((!preview && !accessState) || administratorEntry(accessState, route))
    return <div className="loading"><span className="spinner" />{accessState?.admin ? "Opening your administrator workspace…" : "Checking your workspace access…"}</div>;
  const entitled = accessState?.entitled,
    admin = accessState?.admin;
  const role = workspaceRole(accessState);
  const nav = navigation.find((n) => n[0] === route) || navigation[0];
  const name =
    data.profile.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || (admin ? "Administrator" : "Member");
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const filteredData = {
    ...data,
    sessions: entitled ? data.sessions : [],
    questions: admin ? data.questions : data.questions.filter(q => preview || q.user_id === user.id),
    notifications: data.notifications.filter(
      (n) => entitled || n.audience === "free" || n.target_user_id === user.id,
    ),
    posts: newestJournalFirst(data.posts)
      .filter((p) => entitled || p.kind === "terminology")
      .filter((p) =>
        `${p.title} ${p.body} ${p.source_content || ""} ${JSON.stringify(p.source_details || {})}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  };
  const props = {
    userId: user.id,
    data: filteredData,
    go,
    onLegal: legalModal,
    onSave: save,
    onImage: (post) => setModal({ type: "image", post }),
    onQuestion: question,
    premium: !!entitled,
  };
  let screen;
  if (loading)
    screen = (
      <div className="loading">
        <span className="spinner" />
        Loading your member workspace…
      </div>
    );
  else if (!accessState)
    screen = (
      <Empty
        icon="lock"
        title="We couldn't verify your membership."
        body="Access stays locked until the server can confirm your account."
      >
        <Button onClick={() => refresh()}>Try again</Button>
      </Empty>
    );
  else if (!entitled && premiumRoutes.includes(route))
    screen = (
      <Empty
        icon="lock"
        title={`${nav[1]} is part of paid membership.`}
        body="Keep learning with your free account. Membership unlocks the live desk, private support, publications and trading application."
      >
        {route === "live" && (
          <div
            className="locked-session-blocks"
            aria-label="Subscriber live analysis rooms"
          >
            {sessionBlocks.map((block) => (
              <span className="tag" key={block.id}>
                {block.label}
              </span>
            ))}
          </div>
        )}
        <Button gold onClick={() => go("billing")}>
          Explore membership
        </Button>
      </Empty>
    );
  else if (admin && studioSection(route)) {
    const section = studioSection(route);
    screen = <Admin key={route} data={data} onPublish={onPublish} onJournalPublish={onJournalPublish} onCreateObservation={onCreateObservation} onRefreshJournal={() => refresh(true)}
      onSession={onSession} onAnnouncement={onAnnouncement} onAnswer={answer} onMentorshipReply={replyMentorship}
      onPostStatus={onPostStatus} onSessionStatus={onSessionStatus} onSessionBlock={onSessionBlock}
      busy={busy} verified={accessState.adminVerified} activeTab={section.tab} initialKind={section.kind} hideTabs />;
  } else
    switch (route) {
      case "live":
        screen = <Live data={data} onQuestion={question} />;
        break;
      case "terminology":
        screen = (
          <Library
            search={search}
            progress={data.learning}
            onStudy={(chapter, term) => recordLearning(chapter, term)}
            onComplete={(chapter, answers) =>
              recordLearning(chapter, null, answers)
            }
            busy={busy}
          />
        );
        break;
      case "resources":
        screen = <FreeResources {...props} />;
        break;
      case "callouts":
        screen = <Feed {...props} kind="callout" search={search} />;
        break;
      case "observations":
        screen = <Feed {...props} kind="observation" search={search} />;
        break;
      case "executions":
      case "achievements":
        screen = (
          <Gallery
            {...props}
            kind={route === "executions" ? "execution" : "achievement"}
            search={search}
          />
        );
        break;
      case "mentorship":
        screen = (
          <Mentorship
            data={data}
            paid={accessState.paid || preview}
            go={go}
            busy={busy}
            onRequest={requestMentorship}
          />
        );
        break;
      case "questions":
        screen = <Questions data={data} onQuestion={question} />;
        break;
      case "application":
        screen = null;
        break;
      case "notifications":
        screen = <Notifications data={filteredData} onRead={onRead} go={go} />;
        break;
      case "settings":
        screen = (
          <>
            {admin && <section aria-label="Administration"><AdminHub verified={accessState.adminVerified} user={user} onNavigate={go} /></section>}
            <section className={admin ? "admin-notification-settings" : undefined} aria-label="Notification preferences"><Settings data={data} onPreference={onPreference} busy={busy} /></section>
          </>
        );
        break;
      case "profile":
        screen = (
          <Profile
            data={data}
            user={user}
            onProfile={onProfile}
            busy={busy}
            onSignOut={signout}
            administrator={admin}
          />
        );
        break;
      case "billing":
        screen = (
          <>
          {new URLSearchParams(location.search).get("next") === "journal" && (
            <div className="banner"><Icon name="lock" size={18} /><span>Journal Application requires paid membership. Once your paid invoice is verified, we’ll take you straight into your journal.</span></div>
          )}
          <Billing
            subscription={accessState.subscription}
            entitled={entitled}
            busy={busy}
            onRefresh={() => refresh()}
            onLegal={legalModal}
            onBilling={(action, plan) =>
              run(async () => {
                if (preview) {
                  notify("Stripe is disabled in preview.");
                  return;
                }
                await billing(action, plan);
              })
            }
          />
          </>
        );
        break;
      case "admin-hub":
        screen = admin ? <AdminHub verified={accessState.adminVerified} user={user} onNavigate={go} /> : <Empty icon="shield" title="Administrator access required" body="The Admin Hub is available to verified LMR administrators." />;
        break;
      case "admin":
        screen = admin ? (
          <Admin
            data={data}
            onPublish={onPublish}
            onJournalPublish={onJournalPublish}
            onCreateObservation={onCreateObservation}
            onRefreshJournal={() => refresh(true)}
            onSession={onSession}
            onAnnouncement={onAnnouncement}
            onAnswer={answer}
            onMentorshipReply={replyMentorship}
            onPostStatus={onPostStatus}
            onSessionStatus={onSessionStatus}
            onSessionBlock={onSessionBlock}
            busy={busy}
            verified={accessState.adminVerified}
            activeTab="manage"
            hideTabs
          />
        ) : (
          <Empty
            icon="shield"
            title="Administrator access required"
            body="Publishing is restricted to verified LMR administrators."
          />
        );
        break;
      default:
        screen = <Dashboard {...props} />;
    }
  return (
    <div className={preview && !comparisonPreview ? "is-preview" : ""}>
      <a className="skip" href={route === "application" && canOpenJournal(accessState) ? "#workspace-journal" : "#workspace-content"} onClick={(event) => {
        event.preventDefault();
        document.getElementById(route === "application" && canOpenJournal(accessState) ? "workspace-journal" : "workspace-content")?.focus();
      }}>
        Skip to content
      </a>
      {preview && !comparisonPreview && (
        <div className="preview-ribbon">
          <strong>{initialAdministratorPreview ? "ADMINISTRATOR PREVIEW" : "APPLICATION PREVIEW"}</strong>
          <span>Sample activity · No payments or production writes</span>
          {!initialAdministratorPreview && <div className="preview-tier" aria-label="Preview account access">
            <button
              aria-pressed={!entitled}
              onClick={() => previewMembership(false)}
            >
              Free account
            </button>
            <button
              aria-pressed={!!entitled}
              onClick={() => previewMembership(true)}
            >
              Paid member
            </button>
          </div>}
          <a href="/member/index.html">Go to real sign in</a>
        </div>
      )}
      {menu && (
        <button
          className="menu-shade"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        id="member-navigation"
        ref={sidebar}
        className={`app-sidebar ${menu ? "open" : ""}`}
        hidden={route === "application" && canOpenJournal(accessState)}
      >
        <a href="/" aria-label="LMR Capitals home"><Logo /></a>
        <div className="workspace-label">{admin ? "ADMINISTRATOR WORKSPACE" : role === "paid" ? "PAID MEMBER WORKSPACE" : "FREE MEMBER WORKSPACE"}</div>
        {!admin && (
        <nav aria-label="Member navigation">
          {navigation
            .filter(
              ([id]) =>
                !id.startsWith("studio-") && ![
                  "notifications",
                  "profile",
                  "settings",
                  "billing",
                  "admin",
                  "admin-hub",
                  "application",
                ].includes(id),
            )
            .sort((a, b) => {
              const order = [
                "dashboard",
                "terminology",
                "resources",
                "live",
                "observations",
                "callouts",
                "executions",
                "achievements",
                "mentorship",
                "questions",
                "application",
              ];
              return order.indexOf(a[0]) - order.indexOf(b[0]);
            })
            .map(([id, label]) => (
              <button
                className={`nav-item ${route === id ? "active" : ""}`}
                key={id}
                aria-current={route === id ? "page" : undefined}
                onClick={() => go(id)}
              >
                <Icon name={id} />
                {label}
                {premiumRoutes.includes(id) && !entitled && (
                  <Icon name="lock" size={12} />
                )}
              </button>
            ))}
        </nav>
        )}
        {admin && (
          <nav aria-label="Administration">
            <button
              className={`nav-item ${route === "admin" ? "active" : ""}`}
              onClick={() => go("admin")}
            >
              <Icon name="shield" />
              LMR Studio
            </button>
            {studioSections.map(({route: id, label, icon}) => <button key={id} className={`nav-item ${route === id ? "active" : ""}`} aria-current={route === id ? "page" : undefined} onClick={() => go(id)}><Icon name={icon} />{label}</button>)}
          </nav>
        )}
        <div className="sidebar-foot">
          <div className="member-access">
            <span>
              <Icon name="shield" size={13} />
              {admin ? "Administrator access" : comparisonPreview
                ? entitled
                  ? "Paid membership"
                  : "Free Inner Circle account"
                : preview
                  ? entitled
                    ? "Paid member preview"
                    : "Free account preview"
                  : entitled
                    ? "Paid membership active"
                    : "Free Inner Circle account"}
            </span>
            <p>
              {admin ? "Your administration, publishing and journal workspace." : preview
                ? entitled
                  ? "Explore the full member experience."
                  : "Learn the foundations, one chapter at a time."
                : entitled
                  ? "Your access is verified with LMR."
                  : "Your chapter path and free resources are ready."}
            </p>
          </div>
          <AccountMenu
            name={name}
            initials={initials}
            photo={avatarSource(data.profile, user)}
            subtitle={
              admin ? "LMR administrator" : preview && !comparisonPreview ? "Preview account" : role === "paid" ? "Paid member" : "Free member"
            }
            administrator={admin}
            onNavigate={go}
            onSignOut={signout}
            busy={busy}
          />
        </div>
      </aside>
      <div className={`app-main${route === "application" && canOpenJournal(accessState) ? " journal-surface-active" : ""}`}>
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            hidden={route === "application" && canOpenJournal(accessState)}
            ref={menuButton}
            aria-label="Open navigation"
            aria-expanded={menu}
            aria-controls="member-navigation"
            onClick={() => setMenu(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="workspace-switcher" role="group" aria-label="Switch workspace">
            <button aria-pressed={route !== "application"} onClick={() => go(route === "application" ? lastCircleRoute.current : admin ? "admin" : "dashboard")}><Icon name="dashboard" size={16} /><span>Inner Circle</span></button>
            <button aria-pressed={route === "application"} onClick={() => go("application")}><Icon name="application" size={16} /><span>Trading Journal</span>{!canOpenJournal(accessState) && <Icon name="lock" size={12} />}</button>
          </div>
          <div className="top-actions">
            {!entitled && !admin && (
              <Button small gold onClick={() => go("billing")}>
                Get membership
              </Button>
            )}
            {[
              "dashboard",
              "observations",
              "terminology",
              "executions",
              "achievements",
            ].includes(route) && (
              <label className="search-box">
                <Icon name="search" size={15} />
                <input
                  aria-label="Search current section"
                  placeholder={
                    route === "terminology"
                      ? "Search terminology"
                      : "Search this section"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            )}
            <button
              className="icon-button"
              aria-label="Open notifications"
              onClick={() => go("notifications")}
            >
              <Icon name="notifications" />
              {filteredData.notifications.some(
                (n) => !data.reads.includes(n.id),
              ) && <span className="unread-dot" />}
            </button>
            <AccountMenu
              compact
              administrator={admin}
              name={name}
              initials={initials}
              photo={avatarSource(data.profile, user)}
              onNavigate={go}
              onSignOut={signout}
              busy={busy}
            />
          </div>
        </header>
        <main className="page" id="workspace-content" tabIndex={-1} hidden={route === "application" && canOpenJournal(accessState)}>
          <div className="page-head">
            <div>
              <h1>
                {route === "dashboard"
                  ? `Welcome to the circle${name === "Member" ? "." : `, ${name.split(" ")[0]}.`}`
                  : nav[1]}
              </h1>
              <p>{nav[2]}</p>
            </div>
            {route === "dashboard" ? (
              <span className="head-date">
                <Icon name="calendar" size={14} />
                {formatDate(new Date(), {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : route === "questions" ? (
              <Button gold icon="plus" onClick={() => question()}>
                Ask a question
              </Button>
            ) : null}
          </div>
          {error && (
            <div className="banner error" role="alert">
              <Icon name="shield" size={17} />
              <span>{error}</span>
              <button className="text-button" onClick={() => refresh()}>
                Retry
              </button>
            </div>
          )}
          {new URLSearchParams(location.search).get("checkout") === "success" &&
            route === "billing" && (
              <div className="banner">
                {entitled ? "Your paid membership is verified. Your workspace is open." : "You returned from checkout. Paid access opens after payment verification. Refresh your membership status before attempting another purchase."}
              </div>
            )}
          {new URLSearchParams(location.search).get("checkout") === "cancel" && route === "billing" && <div className="banner" role="status">You left checkout. Your free account remains available. Check your membership status before starting another payment.</div>}
          {[
            "dashboard",
            "observations",
            "callouts",
            "terminology",
            "executions",
            "achievements",
          ].includes(route) && (
            <label className="mobile-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Search current section on mobile"
                placeholder={
                  route === "terminology"
                    ? "Search LMR terminology"
                    : "Search this section"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          )}
          <div key={route} className="portal-page-enter">{screen}</div>
          <footer className="app-footer">
            <span>
              © {new Date().getFullYear()} LMR Capitals. Built on THE Chain
              Methodology.
            </span>
            <SocialLinks />
            <div>
              <a href={guideUrl}>Joining guide</a>
              <button onClick={() => legalModal("risk")}>
                Risk disclosure
              </button>
              <button onClick={() => legalModal("terms")}>Terms</button>
              <button onClick={() => legalModal("privacy")}>Privacy</button>
            </div>
          </footer>
        </main>
        {canOpenJournal(accessState) && <JournalWorkspace key={user.id} active={route === "application"} preview={preview} administrator={admin} onNavigate={go} onAccessCheck={() => refresh(true)} onVerify={() => location.assign("/admin?next=journal")} />}
      </div>
      {modalView}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="loading">
        <div>
          <h2>The workspace could not render.</h2>
          <p>Please reload the page. Your account data has not been changed.</p>
          <Button onClick={() => location.reload()}>Reload workspace</Button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <Boundary>
    <App />
  </Boundary>,
);
