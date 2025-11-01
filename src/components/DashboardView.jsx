import React, { useEffect, useState, useMemo } from "react";
import { Target, Trophy, LineChart, Calendar } from "lucide-react";

export default function DashboardView() {
  // === Lecture des données locales ===
  const [events, setEvents] = useState([]);
  const [rules, setRules] = useState({});
  const [belts, setBelts] = useState([]);

  useEffect(() => {
    setEvents(JSON.parse(localStorage.getItem("karate_events") || "[]"));
    setRules(JSON.parse(localStorage.getItem("karate_rules") || "{}"));
    setBelts(JSON.parse(localStorage.getItem("karate_belts") || "[]"));
  }, []);

  // === Fonctions utilitaires ===
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("fr-CA") : "—");
  const lastPass = useMemo(() => {
    const pass = [...events]
      .filter((e) => e.type === "passage" && e.status === "fait" && e.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop();
    return pass?.date || null;
  }, [events]);

  const since = belts[belts.length - 1]?.date || lastPass;
  const done = events.filter(
    (e) => e.status === "fait" && (!since || e.date >= since)
  );
  const groupPts = done.filter((e) => e.type === "groupe").length;
  const privatePts = done.filter((e) => e.type === "privé").length * 4;
  const total = groupPts + privatePts;

  const nextStep = Object.entries(rules).find(([_, n]) => total < n);
  const progress = nextStep ? Math.min((total / nextStep[1]) * 100, 100) : 100;

  const upcoming = useMemo(() => {
    const now = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.date >= now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [events]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de bord principal
      </h1>

      {/* === Statistiques principales === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ceinture actuelle */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Ceinture actuelle
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {belts[belts.length - 1]?.couleur || "Blanche"}
          </p>
          <p className="text-sm text-gray-500">
            Depuis {fmt(belts[belts.length - 1]?.date)}
          </p>
        </div>

        {/* Points / cours */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Cours faits / requis
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {total} {nextStep && <>/ {nextStep[1]}</>}
          </p>
          <p className="text-sm text-gray-500">Depuis la dernière ceinture</p>
        </div>

        {/* Progression */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <LineChart className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Progression globale
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {Math.round(progress)}%
          </p>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-red-600 h-2 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {nextStep
              ? `Prochaine étape : ${nextStep[0].replace("→", " → ")}`
              : "🎉 Toutes les étapes franchies !"}
          </p>
        </div>
      </div>

      {/* === Prochains entraînements === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          📅 Prochains entraînements
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">Aucun événement à venir.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcoming.map((e, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl shadow border border-gray-100"
              >
                <p className="text-red-600 font-semibold">{fmt(e.date)}</p>
                <p className="font-medium text-gray-800">{e.title}</p>
                <p className="text-sm text-gray-500">
                  {e.time || "—"} · {e.type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
