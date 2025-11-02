import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export default function PlanningEditor({ planning, setPlanning }) {
  const [localPlan, setLocalPlan] = useState(planning || []);

  useEffect(() => {
    setLocalPlan(planning || []);
  }, [planning]);

  const addCourse = (jour) => {
    setLocalPlan((prev) => {
      const updated = [...prev];
      let bloc = updated.find((p) => p.jour === jour);
      if (!bloc) {
        bloc = { jour, cours: [] };
        updated.push(bloc);
      }
      bloc.cours.push({ nom: "", heure: "", type: "Adulte" });
      return [...updated];
    });
  };

  const updateCourse = (jour, idx, field, value) => {
    setLocalPlan((prev) =>
      prev.map((day) =>
        day.jour === jour
          ? {
              ...day,
              cours: day.cours.map((c, i) =>
                i === idx ? { ...c, [field]: value } : c
              ),
            }
          : day
      )
    );
  };

  const removeCourse = (jour, idx) => {
    setLocalPlan((prev) =>
      prev.map((day) =>
        day.jour === jour
          ? { ...day, cours: day.cours.filter((_, i) => i !== idx) }
          : day
      )
    );
  };

  const saveAll = () => {
    setPlanning(localPlan);
    localStorage.setItem("karate_planning", JSON.stringify(localPlan));
    alert("✅ Planning enregistré !");
  };

  return (
    <div className="space-y-6">
      {DAYS.map((jour) => {
        const bloc = localPlan.find((p) => p.jour === jour);
        const cours = bloc?.cours || [];
        return (
          <div key={jour} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-bold text-red-600 mb-3">{jour}</h3>

            {cours.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  className="border rounded p-1 flex-1 text-sm"
                  placeholder="Nom du cours"
                  value={c.nom}
                  onChange={(e) =>
                    updateCourse(jour, idx, "nom", e.target.value)
                  }
                />
                <input
                  className="border rounded p-1 w-32 text-sm"
                  placeholder="Heure"
                  value={c.heure}
                  onChange={(e) =>
                    updateCourse(jour, idx, "heure", e.target.value)
                  }
                />
                <select
                  className="border rounded p-1 text-sm"
                  value={c.type}
                  onChange={(e) =>
                    updateCourse(jour, idx, "type", e.target.value)
                  }
                >
                  <option value="Adulte">Adulte</option>
                  <option value="Enfant">Enfant</option>
                  <option value="Équipe">Équipe</option>
                </select>
                <button
                  onClick={() => removeCourse(jour, idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={() => addCourse(jour)}
              className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800"
            >
              <PlusCircle size={14} />
              Ajouter
            </button>
          </div>
        );
      })}

      <button
        onClick={saveAll}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        💾 Enregistrer le planning
      </button>
    </div>
  );
}
