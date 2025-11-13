import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { Check, RotateCcw, Clock } from "lucide-react";

export default function TechniqueBaseView({ activeProfile }) {
  const [techniques, setTechniques] = useState([]);
  const [progress, setProgress] = useState({});
  const [filter, setFilter] = useState("Toutes");

  // === Charger les techniques Firestore ===
  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, "techniques"));
      setTechniques(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    fetchData();
  }, []);

  // === Charger la progression de l’utilisateur ===
  useEffect(() => {
    if (!activeProfile) return;
    async function fetchProgress() {
      const snap = await getDocs(
        collection(db, `profiles/${activeProfile.id}/techniques_progress`)
      );
      const map = {};
      snap.forEach((d) => (map[d.data().technique_id] = d.data()));
      setProgress(map);
    }
    fetchProgress();
  }, [activeProfile]);

  // === Changer le statut d’une technique ===
  async function updateStatus(techniqueId, statut) {
    if (!activeProfile) return;
    const ref = doc(
      db,
      `profiles/${activeProfile.id}/techniques_progress/${techniqueId}`
    );
    const record = {
      technique_id: techniqueId,
      statut,
      date_apprentissage: new Date().toISOString().split("T")[0],
    };
    await setDoc(ref, record, { merge: true });
    setProgress((p) => ({ ...p, [techniqueId]: record }));
  }

  const categories = [
    "Toutes",
    "Punch",
    "Kick",
    "Combat",
    "Blocking Form",
    "Kata",
    "Kata armé",
    "Auto-défense",
    "Armes : Bâton / Couteau / Fusil",
  ];

  const filtered =
    filter === "Toutes"
      ? techniques
      : techniques.filter((t) => t.categorie === filter);

  if (!activeProfile)
    return <div className="p-6 text-gray-500">Aucun profil actif.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Base technique – {activeProfile.nom}
      </h1>

      {/* FILTRES */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full border ${
              filter === c
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* TABLEAU TECHNIQUES */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-red-50 border-b border-gray-200 text-gray-700">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-left">Ceinture</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Vidéo</th>
              <th className="p-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const prog = progress[t.id] || {};
              const statut = prog.statut || "non commencé";
              const color =
                statut === "appris"
                  ? "bg-green-50 text-green-700"
                  : statut === "revoir"
                  ? "bg-yellow-50 text-yellow-700"
                  : statut === "en cours"
                  ? "bg-blue-50 text-blue-700"
                  : "";

              return (
                <tr
                  key={t.id}
                  className={`border-b last:border-0 ${color}`}
                >
                  <td className="p-3 font-medium">{t.nom}</td>
                  <td className="p-3">{t.categorie}</td>
                  <td className="p-3 text-sm">
                    {t.ceinture_min} → {t.ceinture_max}
                  </td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">
                    {t.lien_video ? (
                      <a
                        href={t.lien_video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        ▶️ Voir
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(t.id, "appris")}
                        className="p-1 rounded bg-green-100 hover:bg-green-200"
                        title="Appris"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, "revoir")}
                        className="p-1 rounded bg-yellow-100 hover:bg-yellow-200"
                        title="À revoir"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, "en cours")}
                        className="p-1 rounded bg-blue-100 hover:bg-blue-200"
                        title="En cours"
                      >
                        <Clock size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
