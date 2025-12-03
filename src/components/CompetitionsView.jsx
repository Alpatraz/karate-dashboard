import React, { useState, useEffect, useMemo } from "react";
import { PlusCircle, Trash2, Trophy, Calendar, MapPin } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- PRÉSETS POUR LES CATÉGORIES, ÂGES, NIVEAUX ---

const CATEGORY_PRESETS = {
  kata: [
    "Kata traditionnel",
    "Kata créatif",
    "Kata armes",
    "Kata main nue",
  ],
  combat: [
    "Combat point fighting",
    "Combat light contact",
    "Combat continu",
    "Combat équipe",
  ],
  arme: [
    "Kobudo – Bō",
    "Kobudo – Sai",
    "Kobudo – Tonfa",
    "Kobudo – Kama",
  ],
};

const AGE_PRESETS = [
  "8 ans et moins",
  "9-10 ans",
  "11-12 ans",
  "13-14 ans",
  "15 ans et plus",
];

const NIVEAU_PRESETS = [
  "Débutant",
  "Intermédiaire",
  "Avancé",
  "Élite",
];

export default function CompetitionView({ activeProfile }) {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // === GESTION DES DONNÉES EN LOCAL ===
  const storageKey = activeProfile
    ? `karate_competitions_${activeProfile.id}`
    : "karate_competitions_default";

  // Charger depuis localStorage quand le profil change
  useEffect(() => {
    if (!activeProfile) return;
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setCompetitions(Array.isArray(saved) ? saved : []);
    setSelectedComp(null);
  }, [activeProfile]); // storageKey dérive d'activeProfile, pas besoin de l'ajouter

  // Sauvegarde manuelle
  const saveCompetitions = (data) => {
    if (!activeProfile) return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    if (activeProfile) saveCompetitions(competitions);
  }, [competitions, activeProfile]);

  // Sauvegarde au déchargement ou changement de page
  useEffect(() => {
    const handleSave = () => {
      if (activeProfile) saveCompetitions(competitions);
    };
    window.addEventListener("beforeunload", handleSave);
    return () => {
      handleSave();
      window.removeEventListener("beforeunload", handleSave);
    };
  }, [competitions, activeProfile]);

  // --- Ajouter une compétition ---
  const [newComp, setNewComp] = useState({
    nom: "",
    lieu: "",
    date: "",
    prix1: "",
    prixSup: "",
    paye: "",
    datePaiement: "",
    feeling: "",
    notes: "",
    categories: [],
  });

  const addCompetition = () => {
    if (!newComp.nom) return alert("Nom requis !");
    const comp = {
      ...newComp,
      id: Date.now().toString(),
      profileId: activeProfile?.id || "default",
    };
    const updated = [...competitions, comp];
    setCompetitions(updated);
    saveCompetitions(updated); // 🔒 sauvegarde immédiate
    setNewComp({
      nom: "",
      lieu: "",
      date: "",
      prix1: "",
      prixSup: "",
      paye: "",
      datePaiement: "",
      feeling: "",
      notes: "",
      categories: [],
    });
    setShowForm(false);
  };

  const deleteCompetition = (id) => {
    if (!window.confirm("Supprimer cette compétition ?")) return;
    const updated = competitions.filter((c) => c.id !== id);
    setCompetitions(updated);
    saveCompetitions(updated); // 🔒 sauvegarde immédiate
    if (selectedComp?.id === id) setSelectedComp(null);
  };

  // --- Catégories ---
  const [newCat, setNewCat] = useState({
    nom: "",
    type: "kata",
    age: "",
    niveau: "",
    resultat: "",
    classement: "",
  });

  const addCategory = (compId, category) => {
    const updated = competitions.map((c) =>
      c.id === compId
        ? {
            ...c,
            categories: [
              ...c.categories,
              { ...category, id: Date.now().toString() },
            ],
          }
        : c
    );
    setCompetitions(updated);
    saveCompetitions(updated);
  };

  const updateCategoryResult = (compId, catId, result, classement = "") => {
    const updated = competitions.map((c) =>
      c.id === compId
        ? {
            ...c,
            categories: c.categories.map((cat) =>
              cat.id === catId ? { ...cat, resultat: result, classement } : cat
            ),
          }
        : c
    );
    setCompetitions(updated);
    saveCompetitions(updated);
  };

  const deleteCategory = (compId, catId) => {
    const updated = competitions.map((c) =>
      c.id === compId
        ? { ...c, categories: c.categories.filter((cat) => cat.id !== catId) }
        : c
    );
    setCompetitions(updated);
    saveCompetitions(updated);
  };

  // --- Stats globales ---
  const stats = useMemo(() => {
    const total = competitions.length;
    let first = 0,
      second = 0,
      third = 0;
    competitions.forEach((c) =>
      c.categories.forEach((cat) => {
        if (cat.resultat === "🥇") first++;
        if (cat.resultat === "🥈") second++;
        if (cat.resultat === "🥉") third++;
      })
    );
    const totalCats = competitions.reduce(
      (acc, c) => acc + c.categories.length,
      0
    );
    return { total, totalCats, first, second, third };
  }, [competitions]);

  // --- Calcul automatique du coût ---
  const calcTotal = (comp) => {
    const n = comp.categories.length;
    if (!n) return 0;
    const p1 = parseFloat(comp.prix1 || 0);
    const ps = parseFloat(comp.prixSup || 0);
    return p1 + Math.max(0, n - 1) * ps;
  };

  // --- Synchronisation automatique vers l’onglet Finance ---
  useEffect(() => {
    if (!activeProfile) return;
    const allProfiles = JSON.parse(localStorage.getItem("karate_profiles") || "[]");

    const updatedProfiles = allProfiles.map((p) => {
      if (p.id !== activeProfile.id) return p;

      const existingPays = Array.isArray(p.paiements) ? [...p.paiements] : [];

      // Retire les anciennes lignes liées aux compétitions
      const filteredPays = existingPays.filter(
        (pay) => !pay.type?.toLowerCase().includes("compétition")
      );

      // Ajoute les nouvelles compétitions
      const newPays = competitions.map((c) => ({
        type: `Compétition - ${c.nom}`,
        montant: calcTotal(c),
        date: c.date || new Date().toISOString().split("T")[0],
        statut:
          parseFloat(c.paye || 0) >= calcTotal(c) ? "Payé" : "À payer",
        payeur: activeProfile.nom || "Inconnu",
        methode: "—",
      }));

      return { ...p, paiements: [...filteredPays, ...newPays] };
    });

    localStorage.setItem("karate_profiles", JSON.stringify(updatedProfiles));
  }, [competitions, activeProfile]);

  // --- Regroupement par année ---
  const competitionsByYear = useMemo(() => {
    const groups = {};
    competitions.forEach((c) => {
      const year = c.date ? new Date(c.date).getFullYear() : "Inconnue";
      if (!groups[year]) groups[year] = [];
      groups[year].push(c);
    });
    return groups;
  }, [competitions]);

  // --- Graphique ---
  const pieData = useMemo(() => {
    const totalCats = stats.totalCats || 1;
    return [
      { name: "🥇 1re place", value: (stats.first / totalCats) * 100 },
      { name: "🥈 2e place", value: (stats.second / totalCats) * 100 },
      { name: "🥉 3e place", value: (stats.third / totalCats) * 100 },
      {
        name: "Autres",
        value:
          ((stats.totalCats - stats.first - stats.second - stats.third) /
            totalCats) *
          100,
      },
    ];
  }, [stats]);

  const COLORS = ["#FACC15", "#D1D5DB", "#92400E", "#E5E7EB"];

  const ResultButton = ({ label, value, onSelect, active }) => (
    <button
      onClick={() => onSelect(value)}
      className={`px-2 py-1 rounded border text-sm transition ${
        active
          ? "bg-yellow-100 border-yellow-500 text-yellow-700 font-bold"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  // --- UI principale ---
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Trophy className="text-red-600" /> Compétitions
      </h1>

      {/* --- Résumé global --- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        {[
          ["Compétitions", stats.total],
          ["Catégories", stats.totalCats],
          ["🥇 1ère place", stats.first],
          ["🥈 2e place", stats.second],
          ["🥉 3e place", stats.third],
        ].map(([label, value], i) => (
          <div
            key={i}
            className="bg-white border p-3 rounded-lg shadow-sm flex flex-col items-center"
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-red-600">{value}</p>
          </div>
        ))}
      </div>

      {/* --- Liste des compétitions --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Compétitions</h2>
            <button
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
              onClick={() => setShowForm(!showForm)}
            >
              <PlusCircle size={16} /> Ajouter
            </button>
          </div>

          {showForm && (
            <div className="space-y-2 mb-4 border p-3 rounded bg-gray-50">
              <input
                className="border p-1 w-full rounded text-sm"
                placeholder="Nom de la compétition"
                value={newComp.nom}
                onChange={(e) =>
                  setNewComp({ ...newComp, nom: e.target.value })
                }
              />
              <input
                className="border p-1 w-full rounded text-sm"
                placeholder="Lieu"
                value={newComp.lieu}
                onChange={(e) =>
                  setNewComp({ ...newComp, lieu: e.target.value })
                }
              />
              <input
                type="date"
                className="border p-1 w-full rounded text-sm"
                value={newComp.date}
                onChange={(e) =>
                  setNewComp({ ...newComp, date: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border p-1 rounded text-sm"
                  placeholder="Prix 1ère cat."
                  value={newComp.prix1}
                  onChange={(e) =>
                    setNewComp({ ...newComp, prix1: e.target.value })
                  }
                />
                <input
                  className="border p-1 rounded text-sm"
                  placeholder="Prix cat. suppl."
                  value={newComp.prixSup}
                  onChange={(e) =>
                    setNewComp({ ...newComp, prixSup: e.target.value })
                  }
                />
              </div>
              <button
                className="bg-green-600 text-white text-sm px-3 py-1 rounded w-full"
                onClick={addCompetition}
              >
                Enregistrer
              </button>
            </div>
          )}

          {competitions.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Aucune compétition enregistrée.
            </p>
          )}
          {competitions.map((c) => (
            <div
              key={c.id}
              className={`p-2 border rounded cursor-pointer ${
                selectedComp?.id === c.id
                  ? "bg-red-50 border-red-400"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedComp(c)}
            >
              <div className="font-medium text-gray-800 flex justify-between items-center">
                <span>{c.nom}</span>
                <button
                  className="text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCompetition(c.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> {c.date || "?"}
                <MapPin size={12} /> {c.lieu || ""}
              </div>
            </div>
          ))}
        </div>

        {/* --- Détails --- */}
        {selectedComp ? (
          <div className="col-span-2 bg-white border rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {selectedComp.nom}
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              {selectedComp.lieu} — {selectedComp.date}
            </p>

            <div className="flex justify-between items-center border-t border-b py-2 my-3 text-sm">
              <span>
                💰 Total calculé :{" "}
                <b>{calcTotal(selectedComp).toFixed(2)} $</b>
              </span>
              <span>
                Payé : <b>{selectedComp.paye || 0} $</b>
              </span>
            </div>

            {/* --- Ajout de catégories --- */}
            <div className="border rounded-lg p-3 mb-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">
                Ajouter une catégorie
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
  {/* Nom de la catégorie, lié au type (kata / combat / arme) */}
  <div className="col-span-2 md:col-span-1">
    <input
      className="border p-1 rounded text-sm w-full"
      placeholder="Nom de la catégorie"
      list="category-presets"
      value={newCat.nom}
      onChange={(e) =>
        setNewCat({ ...newCat, nom: e.target.value })
      }
    />
    <datalist id="category-presets">
      {(CATEGORY_PRESETS[newCat.type] || []).map((label) => (
        <option key={label} value={label} />
      ))}
    </datalist>
  </div>

  {/* Type : kata / combat / arme */}
  <select
    className="border p-1 rounded text-sm"
    value={newCat.type}
    onChange={(e) =>
      setNewCat({ ...newCat, type: e.target.value, nom: "" })
    }
  >
    <option value="kata">Kata</option>
    <option value="combat">Combat</option>
    <option value="arme">Arme</option>
  </select>

  {/* Âge : liste pré-enregistrée */}
  <select
    className="border p-1 rounded text-sm"
    value={newCat.age}
    onChange={(e) =>
      setNewCat({ ...newCat, age: e.target.value })
    }
  >
    <option value="">Âge</option>
    {AGE_PRESETS.map((a) => (
      <option key={a} value={a}>
        {a}
      </option>
    ))}
  </select>

  {/* Niveau : liste pré-enregistrée */}
  <select
    className="border p-1 rounded text-sm"
    value={newCat.niveau}
    onChange={(e) =>
      setNewCat({ ...newCat, niveau: e.target.value })
    }
  >
    <option value="">Niveau</option>
    {NIVEAU_PRESETS.map((n) => (
      <option key={n} value={n}>
        {n}
      </option>
    ))}
  </select>
</div>
              <button
                className="bg-blue-600 text-white text-sm px-3 py-1 rounded"
                onClick={() => {
                  if (!newCat.nom) return;
                  addCategory(selectedComp.id, newCat);
                  setNewCat({
                    nom: "",
                    type: "kata",
                    age: "",
                    niveau: "",
                    resultat: "",
                    classement: "",
                  });
                }}
              >
                + Ajouter
              </button>
            </div>

            {/* --- Liste catégories --- */}
            {selectedComp.categories.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Aucune catégorie ajoutée.
              </p>
            ) : (
              selectedComp.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border rounded-lg p-3 mb-2 flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{cat.nom}</p>
                    <p className="text-xs text-gray-500">
                      {cat.age} — {cat.niveau} — {cat.type}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                    <ResultButton
                      label="🥇"
                      value="🥇"
                      active={cat.resultat === "🥇"}
                      onSelect={(v) =>
                        updateCategoryResult(selectedComp.id, cat.id, v)
                      }
                    />
                    <ResultButton
                      label="🥈"
                      value="🥈"
                      active={cat.resultat === "🥈"}
                      onSelect={(v) =>
                        updateCategoryResult(selectedComp.id, cat.id, v)
                      }
                    />
                    <ResultButton
                      label="🥉"
                      value="🥉"
                      active={cat.resultat === "🥉"}
                      onSelect={(v) =>
                        updateCategoryResult(selectedComp.id, cat.id, v)
                      }
                    />
                    <input
                      className="border w-20 p-1 rounded text-xs"
                      placeholder="Classement"
                      value={cat.classement || ""}
                      onChange={(e) =>
                        updateCategoryResult(
                          selectedComp.id,
                          cat.id,
                          cat.resultat,
                          e.target.value
                        )
                      }
                    />
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() =>
                        deleteCategory(selectedComp.id, cat.id)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="col-span-2 text-gray-500 text-sm italic flex items-center justify-center">
            Sélectionnez une compétition pour voir le détail.
          </div>
        )}
      </div>

      {/* --- ANALYSE & RECAP --- */}
      <div className="space-y-6 mt-10">
        {/* --- Récapitulatif annuel --- */}
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">📅 Récapitulatif annuel</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-center border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Année</th>
                  <th className="border px-2 py-1">Compétitions</th>
                  <th className="border px-2 py-1">Catégories</th>
                  <th className="border px-2 py-1">🥇</th>
                  <th className="border px-2 py-1">🥈</th>
                  <th className="border px-2 py-1">🥉</th>
                  <th className="border px-2 py-1">Podiums</th>
                  <th className="border px-2 py-1">Montant total</th>
                  <th className="border px-2 py-1">Payé</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(competitionsByYear).map(([year, comps]) => {
                  const cats = comps.flatMap((c) => c.categories);
                  const first = cats.filter((c) => c.resultat === "🥇").length;
                  const second = cats.filter((c) => c.resultat === "🥈").length;
                  const third = cats.filter((c) => c.resultat === "🥉").length;
                  const totalMontant = comps.reduce(
                    (acc, c) => acc + calcTotal(c),
                    0
                  );
                  const totalPaye = comps.reduce(
                    (acc, c) => acc + (parseFloat(c.paye) || 0),
                    0
                  );
                  return (
                    <tr key={year}>
                      <td className="border px-2 py-1 font-semibold">{year}</td>
                      <td className="border px-2 py-1">{comps.length}</td>
                      <td className="border px-2 py-1">{cats.length}</td>
                      <td className="border px-2 py-1">{first}</td>
                      <td className="border px-2 py-1">{second}</td>
                      <td className="border px-2 py-1">{third}</td>
                      <td className="border px-2 py-1">
                        {first + second + third}
                      </td>
                      <td className="border px-2 py-1">{totalMontant.toFixed(2)} $</td>
                      <td className="border px-2 py-1 text-green-600">
                        {totalPaye.toFixed(2)} $
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Graphique --- */}
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">📊 Analyse des résultats</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
