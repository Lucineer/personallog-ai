interface Person { id:string; name:string; rel:string; birthday?:string; location:string; interests:string[]; notes:string[]; lastContact:number; freq:'daily'|'weekly'|'monthly'|'rarely'; tags:string[] }
interface Interaction { id:string; personId:string; date:number; type:'call'|'text'|'email'|'meet'|'social'; notes:string; mood:number; followUp?:string; followUpDate?:number }
const uid = () => crypto.randomUUID(); const dayMs = 86400000;
export class RelationshipTracker {
  private people = new Map<string, Person>();
  private interactions = new Map<string, Interaction[]>();
  addPerson(d: Partial<Person>): Person { const p: Person = { id:uid(), name:d.name||'', rel:d.rel||'friend', birthday:d.birthday, location:d.location||'', interests:d.interests||[], notes:d.notes||[], lastContact:Date.now(), freq:d.freq||'monthly', tags:d.tags||[] }; this.people.set(p.id, p); this.interactions.set(p.id, []); return p; }
  updatePerson(id: string, d: Partial<Person>): Person | undefined { const p = this.people.get(id); if (!p) return; Object.assign(p, d); return p; }
  removePerson(id: string): void { this.people.delete(id); this.interactions.delete(id); }
  searchPeople(q: string): Person[] { const l = q.toLowerCase(); return [...this.people.values()].filter(p => p.name.toLowerCase().includes(l) || p.rel.includes(l) || p.tags.some(t => t.includes(l))); }
  byRelationship(rel: string): Person[] { return [...this.people.values()].filter(p => p.rel === rel); }
  byTag(tag: string): Person[] { return [...this.people.values()].filter(p => p.tags.includes(tag)); }
  logInteraction(personId: string, type: Interaction['type'], notes: string, mood = 5): Interaction {
    const i: Interaction = { id:uid(), personId, date:Date.now(), type, notes, mood };
    const list = this.interactions.get(personId) || []; list.push(i); this.interactions.set(personId, list);
    const p = this.people.get(personId); if (p) p.lastContact = Date.now();
    return i;
  }
  getInteractions(personId: string, days = 30): Interaction[] { const cutoff = Date.now() - days * dayMs; return (this.interactions.get(personId) || []).filter(i => i.date >= cutoff).sort((a, b) => b.date - a.date); }
  setFollowUp(iid: string, note: string, date: number): void {
    for (const [, list] of this.interactions) { const i = list.find(x => x.id === iid); if (i) { i.followUp = note; i.followUpDate = date; return; } }
  }
  getPendingFollowUps(): Interaction[] { const now = Date.now(); const results: Interaction[] = []; for (const [, list] of this.interactions) for (const i of list) if (i.followUp && i.followUpDate && i.followUpDate <= now) results.push(i); return results; }
  getStaleContacts(days: number): Person[] { const cutoff = Date.now() - days * dayMs; return [...this.people.values()].filter(p => p.lastContact < cutoff); }
  contactFrequency(personId: string): number { const list = this.interactions.get(personId) || []; if (list.length < 2) return list.length; const span = (list[list.length - 1].date - list[0].date) / dayMs / 30; return span > 0 ? list.length / span : list.length; }
  relationshipScore(personId: string): number {
    const p = this.people.get(personId); if (!p) return 0;
    const daysSince = (Date.now() - p.lastContact) / dayMs;
    const recency = Math.max(0, 100 - daysSince);
    const freq = this.contactFrequency(personId) * 10;
    const list = this.interactions.get(personId) || [];
    const avgMood = list.length ? list.reduce((s, i) => s + i.mood, 0) / list.length * 10 : 50;
    return Math.min(100, Math.round(recency * 0.4 + Math.min(freq, 100) * 0.3 + avgMood * 0.3));
  }
  birthdayReminders(days: number): Person[] { const now = new Date(); const future = new Date(now.getTime() + days * dayMs); return [...this.people.values()].filter(p => { if (!p.birthday) return false; const b = new Date(p.birthday); const next = new Date(now.getFullYear(), b.getMonth(), b.getDate()); if (next < now) next.setFullYear(next.getFullYear() + 1); return next <= future; }); }
  interactionSummary(personId: string): string {
    const p = this.people.get(personId); if (!p) return ''; const list = this.interactions.get(personId) || [];
    const types: Record<string, number> = {}; for (const i of list) types[i.type] = (types[i.type] || 0) + 1;
    return `${p.name} (${p.rel}): ${list.length} interactions. ${Object.entries(types).map(([t, c]) => `${c} ${t}s`).join(', ')}. Last: ${new Date(p.lastContact).toLocaleDateString()}.`;
  }
  topRelationships(n = 5): Array<{person:Person; score:number}> { return [...this.people.values()].map(p => ({ person: p, score: this.relationshipScore(p.id) })).sort((a, b) => b.score - a.score).slice(0, n); }
  suggestReconnections(): string[] { return this.getStaleContacts(60).sort((a, b) => a.lastContact - b.lastContact).slice(0, 5).map(p => `${p.name} (last: ${Math.round((Date.now() - p.lastContact) / dayMs)}d ago)`); }
  getAll(): Person[] { return [...this.people.values()]; }
  serialize(): string { return JSON.stringify({ people: [...this.people.values()], interactions: [...this.interactions.entries()] }); }
  deserialize(data: string): void { const d = JSON.parse(data); this.people = new Map(d.people.map((p: Person) => [p.id, p])); this.interactions = new Map(d.interactions); }
}
