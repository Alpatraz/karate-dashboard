import React, { useState, useEffect } from "react";
import { Dumbbell, Clock, PlusCircle, Video, List } from "lucide-react";

export default function HomeTrainingView({ activeProfile }) {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    objectif: "ceinture",
    duree: 30,
    materiel: "Aucun",
    intensite: "Moyenne",
    type: "",
    notes: "",
    lien: "",
  });

  // === Gestion localStorage par profil ===
  const storageKey = activeProfile
    ? `karate_home_training_${activeProfile.id}`
    : "karate_home_training_default";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setSessions(saved);
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  // === Génération automatique du programme ===
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
    setSessions([
      ...sessions,
      {
        id: Date.now(),
        profilId: activeProfile?.id || "default",
        objectif: form.objectif,
        dureeTotale: total,
        materiel: form.materiel,
        intensite: form.intensite,
        programme: generated,
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  // === Ajout manuel ===
  const addManualSession = () => {
    if (!form.type) return alert("Indique au moins le type d'entraînement !");
    const newSession = {
      id: Date.now(),
      type: form.type,
      duree: parseInt(form.duree),
      intensite: form.intensite,
      notes: form.notes,
      lien: form.lien,
      date: new Date().toISOString().split("T")[0],
    };
    setSessions([...sessions, newSession]);
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

  const deleteSession = (id) => {
    if (window.confirm("Supprimer cette séance ?")) {
      setSessions(sessions.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="p-6 text-gray-800 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-red-600">
        <Dumbbell /> Entraînement maison
      </h1>

      {/* === Boutons d’action === */}
      <div className="flex flex-wrap gap-3">
        <button
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
          onClick={() => generateProgram()}
        >
          ⚙️ Générer un programme automatique
        </button>
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle size={16} className="inline mr-1" /> Ajouter une séance manuelle
        </button>
      </div>

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
          <p className="text-gray-500 text-sm italic">Aucune séance enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="border rounded p-3 hover:bg-gray-50 transition text-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {s.objectif ? `🎯 ${s.objectif}` : s.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.date} — {s.duree || s.dureeTotale} min · {s.intensite}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => deleteSession(s.id)}
                  >
                    🗑️
                  </button>
                </div>

                {s.programme && (
                  <ul className="mt-2 ml-3 list-disc text-xs text-gray-700">
                    {s.programme.map((p, i) => (
                      <li key={i}>
                        {p.type} — {p.duree} min
                        {p.notes && <span className="italic text-gray-500"> · {p.notes}</span>}
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
