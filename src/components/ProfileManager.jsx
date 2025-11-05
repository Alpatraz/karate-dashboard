import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Save, CreditCard, UserCheck } from "lucide-react";

export default function ProfileManager() {
  const [profiles, setProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    } catch {
      return [];
    }
  });

  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [form, setForm] = useState({
    id: null,
    nom: "",
    dateNaissance: "",
    type: "Adulte",
    abonnementMensuel: "",
    optionCombatMontant: "",
    optionArmesMontant: "",
    federationMontant: "",
    notes: "",
    actif: false,
    paiements: [],
  });

  const [newPayment, setNewPayment] = useState({
    type: "cours privé",
    montant: "",
    date: "",
    statut: "Payé",
    payeur: "Guillaume",
    methode: "Débit",
  });

  const ym = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  // === Sauvegarde persistante ===
  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // === Sélection d’un profil ===
  const selectProfileForEdit = (id) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setSelectedProfileId(id);
    setForm({ ...p });
  };

  // === Nouveau profil ===
  const startCreateNewProfile = () => {
    const empty = {
      id: null,
      nom: "",
      dateNaissance: "",
      type: "Adulte",
      abonnementMensuel: "",
      optionCombatMontant: "",
      optionArmesMontant: "",
      federationMontant: "",
      notes: "",
      actif: profiles.length === 0,
      paiements: [],
    };
    setForm(empty);
    setSelectedProfileId(null);
  };

  // === Activer un profil ===
  const makeActiveProfile = (id) => {
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        actif: p.id === id,
      }))
    );
    setForm((f) => ({ ...f, actif: f.id === id }));
  };

  // === Enregistrement d’un profil ===
  const saveProfile = () => {
    if (!form.nom) {
      alert("Le nom est requis");
      return;
    }

    const base = parseFloat(form.abonnementMensuel || 0);
    const supCombat = parseFloat(form.optionCombatMontant || 0);
    const supArmes = parseFloat(form.optionArmesMontant || 0);
    const total = base + supCombat + supArmes;

    const parsedForm = {
      ...form,
      abonnementMensuel: base,
      optionCombatMontant: supCombat,
      optionArmesMontant: supArmes,
      abonnementTotal: total,
      paiements: Array.isArray(form.paiements) ? form.paiements : [],
    };

    // === Création automatique du paiement d’abonnement du mois ===
    const today = new Date();
    const currentYM = ym(today);
    const already = parsedForm.paiements.some((pay) => {
      const d = new Date(pay.date);
      return (
        pay.type === "Abonnement mensuel" &&
        ym(d) === currentYM
      );
    });

    if (!already && total > 0) {
      parsedForm.paiements.push({
        type: "Abonnement mensuel",
        montant: total,
        date: `${currentYM}-01`,
        statut: "À payer",
        payeur: parsedForm.nom,
        methode: "—",
      });
    }

    let updatedProfiles;
    if (parsedForm.id === null) {
      const newId = Date.now();
      const newProfile = { ...parsedForm, id: newId };
      updatedProfiles = [...profiles, newProfile];
      setSelectedProfileId(newId);
      setForm(newProfile);
    } else {
      updatedProfiles = profiles.map((p) =>
        p.id === parsedForm.id ? parsedForm : p
      );
    }

    if (parsedForm.actif) {
      updatedProfiles = updatedProfiles.map((p) => ({
        ...p,
        actif: p.id === parsedForm.id,
      }));
    }

    setProfiles(updatedProfiles);
    alert("✅ Profil enregistré");
  };

  // === Supprimer un profil ===
  const deleteProfile = (id) => {
    if (!window.confirm("Supprimer ce profil ?")) return;
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    if (selectedProfileId === id) {
      startCreateNewProfile();
    }
  };

  // === Ajouter un paiement manuel ===
  const addPayment = () => {
    if (!newPayment.montant || !newPayment.date) {
      alert("Montant et date requis");
      return;
    }
    const paymentData = {
      ...newPayment,
      montant: parseFloat(newPayment.montant),
    };
    const updatedPaiements = [...(form.paiements || []), paymentData];

    setForm((f) => ({ ...f, paiements: updatedPaiements }));
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === form.id ? { ...p, paiements: updatedPaiements } : p
      )
    );

    setNewPayment({
      type: "cours privé",
      montant: "",
      date: "",
      statut: "Payé",
      payeur: "Guillaume",
      methode: "Débit",
    });
  };

  // === Mise à jour d’un paiement (statut, méthode, date, etc.) ===
  const updatePayment = (index, field, value) => {
    const updated = [...form.paiements];
    updated[index][field] = value;
    setForm((f) => ({ ...f, paiements: updated }));
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === form.id ? { ...p, paiements: updated } : p
      )
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow border border-gray-100 text-gray-800">
      <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
        👥 Gestion des profils familiaux
      </h2>

      {/* Liste des profils */}
      <div className="flex flex-wrap items-start gap-2 mb-6">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProfileForEdit(p.id)}
            className={`px-3 py-2 rounded-lg text-sm border flex flex-col items-start ${
              selectedProfileId === p.id
  ? "bg-red-100 text-red-700 border-red-400 shadow-sm"
  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"

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
              {p.type} · Abonnement{" "}
              {(
                p.abonnementTotal ||
                parseFloat(p.abonnementMensuel || 0) +
                  parseFloat(p.optionCombatMontant || 0) +
                  parseFloat(p.optionArmesMontant || 0)
              ).toFixed(2)}
              $
            </div>
          </button>
        ))}

        <button
          onClick={startCreateNewProfile}
          className="px-3 py-2 rounded-lg text-sm border-2 border-dashed border-gray-400 text-gray-500 flex items-center gap-2 hover:bg-gray-50"
        >
          <PlusCircle className="w-4 h-4" /> Nouveau profil
        </button>
      </div>

      {/* Formulaire principal */}
      {form && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">
                1. Informations générales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <input
                  className="border rounded p-2"
                  placeholder="Nom"
                  value={form.nom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="border rounded p-2"
                  value={form.dateNaissance || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateNaissance: e.target.value }))
                  }
                />
                <select
                  className="border rounded p-2"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option>Enfant</option>
                  <option>Ado</option>
                  <option>Adulte</option>
                </select>
                <input
                  className="border rounded p-2"
                  placeholder="Notes internes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Abonnements */}
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">
                2. Abonnements mensuels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <input
                  className="border rounded p-2"
                  placeholder="Abonnement principal $"
                  value={form.abonnementMensuel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      abonnementMensuel: e.target.value,
                    }))
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Supplément Combat $"
                  value={form.optionCombatMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionCombatMontant: e.target.value,
                    }))
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Supplément Armes $"
                  value={form.optionArmesMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      optionArmesMontant: e.target.value,
                    }))
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Frais fédération $"
                  value={form.federationMontant}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      federationMontant: e.target.value,
                    }))
                  }
                />
              </div>
              <p className="text-right text-sm mt-2 text-gray-700">
                💰 Total mensuel :{" "}
                {(parseFloat(form.abonnementMensuel || 0) +
                  parseFloat(form.optionCombatMontant || 0) +
                  parseFloat(form.optionArmesMontant || 0)
                ).toFixed(2)}{" "}
                $
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveProfile}
                className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 text-sm"
              >
                <Save className="w-4 h-4" /> Enregistrer le profil
              </button>
              {form.id && (
                <button
                  onClick={() => deleteProfile(form.id)}
                  className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-red-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Paiements */}
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                3. Paiements enregistrés <CreditCard className="w-4 h-4" />
              </h3>
              {!form.paiements || form.paiements.length === 0 ? (
  <p className="text-sm text-gray-500 italic">
    Aucun paiement enregistré.
  </p>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full text-xs border border-gray-200 rounded-lg">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="p-2 text-left w-32">Type</th>
          <th className="p-2 text-center w-28">Date</th>
          <th className="p-2 text-right w-24">Montant</th>
          <th className="p-2 text-center w-28">Statut</th>
          <th className="p-2 text-center w-32">Méthode</th>
        </tr>
      </thead>
      <tbody>
        {form.paiements.map((p, i) => (
          <tr key={i} className="border-t hover:bg-gray-50 transition">
            <td className="p-2">{p.type}</td>
            <td className="p-2 text-center">
              <input
                type="date"
                className="border rounded p-1 text-xs"
                value={p.date || ""}
                onChange={(e) => updatePayment(i, "date", e.target.value)}
              />
            </td>
            <td className="p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 text-xs w-20 text-right"
                value={p.montant || ""}
                onChange={(e) => updatePayment(i, "montant", e.target.value)}
              />
            </td>
            <td className="p-2 text-center">
              <select
                className="border rounded p-1 text-xs"
                value={p.statut}
                onChange={(e) => updatePayment(i, "statut", e.target.value)}
              >
                <option>Payé</option>
                <option>À payer</option>
              </select>
            </td>
            <td className="p-2 text-center">
              <select
                className="border rounded p-1 text-xs"
                value={p.methode || ""}
                onChange={(e) => updatePayment(i, "methode", e.target.value)}
              >
                <option>—</option>
                <option>Débit</option>
                <option>Crédit</option>
                <option>Cash</option>
                <option>Prélèvement</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
            </div>

            {/* Ajouter paiement */}
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">
                4. Ajouter un paiement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <select
                  className="border rounded p-2"
                  value={newPayment.type}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, type: e.target.value }))
                  }
                >
                  <option>cours privé</option>
                  <option>fédération</option>
                  <option>compétition</option>
                  <option>passage ceinture</option>
                  <option>équipement</option>
                  <option>autre</option>
                </select>
                <input
                  className="border rounded p-2"
                  placeholder="Montant"
                  value={newPayment.montant}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, montant: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="border rounded p-2"
                  value={newPayment.date}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, date: e.target.value }))
                  }
                />
                <select
                  className="border rounded p-2"
                  value={newPayment.statut}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, statut: e.target.value }))
                  }
                >
                  <option>Payé</option>
                  <option>À payer</option>
                </select>
                <select
                  className="border rounded p-2"
                  value={newPayment.methode}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, methode: e.target.value }))
                  }
                >
                  <option>Débit</option>
                  <option>Crédit</option>
                  <option>Cash</option>
                  <option>Prélèvement</option>
                </select>
                <select
                  className="border rounded p-2"
                  value={newPayment.payeur}
                  onChange={(e) =>
                    setNewPayment((np) => ({ ...np, payeur: e.target.value }))
                  }
                >
                  <option>Guillaume</option>
                  <option>Séverine</option>
                  <option>Autre</option>
                </select>
              </div>
              <button
                onClick={addPayment}
                className="mt-4 bg-gray-800 text-white text-sm px-3 py-2 rounded hover:bg-black flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Ajouter ce paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
