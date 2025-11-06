import React, { useState, useEffect } from "react";

// --- helpers prix instructeur (robuste aux variantes de clés) ---
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const getPrivRate = (inst) =>
  num(
    inst?.tarifPrive ??
      inst?.tarif_prive ??
      inst?.tarifPrivé ??
      inst?.["tarif privé"] ??
      0
  );

const getSemiPrivRate = (inst) =>
  num(
    inst?.tarifSemiPrive ??
      inst?.tarif_semi_prive ??
      inst?.tarifSemiPrivé ??
      inst?.["tarif semi-prive"] ??
      inst?.["tarif semi-privé"] ??
      0
  );

const normType = (t = "") => {
  const s = t.toString().toLowerCase();
  if (s.includes("semi")) return "semi";
  if (s.includes("priv")) return "privé";
  return "groupe";
};

export default function AddEventModal({ show, onClose, onAdd }) {
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "groupe",
    participants: [],
    instructor: "",
    prix: 0,
  });

  const instructors = JSON.parse(localStorage.getItem("karate_instructors") || "[]");

  const computePrice = (type, instructorId) => {
    const inst = instructors.find((i) => i.id === instructorId);
    if (!inst) return 0;
    const t = normType(type);
    return t === "semi" ? getSemiPrivRate(inst) : getPrivRate(inst);
  };

  // Reset quand on ferme
  useEffect(() => {
    if (!show) {
      setNewEvent({
        title: "",
        date: "",
        time: "",
        type: "groupe",
        participants: [],
        instructor: "",
        prix: 0,
      });
    }
  }, [show]);

  // 🔥 IMPORTANT : ce hook doit être AVANT le if (!show)
  // Recalcule le prix quand le type change
  useEffect(() => {
    setNewEvent((prev) => ({
      ...prev,
      prix: computePrice(prev.type, prev.instructor),
    }));
  }, [newEvent.type]); // recalcul automatique quand on change de type

  if (!show) return null;

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.date) return;
    onAdd(newEvent);
    onClose();
  };

  const handleInstructorChange = (id) => {
    setNewEvent((prev) => ({
      ...prev,
      instructor: id,
      prix: computePrice(prev.type, id),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
        <h3 className="text-lg font-bold mb-3">Ajouter un événement</h3>

        <input
          type="text"
          placeholder="Nom de l'événement"
          className="border p-2 w-full mb-2 rounded"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 w-full mb-2 rounded"
          value={newEvent.date}
          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
        />

        <input
          type="text"
          placeholder="Heure (ex: 18h-19h)"
          className="border p-2 w-full mb-2 rounded"
          value={newEvent.time}
          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
        />

        <select
          className="border p-2 w-full mb-3 rounded"
          value={newEvent.type}
          onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
        >
          <option value="groupe">🥋 Cours de groupe</option>
          <option value="privé">🤝 Cours privé</option>
          <option value="semi">👥 Demi-privé</option>
          <option value="maison">💪 Entraînement maison</option>
          <option value="competition">🏆 Compétition</option>
          <option value="passage">🎯 Passage de ceinture</option>
          <option value="seminaire">📚 Séminaire</option>
        </select>

        {["privé", "semi"].includes(newEvent.type) && (
          <>
            <label className="block text-sm mb-1 text-gray-600">Instructeur :</label>
            <select
              className="border p-2 w-full mb-2 rounded"
              value={newEvent.instructor}
              onChange={(e) => handleInstructorChange(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nom} ({i.specialite})
                </option>
              ))}
            </select>

            <label className="block text-sm mb-1 text-gray-600">
              Participants supplémentaires :
            </label>
            <input
              type="text"
              placeholder="Séparer les prénoms par une virgule"
              className="border p-2 w-full mb-2 rounded"
              onChange={(e) =>
                setNewEvent({
                  ...newEvent,
                  participants: e.target.value.split(",").map((s) => s.trim()),
                })
              }
            />
          </>
        )}

        {newEvent.prix > 0 && (
          <p className="text-sm text-gray-600 mb-2">
            💰 Coût estimé : <strong>{newEvent.prix}$</strong>
          </p>
        )}

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ajouter
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 px-3 py-2 rounded hover:bg-gray-100"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
