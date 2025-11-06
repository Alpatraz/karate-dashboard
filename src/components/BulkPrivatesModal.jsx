import React, { useEffect, useState } from "react";

// --- helpers pour la compatibilité des noms de champs ---
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

export default function BulkPrivatesModal({ show, onClose, onAddMany }) {
  const instructors = JSON.parse(localStorage.getItem("karate_instructors") || "[]");

  const COURSE_TYPES = [
    { value: "privé", label: "🤝 Cours privé" },
    { value: "semi", label: "👥 Demi-privé" },
  ];

  const [count, setCount] = useState(4);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!show) return;
    const today = new Date().toISOString().split("T")[0];
    const baseInstructor = instructors.find((i) => i.actif === "Oui") || instructors[0];
    const initial = Array.from({ length: count }).map(() => ({
      title: "Cours privé",
      type: "privé",
      date: today,
      time: "18h-19h",
      instructor: baseInstructor?.id || "",
      prix: getPrivRate(baseInstructor),
    }));
    setRows(initial);
  }, [show, count]);

  if (!show) return null;

  const computePrice = (type, instructorId) => {
    const inst = instructors.find((i) => i.id === instructorId);
    if (!inst) return 0;
    const t = normType(type);
    return t === "semi" ? getSemiPrivRate(inst) : getPrivRate(inst);
  };

  const update = (idx, patch) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      next[idx].prix = computePrice(next[idx].type, next[idx].instructor);
      return next;
    });
  };

  const submit = () => {
    const clean = rows
      .filter((r) => r.date && r.time)
      .map((r) => ({
        ...r,
        title: r.title || (r.type === "semi" ? "Demi-privé" : "Cours privé"),
        participants: [],
      }));

    if (clean.length === 0) {
      alert("⚠️ Renseigne au moins une ligne (date et heure).");
      return;
    }
    onAddMany(clean);
  };

  const total = rows.reduce((sum, r) => sum + (Number(r.prix) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[85vh] flex flex-col shadow-xl">
        <div className="p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            🤝 Ajouter plusieurs cours privés / demi-privés
          </h3>

          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm text-gray-700">Nombre de cours :</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
              }
              className="border rounded px-2 py-1 w-20"
            />
            <span className="text-xs text-gray-500">
              (max 20 d’un coup pour garder la lisibilité)
            </span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <table className="min-w-full text-xs border border-gray-200">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left">Titre</th>
                <th className="p-2 text-center">Type</th>
                <th className="p-2 text-center">Date</th>
                <th className="p-2 text-center">Heure</th>
                <th className="p-2 text-left">Instructeur</th>
                <th className="p-2 text-right">Coût ($)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-full"
                      value={r.title}
                      onChange={(e) => update(idx, { title: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <select
                      className="border rounded p-1"
                      value={r.type}
                      onChange={(e) => update(idx, { type: e.target.value })}
                    >
                      {COURSE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="date"
                      className="border rounded p-1"
                      value={r.date}
                      onChange={(e) => update(idx, { date: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      className="border rounded p-1 w-28 text-center"
                      value={r.time}
                      onChange={(e) => update(idx, { time: e.target.value })}
                      placeholder="18h-19h"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="border rounded p-1 w-full"
                      value={r.instructor}
                      onChange={(e) => update(idx, { instructor: e.target.value })}
                    >
                      <option value="">— Choisir —</option>
                      {instructors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nom} ({i.specialite})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-right text-gray-700 font-medium">
                    {r.prix?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-white p-4 flex justify-between items-center">
          <div className="text-gray-700 text-sm">
            💰 Total estimé :{" "}
            <span className="font-semibold text-gray-900">{total.toFixed(2)} $</span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={submit}
            >
              Ajouter les {rows.length} cours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
