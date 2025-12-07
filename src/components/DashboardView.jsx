import React, { useEffect, useState, useMemo } from "react";
import { Target, Trophy, Calendar, Dumbbell, ArrowRight } from "lucide-react";

// === utilitaires ===
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

function fmtMonthYear(dateObj) {
  if (!dateObj) return "—";
  return dateObj.toLocaleDateString("fr-CA", {
    month: "long",
    year: "numeric",
  });
}

function getCurrentBelt(belts) {
  const realBelts = belts.filter((b) => !b.invite);
  return realBelts.length ? realBelts[realBelts.length - 1] : null;
}

function getPendingInvite(belts) {
  for (let i = belts.length - 1; i >= 0; i--) {
    if (belts[i].invite) return belts[i];
  }
  return null;
}

// Helpers pour charger les données par profil
function loadBeltsForProfile(profileId) {
  try {
    const raw =
      localStorage.getItem(`karate_belts_${profileId}`) ||
      localStorage.getItem("karate_belts_" + profileId) ||
      "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadCompetitionsForProfile(profileId) {
  try {
    const raw =
      localStorage.getItem(`karate_competitions_${profileId}`) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Calcul du coût d’une compétition (même logique que dans CompetitionsView)
function calcCompetitionTotal(comp) {
  const n = (comp.categories || []).length;
  if (!n) return 0;
  const p1 = parseFloat(comp.prix1 || 0);
  const ps = parseFloat(comp.prixSup || 0);
  return p1 + Math.max(0, n - 1) * ps;
}

// === composant principal ===
export default function DashboardView({
  activeProfile,
  events = [],
  belts = [],
  setActiveTab,
}) {
  const [rules, setRules] = useState({});
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [profiles, setProfiles] = useState([]);
  const [trainingStats, setTrainingStats] = useState({
    total: 0,
    minutes: 0,
  });

  // Chargement des règles globales
  useEffect(() => {
    setRules(JSON.parse(localStorage.getItem("karate_rules") || "{}"));
  }, []);

  // Charger tous les profils pour la vue d’ensemble
  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    setProfiles(Array.isArray(all) ? all : []);
  }, []);

  // --- Ceinture actuelle & progression pour le profil actif ---
  const currentBelt = getCurrentBelt(belts);
  const currentBeltColor = currentBelt?.couleur || "Blanche";
  const currentBeltDate = currentBelt?.date || null;

  const sinceDate = currentBeltDate || null;
  const doneEventsSince = events.filter(
    (e) =>
      e.profileId === activeProfile?.id &&
      e.status === "fait" &&
      (!sinceDate || e.date >= sinceDate)
  );

  const groupCount = doneEventsSince.filter(
    (e) => e.type === "groupe"
  ).length;
  const privateCount = doneEventsSince.filter((e) =>
    ["privé", "semi"].includes(e.type)
  ).length;
  const weaponCombatCount = doneEventsSince.filter(
    (e) =>
      e.type === "arme" ||
      e.title?.toLowerCase().includes("combat") ||
      e.title?.toLowerCase().includes("arme")
  ).length;
  const totalDone = groupCount + privateCount * 4;

  const progressionRuleEntry = currentBelt
    ? Object.entries(rules).find(([transition]) => {
        const [from] = transition.split("→").map((s) => s.trim());
        return from === currentBelt.couleur;
      })
    : null;

  const invite = getPendingInvite(belts);
  let nextBeltColor = null;
  if (invite) nextBeltColor = invite.couleur;
  else if (progressionRuleEntry)
    nextBeltColor = progressionRuleEntry[0].split("→")[1];

  const requiredForNext = progressionRuleEntry
    ? progressionRuleEntry[1]
    : totalDone;
  const remaining = Math.max(requiredForNext - totalDone, 0);
  const progressPct = requiredForNext
    ? Math.min((totalDone / requiredForNext) * 100, 100)
    : 100;

  // --- Estimation date prochaine ceinture (profil actif) ---
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

  const weeksRemaining =
    !invite && remaining > 0 ? Math.ceil(remaining / weeklyRate) : 0;

  const estimatedDateObj = new Date();
  estimatedDateObj.setDate(now.getDate() + weeksRemaining * 7);

  const nextBeltDateLabel = invite ? "Date réelle" : "Date estimée";
  const nextBeltDateText = invite
    ? fmtMonthYear(new Date(invite.date + "T12:00:00"))
    : fmtMonthYear(estimatedDateObj);
  const objectifTxt = currentBeltColor + " → " + (nextBeltColor || "—");

  // --- Entraînement maison (profil actif) ---
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_home_training_${activeProfile.id}`;
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const nowDate = new Date();
    const month = nowDate.getMonth();
    const year = nowDate.getFullYear();

    const monthly = data.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const total = monthly.length;
    const minutes = monthly.reduce(
      (acc, s) => acc + (s.dureeTotale || s.duree || 0),
      0
    );

    setTrainingStats({ total, minutes });
  }, [activeProfile]);

  // --- Stats annuelles (profil actif) ---
  const yearlyEvents = events.filter(
    (e) =>
      e.profileId === activeProfile?.id &&
      e.status === "fait" &&
      e.date.startsWith(annee.toString())
  );

  const yearlyStats = {
    groupe: yearlyEvents.filter((e) => e.type === "groupe").length,
    prive: yearlyEvents.filter((e) =>
      ["privé", "semi"].includes(e.type)
    ).length,
    armes: yearlyEvents.filter((e) =>
      e.title?.toLowerCase().includes("arme")
    ).length,
    combat: yearlyEvents.filter((e) =>
      e.title?.toLowerCase().includes("combat")
    ).length,
    competition: yearlyEvents.filter((e) => e.type === "competition")
      .length,
  };

  const todayISO = new Date().toISOString().split("T")[0];

  const upcoming = useMemo(() => {
    return events
      .filter(
        (e) =>
          e.profileId === activeProfile?.id && e.date >= todayISO
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [events, todayISO, activeProfile]);

  // === RÉCAP GLOBAL PAR PROFIL ===
  const profilesOverview = useMemo(() => {
    const yearStr = String(annee);
    return profiles.map((p) => {
      // Événements de ce profil
      const eventsProfile = events.filter((e) => e.profileId === p.id);

      // Ceintures
      const beltsProfile = loadBeltsForProfile(p.id);
      const current = getCurrentBelt(beltsProfile);
      const inviteP = getPendingInvite(beltsProfile);

      const currentColor = current?.couleur || "Blanche";
      const currentDate = current?.date || null;

      const since = currentDate || null;
      const doneSince = eventsProfile.filter(
        (e) =>
          e.status === "fait" &&
          (!since || !e.date || e.date >= since)
      );
      const groupP = doneSince.filter(
        (e) => e.type === "groupe"
      ).length;
      const privateP = doneSince.filter((e) =>
        ["privé", "semi"].includes(e.type)
      ).length;
      const pointsP = groupP + privateP * 4;

      // Règle de progression
      let required = pointsP;
      let nextColor = null;
      if (current && Object.keys(rules).length > 0) {
        const entry = Object.entries(rules).find(([transition]) => {
          const [from] = transition.split("→").map((s) => s.trim());
          return from === current.couleur;
        });
        if (entry) {
          required = entry[1];
          nextColor = entry[0].split("→")[1];
        }
      }
      if (inviteP) {
        nextColor = inviteP.couleur;
      }

      const remainingP = Math.max(required - pointsP, 0);
      const pctP = required ? Math.min((pointsP / required) * 100, 100) : 100;

      // Prochain cours
      const upcomingProfile = eventsProfile
        .filter((e) => e.date && e.date >= todayISO)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

      // Médailles + coût annuel sur l’année sélectionnée
      const competitionsProfile = loadCompetitionsForProfile(p.id);
      const compsYear = competitionsProfile.filter(
        (c) => c.date && c.date.startsWith(yearStr)
      );
      const cats = compsYear.flatMap((c) => c.categories || []);
      const gold = cats.filter((c) => c.resultat === "🥇").length;
      const silver = cats.filter((c) => c.resultat === "🥈").length;
      const bronze = cats.filter((c) => c.resultat === "🥉").length;
      const annualCost = compsYear.reduce(
        (acc, c) => acc + calcCompetitionTotal(c),
        0
      );

      return {
        profile: p,
        currentColor,
        currentDate,
        nextColor,
        remainingP,
        pctP,
        pointsP,
        upcomingProfile,
        medals: { gold, silver, bronze },
        annualCost,
      };
    });
  }, [profiles, events, rules, annee, todayISO]);

  // Coût annuel cumulé tous profils
  const totalAnnualCost = useMemo(
    () =>
      profilesOverview.reduce(
        (sum, p) => sum + (p.annualCost || 0),
        0
      ),
    [profilesOverview]
  );

  if (!activeProfile)
    return (
      <div className="p-6 text-gray-500">
        Aucun profil actif sélectionné.
      </div>
    );

  // === RENDER ===
  return (
    <div className="p-6 space-y-8">
      {/* VUE D'ENSEMBLE DES PROFILS */}
      {profilesOverview.length > 0 && (
        <section>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Tableau de bord – Vue d’ensemble des profils
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {profilesOverview.map(
              ({
                profile,
                currentColor,
                currentDate,
                nextColor,
                remainingP,
                pctP,
                pointsP,
                upcomingProfile,
                medals,
                annualCost,
              }) => (
                <div
                  key={profile.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-800">
                        {profile.nom || "Profil sans nom"}
                      </p>
                      {profile.id === activeProfile.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Ceinture actuelle :{" "}
                      <b>{currentColor}</b>{" "}
                      {currentDate && (
                        <span>
                          (depuis {fmtDay(currentDate)})
                        </span>
                      )}
                    </p>

                    <div className="w-full bg-gray-200 h-2 rounded mb-2">
                      <div
                        className="bg-green-600 h-2 rounded"
                        style={{ width: `${Math.round(pctP)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {pointsP} pts cumulés
                      {nextColor && (
                        <>
                          {" "}
                          – Objectif :{" "}
                          <b>
                            {currentColor} → {nextColor}
                          </b>{" "}
                          ({remainingP} pts restants)
                        </>
                      )}
                    </p>

                    <div className="text-xs text-gray-600 mb-2">
                      <p className="font-semibold mb-1">
                        🏅 Médailles {annee}
                      </p>
                      <p>
                        🥇 {medals.gold} · 🥈 {medals.silver} · 🥉{" "}
                        {medals.bronze}
                      </p>
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      <p className="font-semibold mb-1">
                        💰 Coût {annee}
                      </p>
                      <p>{annualCost.toFixed(2)} $</p>
                    </div>

                    <div className="text-xs text-gray-600">
                      <p className="font-semibold mb-1">
                        📅 Prochain cours
                      </p>
                      {upcomingProfile ? (
                        <>
                          <p>{fmtDay(upcomingProfile.date)}</p>
                          <p>
                            {upcomingProfile.title} ·{" "}
                            {upcomingProfile.type}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400">
                          Aucun cours à venir.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setActiveTab && setActiveTab("Profil / Ceintures")
                    }
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Voir le profil détaillé
                    <ArrowRight size={12} />
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* TITRE PROFIL ACTIF */}
      <h2 className="text-xl font-bold text-gray-800">
        Tableau de bord – {activeProfile.nom}
      </h2>

      {/* LIGNE DE CARTES (profil actif) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Ceinture actuelle */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-red-600" size={24} />
            <h3 className="text-lg font-semibold text-red-600">
              Ceinture actuelle
            </h3>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {currentBeltColor}
          </p>
          <p className="text-sm text-gray-500">
            Depuis {currentBeltDate ? fmtDay(currentBeltDate) : "—"}
          </p>
        </div>

        {/* Cours faits / requis */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-red-600" size={24} />
            <h3 className="text-lg font-semibold text-red-600">
              Cours faits / requis
            </h3>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {totalDone}
            {requiredForNext ? <> / {requiredForNext}</> : null}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Depuis la dernière ceinture
          </p>
          <ul className="text-sm text-gray-700 leading-snug">
            <li>🥋 Cours groupe : {groupCount}</li>
            <li>
              💪 Armes / Combat : {weaponCombatCount}{" "}
              <span className="text-xs text-gray-500">(non comptés)</span>
            </li>
            <li>
              🤝 Cours privés : {privateCount}{" "}
              <span className="text-xs text-gray-500">
                (équiv. {privateCount * 4} cours)
              </span>
            </li>
          </ul>
        </div>

        {/* Prochaine ceinture */}
        <div className="bg-green-100 shadow rounded-xl p-5 border border-gray-200">
          <div className="flex items-start gap-3 mb-2">
            <div className="text-2xl leading-none">🥋</div>
            <div>
              <h3 className="text-lg font-semibold leading-tight text-gray-800">
                Prochaine ceinture prévue
              </h3>
              <p className="text-xl font-bold text-gray-900">
                {nextBeltColor || "—"} – {nextBeltDateText}
              </p>
              <p className="text-sm text-gray-600">
                {nextBeltDateLabel}
              </p>
            </div>
          </div>

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
              <b>{totalDone}</b> cours faits, <b>{remaining}</b> restants
            </p>
            <p>
              Rythme actuel : <b>{weeklyRate.toFixed(1)}</b> / semaine
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

        {/* Entraînement maison */}
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-red-600">
                Entraînement maison
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {trainingStats.minutes}{" "}
              <span className="text-base text-gray-600">min</span>
            </p>
            <p className="text-sm text-gray-500">
              {trainingStats.total} séance
              {trainingStats.total > 1 ? "s" : ""} ce mois-ci
            </p>
          </div>

          <button
            onClick={() =>
              setActiveTab && setActiveTab("Entraînement maison")
            }
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Voir les entraînements <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* === Section cours faits par année === */}
      <div className="bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-xl shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-red-600" size={22} />
            <h2 className="text-lg font-semibold text-red-700">
              📅 Cours faits en {annee}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              Changer d’année :
            </label>
            <select
              className="border border-gray-300 rounded p-1 text-sm bg-white"
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.values(yearlyStats).every((v) => v === 0) ? (
          <p className="text-gray-500 text-sm italic">
            Aucun cours enregistré pour cette année.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="bg-white border border-red-100 rounded-lg p-3 shadow-sm">
              <div className="text-xl">🥋</div>
              <div className="font-semibold text-gray-800">
                {yearlyStats.groupe}
              </div>
              <div className="text-xs text-gray-500">Cours groupe</div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
              <div className="text-xl">🤝</div>
              <div className="font-semibold text-gray-800">
                {yearlyStats.prive}
              </div>
              <div className="text-xs text-gray-500">
                Cours privés{" "}
                <span className="text-[10px]">(x4)</span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
              <div className="text-xl">💪</div>
              <div className="font-semibold text-gray-800">
                {yearlyStats.armes + yearlyStats.combat}
              </div>
              <div className="text-xs text-gray-500">
                Armes / Combat
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
              <div className="text-xl">🏆</div>
              <div className="font-semibold text-gray-800">
                {yearlyStats.competition}
              </div>
              <div className="text-xs text-gray-500">
                Compétitions
              </div>
            </div>

            <div className="bg-white border border-red-100 rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {yearlyStats.groupe +
                  yearlyStats.prive * 4 +
                  yearlyStats.armes +
                  yearlyStats.combat}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">
                Total points
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Prochains entraînements === */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          📅 Prochains entraînements
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">Aucun événement à venir.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      {/* === Coût annuel cumulé tous profils === */}
      <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-amber-800 mb-3">
          💰 Coût annuel cumulé des compétitions – {annee}
        </h2>
        <p className="text-2xl font-bold text-amber-700 mb-4">
          {totalAnnualCost.toFixed(2)} $
        </p>

        {profilesOverview.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucun profil ou aucune compétition enregistrée pour cette
            année.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border">
              <thead className="bg-amber-50">
                <tr>
                  <th className="border px-3 py-2">Profil</th>
                  <th className="border px-3 py-2 text-right">
                    Coût compétitions {annee}
                  </th>
                </tr>
              </thead>
              <tbody>
                {profilesOverview.map(({ profile, annualCost }) => (
                  <tr key={profile.id}>
                    <td className="border px-3 py-2">
                      {profile.nom || "Profil sans nom"}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {annualCost.toFixed(2)} $
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
