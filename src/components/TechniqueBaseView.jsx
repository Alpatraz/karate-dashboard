// src/components/TechniqueBaseView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { BASE_TECHNIQUES } from "../data/baseTechniques";
import { CheckCircle2, RotateCcw, Clock, Search } from "lucide-react";

const STATUT_OPTIONS = [
  { value: "", label: "—", icon: "" },
  { value: "appris", label: "✅ Appris", icon: "✅" },
  { value: "revoir", label: "🔁 À revoir", icon: "🔁" },
  { value: "en_cours", label: "🕓 En cours", icon: "🕓" },
];

export default function TechniqueBaseView({ activeProfile }) {
  const [filterCat, setFilterCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState({}); // { [techId]: { statut, date, feeling, video, notes } }

  // Clé de stockage par profil
  const storageKey = activeProfile
    ? `karate_tech_base_${activeProfile.id}`
    : "karate_tech_base_default";

  // Chargement
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    setProgress(raw ? JSON.parse(raw) : {});
  }, [storageKey]);

  // Sauvegarde
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  if (!activeProfile) {
    return (
      <div className="p-6 text-gray-500">
        Aucun profil actif sélectionné.
      </div>
    );
  }

  const categories = useMemo(() => {
    const set = new Set(BASE_TECHNIQUES.map((t) => t.categorie));
    return ["Tous", ...Array.from(set)];
  }, []);

  const techniquesFiltrees = BASE_TECHNIQUES.filter((t) => {
    const matchCat = filterCat === "Tous" || t.categorie === filterCat;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.nom.toLowerCase().includes(q) ||
      t.categorie.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const updateField = (id, field, value) => {
    setProgress((prev) => ({
      ...prev,
      [id]: {
        statut: "",
        date_apprentissage: "",
        feeling: "",
        lien_video_perso: "",
        notes: "",
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const getStatut = (id) => progress[id]?.statut || "";
  const getField = (id, field) => progress[id]?.[field] || "";

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🧱 Base technique – {activeProfile.nom}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Coche chaque technique quand elle est ✅ apprise, 🔁 à revoir ou 🕓
            en cours. Ajoute la date, ton feeling et un lien vers ta vidéo
            perso si tu veux.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="border border-gray-300 rounded pl-8 pr-3 py-2 text-sm w-full"
              placeholder="Rechercher une technique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* petit résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {STATUT_OPTIONS.filter((s) => s.value !== "").map((s) => {
          const count = Object.values(progress).filter(
            (p) => p.statut === s.value
          ).length;
          return (
            <div
              key={s.value}
              className="bg-white border rounded-lg p-3 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-gray-700">{s.label}</span>
              </div>
              <span className="font-bold text-red-600">{count}</span>
            </div>
          );
        })}
      </div>

      {/* tableau techniques */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold bg-gray-50 border-b text-gray-600">
          <div className="col-span-3">Technique</div>
          <div className="col-span-2">Catégorie</div>
          <div className="col-span-2">Ceintures</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-3">Détails</div>
        </div>

        <div className="divide-y">
          {techniquesFiltrees.map((t) => (
            <div
              key={t.id}
              className="px-3 py-3 text-sm grid grid-cols-1 md:grid-cols-12 gap-2 items-start hover:bg-gray-50"
            >
              {/* Nom */}
              <div className="md:col-span-3">
                <p className="font-semibold text-gray-900">{t.nom}</p>
                <p className="text-xs text-gray-500">
                  Type : {t.type || "—"}
                </p>
              </div>

              {/* Catégorie */}
              <div className="md:col-span-2 text-gray-700">
                {t.categorie}
              </div>

              {/* Ceintures */}
              <div className="md:col-span-2 text-gray-700 text-sm">
                {t.ceinture_min} → {t.ceinture_max}
              </div>

              {/* Statut */}
              <div className="md:col-span-2">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-full"
                  value={getStatut(t.id)}
                  onChange={(e) =>
                    updateField(t.id, "statut", e.target.value)
                  }
                >
                  {STATUT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="border border-gray-200 rounded px-2 py-1 text-xs mt-1 w-full"
                  value={getField(t.id, "date_apprentissage")}
                  onChange={(e) =>
                    updateField(t.id, "date_apprentissage", e.target.value)
                  }
                />
              </div>

              {/* Détails */}
              <div className="md:col-span-3 space-y-1">
                <input
                  type="text"
                  placeholder="Feeling (facile, difficile, points à travailler...)"
                  className="border border-gray-200 rounded px-2 py-1 text-xs w-full"
                  value={getField(t.id, "feeling")}
                  onChange={(e) =>
                    updateField(t.id, "feeling", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Lien vidéo perso (YouTube, Drive...)"
                  className="border border-gray-200 rounded px-2 py-1 text-xs w-full"
                  value={getField(t.id, "lien_video_perso")}
                  onChange={(e) =>
                    updateField(t.id, "lien_video_perso", e.target.value)
                  }
                />
                <textarea
                  rows={2}
                  placeholder="Notes techniques / rappels pour t'en souvenir"
                  className="border border-gray-200 rounded px-2 py-1 text-xs w-full resize-y"
                  value={getField(t.id, "notes")}
                  onChange={(e) =>
                    updateField(t.id, "notes", e.target.value)
                  }
                />
              </div>
            </div>
          ))}

          {techniquesFiltrees.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Aucune technique ne correspond à ce filtre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
