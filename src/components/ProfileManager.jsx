import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Save, CreditCard, UserCheck } from "lucide-react";

export default function ProfileManager() {
  // ---------------------------
  // STATE : profils
  // ---------------------------
  const [profiles, setProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    } catch {
      return [];
    }
  });

  // ID du profil actuellement affiché / édité dans le formulaire du bas
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // Formulaire profil (infos générales)
  const [form, setForm] = useState({
    id: null,
    nom: "",
    dateNaissance: "",
    type: "Adulte",

    abonnementMensuel: "",
    optionCombatActive: false,
    optionCombatMontant: "",
    optionArmesActive: false,
    optionArmesMontant: "",

    federationMontant: "",
    federationRenouvellement: "",

    notes: "",
    actif: false,

    paiements: [], // paiements individuels
  });

  // Formulaire "ajout de paiement"
  const [newPayment, setNewPayment] = useState({
    type: "cours privé",
    montant: "",
    date: "",
    statut: "Payé",
    payeur: "Guillaume",
    methode: "Débit",
  });

  // ---------------------------
  // Helpers
  // ---------------------------
  function computeAge(dateNaissance) {
    if (!dateNaissance) return "";
    const birth = new Date(dateNaissance);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return years;
  }

  // profil actif (celui marqué actif:true dans la liste)
  const activeProfile = profiles.find((p) => p.actif) || null;

  // ---------------------------
  // Sauvegarde auto localStorage
  // ---------------------------
  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // ---------------------------
  // Quand on clique sur un profil dans la rangée du haut
  // -> charge ses infos dans le formulaire
  // ---------------------------
  const selectProfileForEdit = (id) => {
    setSelectedProfileId(id);
    const p = profiles.find((x) => x.id === id);
    if (!p) return;

    setForm({
      id: p.id,
      nom: p.nom || "",
      dateNaissance: p.dateNaissance || "",
      type: p.type || "Adulte",

      abonnementMensuel: p.abonnementMensuel ?? "",
      optionCombatActive: p.optionCombatActive || false,
      optionCombatMontant: p.optionCombatMontant ?? "",
      optionArmesActive: p.optionArmesActive || false,
      optionArmesMontant: p.optionArmesMontant ?? "",

      federationMontant: p.federationMontant ?? "",
      federationRenouvellement: p.federationRenouvellement || "",

      notes: p.notes || "",
      actif: p.actif || false,

      paiements: Array.isArray(p.paiements) ? p.paiements : [],
    });
  };

  // ---------------------------
  // Nouveau profil vierge
  // ---------------------------
  const startCreateNewProfile = () => {
    const empty = {
      id: null,
      nom: "",
      dateNaissance: "",
      type: "Adulte",

      abonnementMensuel: "",
      optionCombatActive: false,
      optionCombatMontant: "",
      optionArmesActive: false,
      optionArmesMontant: "",

      federationMontant: "",
      federationRenouvellement: "",

      notes: "",
      actif: profiles.length === 0, // le tout premier devient actif par défaut

      paiements: [],
    };
    setForm(empty);
    setSelectedProfileId(null);
  };

  // ---------------------------
  // Forcer un profil comme actif unique
  // ---------------------------
  const makeActiveProfile = (id) => {
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        actif: p.id === id, // true uniquement pour celui choisi
      }))
    );

    // si on est justement en train d'éditer ce profil, mettre à jour le form.actif
    if (form.id === id) {
      setForm((f) => ({ ...f, actif: true }));
    } else {
      setForm((f) => ({ ...f, actif: false }));
    }
  };

  // ---------------------------
  // Enregistrer (ajout OU modification)
  // ---------------------------
  const saveProfile = () => {
    if (!form.nom) {
      alert("Le nom est requis");
      return;
    }

    if (form.id === null) {
      // création
      const newId = Date.now();
      const newProfileObj = {
        ...form,
        id: newId,
        paiements: form.paiements || [],
      };

      // très important : si ce nouveau profil doit être actif,
      // on enlève actif des autres
      let updatedProfiles = [...profiles];
      if (newProfileObj.actif) {
        updatedProfiles = updatedProfiles.map((p) => ({ ...p, actif: false }));
      }
      updatedProfiles.push(newProfileObj);

      setProfiles(updatedProfiles);
      setSelectedProfileId(newId);
      setForm((f) => ({ ...f, id: newId }));
    } else {
      // édition existante
      let updatedProfiles = profiles.map((p) =>
        p.id === form.id
          ? {
              ...p,
              nom: form.nom,
              dateNaissance: form.dateNaissance,
              type: form.type,

              abonnementMensuel: form.abonnementMensuel,
              optionCombatActive: form.optionCombatActive,
              optionCombatMontant: form.optionCombatMontant,
              optionArmesActive: form.optionArmesActive,
              optionArmesMontant: form.optionArmesMontant,

              federationMontant: form.federationMontant,
              federationRenouvellement: form.federationRenouvellement,

              notes: form.notes,
              actif: form.actif,
              paiements: form.paiements || [],
            }
          : p
      );

      // si ce profil est marqué actif -> désactiver les autres
      if (form.actif) {
        updatedProfiles = updatedProfiles.map((p) => ({
          ...p,
          actif: p.id === form.id,
        }));
      }

      setProfiles(updatedProfiles);
    }

    alert("✅ Profil enregistré");
  };

  // ---------------------------
  // Supprimer un profil
  // ---------------------------
  const deleteProfile = (id) => {
    if (!window.confirm("Supprimer ce profil ?")) return;

    let remaining = profiles.filter((p) => p.id !== id);

    // si on supprime le profil actif, il faut élire un nouveau actif
    const hadActive = profiles.find((p) => p.id === id && p.actif);
    if (hadActive && remaining.length > 0) {
      // rendre le premier restant actif
      remaining = remaining.map((p, idx) => ({
        ...p,
        actif: idx === 0,
      }));
    }

    setProfiles(remaining);

    // si on supprimait celui actuellement affiché
    if (selectedProfileId === id) {
      if (remaining.length > 0) {
        const first = remaining[0];
        setSelectedProfileId(first.id);
        selectProfileForEdit(first.id);
      } else {
        // plus personne
        startCreateNewProfile();
      }
    }
  };

  // ---------------------------
  // Ajouter un paiement à CE profil (dans le form local)
  // ---------------------------
  const addPayment = () => {
    if (!newPayment.montant || !newPayment.date) {
      alert("Montant et date sont requis pour ajouter un paiement.");
      return;
    }

    const updatedPaiements = [
      ...(form.paiements || []),
      {
        type: newPayment.type,
        montant: newPayment.montant,
        date: newPayment.date,
        statut: newPayment.statut,
        methode: newPayment.methode,
        payeur: newPayment.payeur,
      },
    ];

    setForm((f) => ({
      ...f,
      paiements: updatedPaiements,
    }));

    // reset paiement
    setNewPayment({
      type: "cours privé",
      montant: "",
      date: "",
      statut: "Payé",
      payeur: "Guillaume",
      methode: "Débit",
    });
  };

  // ---------------------------
  // Rendu
  // ---------------------------
  return (
    <div className="p-6 bg-white rounded-xl shadow border border-gray-100 text-gray-800">
      <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
        👥 Gestion des profils familiaux
      </h2>

      {/* --- Ligne de sélection rapide des profils --- */}
      <div className="flex flex-wrap items-start gap-2 mb-6">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProfileForEdit(p.id)}
            className={`px-3 py-2 rounded-lg text-sm border flex flex-col items-start ${
              selectedProfileId === p.id
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{p.nom}</span>
              {p.actif && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> actif
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-600">
              {p.type} · {computeAge(p.dateNaissance) || "—"} ans
            </div>
          </button>
        ))}

        {/* Bouton pour créer un nouveau profil */}
        <button
          onClick={startCreateNewProfile}
          className="px-3 py-2 rounded-lg text-sm border-2 border-dashed border-gray-400 text-gray-500 flex items-center gap-2 hover:bg-gray-50"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau profil
        </button>
      </div>

      {/* Si aucun profil n’est sélectionné encore */}
      {!form && (
        <p className="text-sm text-gray-500 italic">
          Sélectionne un profil ou crée-en un nouveau.
        </p>
      )}

      {/* --- Formulaire principal --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche : Infos générales & abonnement */}
        <div className="space-y-6">
          {/* Carte Infos générales */}
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800">
                1. Informations générales
              </h3>

              {form.id && (
                <button
                  onClick={() => makeActiveProfile(form.id)}
                  className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${
                    form.actif
                      ? "bg-green-100 text-green-700 border border-green-400"
                      : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  {form.actif ? "Profil actif" : "Définir actif"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Nom
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.nom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Date de naissance
                </label>
                <input
                  type="date"
                  className="border rounded p-2 text-sm"
                  value={form.dateNaissance}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateNaissance: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Type (Enfant / Ado / Adulte)
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option>Enfant</option>
                  <option>Ado</option>
                  <option>Adulte</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Notes internes
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Carte Abonnements mensuels */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">
              2. Abonnements mensuels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Abonnement principal ($ / mois)
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.abonnementMensuel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      abonnementMensuel: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Option Combat active ?
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={form.optionCombatActive ? "oui" : "non"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionCombatActive: e.target.value === "oui",
                    }))
                  }
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Supplément Combat ($ / mois)
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.optionCombatMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionCombatMontant: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Option Armes active ?
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={form.optionArmesActive ? "oui" : "non"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionArmesActive: e.target.value === "oui",
                    }))
                  }
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Supplément Armes ($ / mois)
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.optionArmesMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionArmesMontant: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4">
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Frais de fédération ($)
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={form.federationMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      federationMontant: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Renouvellement fédération (date)
                </label>
                <input
                  type="date"
                  className="border rounded p-2 text-sm"
                  value={form.federationRenouvellement}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      federationRenouvellement: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Boutons Sauver / Supprimer */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveProfile}
              className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 text-sm"
            >
              <Save className="w-4 h-4" />
              Enregistrer le profil
            </button>

            {form.id && (
              <button
                onClick={() => deleteProfile(form.id)}
                className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-red-50 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Colonne droite : Paiements */}
        <div className="space-y-6">
          {/* Paiements existants */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              3. Paiements déjà enregistrés
              <CreditCard className="w-4 h-4 text-gray-500" />
            </h3>

            {(!form.paiements || form.paiements.length === 0) ? (
              <p className="text-sm text-gray-500 italic">
                Aucun paiement enregistré.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Montant ($)</th>
                      <th className="p-2 text-left">Statut</th>
                      <th className="p-2 text-left">Payeur</th>
                      <th className="p-2 text-left">Méthode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.paiements.map((pay, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{pay.type}</td>
                        <td className="p-2">{pay.date}</td>
                        <td className="p-2 text-right font-semibold">
                          ${pay.montant}
                        </td>
                        <td className="p-2">{pay.statut}</td>
                        <td className="p-2">{pay.payeur}</td>
                        <td className="p-2">{pay.methode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ajouter un paiement */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">
              4. Ajouter un paiement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Type
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={newPayment.type}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      type: e.target.value,
                    }))
                  }
                >
                  <option>cours privé</option>
                  <option>fédération</option>
                  <option>compétition</option>
                  <option>passage ceinture</option>
                  <option>équipement</option>
                  <option>autre</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Montant ($)
                </label>
                <input
                  className="border rounded p-2 text-sm"
                  value={newPayment.montant}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      montant: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Date de paiement
                </label>
                <input
                  type="date"
                  className="border rounded p-2 text-sm"
                  value={newPayment.date}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Statut
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={newPayment.statut}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      statut: e.target.value,
                    }))
                  }
                >
                  <option>Payé</option>
                  <option>À payer</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Payeur
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={newPayment.payeur}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      payeur: e.target.value,
                    }))
                  }
                >
                  <option>Guillaume</option>
                  <option>Séverine</option>
                  <option>Autre</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-600 text-xs font-medium">
                  Méthode
                </label>
                <select
                  className="border rounded p-2 text-sm"
                  value={newPayment.methode}
                  onChange={(e) =>
                    setNewPayment((np) => ({
                      ...np,
                      methode: e.target.value,
                    }))
                  }
                >
                  <option>Débit</option>
                  <option>Crédit</option>
                  <option>Prélèvement</option>
                  <option>Cash</option>
                </select>
              </div>
            </div>

            <button
              onClick={addPayment}
              className="mt-4 bg-gray-800 text-white text-sm px-3 py-2 rounded hover:bg-black flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Ajouter ce paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
