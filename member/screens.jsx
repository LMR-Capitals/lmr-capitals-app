import {AchievementDetails} from "./journal-record";
import {journalTitle} from "./journal-media.mjs";
import ProfilePhotoEditor from "./profile-photo.jsx";
import React, { useState } from "react";
import SessionSwitcher from "./session-switcher";
import {
  sessionsForBlock,
  sessionBlockLabel,
  selectRoomSession,
  validSessionBlock,
} from "./live-sessions.mjs";
import Icon from "./icons";
import {
  Button,
  Empty,
  Logo,
  MarketLines,
  Post,
  RiskNote,
  formatDate,
  kindLabels,
} from "./ui";
import {
  preview,
  safeEmbed,
  safeHttps,
  config,
  enrollmentReady,
} from "./config";
import { LearningProgress } from "./learning";
import SocialLinks from "./socials";
import GettingStarted from "./getting-started";
import { guideUrl, provider } from "./guidelines.mjs";
export function Dashboard({
  userId,
  data,
  go,
  onLegal,
  onSave,
  onImage,
  onQuestion,
  premium,
}) {
  const [kind, setKind] = useState("all");
  const session =
    data.sessions.find((s) => s.status === "live") ||
    data.sessions.find((s) => s.status === "scheduled");
  if (!premium)
    return (
      <>
        <GettingStarted key={userId} userId={userId} data={data} go={go} premium={premium} />
        <LearningProgress progress={data.learning} go={go} />
        <div className="free-dashboard-grid">
          <section className="panel free-welcome">
            <span className="tag">YOUR FREE INNER CIRCLE</span>
            <h2>Start with the foundations. Build your Chain.</h2>
            <p>
              Your account includes the chapter learning path, free LMR
              resources, a personal learning profile and community
              announcements.
            </p>
            <Button icon="terminology" onClick={() => go("resources")}>
              Explore free resources <Icon name="arrow" size={15} />
            </Button>
            <SocialLinks />
          </section>
          <section className="panel membership-invite">
            <span className="tag">CONTINUE WITH MEMBERSHIP</span>
            <h2>Bring your learning to the live desk.</h2>
            <p>
              Paid membership unlocks live analysis, LMR observations, member
              execution and achievement galleries, the Journal Application,
              and private mentorship requests.
            </p>
            <Button gold icon="lock" onClick={() => go("billing")}>
              Explore membership <Icon name="arrow" size={15} />
            </Button>
          </section>
        </div>
      </>
    );
  return (
    <>
      <GettingStarted key={userId} userId={userId} data={data} go={go} premium={premium} />
      <LearningProgress progress={data.learning} go={go} />
      <div className="two-column">
        <section>
          <section className="live-feature">
            <MarketLines />
            <div className="live-feature-content">
              <span className={`status ${session?.status || "scheduled"}`}>
                {session?.status === "live"
                  ? "Live now"
                  : session
                    ? "Next at the desk"
                    : "The live desk"}
                {preview ? " · Preview" : ""}
              </span>
              <h2>{session?.title || "Your next session starts here."}</h2>
              <p>
                {session?.description ||
                  "Watch LMR build the market narrative, and bring your questions to the session."}
              </p>
              <Button
                gold
                icon={session?.status === "live" ? "play" : "calendar"}
                onClick={() => go("live")}
              >
                {session?.status === "live"
                  ? "Join the live room"
                  : "Open the live room"}
                <Icon name="arrow" size={15} />
              </Button>
            </div>
          </section>
          <div className="quick-links">
            <button className="quick-link" onClick={() => go("terminology")}>
              <Icon name="terminology" />
              <div>
                <strong>LMR terminology</strong>
                <small>The original reference library</small>
              </div>
            </button>
            <button className="quick-link" onClick={() => go("executions")}>
              <Icon name="executions" />
              <div>
                <strong>Execution journal</strong>
                <small>See the plan in practice</small>
              </div>
            </button>
            <button className="quick-link" onClick={() => go("mentorship")}>
              <Icon name="mentorship" />
              <div>
                <strong>Private mentorship</strong>
                <small>Your next step, together</small>
              </div>
            </button>
          </div>
          <div className="section-head">
            <h2>From the LMR desk</h2>
            <span>Latest publications</span>
          </div>
          <div className="tabs" aria-label="Filter desk posts">
            {[
              ["all", "All updates"],
              ["observation", "Observations"],
              ["analysis", "Analysis"],
              ["callout", "Callouts"],
              ["saved", "Saved"],
            ].map(([id, name]) => (
              <button
                key={id}
                className={kind === id ? "selected" : ""}
                aria-pressed={kind === id}
                onClick={() => setKind(id)}
              >
                {name}
              </button>
            ))}
          </div>
          {data.posts
            .filter(
              (p) =>
                kind === "all" ||
                p.kind === kind ||
                (kind === "saved" && data.saved.includes(p.id)),
            )
            .map((p) => (
              <Post
                key={p.id}
                post={p}
                saved={data.saved.includes(p.id)}
                onSave={onSave}
                onImage={onImage}
                onQuestion={onQuestion}
              />
            ))}
          {!data.posts.some(
            (p) =>
              kind === "all" ||
              p.kind === kind ||
              (kind === "saved" && data.saved.includes(p.id)),
          ) && (
            <Empty
              title={
                kind === "saved"
                  ? "Your saved reading lives here."
                  : "The desk is getting ready."
              }
              body={
                kind === "saved"
                  ? "Save a post to return to its context later."
                  : "New member publications will appear as soon as LMR publishes them."
              }
            />
          )}
        </section>
        <aside className="dashboard-rail">
          <section className="rail-card">
            <span className="tag">THE CHAIN METHODOLOGY</span>
            <h2>
              Understand the why
              <br />
              behind the trade.
            </h2>
            <p>
              Build your understanding of the market, one observation, one
              session, and one review at a time.
            </p>
            <button className="text-button" onClick={() => go("terminology")}>
              Explore the knowledge library <Icon name="arrow" size={14} />
            </button>
            <Logo />
          </section>
          <section className="rail-section">
            <h3>
              Coming up{" "}
              <span
                style={{ float: "right", color: "var(--muted)", fontSize: 9 }}
              >
                NEW YORK · ET
              </span>
            </h3>
            {data.sessions
              .filter((s) => s.status === "scheduled")
              .slice(0, 3)
              .map((s) => (
                <div className="schedule-row" key={s.id}>
                  <div className="date-tile">
                    {formatDate(s.starts_at, { weekday: "short" })}
                    <strong>
                      {formatDate(s.starts_at, { day: "2-digit" })}
                    </strong>
                  </div>
                  <div>
                    <h4>{s.title}</h4>
                    <p>
                      {formatDate(s.starts_at, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {preview ? "Sample schedule" : "Member session"}
                    </p>
                    <button className="text-button" onClick={() => go("live")}>
                      Session details <Icon name="arrow" size={11} />
                    </button>
                  </div>
                </div>
              ))}
            {!data.sessions.some((s) => s.status === "scheduled") && (
              <p className="content-note">
                No sessions announced. Check your notifications for the next
                update.
              </p>
            )}
          </section>
          <section className="rail-section">
            <h3>Your circle</h3>
            <div className="rail-links">
              <button onClick={() => go("questions")}>
                <Icon name="questions" />
                <div>
                  Ask the LMR desk
                  <small>Turn a question into understanding</small>
                </div>
              </button>
              <button onClick={() => go("achievements")}>
                <Icon name="achievements" />
                <div>
                  LMR achievements
                  <small>The milestones behind the journey</small>
                </div>
              </button>
            </div>
          </section>
          <RiskNote onLegal={onLegal} />
        </aside>
      </div>
    </>
  );
}
export { LearningLibrary as Library } from "./learning";
export function FreeResources({ data, go, onSave, onImage, onQuestion }) {
  const posts = data.posts.filter((p) => p.kind === "terminology");
  return (
    <>
      <section className="panel free-resource-intro">
        <span className="tag">FREE WITH YOUR ACCOUNT</span>
        <h2>The foundations are yours to explore.</h2>
        <p>
          Work through all ten chapters of the original LMR terminology, save
          free desk resources and connect with the LMR community.
        </p>
        <Button gold icon="terminology" onClick={() => go("terminology")}>
          Continue your chapter path <Icon name="arrow" size={15} />
        </Button>
        <SocialLinks />
      </section>
      <div className="section-head">
        <h2>Free desk resources</h2>
        <span>{posts.length} publications</span>
      </div>
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          saved={data.saved.includes(post.id)}
          onSave={onSave}
          onImage={onImage}
          onQuestion={onQuestion}
        />
      ))}
      {!posts.length && (
        <Empty
          icon="resources"
          title="More resources are on the way."
          body="Your chapter library is already available. Free desk publications appear here when LMR shares them."
        />
      )}
    </>
  );
}
export function Feed({ data, kind, search, onSave, onImage, onQuestion }) {
  const posts = data.posts.filter(
    (p) =>
      p.kind === kind &&
      `${p.title} ${p.body} ${p.source_content || ""} ${JSON.stringify(p.source_details || {})}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div style={{ maxWidth: 850 }}>
      {posts.map((p) => (
        <Post
          key={p.id}
          post={p}
          saved={data.saved.includes(p.id)}
          onSave={onSave}
          onImage={onImage}
          onQuestion={onQuestion}
        />
      ))}
      {!posts.length && (
        <Empty
          title="No publications here yet."
          body={kind === "callout" ? "Paid-member callouts appear here with their conditions and context." : "Journal observations appear here when LMR publishes them."}
        />
      )}
    </div>
  );
}
export function Gallery({ data, kind, onImage, search }) {
  const items = data.posts.filter(
    (p) =>
      p.kind === kind &&
      `${p.title} ${p.body} ${p.source_content || ""} ${JSON.stringify(p.source_details || {})}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="banner">
        <Icon name="shield" size={17} />
        <span>
          {kind === "execution"
            ? "Executions document past decisions. They are not instructions to enter a trade."
            : "Achievements document individual milestones. They are not a forecast or promise of your results."}{" "}
          Past performance is not indicative of future results.
        </span>
      </div>
      {items.length ? (
        <div className="gallery-grid">
          {items.map((p) => (
            <button
              className={`gallery-item panel ${kind === "achievement" ? "achievement-item" : ""}`}
              key={p.id}
              onClick={() => onImage(p)}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.image_caption || p.title}
                  loading="lazy"
                />
              ) : (
                <div className="empty-state">
                  <Icon name="image" size={30} />
                  <p>No image attached to this publication.</p>
                </div>
              )}
              <div className="gallery-item-body">
                {kind === "achievement" ? <AchievementDetails record={p} /> : <>
                  <span className="tag">ENTRY · exit / outcome</span>
                  <h3>{journalTitle(p)}</h3>
                  <p>{p.body}</p>
                </>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          icon={kind === "execution" ? "executions" : "achievements"}
          title={
            kind === "execution"
              ? "The execution gallery is ready."
              : "Every milestone has a story."
          }
          body={
            preview
              ? "Actual trading records will appear when an admin publishes them. The preview does not invent executions, certificates or performance."
              : "LMR has not published images in this section yet. New publications will appear here and in your notifications."
          }
        />
      )}
    </>
  );
}
export function Live({ data, onQuestion }) {
  const [selected, setSelected] = useState(null);
  const [block, setBlock] = useState(
    () =>
      data.sessions.find(
        (s) => s.status === "live" && validSessionBlock(s.session_block),
      )?.session_block || "asia",
  );
  const roomSessions = sessionsForBlock(data.sessions, block);
  const session = selectRoomSession(roomSessions, selected);
  const roomLabel = sessionBlockLabel(block);
  const url =
    !preview && session?.status === "live"
      ? safeEmbed(session.stream_url)
      : null;
  const external =
    !preview && session?.status === "live" && session?.provider === "external"
      ? safeHttps(session.stream_url)
      : null;
  return (
    <>
      <SessionSwitcher
        sessions={data.sessions}
        value={block}
        onChange={(id) => {
          setBlock(id);
          setSelected(null);
        }}
      />
      {data.sessions.some((s) => !validSessionBlock(s.session_block)) && (
        <button
          className="legacy-room-link"
          aria-pressed={block === "unassigned"}
          onClick={() => {
            setBlock("unassigned");
            setSelected(null);
          }}
        >
          Other sessions · awaiting admin categorization
        </button>
      )}
      <div className="split-content">
        <section>
          <div className="live-player">
            {url ? (
              <iframe
                src={url}
                title={session.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <>
                <Logo compact />
                <h2>
                  {session?.status === "live"
                    ? "The LMR session is live."
                    : session?.status === "ended"
                      ? "This session has ended."
                      : `${roomLabel} analysis starts with context.`}
                </h2>
                <p>
                  {session
                    ? `${session.title} · ${formatDate(session.starts_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET`
                    : `Your next ${roomLabel} live analysis session will be announced here.`}
                </p>
                {external ? (
                  <a
                    className="button gold"
                    href={external}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open live session <Icon name="external" size={16} />
                  </a>
                ) : (
                  <span className="tag">
                    {preview
                      ? "STREAM PREVIEW · NO BROADCAST CONNECTED"
                      : session?.status === "live"
                        ? "Stream link unavailable — refresh or contact LMR"
                        : "WAITING FOR THE NEXT SESSION"}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="session-meta">
            <span>
              <Icon name="live" size={15} />
              Live chart analysis
            </span>
            <span>
              <Icon name="questions" size={15} />
              Member questions
            </span>
            <span>
              <Icon name="clock" size={15} />
              New York time
            </span>
          </div>
          <section className="panel form-panel">
            <h2>{session?.title || `${roomLabel} live room`}</h2>
            <p>
              {session?.description ||
                "Observe how LMR builds context, explains the chart, and reviews execution."}
            </p>
            <p className="content-note">
              Live commentary is educational, may be delayed, and is not
              personalized investment advice. Streaming access is governed by
              your membership.
            </p>
          </section>
          <div className="section-head">
            <h2>{roomLabel} session schedule</h2>
            <span>Times shown in ET</span>
          </div>
          {roomSessions.map((s) => (
            <div key={s.id} className="schedule-row">
              <div className="date-tile">
                {formatDate(s.starts_at, { weekday: "short" })}
                <strong>{formatDate(s.starts_at, { day: "2-digit" })}</strong>
              </div>
              <div>
                <h4>{s.title}</h4>
                <p>
                  {formatDate(s.starts_at, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ET
                </p>
              </div>
              <Button small onClick={() => setSelected(s.id)}>
                {s.id === session?.id ? "Selected" : "View session"}
              </Button>
            </div>
          ))}
          {!roomSessions.length && (
            <Empty
              icon="calendar"
              title={`No ${roomLabel} session scheduled yet.`}
              body="LMR will post the time and viewing details here when this room is scheduled."
            />
          )}
        </section>
        <aside>
          <section className="discussion panel">
            <h3>Questions for the desk</h3>
            <p className="content-note">
              Have a question about the narrative? Send it to LMR for this
              session.
            </p>
            <Button
              gold
              icon="questions"
              disabled={!session}
              onClick={() => onQuestion(null, session?.id)}
            >
              Ask a session question
            </Button>
            <p className="content-note">
              Questions are reviewed by LMR. A response is not guaranteed during
              the live session.
            </p>
          </section>
          <section className="rail-section">
            <h3>Before you join</h3>
            <ol className="progress-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Read the context</strong>Review the latest LMR
                  observations.
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Prepare your questions</strong>Focus on the reasoning,
                  not a prediction.
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Take it into your review</strong>Document what you
                  learned after the session.
                </div>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
export function Mentorship({ data, onRequest, paid, go, busy }) {
  return (
    <div className="split-content">
      <section className="panel form-panel">
        <h2>A conversation about your process.</h2>
        <p>
          Private mentorship starts with understanding where you are, what you
          are working on, and what you want to improve.
        </p>
        {!paid && (
          <div className="banner">
            <Icon name="lock" size={17} />
            <span>
              A paid, active subscription is required to request private
              mentorship. Trial or complimentary access does not automatically
              qualify.
            </span>
          </div>
        )}
        <form className="form-stack" onSubmit={onRequest}>
          <label>
            Your trading experience
            <select name="experience" required defaultValue="">
              <option value="" disabled>
                Select your experience
              </option>
              <option>Getting started</option>
              <option>Learning and practicing</option>
              <option>Trading regularly</option>
            </select>
          </label>
          <label>
            What would you like to work on?
            <textarea
              name="goals"
              required
              minLength="20"
              maxLength="2500"
              placeholder="Tell LMR about your process, challenges, and learning goals."
            />
          </label>
          <label>
            Your availability and time zone
            <input
              name="availability"
              required
              maxLength="300"
              placeholder="e.g. Weekdays after 5 PM, America/New_York"
            />
          </label>
          <label className="check-label">
            <input type="checkbox" required />
            <span>
              I understand this is a request for educational mentorship. A
              session is only booked when LMR confirms availability.
            </span>
          </label>
          <div className="form-actions">
            <Button gold icon="send" disabled={!paid || busy} type="submit">
              {busy ? "Sending…" : "Submit mentorship request"}
            </Button>
            {!paid && (
              <Button type="button" onClick={() => go("billing")}>
                View membership
              </Button>
            )}
          </div>
        </form>
      </section>
      <aside>
        <section className="rail-card">
          <span className="tag">PRIVATE MENTORSHIP</span>
          <h2>
            Built around
            <br />
            your learning.
          </h2>
          <p>
            Share your goals. LMR reviews your request and responds with the
            next steps in your account.
          </p>
          <ol className="progress-list">
            <li>
              <span>01</span>
              <div>
                <strong>Submit your request</strong>Tell us where you need
                clarity.
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>LMR reviews it</strong>Your request stays private.
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Confirm the next step</strong>Check your account for a
                reply.
              </div>
            </li>
          </ol>
        </section>
      </aside>
      <section style={{ gridColumn: "1 / -1" }}>
        <div className="section-head">
          <h2>Your requests</h2>
        </div>
        {data.mentorship.length ? (
          data.mentorship.map((r) => (
            <article className="panel form-panel" key={r.id}>
              <span className="tag">{r.status}</span>
              <p>{r.goals}</p>
              <small className="content-note">
                Submitted {formatDate(r.created_at)} · {r.availability}
              </small>
              {r.admin_reply && (
                <div className="answer">
                  <strong>LMR REPLY</strong>
                  <p>{r.admin_reply}</p>
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="content-note">
            You have not submitted a mentorship request.
          </p>
        )}
      </section>
    </div>
  );
}
export function Questions({ data, onQuestion }) {
  return (
    <>
      <div className="banner">
        <Icon name="questions" size={18} />
        <span>
          Ask about the analysis, terminology or your learning process. Your
          questions and LMR's replies are visible to you and the admin team. Free and paid members can ask; LMR reviews the queue one question at a time.
        </span>
      </div>
      <Button gold icon="plus" onClick={() => onQuestion()}>
        Ask the LMR desk
      </Button>
      <div className="panel spaced">
        {data.questions.length ? (
          data.questions.map((q) => (
            <article className="question-row" key={q.id}>
              <h3>{q.title}</h3>
              <p>{q.body}</p>
              <div className="question-meta">
                <span className="tag">{q.status === "open" ? "In the LMR queue" : q.status}</span>
                <span>{formatDate(q.created_at)}</span>
              </div>
              {q.answer && (
                <div className="answer">
                  <strong>LMR CAPITALS</strong>
                  <p>{q.answer}</p>
                </div>
              )}
            </article>
          ))
        ) : (
          <Empty
            icon="questions"
            title="What would you like to understand?"
            body="Your questions and answers will appear here."
          />
        )}
      </div>
    </>
  );
}
export function Notifications({ data, onRead, go }) {
  const visible = data.notifications.filter(
    (n) =>
      !(n.category === "live" && !data.preferences.live_alerts) &&
      !(n.category === "post" && !data.preferences.post_alerts) &&
      !(n.category === "mentorship" && !data.preferences.mentorship_alerts),
  );
  return (
    <>
      <div className="section-head" style={{ marginTop: 0 }}>
        <span>Updates shared by the LMR admin team</span>
        <button className="text-button" onClick={() => go("settings")}>
          Notification preferences <Icon name="settings" size={14} />
        </button>
      </div>
      <div className="panel">
        {visible.length ? (
          visible.map((n) => (
            <article
              className={`notification-row ${data.reads.includes(n.id) ? "" : "unread"}`}
              key={n.id}
            >
              <Icon
                name={n.category === "live" ? "live" : "notifications"}
                size={20}
              />
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <small>
                  {formatDate(n.created_at, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ET
                </small>
              </div>
              {!data.reads.includes(n.id) && (
                <button className="text-button" onClick={() => onRead(n.id)}>
                  Mark as read
                </button>
              )}
            </article>
          ))
        ) : (
          <Empty
            icon="notifications"
            title="You're all caught up."
            body="LMR announcements, publishing updates and session notices will appear here."
          />
        )}
      </div>
    </>
  );
}
export function Settings({ data, onPreference, busy }) {
  return (
    <section className="panel form-panel" style={{ maxWidth: 800 }}>
      <h2>Choose what reaches your inbox.</h2>
      <p>
        These preferences control your in-app notification feed. Essential
        account and billing messages remain available.
      </p>
      {[
        [
          "live_alerts",
          "Live analysis sessions",
          "Announcements for upcoming live rooms and broadcasts.",
        ],
        [
          "post_alerts",
          "New LMR publications",
          "Observations, execution images, and achievements.",
        ],
        [
          "mentorship_alerts",
          "Private mentorship",
          "Updates about your mentorship requests.",
        ],
      ].map(([key, title, description]) => (
        <div className="settings-row" key={key}>
          <div>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
          <button
            className={`switch ${data.preferences[key] ? "on" : ""}`}
            role="switch"
            aria-checked={!!data.preferences[key]}
            aria-label={title}
            disabled={busy}
            onClick={() => onPreference(key, !data.preferences[key])}
          >
            <span />
          </button>
        </div>
      ))}
      <p className="content-note">
        Email and browser push delivery are not enabled by this preference
        screen.
      </p>
    </section>
  );
}
export function Profile({ data, user, onProfile, busy, onSignOut, administrator = false }) {
  return (
    <div className="split-content">
      <section className="panel form-panel">
        <h2>{administrator ? "Your administrator profile" : "Your member profile"}</h2>
        <p>
          {administrator ? "Your name and time zone for the LMR administration workspace." : "The name and time zone LMR sees with your questions and mentorship requests."}
        </p>
        <form
          key={data.profile.display_name}
          className="form-stack"
          onSubmit={onProfile}
        >
          <ProfilePhotoEditor profile={data.profile} user={user} busy={busy} />
          <label>
            Display name
            <input
              name="display_name"
              defaultValue={data.profile.display_name || ""}
              required
              maxLength="80"
              autoComplete="name"
            />
          </label>
          <label>
            Email address
            <input value={user.email || ""} disabled readOnly />
          </label>
          <label>
            Time zone
            <select
              name="timezone"
              defaultValue={data.profile.timezone || "America/New_York"}
            >
              {[
                "America/New_York",
                "America/Chicago",
                "America/Los_Angeles",
                "Europe/London",
                "Europe/Berlin",
                "Asia/Kathmandu",
                "Asia/Kolkata",
                "Asia/Singapore",
                "Australia/Sydney",
                "UTC",
              ].map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
          <label>
            {administrator ? "About you" : "About your learning journey"}
            <textarea
              name="bio"
              defaultValue={data.profile.bio || ""}
              maxLength="1000"
            />
          </label>
          <Button gold disabled={busy} type="submit">
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>
      <aside>
        <section className="panel form-panel">
          <Icon name="shield" size={25} />
          <h2 className="spaced">Your account stays yours.</h2>
          <p>
            {administrator ? "Your administrator access is verified through the LMR registry and two-factor authentication." : "Your questions, profile and mentorship requests are private to you and LMR administrators."}
          </p>
          <Button onClick={onSignOut} icon="logout">
            Sign out
          </Button>
        </section>
      </aside>
    </div>
  );
}
export function Billing({
  subscription,
  entitled,
  onBilling,
  busy,
  onRefresh,
  onLegal,
}) {
  const [accepted, setAccepted] = useState(false);
  const existingSubscription =
    subscription &&
    [
      "active",
      "trialing",
      "past_due",
      "unpaid",
      "incomplete",
      "paused",
    ].includes(subscription.status);
  return (
    <>
      <a className="text-button membership-guide-link" href={guideUrl}>Read the membership & joining guide <Icon name="arrow" size={15} /></a>
      <section className="panel free-plan-summary">
        <div>
          <span className="tag">
            {entitled
              ? "YOUR INNER CIRCLE MEMBERSHIP"
              : "FREE INNER CIRCLE ACCOUNT"}
          </span>
          <h2>
            {entitled
              ? "Your member workspace is open."
              : "Your foundation stays free."}
          </h2>
          <p>
            {entitled
              ? "Your learning path, live analysis rooms, LMR publications and Journal Application are available. Manage your subscription through Stripe billing."
              : "All ten terminology chapters, progress tracking, free resources, Q&A, your profile and community announcements. No subscription needed."}
          </p>
        </div>
        <strong>
          {entitled ? "Active" : "Free"}
          <span>
            {entitled ? "full workspace access" : "with your LMR account"}
          </span>
        </strong>
      </section>
      {existingSubscription && !entitled && (
        <div className="banner">
          Your subscription is on file. Premium access will open when a current
          paid invoice is verified. Use Stripe billing to resolve payment or
          subscription changes.
        </div>
      )}
      {subscription && (
        <div className="panel billing-summary">
          <div>
            <span>Membership status</span>
            <strong>{subscription.status}</strong>
          </div>
          <div>
            <span>
              {subscription.cancel_at_period_end
                ? "Access until"
                : "Current period ends"}
            </span>
            <strong>{formatDate(subscription.current_period_end)}</strong>
          </div>
          <div>
            <span>Payment management</span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => onBilling("portal")}
            >
              Open Stripe billing <Icon name="external" size={14} />
            </button>
          </div>
        </div>
      )}
      {!preview && !enrollmentReady && (
        <div className="banner">
          <Icon name="lock" size={18} />
          <span>
            New enrollment is not open yet. LMR must publish and approve its
            membership terms and privacy policy before checkout is enabled.
            Existing members can manage billing.
          </span>
        </div>
      )}
      {preview && (
        <div className="banner">
          Membership preview. Checkout is disabled here; no payment or
          subscription will be created.
        </div>
      )}
      <div className="billing-grid">
        {[
          ["monthly", "Monthly membership", "Billed monthly"],
          ["yearly", "Annual membership", "Billed annually"],
        ].map(([plan, title, label]) => (
          <section
            className={`plan-card panel ${plan === "yearly" ? "featured" : ""}`}
            key={plan}
          >
            <span className="tag">LMR INNER CIRCLE</span>
            <h2>{title}</h2>
            <div className="plan-price">{label}</div>
            <p>
              Your exact price, currency, taxes and renewal terms are shown in
              Stripe before you confirm.
            </p>
            <ul>
              {[
                "Live analysis & member Q&A",
                "LMR observations & callouts",
                "Journal Application",
                "Execution & achievement galleries",
              "Private mentorship requests; scheduling confirmed separately",
              ].map((t) => (
                <li key={t}>
                  <Icon name="check" size={15} />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              gold={plan === "yearly"}
              disabled={
                preview ||
                busy ||
                entitled ||
                (!existingSubscription && (!enrollmentReady || !accepted))
              }
              onClick={() =>
                onBilling(existingSubscription ? "portal" : "checkout", plan)
              }
            >
              {entitled
                ? "Your membership is active"
                : existingSubscription
                  ? "Manage existing subscription"
                  : "Continue to secure checkout"}
              <Icon name="arrow" size={15} />
            </Button>
          </section>
        ))}
      </div>
      {!entitled && <section className="membership-expectations"><h2>Know what you are joining.</h2><p>Membership is recurring. Review the total and renewal details in Stripe before confirming. Paid access starts after payment verification. Administrator permissions are separate from membership.</p><p>Refund requests are reviewed case by case, with Australian Consumer Law rights preserved. For cancellation or billing support, use Profile → Membership or contact <a href={`mailto:${provider.contact}`}>{provider.contact}</a>.</p></section>}
      {!entitled && !existingSubscription && (
        <label className="check-label spaced">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            I have read the{" "}
            <button className="text-button" onClick={() => onLegal("terms")}>
              membership terms
            </button>
            ,{" "}
            <button className="text-button" onClick={() => onLegal("privacy")}>
              privacy policy
            </button>{" "}
            and{" "}
            <button className="text-button" onClick={() => onLegal("risk")}>
              risk disclosure
            </button>
            , including renewal and cancellation terms.
          </span>
        </label>
      )}
      <p className="content-note">
        Subscription access is confirmed by Stripe and the LMR server. Returning
        from checkout does not by itself activate membership. Use the available
        Stripe billing controls to manage cancellation, or contact LMR if billing
        controls are unavailable. Check the effective cancellation date.
      </p>
      <Button icon="refresh" onClick={onRefresh} disabled={busy}>
        Refresh membership status
      </Button>
    </>
  );
}
