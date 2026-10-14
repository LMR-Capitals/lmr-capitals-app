export function validateCalloutImage(file) {
 if(!file?.size)throw new Error('Add a callout image before publishing.');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Use a PNG, JPEG or WebP image under 10 MB.');
 return file;
}
export function calloutPayload(form) {
 const title=String(form.get('title') || '').trim();
 if(!title || title.length>160)throw new Error('Add a post title, up to 160 characters.');
 const body=String(form.get('body') || '').trim();
 const conditions=String(form.get('conditions') || '').trim(), invalidation=String(form.get('invalidation') || '').trim();
 return {title,body:[body,conditions&&`Conditions\n${conditions}`,invalidation&&`Invalidation\n${invalidation}`].filter(Boolean).join('\n\n'),status:'published',image_caption:'',pinned:false};
}
export function newestCallouts(posts=[]) {
 return posts.filter(post=>post.kind==='callout').sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0)||String(b.id).localeCompare(String(a.id)));
}
