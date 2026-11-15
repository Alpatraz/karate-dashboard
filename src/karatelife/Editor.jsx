import React, { useState } from "react";
import { X, Save, Info } from "lucide-react";
import { CATEGORIES, LEVELS, isoDate } from "./core";

const titles = {
  session: "Séance d'entraînement",
  checkin: "Bilan forme",
  technique: "Fiche technique",
  competition: "Compétition",
  injury: "Suivi santé",
  goal: "Objectif sportif",
  profile: "Profil athlète"
};

function Field({ label, children, hint, full = false }) {
  return <label className={"kl-form-field" + (full ? " kl-form-full" : "")}>
    <span>{label}</span>{children}{hint && <small>{hint}</small>}
  </label>;
}
function NumberField({ label, name, form, set, min, max, step = "1", hint }) {
  return <Field label={label} hint={hint}><input type="number" inputMode="decimal"
    value={form[name] ?? ""} onChange={e => set(name, e.target.value)}
    min={min} max={max} step={step} /></Field>;
}
function SelectField({ label, name, form, set, options }) {
  return <Field label={label}><select value={form[name] ?? options[0]} onChange={e => set(name, e.target.value)}>
    {options.map(v => <option key={v} value={v}>{v}</option>)}
  </select></Field>;
}
function TextField({ label, name, form, set, type = "text", full = false, placeholder = "", required = false, hint = "" }) {
  return <Field label={label} full={full} hint={hint}><input type={type}
    value={form[name] ?? ""} placeholder={placeholder} required={required}
    onChange={e => set(name, e.target.value)} /></Field>;
}
function AreaField({ label, name, form, set, placeholder = "" }) {
  return <Field label={label} full><textarea value={form[name] ?? ""} rows="3" placeholder={placeholder}
    onChange={e => set(name, e.target.value)} /></Field>;
}
function ScaleField({ label, name, form, set, min = 0, max = 10, hint }) {
  const v = Number(form[name] ?? 5);
  return <Field label={label} full hint={hint}>
    <div className="kl-scale"><input type="range" min={min} max={max} step="1" value={v}
      onChange={e => set(name, e.target.value)} /><strong>{v} / {max}</strong></div>
  </Field>;
}

export default function Editor({ modal, onClose, onSave }) {
  const type = modal.type;
  const initial = {
    session: { date: isoDate(), category: "Kata", title: "", duration: "60", rpe: "5", quality: "7", notes: "", videoUrl: "" },
    checkin: { date: isoDate(), sleep: "7.5", energy: "7", stress: "3", pain: "0", motivation: "7", weight: "", notes: "" },
    technique: { title: "", category: "Kata", level: "En apprentissage", score: "2", targetScore: "5", reviewDate: "", videoUrl: "", notes: "" },
    competition: { name: "", date: "", endDate: "", location: "", category: "Kata", status: "À venir", result: "", objectives: "", notes: "" },
    injury: { location: "", date: isoDate(), status: "À surveiller", pain: "2", notes: "" },
    goal: { title: "", metricType: "sessions", target: "4", current: "0", deadline: "", status: "En cours", notes: "" },
    profile: { nom: "", type: "Adulte", club: "", discipline: "", actif: false }
  };
  const [form, setForm] = useState({ ...(initial[type] || {}), ...(modal.item || {}) });
  const [error, setError] = useState("");
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  function submit(e) {
    e.preventDefault();
    if ((type === "session" && !form.date) || (type === "competition" && !form.name?.trim())
      || (type === "technique" && !form.title?.trim())
      || (type === "injury" && !form.location?.trim())
      || (type === "goal" && !form.title?.trim())
      || (type === "profile" && !form.nom?.trim())) {
      setError("Vérifie les champs obligatoires."); return;
    }
    if (type === "session" && (Number(form.duration) < 1 || Number(form.duration) > 600)) {
      setError("La durée doit être comprise entre 1 et 600 minutes."); return;
    }
    if (type === "checkin" && (Number(form.sleep) < 0 || Number(form.sleep) > 24)) {
      setError("Indique un sommeil compris entre 0 et 24 heures."); return;
    }
    if (type === "competition" && form.endDate && form.date && form.endDate < form.date) {
      setError("La date de fin doit être après le début."); return;
    }
    onSave(type, form);
  }
  return <div className="kl-dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="kl-dialog" role="dialog" aria-modal="true" aria-label={titles[type]}>
      <header className="kl-dialog-top">
        <div><div className="kl-eyebrow">KARATÉ LIFE / SAISIE</div>
          <h2>{modal.item ? "Modifier · " : "Ajouter · "}{titles[type]}</h2></div>
        <button type="button" className="kl-icon-button" aria-label="Fermer" onClick={onClose}><X size={20} /></button>
      </header>
      <form onSubmit={submit} className="kl-dialog-form">
        <div className="kl-form-grid">
          {type === "session" && <>
            <TextField label="Date de la séance" name="date" type="date" form={form} set={set} required />
            <SelectField label="Discipline" name="category" form={form} set={set} options={CATEGORIES} />
            <TextField label="Nom / contenu" name="title" form={form} set={set} placeholder="Ex. Bo — kata de compétition" full />
            <NumberField label="Durée (minutes)" name="duration" form={form} set={set} min="1" max="600" />
            <NumberField label="Intensité RPE /10" name="rpe" form={form} set={set} min="1" max="10" hint="1 = très facile, 10 = effort maximal" />
            <ScaleField label="Qualité technique ressentie" name="quality" form={form} set={set} />
            <TextField label="Lien vidéo (facultatif)" name="videoUrl" type="url" form={form} set={set} full placeholder="https://..." />
            <AreaField label="Points travaillés, corrections et prochaine priorité" name="notes" form={form} set={set} placeholder="Ce qui s'améliore, ce qui reste à corriger..." />
          </>}
          {type === "checkin" && <>
            <TextField label="Date" name="date" type="date" form={form} set={set} required />
            <NumberField label="Sommeil (heures)" name="sleep" form={form} set={set} min="0" max="24" step="0.25" />
            <ScaleField label="Énergie" name="energy" form={form} set={set} min={1} />
            <ScaleField label="Motivation" name="motivation" form={form} set={set} min={1} />
            <ScaleField label="Stress ressenti" name="stress" form={form} set={set} hint="0 = aucun stress" />
            <ScaleField label="Douleur / gêne" name="pain" form={form} set={set} hint="0 = aucune douleur. Ce suivi n'est pas un avis médical." />
            <NumberField label="Poids (kg, facultatif)" name="weight" form={form} set={set} min="10" max="300" step="0.1" />
            <AreaField label="Ressenti / récupération" name="notes" form={form} set={set} placeholder="Fatigue, sommeil, mobilité, état d'esprit..." />
          </>}
          {type === "technique" && <>
            <TextField label="Nom du kata / mouvement" name="title" form={form} set={set} full required placeholder="Ex. Kata de bo compétition" />
            <SelectField label="Discipline" name="category" form={form} set={set} options={CATEGORIES} />
            <SelectField label="Niveau actuel" name="level" form={form} set={set} options={LEVELS} />
            <ScaleField label="Niveau technique actuel" name="score" form={form} set={set} min={0} max={5} hint="Notation personnelle de 0 à 5" />
            <TextField label="Prochaine révision" name="reviewDate" form={form} set={set} type="date" />
            <TextField label="Lien vidéo" name="videoUrl" type="url" form={form} set={set} full placeholder="https://..." />
            <AreaField label="Corrections et points de vigilance" name="notes" form={form} set={set} placeholder="Stabilité, précision, puissance, regard, rythme..." />
          </>}
          {type === "competition" && <>
            <TextField label="Compétition" name="name" form={form} set={set} full required />
            <TextField label="Date de début" name="date" form={form} set={set} type="date" />
            <TextField label="Date de fin" name="endDate" form={form} set={set} type="date" />
            <TextField label="Lieu" name="location" form={form} set={set} full placeholder="Ville, province / pays" />
            <TextField label="Catégorie" name="category" form={form} set={set} full placeholder="Ex. Armes traditionnelles adulte" />
            <SelectField label="Statut" name="status" form={form} set={set} options={["Objectif", "À venir", "Inscrit", "Terminé"]} />
            <TextField label="Résultat" name="result" form={form} set={set} placeholder="Ex. Bronze, 3e place" />
            <AreaField label="Objectifs de performance" name="objectives" form={form} set={set} placeholder="Ce que je veux démontrer le jour J" />
            <AreaField label="Bilan / commentaires" name="notes" form={form} set={set} />
          </>}
          {type === "injury" && <>
            <TextField label="Zone / nature de la gêne" name="location" form={form} set={set} full required placeholder="Ex. genou gauche" />
            <TextField label="Début" name="date" form={form} set={set} type="date" />
            <SelectField label="Statut" name="status" form={form} set={set} options={["À surveiller", "En cours", "Résolue"]} />
            <ScaleField label="Douleur / gêne ressentie" name="pain" form={form} set={set} />
            <AreaField label="Notes / suivi professionnel" name="notes" form={form} set={set} />
          </>}
          {type === "goal" && <>
            <TextField label="Objectif" name="title" form={form} set={set} full required placeholder="Ex. Répéter mon kata 3 fois par semaine" />
            <SelectField label="Mesure" name="metricType" form={form} set={set} options={["sessions", "minutes", "personnalisé"]} />
            <NumberField label="Cible" name="target" form={form} set={set} min="1" />
            {form.metricType === "personnalisé" && <NumberField label="Valeur actuelle" name="current" form={form} set={set} min="0" />}
            <TextField label="Échéance" name="deadline" type="date" form={form} set={set} />
            <SelectField label="Statut" name="status" form={form} set={set} options={["En cours", "Atteint", "En pause"]} />
            <AreaField label="Plan d'action" name="notes" form={form} set={set} />
          </>}
          {type === "profile" && <>
            <TextField label="Prénom" name="nom" form={form} set={set} full required />
            <SelectField label="Type" name="type" form={form} set={set} options={["Adulte", "Enfant"]} />
            <TextField label="Club" name="club" form={form} set={set} placeholder="Ex. Sunfuki Terrebonne" />
            <TextField label="Discipline principale" name="discipline" form={form} set={set} placeholder="Ex. Kata / Bo" />
          </>}
        </div>
        {error && <div className="kl-form-error" role="alert">{error}</div>}
        <div className="kl-dialog-actions">
          <button type="button" className="kl-btn kl-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="kl-btn kl-btn-gold" type="submit"><Save size={17} /> Enregistrer</button>
        </div>
      </form>
      {type === "checkin" && <p className="kl-form-disclaimer"><Info size={14} /> L'indice de forme est indicatif et ne remplace pas un suivi médical.</p>}
    </section>
  </div>;
}
