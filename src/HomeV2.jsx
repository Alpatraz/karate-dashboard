import React from "react";
import {
  Trophy, CalendarDays, BedDouble, Zap, Weight, Award, Swords, Activity,
  HeartPulse, ChartNoAxesCombined, BookOpen, Play, Video, NotebookPen,
  CheckCircle2, Circle, ArrowRight, ChevronRight, Target, Users, Plus,
  Flame, Moon, Sparkles, ShieldCheck, Timer, TrendingUp, Dumbbell, Star
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, LineChart, Line } from "recharts";
import {
  WORLD_START, isoDate, dayDiff, shortDate, pastDays, weekStart,
  hoursLabel, trainingChart, readiness, readJSON
} from "./karatelife/core.js";

const HERO = "https://images.unsplash.com/photo-1678804481496-eb44c1259dbb?auto=format&fit=crop&w=1200&q=82";
const KATA = "https://images.unsplash.com/photo-1560631820-7f68897fd447?auto=format&fit=crop&w=600&q=76";
const MARTIAL = "https://images.unsplash.com/photo-1545058197-64626c80b9b6?auto=format&fit=crop&w=600&q=76";

function Section({ icon: Icon, title, action, children, className = "" }) {
  return <section className={"kl2-card " + className}>
    <div className="kl2-card-head"><h2><Icon size={17}/><span>{title}</span></h2>{action}</div>
    <div className="kl2-card-body">{children}</div>
  </section>;
}
function TextAction({ children, onClick }) {
  return <button className="kl2-text-action" type="button" onClick={onClick}>{children}<ChevronRight size={14}/></button>;
}
function Empty({ text, action }) {
  return <div className="kl2-empty"><Activity size={26}/><span>{text}</span>{action}</div>;
}
function numberLabel(n){ return Number(n).toLocaleString("fr-CA",{maximumFractionDigits:1}); }
function Stat({ icon: Icon, name, value, helper, fill, accent }) {
  return <div className="kl2-stat">
    <div className="kl2-stat-head"><Icon size={19}/><span>{name}</span></div>
    <strong>{value}</strong><span className={"kl2-stat-help " + (accent?"kl2-positive":"")}>{helper}</span>
    {fill != null && <div className="kl2-stat-bar"><span style={{width:Math.max(0,Math.min(100,fill))+"%"}}/></div>}
  </div>;
}
function Slot({ icon: Icon, title, desc, onClick, img, tone = "" }) {
  return <button type="button" onClick={onClick} className={"kl2-media-slot "+tone} style={img?{"--slot-img":'url("'+img+'")'}:{}}>
    <Icon size={22}/><span>{title}</span><ChevronRight size={15}/>
    {desc&&<small>{desc}</small>}
  </button>;
}
function WeekBars({ sessions }) {
  const points=trainingChart(sessions);
  if(!points.some(x=>x.minutes>0))return <div className="kl2-no-chart"><ChartNoAxesCombined size={28}/><span>Les graphiques apparaîtront après tes premières séances.</span></div>;
  return <div className="kl2-chart"><ResponsiveContainer width="100%" height="100%">
    <BarChart data={points} margin={{top:7,right:6,left:-25,bottom:0}}>
      <CartesianGrid stroke="#e9e5df" strokeDasharray="3 5" vertical={false}/>
      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8f8c89"}}/>
      <YAxis tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8f8c89"}}/>
      <Tooltip formatter={(v)=>[v+" min","Entraînement"]}/>
      <Bar dataKey="minutes" fill="#c49a43" maxBarSize={34} radius={[5,5,0,0]}/>
    </BarChart>
  </ResponsiveContainer></div>;
}
function WeightLine({ checkins }) {
  const rows=[...checkins].filter(c=>c.weight!==""&&c.weight!=null&&!isNaN(Number(c.weight)))
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(-8).map(c=>({date:shortDate(c.date),poids:Number(c.weight)}));
  if(rows.length<2)return <div className="kl2-line-empty">Deux bilans de poids pour afficher la tendance</div>;
  return <div className="kl2-chart"><ResponsiveContainer width="100%" height="100%">
    <LineChart data={rows} margin={{top:7,right:13,left:-22,bottom:0}}>
      <CartesianGrid stroke="#e9e5df" strokeDasharray="3 5" vertical={false}/>
      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:9,fill:"#8f8c89"}}/>
      <YAxis domain={["auto","auto"]} tickLine={false} axisLine={false} tick={{fontSize:9,fill:"#8f8c89"}}/>
      <Tooltip formatter={v=>[v+" kg","Poids"]}/><Line type="monotone" dataKey="poids" stroke="#ba8d33" strokeWidth={2.5} dot={{r:3}}/>
    </LineChart>
  </ResponsiveContainer></div>;
}
function CircleMeter({score}){
  const value=score==null?0:Math.max(0,Math.min(100,score));
  return <div className="kl2-meter" style={{"--meter-value":value+"%"}}>
    <div><strong>{score==null?"—":value}</strong><small>/100</small></div>
  </div>;
}
function MobileActions({navigate}){
  const actions=[[Play,"Technique & vidéos","technique"],[ChartNoAxesCombined,"Statistiques","analytics"],[HeartPulse,"Santé & récupération","health"],[Target,"Mes objectifs","goals"]];
  return <div className="kl2-mobile-actions">
    {actions.map(([Icon,title,id])=><button key={id} type="button" onClick={()=>navigate(id)}><Icon size={23}/><span>{title}</span><ChevronRight size={14}/></button>)}
  </div>;
}
export default function HomeV2({ctx}){
  const {profile,profiles,sessions,stats,data,checkins,medals,suggestions,
    navigate,open,edit,switchProfile,competitions}=ctx;
  const now=isoDate(), remaining=Math.max(0,dayDiff(now,WORLD_START)||0);
  const thisWeek=weekStart(now);
  const monthlyGoal=(Number(stats.target)||4)*4;
  const weights=checkins.filter(c=>c.weight!==""&&c.weight!=null&&!isNaN(Number(c.weight)));
  const latestWeight=weights[0],previousWeight=weights[1];
  const delta=(latestWeight&&previousWeight)?Number(latestWeight.weight)-Number(previousWeight.weight):null;
  const recentSleep=checkins.filter(c=>c.date>=pastDays(7)[0]&&c.date<=now);
  const sleep=recentSleep.length?recentSleep.reduce((n,c)=>n+Number(c.sleep||0),0)/recentSleep.length:null;
  const energy=checkins[0]?Number(checkins[0].energy):null;
  const formScore=readiness(checkins[0]);
  const pain=checkins[0]?.pain;
  const oldHealth=readJSON("karate_health_"+profile.id,[]);
  const activeInjuries=data.injuries.filter(i=>i.status!=="Résolue").length;
  const recent=sessions.slice(0,4);
  const completedThisWeek=sessions.filter(s=>s.date>=thisWeek&&s.date<=now);
  const hasBo=completedThisWeek.some(s=>/bo|arme/i.test(s.category));
  const hasKata=completedThisWeek.some(s=>/kata/i.test(s.category));
  const todayReady=checkins.some(c=>c.date===now);
  const nearest=competitions.filter(c=>c.date>=now).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const nextPlanned=readJSON("karate_events_"+profile.id,[]);
  const planned=Array.isArray(nextPlanned)?nextPlanned.filter(e=>e.date>=now&&e.status!=="fait").sort((a,b)=>a.date.localeCompare(b.date))[0]:null;
  const targetMonth=monthlyGoal;
  return <div className="kl2-home">
    <header className="kl2-masthead">
      <div className="kl2-mast-text"><div className="kl2-brand-title">KARATÉ <em>LIFE</em></div>
        <p>Suivi, préparation et progression sportive</p></div>
      <div className="kl2-mast-photo" aria-hidden="true" style={{backgroundImage:'linear-gradient(90deg,#17181c 0%,rgba(23,24,28,.05) 52%),url("'+HERO+'")'}}/>
      <span className="kl2-mast-brush" aria-hidden="true"/>
    </header>
    <section className="kl2-mobile-intro">
      <div className="kl2-mobile-intro-copy"><h1>Bonjour {profile.nom} 👊</h1>
        <p>Ton entraînement, ta progression<br/>et tes objectifs au même endroit.</p></div>
      <div className="kl2-mobile-intro-photo" style={{backgroundImage:'linear-gradient(90deg,#15161a,rgba(21,22,26,.06)),url("'+HERO+'")'}} aria-hidden="true"/>
    </section>
    <button type="button" className="kl2-goal" onClick={()=>navigate("competition")}>
      <div className="kl2-goal-left"><Trophy size={23}/><span><small>OBJECTIF PRINCIPAL</small><strong>WKC <em>ORLANDO 2027</em></strong></span></div>
      <span className="kl2-goal-skyline" aria-hidden="true"/>
      <div className="kl2-goal-right"><span>J-{remaining}</span><ChevronRight size={17}/></div>
    </button>
    <section className="kl2-stats" aria-label="Indicateurs de performance">
      <Stat icon={CalendarDays} name="Séances ce mois" value={stats.monthCount+" / "+targetMonth}
        helper={stats.monthCount>=targetMonth?"Repère atteint":"Repère : "+(Number(stats.target)||4)+" séances/semaine"}
        fill={stats.monthCount/targetMonth*100}/>
      <Stat icon={Weight} name="Poids" value={latestWeight?numberLabel(latestWeight.weight)+" kg":"—"}
        helper={delta==null?"À renseigner dans le bilan":(delta>0?"+":"")+numberLabel(delta)+" kg"}
        accent={delta!=null&&delta<0}/>
      <Stat icon={BedDouble} name="Sommeil moyen" value={sleep!=null?numberLabel(sleep)+" h":"—"}
        helper={recentSleep.length?recentSleep.length+" nuit(s) enregistrée(s)":"Aucun bilan récent"}/>
      <Stat icon={Zap} name="Énergie" value={energy?energy+" / 10":"—"}
        helper={checkins.length?shortDate(checkins[0].date):"À renseigner"} fill={energy?energy*10:null}/>
      <Stat icon={Trophy} name="Podiums" value={String(medals)} helper="Résultats enregistrés"/>
    </section>
    <div className="kl2-mobile-cta"><button type="button" onClick={()=>open("session")}><Play size={18} fill="currentColor"/> Démarrer une séance</button>
      <div className="kl2-today">
        <div><CalendarDays size={18}/><strong>Prochaine séance</strong></div>
        <button type="button" onClick={()=>planned?navigate("legacy"):open("session")}><Activity size={24}/><span><strong>{planned?(planned.title||"Entraînement prévu"):"Prêt pour ta prochaine séance"}</strong>
        <small>{planned?shortDate(planned.date)+(planned.time?" · "+planned.time:""):"Enregistre ton prochain entraînement"}</small></span><ChevronRight size={17}/></button>
      </div>
      <MobileActions navigate={navigate}/>
    </div>
    <div className="kl2-grid">
      <Section className="kl2-log" icon={CalendarDays} title="Dernières séances"
        action={<TextAction onClick={()=>navigate("training")}>Voir tout</TextAction>}>
        {recent.length?recent.map(s=><button key={s.id} className="kl2-session-row" type="button" onClick={()=>s.legacy?navigate("legacy"):edit("session",s)}>
          <span className="kl2-session-type">{/bo|arme/i.test(s.category)?<Swords size={20}/>: /cardio|physique|mobilité/i.test(s.category)?<Dumbbell size={19}/>:<Activity size={20}/>}</span>
          <span className="kl2-session-text"><strong>{s.title||s.category}</strong><small>{shortDate(s.date)} · {s.duration?hoursLabel(Number(s.duration)):"Durée non précisée"}</small></span>
          <CheckCircle2 size={16} className="kl2-success"/>
        </button>):
        <Empty text="Tes dernières séances s'afficheront ici" action={<button className="kl2-small-cta" onClick={()=>open("session")}>+ Ajouter une séance</button>}/>}
      </Section>
      <Section className="kl2-comp" icon={Trophy} title="Préparation compétition"
        action={<TextAction onClick={()=>navigate("competition")}>Programme</TextAction>}>
        <div className="kl2-competition-label"><strong>{nearest?.name||"WKC Orlando 2027"}</strong><span>J-{remaining}</span></div>
        <div className="kl2-checklist">
          {[[stats.weekCount>=stats.target,"Objectif d'entraînement de la semaine"],
            [hasKata,"Pratique technique kata"],
            [hasBo,"Pratique du bo et des armes"],
            [todayReady,"Bilan forme du jour"],
            [data.goals.length>0,"Objectifs de préparation définis"]].map(([done,title],i)=>
              <div key={i}>{done?<CheckCircle2 size={15} className="kl2-success"/>:<Circle size={15}/>}<span>{title}</span></div>)}
        </div>
        <div className="kl2-roadmap">
          {["Construction","Intensification","Spécifique","Affûtage"].map((phase,i)=><div key={phase}>
            <span className={remaining<=[365,180,90,28][i]?"is-current":""}/><small>{phase}</small></div>)}
        </div>
        <p className="kl2-smallnote">Phases indicatives à personnaliser avec ton entraîneur.</p>
      </Section>
      <Section className="kl2-library" icon={Play} title="Bibliothèque technique"
        action={<TextAction onClick={()=>navigate("technique")}>Voir tout</TextAction>}>
        <div className="kl2-media-grid">
          <Slot icon={Activity} title="Katas" img={KATA} onClick={()=>navigate("technique")}/>
          <Slot icon={Swords} title="Bo / armes" img={MARTIAL} onClick={()=>navigate("technique")} tone="kl2-bo"/>
          <Slot icon={Video} title="Corrections vidéo" img={HERO} onClick={()=>navigate("technique")} tone="kl2-video"/>
          <Slot icon={NotebookPen} title="Notes coach" onClick={()=>navigate("technique")} tone="kl2-notes"/>
        </div>
      </Section>
      <Section className="kl2-health" icon={HeartPulse} title="Santé & récupération"
        action={<TextAction onClick={()=>navigate("health")}>Détails</TextAction>}>
        <div className="kl2-health-grid">
          <button type="button" onClick={()=>navigate("health")}><ShieldCheck size={18}/><small>Gênes suivies</small>
            <strong>{activeInjuries+ (Array.isArray(oldHealth)?oldHealth.length:0)}</strong></button>
          <button type="button" onClick={()=>open("checkin")}><Moon size={18}/><small>Sommeil</small>
            <strong>{sleep!=null?numberLabel(sleep)+" h":"—"}</strong></button>
          <button type="button" onClick={()=>navigate("training")}><Flame size={18}/><small>Charge (7 j)</small><strong>{stats.weekLoad||"—"}</strong></button>
          <button type="button" onClick={()=>open("checkin")}><HeartPulse size={18}/><small>Douleur</small><strong>{pain!=null?pain+" / 10":"—"}</strong></button>
        </div>
      </Section>
      <Section className="kl2-analytics" icon={ChartNoAxesCombined} title="Statistiques"
        action={<TextAction onClick={()=>navigate("analytics")}>Explorer</TextAction>}>
        <div className="kl2-analytics-grid">
          <div className="kl2-chart-col"><div className="kl2-chart-label"><span>Volume d'entraînement (7 j)</span><strong>{hoursLabel(stats.weekMinutes)}</strong></div>
            <WeekBars sessions={sessions}/></div>
          <div className="kl2-chart-col kl2-chart-weight"><div className="kl2-chart-label"><span>Évolution du poids</span><strong>{latestWeight?numberLabel(latestWeight.weight)+" kg":"—"}</strong></div>
            <WeightLine checkins={checkins}/></div>
          <div className="kl2-meter-col"><span>Indice de forme</span><CircleMeter score={formScore}/><small>Indicateur personnel, non médical</small></div>
        </div>
      </Section>
      <Section className="kl2-family" icon={Users} title="Espace famille"
        action={<TextAction onClick={()=>navigate("family")}>Voir tout</TextAction>}>
        <div className="kl2-family-list">{profiles.map((p,i)=><button type="button" onClick={()=>switchProfile(p.id)} key={p.id}>
          <span className={"kl2-family-avatar kl2-family-avatar-"+(i%4)}>{(p.nom||"?").slice(0,1)}</span>
          <span><strong>{p.nom}</strong><small>{p.type||"Athlète"}</small></span><ChevronRight size={13}/>
        </button>)}</div>
      </Section>
      <Section className="kl2-priorities" icon={Target} title="Priorités de la semaine"
        action={<TextAction onClick={()=>navigate("goals")}>Mes objectifs</TextAction>}>
        <div className="kl2-priorities-list">{suggestions.slice(0,4).map((s,i)=><button type="button" key={i} onClick={()=>s.kind==="checkin"?open("checkin"):open("session")}>
          <Circle size={16}/><span><strong>{s.title}</strong><small>{s.detail}</small></span></button>)}</div>
        <div className="kl2-karate-ring" aria-hidden="true"><Swords size={53}/></div>
      </Section>
    </div>
    <div className="kl2-footnote"><Sparkles size={13}/> Des données réelles : les indicateurs sont calculés à partir de ton historique, sans valeurs de démonstration.</div>
  </div>;
}
