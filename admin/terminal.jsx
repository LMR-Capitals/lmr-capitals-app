import { previewDeskChannel, previewDeskMessage } from "../member/preview-sync";
import { demoJournalEntries } from "../member/journal-demo";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../member/member.css";
import "./terminal.css";
import Icon from "../member/icons";
import { Logo, Button, Empty, formatDate, kindLabels } from "../member/ui";
import Admin from "../member/admin";
import AdminHub from "../member/admin-hub";
import { openJournal } from "../member/portal-flow.mjs";
import { useAdminActions } from "../member/admin-actions";
import { sb } from "../member/api";
import { preview } from "../member/config";
import {
  demoPosts,
  demoSessions,
  demoNotifications,
  demoQuestions,
} from "../member/demo";
import { verifyTerminalAccess } from "./terminal-access.mjs";
import { emptyDesk, fetchTerminalWorkspace } from "./terminal-api";

const sections = [
  ["overview", "Desk overview", "dashboard"],
  ["hub", "Admin Hub", "shield"],
  ["live", "Live analysis", "live", "session"],
  ["observations", "LMR observations", "observations", "post", "observation"],
  ["executions", "Execution images", "executions", "post", "execution"],
  ["achievements", "Achievements", "achievements", "post", "achievement"],
  ["resources", "Free resources", "resources", "post", "terminology"],
  ["publications", "All publications", "terminology", "manage"],
  ["questions", "Questions & answers", "questions", "questions"],
  ["mentorship", "Private mentorship", "mentorship", "mentorship"],
  ["notifications", "Announcements", "notifications", "announcement"],
];
const loginUrl = "/admin/admin.html?next=terminal";
const sampleDesk = {
  ...emptyDesk,
  journalEntries: demoJournalEntries,
  posts: demoPosts,
  adminPosts: demoPosts,
  sessions: demoSessions,
  notifications: demoNotifications,
  questions: [
    ...demoQuestions,
    {
      id: "preview-awaiting-question",
      user_id: "Preview member",
      title: "How do I connect the daily and weekly context?",
      body: "I have finished the foundations and would like help applying the top-down process.",
      status: "open",
      created_at: "2026-10-05T12:00:00Z",
      preview: true,
    },
  ],
  mentorship: [
    {
      id: "preview-mentorship",
      user_id: "Preview member",
      experience: "Learning the foundations",
      goals:
        "Build a consistent journal and review process with THE Chain Methodology.",
      availability: "New York mornings",
      status: "pending",
      created_at: "2026-10-05T12:00:00Z",
      preview: true,
    },
  ],
};

function Overview({ data, go, loading }) {
  const waiting = data.questions.filter((q) => q.status !== "answered").length;
  const requests = data.mentorship.filter((r) =>
    ["pending", "reviewing"].includes(r.status),
  ).length;
  const stats = [
    [
      data.adminPosts.filter((p) => p.status === "published").length,
      "Published posts",
      "publications",
    ],
    [
      data.sessions.filter((s) => s.status !== "ended").length,
      "Live & scheduled",
      "live",
    ],
    [waiting, "Questions to review", "questions"],
    [requests, "Mentorship requests", "mentorship"],
  ];
  return (
    <>
      <div className="terminal-stats">
        {stats.map(([value, label, route]) => (
          <button className="panel" key={route} onClick={() => go(route)}>
            <strong>{loading ? "—" : value}</strong>
            <span>
              {label}
              <Icon name="chevron" size={14} />
            </span>
          </button>
        ))}
      </div>
      <section className="terminal-intro panel">
        <div>
          <span className="eyebrow">BUILT ON THE CHAIN METHODOLOGY</span>
          <h2>From the LMR desk to the Inner Circle.</h2>
          <p>
            Plan the live room, share your observations, and guide the
            conversation. Every publication starts here.
          </p>
          <Button gold icon="plus" onClick={() => go("observations")}>
            Create a publication
          </Button>
        </div>
        <div
          className="terminal-chain"
          aria-label="Context, observation, execution, review"
        >
          {["Context", "Observation", "Execution", "Review"].map((label, i) => (
            <div key={label}>
              <span>0{i + 1}</span>
              <strong>{label}</strong>
              {i < 3 && <Icon name="arrow" size={18} />}
            </div>
          ))}
        </div>
      </section>
      <div className="terminal-columns">
        <section className="panel">
          <div className="terminal-section-head">
            <h2>Live desk</h2>
            <button onClick={() => go("live")}>
              Manage sessions <Icon name="arrow" size={15} />
            </button>
          </div>
          {data.sessions.length ? (
            data.sessions
              .filter((s) => s.status !== "ended")
              .map((s) => (
                <div className="terminal-row" key={s.id}>
                  <span className="terminal-row-icon">
                    <Icon name="live" />
                  </span>
                  <div>
                    <strong>{s.title}</strong>
                    <small>
                      {formatDate(s.starts_at, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · New York
                    </small>
                  </div>
                  <span className="tag">{s.status}</span>
                </div>
              ))
          ) : (
            <Empty
              icon="live"
              title="Your live desk is ready."
              body="Schedule the first analysis session and add the member viewing link."
            />
          )}
        </section>
        <section className="panel">
          <div className="terminal-section-head">
            <h2>Needs your attention</h2>
          </div>
          <button className="terminal-queue" onClick={() => go("questions")}>
            <Icon name="questions" />
            <span>
              <strong>Member questions</strong>
              <small>
                {waiting
                  ? `${waiting} awaiting your reply`
                  : "You're up to date"}
              </small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
          <button className="terminal-queue" onClick={() => go("mentorship")}>
            <Icon name="mentorship" />
            <span>
              <strong>Private mentorship</strong>
              <small>
                {requests
                  ? `${requests} requests to review`
                  : "No requests waiting"}
              </small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
          <div className="terminal-audience">
            <Icon name="shield" size={18} />
            <p>
              Questions and mentorship replies stay private to the member and
              verified LMR administrators.
            </p>
          </div>
        </section>
      </div>
      <section className="panel terminal-recent">
        <div className="terminal-section-head">
          <h2>Recent publications</h2>
          <button onClick={() => go("publications")}>
            View all <Icon name="arrow" size={15} />
          </button>
        </div>
        {data.adminPosts.length ? (
          data.adminPosts.slice(0, 5).map((p) => (
            <div className="terminal-row" key={p.id}>
              <span className="terminal-row-icon">
                <Icon
                  name={p.kind === "terminology" ? "resources" : "observations"}
                />
              </span>
              <div>
                <strong>{p.title}</strong>
                <small>
                  {kindLabels[p.kind]} ·{" "}
                  {p.kind === "terminology" ? "Every account" : "Paid members"}
                </small>
              </div>
              <span className="tag">{p.status}</span>
            </div>
          ))
        ) : (
          <Empty
            title="Start your first publication."
            body="Observations, image galleries and free resources will appear here."
          />
        )}
      </section>
    </>
  );
}

function Terminal() {
  const [stage, setStage] = useState(preview ? "ready" : "boot");
  const [user, setUser] = useState(
    preview ? { id: "preview-admin", email: "admin@lmrcapitals.com" } : null,
  );
  const [data, setData] = useState(preview ? sampleDesk : emptyDesk);
  useEffect(() => {
    const channel = previewDeskChannel();
    if (!channel) return;
    channel.onmessage = ({ data: message }) => {
      if (message?.type === "member-ready")
        channel.postMessage(previewDeskMessage(data));
    };
    channel.postMessage(previewDeskMessage(data));
    return () => channel.close();
  }, [data]);
  const [ready, setReady] = useState(preview);
  const [route, setRoute] = useState(location.hash.slice(1) || "overview");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const generation = useRef(0),
    operation = useRef(false),
    timer = useRef(null),
    menuButton = useRef(null),
    sidebar = useRef(null);
  const section = sections.find((s) => s[0] === route) || sections[0];
  const go = (id) => {
    location.hash = id;
    setMenu(false);
  };
  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  const refresh = useCallback(async () => {
    if (preview) return;
    const request = ++generation.current;
    setLoading(true);
    setError("");
    setReady(false);
    try {
      const access = await verifyTerminalAccess(sb);
      if (request !== generation.current) return;
      setUser(access.user);
      setStage(access.stage);
      if (access.stage !== "ready") {
        setData(emptyDesk);
        return;
      }
      const next = await fetchTerminalWorkspace();
      if (request !== generation.current) return;
      setData(next);
      setReady(true);
    } catch (failure) {
      if (request === generation.current) {
        setData(emptyDesk);
        setError(failure.message || "The admin desk could not connect.");
      }
      throw failure;
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh().catch(() => {});
    if (preview) return;
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      // Defer API calls outside the Auth callback's lock.
      setTimeout(() => refresh().catch(() => {}), 0);
    });
    const sync = () => {
      if (document.visibilityState === "visible" && !operation.current)
        refresh().catch(() => {});
    };
    window.addEventListener("focus", sync);
    const interval = setInterval(sync, 60000);
    return () => {
      ++generation.current;
      subscription.unsubscribe();
      window.removeEventListener("focus", sync);
      clearInterval(interval);
      clearTimeout(timer.current);
    };
  }, [refresh]);
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "overview");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (!menu) return;
    sidebar.current?.querySelector("button")?.focus();
    const dismiss = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("keydown", dismiss);
      menuButton.current?.focus();
    };
  }, [menu]);
  const run = async (fn) => {
    if (operation.current || !ready) return false;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      return true;
    } catch (failure) {
      setError(failure.message);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const actions = useAdminActions({
    user,
    data,
    setData,
    run,
    refresh,
    notify,
  });
  const signOut = async () => {
    if (preview) {
      location.assign(loginUrl);
      return;
    }
    setBusy(true);
    const result = await sb.auth.signOut();
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setUser(null);
    setData(emptyDesk);
    setReady(false);
    setStage("signin");
  };
  if (stage !== "ready")
    return (
      <div className="terminal-gate">
        <Logo />
        <section className="panel form-panel">
          <Empty
            icon="shield"
            title={
              stage === "boot"
                ? error
                  ? "Admin connection unavailable"
                  : "Checking your admin access…"
                : stage === "denied"
                  ? "Administrator access required"
                  : stage === "verify"
                    ? "Complete your admin verification"
                    : "Sign in to the Admin Terminal"
            }
            body={
              stage === "denied"
                ? "This account is not in the LMR admin registry. Sign in through the existing Admin Hub with your administrator account."
                : "Use your existing Admin Hub email, password and two-factor verification. The terminal shares the same secure session."
            }
          >
            <a className="button gold" href={loginUrl}>
              Open Admin Hub sign-in
            </a>
            {error && <p role="alert">{error}</p>}
            {stage === "boot" && error && (
              <Button onClick={() => refresh().catch(() => {})}>
                Retry connection
              </Button>
            )}
            {user && (
              <Button onClick={signOut} disabled={busy}>
                Sign out
              </Button>
            )}
          </Empty>
        </section>
      </div>
    );
  return (
    <div className={`member-app admin-terminal ${preview ? "is-preview" : ""}`}>
      <a href="#terminal-content" className="skip">
        Skip to content
      </a>
      {preview && (
        <div className="preview-ribbon">
          <strong>ADMIN TERMINAL PREVIEW</strong>
          <span>Sample data · No production writes</span>
          <a href={loginUrl}>Open real Admin Hub</a>
        </div>
      )}
      {menu && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        className={`app-sidebar ${menu ? "open" : ""}`}
        ref={sidebar}
        id="terminal-navigation"
      >
        <Logo />
        <div className="workspace-label">
          <span /> ADMIN TERMINAL
        </div>
        <nav aria-label="Admin terminal navigation">
          {sections.map(([id, label, icon]) => (
            <button
              key={id}
              className={`nav-item ${section[0] === id ? "active" : ""}`}
              aria-current={section[0] === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon name={icon} />
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-separator" />
        <nav aria-label="Admin applications">
          <a className="nav-item" href={preview ? "/member/index.html?preview=1" : "/inner-circle"}><Icon name="dashboard" />Inner Circle</a>
          <a
            className="nav-item"
            href="/app"
            onClick={(event) => {
              event.preventDefault();
              if (preview) notify("Journal access is simulated in preview.");
              else openJournal({ admin: true, adminVerified: true });
            }}
          >
            <Icon name="application" />
            Journal Application
            <Icon name="external" size={13} />
          </a>
        </nav>
        <div className="sidebar-foot">
          <div className="terminal-identity">
            <span className="avatar">LMR</span>
            <div>
              <strong>LMR Administrator</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="nav-item" onClick={signOut} disabled={busy}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            ref={menuButton}
            aria-label="Open navigation"
            aria-expanded={menu}
            aria-controls="terminal-navigation"
            onClick={() => setMenu(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Admin Terminal</span>
            <Icon name="chevron" size={12} />
            <strong>{section[1]}</strong>
          </div>
          <div className="top-actions">
            <span className="terminal-connection">
              <i className={ready ? "connected" : ""} />
              {preview
                ? "Preview mode"
                : ready
                  ? "Desk connected"
                  : loading
                    ? "Connecting…"
                    : "Setup required"}
            </span>
            <Button
              small
              icon="refresh"
              disabled={loading || busy}
              onClick={() =>
                preview
                  ? notify("Preview uses sample desk data.")
                  : refresh().catch(() => {})
              }
            >
              Refresh
            </Button>
          </div>
        </header>
        <main className="page" id="terminal-content">
          <div className="page-head">
            <div>
              <h1>
                {section[0] === "overview" ? "Admin Terminal" : section[1]}
              </h1>
              <p>
                {section[0] === "overview"
                  ? "Your publishing desk, live room and member conversations."
                  : "Manage the LMR desk. Built on THE Chain Methodology."}
              </p>
            </div>
            {section[0] === "overview" && (
              <span className="tag">
                <Icon name="shield" size={13} />
                {preview ? "Admin preview" : "MFA verified"}
              </span>
            )}
          </div>
          {error && (
            <div className="banner error" role="alert">
              <Icon name="shield" size={18} />
              <span>
                {error}
                {!ready &&
                  " Publishing is unavailable until the admin workspace is connected."}
              </span>
            </div>
          )}
          {!ready && !loading && (
            <section className="panel form-panel terminal-setup">
              <h2>Connect the admin publishing workspace</h2>
              <p>
                Your Admin Hub session is verified. The terminal needs the
                publishing tables and functions before it can save live content.
              </p>
              <p>
                Apply the reviewed{" "}
                <code>database/patches/inner-circle.sql</code> patch to the
                configured backend, then refresh this terminal. Member chapter
                setup and subscriptions are separate from this admin connection.
              </p>
              <Button onClick={() => refresh().catch(() => {})} icon="refresh">
                Check connection again
              </Button>
            </section>
          )}
          {section[0] === "overview" ? (
            <Overview data={data} go={go} loading={loading || !ready} />
          ) : section[0] === "hub" ? (
            <AdminHub verified user={user} onNavigate={(id) => go(id === "admin" ? "publications" : id)} />
          ) : (
            <fieldset className="terminal-editor" disabled={busy || !ready}>
              <Admin
                key={section[0]}
                data={data}
                verified
                hideTabs
                activeTab={section[3]}
                initialKind={section[4]}
                busy={busy || !ready}
                onPublish={actions.onPublish}
                onJournalPublish={actions.onJournalPublish}
                onSession={actions.onSession}
                onPostStatus={actions.onPostStatus}
                onSessionStatus={actions.onSessionStatus}
                onSessionBlock={actions.onSessionBlock}
                onAnnouncement={actions.onAnnouncement}
                onAnswer={actions.answer}
                onMentorshipReply={actions.replyMentorship}
              />
            </fieldset>
          )}
          <footer className="workspace-footer">
            <span>
              © {new Date().getFullYear()} LMR Capitals. Built on THE Chain
              Methodology.
            </span>
            <a href="/inner-circle#admin-hub">
              Back to Inner Circle <Icon name="arrow" size={12} />
            </a>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
const root = document.getElementById("root");
root.removeAttribute("style");
createRoot(root).render(<Terminal />);
