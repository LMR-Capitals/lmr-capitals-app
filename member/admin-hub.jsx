import React, { useEffect, useRef, useState } from "react";
import { sb } from "./api";
import { preview } from "./config";
import { Button, Empty, formatDate } from "./ui";
import Icon from "./icons";
import JournalContent from "./journal-content";
import { hubRpc, journalCollections, journalRecords, verifiedAdmin } from "../admin/hub-api.mjs";
import "./admin-hub.css";

const tabs = [["users", "Users & access"], ["subs", "Subscribers"], ["admins", "Administrators"], ["journal", "Journal database"]];
const listRpc = { users: "admin_list_users", subs: "admin_list_subscriptions", admins: "admin_list_admins" };
export default function AdminHub({ verified, user, onNavigate }) {
  if (!verified) return <Empty icon="shield" title="Verify your administrator account" body="Complete two-factor verification to open the Admin Hub and your private journal data.">
    <a className="button gold" href="/admin?next=circle">Verify administrator access <Icon name="arrow" size={15} /></a>
  </Empty>;
  return <ConnectedHub user={user} onNavigate={onNavigate} />;
}
function ConnectedHub({ user, onNavigate }) {
  const [tab, setTab] = useState("users"), [query, setQuery] = useState("");
  const [metrics, setMetrics] = useState(null), [rows, setRows] = useState([]);
  const [collection, setCollection] = useState("trades"), [page, setPage] = useState(0), [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [notice, setNotice] = useState(""), [email, setEmail] = useState(""), [version, setVersion] = useState(0);
  const generation = useRef(0), operation = useRef(false);
  useEffect(() => {
    if (preview) return;
    let active = true;
    hubRpc(sb, "admin_metrics").then((data) => { if (active) setMetrics(data?.[0] || null); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [version]);
  useEffect(() => {
    const request = ++generation.current;
    setLoading(true); setRows([]); setError("");
    const timer = setTimeout(async () => {
      try {
        const result = preview ? { rows: [], count: 0 } : tab === "journal"
          ? await journalRecords(sb, collection, page)
          : { rows: await hubRpc(sb, listRpc[tab], tab === "admins" ? undefined : { search: query.trim() }) };
        if (request !== generation.current) return;
        setRows(result.rows); setCount(result.count || 0);
      } catch (e) { if (request === generation.current) setError(e.message); }
      finally { if (request === generation.current) setLoading(false); }
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); ++generation.current; };
  }, [tab, query, collection, page, version]);
  async function action(fn, message) {
    if (operation.current || preview) return;
    operation.current = true; setBusy(true); setError(""); setNotice("");
    try { await fn(); setNotice(message); setVersion((v) => v + 1); }
    catch (e) { setError(e.message); }
    finally { operation.current = false; setBusy(false); }
  }
  const comp = (row) => {
    if (!confirm(`${row.comp ? "Revoke" : "Grant"} legacy complimentary journal access for ${row.email}? This does not activate paid Inner Circle membership.`)) return;
    action(() => hubRpc(sb, row.comp ? "admin_revoke_comp" : "admin_grant_comp", row.comp ? { target: row.user_id } : { target: row.user_id, note: null }), "Legacy access updated.");
  };
  const cancel = (row) => {
    if (!confirm(`Cancel the subscription for ${row.email} immediately? This changes live Stripe billing and removes paid access.`)) return;
    action(async () => {
      await verifiedAdmin(sb);
      const { data, error } = await sb.functions.invoke("admin-cancel-subscription", { body: { user_id: row.user_id } });
      if (error || data?.error) throw new Error(data?.error || error.message);
    }, "Subscription canceled.");
  };
  const removeAdmin = (row) => {
    if (!confirm(`Remove administrator access for ${row.email}?`)) return;
    action(() => hubRpc(sb, "admin_remove_admin", { target: row.user_id }), "Administrator access removed.");
  };
  return <div className="circle-admin-hub">
    <section className="hub-intro">
      <div><h2>Your business. Your journal. One workspace.</h2><p>Manage the existing LMR accounts and subscription records, or open your journal with the same verified account.</p></div>
      <Button small icon="refresh" disabled={busy || loading} onClick={() => setVersion((v) => v + 1)}>Refresh</Button>
    </section>
    <div className="hub-shortcuts">
      <Button icon="send" onClick={() => onNavigate("admin")}>Publishing studio</Button>
    </div>
    {preview && <div className="banner">Admin Hub preview. Private database records and account actions are available after real administrator sign-in.</div>}
    <dl className="hub-metrics" aria-label="Business metrics">
      {[["total_users", "Total accounts"], ["active", "Active subscriptions"], ["trialing", "Trial subscriptions"], ["comp", "Legacy comp access"], ["past_due", "Past due"], ["canceled", "Canceled"]].map(([key, label]) =>
        <div key={key}><dt>{label}</dt><dd>{metrics?.[key] ?? "—"}</dd></div>)}
      <div><dt>Estimated recurring revenue</dt><dd>{metrics ? new Intl.NumberFormat(undefined, { style: "currency", currency: "AUD" }).format(Number(metrics.mrr_cents || 0) / 100) : "—"}<small> / month</small></dd></div>
    </dl>
    <nav className="hub-tabs" aria-label="Admin Hub sections">{tabs.map(([id, label]) =>
      <button key={id} aria-current={tab === id ? "page" : undefined} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setQuery(""); setPage(0); setNotice(""); }}>{label}</button>)}</nav>
    {error && <div className="banner error" role="alert"><span>{error}</span><Button small onClick={() => setVersion((v) => v + 1)}>Try again</Button></div>}
    {notice && <div className="banner" role="status">{notice}</div>}
    <section className="panel hub-records" aria-busy={loading}>
      <div className="hub-tools">
        {tab === "journal" ? <><label>Journal collection<select value={collection} onChange={(e) => { setCollection(e.target.value); setPage(0); }}>{journalCollections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><span>Your account’s cloud records. Changes stay in the Journal Application.</span></>
          : tab === "admins" ? <form onSubmit={(e) => { e.preventDefault(); if (!email.trim()) return; if (!confirm(`Give administrator access to ${email.trim()}?`)) return; action(async () => { await hubRpc(sb, "admin_add_admin", { target_email: email.trim() }); setEmail(""); }, "Administrator added."); }}><label>Existing account email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="off" /></label><Button gold disabled={busy || preview} type="submit">Add administrator</Button></form>
          : <label>Search by email<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "users" ? "Find an LMR account…" : "Find a subscriber…"} /></label>}
      </div>
      {tab === "users" && <p className="hub-explanation">Complimentary access records belong to the existing journal access system. They do not create a subscription or mark an invoice as paid.</p>}
      {loading ? <div className="loading"><span className="spinner" />Loading {tabs.find(([id]) => id === tab)[1].toLowerCase()}…</div>
        : !rows.length ? <Empty icon={tab === "journal" ? "application" : "profile"} title={preview ? "Connect your real administrator account" : "No records found"} body={preview ? "Preview does not load your private database." : "Try another search or collection, or refresh the cloud records."} />
        : rows.map((row, index) => tab === "journal" ? <JournalRecord key={row.id || row.key || row.week_key || index} row={row} />
          : <div className="hub-row" key={row.user_id}>
            <div><strong>{row.email}</strong><small>{tab === "subs" ? `${row.plan || "Subscription"} · ${row.cancel_at_period_end ? "Ends" : "Current period ends"} ${formatDate(row.current_period_end)}` : tab === "admins" ? `Administrator since ${formatDate(row.added_at)}` : `Subscription: ${row.sub_status || "none"}`}</small></div>
            {tab !== "admins" && <span className="tag">{tab === "users" ? row.comp ? "Legacy comp" : row.sub_status || "Free account" : row.status || "Unknown"}</span>}
            {tab === "users" && <Button small disabled={busy || preview} onClick={() => comp(row)}>{row.comp ? "Revoke comp" : "Grant comp"}</Button>}
            {tab === "subs" && ["active", "trialing", "past_due"].includes(row.status) && <Button small disabled={busy || preview} onClick={() => cancel(row)}>Cancel subscription</Button>}
            {tab === "admins" && <Button small disabled={busy || preview || row.user_id === user?.id || rows.length <= 1} onClick={() => removeAdmin(row)}>Remove admin</Button>}
          </div>)}
      {tab === "journal" && <div className="hub-pagination"><span>{count ? `${page * 20 + 1}–${Math.min((page + 1) * 20, count)} of ${count} records` : "0 records"}</span><Button small disabled={loading || page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button small disabled={loading || (page + 1) * 20 >= count} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}
    </section>
  </div>;
}
function JournalRecord({ row }) {
  const title = row.title || row.name || row.market || row.week_key || row.key || row.period_key || row.date || "Journal record";
  return <details className="hub-journal-record"><summary><strong>{title}</strong><span>{row.date || row.achieved_on || row.trade_date || (row.updated_at ? formatDate(row.updated_at) : "View record")}</span></summary>
    <dl>{Object.entries(row).map(([key, value]) => value == null ? null : <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{["content", "text", "feedback", "caption", "review_notes"].includes(key) && typeof value === "string" ? <JournalContent content={value} /> : <pre>{typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</pre>}</dd></div>)}</dl>
  </details>;
}
