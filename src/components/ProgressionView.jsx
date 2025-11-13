import React, { useState } from "react";

// ordre des ceintures pour trier/comparer
const BELTS = [
  "Blanche", "Jaune", "Orange", "Mauve", "Verte", "Verte / Bleue",
  "Bleue", "Bleue / Brune", "Brune", "Brune / Noire",
  "Noire", "Noire 1 Dan", "Noire 2 Dan", "Noire 3 Dan",
];

function beltIndex(b) {
  return BELTS.indexOf(b);
}

// petite util pour format local sans décalage fuseau
function fmt(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-");
  const localDate = new Date(y, m - 1, d, 12, 0, 0);
  return localDate.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ProgressionView({
  events = [],
  rules = {},
  belts = [],
  setBelts = () => {},
  activeProfile,
}) {
  // 🔒 sécurité : jamais undefined
  if (!Array.isArray(events)) events = [];
  if (!Array.isArray(belts)) belts = [];
  if (typeof rules !== "object" || rules === null) rules = {};

  // formulaire "Ajouter un passage"
  const [form, setForm] = useState({
    couleur: "Blanche",
    date: "",
    feeling: "",
    invite: false,
  });

  // --------------------------
  // 1. Ceinture actuelle
  // --------------------------
  const realBelts = belts.filter((b) => !b.invite);
  const currentBelt = realBelts.length ? realBelts[realBelts.length - 1] : null;

  const sinceDate = currentBelt?.date || null;
  const done = events.filter(
    (e) => e.status === "fait" && (!sinceDate || e.date >= sinceDate)
  );

  const groupPts = done.filter((e) => e.type === "groupe").length;
  // inclut "privé" ET "semi" comme 4 points chacun
const privatePts = done.filter((e) => ["privé", "semi"].includes(e.type)).length * 4;
const totalPts = groupPts + privatePts;


  // règle associée à la ceinture actuelle
  let ruleEntry = null;
  try {
    if (currentBelt && typeof rules === "object") {
      ruleEntry = Object.entries(rules).find(([transition]) =>
        transition.startsWith(currentBelt.couleur)
      );
    }
  } catch (err) {
    console.warn("Erreur lecture règles de progression :", err);
  }

  const requiredPts = ruleEntry ? ruleEntry[1] : 0;
  const restants = requiredPts ? Math.max(requiredPts - totalPts, 0) : 0;

  // --------------------------
  // 2. Ajout de passage
  // --------------------------
  function addPass() {
    if (!form.date || !form.couleur) return;

    const newEntry = {
      couleur: form.couleur,
      date: form.date,
      feeling: form.feeling,
      invite: form.invite,
      profileId: activeProfile?.id || "default",
    };

    const updated = [...belts, newEntry];
    setBelts(updated);
    localStorage.setItem("karate_belts", JSON.stringify(updated));

    setForm({
      couleur: "Blanche",
      date: "",
      feeling: "",
      invite: false,
    });
  }

  // --------------------------
  // 3. Gestion des invitations
  // --------------------------
  const pendingInviteIndex = belts.findLastIndex((b) => b.invite === true);
  const pendingInvite =
    pendingInviteIndex >= 0 ? belts[pendingInviteIndex] : null;

  function updateInviteCheckbox(checked) {
    const arr = [...belts];

    if (!checked) {
      if (pendingInviteIndex >= 0) arr.splice(pendingInviteIndex, 1);
    } else {
      if (!pendingInvite) {
        let nextColor = "";
        if (ruleEntry) {
          const transition = ruleEntry[0];
          nextColor = transition.split("→")[1];
        }
        arr.push({
          couleur: nextColor || "???",
          date: "",
          feeling: "",
          invite: true,
          profileId: activeProfile?.id || "default",
        });
      }
    }

    setBelts(arr);
    localStorage.setItem("karate_belts", JSON.stringify(arr));
  }

  function updateInviteDate(newDate) {
    if (pendingInviteIndex < 0) return;
    const arr = [...belts];
    arr[pendingInviteIndex] = {
      ...arr[pendingInviteIndex],
      date: newDate,
    };
    setBelts(arr);
    localStorage.setItem("karate_belts", JSON.stringify(arr));
  }

  // --------------------------
  // RENDER
  // --------------------------
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-red-600">
        Progression des ceintures
      </h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* ---- CEINTURE ACTUELLE ---- */}
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2 text-gray-800">
            Ceinture actuelle
          </h3>

          <p className="text-gray-800">
            <b>{currentBelt ? currentBelt.couleur : "Blanche"}</b>{" "}
            {currentBelt?.date && (
              <span className="text-sm text-gray-500">
                (depuis {fmt(currentBelt.date)})
              </span>
            )}
          </p>

          <p className="mt-2 text-sm text-gray-700">
  Points groupe : <b>{groupPts}</b> · Privés / Semi (×4) : <b>{privatePts}</b>
</p>

          <p className="text-sm text-gray-700">
            Total : <b>{totalPts}</b>{" "}
            {requiredPts ? (
              <>
                / {requiredPts} (reste <b>{restants}</b>)
              </>
            ) : null}
          </p>

          {/* --- INVITATION CEINTURE SUIVANTE --- */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!!pendingInvite}
              onChange={(e) => updateInviteCheckbox(e.target.checked)}
            />
            <span>Invitation reçue ?</span>

            {!!pendingInvite && (
              <input
                type="date"
                className="border rounded p-1 text-sm"
                value={pendingInvite.date || ""}
                onChange={(e) => updateInviteDate(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* ---- AJOUT D'UNE CEINTURE ---- */}
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2 text-gray-800">
            Ajouter un passage
          </h3>

          <div className="grid gap-2">
            <select
              className="border rounded p-2 text-gray-800"
              value={form.couleur}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
            >
              {BELTS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>

            <input
              className="border rounded p-2 text-gray-800"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <input
              className="border rounded p-2 text-gray-800"
              placeholder="Feeling / commentaire"
              value={form.feeling}
              onChange={(e) => setForm({ ...form, feeling: e.target.value })}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
              <input
                type="checkbox"
                checked={form.invite}
                onChange={(e) =>
                  setForm({ ...form, invite: e.target.checked })
                }
              />
              <span>C’est une invitation ?</span>
            </label>
          </div>

          <button
            onClick={addPass}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* ---- HISTORIQUE ---- */}
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2 text-gray-800">Historique</h3>

        {belts.length === 0 && (
          <p className="text-gray-500">Aucun passage enregistré.</p>
        )}

        {belts.map((b, i) => (
          <div key={i} className="py-2 border-b text-gray-800">
            <p>
              <b>{b.couleur}</b> — {fmt(b.date)}{" "}
              {b.invite && (
                <span className="text-green-600 text-sm">
                  (invitation reçue)
                </span>
              )}
            </p>
            {b.feeling && (
              <p className="text-sm text-gray-600 italic">{b.feeling}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
