import React, {useState} from 'react';
import {Button, Empty, formatDate} from './ui';
import {questionQueue} from './studio-model.mjs';
export default function QuestionQueue({questions, onAnswer, busy}) {
  const [history, setHistory] = useState(false), [selected, setSelected] = useState(null);
  const waiting = questionQueue(questions);
  const items = history ? questions.filter(q => q.answer || q.status === 'answered').sort((a,b) => new Date(b.created_at)-new Date(a.created_at)) : waiting;
  const current = items.find(q => q.id === selected) || items[0];
  return <>
    <div className="tabs"><button className={!history?'selected':''} onClick={() => {setHistory(false);setSelected(null);}}>Waiting ({waiting.length})</button><button className={history?'selected':''} onClick={() => {setHistory(true);setSelected(null);}}>Answered</button></div>
    <p className="content-note">Questions from free and paid members. Oldest first; replies go privately to the member and their notifications.</p>
    {!current ? <Empty icon="questions" title={history?'No answered questions yet.':'The queue is clear.'} body="Member questions will arrive here for review." /> : <div className="question-queue">
      <nav className="queue-list" aria-label="Questions in queue">{items.map((q,i) => <button key={q.id} className={q.id===current.id?'selected':''} onClick={() => setSelected(q.id)}><span>{history?formatDate(q.created_at):`Queue ${i+1}`}</span><strong>{q.title}</strong></button>)}</nav>
      <article className="panel form-panel"><span className="tag">{history?'Answered':'Next in the queue'}</span><h2 className="spaced">{current.title}</h2><p className="question-body">{current.body}</p><small className="content-note">Submitted {formatDate(current.created_at)} · Member reference: {current.user_id}</small>
        <form key={current.id} className="form-stack spaced" onSubmit={event => onAnswer(event,current.id)}><label>Your private reply<textarea name="answer" required maxLength="5000" defaultValue={current.answer||''} /></label><Button gold type="submit" disabled={busy}>{busy?'Sending…':history?'Update private answer':'Answer & move to next'}</Button></form>
      </article>
    </div>}
  </>;
}
