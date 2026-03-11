import React, { useState, useEffect, useMemo } from "react";
import {
  Dumbbell,
  Clock,
  PlusCircle,
  Video,
  List,
  CalendarDays,
  Wand2,
} from "lucide-react";

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const DAY_TYPES = [
  "repos",
  "kata",
  "kata arme",
  "auto-défense",
  "bâton",
  "couteau",
  "fusil",
  "combat",
  "positions",
  "coups techniques",
  "renforcement jambes",
  "renforcement abdos",
  "rapidité",
  "mobilité",
  "cardio",
  "mixte",
];

const WEEK_FOCUS = [
  "Passage de ceinture",
  "Préparation compétition",
  "Kata",
  "Kata armé",
  "Auto-défense",
  "Combat",
  "Renforcement",
  "Récupération",
  "Technique générale",
];

const WEEK_TEMPLATES = {
  ceinture: {
    nom: "Modèle – Passage de ceinture",
    focus: "Passage de ceinture",
    days: [
      { jour: "Lundi", type: "kata", duree: 30, techniqueIds: [], notes: "Travail du kata principal" },
      { jour: "Mardi", type: "auto-défense", duree: 35, techniqueIds: [], notes: "Travail technique + précision" },
      { jour: "Mercredi", type: "repos", duree: 0, techniqueIds: [], notes: "Repos / étirements légers" },
      { jour: "Jeudi", type: "kata", duree: 30, techniqueIds: [], notes: "Kata lent puis rapide" },
      { jour: "Vendredi", type: "positions", duree: 30, techniqueIds: [], notes: "Stances, stabilité, transitions" },
      { jour: "Samedi", type: "renforcement jambes", duree: 25, techniqueIds: [], notes: "Squats, fentes, gainage jambes" },
      { jour: "Dimanche", type: "rapidité", duree: 20, techniqueIds: [], notes: "Explosivité et vitesse de réaction" },
    ],
  },

  competition: {
    nom: "Modèle – Préparation compétition",
    focus: "Préparation compétition",
    days: [
      { jour: "Lundi", type: "combat", duree: 35, techniqueIds: [], notes: "Déplacements, entrées, timing" },
      { jour: "Mardi", type: "rapidité", duree: 25, techniqueIds: [], notes: "Vitesse des bras et jambes" },
      { jour: "Mercredi", type: "mobilité", duree: 20, techniqueIds: [], notes: "Mobilité active et récupération" },
      { jour: "Jeudi", type: "combat", duree: 35, techniqueIds: [], notes: "Simulation de rounds / enchaînements" },
      { jour: "Vendredi", type: "coups techniques", duree: 30, techniqueIds: [], notes: "Précision et efficacité" },
      { jour: "Samedi", type: "cardio", duree: 25, techniqueIds: [], notes: "Conditionnement et rythme combat" },
      { jour: "Dimanche", type: "repos", duree: 0, techniqueIds: [], notes: "Repos complet" },
    ],
  },

  kata: {
    nom: "Modèle – Focus Kata",
    focus: "Kata",
    days: [
      { jour: "Lundi", type: "kata", duree: 35, techniqueIds: [], notes: "Apprentissage / mémorisation" },
      { jour: "Mardi", type: "positions", duree: 25, techniqueIds: [], notes: "Stabilité et enracinement" },
      { jour: "Mercredi", type: "repos", duree: 0, techniqueIds: [], notes: "Repos" },
      { jour: "Jeudi", type: "kata", duree: 35, techniqueIds: [], notes: "Rythme, puissance, kime" },
      { jour: "Vendredi", type: "coups techniques", duree: 25, techniqueIds: [], notes: "Qualité technique des mouvements" },
      { jour: "Samedi", type: "renforcement jambes", duree: 25, techniqueIds: [], notes: "Cuisses, fentes, maintien" },
      { jour: "Dimanche", type: "rapidité", duree: 20, techniqueIds: [], notes: "Vitesse d’exécution" },
    ],
  },

  kataArme: {
    nom: "Modèle – Focus Kata armé",
    focus: "Kata armé",
    days: [
      { jour: "Lundi", type: "kata arme", duree: 35, techniqueIds: [], notes: "Travail du kata armé principal" },
      { jour: "Mardi", type: "bâton", duree: 30, techniqueIds: [], notes: "Manipulations et trajectoires" },
      { jour: "Mercredi", type: "repos", duree: 0, techniqueIds: [], notes: "Repos" },
      { jour: "Jeudi", type: "kata arme", duree: 35, techniqueIds: [], notes: "Répétition avec intensité" },
      { jour: "Vendredi", type: "positions", duree: 25, techniqueIds: [], notes: "Déplacements et stabilité" },
      { jour: "Samedi", type: "renforcement abdos", duree: 20, techniqueIds: [], notes: "Gainage / tronc" },
      { jour: "Dimanche", type: "rapidité", duree: 20, techniqueIds: [], notes: "Coordination et vitesse" },
    ],
  },

  recovery: {
    nom: "Modèle – Récupération technique",
    focus: "Récupération",
    days: [
      { jour: "Lundi", type: "mobilité", duree: 20, techniqueIds: [], notes: "Ouverture hanches / dos / épaules" },
      { jour: "Mardi", type: "auto-défense", duree: 20, techniqueIds: [], notes: "Travail léger, sans intensité" },
      { jour: "Mercredi", type: "repos", duree: 0, techniqueIds: [], notes: "Repos complet" },
      { jour: "Jeudi", type: "kata", duree: 20, techniqueIds: [], notes: "Rythme léger, sans forcer" },
      { jour: "Vendredi", type: "positions", duree: 20, techniqueIds: [], notes: "Stabilité douce" },
      { jour: "Samedi", type: "renforcement abdos", duree: 15, techniqueIds: [], notes: "Stabilité / gainage" },
      { jour: "Dimanche", type: "mobilité", duree: 20, techniqueIds: [], notes: "Étirements et relâchement" },
    ],
  },
};

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function startOfCurrentWeekISO() {
  const now = new Date();
  const day = now.getDay(); // 0 dimanche, 1 lundi
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().split("T")[0];
}

function addDaysToISO(isoDate, daysToAdd) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split("T")[0];
}

function normalizeCategory(cat = "") {
  return cat.toLowerCase().trim();
}

export default function HomeTrainingView({ activeProfile }) {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showWeekBuilder, setShowWeekBuilder] = useState(false);

  const [form, setForm] = useState({
    objectif: "ceinture",
    duree: 30,
    materiel: "Aucun",
    intensite: "Moyenne",
    type: "",
    notes: "",
    lien: "",
  });

  const [weeklyPlan, setWeeklyPlan] = useState({
    id: null,
    nom: "Semaine type",
    focus: "Passage de ceinture",
    weekStart: startOfCurrentWeekISO(),
    days: DAYS.map((jour) => ({
      jour,
      type: "repos",
      duree: 30,
      techniqueIds: [],
      notes: "",
    })),
  });

  // === Gestion localStorage par profil ===
  const storageKey = activeProfile
    ? `karate_home_training_${activeProfile.id}`
    : "karate_home_training_default";

  const weeklyPlanKey = activeProfile
    ? `karate_home_training_weekly_${activeProfile.id}`
    : "karate_home_training_weekly_default";

  const techniquesKey = activeProfile
    ? `karate_techniques_${activeProfile.id}`
    : "karate_techniques_default";

  const [techniques, setTechniques] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setSessions(Array.isArray(saved) ? saved : []);
  }, [activeProfile, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  useEffect(() => {
    const savedWeek = JSON.parse(localStorage.getItem(weeklyPlanKey) || "null");
    if (savedWeek && savedWeek.days) {
      setWeeklyPlan(savedWeek);
    } else {
      setWeeklyPlan({
        id: null,
        nom: "Semaine type",
        focus: "Passage de ceinture",
        weekStart: startOfCurrentWeekISO(),
        days: DAYS.map((jour) => ({
          jour,
          type: "repos",
          duree: 30,
          techniqueIds: [],
          notes: "",
        })),
      });
    }
  }, [activeProfile, weeklyPlanKey]);

  useEffect(() => {
    localStorage.setItem(weeklyPlanKey, JSON.stringify(weeklyPlan));
  }, [weeklyPlan, weeklyPlanKey]);

  useEffect(() => {
    const savedTechniques = JSON.parse(localStorage.getItem(techniquesKey) || "[]");
    setTechniques(Array.isArray(savedTechniques) ? savedTechniques : []);
  }, [activeProfile, techniquesKey]);

  // === Filtrage technique selon le type du jour ===
  const getTechniquesForType = (type) => {
    const t = normalizeCategory(type);

    return techniques.filter((tech) => {
      const cat = normalizeCategory(tech.categorie);

      if (t === "kata") return cat === "kata";
      if (t === "kata arme") return cat === "kata armé" || cat === "kata arme";
      if (t === "auto-défense") return cat === "auto-défense" || cat === "autodéfense";
      if (t === "bâton") return cat === "bâton" || cat === "baton";
      if (t === "couteau") return cat === "couteau";
      if (t === "fusil") return cat === "fusil";
      if (t === "combat") return cat === "combat";
      if (t === "positions") return cat === "blocking form" || cat === "punch" || cat === "kick";
      if (t === "coups techniques") return cat === "punch" || cat === "kick" || cat === "combat";
      return false;
    });
  };

  const getTechniqueNameById = (id) => {
    return techniques.find((t) => t.id === id)?.nom || "Technique";
  };

  // === Génération automatique du programme simple ===
  const generateProgram = () => {
    const base = form.objectif;
    const generated = [];

    if (base === "ceinture") {
      generated.push(
        { type: "Kihon – techniques de base", duree: 10, notes: "Concentrer sur précision" },
        { type: "Kata – révision du kata principal", duree: 10, notes: "Répétition lente puis rapide" },
        { type: "Renforcement jambes", duree: 10, notes: "Squats, fentes, stabilité" }
      );
    } else if (base === "competition") {
      generated.push(
        { type: "Shadow fight / combat libre", duree: 15, notes: "Mouvements fluides et combos" },
        { type: "Travail explosif", duree: 10, notes: "Burpees, kicks rapides, transitions" },
        { type: "Kata ou arme au choix", duree: 5, notes: "Finition de performance" }
      );
    } else if (base === "renforcement") {
      generated.push(
        { type: "Pompes + squats + abdos", duree: 15, notes: "Corps complet sans matériel" },
        { type: "Élastique ou haltères", duree: 10, notes: "Biceps, épaules, triceps" },
        { type: "Gainage / planche", duree: 5, notes: "3 x 1 min" }
      );
    }

    const total = generated.reduce((sum, g) => sum + g.duree, 0);

    setSessions((prev) => [
      ...prev,
      {
        id: Date.now(),
        profilId: activeProfile?.id || "default",
        objectif: form.objectif,
        dureeTotale: total,
        materiel: form.materiel,
        intensite: form.intensite,
        programme: generated,
        date: todayIso(),
        statut: "planifié",
        source: "auto",
      },
    ]);
  };

  // === Ajout manuel ===
  const addManualSession = () => {
    if (!form.type) return alert("Indique au moins le type d'entraînement !");
    const newSession = {
      id: Date.now(),
      profilId: activeProfile?.id || "default",
      type: form.type,
      duree: parseInt(form.duree, 10),
      intensite: form.intensite,
      notes: form.notes,
      lien: form.lien,
      date: todayIso(),
      statut: "planifié",
      source: "manuel",
    };
    setSessions((prev) => [...prev, newSession]);
    setForm({
      objectif: "ceinture",
      duree: 30,
      materiel: "Aucun",
      intensite: "Moyenne",
      type: "",
      notes: "",
      lien: "",
    });
    setShowForm(false);
  };

  // === Mise à jour plan hebdo ===
  const updateWeeklyDay = (index, field, value) => {
    setWeeklyPlan((prev) => {
      const nextDays = [...prev.days];
      nextDays[index] = {
        ...nextDays[index],
        [field]: value,
      };

      // Si on change le type, on vide les techniques choisies
      if (field === "type") {
        nextDays[index].techniqueIds = [];
      }

      return {
        ...prev,
        days: nextDays,
      };
    });
  };

  const toggleTechniqueForDay = (dayIndex, techniqueId) => {
    setWeeklyPlan((prev) => {
      const nextDays = [...prev.days];
      const currentIds = nextDays[dayIndex].techniqueIds || [];
      const exists = currentIds.includes(techniqueId);

      nextDays[dayIndex] = {
        ...nextDays[dayIndex],
        techniqueIds: exists
          ? currentIds.filter((id) => id !== techniqueId)
          : [...currentIds, techniqueId],
      };

      return {
        ...prev,
        days: nextDays,
      };
    });
  };

  // === Générer les séances à partir du plan hebdo ===
  const applyWeekTemplate = (templateKey) => {
    const template = WEEK_TEMPLATES[templateKey];
    if (!template) return;

    setWeeklyPlan((prev) => ({
      ...prev,
      nom: template.nom,
      focus: template.focus,
      weekStart: prev.weekStart || startOfCurrentWeekISO(),
      days: template.days.map((d) => ({
        ...d,
        techniqueIds: d.techniqueIds || [],
      })),
    }));
  };

  const generateSessionsFromWeeklyPlan = () => {
    const baseDate = weeklyPlan.weekStart || startOfCurrentWeekISO();

    const generatedSessions = weeklyPlan.days
      .map((day, index) => {
        const sessionDate = addDaysToISO(baseDate, index);

        if (day.type === "repos") {
          return {
            id: Date.now() + index,
            profilId: activeProfile?.id || "default",
            date: sessionDate,
            type: "repos",
            duree: 0,
            intensite: "Faible",
            notes: day.notes || "Repos",
            statut: "planifié",
            source: "plan-hebdo",
            focus: weeklyPlan.focus,
            dayLabel: day.jour,
            techniqueIds: [],
          };
        }

        return {
          id: Date.now() + index,
          profilId: activeProfile?.id || "default",
          date: sessionDate,
          type: day.type,
          duree: parseInt(day.duree, 10) || 30,
          intensite: "Moyenne",
          notes: day.notes || "",
          statut: "planifié",
          source: "plan-hebdo",
          focus: weeklyPlan.focus,
          dayLabel: day.jour,
          techniqueIds: day.techniqueIds || [],
          techniquesNoms: (day.techniqueIds || []).map(getTechniqueNameById),
        };
      });

    setSessions((prev) => [...prev, ...generatedSessions]);
    alert("✅ Les séances de la semaine ont été générées.");
  };

  const updateSessionStatus = (id, statut) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, statut } : s))
    );
  };

  const deleteSession = (id) => {
    if (window.confirm("Supprimer cette séance ?")) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const sessionsThisWeek = useMemo(() => {
    return [...sessions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [sessions]);

  return (
    <div className="p-6 text-gray-800 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-red-600">
        <Dumbbell /> Entraînement maison
      </h1>

      {/* === Boutons d’action === */}
      <div className="flex flex-wrap gap-3">
        <button
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
          onClick={generateProgram}
        >
          ⚙️ Générer un programme automatique
        </button>

        <button
          className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm"
          onClick={() => setShowWeekBuilder((v) => !v)}
        >
          <CalendarDays size={16} className="inline mr-1" />
          Programme hebdomadaire
        </button>

        <button
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          <PlusCircle size={16} className="inline mr-1" />
          Ajouter une séance manuelle
        </button>
      </div>

      {/* === Construction programme hebdomadaire === */}
      {showWeekBuilder && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="border rounded p-2 text-sm flex-1"
              placeholder="Nom du programme"
              value={weeklyPlan.nom}
              onChange={(e) =>
                setWeeklyPlan((prev) => ({ ...prev, nom: e.target.value }))
              }
            />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyWeekTemplate("ceinture")}
              className="px-3 py-2 rounded text-sm bg-white border hover:bg-red-50"
            >
              🥋 Modèle ceinture
            </button>

            <button
              type="button"
              onClick={() => applyWeekTemplate("competition")}
              className="px-3 py-2 rounded text-sm bg-white border hover:bg-red-50"
            >
              🏆 Modèle compétition
            </button>

            <button
              type="button"
              onClick={() => applyWeekTemplate("kata")}
              className="px-3 py-2 rounded text-sm bg-white border hover:bg-red-50"
            >
              🧭 Modèle kata
            </button>

            <button
              type="button"
              onClick={() => applyWeekTemplate("kataArme")}
              className="px-3 py-2 rounded text-sm bg-white border hover:bg-red-50"
            >
              🦯 Modèle kata armé
            </button>

            <button
              type="button"
              onClick={() => applyWeekTemplate("recovery")}
              className="px-3 py-2 rounded text-sm bg-white border hover:bg-red-50"
            >
              💆 Modèle récupération
            </button>
          </div>
          
            <select
              className="border rounded p-2 text-sm flex-1"
              value={weeklyPlan.focus}
              onChange={(e) =>
                setWeeklyPlan((prev) => ({ ...prev, focus: e.target.value }))
              }
            >
              {WEEK_FOCUS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>

            <input
              type="date"
              className="border rounded p-2 text-sm"
              value={weeklyPlan.weekStart}
              onChange={(e) =>
                setWeeklyPlan((prev) => ({ ...prev, weekStart: e.target.value }))
              }
            />
          </div>

          <div className="space-y-4">
            {weeklyPlan.days.map((day, index) => {
              const availableTechniques = getTechniquesForType(day.type);

              return (
                <div
                  key={day.jour}
                  className="border rounded-lg bg-white p-4 space-y-3"
                >
                  <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <div className="font-semibold text-red-600 w-28">
                      {day.jour}
                    </div>

                    <select
                      className="border rounded p-2 text-sm flex-1"
                      value={day.type}
                      onChange={(e) =>
                        updateWeeklyDay(index, "type", e.target.value)
                      }
                    >
                      {DAY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0"
                      className="border rounded p-2 text-sm w-28"
                      value={day.duree}
                      onChange={(e) =>
                        updateWeeklyDay(index, "duree", e.target.value)
                      }
                      placeholder="Durée"
                    />
                  </div>

                  {day.type !== "repos" && (
                    <>
                      <textarea
                        className="border rounded p-2 text-sm w-full"
                        rows={2}
                        placeholder="Notes / consignes pour ce jour"
                        value={day.notes}
                        onChange={(e) =>
                          updateWeeklyDay(index, "notes", e.target.value)
                        }
                      />

                      {availableTechniques.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Techniques liées depuis la base technique :
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {availableTechniques.map((tech) => {
                              const selected = day.techniqueIds.includes(tech.id);
                              return (
                                <button
                                  key={tech.id}
                                  type="button"
                                  onClick={() =>
                                    toggleTechniqueForDay(index, tech.id)
                                  }
                                  className={`px-2 py-1 rounded-full text-xs border ${
                                    selected
                                      ? "bg-red-100 border-red-400 text-red-700"
                                      : "bg-white border-gray-300 text-gray-700"
                                  }`}
                                >
                                  {tech.nom}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700"
              onClick={generateSessionsFromWeeklyPlan}
            >
              <Wand2 size={16} className="inline mr-1" />
              Générer les séances de la semaine
            </button>
          </div>
        </div>
      )}

      {/* === Formulaire création manuelle === */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <select
            className="border p-2 rounded w-full"
            value={form.objectif}
            onChange={(e) => setForm({ ...form, objectif: e.target.value })}
          >
            <option value="ceinture">🥋 Passage de ceinture</option>
            <option value="competition">🏆 Préparation compétition</option>
            <option value="renforcement">💥 Renforcement spécifique</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded p-2 text-sm"
              type="number"
              min="5"
              placeholder="Durée (min)"
              value={form.duree}
              onChange={(e) => setForm({ ...form, duree: e.target.value })}
            />
            <input
              className="border rounded p-2 text-sm"
              placeholder="Matériel"
              value={form.materiel}
              onChange={(e) => setForm({ ...form, materiel: e.target.value })}
            />
          </div>

          <select
            className="border p-2 rounded w-full text-sm"
            value={form.intensite}
            onChange={(e) => setForm({ ...form, intensite: e.target.value })}
          >
            <option>Faible</option>
            <option>Moyenne</option>
            <option>Forte</option>
          </select>

          <input
            className="border rounded p-2 text-sm w-full"
            placeholder="Type d'entraînement (ex : Kicks, Pompes...)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <input
            className="border rounded p-2 text-sm w-full"
            placeholder="Lien vidéo / fiche technique (optionnel)"
            value={form.lien}
            onChange={(e) => setForm({ ...form, lien: e.target.value })}
          />
          <textarea
            className="border rounded p-2 text-sm w-full"
            placeholder="Notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button
            className="bg-green-600 text-white text-sm px-4 py-2 rounded w-full hover:bg-green-700"
            onClick={addManualSession}
          >
            💾 Enregistrer la séance
          </button>
        </div>
      )}

      {/* === Liste des séances === */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <List size={16} /> Séances enregistrées
        </h2>

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            Aucune séance enregistrée.
          </p>
        ) : (
          <div className="space-y-3">
            {sessionsThisWeek.map((s) => (
              <div
                key={s.id}
                className="border rounded p-3 hover:bg-gray-50 transition text-sm"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {s.objectif
                        ? `🎯 ${s.objectif}`
                        : s.type === "repos"
                        ? "🛌 Repos"
                        : s.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.date} — {s.duree || s.dureeTotale || 0} min
                      {s.intensite ? ` · ${s.intensite}` : ""}
                      {s.focus ? ` · Focus : ${s.focus}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      className={`text-xs px-2 py-1 rounded ${
                        s.statut === "fait"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => updateSessionStatus(s.id, "fait")}
                    >
                      ✅ Fait
                    </button>
                    <button
                      className={`text-xs px-2 py-1 rounded ${
                        s.statut === "en cours"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => updateSessionStatus(s.id, "en cours")}
                    >
                      🕓 En cours
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => deleteSession(s.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {Array.isArray(s.techniquesNoms) && s.techniquesNoms.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Techniques / éléments à travailler :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.techniquesNoms.map((name, idx) => (
                        <span
                          key={`${name}-${idx}`}
                          className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.programme && (
                  <ul className="mt-2 ml-3 list-disc text-xs text-gray-700">
                    {s.programme.map((p, i) => (
                      <li key={i}>
                        {p.type} — {p.duree} min
                        {p.notes && (
                          <span className="italic text-gray-500">
                            {" "}
                            · {p.notes}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {s.lien && (
                  <a
                    href={s.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline mt-1 text-xs"
                  >
                    <Video size={12} /> Voir la ressource
                  </a>
                )}

                {s.notes && !s.programme && (
                  <p className="text-xs text-gray-600 mt-1 italic">{s.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}