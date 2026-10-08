import assert from 'node:assert/strict';
import {questionQueue,studioSections} from '../studio-model.mjs';
import {avatarSource,providerPhoto} from '../profile-photo.mjs';
import {journalPublication,achievementDisplay,journalCaption,journalTitle,observationMeta} from '../journal-media.mjs';
import {administratorEntry} from '../workspace-access.mjs';
const q = [
 {id:'answered',status:'answered',answer:'Reply',created_at:'2026-10-01'},
 {id:'second',status:'open',created_at:'2026-10-03'},
 {id:'first',status:'open',created_at:'2026-10-02'},
];
assert.deepEqual(questionQueue(q).map(item=>item.id),['first','second']);
assert.equal(q[0].id,'answered'); // ordering leaves the workspace array intact
for(const section of studioSections) assert.equal(administratorEntry({admin:true,adminVerified:true},section.route),null);
const google = {user_metadata:{picture:'https://lh3.googleusercontent.com/photo'}};
assert.equal(providerPhoto(google),'https://lh3.googleusercontent.com/photo');
assert.equal(avatarSource({},google),providerPhoto(google));
assert.equal(avatarSource({avatar_mode:'initials'},google),null);
assert.equal(avatarSource({avatar_mode:'custom',avatar_url:'https://example.com/private-signed-photo'},google),'https://example.com/private-signed-photo');
assert.equal(providerPhoto({user_metadata:{picture:'javascript:alert(1)'}}),null);
assert.equal(providerPhoto({user_metadata:{picture:'https://user:pass@example.com/photo'}}),null);
const post = journalPublication({kind:'trade',id:'t1',title:'Entry',body:'Market: NQ',image:'/term/lmrkb-0.png',img_exit:'https://example.com/exit',pnl:100,account_id:'private'},'admin');
assert.equal(post.kind,'execution');
assert.equal(post.source_kind,'trade');
assert.equal(post.source_image,'/term/lmrkb-0.png');
assert.ok(!('img_exit' in post));
assert.ok(!('pnl' in post));
assert.ok(!('account_id' in post));
console.log('Studio queue, routes, provider/custom avatars and single-entry publications passed.');

const achievement = journalPublication({kind:'achievement',id:'a1',title:'Original',caption:'Full caption',category:'Payout',firm:'Original firm',amount:1234.56,achieved_on:'2026-10-06',image:'/term/lmrkb-0.png',user_id:'private',is_public:false},'admin');
assert.deepEqual(achievementDisplay(achievement),{category:'Payout',firm:'Original firm',date:'Oct 6, 2026',payout:'$1,234.56'});
assert.equal(journalCaption(achievement),'Full caption');
assert.equal(journalTitle({...achievement,title:'Short',source_details:{title:'Full original title'}}),'Full original title');
assert.ok(!('user_id' in achievement.source_details));
assert.ok(!('is_public' in achievement.source_details));
assert.deepEqual(observationMeta('<!--obsmeta {"m":"NQ","tf":"5m"}--><p>Full notes</p>'),{market:'NQ',timeframe:'5m'});
assert.deepEqual(observationMeta('<!--obsmeta {invalid}-->'),{});
assert.deepEqual(observationMeta('<!--obsmeta {"m":{},"tf":[]}-->'),{market:'',timeframe:''});
console.log('Full Journal display metadata, original title/caption, landing payout/date formatting and safe observation metadata passed.');
