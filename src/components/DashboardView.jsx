import React, { useEffect, useState, useMemo } from "react";
import { Target, Trophy } from "lucide-react";

// util date courte
function fmtDay(d) {
  if (!d) return "—";
  const [y, m, dd] = d.split("-");
  const date = new Date(y, m - 1, dd, 12, 0, 0);
  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// util mois+année
function fmtMonthYear(dateObj) {
  if (!dateObj) return "—";
  return dateObj.toLocaleDateString("fr-CA", {
    month: "long",
    year: "numeric",
  });
}

// retrouve la dernière ceinture réelle (invite=false)
function getCurrentBelt(belts) {
  const realBelts = belts.filter((b) => !b.invite);
  return realBelts.length ? realBelts[realBelts.length - 1] : null;
}

// retrouve l'invitation en attente (invite=true, la plus récente)
function getPendingInvite(belts) {
  for (let i = belts.length - 1; i >= 0; i--) {
    if (belts[i].invite) return belts[i];
  }
  return null;
}

export default function DashboardView() {
  const [events, setEvents] = useState([]);
  const [rules, setRules] = useState({});
  const [belts, setBelts] = useState([]);

  useEffect(() => {
    setEvents(JSON.parse(localStorage.getItem("karate_events") || "[]"));
    setRules(JSON.parse(localStorage.getItem("karate_rules") || "{}"));
    setBelts(JSON.parse(localStorage.getItem("karate_belts") || "[]"));
  }, []);

  // données utiles ceinture actuelle
  const currentBelt = getCurrentBelt(belts);
  const currentBeltColor = currentBelt?.couleur || "Blanche";
  const currentBeltDate = currentBelt?.date || null;

  // date de début pour compter les cours faits
  const sinceDate = currentBeltDate || null;

  // cours faits depuis cette ceinture
  const doneEventsSince = events.filter(
    (e) => e.status === "fait" && (!sinceDate || e.date >= sinceDate)
  );

  const groupCount = doneEventsSince.filter((e) => e.type === "groupe").length;
  const privateCount =
    doneEventsSince.filter((e) => e.type === "privé").length * 4;
  const totalDone = groupCount + privateCount;

  // règle de progression à partir de la ceinture actuelle
  const progressionRuleEntry = currentBelt
    ? Object.entries(rules).find(([transition]) =>
        transition.startsWith(currentBelt.couleur)
      )
    : null;

  // la "prochaine ceinture prévue"
  // cas 1 : on a une invitation officielle => on affiche cette ceinture + "Date réelle"
  // cas 2 : pas d'invite => on lit la couleur dans la règle "X→Y"
  const invite = getPendingInvite(belts);

  let nextBeltColor = null;
  if (invite) {
    nextBeltColor = invite.couleur; // ex. "Bleue"
  } else if (progressionRuleEntry) {
    nextBeltColor = progressionRuleEntry[0].split("→")[1]; // ex "Verte / Bleue→Bleue"
  }

  // requis total pour atteindre la prochaine ceinture
  const requiredForNext = progressionRuleEntry
    ? progressionRuleEntry[1]
    : totalDone;
  const remaining = Math.max(requiredForNext - totalDone, 0);

  // % progression
  const progressPct = requiredForNext
    ? Math.min((totalDone / requiredForNext) * 100, 100)
    : 100;

  // vitesse hebdo (8 dernières semaines glissantes)
  const now = new Date();
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(now.getDate() - 56);

  const doneLast8Weeks = doneEventsSince.filter((e) => {
    if (!e.date) return false;
    const [y, m, d] = e.date.split("-");
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    return dateObj >= eightWeeksAgo && dateObj <= now;
  });

  const doneLast8WeeksPoints =
    doneLast8Weeks.filter((e) => e.type === "groupe").length +
    doneLast8Weeks.filter((e) => e.type === "privé").length * 4;

  const weeklyRateRaw = doneLast8WeeksPoints / 8;
  const weeklyRate = weeklyRateRaw > 0 ? weeklyRateRaw : 1;

  // estimation temps restant si pas encore invitation officielle
  const weeksRemaining =
    !invite && remaining > 0
      ? Math.ceil(remaining / weeklyRate)
      : 0;

  const estimatedDateObj = new Date();
  estimatedDateObj.setDate(now.getDate() + weeksRemaining * 7);

  // message/date à afficher dans la carte verte
  const nextBeltDateLabel = invite
    ? "Date réelle"
    : "Date estimée";

  const nextBeltDateText = invite
    ? fmtMonthYear(new Date(invite.date + "T12:00:00"))
    : fmtMonthYear(estimatedDateObj);

  // objectifs texte
  const objectifTxt = currentBeltColor + " → " + (nextBeltColor || "—");

  // prochains entraînements
  const todayISO = new Date().toISOString().split("T")[0];
  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [events, todayISO]);

  // style visuel de la carte "prochaine ceinture"
  const cardBg = "bg-green-100";
  const cardText = "text-gray-800";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de bord principal
      </h1>

      {/* LIGNE DE CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Carte Ceinture actuelle */}
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
            Depuis {currentBeltDate ? fmtDay(currentBeltDate) : "—"}
          </p>
        </div>

        {/* Carte Cours faits / requis */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-600">
              Cours faits / requis
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {totalDone}
            {requiredForNext ? <> / {requiredForNext}</> : null}
          </p>
          <p className="text-sm text-gray-500">
            Depuis la dernière ceinture
          </p>
        </div>

        {/* Carte Prochaine ceinture */}
        <div
          className={`shadow rounded-xl p-5 border border-gray-200 ${cardBg} ${cardText} transition-colors`}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="text-2xl leading-none">🥋</div>
            <div>
              <h2 className="text-lg font-semibold leading-tight text-gray-800">
                Prochaine ceinture prévue
              </h2>
              <p className="text-xl font-bold text-gray-900">
                {nextBeltColor || "—"}{" "}
                {nextBeltDateText ? `– ${nextBeltDateText}` : ""}
              </p>
              <p className="text-sm text-gray-600">
                {nextBeltDateLabel}
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          {!invite && (
            <div className="w-full bg-gray-200 h-2 rounded mt-3">
              <div
                className="bg-green-600 h-2 rounded"
                style={{ width: `${Math.round(progressPct)}%` }}
              />
            </div>
          )}

          <div className="text-sm text-gray-700 mt-3 leading-snug">
            <p>
              <b>{totalDone}</b> cours faits,
              <b> {remaining}</b> restants
              {requiredForNext ? <> / {requiredForNext} requis</> : null}
            </p>
            <p>
              Rythme actuel :{" "}
              <b>{weeklyRate.toFixed(1)}</b> / semaine
            </p>
            {!invite && (
              <p>
                Estimation :{" "}
                <b>
                  {weeksRemaining} semaine
                  {weeksRemaining > 1 ? "s" : ""} restantes
                </b>
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Objectif : {objectifTxt}
            </p>
          </div>
        </div>
      </div>

      {/* PROCHAINS ENTRAÎNEMENTS */}
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
                <p className="text-red-600 font-semibold">
                  {fmtDay(e.date)}
                </p>
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
