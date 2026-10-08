export const studioSections = [
  { route: 'studio-live', label: 'Live sessions', icon: 'live', tab: 'session', description: 'Asia, London, NY AM and NY PM. Publish the room and notify paid members.' },
  { route: 'studio-observations', label: 'LMR observations', icon: 'observations', tab: 'post', kind: 'observation', description: 'Create once in your Journal and Inner Circle, or publish a saved observation.' },
  { route: 'studio-callouts', label: 'LMR Callouts', icon: 'callouts', tab: 'post', kind: 'callout', description: 'Publish the idea, its conditions and invalidation to paid members.' },
  { route: 'studio-trades', label: 'LMR Trade', icon: 'executions', tab: 'post', kind: 'execution', description: 'One entry chart, with selected details pulled from your Journal.' },
  { route: 'studio-achievements', label: 'LMR achievements', icon: 'achievements', tab: 'post', kind: 'achievement', description: 'Publish the original achievement image and caption from your Journal.' },
  { route: 'studio-mentorship', label: 'Private mentorship', icon: 'mentorship', tab: 'mentorship', description: 'Review paid-member applications and arrange a private session.' },
  { route: 'studio-questions', label: 'Q&A queue', icon: 'questions', tab: 'questions', description: 'Free and paid members. Review each question and send a private reply.' },
  { route: 'studio-announcements', label: 'Send announcement', icon: 'notifications', tab: 'announcement', description: 'Send an update directly to member notifications.' },
  { route: 'studio-resources', label: 'Free resources', icon: 'resources', tab: 'post', kind: 'terminology', description: 'Share a resource with every signed-in account.' },
];
export const studioSection = route => studioSections.find(section => section.route === route);
export function questionQueue(questions) {
  return questions.filter(q => q.status === 'open' && !q.answer)
    .sort((a,b) => new Date(a.created_at) - new Date(b.created_at) || a.id.localeCompare(b.id));
}
