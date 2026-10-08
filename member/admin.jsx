import {newestJournalFirst} from "./journal-order.mjs";
import React, { useState } from "react";
import Icon from "./icons";
import { Button, Empty, kindLabels, formatDate } from "./ui";
import { preview } from "./config";
import ObservationComposer from "./observation-composer";
import QuestionQueue from "./question-queue";
import JournalSources from "./journal-sources";
import JournalContent from "./journal-content";
import SessionSwitcher from "./session-switcher";
import {
  sessionBlocks,
  sessionsForBlock,
  sessionBlockLabel,
  validSessionBlock,
} from "./live-sessions.mjs";
export default function Admin({
  data,
  onPublish,
  onJournalPublish,
  onCreateObservation,
  onRefreshJournal,
  onSession,
  onAnnouncement,
  onAnswer,
  onMentorshipReply,
  onPostStatus,
  onSessionStatus,
  onSessionBlock,
  busy,
  verified,
  activeTab,
  onTabChange,
  hideTabs = false,
  initialKind = "observation",
}) {
  const [localTab, setLocalTab] = useState("post"),
    [kind, setKind] = useState(initialKind);
  const tab = activeTab ?? localTab;
  const setTab = onTabChange || setLocalTab;
  const [block, setBlock] = useState("asia");
  const [creatingObservation,setCreatingObservation] = useState(false);
  if (!verified && !preview)
    return (
      <Empty
        icon="shield"
        title="Admin verification required"
        body="Complete the existing LMR admin sign-in and two-factor verification to publish to members."
      >
        <a className="button gold" href="/admin">
          Open secure admin portal
        </a>
      </Empty>
    );
  return (
    <>
      <div className="banner">
        <Icon name="shield" size={17} />
        <span>
          {preview
            ? "Admin workspace preview. Actions only update this browser session."
            : "Live desk publications are for paid members. Free resources reach every signed-in account. Drafts remain private."}
        </span>
      </div>
      {!hideTabs && (
        <div className="tabs">
          {[
            ["post", "Publish a post"],
            ["manage", "Manage publications"],
            ["session", "Live sessions"],
            ["announcement", "Send announcement"],
            ["questions", "Member questions"],
            ["mentorship", "Mentorship requests"],
          ].map(([id, label]) => (
            <button
              className={tab === id ? "selected" : ""}
              key={id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === "post" && (
        <div className="admin-editor">
          <section className="panel form-panel">
            {!["observation", "achievement", "execution"].includes(kind) && (
              <>
                <h2>From your desk to the circle.</h2>
                <p>Share a desk update with members.</p>
              </>
            )}
            {!hideTabs && <div className="admin-types">
              {Object.entries(kindLabels).map(([id, label]) => (
                <button
                  className={kind === id ? "active" : ""}
                  key={id}
                  onClick={() => setKind(id)}
                >
                  {label}
                </button>
              ))}
            </div>}
            {kind === "observation" && onCreateObservation && <ObservationComposer busy={busy} onCreate={onCreateObservation} open={creatingObservation} onToggle={setCreatingObservation} />}
            {["observation", "achievement", "execution"].includes(kind) ? (creatingObservation ? null : (
              <JournalSources
                data={data}
                key={kind}
                kind={kind === "execution" ? "trade" : kind}
                busy={busy}
                onPublish={onJournalPublish}
                onRefresh={onRefreshJournal}
              />
            )) : (
              <>
                <p className="form-help">
                  {kind === "terminology"
                    ? "Audience: all signed-in accounts. This will appear in Free resources."
                    : "Audience: paid members. This publication stays behind membership."}
                </p>
                <form
                  className="form-stack"
                  onSubmit={(e) => onPublish(e, kind)}
                >
                  <label>
                    Post title
                    <input
                      name="title"
                      required
                      maxLength="160"
                      placeholder="Give members a clear starting point"
                    />
                  </label>
                  <label>
                    Your analysis or context
                    <textarea
                      name="body"
                      required
                      maxLength="12000"
                      placeholder="Explain what you observed, why it matters, and the limitations of the idea."
                    />
                  </label>
                  {kind === "callout" && <>
                    <label>Conditions to watch<textarea name="conditions" required maxLength="2500" placeholder="What must be present before this idea is relevant?" /></label>
                    <label>Invalidation<textarea name="invalidation" required maxLength="2500" placeholder="What would invalidate the idea?" /></label>
                  </>}
                  <label>
                    Image caption
                    <input
                      name="image_caption"
                      maxLength="300"
                      placeholder="Describe the chart, execution, or achievement"
                    />
                  </label>
                  <label className="upload-area">
                    <Icon name="image" />
                    Attach a chart or image
                    <input
                      name="image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      required={["execution", "achievement"].includes(kind)}
                    />
                    <small>
                      PNG, JPEG, WebP · Up to 10 MB. Remove personal account
                      identifiers before publishing.
                    </small>
                  </label>
                  <label>
                    Publish status
                    <select name="status" defaultValue="published">
                      <option value="published">Publish to members</option>
                      <option value="draft">Save as a private draft</option>
                    </select>
                  </label>
                  <label className="check-label">
                    <input name="pinned" type="checkbox" />
                    <span>Pin this post to the desk feed</span>
                  </label>
                  <p className="form-help">
                    Members are notified automatically when a post is published
                    or updated.
                  </p>
                  <label className="check-label">
                    <input required type="checkbox" />
                    <span>
                      I have reviewed this post for accuracy, privacy and
                      trading risk. Any performance shown is labeled with its
                      context and limitations.
                    </span>
                  </label>
                  <Button gold type="submit" disabled={busy} icon="send">
                    {busy ? "Saving…" : "Save post"}
                  </Button>
                </form>
              </>
            )}
          </section>
          <aside>
            <section className="panel form-panel">
              <h2>Publishing checklist</h2>
              <ol className="progress-list">
                <li>
                  <span>01</span>
                  <div>
                    <strong>Context before conclusions</strong>Identify the
                    instrument, time frame, and the reasoning.
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Label results honestly</strong>Distinguish actual,
                    simulated and hypothetical activity.
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Protect private information</strong>Remove
                    credentials, account numbers and member information from
                    images.
                  </div>
                </li>
              </ol>
            </section>
          </aside>
        </div>
      )}
      {tab === "manage" && (
        <div className="panel">
          {newestJournalFirst([
            ...data.adminPosts,
            ...data.posts.filter(
              (p) => !data.adminPosts.some((a) => a.id === p.id),
            ),
          ]).map((p) => (
            <article className="question-row" key={p.id}>
              <span className="tag">
                {p.status} · {kindLabels[p.kind]}
              </span>
              <h3 className="spaced">{p.title}</h3>
              <p>{p.body}</p>
              <JournalContent content={p.source_content} />
              {p.image_url && (
                <figure className="admin-publication-image">
                  <img
                    src={p.image_url}
                    alt={p.image_caption || p.title}
                    loading="lazy"
                  />
                  {p.image_caption && (
                    <figcaption>{p.image_caption}</figcaption>
                  )}
                </figure>
              )}
              {p.media_error && (
                <p className="content-note">
                  The image could not load. Refresh the workspace to request a
                  new private image link.
                </p>
              )}
              <Button
                small
                disabled={busy}
                onClick={() =>
                  onPostStatus(
                    p.id,
                    p.status === "published" ? "draft" : "published",
                  )
                }
              >
                {p.status === "published"
                  ? "Unpublish to drafts"
                  : "Publish draft"}
              </Button>
            </article>
          ))}
        </div>
      )}
      {tab === "session" && (
        <section className="panel form-panel" style={{ maxWidth: 850 }}>
          <h2>Live session management</h2>
          <p>
            Organize your live desk into Asia, London, NY AM and NY PM. Set each
            broadcast's date, time and viewing link below.
          </p>
          <SessionSwitcher
            sessions={data.sessions}
            value={block}
            onChange={setBlock}
          />
          <h3>{sessionBlockLabel(block)} sessions</h3>
          {sessionsForBlock(data.sessions, block).map((s) => (
            <div className="question-row" key={s.id}>
              <span className="tag">{s.status}</span>
              <h3 className="spaced">{s.title}</h3>
              <div className="row-actions">
                <Button
                  small
                  disabled={busy || s.status === "live"}
                  onClick={() => onSessionStatus(s.id, "live")}
                >
                  Go live
                </Button>
                <Button
                  small
                  disabled={busy || s.status === "ended"}
                  onClick={() => onSessionStatus(s.id, "ended")}
                >
                  End session
                </Button>
              </div>
            </div>
          ))}
          {!sessionsForBlock(data.sessions, block).length && (
            <p className="content-note">
              No {sessionBlockLabel(block)} session scheduled. Create one below.
            </p>
          )}
          {data.sessions
            .filter((s) => !validSessionBlock(s.session_block))
            .map((s) => (
              <div className="question-row" key={s.id}>
                <span className="tag">Needs session group</span>
                <h3>{s.title}</h3>
                <label>
                  Assign session group
                  <select
                    value=""
                    disabled={busy || !onSessionBlock}
                    onChange={(e) => onSessionBlock(s.id, e.target.value)}
                  >
                    <option value="" disabled>
                      Choose Asia, London, NY AM or NY PM
                    </option>
                    {sessionBlocks.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          <h2 className="spaced">Schedule a new session</h2>
          <p>
            Stream through your provider and publish the viewing URL here. LMR
            controls access to the room; your provider controls broadcast
            delivery.
          </p>
          <form className="form-stack" onSubmit={onSession}>
            <label>
              Session group
              <select
                name="session_block"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                required
              >
                {sessionBlocks.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Session title
              <input required name="title" maxLength="160" />
            </label>
            <label>
              Description
              <textarea name="description" required maxLength="3000" />
            </label>
            <div className="form-row">
              <label>
                Start time — your device's local time
                <input type="datetime-local" name="starts_at" required />
              </label>
              <label>
                Status
                <select name="status">
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live now</option>
                  <option value="ended">Ended</option>
                </select>
              </label>
            </div>
            <label>
              Streaming provider
              <select name="provider">
                <option value="youtube">YouTube embed</option>
                <option value="vimeo">Vimeo embed</option>
                <option value="external">
                  External meeting / streaming link
                </option>
              </select>
            </label>
            <label>
              Member viewing URL
              <input
                name="stream_url"
                type="url"
                placeholder="https://www.youtube-nocookie.com/embed/VIDEO_ID"
                required
              />
            </label>
            <p className="form-help">
              Use an embed URL for YouTube or Vimeo. For other providers,
              members open the HTTPS link in a new tab. Never enter a broadcast
              stream key here. Use provider-side privacy restrictions for paid
              content.
            </p>
            <Button gold disabled={busy} type="submit" icon="live">
              {busy ? "Saving…" : "Publish session"}
            </Button>
          </form>
        </section>
      )}
      {tab === "announcement" && (
        <section className="panel form-panel" style={{ maxWidth: 800 }}>
          <h2>Share an update with your members.</h2>
          <p>
            Choose whether this update reaches paid members or every signed-in
            account.
          </p>
          <form className="form-stack" onSubmit={onAnnouncement}>
            <label>
              Announcement title
              <input name="title" required maxLength="160" />
            </label>
            <label>
              Message
              <textarea name="body" required maxLength="3000" />
            </label>
            <label>
              Category
              <select name="category">
                <option value="announcement">General announcement</option>
                <option value="live">Live analysis</option>
                <option value="post">New publication</option>
              </select>
            </label>
            <label>
              Audience
              <select name="audience" defaultValue="members">
                <option value="members">Paid members</option>
                <option value="free">Every signed-in account</option>
              </select>
            </label>
            <Button gold type="submit" disabled={busy} icon="send">
              {busy ? "Publishing…" : "Publish announcement"}
            </Button>
          </form>
          {data.notifications?.length > 0 && (
            <div className="spaced">
              <h3>Recent notifications</h3>
              {data.notifications.slice(0, 8).map((notice) => (
                <article className="question-row" key={notice.id}>
                  <span className="tag">
                    {notice.target_user_id
                      ? "Private member update"
                      : notice.audience === "free"
                        ? "Every signed-in account"
                        : "Paid members"}
                  </span>
                  <h3 className="spaced">{notice.title}</h3>
                  <p>{notice.body}</p>
                  <small className="content-note">
                    {formatDate(notice.created_at)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {tab === "questions" && <QuestionQueue questions={data.questions} onAnswer={onAnswer} busy={busy} />}
      {tab === "mentorship" && (
        <div className="panel">
          {data.mentorship.length ? (
            data.mentorship.map((r) => (
              <article key={r.id} className="question-row">
                <span className="tag">{r.status}</span>
                <h3 className="spaced">{r.experience}</h3>
                <p>{r.goals}</p>
                <p>{r.availability}</p>
                <small className="content-note">
                  Member reference: {r.user_id || "Preview member"}
                </small>
                <form
                  className="form-stack spaced"
                  onSubmit={(e) => onMentorshipReply(e, r.id)}
                >
                  <label>
                    Request status
                    <select name="status" defaultValue={r.status}>
                      <option value="pending">Pending review</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="approved">
                        Approved — arrange session
                      </option>
                      <option value="declined">Not available</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label>
                    Your private reply
                    <textarea
                      name="admin_reply"
                      defaultValue={r.admin_reply || ""}
                      required
                      maxLength="5000"
                    />
                  </label>
                  <Button gold type="submit" disabled={busy}>
                    Update request
                  </Button>
                </form>
              </article>
            ))
          ) : (
            <Empty
              icon="mentorship"
              title="No mentorship requests yet."
              body="Requests from paid members will appear here."
            />
          )}
        </div>
      )}
    </>
  );
}
