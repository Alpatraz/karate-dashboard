import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, UserCheck, Save } from "lucide-react";

export default function ProfileManager() {
  const [profiles, setProfiles] = useState(() => {
    return JSON.parse(localStorage.getItem("karate_profiles") || "[]");
  });

  const [editing, setEditing] = useState(null); // profil en cours d’édition
  const [form, setForm] = useState({
    id: null,
    nom: "",
    dateNaissance: "",
    type: "Adulte",
    club: "",
    instructeur: "",
    ceinture: "",
    objectif: "",
    notes: "",
  });

  // Calcul âge automatique
  const computeAge = (dateNaissance) => {
    if (!dateNaissance) return "";
    const birth = new Date(dateNaissance);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return years;
  };

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // Sélection du profil actif
  const setActiveProfile = (id) => {
    const updated = profiles.map((p) => ({ ...p, actif: p.id === id }));
    setProfiles(updated);
  };

  // Ajouter ou modifier
  const saveProfile = () => {
    if (!form.nom) return alert("Le nom est requis");
    if (editing) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === form.id ? { ...form } : p))
      );
    } else {
      const newProfile = {
        ...form,
        id: Date.now(),
        actif: profiles.length === 0, // le premier est actif par défaut
      };
      setProfiles([...profiles, newProfile]);
    }
    setForm({
      id: null,
      nom: "",
      dateNaissance: "",
      type: "Adulte",
      club: "",
      instructeur: "",
      ceinture: "",
      objectif: "",
      notes: "",
    });
    setEditing(null);
  };

  // Supprimer
  const deleteProfile = (id) => {
    if (!window.confirm("Supprimer ce profil ?")) return;
    const updated = profiles.filter((p) => p.id !== id);
    // Si on supprime le profil actif, activer le premier restant
    if (updated.every((p) => !p.actif) && updated.length > 0)
      updated[0].actif = true;
    setProfiles(updated);
  };

  // Charger un profil pour édition
  const editProfile = (p) => {
    setForm(p);
    setEditing(p.id);
  };

  // Profil actif
  const activeProfile = profiles.find((p) => p.actif);

  return (
    <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
      <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
        👥 Gestion des profils familiaux
      </h2>

      {/* Liste des profils */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`border rounded-lg p-3 shadow-sm ${
              p.actif ? "border-red-500 bg-red-50" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">{p.nom}</h3>
              {p.actif && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  Actif
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600">
              Âge : {computeAge(p.dateNaissance) || "—"} ans
            </p>
            <p className="text-sm text-gray-600">Ceinture : {p.ceinture || "—"}</p>
            <p className="text-sm text-gray-600">Type : {p.type}</p>

            <div className="flex justify-between items-center mt-3 text-sm">
              <button
                onClick={() => editProfile(p)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => deleteProfile(p.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="inline w-4 h-4" />
              </button>
            </div>

            {!p.actif && (
              <button
                onClick={() => setActiveProfile(p.id)}
                className="mt-3 w-full bg-red-500 text-white py-1 rounded hover:bg-red-600 text-sm"
              >
                <UserCheck className="inline w-4 h-4 mr-1" /> Activer
              </button>
            )}
          </div>
        ))}

        {/* Ajouter un profil */}
        <button
          onClick={() => setEditing(null)}
          className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 hover:bg-gray-50"
        >
          <PlusCircle className="text-gray-400 w-6 h-6 mb-1" />
          <span className="text-sm text-gray-600">Ajouter un profil</span>
        </button>
      </div>

      {/* Formulaire d’ajout / édition */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          {editing ? "Modifier le profil" : "Ajouter un nouveau profil"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="date"
            value={form.dateNaissance}
            onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
            className="border rounded p-2"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border rounded p-2"
          >
            <option value="Enfant">Enfant</option>
            <option value="Ado">Ado</option>
            <option value="Adulte">Adulte</option>
          </select>
          <input
            type="text"
            placeholder="Club"
            value={form.club}
            onChange={(e) => setForm({ ...form, club: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Instructeur"
            value={form.instructeur}
            onChange={(e) => setForm({ ...form, instructeur: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Ceinture"
            value={form.ceinture}
            onChange={(e) => setForm({ ...form, ceinture: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Objectif"
            value={form.objectif}
            onChange={(e) => setForm({ ...form, objectif: e.target.value })}
            className="border rounded p-2"
          />
        </div>

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border rounded p-2 w-full mt-2"
          rows={3}
        />

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={saveProfile}
            className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-1 hover:bg-red-700"
          >
            <Save className="w-4 h-4" /> Enregistrer
          </button>
          {editing && (
            <button
              onClick={() => {
                setForm({
                  id: null,
                  nom: "",
                  dateNaissance: "",
                  type: "Adulte",
                  club: "",
                  instructeur: "",
                  ceinture: "",
                  objectif: "",
                  notes: "",
                });
                setEditing(null);
              }}
              className="text-gray-600 hover:text-black"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {activeProfile && (
        <p className="text-xs text-gray-500 mt-4 italic">
          Profil actif : {activeProfile.nom} ({activeProfile.ceinture || "—"})
        </p>
      )}
    </div>
  );
}
