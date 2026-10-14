import {newestJournalFirst} from "./journal-order.mjs";
import React, { useState } from "react";
import { Button, Empty, formatDate } from "./ui";
import {AchievementDetails, ObservationRecord} from "./journal-record";
import { journalImageUrl } from "./journal-media.mjs";

export default function JournalSources({ data, kind, busy, onPublish, onRefresh }) {
  const entries = newestJournalFirst(data.journalEntries || []).filter(
    (entry) => entry.kind === kind,
  );
  const [selected, setSelected] = useState(null);
  const source = entries.find((entry) => entry.id === selected) || entries[0];
  const linked =
    source &&
    data.adminPosts.find(
      (post) => post.source_kind === kind && post.source_id === source.id,
    );
  return (
    <section className="panel form-panel journal-source-panel">
      <span className="tag">From your Journal Application</span>
      <h2>
        {kind === "observation"
          ? "Your observations, in the circle."
          : kind === "trade" ? "Your Journal entry, published once." : "Your achievements, in the circle."}
      </h2>
      <p>
        {kind === "trade" ? "Choose a saved trade. Only the chart labelled ENTRY · exit / outcome and its market, direction, session and date are shared. ENTRY images are published as snapshots; refresh a publication to replace its chart. Journal detail edits stay in sync." : "Choose a saved Journal record. Its original notes and images are shared with paid members. Later edits update the linked copy and notify them."}
      </p>
      {onRefresh && <Button small icon="refresh" disabled={busy} onClick={onRefresh}>Refresh from Journal</Button>}
      {data.journalError ? (
        <div className="error" role="alert">
          Your Journal records could not load. Refresh the workspace and try again.
        </div>
      ) : !source ? (
        <Empty
          icon={kind === "observation" ? "observations" : kind === "trade" ? "executions" : "achievements"}
          title="No journal records yet"
          body="Save a record to the cloud in your Journal Application, then refresh this desk."
        />
      ) : (
        <>
          <label>
            Journal record · newest first
            <select
              value={source.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
          <article className="journal-source-preview">
            <div className="journal-source-meta">
              <span className="tag">
                {linked?.status === "published"
                  ? "Published · linked to Journal"
                  : linked
                    ? "Private Studio draft"
                    : "Not shared with members"}
              </span>
              <small>{formatDate(source.updated_at)}</small>
            </div>
            {kind !== "achievement" && <h3>{source.title}</h3>}
            {kind === "observation" ? (
              <ObservationRecord record={source} />
            ) : (
              <>
                {kind === "trade" && <><span className="tag">ENTRY · exit / outcome</span><p>{source.body}</p></>}
                {journalImageUrl(source.image) && (
                  <img
                    className={`journal-source-image ${kind === "achievement" ? "certificate-image" : ""}`}
                    src={journalImageUrl(source.image)}
                    alt={source.title}
                  />
                )}
                {kind === "achievement" && <><AchievementDetails record={source} /><small className="form-help">{source.is_public ? "Also shown on your landing page" : "Not published on your landing page"}. This setting stays as it is in Journal.</small></>}
              </>
            )}
          </article>
          {["trade", "achievement"].includes(kind) && !journalImageUrl(source.image) && <p className="form-help">{kind === "trade" ? "Save the chart labelled ENTRY (exit / outcome) for this trade in your Journal, then refresh this selection before publishing." : "Add an image to this achievement in your Journal, then refresh this selection."}</p>}
          <form
            key={source.id}
            onSubmit={(event) => {
              event.preventDefault();
              onPublish(source);
            }}
            className="form-stack"
          >
            <p className="form-help">
              Audience: paid members. The original journal record stays in your
              account. Publishing here does not change its public website
              setting.
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                required
                disabled={kind !== "trade" && linked?.status === "published"}
              />
              <span>
                I have reviewed the notes and images for accuracy, privacy and
                trading risk.
              </span>
            </label>
            <Button
              gold
              type="submit"
              disabled={
                busy ||
                (kind !== "trade" && linked?.status === "published") ||
                (["achievement", "trade"].includes(kind) && !journalImageUrl(source.image))
              }
              icon="send"
            >
              {linked?.status === "published"
                ? kind === "trade" ? "Refresh ENTRY chart from Journal" : "Published from journal"
                : linked
                  ? "Publish to members"
                  : "Publish journal record"}
            </Button>
            {linked?.status === "published" && (
              <p className="form-help">
                Edit this record in your Journal Application. Use LMR Studio
                publications to withdraw it.
              </p>
            )}
          </form>
        </>
      )}
    </section>
  );
}
