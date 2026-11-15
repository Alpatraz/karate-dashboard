import React, { useEffect, useMemo, useState, Suspense } from "react";
import {
  LayoutDashboard, CalendarDays, BookOpen, Trophy, Brain, HeartPulse, Users,
  ChartNoAxesCombined, Target, Menu, X, Plus, ChevronRight, ChevronDown,
  Activity, Dumbbell, Swords, Play, Weight, BedDouble, Zap, Award, Clock3,
  CheckCircle2, Circle, CalendarCheck2, ArrowUpRight, TrendingUp, Pencil,
  Trash2, Download, Upload, Settings, ShieldCheck, AlertTriangle, Sparkles,
  ListChecks, Video, Flame, RefreshCw, ClipboardList, LockKeyhole, SlidersHorizontal,
  CalendarClock, Medal, Moon, Heart, Star, MoreHorizontal, ArrowRight, Info
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  LineChart, Line, Tooltip } from "recharts";
import Editor from "./karatelife/Editor.jsx";
import {
  WORLD_START, WORLD_END, CATEGORIES, uid, isoDate, parseLocal, dayDiff, shortDate,
  longDate, weekStart, pastDays, readJSON, writeJSON, loadProfiles,
  loadData, allSessions, oldCompetitions, medalCount, readiness,
  hoursLabel, trainingChart, recommendations
} from "./karatelife/core.js";
import "./KarateLife.css";

const ClassicDashboard = React.lazy(() => import("./App.jsx"));
const MAIN_MENU = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "training", label: "Entraînements", icon: CalendarDays },
  { id: "technique", label: "Technique & vidéos", icon: BookOpen },
  { id: "competition", label: "Compétitions", icon: Trophy },
  { id: "wellness", label: "Physique & mental", icon: Brain },
  { id: "health", label: "Santé & récupération", icon: HeartPulse },
  { id: "family", label: "Famille", icon: Users },
  { id: "analytics", label: "Statistiques", icon: ChartNoAxesCombined },
  { id: "goals", label: "Objectifs", icon: Target },
];
const OTHER_MENU = [
  { id: "settings", label: "Réglages & sauvegarde", icon: Settings },
  { id: "legacy", label: "Ancien dashboard", icon: RefreshCw },
];
const ALL_MENU = [...MAIN_MENU, ...OTHER_MENU];
const cls = (...items) => items.filter(Boolean).join(" ");
function percent(n) { return Math.max(0, Math.min(100, Math.round(n))); }
function PageHeading({ eyebrow, title, sub, action, children }) {
  return <div className="kl-page-heading">
    <div><div className="kl-eyebrow">{eyebrow || "MON ESPACE ATHLÈTE"}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
    {action && <div className="kl-page-action">{action}</div>}{children}
  </div>;
}
function Panel({ icon: Icon, title, action, children, className = "" }) {
  return <section className={cls("kl-panel", className)}>
    <div className="kl-panel-head"><h2>{Icon && <Icon size={19} />} {title}</h2>{action}</div>
    <div className="kl-panel-body">{children}</div>
  </section>;
}
function TextLink({ children, onClick }) { return <button type="button" className="kl-text-link" onClick={onClick}>{children}<ChevronRight size={15}/></button>; }
function Primary({ children, onClick, icon: Icon = Plus, kind = "gold" }) {
  return <button type="button" className={cls("kl-btn", kind === "gold" ? "kl-btn-gold" : "kl-btn-outline")} onClick={onClick}>{Icon && <Icon size={17}/>} {children}</button>;
}
function Placeholder({ icon: Icon = ClipboardList, title, text, action }) {
  return <div className="kl-empty"><Icon size={27}/><strong>{title}</strong><span>{text}</span>{action}</div>;
}
function Ring({ value, text, suffix = "%" }) {
  const v = value == null ? 0 : percent(value);
  return <div className="kl-ring" style={{ "--progress": v + "%" }}>
    <div><strong>{value == null ? "—" : v + suffix}</strong>{text && <span>{text}</span>}</div>
  </div>;
}
function Kpi({ icon: Icon, label, value, foot, progress }) {
  return <div className="kl-kpi"><div className="kl-kpi-heading"><Icon size={18}/><span>{label}</span></div>
    <div className="kl-kpi-value">{value}</div><div className="kl-kpi-foot">{foot || "Données à compléter"}</div>
    {progress != null && <div className="kl-progress"><i style={{ width: percent(progress) + "%" }}/></div>}
  </div>;
}
function MiniChart({ data, valueKey, type = "bar", color = "#b48a2d" }) {
  if (!data?.length || !data.some(r => Number(r[valueKey]) > 0)) return <div className="kl-chart-empty">Ajoute des données pour afficher ton évolution.</div>;
  const axis = { tickLine: false, axisLine: false, tick: { fill: "#85858b", fontSize: 11 } };
  return <div className="kl-chart" role="img" aria-label="Graphique de progression">
    <ResponsiveContainer width="100%" height="100%">
      {type === "bar" ?
        <BarChart data={data} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eae6dd" />
          <XAxis dataKey="day" {...axis}/><YAxis {...axis}/><Tooltip formatter={v => [v + " min", "Entraînement"]}/>
          <Bar dataKey={valueKey} fill={color} radius={[5,5,0,0]} maxBarSize={34}/>
        </BarChart> :
        <LineChart data={data} margin={{ top: 12, right: 14, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eae6dd"/>
          <XAxis dataKey="day" {...axis}/><YAxis domain={["auto", "auto"]} {...axis}/>
          <Tooltip/><Line type="monotone" dataKey={valueKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
        </LineChart>
      }
    </ResponsiveContainer>
  </div>;
}
function SessionRow({ item, onEdit }) {
  const CatIcon = /bo|arme/i.test(item.category) ? Swords : /physique|cardio|mobilité/i.test(item.category) ? Dumbbell : /kata|cours/i.test(item.category) ? Activity : CalendarDays;
  return <button className="kl-entry" type="button" onClick={onEdit}>
    <span className="kl-entry-icon"><CatIcon size={19}/></span>
    <span className="kl-entry-content"><strong>{item.title || item.category}</strong><small>{shortDate(item.date)} · {item.category}{item.legacy ? " · ancien suivi" : ""}</small></span>
    <span className="kl-entry-side">{item.duration ? hoursLabel(Number(item.duration)) : "Durée —"}</span><ChevronRight size={16}/>
  </button>;
}
function Dot({ good = true }) { return good ? <CheckCircle2 size={17} className="kl-green"/> : <Circle size={17} className="kl-muted"/>; }
function formAction(open, type, label = "Ajouter") { return <Primary onClick={() => open(type)}>{label}</Primary>; }
function Overview({ ctx }) {
  const { profile, sessions, data, stats, checkins, nextComp, navigate, open, edit, profiles, medals, suggestions } = ctx;
  const weights = [...checkins].filter(c => c.weight !== "" && c.weight != null).sort((a,b) => b.date.localeCompare(a.date));
  const energy = checkins.length ? Number(checkins[0].energy) : null;
  const recentSleep = checkins.filter(c => c.date >= pastDays(7)[0]);
  const sleepAvg = recentSleep.length ? recentSleep.reduce((n,c) => n + Number(c.sleep || 0),0) / recentSleep.length : null;
  const latestReadiness = readiness(checkins[0]);
  const chartData = trainingChart(sessions);
  const countdown = nextComp ? dayDiff(isoDate(), nextComp.date) : null;
  const hasGoals = !!data.goals.length;
  return <>
    <PageHeading eyebrow="TA SAISON · 2026—2027" title={"Bonjour " + (profile?.nom || "athlète") + " 👊"} sub="Ton entraînement, ta progression et tes objectifs au même endroit."
      action={formAction(open, "session", "Nouvelle séance")}/>
    <div className="kl-hero">
      <div className="kl-hero-glow"/>
      <div className="kl-hero-copy"><span className="kl-hero-label"><Trophy size={17}/> OBJECTIF PRINCIPAL</span>
        <h2>ROAD TO <em>WKC 2027</em></h2><p>Orlando, Floride · 23 au 29 octobre 2027</p>
        <button type="button" onClick={() => navigate("competition")} className="kl-hero-link">Voir ma préparation <ArrowRight size={16}/></button>
      </div>
      <div className="kl-hero-count"><small>DÉBUT DES MONDIAUX</small><strong>{Math.max(0, dayDiff(isoDate(), WORLD_START))}<span> jours</span></strong><span>23 OCT. 2027</span></div>
      <div className="kl-hero-mark" aria-hidden="true">空手</div>
    </div>
    <div className="kl-kpis">
      <Kpi icon={CalendarCheck2} label="Séances cette semaine" value={stats.weekCount + " / " + stats.target} foot={stats.weekCount >= stats.target ? "Objectif atteint" : (stats.target - stats.weekCount) + " à réaliser"} progress={stats.target ? (stats.weekCount / stats.target) * 100 : 0}/>
      <Kpi icon={Weight} label="Dernier poids" value={weights[0] ? Number(weights[0].weight).toLocaleString("fr-CA") + " kg" : "—"} foot={weights[0] ? shortDate(weights[0].date) : "À renseigner dans le bilan forme"}/>
      <Kpi icon={BedDouble} label="Sommeil moyen (7 j)" value={sleepAvg != null ? sleepAvg.toLocaleString("fr-CA", { maximumFractionDigits: 1 }) + " h" : "—"} foot={sleepAvg != null ? recentSleep.length + " nuits suivies" : "Aucun bilan récent"}/>
      <Kpi icon={Zap} label="Énergie ressentie" value={energy ? energy + " / 10" : "—"} foot={checkins[0] ? shortDate(checkins[0].date) : "Bilan forme non saisi"} progress={energy ? energy * 10 : null}/>
      <Kpi icon={Award} label="Podiums enregistrés" value={String(medals)} foot="Compétitions et résultats"/>
    </div>
    <div className="kl-dash-grid">
      <Panel icon={CalendarDays} title="Dernières séances" className="kl-card-log" action={<TextLink onClick={() => navigate("training")}>Voir tout</TextLink>}>
        {sessions.length ? sessions.slice(0, 5).map(s => <SessionRow item={s} key={s.id} onEdit={() => s.legacy ? navigate("legacy") : edit("session",s)}/>) :
          <Placeholder title="Ton journal commence ici" text="Enregistre ta première séance et retrouve tes progrès." action={formAction(open,"session","Saisir une séance")}/>}
      </Panel>
      <Panel icon={Trophy} title="Préparation compétition" className="kl-card-comp" action={<TextLink onClick={() => navigate("competition")}>Planning</TextLink>}>
        <div className="kl-competition-big"><div><strong>WKC Orlando 2027</strong><span>Armes traditionnelles · objectif majeur</span></div><b>J-{Math.max(0,dayDiff(isoDate(),WORLD_START))}</b></div>
        <div className="kl-task-list">
          <div><Dot good={stats.weekCount >= stats.target}/><span>Objectif hebdomadaire : {stats.target} séances</span></div>
          <div><Dot good={sessions.some(s => /bo|arme/i.test(s.category))}/><span>Pratique technique des armes</span></div>
          <div><Dot good={checkins.some(c => c.date === isoDate())}/><span>Suivi forme et récupération</span></div>
          <div><Dot good={hasGoals}/><span>Plan d'objectifs personnels défini</span></div>
        </div>
        <div className="kl-timeline">{["Construction","Développement","Spécifique","Affûtage"].map((p,i) =>
          <div key={p} className={cls("kl-timeline-step", dayDiff(isoDate(),WORLD_START) <= [365,180,90,28][i] && "is-active")}><span></span><small>{p}</small></div>)}
        </div>
        <p className="kl-fineprint">Repères de préparation indicatifs à adapter avec ton entraîneur.</p>
      </Panel>
      <Panel icon={Play} title="Bibliothèque technique" className="kl-card-tech" action={<TextLink onClick={() => navigate("technique")}>Voir tout</TextLink>}>
        <div className="kl-tech-tiles">
          {[[Swords,"BO / ARMES","technique"],[Activity,"KATAS","technique"],[Video,"VIDÉOS","technique"],[BookOpen,"NOTES COACH","technique"]].map(([Icon,label,page]) =>
            <button key={label} type="button" onClick={() => navigate(page)}><Icon size={24}/><span>{label}</span><ChevronRight size={15}/></button>)}
        </div>
      </Panel>
      <Panel icon={HeartPulse} title="Santé & récupération" className="kl-card-health" action={<TextLink onClick={() => navigate("wellness")}>Mon bilan</TextLink>}>
        <div className="kl-recovery-grid">
          <div><Heart size={18}/><small>Douleur</small><strong>{checkins[0] ? (checkins[0].pain ?? "—") + "/10" : "—"}</strong></div>
          <div><Moon size={18}/><small>Sommeil</small><strong>{sleepAvg != null ? sleepAvg.toFixed(1) + " h" : "—"}</strong></div>
          <div><Flame size={18}/><small>Charge (7 j)</small><strong>{stats.weekLoad || "—"}</strong></div>
          <div><Activity size={18}/><small>Forme du jour</small><strong>{latestReadiness == null ? "—" : latestReadiness + "/100"}</strong></div>
        </div>
        <button type="button" className="kl-small-action" onClick={() => open("checkin")}><Plus size={16}/> Faire mon bilan du jour</button>
      </Panel>
      <Panel icon={ChartNoAxesCombined} title="Statistiques" className="kl-card-stats" action={<TextLink onClick={() => navigate("analytics")}>Analyser</TextLink>}>
        <div className="kl-stats-inner"><div className="kl-stats-main"><div className="kl-stat-header"><div><small>VOLUME SUR 7 JOURS</small><strong>{hoursLabel(stats.weekMinutes)}</strong></div><div><small>SÉANCES DU MOIS</small><strong>{stats.monthCount}</strong></div></div><MiniChart data={chartData} valueKey="minutes"/></div>
          <div className="kl-readiness"><span>INDICE DE FORME</span><Ring value={latestReadiness} text="/100"/><small>Calcul indicatif, non médical</small></div></div>
      </Panel>
      <Panel icon={Users} title="Espace famille" className="kl-card-family" action={<TextLink onClick={() => navigate("family")}>Profils</TextLink>}>
        <div className="kl-family-cards">{profiles.map((p,i) => <button key={p.id} type="button" onClick={() => ctx.switchProfile(p.id)} className={cls("kl-family-card", p.id === profile.id && "is-current")}>
          <span className="kl-avatar">{p.nom?.slice(0,1) || "K"}</span><strong>{p.nom}</strong><small>{p.type || "Athlète"}</small></button>)}</div>
      </Panel>
      <Panel icon={Target} title="Priorités de la semaine" className="kl-card-priorities" action={<TextLink onClick={() => navigate("goals")}>Objectifs</TextLink>}>
        <div className="kl-priorities">{suggestions.map((s,i) => <button type="button" key={i} onClick={() => s.kind === "checkin" ? open("checkin") : open("session")}><Circle size={19}/><span><strong>{s.title}</strong><small>{s.detail}</small></span></button>)}</div>
      </Panel>
    </div>
  </>;
}

function Training({ ctx }) {
  const { sessions, stats, open, edit, remove } = ctx;
  const [range, setRange] = useState("30j");
  const start = range === "7j" ? pastDays(7)[0] : range === "30j" ? pastDays(30)[0] : "0000-01-01";
  const filtered = sessions.filter(s => s.date >= start);
  return <>
    <PageHeading eyebrow="JOURNAL ATHLÈTE" title="Mes entraînements" sub="Chaque séance compte : volume, intensité, travail technique et corrections." action={formAction(open,"session","Ajouter une séance")}/>
    <div className="kl-summary-row"><Kpi icon={CalendarCheck2} label="Séances / semaine" value={stats.weekCount + "/" + stats.target} foot="Objectif personnel"/><Kpi icon={Clock3} label="Volume / semaine" value={hoursLabel(stats.weekMinutes)} foot="Durées renseignées"/><Kpi icon={Flame} label="Charge RPE × durée" value={String(stats.weekLoad)} foot="Unités internes (indicatif)"/></div>
    <div className="kl-content-grid"><Panel icon={Activity} title="Journal des séances" className="kl-span-wide" action={<div className="kl-tabs">{["7j","30j","Toutes"].map(x => <button key={x} className={range===x?"is-active":""} onClick={()=>setRange(x)}>{x}</button>)}</div>}>
      {filtered.length ? filtered.map(s => <div key={s.id} className="kl-record">
        <div className="kl-record-top"><span className="kl-pill">{s.category}</span><small>{shortDate(s.date)}</small></div>
        <strong>{s.title || s.category}</strong>
        <p>{[s.duration ? hoursLabel(Number(s.duration)) : "Durée non précisée", s.rpe ? "RPE " + s.rpe + "/10" : null, s.quality ? "Qualité " + s.quality + "/10" : null].filter(Boolean).join(" · ")}</p>
        {s.notes && <div className="kl-record-notes">{s.notes}</div>}
        {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="kl-inline-link">Voir la vidéo <ArrowUpRight size={13}/></a>}
        <div className="kl-record-actions">{s.legacy ? <button onClick={() => ctx.navigate("legacy")}>Modifier dans l'ancien suivi</button> : <><button onClick={() => edit("session",s)}><Pencil size={14}/> Modifier</button><button onClick={() => remove("session",s.id)} className="kl-danger"><Trash2 size={14}/> Supprimer</button></>}</div>
      </div>) : <Placeholder title="Aucune séance sur cette période" text="Ajoute une séance ou élargis la période." action={formAction(open,"session")}/>}
    </Panel>
    <Panel icon={ChartNoAxesCombined} title="Volume des 7 derniers jours"><MiniChart data={trainingChart(sessions)} valueKey="minutes"/>
      <div className="kl-note"><Info size={16}/> Les anciennes séances sans durée sont comptées comme séances, mais pas dans les heures.</div>
    </Panel></div>
  </>;
}

function Techniques({ ctx }) {
  const { data, profile, open, edit, remove, navigate } = ctx;
  const [filter, setFilter] = useState("Toutes");
  const [query, setQuery] = useState("");
  const base = readJSON("karate_tech_base_" + profile.id, {});
  const mastered = Object.values(base).filter(x => x?.statut === "appris").length;
  const videos = readJSON("karate_videos", []);
  const filtered = data.techniques.filter(t => (filter === "Toutes" || t.category === filter) && ((t.title||"") + " " + (t.notes||"")).toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="MAÎTRISE TECHNIQUE" title="Technique & vidéos" sub="Mes katas, armes et corrections : un dossier évolutif, pas une simple liste." action={formAction(open,"technique","Nouvelle fiche")}/>
    <div className="kl-summary-row"><Kpi icon={BookOpen} label="Fiches personnalisées" value={String(data.techniques.length)} foot="Progression évaluée"/><Kpi icon={CheckCircle2} label="Ancienne base : acquis" value={String(mastered)} foot="Techniques marquées apprises"/><Kpi icon={Video} label="Vidéos enregistrées" value={String(videos.length)} foot="Ancienne vidéothèque"/></div>
    <div className="kl-content-grid"><Panel title="Mes techniques prioritaires" icon={Swords} className="kl-span-wide" action={<button type="button" className="kl-text-link" onClick={()=>navigate("legacy")}>Base technique existante <ChevronRight size={15}/></button>}>
      <div className="kl-filter-line"><input className="kl-search" aria-label="Rechercher une technique" placeholder="Rechercher un kata, un mouvement..." value={query} onChange={e=>setQuery(e.target.value)}/>
        <select aria-label="Filtrer la discipline" value={filter} onChange={e=>setFilter(e.target.value)}><option>Toutes</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
      {filtered.length ? <div className="kl-tech-list">{filtered.map(t => <div className="kl-tech-item" key={t.id}>
        <div className="kl-tech-item-top"><div><span className="kl-pill">{t.category}</span><h3>{t.title}</h3></div><div className="kl-score">{t.score ?? "—"} <small>/ 5</small></div></div>
        <div className="kl-dots">{Array.from({length:5},(_,i)=><span key={i} className={i < Number(t.score||0) ? "filled" : ""}/>)}</div>
        <p className="kl-secondary">{t.level} {t.reviewDate ? " · Prochaine révision : " + shortDate(t.reviewDate) : ""}</p>
        {t.notes && <p>{t.notes}</p>}
        {t.videoUrl && <a className="kl-inline-link" href={t.videoUrl} rel="noopener noreferrer" target="_blank">Voir ma vidéo <ArrowUpRight size={13}/></a>}
        <div className="kl-record-actions"><button onClick={()=>edit("technique",t)}><Pencil size={14}/> Évaluer / corriger</button><button className="kl-danger" onClick={()=>remove("technique",t.id)}><Trash2 size={14}/></button></div>
      </div>)}</div> : <Placeholder title="Aucune fiche technique" text="Crée une fiche pour ton kata ou ton bo, note tes corrections, puis évalue ta progression." action={formAction(open,"technique","Créer une fiche")}/>}
    </Panel>
    <Panel title="Méthode d'analyse" icon={Video}><div className="kl-method"><span>01</span><div><strong>Filmer</strong><p>Réaliser un passage complet à vitesse de compétition.</p></div></div>
      <div className="kl-method"><span>02</span><div><strong>Observer</strong><p>Isoler une correction : précision, stabilité, rythme ou puissance.</p></div></div>
      <div className="kl-method"><span>03</span><div><strong>Comparer</strong><p>Noter ton score sur 5 et conserver le lien vidéo.</p></div></div>
      <div className="kl-method"><span>04</span><div><strong>Répéter</strong><p>Réévaluer à la prochaine séance. Consigner les nouvelles corrections.</p></div></div>
      <Primary kind="outline" onClick={()=>navigate("legacy")} icon={BookOpen}>Ouvrir la bibliothèque historique</Primary>
    </Panel></div>
  </>;
}

function Competitions({ ctx }) {
  const { data, profile, competitions, open, edit, remove, navigate } = ctx;
  const now = isoDate();
  const sorted = [...competitions].sort((a,b) => (a.date||"9999").localeCompare(b.date||"9999"));
  return <>
    <PageHeading eyebrow="ROAD TO THE WORLD STAGE" title="Compétitions" sub="Planifier, préparer, performer, analyser. Chaque événement devient un apprentissage." action={formAction(open,"competition","Ajouter une compétition")}/>
    <div className="kl-competition-feature"><div><div className="kl-eyebrow">PROCHAIN GRAND OBJECTIF</div><h2>WKC ORLANDO 2027</h2><p>23–29 octobre 2027 · DoubleTree at the Entrance to Universal Orlando</p>
      <div className="kl-chip-row"><span>Armes traditionnelles</span><span>Compétition internationale</span></div></div>
      <div className="kl-feature-days"><strong>{Math.max(0,dayDiff(now,WORLD_START))}</strong><span>JOURS AVANT LES MONDIAUX</span></div></div>
    <div className="kl-phases">{[
      ["Construction","Fondations techniques, mobilité, capacité de travail",180],
      ["Spécifique","Passages complets et entraînements proches compétition",90],
      ["Simulation","Simulations, vidéo, points faibles ciblés",28],
      ["Affûtage","Réduction progressive de la charge et récupération",0]
    ].map(([n,sub,d])=> <div key={n} className={cls("kl-phase", dayDiff(now,WORLD_START) <= d && "is-phase-active")}><span/><strong>{n}</strong><small>{sub}</small></div>)}</div>
    <div className="kl-content-grid"><Panel icon={Trophy} title="Calendrier des compétitions" className="kl-span-wide">
      {sorted.length ? sorted.map(c => <div className="kl-event-card" key={c.id}>
        <div className="kl-event-date"><strong>{c.date ? parseLocal(c.date).toLocaleDateString("fr-CA",{day:"2-digit"}) : "—"}</strong><small>{c.date ? parseLocal(c.date).toLocaleDateString("fr-CA",{month:"short"}).toUpperCase() : "DATE"}</small></div>
        <div className="kl-event-body"><span className="kl-pill">{c.status || "À venir"}</span><h3>{c.name || c.nom}</h3>
          <p>{[c.location || c.lieu, c.category].filter(Boolean).join(" · ")}</p>{c.result && <strong className="kl-highlight">Résultat : {c.result}</strong>}
          {c.objectives && <p className="kl-secondary">Objectif : {c.objectives}</p>}
          {c.notes && <p className="kl-secondary">{c.notes}</p>}
        </div>
        <div className="kl-event-actions">{c.legacy ? <button onClick={()=>navigate("legacy")}>Ancien suivi</button> : <><button title="Modifier" aria-label="Modifier" onClick={()=>edit("competition",c)}><Pencil size={17}/></button><button title="Supprimer" aria-label="Supprimer" onClick={()=>remove("competition",c.id)}><Trash2 size={17}/></button></>}</div>
      </div>) : <Placeholder title="Aucune compétition" text="Enregistre les qualificatives, championnats et résultats." action={formAction(open,"competition")}/>}
    </Panel>
    <Panel icon={ListChecks} title="Préparer le jour J"><div className="kl-method"><span>01</span><div><strong>Technique</strong><p>Choisir le programme et stabiliser les corrections.</p></div></div>
      <div className="kl-method"><span>02</span><div><strong>Physique</strong><p>Planifier charge, vitesse, force et récupération.</p></div></div>
      <div className="kl-method"><span>03</span><div><strong>Mental</strong><p>Routines d'entrée, respiration, visualisation et simulations.</p></div></div>
      <div className="kl-method"><span>04</span><div><strong>Debrief</strong><p>Consigner sensations, notes vidéo et résultat réel.</p></div></div></Panel></div>
  </>;
}

function Wellness({ ctx }) {
  const { checkins, open, edit, remove } = ctx;
  const latest = checkins[0];
  const point = readiness(latest);
  const weightData = [...checkins].filter(x=>x.weight!=="" && x.weight!=null).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14).map(x=>({day:shortDate(x.date),weight:Number(x.weight)}));
  return <>
    <PageHeading eyebrow="RÉCUPÉRATION & PRÉPARATION MENTALE" title="Physique & mental" sub="Suivre ton état chaque jour pour mieux comprendre tes variations de forme." action={formAction(open,"checkin","Faire mon bilan")}/>
    <div className="kl-wellness-feature"><div><span className="kl-eyebrow">BILAN LE PLUS RÉCENT</span><h2>{latest ? longDate(latest.date) : "Pas encore de bilan"}</h2><p>Ton suivi est personnel : l'indice sert à observer des tendances, pas à poser un diagnostic.</p></div><Ring value={point} text="INDICE FORME"/></div>
    <div className="kl-kpis kl-kpis-wellness">
      <Kpi icon={BedDouble} label="Sommeil" value={latest?.sleep ? latest.sleep + " h" : "—"} foot="Dernier bilan"/>
      <Kpi icon={Zap} label="Énergie" value={latest?.energy ? latest.energy + "/10" : "—"} foot="Ressentie"/>
      <Kpi icon={Brain} label="Stress" value={latest ? latest.stress + "/10" : "—"} foot="Ressenti"/>
      <Kpi icon={HeartPulse} label="Douleur" value={latest ? latest.pain + "/10" : "—"} foot="Ressentie"/>
    </div>
    <div className="kl-content-grid"><Panel title="Historique forme" icon={Activity} className="kl-span-wide">
      {checkins.length ? checkins.map(c=><div className="kl-checkin-row" key={c.id||c.date}>
        <div><strong>{shortDate(c.date)}</strong><small>{c.sleep} h de sommeil · énergie {c.energy}/10 · douleur {c.pain}/10{c.weight!==""&&c.weight!=null?" · "+c.weight+" kg":""}</small></div>
        <div className="kl-record-actions"><button onClick={()=>edit("checkin",c)}><Pencil size={15}/> Modifier</button><button className="kl-danger" onClick={()=>remove("checkin",c.id)}><Trash2 size={15}/></button></div>
      </div>) : <Placeholder icon={Moon} title="Premier bilan forme" text="Moins d'une minute pour consigner sommeil, énergie, stress et douleurs." action={formAction(open,"checkin","Commencer")}/>}
    </Panel>
    <Panel title="Évolution du poids" icon={Weight}><MiniChart data={weightData} type="line" valueKey="weight"/><div className="kl-note">Aucune cible de poids n'est imposée. Suis uniquement les données utiles à ta préparation.</div></Panel></div>
  </>;
}
function Health({ ctx }) {
  const { data, profile, open, edit, remove, navigate, checkins } = ctx;
  const old = readJSON("karate_health_" + profile.id, []);
  return <>
    <PageHeading eyebrow="ÉTAT PHYSIQUE" title="Santé & récupération" sub="Un historique des gênes et blessures, pour ajuster ton entraînement de manière responsable." action={formAction(open,"injury","Ajouter un suivi")}/>
    <div className="kl-note kl-health-note"><AlertTriangle size={19}/> Ce journal n'est pas un outil de diagnostic. En cas de douleur persistante ou importante, consulte un professionnel de santé.</div>
    <div className="kl-content-grid"><Panel title="Registre des gênes et blessures" icon={HeartPulse} className="kl-span-wide">
      {data.injuries.length || (Array.isArray(old)&&old.length) ? <>
        {data.injuries.map(i=><div className="kl-injury" key={i.id}><span className="kl-injury-icon"><HeartPulse size={20}/></span><div><strong>{i.location}</strong><small>{shortDate(i.date)} · {i.status} · gêne {i.pain}/10</small>{i.notes && <p>{i.notes}</p>}</div><div className="kl-record-actions"><button onClick={()=>edit("injury",i)}><Pencil size={16}/></button><button className="kl-danger" onClick={()=>remove("injury",i.id)}><Trash2 size={16}/></button></div></div>)}
        {Array.isArray(old) && old.map((i,j)=><div className="kl-injury" key={i.id||j}><span className="kl-injury-icon"><HeartPulse size={20}/></span><div><strong>{i.type || i.zone || "Historique santé"}</strong><small>{shortDate(i.date)} · ancien suivi</small></div><button className="kl-text-link" onClick={()=>navigate("legacy")}>Ouvrir <ChevronRight size={14}/></button></div>)}
      </> : <Placeholder icon={HeartPulse} title="Aucun suivi santé enregistré" text="Tu peux documenter ici une gêne, une blessure et son évolution." action={formAction(open,"injury","Créer un suivi")}/>}
    </Panel>
    <Panel title="Dernier état du corps" icon={Activity}><p className="kl-secondary">Douleur déclarée au dernier bilan</p><strong className="kl-extra-large">{checkins[0] ? checkins[0].pain + " /10" : "—"}</strong><div className="kl-divider"/>
      <p className="kl-secondary">Conseil de fonctionnement</p><p>Rattache tes sensations au volume d'entraînement et aux répétitions techniques. Les alertes de cette application ne sont pas médicales.</p>
      <Primary kind="outline" onClick={()=>navigate("wellness")} icon={Activity}>Voir les bilans de forme</Primary>
    </Panel></div>
  </>;
}
function Family({ ctx }) {
  const { profiles, profile, switchProfile, open, edit } = ctx;
  return <>
    <PageHeading eyebrow="FAMILLE KARATÉ" title="Nos athlètes" sub="Chaque membre de la famille possède son propre journal, ses techniques et ses compétitions." action={formAction(open,"profile","Ajouter un profil")}/>
    <div className="kl-family-list">{profiles.map(p=><div key={p.id} className={cls("kl-athlete-card",p.id===profile.id && "is-current")}>
      <div className="kl-athlete-avatar">{p.nom?.slice(0,1)}</div><div className="kl-athlete-copy"><strong>{p.nom}</strong><small>{[p.type,p.club,p.discipline].filter(Boolean).join(" · ")}</small>{p.id===profile.id && <span className="kl-pill">Profil actif</span>}</div>
      <div className="kl-athlete-actions"><button className="kl-icon-button" aria-label={"Modifier "+p.nom} onClick={()=>edit("profile",p)}><Pencil size={18}/></button><Primary kind="outline" onClick={()=>switchProfile(p.id)} icon={ArrowRight}>Ouvrir</Primary></div>
    </div>)}</div>
    <div className="kl-note"><LockKeyhole size={18}/> Les données de chaque profil sont séparées sur cet appareil. Aucun partage automatique ni synchronisation avec un autre iPhone.</div>
  </>;
}
function Analytics({ ctx }) {
  const { sessions, stats, checkins, profile, data } = ctx;
  const weights = [...checkins].filter(x=>x.weight!=="" && x.weight!=null).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14).map(x=>({day:shortDate(x.date),weight:Number(x.weight)}));
  const byCat = CATEGORIES.map(category=>({category,count:sessions.filter(s=>s.category===category).length})).filter(x=>x.count);
  const qualities = sessions.filter(s=>s.quality).slice(0,16).reverse().map(x=>({day:shortDate(x.date),quality:Number(x.quality)}));
  return <>
    <PageHeading eyebrow="MESURES & TENDANCES" title="Statistiques" sub="Des chiffres calculés à partir de tes séances et bilans, sans données inventées."/>
    <div className="kl-kpis kl-kpis-wellness">
      <Kpi icon={CalendarDays} label="Séances au total" value={String(sessions.length)} foot="Historique terminé"/><Kpi icon={Clock3} label="Minutes documentées" value={hoursLabel(sessions.reduce((n,s)=>n+(Number(s.duration)||0),0))} foot="Données disponibles"/>
      <Kpi icon={Flame} label="Charge 7 jours" value={String(stats.weekLoad)} foot="RPE × durée"/><Kpi icon={Trophy} label="Compétitions" value={String(data.competitions.length + oldCompetitions(profile.id).length)} foot="Anciens et nouveaux registres"/>
    </div>
    <div className="kl-content-grid"><Panel icon={ChartNoAxesCombined} title="Volume des 7 derniers jours" className="kl-span-wide"><MiniChart data={trainingChart(sessions)} valueKey="minutes"/></Panel>
      <Panel icon={Weight} title="Tendance du poids"><MiniChart data={weights} valueKey="weight" type="line"/></Panel>
      <Panel icon={Star} title="Qualité technique ressentie"><MiniChart data={qualities} valueKey="quality" type="line"/></Panel>
      <Panel icon={Swords} title="Répartition des séances" className="kl-span-wide">{byCat.length?<div className="kl-category-bars">{byCat.map(x=><div key={x.category}><span>{x.category}</span><div className="kl-progress"><i style={{width:percent(x.count/sessions.length*100)+"%"}}/></div><strong>{x.count}</strong></div>)}</div>:
        <Placeholder title="Aucune statistique de discipline" text="Les disciplines se répartiront automatiquement après tes premières séances."/>}</Panel>
    </div>
    <div className="kl-note"><Info size={17}/> Les charges et indices sont des mesures de suivi personnel ; ils ne remplacent pas une évaluation de performance ou un suivi médical.</div>
  </>;
}
function Goals({ ctx }) {
  const { data, setData, sessions, open, edit, remove } = ctx;
  const target = Number(data.settings.weeklyTarget) || 4;
  const weekCount = sessions.filter(s=>s.date >= weekStart() && s.date <= isoDate()).length;
  const weekMins = sessions.filter(s=>s.date >= weekStart() && s.date <= isoDate()).reduce((n,s)=>n+(Number(s.duration)||0),0);
  function progress(g) { const n = g.metricType==="sessions" ? weekCount : g.metricType==="minutes" ? weekMins : Number(g.current||0); return percent((Number(g.target)>0?n/Number(g.target):0)*100); }
  return <>
    <PageHeading eyebrow="DISCIPLINE & PLANIFICATION" title="Mes objectifs" sub="Transformer une ambition en actions mesurables." action={formAction(open,"goal","Nouvel objectif")}/>
    <div className="kl-content-grid"><Panel icon={Target} title="Objectifs actifs" className="kl-span-wide">
      {data.goals.length ? data.goals.map(g=><div className="kl-goal" key={g.id}><div className="kl-goal-top"><div><span className="kl-pill">{g.status}</span><h3>{g.title}</h3></div><strong>{progress(g)}%</strong></div>
        <div className="kl-progress kl-progress-big"><i style={{width:progress(g)+"%"}}/></div><small>{g.metricType==="sessions"?"Séances cette semaine":g.metricType==="minutes"?"Minutes cette semaine":"Progression manuelle"} · cible : {g.target}{g.deadline?" · échéance : "+shortDate(g.deadline):""}</small>
        {g.notes && <p>{g.notes}</p>}
        <div className="kl-record-actions"><button onClick={()=>edit("goal",g)}><Pencil size={15}/> Modifier</button><button className="kl-danger" onClick={()=>remove("goal",g.id)}><Trash2 size={15}/></button></div></div>) :
        <Placeholder title="Crée ton premier objectif mesurable" text="Ex. 4 séances par semaine ou 240 minutes d'entraînement." action={formAction(open,"goal","Ajouter un objectif")}/>}
    </Panel>
    <Panel icon={SlidersHorizontal} title="Mes cibles hebdomadaires"><div className="kl-target-form">
      <label>Nombre de séances <input type="number" min="1" max="21" inputMode="numeric" value={data.settings.weeklyTarget} onChange={e=>setData(p=>({...p,settings:{...p.settings,weeklyTarget:Math.min(21,Math.max(1,Number(e.target.value)||1))}}))}/></label>
      <label>Volume visé (minutes) <input type="number" min="30" max="2400" step="15" inputMode="numeric" value={data.settings.weeklyMinutes} onChange={e=>setData(p=>({...p,settings:{...p.settings,weeklyMinutes:Math.min(2400,Math.max(30,Number(e.target.value)||30))}}))}/></label>
      <p className="kl-secondary">Ces cibles servent aux indicateurs du tableau de bord. Elles ne sont pas une prescription d'entraînement.</p>
      <div className="kl-divider"/><strong>Cette semaine</strong><p>{weekCount}/{target} séances · {hoursLabel(weekMins)} sur {hoursLabel(data.settings.weeklyMinutes)}</p>
    </div></Panel></div>
  </>;
}
function SettingsPage({ ctx }) {
  const { navigate } = ctx;
  const [message,setMessage] = useState("");
  const exportData = () => {
    const storage = {};
    for (let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k && (k.startsWith("karate_")||k.startsWith("kl_"))) storage[k]=localStorage.getItem(k);}
    const blob = new Blob([JSON.stringify({format:"karate-life-backup",version:1,exportedAt:new Date().toISOString(),storage},null,2)],{type:"application/json"});
    const link=document.createElement("a"); const url=URL.createObjectURL(blob);
    link.href=url;link.download="karate-life-sauvegarde-"+isoDate()+".json";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage("Fichier de sauvegarde préparé. Conserve-le dans un endroit privé.");
  };
  const importData = async e => {
    const file=e.target.files?.[0]; e.target.value=""; if(!file)return;
    try{
      if(file.size>8*1024*1024) throw new Error("Fichier trop volumineux.");
      const parsed=JSON.parse(await file.text());
      if(parsed.format!=="karate-life-backup"||!parsed.storage||typeof parsed.storage!=="object"||Array.isArray(parsed.storage))throw new Error("Format de sauvegarde invalide.");
      const entries=Object.entries(parsed.storage).filter(([k,v])=>(k.startsWith("karate_")||k.startsWith("kl_"))&&typeof v==="string");
      if(!entries.length)throw new Error("Cette sauvegarde ne contient aucune donnée.");
      if(!window.confirm("Importer "+entries.length+" catégories de données ? Les données ayant les mêmes clés seront remplacées. Il est conseillé d'exporter une sauvegarde avant."))return;
      entries.forEach(([k,v])=>localStorage.setItem(k,v));window.location.reload();
    }catch(err){setMessage("Import impossible : "+err.message);}
  };
  return <>
    <PageHeading eyebrow="VIE PRIVÉE & APPAREILS" title="Réglages & sauvegarde" sub="Contrôle tes données. KARATÉ LIFE fonctionne directement sur ton iPhone."/>
    <div className="kl-content-grid">
      <Panel icon={LockKeyhole} title="Où sont mes données ?" className="kl-span-wide"><p>Cette version utilise le stockage local de ton navigateur. Tes séances, bilans et notes ne sont pas publiés sur Netlify et ne sont pas transmis à un serveur par KARATÉ LIFE.</p>
        <p><strong>Important :</strong> pas de compte cloud ni de synchronisation automatique entre Mac et iPhone. Si tu effaces les données de Safari ou changes d'appareil, importe une sauvegarde pour retrouver ton historique.</p>
        <div className="kl-note"><ShieldCheck size={19}/> La page du site est accessible publiquement, mais les données personnelles enregistrées sur ton appareil ne sont pas incluses dans la page publique. Évite un appareil partagé.</div>
      </Panel>
      <Panel icon={Download} title="Sauvegarde personnelle"><p>Exporter les profils, séances, techniques, résultats et anciens modules dans un fichier JSON.</p>
        <Primary onClick={exportData} icon={Download}>Exporter une sauvegarde</Primary></Panel>
      <Panel icon={Upload} title="Restaurer sur un iPhone"><p>Sur ton iPhone, importe le fichier exporté depuis ton ordinateur. Vérifie les profils après restauration.</p>
        <label className="kl-btn kl-btn-outline kl-upload"><Upload size={17}/> Importer une sauvegarde<input type="file" accept="application/json,.json" onChange={importData}/></label></Panel>
      <Panel icon={CalendarDays} title="Installer comme une application" className="kl-span-wide"><div className="kl-install-steps"><span>1</span><p>Ouvre KARATÉ LIFE dans <strong>Safari</strong> sur ton iPhone.</p><span>2</span><p>Touche <strong>Partager</strong> puis <strong>Sur l’écran d’accueil</strong>.</p><span>3</span><p>Ouvre l'icône KARATÉ LIFE : navigation plein écran, menus tactiles et consultation hors connexion après chargement initial.</p></div></Panel>
      <Panel icon={RefreshCw} title="Continuer avec l'ancien site" className="kl-span-wide"><p>Tous les outils historiques restent accessibles : calendrier détaillé, instructeurs, base de techniques, vidéos, finances, passage de ceinture, etc.</p>
        <Primary kind="outline" onClick={()=>navigate("legacy")} icon={ArrowRight}>Ouvrir l'ancien cockpit</Primary></Panel>
    </div>{message&&<div role="status" className="kl-toast">{message}</div>}
  </>;
}

export default function KarateLife() {
  const [profiles,setProfiles]=useState(loadProfiles);
  const [activeId,setActiveId]=useState(()=>readJSON("karate_life_active_profile",null)||loadProfiles().find(x=>x.actif)?.id||loadProfiles()[0].id);
  const activeProfile=profiles.find(p=>p.id===activeId)||profiles[0];
  const [data,setData]=useState(()=>loadData(loadProfiles().find(x=>x.id===(readJSON("karate_life_active_profile",null)||loadProfiles().find(q=>q.actif)?.id))||loadProfiles()[0]));
  const [tab,setTab]=useState("dashboard");
  const [drawer,setDrawer]=useState(false);
  const [modal,setModal]=useState(null);
  const [legacyTick,setLegacyTick]=useState(0);
  const [feedback,setFeedback]=useState("");
  useEffect(()=>{writeJSON("karate_profiles",profiles);},[profiles]);
  useEffect(()=>{writeJSON("karate_life_v1_"+activeProfile.id,data);},[data,activeProfile.id]);
  useEffect(()=>{writeJSON("karate_life_active_profile",activeProfile.id);},[activeProfile.id]);
  const sessions=useMemo(()=>allSessions(activeProfile.id,data),[activeProfile.id,data,legacyTick]);
  const checkins=useMemo(()=>[...data.checkins].sort((a,b)=>b.date.localeCompare(a.date)),[data.checkins]);
  const competitions=useMemo(()=>{
    const old=oldCompetitions(activeProfile.id).map((c,i)=>({id:c.id||"old-"+i,name:c.nom||"Compétition",date:c.date,location:c.lieu||"",category:(c.categories||[]).map(x=>x.type||x.categorie).filter(Boolean).join(", "),result:"",status:"Terminé",notes:c.notes||"",legacy:true}));
    return [...data.competitions,...old];
  },[activeProfile.id,data.competitions,legacyTick]);
  const now=isoDate(); const startWeek=weekStart(now);
  const week=sessions.filter(s=>s.date>=startWeek && s.date<=now);
  const month=sessions.filter(s=>s.date.slice(0,7)===now.slice(0,7) && s.date<=now);
  const stats={weekCount:week.length,weekMinutes:week.reduce((n,s)=>n+(Number(s.duration)||0),0),
    weekLoad:week.reduce((n,s)=>n+(Number(s.duration)||0)*(Number(s.rpe)||0),0),
    monthCount:month.length,target:Number(data.settings.weeklyTarget)||4};
  const future=competitions.filter(c=>c.date&&c.date>=now).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const medalTotal=medalCount(activeProfile.id,data);
  const suggestions=recommendations(sessions,checkins,stats.target);
  function navigate(id){setTab(id);setDrawer(false);window.scrollTo(0,0);if(tab==="legacy"){setProfiles(loadProfiles());setLegacyTick(t=>t+1);}}
  function switchProfile(id){
    if(id===activeProfile.id){setTab("dashboard");setDrawer(false);return;}
    writeJSON("karate_life_v1_"+activeProfile.id,data);
    const p=profiles.find(x=>x.id===id); if(!p)return;
    setProfiles(prev=>prev.map(x=>({...x,actif:x.id===id})));
    setActiveId(id); setData(loadData(p)); setLegacyTick(t=>t+1);setTab("dashboard");setDrawer(false);window.scrollTo(0,0);
  }
  function open(type){setModal({type,item:null});setDrawer(false);}
  function edit(type,item){setModal({type,item});setDrawer(false);}
  function onSave(type,form){
    if(type==="profile"){
      const id=form.id||uid();const next={...form,id};
      setProfiles(prev=>form.id?prev.map(p=>p.id===id?{...p,...next}:p):[...prev,next]);
      setModal(null);setFeedback("Profil enregistré.");return;
    }
    const collection={session:"sessions",checkin:"checkins",technique:"techniques",competition:"competitions",injury:"injuries",goal:"goals"}[type];
    if(!collection)return;
    const id=form.id||uid();
    const item={...form,id,updatedAt:new Date().toISOString()};
    if(type==="session"){item.duration=Number(form.duration);item.rpe=Number(form.rpe);item.quality=Number(form.quality);item.source="karate-life";delete item.legacy;}
    if(type==="technique"){
      const prev=data.techniques.find(x=>x.id===id);
      item.history=[...(prev?.history||[])];
      if(!prev||String(prev.score)!==String(item.score))item.history.push({date:isoDate(),score:Number(item.score)});
    }
    setData(prev=>({...prev,[collection]:type==="checkin" ?
      [...prev.checkins.filter(c=>c.date!==item.date&&c.id!==id),item] :
      [...prev[collection].filter(c=>c.id!==id),item]}));
    if(type==="session"){
      const key="karate_events_"+activeProfile.id;const legacy=readJSON(key,[]);
      const other=Array.isArray(legacy)?legacy.filter(e=>e.id!==id):[];
      other.push({id,profileId:activeProfile.id,title:item.title||item.category,date:item.date,time:"",type:/kata|bo|arme/i.test(item.category)?"groupe":"maison",status:"fait",duration:item.duration,rpe:item.rpe,notes:item.notes});
      writeJSON(key,other);setLegacyTick(t=>t+1);
    }
    setFeedback("Enregistré dans ton journal.");setModal(null);
  }
  function remove(type,id){
    if(!window.confirm("Supprimer cet élément de ton suivi ?"))return;
    const collection={session:"sessions",checkin:"checkins",technique:"techniques",competition:"competitions",injury:"injuries",goal:"goals"}[type];
    if(!collection)return;
    setData(prev=>({...prev,[collection]:prev[collection].filter(x=>x.id!==id)}));
    if(type==="session"){
      const key="karate_events_"+activeProfile.id;const events=readJSON(key,[]);
      if(Array.isArray(events))writeJSON(key,events.filter(e=>e.id!==id));setLegacyTick(t=>t+1);
    }
    setFeedback("Élément supprimé.");
  }
  const ctx={profile:activeProfile,profiles,activeId,data,setData,sessions,checkins,competitions,
    stats,nextComp:future,medals:medalTotal,suggestions,navigate,switchProfile,open,edit,remove};
  const currentMenu=ALL_MENU.find(x=>x.id===tab);
  const navItem=(item)=><button key={item.id} type="button" onClick={()=>navigate(item.id)} className={cls("kl-nav-item",tab===item.id&&"is-active")}>
    <item.icon size={19}/><span>{item.label}</span>{tab===item.id&&<span className="kl-active-dot"/>}</button>;
  return <div className="kl-shell">
    <aside className={cls("kl-sidebar",drawer&&"is-open")} aria-label="Navigation principale">
      <div className="kl-brand"><div className="kl-brand-emblem"><Swords size={27}/></div><div><strong>KARATÉ <em>LIFE</em></strong><small>PERFORMANCE COCKPIT</small></div></div>
      <div className="kl-sidebar-title">MON ESPACE SPORTIF</div>
      <nav>{MAIN_MENU.map(navItem)}</nav>
      <div className="kl-sidebar-title kl-sidebar-title-other">GESTION</div><nav>{OTHER_MENU.map(navItem)}</nav>
      <div className="kl-sidebar-footer"><div className="kl-mini-avatar">{activeProfile.nom?.charAt(0)}</div><div><strong>{activeProfile.nom}</strong><small>{activeProfile.type||"Athlète"} · Profil actif</small></div>
        <button className="kl-icon-button" aria-label="Changer de profil" onClick={()=>navigate("family")}><ChevronRight size={18}/></button></div>
    </aside>
    {drawer && <button type="button" aria-label="Fermer le menu" className="kl-drawer-cover" onClick={()=>setDrawer(false)}/>}
    <div className="kl-main-wrap">
      <header className="kl-topbar"><button className="kl-mobile-menu" aria-label="Menu" onClick={()=>setDrawer(true)}><Menu size={24}/></button>
        <div className="kl-mobile-brand"><Swords size={21}/><strong>KARATÉ <em>LIFE</em></strong></div>
        <div className="kl-top-crumb">KARATÉ LIFE <ChevronRight size={14}/> <span>{currentMenu?.label}</span></div>
        <div className="kl-top-actions"><button type="button" className="kl-today-check" onClick={()=>open("checkin")}><Activity size={17}/><span>Bilan du jour</span></button>
          <button className="kl-profile-pill" type="button" onClick={()=>navigate("family")}><span>{activeProfile.nom?.charAt(0)}</span><strong>{activeProfile.nom}</strong><ChevronDown size={14}/></button></div>
      </header>
      <main className="kl-content" id="contenu">
        {tab==="dashboard"&&<Overview ctx={ctx}/>}
        {tab==="training"&&<Training ctx={ctx}/>}
        {tab==="technique"&&<Techniques ctx={ctx}/>}
        {tab==="competition"&&<Competitions ctx={ctx}/>}
        {tab==="wellness"&&<Wellness ctx={ctx}/>}
        {tab==="health"&&<Health ctx={ctx}/>}
        {tab==="family"&&<Family ctx={ctx}/>}
        {tab==="analytics"&&<Analytics ctx={ctx}/>}
        {tab==="goals"&&<Goals ctx={ctx}/>}
        {tab==="settings"&&<SettingsPage ctx={ctx}/>}
        {tab==="legacy"&&<><PageHeading eyebrow="ARCHIVE COMPATIBLE" title="Ancien dashboard" sub="Les anciennes fonctionnalités et leur stockage restent inchangés." action={<Primary kind="outline" onClick={()=>navigate("dashboard")} icon={ArrowRight}>Retour à KARATÉ LIFE</Primary>}/>
          <div className="kl-legacy-frame"><Suspense fallback={<div className="kl-empty">Chargement de l'ancien dashboard…</div>}><ClassicDashboard/></Suspense></div></>}
      </main>
      <footer className="kl-footer">KARATÉ LIFE · Le progrès se construit séance après séance · Données stockées sur cet appareil</footer>
    </div>
    <nav className="kl-bottom-nav" aria-label="Navigation mobile">
      {[["dashboard",LayoutDashboard,"Accueil"],["training",CalendarDays,"Séances"],["analytics",ChartNoAxesCombined,"Progrès"],["more",MoreHorizontal,"Plus"]].map(([id,Icon,label])=>
        <button key={id} type="button" className={cls(tab===id&&"is-active")} onClick={()=>id==="more"?setDrawer(true):navigate(id)}><Icon size={22}/><span>{label}</span></button>)}
    </nav>
    {modal&&<Editor key={modal.type+"-"+(modal.item?.id||"new")} modal={modal} onClose={()=>setModal(null)} onSave={onSave}/>}
    {feedback&&<div className="kl-toast" role="status" onClick={()=>setFeedback("")}>{feedback}<button type="button" aria-label="Fermer" onClick={()=>setFeedback("")}><X size={15}/></button></div>}
  </div>;
}
