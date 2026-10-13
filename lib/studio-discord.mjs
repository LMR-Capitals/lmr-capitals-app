export const discordCategories=['callouts','sessions','announcements'];
export function webhookUrl(value) {
 let url;try{url=new URL(value);}catch{throw new Error('Use a valid Discord webhook URL.');}
 if(url.protocol!=='https:'||!['discord.com','discordapp.com'].includes(url.hostname)||url.port||url.username||url.password||url.hash||!/^\/api(?:\/v\d+)?\/webhooks\/\d{10,25}\/[A-Za-z0-9_-]{20,}$/.test(url.pathname))throw new Error('Use a valid Discord webhook URL.');
 if([...url.searchParams.keys()].some(key=>key!=='thread_id')||(url.searchParams.has('thread_id')&&!/^\d{10,25}$/.test(url.searchParams.get('thread_id'))))throw new Error('Use a valid Discord webhook URL.');
 return url.href;
}
export function discordMessage(category,record) {
 const route={callouts:'callouts',sessions:'live',announcements:'notifications'}[category];
 if(!route)throw new Error('Invalid section.');
 const embed={title:String(record.title || 'LMR Capitals').slice(0,256),url:`https://lmrcapitals.com/inner-circle#${route}`,color:15776857,description:String(category==='sessions'?record.description || 'Open the LMR live room for details.':record.body || '').slice(0,3500),footer:{text:`LMR Capitals · ${{callouts:'Callout',sessions:'Live session',announcements:'Announcement'}[category]}`}};
 if(category==='sessions')embed.fields=[{name:'Session',value:String(record.session_block || '').slice(0,100)||'Live analysis',inline:true},{name:'Status',value:String(record.status||'scheduled'),inline:true},{name:'Starts',value:record.starts_at?`<t:${Math.floor(new Date(record.starts_at).getTime()/1000)}:F>`:'See live room'}];
 return {username:'LMR Capitals',allowed_mentions:{parse:[]},embeds:[embed]};
}
