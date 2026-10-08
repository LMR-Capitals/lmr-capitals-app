import React from 'react';
import JournalContent from './journal-content';
import {achievementDisplay, journalTitle, journalCaption, observationMeta} from './journal-media.mjs';

export function AchievementDetails({record, caption = true}) {
  const {category, firm, date, payout} = achievementDisplay(record);
  return <div className="achievement-details">
    <span className="record-category">{category}</span>
    <h3>{journalTitle(record) || category}</h3>
    {[firm, date].filter(Boolean).length > 0 && <p>{[firm, date].filter(Boolean).join(' · ')}</p>}
    {payout && <strong className="record-amount">{payout}</strong>}
    {caption && journalCaption(record) && <p className="achievement-caption">{journalCaption(record)}</p>}
  </div>;
}

export function ObservationRecord({record, onChart}) {
  const details = record.source_details || record;
  const content = record.source_content ?? record.content;
  const meta = observationMeta(content);
  const stamps = [['Journal created',details.created_at],['Updated',details.updated_at]];
  const date = value => {const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});};
  return <div className="observation-record">
    <div className="observation-details">
      {[meta.market,meta.timeframe,details.session_tag].filter(value => typeof value === 'string' && value).map((value,index) => <span className="tag" key={index}>{value}</span>)}
      {stamps.filter(([,value]) => value && date(value)).map(([label,value]) => <small key={label}>{label}: <time dateTime={value}>{date(value)}</time></small>)}
    </div>
    <JournalContent content={content} onChart={onChart} />
  </div>;
}
