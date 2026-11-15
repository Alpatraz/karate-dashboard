// KARATÉ LIFE — modèle de données local-first et adaptation de l'ancien dashboard.
export const WORLD_START = "2027-10-23";
export const WORLD_END = "2027-10-29";
export const CATEGORIES = ["Kata", "Bo / armes", "Combat", "Physique", "Mobilité", "Cardio", "Cours", "Récupération", "Autre"];
export const LEVELS = ["À découvrir", "En apprentissage", "À consolider", "Maîtrisé", "Prêt compétition"];
export const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(36).slice(2));
export function isoDate(date = new Date()) {
  const d = new Date(date);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}
export function parseLocal(iso) {
  if (!iso) return null;
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some(x => !Number.isFinite(x))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 12);
}
export function dayDiff(from, until) {
  const a = parseLocal(from), b = parseLocal(until);
  return a && b ? Math.round((b - a) / 86400000) : null;
}
export function shortDate(iso) {
  const d = parseLocal(iso);
  return d ? d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }) : "Date à préciser";
}
export function longDate(iso) {
  const d = parseLocal(iso);
  return d ? d.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date à préciser";
}
export function weekStart(iso = isoDate()) {
  const d = parseLocal(iso) || new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return isoDate(d);
}
export function pastDays(n) {
  const now = parseLocal(isoDate());
  return Array.from({ length: n }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (n - i - 1)); return isoDate(d); });
}
export function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
export function writeJSON(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
  catch (e) { console.error("Sauvegarde impossible", key, e); return false; }
}
export const DEFAULT_PROFILES = [
  { id: "profile-1", nom: "Guillaume", type: "Adulte", actif: true, options: { armes: true, combat: true } },
  { id: "kl-anna", nom: "Anna", type: "Enfant", actif: false },
  { id: "kl-alexandre", nom: "Alexandre", type: "Enfant", actif: false },
  { id: "kl-antoine", nom: "Antoine", type: "Enfant", actif: false }
];
export function loadProfiles() {
  const saved = readJSON("karate_profiles", []);
  return Array.isArray(saved) && saved.length ? saved : DEFAULT_PROFILES;
}
export function defaultData(profile) {
  const owner = /^guillaume/i.test(profile?.nom || "");
  return {
    sessions: [], checkins: [], techniques: [], injuries: [], goals: [], competitions: owner ? [{
      id: "kl-worlds-2027", name: "WKC — Championnats du monde 2027", date: WORLD_START, endDate: WORLD_END,
      location: "Orlando, Floride", category: "Kata / armes traditionnelles", status: "Objectif",
      result: "", notes: "Dates confirmées par la WKC. Qualification à préparer."
    }] : [],
    settings: { weeklyTarget: 4, weeklyMinutes: 240 }
  };
}
export function loadData(profile) {
  const base = defaultData(profile);
  const stored = readJSON("karate_life_v1_" + profile.id, {});
  return {
    ...base, ...stored,
    sessions: Array.isArray(stored.sessions) ? stored.sessions : [],
    checkins: Array.isArray(stored.checkins) ? stored.checkins : [],
    techniques: Array.isArray(stored.techniques) ? stored.techniques : [],
    competitions: Array.isArray(stored.competitions) ? stored.competitions : base.competitions,
    injuries: Array.isArray(stored.injuries) ? stored.injuries : [],
    goals: Array.isArray(stored.goals) ? stored.goals : [],
    settings: { ...base.settings, ...(stored.settings || {}) }
  };
}
export function legacyTraining(profileId) {
  const items = readJSON("karate_events_" + profileId, []);
  if (!Array.isArray(items)) return [];
  return items.filter(e => ["fait", "terminé", "termine", "done"].includes(String(e.status || "").toLowerCase())).map((e, i) => {
    const title = e.title || e.nom || "Séance de karaté";
    const t = (title + " " + (e.type || "")).toLowerCase();
    const category = t.includes("bo") || t.includes("arme") ? "Bo / armes" :
      t.includes("kata") ? "Kata" : t.includes("combat") ? "Combat" :
      t.includes("mobilit") ? "Mobilité" : t.includes("cardio") ? "Cardio" :
      t.includes("maison") || t.includes("muscul") ? "Physique" : "Cours";
    let duration = Number(e.duration || e.duree || 0);
    if (!duration && e.time) {
      const matches = String(e.time).match(/(\d{1,2})h(\d{0,2})\s*[-–]\s*(\d{1,2})h(\d{0,2})/i);
      if (matches) duration = (Number(matches[3]) * 60 + Number(matches[4] || 0)) - (Number(matches[1]) * 60 + Number(matches[2] || 0));
    }
    return { id: e.id || "legacy-" + i + "-" + e.date, date: e.date, title, category,
      duration: duration > 0 && duration <= 600 ? duration : null, rpe: Number(e.rpe || 0) || null,
      notes: e.notes || "", source: "ancien", legacy: true };
  });
}
export function allSessions(profileId, data) {
  const map = new Map();
  legacyTraining(profileId).forEach(s => map.set(s.id, s));
  data.sessions.forEach(s => map.set(s.id, s));
  return Array.from(map.values()).filter(s => s.date).sort((a, b) => b.date.localeCompare(a.date));
}
export function oldCompetitions(profileId) {
  const rows = readJSON("karate_competitions_" + profileId, []);
  return Array.isArray(rows) ? rows : [];
}
export function medalCount(profileId, data) {
  let total = 0;
  for (const c of oldCompetitions(profileId)) for (const x of (c.categories || [])) {
    if (["🥇", "🥈", "🥉", "1", "2", "3"].includes(String(x.resultat || x.classement || ""))) total++;
  }
  for (const c of data.competitions) if (/médaille|or|argent|bronze|podium|1er|2e|3e/i.test(c.result || "")) total++;
  return total;
}
export function readiness(check) {
  if (!check) return null;
  const energy = Number(check.energy), sleep = Number(check.sleep), stress = Number(check.stress), pain = Number(check.pain);
  if (!energy || !Number.isFinite(sleep) || !Number.isFinite(stress) || !Number.isFinite(pain)) return null;
  return Math.max(0, Math.min(100, Math.round(
    (energy / 10) * 35 + Math.min(sleep / 8, 1) * 25 + ((10 - pain) / 10) * 20 + ((10 - stress) / 10) * 20
  )));
}
export function hoursLabel(minutes) {
  if (!minutes) return "0 h";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return (h ? h + " h" : "") + (m ? " " + m + " min" : "");
}
export function trainingChart(sessions) {
  return pastDays(7).map(date => ({
    date, day: parseLocal(date).toLocaleDateString("fr-CA", { weekday: "short" }).slice(0, 2),
    minutes: sessions.filter(s => s.date === date).reduce((n, s) => n + (Number(s.duration) || 0), 0)
  }));
}
export function recommendations(sessions, checkins, target) {
  const now = isoDate(), week = weekStart();
  const weekSessions = sessions.filter(s => s.date >= week && s.date <= now);
  const count = weekSessions.length;
  const latest = [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  const tasks = [];
  if (!latest || latest.date !== now) tasks.push({ title: "Faire le bilan forme du jour", detail: "Sommeil, énergie, fatigue et douleurs", kind: "checkin" });
  if (count < target) tasks.push({ title: "Compléter le volume de la semaine", detail: count + " séance(s) sur " + target + " prévues", kind: "session" });
  if (!weekSessions.some(s => /bo|arme/i.test(s.category || ""))) tasks.push({ title: "Travailler les armes", detail: "Technique, contrôle et passages complets", kind: "session" });
  if (!weekSessions.some(s => /kata/i.test(s.category || ""))) tasks.push({ title: "Répéter un kata complet", detail: "Précision, rythme et stabilité", kind: "session" });
  if (latest && (Number(latest.pain) >= 5 || Number(latest.energy) <= 3)) tasks.unshift({ title: "Adapter la charge aujourd'hui", detail: "Privilégier récupération et avis professionnel si besoin", kind: "checkin" });
  if (!tasks.length) tasks.push({ title: "Semaine bien engagée", detail: "Relire les notes et planifier la prochaine séance", kind: "session" });
  return tasks.slice(0, 5);
}
