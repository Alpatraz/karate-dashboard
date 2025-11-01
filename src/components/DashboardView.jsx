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

  // === Utils ===
  const fmtDay = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "—";

  const fmtMonthYear = (dateObj) =>
    dateObj
      ? dateObj.toLocaleDateString("fr-CA", {
          month: "long",
          year: "numeric",
        })
      : "—";

  // Dernière ceinture obtenue
  const lastBeltObj = belts[belts.length - 1] || null;
  const currentBeltColor = lastBeltObj?.couleur || "Blanche";
  const currentBeltDate = lastBeltObj?.date || null;

  // Date du dernier passage (fallback si pas dans belts)
  const fallbackPassageDate = useMemo(() => {
    const pass = [...events]
      .filter((e) => e.type === "passage" && e.status === "fait" && e.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop();
    return pass?.date || null;
  }, [events]);

  const sinceDate = currentBeltDate || fallbackPassageDate || null;

  // Cours faits depuis cette date
  const doneEventsSince = events.filter(
    (e) => e.status === "fait" && (!sinceDate || e.date >= sinceDate)
  );

  const groupCount = doneEventsSince.filter((e) => e.type === "groupe").length;
  const privateCount =
    doneEventsSince.filter((e) => e.type === "privé").length * 4;

  const totalDone = groupCount + privateCount;

  // Trouver la prochaine ceinture et le nombre requis
  // `rules` ressemble à { "Verte / Bleue→Bleue": 80, ... }
  // On cherche l'entrée qui commence par la ceinture actuelle
  const progressionRuleEntry = Object.entries(rules).find(([transition]) =>
    transition.startsWith(currentBeltColor)
  );

  const nextBeltColor = progressionRuleEntry
    ? progressionRuleEntry[0].split("→")[1]
    : null;

  const requiredForNext = progressionRuleEntry
    ? progressionRuleEntry[1]
    : totalDone; // si pas de règle trouvée, on considère qu'il n'y a plus rien à faire

  const remaining = Math.max(requiredForNext - totalDone, 0);

  // Progression %
  const progressPct = requiredForNext
    ? Math.min((totalDone / requiredForNext) * 100, 100)
    : 100;

  // --- Calcul vitesse hebdo (moyenne des cours faits sur 8 dernières semaines) ---
  // fenêtre: 56 jours
  const now = new Date();
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(now.getDate() - 56);

  const doneLast8Weeks = doneEventsSince.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date + "T12:00:00"); // force midi pour éviter fuseau
    return d >= eightWeeksAgo && d <= now;
  });

  // On compte les "cours faits" façon points réels (groupe =1, privé=4)
  const doneLast8WeeksPoints =
    doneLast8Weeks.filter((e) => e.type === "groupe").length +
    doneLast8Weeks.filter((e) => e.type === "privé").length * 4;

  const weeklyRateRaw = doneLast8WeeksPoints / 8;
  // sécurité: si 0 on met 1 pour éviter division par 0
  const weeklyRate = weeklyRateRaw > 0 ? weeklyRateRaw : 1;

  // --- Estimation nombre de semaines restantes ---
  const weeksRemaining = remaining > 0 ? Math.ceil(remaining / weeklyRate) : 0;

  // Estimation de la date du prochain passage
  const estimatedDateObj = new Date();
  estimatedDateObj.setDate(now.getDate() + weeksRemaining * 7);

  // Prochains entraînements (inchangé)
  const todayISO = new Date().toISOString().split("T")[0];
  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [events, todayISO]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de bord principal
      </h1>

      {/* === Cartes du haut === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Carte 1 : Ceinture actuelle */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Ceinture actuelle
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {currentBeltColor}
          </p>
          <p className="text-sm text-gray-500">
            Depuis {fmtDay(currentBeltDate || fallbackPassageDate)}
          </p>
        </div>

        {/* Carte 2 : Cours faits / requis */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Cours faits / requis
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {totalDone} {requiredForNext ? <>/ {requiredForNext}</> : null}
          </p>
          <p className="text-sm text-gray-500">Depuis la dernière ceinture</p>
        </div>

        {/* Carte 3 : Prochaine ceinture prévue (ex-"Progression globale") */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-start gap-3 mb-2">
            <LineChart className="text-red-600 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-600 leading-tight">
                Prochaine ceinture prévue
              </h2>
              <p className="text-xl font-bold text-gray-800">
                {nextBeltColor || "—"}{" "}
                {weeksRemaining === 0 && remaining === 0
                  ? "— prêt"
                  : `– ${fmtMonthYear(estimatedDateObj)}`}
              </p>
              <p className="text-sm text-gray-500">
                Date estimée ou réelle
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 h-2 rounded mt-3">
            <div
              className="bg-red-600 h-2 rounded"
              style={{ width: `${Math.round(progressPct)}%` }}
            ></div>
          </div>

          <div className="text-sm text-gray-700 mt-3 leading-snug">
            <p>
              <b>{totalDone}</b> cours faits,
              <b> {remaining}</b> restants
              {requiredForNext ? (
                <> / {requiredForNext} requis</>
              ) : null}
            </p>
            <p>
              Rythme actuel :{" "}
              <b>{weeklyRate.toFixed(1)}</b> cours / semaine
            </p>
            <p>
              Estimation :{" "}
              <b>
                {weeksRemaining} semaine
                {weeksRemaining > 1 ? "s" : ""} restantes
              </b>
            </p>
            {nextBeltColor && (
              <p className="text-xs text-gray-500 mt-1">
                Objectif : {currentBeltColor} → {nextBeltColor}
              </p>
            )}
          </div>
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
                <p className="text-red-600 font-semibold">{fmtDay(e.date)}</p>
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
