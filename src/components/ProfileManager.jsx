import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

export default function ProfileManager() {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    dateNaissance: "",
    type: "Adulte",
    dojo: "",
    abonnementMensuel: 0,
    combat: false,
    armes: false,
    combatMontant: 0,
    armesMontant: 0,
    federationMontant: 0,
    federationDate: "",
    paiements: [], // ✅ toujours initialisé
  });

  const [selectedProfile, setSelectedProfile] = useState(null);

  // Charger les profils
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    setProfiles(saved);
  }, []);

  // Sauvegarde
  const saveProfiles = (data) => {
    setProfiles(data);
    localStorage.setItem("karate_profiles", JSON.stringify(data));
  };

  // Ajouter ou modifier un profil
  const handleSave = () => {
    let updated;
    if (selectedProfile) {
      updated = profiles.map((p) =>
        p.nom === selectedProfile.nom ? { ...form } : p
      );
    } else {
      updated = [...profiles, { ...form, id: Date.now() }];
    }
    saveProfiles(updated);
    setForm({
      nom: "",
      dateNaissance: "",
      type: "Adulte",
      dojo: "",
      abonnementMensuel: 0,
      combat: false,
      armes: false,
      combatMontant: 0,
      armesMontant: 0,
      federationMontant: 0,
      federationDate: "",
      paiements: [],
    });
    setSelectedProfile(null);
  };

  // Supprimer un profil
  const handleDelete = (nom) => {
    if (window.confirm("Supprimer ce profil ?")) {
      const updated = profiles.filter((p) => p.nom !== nom);
      saveProfiles(updated);
    }
  };

  // Ajouter un paiement additionnel
  const addPayment = () => {
    const nouveauPaiement = {
      categorie: "",
      detail: "",
      montant: 0,
      date: new Date().toISOString().split("T")[0],
      statut: "Payé",
      modePaiement: "",
      payePar: "",
    };
    setForm({
      ...form,
      paiements: [...(form.paiements || []), nouveauPaiement],
    });
  };

  const removePayment = (index) => {
    const updated = form.paiements.filter((_, i) => i !== index);
    setForm({ ...form, paiements: updated });
  };

  return (
    <div className="p-6 text-gray-800">
      <h1 className="text-2xl font-bold text-red-600 mb-6">
        👨‍👩‍👧‍👦 Gestion des profils familiaux
      </h1>

      {/* === Liste des profils === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {profiles.map((p) => (
          <div
            key={p.nom}
            className={`border rounded-xl p-4 shadow hover:shadow-md transition ${
              selectedProfile?.nom === p.nom ? "border-red-500" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg">{p.nom}</h2>
                <p className="text-sm text-gray-600">
                  {p.type} – {p.dojo || "Dojo non spécifié"}
                </p>
                <p className="text-sm text-gray-600">
                  Abonnement : ${p.abonnementMensuel || 0}/mois
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProfile(p)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(p.nom)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div
          onClick={() => setSelectedProfile(null)}
          className="border-dashed border-2 border-gray-300 rounded-xl p-4 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-500 cursor-pointer"
        >
          <PlusCircle className="mr-2" /> Ajouter un profil
        </div>
      </div>

      {/* === Formulaire profil === */}
      <div className="bg-white border rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          {selectedProfile ? "Modifier le profil" : "Créer un profil"}
        </h2>

        {/* Nom et date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600">Nom du profil</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Date de naissance</label>
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={form.dateNaissance}
              onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
            />
          </div>
        </div>

        {/* Type / Dojo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select
              className="border rounded p-2 w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Adulte</option>
              <option>Enfant</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Dojo</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={form.dojo}
              onChange={(e) => setForm({ ...form, dojo: e.target.value })}
            />
          </div>
        </div>

        {/* Abonnement */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">💳 Abonnement mensuel</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600">Base ($)</label>
              <input
                type="number"
                className="border rounded p-2 w-full text-right"
                value={form.abonnementMensuel}
                onChange={(e) =>
                  setForm({ ...form, abonnementMensuel: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.combat}
                onChange={(e) => setForm({ ...form, combat: e.target.checked })}
              />
              <span>Combat</span>
              <input
                type="number"
                placeholder="$/mois"
                className="border rounded p-2 w-20 text-right"
                value={form.combatMontant}
                onChange={(e) =>
                  setForm({ ...form, combatMontant: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.armes}
                onChange={(e) => setForm({ ...form, armes: e.target.checked })}
              />
              <span>Armes</span>
              <input
                type="number"
                placeholder="$/mois"
                className="border rounded p-2 w-20 text-right"
                value={form.armesMontant}
                onChange={(e) =>
                  setForm({ ...form, armesMontant: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>

        {/* Fédération */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">🏛️ Fédération</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Montant ($)</label>
              <input
                type="number"
                className="border rounded p-2 w-full text-right"
                value={form.federationMontant}
                onChange={(e) =>
                  setForm({ ...form, federationMontant: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date de renouvellement</label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={form.federationDate}
                onChange={(e) => setForm({ ...form, federationDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Paiements additionnels */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            💰 Paiements additionnels
            <button
              onClick={addPayment}
              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
            >
              <PlusCircle size={16} /> Ajouter
            </button>
          </h3>

          {form.paiements.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun paiement ajouté.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left">Catégorie</th>
                  <th className="p-2 text-left">Détail</th>
                  <th className="p-2 text-right">Montant ($)</th>
                  <th className="p-2 text-center">Date</th>
                  <th className="p-2 text-center">Mode de paiement</th>
                  <th className="p-2 text-center">Payé par</th>
                  <th className="p-2 text-center">Statut</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {form.paiements.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <input
                        type="text"
                        value={p.categorie}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].categorie = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={p.detail}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].detail = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1 w-full"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={p.montant}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].montant = parseFloat(e.target.value) || 0;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1 w-24 text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="date"
                        value={p.date}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].date = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={p.modePaiement}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].modePaiement = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1"
                      >
                        <option value="">—</option>
                        <option>Carte de crédit</option>
                        <option>Carte de débit</option>
                        <option>Interac</option>
                        <option>Cash</option>
                        <option>Prélèvement</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={p.payePar}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].payePar = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1"
                      >
                        <option value="">—</option>
                        <option>Guillaume</option>
                        <option>Séverine</option>
                        <option>Autre</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={p.statut}
                        onChange={(e) => {
                          const updated = [...form.paiements];
                          updated[i].statut = e.target.value;
                          setForm({ ...form, paiements: updated });
                        }}
                        className="border rounded p-1"
                      >
                        <option>Payé</option>
                        <option>À payer</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removePayment(i)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={handleSave}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Enregistrer le profil
        </button>
      </div>
    </div>
  );
}
