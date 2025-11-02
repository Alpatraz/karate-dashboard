import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle } from "lucide-react";

export default function CalendarEnhancedView({
  events,
  setEvents,
  showAdd,
  setShowAdd,
  handleAddEvent,
  activeProfile,
}) {
  const todayISO = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterType, setFilterType] = useState("tous");

  // table d’icônes par type
  const ICONS = {
    groupe: "🥋",
    privé: "🤝",
    semi: "👥",
    maison: "💪",
    competition: "🏆",
    passage: "🎯",
    seminaire: "📚",
  };

  // Corrige automatiquement les statuts "planifié" passés en "non fait"
  useEffect(() => {
    const nowDayStart = new Date();
    nowDayStart.setHours(0, 0, 0, 0);

    const updated = events.map((e) => {
      if (
        e.status === "planifié" &&
        new Date(e.date) < nowDayStart
      ) {
        return { ...e, status: "non fait" };
      }
      return e;
    });

    // si changement, on met à jour
    const changed =
      JSON.stringify(updated) !== JSON.stringify(events);
    if (changed) {
      setEvents(updated);
    }
  }, [events, setEvents]);

  // Liste filtrée pour la date choisie
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate)
      .filter((e) =>
        filterStatus === "tous" ? true : e.status === filterStatus
      )
      .filter((e) =>
        filterType === "tous" ? true : e.type === filterType
      )
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, selectedDate, filterStatus, filterType]);

  // Toggle du statut quand on clique sur la carte
  // planifié → fait → non fait → planifié
  const toggleStatus = (eventIndexInFiltered) => {
    const statusCycle = ["planifié", "fait", "non fait"];
    const target = filteredEvents[eventIndexInFiltered];
    const globalIndex = events.indexOf(target);
    if (globalIndex === -1) return;

    setEvents((prev) =>
      prev.map((ev, i) =>
        i === globalIndex
          ? {
              ...ev,
              status:
                statusCycle[
                  (statusCycle.indexOf(ev.status) + 1) % 3
                ],
            }
          : ev
      )
    );
  };

  // STATISTIQUES DU MOIS COURANT
  // nb de "fait" dans le mois de selectedDate
  const monthStats = useMemo(() => {
    if (!selectedDate) return { faits: 0, total: 0, taux: 0, faitsList: [] };

    const d = new Date(selectedDate);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-based

    // events du même mois
    const sameMonth = events.filter((e) => {
      const ed = new Date(e.date + "T00:00"); // pour safari
      return ed.getFullYear() === y && ed.getMonth() === m;
    });

    const faitsList = sameMonth.filter((e) => e.status === "fait");
    const faits = faitsList.length;
    const total = sameMonth.length;
    const taux = total > 0 ? Math.round((faits / total) * 100) : 0;

    return { faits, total, taux, faitsList };
  }, [events, selectedDate]);

  return (
    <div>
      {/* Bandeau Profil actif */}
      {activeProfile ? (
        <div className="mb-4 text-sm text-gray-700">
          <span className="font-semibold">{activeProfile.nom}</span>{" "}
          – suivi d'entraînement
        </div>
      ) : (
        <div className="mb-4 text-sm text-red-600">
          Aucun profil actif sélectionné.
        </div>
      )}

      {/* === Barre de filtres === */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        {/* Sélection de la date */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">📅 Date :</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Filtres status / type */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="tous">Tous</option>
            <option value="planifié">À venir</option>
            <option value="fait">Fait</option>
            <option value="non fait">Non fait</option>
          </select>

          <select
            className="border rounded px-2 py-1 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="tous">Tous les types</option>
            <option value="groupe">Cours de groupe</option>
            <option value="privé">Cours privé</option>
            <option value="semi">Demi-privé</option>
            <option value="maison">Entraînement maison</option>
            <option value="competition">Compétition</option>
            <option value="passage">Passage de ceinture</option>
            <option value="seminaire">Séminaire</option>
          </select>
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          <PlusCircle className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* === Statistiques mensuelles === */}
      <div className="mb-6 bg-white border rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Statistiques du mois sélectionné
        </h3>

        {monthStats.total === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun cours enregistré pour ce mois.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <span className="text-green-700 font-medium">
                Cours faits : {monthStats.faits}
              </span>
              <span className="text-gray-700">
                Total cours (tous statuts) : {monthStats.total}
              </span>
              <span className="text-gray-500 italic">
                Taux d'assiduité : {monthStats.taux}%
              </span>
            </div>

            {/* barre de progression visuelle */}
            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-3 bg-green-500 transition-all"
                style={{ width: `${monthStats.taux}%` }}
              ></div>
            </div>

            {/* liste des cours faits */}
            {monthStats.faits > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Cours faits ce mois :
                </p>
                <ul className="text-xs text-gray-700 list-disc ml-4">
                  {monthStats.faitsList.map((ev, idx) => (
                    <li key={idx}>
                      {ev.date} – {ev.title} {ev.time ? `(${ev.time})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* === Liste des événements du jour sélectionné === */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {selectedDate} — Événements
      </h3>

      {filteredEvents.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          Aucun événement ce jour-là.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredEvents.map((e, i) => {
            const colorClass =
              e.status === "fait"
                ? "bg-green-100 border-green-400"
                : e.status === "non fait"
                ? "bg-red-100 border-red-400"
                : "bg-white border-gray-200";

            return (
              <div
                key={i}
                onClick={() => toggleStatus(i)}
                className={`border rounded-xl p-4 cursor-pointer hover:shadow transition ${colorClass}`}
              >
                <div className="text-2xl mb-2">
                  {ICONS[e.type] || "❓"}
                </div>

                <h4 className="font-semibold text-gray-800 mb-1">
                  {e.title}
                </h4>

                <p className="text-gray-600 text-sm mb-1">
                  {e.time || "Heure non précisée"}
                </p>

                <p className="text-xs text-gray-500 italic">
                  {e.type} — {e.status}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
