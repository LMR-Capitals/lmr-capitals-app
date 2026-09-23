// LMR Capitals — Admin experience (React + ThreeUI)
// Premium, admin-only gateway served at /admin:
//   login (email+password) -> ENFORCED 2FA (enroll if none, else challenge)
//   -> hub (Admin Portal / Admin Application) -> portal dashboard.
// Non-admins are refused. The trading app (index.html) redirects admins here.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ConstellationField } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';

const SB_URL = 'https://agrvylclhvxyevsmmexf.supabase.co';
const SB_KEY = 'sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh';
const sb = createClient(SB_URL, SB_KEY);

/* ── one-time global styling ─────────────────────────────────────────────── */
const CSS = `
:root{--bg:#05070d;--card:rgba(18,26,43,.55);--border:rgba(120,140,180,.16);
  --text:#EDF2FF;--text2:#9fb0cc;--text3:#6b7a95;--gold:#E9B44C;--gold2:#f6cd77;
  --bull:#31d0aa;--bear:#ef5350;--blue:#6aa1ff;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text)}
.bgwrap{position:fixed;inset:0;z-index:0;overflow:hidden;background:
  radial-gradient(1200px 700px at 70% -10%,rgba(233,180,76,.10),transparent 60%),
  radial-gradient(900px 600px at 10% 110%,rgba(76,120,255,.10),transparent 55%),#05070d}
.bgwrap canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.veil{position:fixed;inset:0;z-index:1;background:linear-gradient(180deg,rgba(5,7,13,.35),rgba(5,7,13,.72))}
.shell{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column}
.wrap{width:100%;max-width:1120px;margin:0 auto;padding:26px 20px 70px}
.center{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}

.brand{display:flex;align-items:center;gap:11px;justify-content:center;margin-bottom:6px}
.brand img{width:30px;height:30px}
.brand .n{font-weight:800;letter-spacing:.4em;font-size:15px}
.brand .n b{color:var(--gold)}

.glass{background:var(--card);border:1px solid var(--border);border-radius:20px;
  backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);
  box-shadow:0 30px 80px -30px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.05)}
.auth{width:100%;max-width:410px;padding:34px 30px}
.title{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:14px 0 4px;text-align:center}
.sub{color:var(--text3);font-size:13px;text-align:center;margin:0 0 22px}
label{display:block;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px}
.input{width:100%;background:rgba(8,12,20,.7);border:1px solid var(--border);color:var(--text);
  border-radius:12px;padding:13px 14px;font-size:15px;outline:none;transition:border-color .15s,box-shadow .15s}
.input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(233,180,76,.15)}
.field{margin-bottom:15px}
.btn{width:100%;border:none;border-radius:12px;padding:13px;font-weight:800;font-size:15px;cursor:pointer;
  transition:transform .08s ease,filter .15s;letter-spacing:.01em}
.btn:active{transform:translateY(1px)}
.btn-gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;
  box-shadow:0 10px 30px -10px rgba(233,180,76,.6)}
.btn-gold:hover{filter:brightness(1.06)}
.btn-ghost{background:rgba(255,255,255,.05);color:var(--text2);border:1px solid var(--border)}
.err{color:var(--bear);font-size:12.5px;min-height:16px;margin-top:12px;text-align:center}
.link{color:var(--text3);font-size:13px;cursor:pointer;text-decoration:underline;background:none;border:none}
.code-input{letter-spacing:.5em;text-align:center;font-size:22px;font-weight:800}
.qrbox{background:#fff;border-radius:14px;padding:14px;width:200px;height:200px;margin:6px auto 14px;display:flex;align-items:center;justify-content:center}
.qrbox img,.qrbox svg{width:100%;height:100%}
.secret{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--text2);
  background:rgba(8,12,20,.7);border:1px solid var(--border);border-radius:9px;padding:8px 10px;word-break:break-all;text-align:center;margin-bottom:16px}

/* hub */
.hubhead{text-align:center;margin:40px 0 30px}
.hubcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:760px;margin:0 auto}
.hubcard{position:relative;text-align:left;cursor:pointer;padding:30px 26px;border-radius:20px;color:inherit;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.hubcard:hover{transform:translateY(-4px);border-color:rgba(233,180,76,.6);box-shadow:0 40px 90px -40px rgba(233,180,76,.35)}
.hubcard .ic{font-size:30px;margin-bottom:14px}
.hubcard h3{margin:0 0 8px;font-size:19px;font-weight:800}
.hubcard p{margin:0;font-size:13px;color:var(--text3);line-height:1.55}
.hubcard .go{position:absolute;top:26px;right:26px;color:var(--gold);font-weight:800}

/* topbar */
.top{display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.top .lg{display:flex;align-items:center;gap:9px}
.top .lg img{width:26px;height:26px}
.top .lg b{font-weight:800;letter-spacing:.3em;font-size:13px}
.pill{font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:999px;background:rgba(233,180,76,.16);color:var(--gold);letter-spacing:.04em}
.spacer{flex:1}
.who{color:var(--text3);font-size:12.5px}

/* tiles */
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:26px}
.tile{padding:16px 18px;border-radius:16px}
.tile .v{font-size:25px;font-weight:800;line-height:1.05;background:linear-gradient(135deg,#fff,#b9c6de);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.tile .k{font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-top:5px}
@media(max-width:820px){.tiles{grid-template-columns:repeat(2,1fr)}}

.tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.tab{padding:9px 17px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid var(--border);
  color:var(--text2);font-weight:700;font-size:13px;cursor:pointer;transition:all .15s}
.tab.active{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f;border-color:transparent}
.panel{border-radius:18px;overflow:hidden}
.search{padding:14px;border-bottom:1px solid var(--border)}
.row{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--border)}
.row:last-child{border-bottom:none}
.grow{flex:1;min-width:0}
.em{font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rsub{font-size:11.5px;margin-top:3px;color:var(--text3)}
.badge{font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
.b-free{background:rgba(106,161,255,.16);color:var(--blue)}
.b-active{background:rgba(49,208,170,.16);color:var(--bull)}
.b-trial{background:rgba(233,180,76,.16);color:var(--gold)}
.b-none{background:rgba(255,255,255,.06);color:var(--text3)}
.b-dead{background:rgba(239,83,80,.16);color:var(--bear)}
.mini{border:none;border-radius:9px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.mini-gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#0a0b0f}
.mini-danger{background:rgba(239,83,80,.14);color:var(--bear);border:1px solid rgba(239,83,80,.32)}
.empty{padding:22px 14px;color:var(--text3);font-size:13px;text-align:center}
.addrow{display:flex;gap:8px;padding:14px;border-bottom:1px solid var(--border)}
`;

/* ── ThreeUI backdrop, guarded so a WebGL failure never blanks the page ──── */
class BgBoundary extends React.Component {
  constructor(p){ super(p); this.state = { dead:false }; }
  static getDerivedStateFromError(){ return { dead:true }; }
  componentDidCatch(){ /* swallow — gradient fallback remains */ }
  render(){ return this.state.dead ? null : this.props.children; }
}
function Backdrop(){
  return (
    <div className="bgwrap">
      <BgBoundary>
        <ConstellationField variant="connectivity-graph" mode="dark" hue={42}
          saturation={0.9} brightness={1.05} opacity={0.55} speed={0.6} />
      </BgBoundary>
    </div>
  );
}
function Frame({ children }){
  return (<>
    <Backdrop /><div className="veil" />
    <div className="shell">{children}</div>
  </>);
}
const Brand = () => (
  <div className="brand"><img src="/icons/lmr-icon.png" alt="" />
    <span className="n"><b>LMR</b> CAPITALS</span></div>
);

/* ── auth screens ────────────────────────────────────────────────────────── */
function Login({ onDone }){
  const [email,setEmail]=useState(''); const [pass,setPass]=useState('');
  const [busy,setBusy]=useState(false); const [err,setErr]=useState('');
  const submit=async()=>{
    setErr(''); if(!email||!pass){setErr('Email and password are required.');return;}
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email:email.trim(), password:pass });
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onDone();
  };
  return (
    <div className="center"><div className="glass auth">
      <Brand />
      <div className="title">Admin sign in</div>
      <div className="sub">Restricted area — administrators only.</div>
      <div className="field"><label>Email</label>
        <input className="input" type="email" autoComplete="username" value={email}
          onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} /></div>
      <div className="field"><label>Password</label>
        <input className="input" type="password" autoComplete="current-password" value={pass}
          onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} /></div>
      <button className="btn btn-gold" disabled={busy} onClick={submit}>{busy?'Signing in…':'Continue →'}</button>
      <div className="err">{err}</div>
    </div></div>
  );
}

function TwoFA({ mode, enroll, onVerify, onSignOut }){
  // mode: 'enroll' (show QR + secret) | 'challenge' (code only)
  const [code,setCode]=useState(''); const [busy,setBusy]=useState(false); const [err,setErr]=useState('');
  const submit=async()=>{
    const c=code.replace(/\s/g,''); if(c.length!==6){ setErr('Enter the 6-digit code.'); return; }
    setErr(''); setBusy(true);
    const e = await onVerify(c);
    setBusy(false);
    if(e){ setErr(e); setCode(''); }
  };
  return (
    <div className="center"><div className="glass auth">
      <Brand />
      <div className="title">{mode==='enroll'?'Secure your admin access':'Two-factor verification'}</div>
      <div className="sub">{mode==='enroll'
        ? 'Scan this with Google Authenticator / Authy, then enter the 6-digit code to finish setup.'
        : 'Enter the 6-digit code from your authenticator app.'}</div>
      {mode==='enroll' && enroll && (<>
        <div className="qrbox" dangerouslySetInnerHTML={{__html: enroll.totp?.qr_code || ''}} />
        {enroll.totp?.secret && <div className="secret">{enroll.totp.secret}</div>}
      </>)}
      <div className="field">
        <input className="input code-input" inputMode="numeric" maxLength={6} placeholder="••••••"
          value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9]/g,''))}
          onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus /></div>
      <button className="btn btn-gold" disabled={busy} onClick={submit}>{busy?'Verifying…':(mode==='enroll'?'Verify & finish':'Verify →')}</button>
      <div className="err">{err}</div>
      <div style={{textAlign:'center',marginTop:14}}><button className="link" onClick={onSignOut}>Sign out</button></div>
    </div></div>
  );
}

function Denied({ email, onSignOut }){
  return (
    <div className="center"><div className="glass auth" style={{textAlign:'center'}}>
      <Brand />
      <div className="title" style={{color:'var(--bear)'}}>Not an admin account</div>
      <div className="sub">{email?('Signed in as '+email):''}</div>
      <button className="btn btn-ghost" onClick={onSignOut}>Sign out</button>
    </div></div>
  );
}

function Hub({ email, onPortal, onSignOut }){
  const enterApp=()=>{ try{ sessionStorage.setItem('lmr_admin_surface','app'); }catch(e){} window.location.href='/'; };
  return (
    <div className="wrap">
      <div className="hubhead">
        <Brand />
        <h1 className="title" style={{fontSize:30,marginTop:16}}>Welcome back, Admin</h1>
        <p className="sub">Choose where you want to go.</p>
        <p className="sub" style={{marginTop:-14}}>{email}</p>
      </div>
      <div className="hubcards">
        <div className="glass hubcard" onClick={onPortal}>
          <span className="go">↗</span>
          <div className="ic">🛠️</div>
          <h3>Admin Portal</h3>
          <p>Business metrics, users &amp; free access, subscribers &amp; billing, and manage admins.</p>
        </div>
        <div className="glass hubcard" onClick={enterApp}>
          <span className="go">↗</span>
          <div className="ic">📈</div>
          <h3>Admin Application</h3>
          <p>The full LMR Capitals trading journal — sessions, analysis, trades, knowledge, and in-app admin controls.</p>
        </div>
      </div>
      <div style={{textAlign:'center',marginTop:28}}><button className="link" onClick={onSignOut}>Sign out</button></div>
    </div>
  );
}

/* ── portal dashboard ────────────────────────────────────────────────────── */
const money = (c)=> 'A$'+(Number(c||0)/100).toLocaleString(undefined,{maximumFractionDigits:0});
const esc = (s)=> String(s==null?'':s);

function Portal({ email, onBack, onSignOut }){
  const [m,setM]=useState(null);
  const [tab,setTab]=useState('users');
  const loadMetrics=useCallback(async()=>{
    const { data } = await sb.rpc('admin_metrics');
    if(data && data[0]) setM(data[0]);
  },[]);
  useEffect(()=>{ loadMetrics(); },[loadMetrics]);
  return (
    <div className="wrap">
      <div className="top">
        <div className="lg"><img src="/icons/lmr-icon.png" alt="" /><b>LMR ADMIN</b></div>
        <span className="pill">web portal</span>
        <div className="spacer" />
        <span className="who">{email}</span>
        <button className="mini" style={{background:'rgba(255,255,255,.06)',color:'var(--text2)',border:'1px solid var(--border)'}} onClick={onBack}>← Hub</button>
        <button className="mini mini-danger" onClick={onSignOut}>Sign out</button>
      </div>
      <div className="tiles">
        <Tile v={m?m.total_users:'—'} k="Total users" />
        <Tile v={m?m.active:'—'} k="Active" />
        <Tile v={m?m.trialing:'—'} k="Trialing" />
        <Tile v={m?m.comp:'—'} k="Free access" />
        <Tile v={m?money(m.mrr_cents)+'/mo':'—'} k="Est. MRR" />
      </div>
      <div className="tabs">
        {['users','subs','admins'].map(t=>(
          <button key={t} className={'tab'+(tab===t?' active':'')} onClick={()=>setTab(t)}>
            {t==='users'?'Users & access':t==='subs'?'Subscribers':'Admins'}</button>
        ))}
      </div>
      {tab==='users' && <UsersTab onChange={loadMetrics} />}
      {tab==='subs' && <SubsTab onChange={loadMetrics} />}
      {tab==='admins' && <AdminsTab />}
    </div>
  );
}
const Tile = ({v,k})=>(<div className="glass tile"><div className="v">{v}</div><div className="k">{k}</div></div>);

function useSearch(rpc, buildArgs){
  const [rows,setRows]=useState(null); const [q,setQ]=useState(''); const [err,setErr]=useState('');
  const t=useRef();
  const run=useCallback(async(query)=>{
    setErr('');
    const { data, error } = await sb.rpc(rpc, buildArgs(query));
    if(error){ setErr(error.message); setRows([]); return; }
    setRows(data||[]);
  },[rpc,buildArgs]);
  useEffect(()=>{ run(''); },[run]);
  const onInput=(v)=>{ setQ(v); clearTimeout(t.current); t.current=setTimeout(()=>run(v),250); };
  return { rows, q, err, onInput, reload:()=>run(q) };
}

function UsersTab({ onChange }){
  const s=useSearch('admin_list_users', (q)=>({search:q}));
  const grant=async(id)=>{ const {error}=await sb.rpc('admin_grant_comp',{target:id,note:null}); if(error)return alert(error.message); s.reload(); onChange&&onChange(); };
  const revoke=async(id)=>{ const {error}=await sb.rpc('admin_revoke_comp',{target:id}); if(error)return alert(error.message); s.reload(); onChange&&onChange(); };
  return (
    <div className="glass panel">
      <div className="search"><input className="input" placeholder="Search users by email…" value={s.q} onChange={e=>s.onInput(e.target.value)} /></div>
      {s.err && <div className="empty" style={{color:'var(--bear)'}}>{s.err}</div>}
      {s.rows===null ? <div className="empty">Loading…</div>
        : s.rows.length===0 ? <div className="empty">No users found.</div>
        : s.rows.map(r=>{
          let badge=<span className="badge b-none">No access</span>;
          if(r.comp) badge=<span className="badge b-free">Free access</span>;
          else if(r.sub_status==='active') badge=<span className="badge b-active">Active</span>;
          else if(r.sub_status==='trialing') badge=<span className="badge b-trial">Trialing</span>;
          else if(r.sub_status) badge=<span className="badge b-dead">{r.sub_status}</span>;
          return (<div className="row" key={r.user_id}>
            <div className="grow"><div className="em">{esc(r.email)}</div><div className="rsub">{badge}</div></div>
            {r.comp
              ? <button className="mini mini-danger" onClick={()=>revoke(r.user_id)}>Revoke free</button>
              : <button className="mini mini-gold" onClick={()=>grant(r.user_id)}>Grant free</button>}
          </div>);
        })}
    </div>
  );
}

function SubsTab({ onChange }){
  const s=useSearch('admin_list_subscriptions', (q)=>({search:q}));
  const cancel=async(id,email)=>{
    if(!confirm('Cancel the subscription for '+email+' immediately? They lose access right away.')) return;
    const { data, error } = await sb.functions.invoke('admin-cancel-subscription',{body:{user_id:id}});
    if(error||(data&&data.error)){ alert('Cancel failed: '+((data&&data.error)||error.message)); return; }
    s.reload(); onChange&&onChange();
  };
  return (
    <div className="glass panel">
      <div className="search"><input className="input" placeholder="Search subscribers by email…" value={s.q} onChange={e=>s.onInput(e.target.value)} /></div>
      {s.err && <div className="empty" style={{color:'var(--bear)'}}>{s.err}</div>}
      {s.rows===null ? <div className="empty">Loading…</div>
        : s.rows.length===0 ? <div className="empty">No subscribers yet.</div>
        : s.rows.map(r=>{
          let badge=<span className="badge b-none">{r.status||'—'}</span>;
          if(r.status==='active') badge=<span className="badge b-active">Active</span>;
          else if(r.status==='trialing') badge=<span className="badge b-trial">Trialing</span>;
          else if(['canceled','past_due','unpaid','incomplete'].includes(r.status)) badge=<span className="badge b-dead">{r.status}</span>;
          const renew=r.current_period_end?new Date(r.current_period_end).toLocaleDateString():'—';
          const canCancel=['active','trialing','past_due'].includes(r.status);
          return (<div className="row" key={r.user_id}>
            <div className="grow"><div className="em">{esc(r.email)}</div>
              <div className="rsub">{(r.plan||'—')+' · renews '+renew+(r.cancel_at_period_end?' · cancels at period end':'')}</div></div>
            {badge}
            {canCancel && <button className="mini mini-danger" onClick={()=>cancel(r.user_id,esc(r.email))}>Cancel</button>}
          </div>);
        })}
    </div>
  );
}

function AdminsTab(){
  const [rows,setRows]=useState(null); const [email,setEmail]=useState(''); const [msg,setMsg]=useState('');
  const load=useCallback(async()=>{ const {data,error}=await sb.rpc('admin_list_admins'); if(error){setRows([]);return;} setRows(data||[]); },[]);
  useEffect(()=>{ load(); },[load]);
  const add=async()=>{ const e=email.trim(); if(!e)return; setMsg('');
    const {error}=await sb.rpc('admin_add_admin',{target_email:e});
    if(error){ setMsg(error.message); return; } setEmail(''); setMsg('✓ Added.'); load(); };
  const remove=async(id,em)=>{ if(!confirm('Remove admin access for '+em+'?'))return;
    const {error}=await sb.rpc('admin_remove_admin',{target:id}); if(error){alert(error.message);return;} load(); };
  return (
    <div className="glass panel">
      <div className="addrow">
        <input className="input" placeholder="Promote by email (must have an account)…" value={email}
          onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} />
        <button className="mini mini-gold" onClick={add}>Add admin</button>
      </div>
      {msg && <div className="empty" style={{color:msg[0]==='✓'?'var(--bull)':'var(--bear)'}}>{msg}</div>}
      {rows===null ? <div className="empty">Loading…</div>
        : rows.length===0 ? <div className="empty">No admins.</div>
        : rows.map(r=>(<div className="row" key={r.user_id}>
            <div className="grow"><div className="em">{esc(r.email)}</div>
              <div className="rsub">admin since {r.added_at?new Date(r.added_at).toLocaleDateString():'—'}</div></div>
            <button className="mini mini-danger" onClick={()=>remove(r.user_id,esc(r.email))}>Remove</button>
          </div>))}
    </div>
  );
}

/* ── root state machine ──────────────────────────────────────────────────── */
function App(){
  const [stage,setStage]=useState('boot');    // boot|login|enroll|challenge|denied|hub|portal
  const [email,setEmail]=useState('');
  const [enroll,setEnroll]=useState(null);
  const factorRef=useRef(null); const challengeRef=useRef(null);

  const signOut=useCallback(async()=>{ try{ sessionStorage.removeItem('lmr_admin_surface'); }catch(e){} await sb.auth.signOut(); setStage('login'); },[]);

  // After a session exists: verify admin, then enforce 2FA (aal2).
  const gate=useCallback(async()=>{
    const { data:{ user } } = await sb.auth.getUser();
    if(!user){ setStage('login'); return; }
    setEmail(user.email||'');
    const { data:isAdmin } = await sb.rpc('is_admin');
    if(!isAdmin){ setStage('denied'); return; }
    const { data:aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aal && aal.currentLevel==='aal2'){ setStage('hub'); return; }
    // needs 2FA — use an existing verified factor, else enroll a fresh one
    const { data:factors } = await sb.auth.mfa.listFactors();
    const verified=(factors?.totp||[]).filter(f=>f.status==='verified');
    if(verified.length){ factorRef.current=verified[0].id; const {data:ch}=await sb.auth.mfa.challenge({factorId:verified[0].id}); challengeRef.current=ch?.id; setStage('challenge'); return; }
    for(const f of (factors?.all||[]).filter(f=>f.status!=='verified')){ try{ await sb.auth.mfa.unenroll({factorId:f.id}); }catch(e){} }
    const { data:en, error } = await sb.auth.mfa.enroll({ factorType:'totp', friendlyName:'LMR Admin '+Date.now() });
    if(error){ setStage('denied'); return; }
    factorRef.current=en.id; setEnroll(en); setStage('enroll');
  },[]);

  useEffect(()=>{ gate(); },[gate]);

  const verify=useCallback(async(code)=>{
    try{
      if(!challengeRef.current){ const {data:ch,error:ce}=await sb.auth.mfa.challenge({factorId:factorRef.current}); if(ce) return ce.message; challengeRef.current=ch.id; }
      const { error } = await sb.auth.mfa.verify({ factorId:factorRef.current, challengeId:challengeRef.current, code });
      challengeRef.current=null;
      if(error) return error.message;
      setStage('hub'); return null;
    }catch(e){ return e.message||String(e); }
  },[]);

  if(stage==='boot') return <Frame><div className="center"><div className="sub">Loading…</div></div></Frame>;
  if(stage==='login') return <Frame><Login onDone={()=>{ setStage('boot'); gate(); }} /></Frame>;
  if(stage==='enroll') return <Frame><TwoFA mode="enroll" enroll={enroll} onVerify={verify} onSignOut={signOut} /></Frame>;
  if(stage==='challenge') return <Frame><TwoFA mode="challenge" onVerify={verify} onSignOut={signOut} /></Frame>;
  if(stage==='denied') return <Frame><Denied email={email} onSignOut={signOut} /></Frame>;
  if(stage==='portal') return <Frame><Portal email={email} onBack={()=>setStage('hub')} onSignOut={signOut} /></Frame>;
  return <Frame><Hub email={email} onPortal={()=>setStage('portal')} onSignOut={signOut} /></Frame>;
}

const styleEl=document.createElement('style'); styleEl.textContent=CSS; document.head.appendChild(styleEl);
const bootEl=document.getElementById('boot'); if(bootEl) bootEl.remove();
createRoot(document.getElementById('root')).render(<App />);
