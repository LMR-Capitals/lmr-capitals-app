/* Saved/imported editor HTML is content, never executable application markup. */
function lmrEscapeText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function lmrSanitizeRichHtml(value) {
  if (!window.DOMPurify) return lmrEscapeText(value);
  return window.DOMPurify.sanitize(String(value || ''), {
    USE_PROFILES: {html:true},
    FORBID_TAGS: ['form','input','button','textarea','select','iframe','object','embed','style','link','meta'],
    FORBID_ATTR: ['srcdoc'],
    ALLOW_DATA_ATTR: true
  });
}
