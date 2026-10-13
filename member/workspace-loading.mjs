import {journalImageUrl} from './journal-media.mjs';
// One storage request per distinct group of images, rather than per publication.
export async function enrichPublicationMedia(client, posts) {
 const paths = [...new Set(posts.map(p=>p.image_path).filter(Boolean))];
 let signed = new Map();
 if(paths.length) {
  const {data,error} = await client.storage.from('circle-media').createSignedUrls(paths,300);
  if(!error) signed = new Map((data || []).map(item=>[item.path,item.signedUrl]));
 }
 return posts.map(p=>p.image_path ? {...p,image_url:signed.get(p.image_path) || null,media_error:!signed.get(p.image_path)} : {...p,image_url:journalImageUrl(p.source_image)});
}
export async function loadAdministratorCore(account, desk) {
 const [profile,workspace] = await Promise.all([account(),desk()]);
 return {...profile,...workspace};
}
export function workspaceExtras(route, access) {
 return {trades:route==='executions' && access?.entitled===true,
 journal:access?.adminVerified===true && ['studio-observations','studio-achievements'].includes(route)};
}
