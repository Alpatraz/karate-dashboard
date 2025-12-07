// src/components/HealthView.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  HeartPulse,
  PlusCircle,
  Trash2,
  Activity,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export default function HealthView({ activeProfile }) {
  const [injuries, setInjuries] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const storageKey = activeProfile
    ? `karate_health_${activeProfile.id}`
    : "karate_health_default";

  // ---- Chargement depuis localStorage quand le profil change ----
  useEffect(() => {
    if (!activeProfile) return;
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setInjuries(Array.isArray(saved) ? saved : []);
  }, [activeProfile]);

  // ---- Sauvegarde à chaque changement ----
  useEffect(() => {
    if (!activeProfile) return;
    localStorage.setItem(storageKey, JSON.stringify(injuries));
  }, [injuries, activeProfile, storageKey]);

  // ---- Sauvegarde avant fermeture / changement d’onglet ----
  useEffect(() => {
    const handleSave = () => {
      if (!activeProfile) return;
      localStorage.setItem(storageKey, JSON.stringify(injuries));
    };
    window.addEventListener("beforeunload", handleSave);
    return () => window.removeEventListener("beforeunload", handleSave);
  }, [injuries, activeProfile, storageKey]);

  // ---- Nouvelle blessure ----
  const [newInjury, setNewInjury] = useState({
    type: "",
    date: "",
    duree: "",
    traitement: "",
    notes: "",
    statut: "En cours", // ou "Guéri"
  });

  const addInjury = () => {
    if (!newInjury.type || !newInjury.date) {
      alert("Type de blessure et date sont requis.");
      return;
    }
    const injury = {
      ...newInjury,
      id: Date.now().toString(),
      profileId: activeProfile?.id || "default",
    };
    setInjuries((prev) => [...prev, injury]);
    setNewInjury({
      type: "",
      date: "",
      duree: "",
      traitement: "",
      notes: "",
      statut: "En cours",
    });
    setShowForm(false);
  };

  const deleteInjury = (id) => {
    if (!window.confirm("Supprimer cette blessure ?")) return;
    setInjuries((prev) => prev.filter((b) => b.id !== id));
  };

  // ---- Utilitaires ----
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return date.toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const toNumber = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  // ---- Statistiques globales ----
  const stats = useMemo(() => {
    const total = injuries.length;

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    let lastYearCount = 0;
    let totalDaysOff = 0;
    const byType = {};

    injuries.forEach((b) => {
      // fréquence par type
      const t = b.type || "Autre";
      byType[t] = (byType[t] || 0) + 1;

      // durée totale d’arrêt
      totalDaysOff += toNumber(b.duree);

      // sur les 12 derniers mois
      if (b.date) {
        const [y, m, d] = b.date.split("-");
        const dObj = new Date(y, m - 1, d, 12, 0, 0);
        if (dObj >= oneYearAgo && dObj <= now) lastYearCount++;
      }
    });

    // type le plus fréquent
    let mostFrequentType = null;
    let maxCount = 0;
    Object.entries(byType).forEach(([t, c]) => {
      if (c > maxCount) {
        maxCount = c;
        mostFrequentType = t;
      }
    });

    return { total, lastYearCount, totalDaysOff, byType, mostFrequentType };
  }, [injuries]);

  if (!activeProfile) {
    return (
      <div className="p-6 text-gray-500">
        Aucun profil actif sélectionné.
      </div>
    );
  }

  // Quelques types préremplis usuels
  const TYPE_PRESETS = [
    "Cheville – entorse",
    "Genou – douleur / blessure",
    "Dos – lombaires",
    "Épaule",
    "Poignet / main",
    "Cou / nuque",
    "Commotion / tête",
    "Autre",
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Titre */}
      <div className="flex items-center gap-3 mb-2">
        <HeartPulse className="text-red-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">
          Santé – {activeProfile.nom}
        </h1>
      </div>
      <p className="text-sm text-gray-500">
        Suivi des blessures, temps d’arrêt et traitements.
      </p>

      {/* --- Cartes de stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="text-red-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">
              Blessures totales
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total}
          </p>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="text-red-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">
              12 derniers mois
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.lastYearCount}
          </p>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="text-red-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">
              Jours d’arrêt cumulés
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalDaysOff}
            <span className="text-base text-gray-500 ml-1">jours</span>
          </p>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="text-red-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">
              Zone sensible
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {stats.mostFrequentType || "—"}
          </p>
          <p className="text-xs text-gray-500">
            Type de blessure le plus fréquent
          </p>
        </div>
      </div>

      {/* --- Statistiques par type --- */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Fréquence par type de blessure
        </h2>
        {Object.keys(stats.byType).length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucune blessure enregistrée pour l’instant.
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <div className="w-40 text-sm text-gray-700">{type}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-500 h-2"
                    style={{
                      width: `${Math.min(
                        100,
                        (count / (stats.total || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-medium">
                  {count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Liste + formulaire --- */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Historique des blessures
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
          >
            <PlusCircle size={16} /> Ajouter une blessure
          </button>
        </div>

        {showForm && (
          <div className="border rounded-lg bg-gray-50 p-3 mb-4 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Type de blessure avec suggestions */}
              <div>
                <input
                  className="border p-2 rounded text-sm w-full"
                  list="injury-types"
                  placeholder="Type de blessure (ex. entorse cheville)"
                  value={newInjury.type}
                  onChange={(e) =>
                    setNewInjury({ ...newInjury, type: e.target.value })
                  }
                />
                <datalist id="injury-types">
                  {TYPE_PRESETS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              {/* Date */}
              <input
                type="date"
                className="border p-2 rounded text-sm w-full"
                value={newInjury.date}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, date: e.target.value })
                }
              />

              {/* Durée arrêt */}
              <input
                className="border p-2 rounded text-sm w-full"
                placeholder="Durée d’arrêt (en jours)"
                value={newInjury.duree}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, duree: e.target.value })
                }
              />
            </div>

            {/* Traitement + statut */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                className="border p-2 rounded text-sm w-full"
                placeholder="Traitement / suivi (physio, repos, etc.)"
                value={newInjury.traitement}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, traitement: e.target.value })
                }
              />
              <select
                className="border p-2 rounded text-sm w-full md:col-span-1"
                value={newInjury.statut}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, statut: e.target.value })
                }
              >
                <option value="En cours">En cours</option>
                <option value="Guéri">Guéri</option>
                <option value="Surveiller">Surveiller</option>
              </select>
            </div>

            {/* Notes */}
            <textarea
              className="border p-2 rounded text-sm w-full"
              rows={3}
              placeholder="Notes (feeling, déclencheurs, exercices à éviter, etc.)"
              value={newInjury.notes}
              onChange={(e) =>
                setNewInjury({ ...newInjury, notes: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-600"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
              <button
                className="text-sm px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={addInjury}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Liste des blessures */}
        {injuries.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucune blessure enregistrée pour l’instant.
          </p>
        ) : (
          <div className="space-y-3">
            {injuries
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((b) => (
                <div
                  key={b.id}
                  className="border rounded-lg p-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {b.type}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Début : {fmtDate(b.date)} · Durée d’arrêt :{" "}
                      {b.duree || "?"} jours
                    </p>
                    {b.traitement && (
                      <p className="text-xs text-gray-600">
                        Traitement : {b.traitement}
                      </p>
                    )}
                    {b.notes && (
                      <p className="text-xs text-gray-600 mt-1">
                        Notes : {b.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        b.statut === "Guéri"
                          ? "bg-green-100 text-green-700"
                          : b.statut === "Surveiller"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {b.statut}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => deleteInjury(b.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
