import React, { useState, useEffect } from "react";

const BELTS = [
  "Blanche",
  "Jaune",
  "Orange",
  "Mauve",
  "Verte",
  "Verte / Bleue",
  "Bleue",
  "Bleue / Brune",
  "Brune",
  "Brune / Noire",
  "Noire",
  "Noire 1 Dan",
  "Noire 2 Dan",
  "Noire 3 Dan",
];

// util petit format date locale sans décalage fuseau
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
  events,
  rules,
  belts,
  setBelts,
  activeProfile,
}) {
  // ------------------------------------------------
  // FORMULAIRE "Ajouter un passage"
  // ------------------------------------------------
  const [form, setForm] = useState({
    couleur: "Blanche",
    date: "",
    feeling: "",
    invite: false, // false = vraie ceinture obtenue, true = juste invitation
  });

  // ------------------------------------------------
  // AU CHANGEMENT DE PROFIL ACTIF :
  // charger ses ceintures depuis localStorage
  // ------------------------------------------------
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_belts_${activeProfile.id}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      // petite migration de sécurité : si TOUT est "invite":true,
      // on force la dernière entrée à devenir une vraie ceinture passée
      if (
        stored.length > 0 &&
        stored.every((b) => b.invite === true)
      ) {
        stored[stored.length - 1].invite = false;
        localStorage.setItem(key, JSON.stringify(stored));
      }

      setBelts(stored);
    } catch {
      setBelts([]);
    }
  }, [activeProfile, setBelts]);

  // ------------------------------------------------
  // SAUVEGARDE AUTO des ceintures du profil actif
  // ------------------------------------------------
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_belts_${activeProfile.id}`;
    localStorage.setItem(key, JSON.stringify(belts));
  }, [belts, activeProfile]);

  // ------------------------------------------------
  // 1. Déterminer la ceinture actuelle (dernière NON invite)
  // ------------------------------------------------
  const realBelts = belts.filter((b) => !b.invite);
  const currentBelt = realBelts.length
    ? realBelts[realBelts.length - 1]
    : null;

  // depuis quelle date on compte les points ?
  const sinceDate = currentBelt?.date || null;

  // ------------------------------------------------
  // 2. Calculer les points depuis la dernière vraie ceinture
  //    (uniquement pour CE profil et uniquement les "fait")
  // ------------------------------------------------
  const done = events.filter(
    (e) =>
      e.profileId === activeProfile?.id &&
      e.status === "fait" &&
      (!sinceDate || e.date >= sinceDate)
  );

  const groupPts = done.filter((e) => e.type === "groupe").length;
  const privatePts =
    done.filter((e) => e.type === "privé").length * 4;
  const totalPts = groupPts + privatePts;

  // règle associée : ex "Verte / Bleue→Bleue": 80
  const ruleEntry = currentBelt
    ? Object.entries(rules).find(([transition]) =>
        transition.startsWith(currentBelt.couleur)
      )
    : null;

  const requiredPts = ruleEntry ? ruleEntry[1] : 0;
  const restants = requiredPts
    ? Math.max(requiredPts - totalPts, 0)
    : 0;

  // ------------------------------------------------
  // 3. Gestion de l'INVITATION à la prochaine ceinture
  //    C'est une entrée belts[] avec invite:true
  // ------------------------------------------------
  const pendingInviteIndex = belts.findLastIndex(
    (b) => b.invite === true
  );
  const pendingInvite =
    pendingInviteIndex >= 0 ? belts[pendingInviteIndex] : null;

  function updateInviteCheckbox(checked) {
    // on modifie le tableau belts
    const arr = [...belts];

    if (!checked) {
      // si on décoche → on supprime l'invitation
      if (pendingInviteIndex >= 0) {
        arr.splice(pendingInviteIndex, 1);
      }
    } else {
      // si on coche → on crée une nouvelle invitation si pas déjà présente
      if (!pendingInvite) {
        // prochaine couleur logique d'après la règle
        let nextColor = "";
        if (ruleEntry) {
          const transition = ruleEntry[0]; // ex "Verte / Bleue→Bleue"
          nextColor = transition.split("→")[1];
        }
        arr.push({
          couleur: nextColor || "???",
          date: "", // pas encore fixée
          feeling: "",
          invite: true,
        });
      }
    }

    setBelts(arr);

    if (activeProfile) {
      localStorage.setItem(
        `karate_belts_${activeProfile.id}`,
        JSON.stringify(arr)
      );
    }
  }

  function updateInviteDate(newDate) {
    if (pendingInviteIndex < 0) return;
    const arr = [...belts];

    arr[pendingInviteIndex] = {
      ...arr[pendingInviteIndex],
      date: newDate,
    };

    setBelts(arr);

    if (activeProfile) {
      localStorage.setItem(
        `karate_belts_${activeProfile.id}`,
        JSON.stringify(arr)
      );
    }
  }

  // ------------------------------------------------
  // 4. Ajouter un PASSAGE de ceinture (ou une INVITATION)
  //    bouton "Ajouter"
  // ------------------------------------------------
  function addPass() {
    if (!form.date || !form.couleur) return;

    const newEntry = {
      couleur: form.couleur,
      date: form.date,
      feeling: form.feeling,
      invite: form.invite, // true = juste invitation reçue, false = vraie ceinture obtenue
    };

    const updated = [...belts, newEntry];
    setBelts(updated);

    if (activeProfile) {
      localStorage.setItem(
        `karate_belts_${activeProfile.id}`,
        JSON.stringify(updated)
      );
    }

    // reset formulaire
    setForm({
      couleur: "Blanche",
      date: "",
      feeling: "",
      invite: false,
    });
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  if (!activeProfile) {
    return (
      <div className="text-gray-500 p-6">
        Aucun profil actif sélectionné.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-red-600">
        Progression des ceintures – {activeProfile.nom}
      </h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* =====================
            Bloc Ceinture actuelle
        ======================*/}
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
            Points groupe : <b>{groupPts}</b> · Privés (×4) :{" "}
            <b>{privatePts}</b>
          </p>

          <p className="text-sm text-gray-700">
            Total : <b>{totalPts}</b>{" "}
            {requiredPts ? (
              <>
                / {requiredPts} (reste <b>{restants}</b>)
              </>
            ) : null}
          </p>

          {/* --- Gestion Invitation prochaine ceinture --- */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!!pendingInvite}
              onChange={(e) =>
                updateInviteCheckbox(e.target.checked)
              }
            />
            <span>Invitation reçue ?</span>

            {!!pendingInvite && (
              <input
                type="date"
                className="border rounded p-1 text-sm"
                value={pendingInvite.date || ""}
                onChange={(e) =>
                  updateInviteDate(e.target.value)
                }
              />
            )}
          </div>
        </div>

        {/* =====================
            Bloc Ajout passage / invitation
        ======================*/}
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2 text-gray-800">
            Ajouter un passage
          </h3>

          <div className="grid gap-2">
            <select
              className="border rounded p-2 text-gray-800"
              value={form.couleur}
              onChange={(e) =>
                setForm({ ...form, couleur: e.target.value })
              }
            >
              {BELTS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>

            <input
              className="border rounded p-2 text-gray-800"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              className="border rounded p-2 text-gray-800"
              placeholder="Feeling / commentaire"
              value={form.feeling}
              onChange={(e) =>
                setForm({ ...form, feeling: e.target.value })
              }
            />

            <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
              <input
                type="checkbox"
                checked={form.invite}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invite: e.target.checked,
                  })
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

      {/* =====================
          Historique
      ======================*/}
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2 text-gray-800">
          Historique
        </h3>

        {belts.length === 0 && (
          <p className="text-gray-500">
            Aucun passage enregistré.
          </p>
        )}

        {belts.map((b, i) => (
          <div
            key={i}
            className="py-2 border-b text-gray-800"
          >
            <p>
              <b>{b.couleur}</b> — {fmt(b.date)}{" "}
              {b.invite && (
                <span className="text-green-600 text-sm">
                  (invitation reçue)
                </span>
              )}
            </p>
            {b.feeling && (
              <p className="text-sm text-gray-600 italic">
                {b.feeling}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
