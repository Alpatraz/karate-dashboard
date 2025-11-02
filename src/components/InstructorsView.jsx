import React, { useState, useEffect } from "react";

export default function InstructorsView() {
  const [instructors, setInstructors] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("karate_instructors") || "[]"
      );
    } catch {
      return [];
    }
  });

  // sync
  useEffect(() => {
    localStorage.setItem(
      "karate_instructors",
      JSON.stringify(instructors)
    );
  }, [instructors]);

  // ajouter un instructeur vide
  const addInstructor = () => {
    const nouveau = {
      id: crypto.randomUUID(),
      nom: "Nouvel instructeur",
      specialite: "",
      bio: "",
      tarif_prive: 0,
      actif: true,
    };
    setInstructors((prev) => [...prev, nouveau]);
  };

  // éditer un champ
  const updateInstructor = (id, field, value) => {
    setInstructors((prev) =>
      prev.map((inst) =>
        inst.id === id ? { ...inst, [field]: value } : inst
      )
    );
  };

  // supprimer
  const deleteInstructor = (id) => {
    if (!window.confirm("Supprimer cet instructeur ?")) return;
    setInstructors((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="text-gray-800">
      <h2 className="text-3xl font-bold mb-6 text-red-600">
        Instructeurs
      </h2>

      <div className="mb-4">
        <button
          onClick={addInstructor}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
        >
          + Ajouter un instructeur
        </button>
      </div>

      {instructors.length === 0 ? (
        <p className="text-gray-500 italic text-sm">
          Aucun instructeur pour le moment.
        </p>
      ) : (
        <div className="space-y-4">
          {instructors.map((inst) => (
            <div
              key={inst.id}
              className="bg-white border rounded-xl p-4 shadow-sm"
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">
                    Nom
                  </label>
                  <input
                    className="border rounded p-2 w-full text-sm"
                    value={inst.nom}
                    onChange={(e) =>
                      updateInstructor(
                        inst.id,
                        "nom",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">
                    Spécialité
                  </label>
                  <input
                    className="border rounded p-2 w-full text-sm"
                    placeholder="Armes, Combat, Formes..."
                    value={inst.specialite || ""}
                    onChange={(e) =>
                      updateInstructor(
                        inst.id,
                        "specialite",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">
                    Tarif privé ($)
                  </label>
                  <input
                    type="number"
                    className="border rounded p-2 w-full text-sm"
                    value={inst.tarif_prive || 0}
                    onChange={(e) =>
                      updateInstructor(
                        inst.id,
                        "tarif_prive",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">
                    Actif
                  </label>
                  <select
                    className="border rounded p-2 w-full text-sm"
                    value={inst.actif ? "oui" : "non"}
                    onChange={(e) =>
                      updateInstructor(
                        inst.id,
                        "actif",
                        e.target.value === "oui"
                      )
                    }
                  >
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Bio / Notes internes
                </label>
                <textarea
                  className="border rounded p-2 w-full text-sm"
                  rows={3}
                  value={inst.bio || ""}
                  onChange={(e) =>
                    updateInstructor(
                      inst.id,
                      "bio",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="text-right mt-3">
                <button
                  onClick={() => deleteInstructor(inst.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
