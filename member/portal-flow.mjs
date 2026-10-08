export const circleUrl = "/inner-circle";
export function journalDestination(access) {
  if (!access) return `${circleUrl}#application`;
  if (access.admin && !access.adminVerified) return "/admin?next=journal";
  if (canOpenJournal(access)) return `${circleUrl}#application`;
  return `${circleUrl}?next=journal#billing`;
}
// A navigation preference only; the journal independently checks registry/MFA.
export function openJournal(access) {
  if (access?.adminVerified) {
    try { sessionStorage.setItem("lmr_admin_surface", "app"); } catch {}
  }
  const destination = journalDestination(access);
  if (destination === `${circleUrl}#application` && [circleUrl, "/member/index.html"].includes(location.pathname)) location.hash = "application";
  else location.assign(destination);
}
export function adminReturnDestination(next) {
  return {
    journal: `${circleUrl}#application`,
    circle: `${circleUrl}#admin`,
    terminal: `${circleUrl}#admin`,
  }[next] || `${circleUrl}#admin`;
}

export function canOpenJournal(access) {
  if (!access) return false;
  return access.admin === true ? access.adminVerified === true : access.paid === true && access.entitled === true;
}

export function journalWorkspaceMessage(event, frameWindow, origin) {
  if (!frameWindow || event.source !== frameWindow || event.origin !== origin) return null;
  return ["circle", "membership", "verify"].includes(event.data?.action) && event.data?.type === "lmr-workspace-navigation" ? event.data.action : null;
}
