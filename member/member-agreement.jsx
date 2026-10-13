import React,{useEffect,useState} from 'react';
import {sb,checked} from './api';
import {config,preview,accountRegistrationReady} from './config';
import {Button,Logo} from './ui';
export default function MemberAgreement({userId,administrator,route,onSignout,children}) {
 const [state,setState]=useState('loading'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;if(preview||administrator||!accountRegistrationReady){setState('accepted');return;}
  setState('loading');setError('');sb.from('circle_agreement_acceptances').select('id').eq('user_id',userId).eq('legal_version',config.legalVersion).eq('scope','account').limit(1).then(({data,error})=>{if(active){if(error){setError('Could not load your agreement record. Please try again.');setState('error');}else setState(data?.length?'accepted':'required');}});return()=>{active=false;};
 },[userId,administrator,retry]);
 if(state==='accepted'||route==='billing')return children;
 return <main className="member-agreement"><Logo/><section className="panel form-panel"><h1>Before you continue</h1><p>Review the account terms, privacy notice and trading risks. Your acceptance is saved with this document version.</p>
  {state==='loading'?<p role="status">Checking your agreement record…</p>:state==='error'?<Button onClick={()=>setRetry(n=>n+1)}>Try again</Button>:<form className="form-stack" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await checked(sb.rpc('circle_accept_agreement',{p_version:config.legalVersion,p_acknowledgement:{terms:true,privacy:true,risk:true,adult:true},p_plan:null}));setState('accepted');}catch{setError('Could not save acceptance. Please try again.');}finally{setBusy(false);}}}>
   <label className="check-label"><input type="checkbox" required disabled={busy}/><span>I am at least 18 and agree to the <a href="/inner-circle/guide#terms" target="_blank" rel="noreferrer">account and membership terms</a>.</span></label>
   <label className="check-label"><input type="checkbox" required disabled={busy}/><span>I have read the <a href="/inner-circle/guide#privacy" target="_blank" rel="noreferrer">privacy notice</a> and understand how my account and acceptance records are used.</span></label>
   <label className="check-label"><input type="checkbox" required disabled={busy}/><span>I acknowledge the <a href="/inner-circle/guide#risk" target="_blank" rel="noreferrer">trading risks</a>. LMR provides general education, not personalised financial advice or guaranteed results.</span></label>
   <p className="form-help">Accepting these account terms does not start a paid subscription.</p><Button gold type="submit" disabled={busy}>{busy?'Saving…':'Accept and continue'}</Button>
  </form>}
  {error&&<p className="error" role="alert">{error}</p>}<div className="agreement-exit"><a href="/inner-circle#billing">Manage or cancel existing billing</a><Button small onClick={onSignout}>Sign out</Button></div>
 </section></main>;
}
