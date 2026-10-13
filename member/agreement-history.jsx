import React,{useEffect,useState} from 'react';
import {sb} from './api';
import {preview} from './config';
import {Modal} from './ui';
export default function AgreementHistory({userId,email,onClose}) {
 const [rows,setRows]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(preview){setRows([]);return;}sb.rpc('circle_admin_agreements',{p_user_id:userId}).then(({data,error})=>{if(active){if(error)setError(error.message);else setRows(data || []);}});return()=>{active=false;};},[userId]);
 return <Modal title={`Agreements · ${email || 'Member'}`} onClose={onClose}>
  {error?<p role="alert">{error}</p>:rows===null?<p role="status">Loading agreement history…</p>:!rows.length?<p>No acceptance is recorded for this member. Legacy membership is not proof of acceptance.</p>:rows.map(row=><section className="agreement-history" key={row.id}><h3>{row.scope==='membership'?'Membership agreement':'Account agreement'}</h3><p>{new Date(row.accepted_at).toLocaleString()} · {row.legal_version}</p>{row.plan&&<p>{row.plan} · {new Intl.NumberFormat('en-US',{style:'currency',currency:row.currency}).format(row.amount/100)} · every {row.interval_count} {row.billing_interval}</p>}<p>Record: {row.id}</p><details><summary>Accepted documents and acknowledgements</summary><pre>{JSON.stringify({content_hash:row.content_hash,acknowledgement:row.acknowledgement,checkout_receipts:row.checkout_receipts,documents:row.documents},null,2)}</pre></details></section>)}
 </Modal>;
}
