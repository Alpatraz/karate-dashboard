import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import AddEventModal from "./AddEventModal";

export default function CalendarEnhancedView({
  events, // événements du profil actif
  setEvents, // setter lié à ce profil
  showAdd,
  setShowAdd,
  handleAddEvent,
  activeProfile,
  planning, // planning régulier (Lundi / Jeudi / Dimanche ...)
}) {
  // --------------------------
  // 1. États locaux
  // --------------------------
  const todayISO = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterType, setFilterType] = useState("tous");

  // --------------------------
  // 2. Table d’icônes par type
  // --------------------------
  const ICONS = {
    groupe: "🥋",
    privé: "🤝",
    semi: "👥",
    maison: "💪",
    competition: "🏆",
    passage: "🎯",
    seminaire: "📚",
  };

  // --------------------------
  // 3. Marquer automatiquement "non fait" si passé
  // --------------------------
  useEffect(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const updated = events.map((e) => {
      if (e.status === "planifié") {
        const [y, m, d] = e.date.split("-");
        const evDate = new Date(y, m - 1, d);
        if (evDate < todayMidnight) return { ...e, status: "non fait" };
      }
      return e;
    });

    if (JSON.stringify(updated) !== JSON.stringify(events)) {
      setEvents(updated);
    }
  }, [events, setEvents]);

  // --------------------------
  // 4. Conversion date -> jour FR
  // --------------------------
  function weekdayFr(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(y, m - 1, d);
    const mapping = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return mapping[dt.getDay()];
  }

  // --------------------------
  // 5. Cours automatiques du planning
  // --------------------------
  const autoLessonsForDay = useMemo(() => {
    if (!planning) return [];
    const wd = weekdayFr(selectedDate);
    const bloc = planning.find((p) => p.jour === wd);
    if (!bloc) return [];
    return bloc.cours.map((c) => ({
      title: c.nom || "Cours de groupe",
      time: c.heure || "",
      type: "groupe",
      date: selectedDate,
      status: "planifié",
      profileId: activeProfile?.id || "unknown",
    }));
  }, [planning, selectedDate, activeProfile]);

  // --------------------------
  // 6. Fusion : events réels + auto du jour
  // --------------------------
  const dayEventsMerged = useMemo(() => {
    const manualThatDay = events.filter((e) => e.date === selectedDate);
    const dedupAuto = autoLessonsForDay.filter(
      (autoEv) =>
        !manualThatDay.some(
          (realEv) =>
            realEv.title === autoEv.title && realEv.time === autoEv.time && realEv.date === autoEv.date
        )
    );
    return [...manualThatDay, ...dedupAuto];
  }, [events, autoLessonsForDay, selectedDate]);

  // --------------------------
  // 7. Filtrage affiché
  // --------------------------
  const filteredEvents = useMemo(() => {
    return dayEventsMerged
      .filter((e) => (filterStatus === "tous" ? true : e.status === filterStatus))
      .filter((e) => (filterType === "tous" ? true : e.type === filterType))
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [dayEventsMerged, filterStatus, filterType]);

  // --------------------------
  // 8. Toggle du statut (planifié → fait → non fait)
  // --------------------------
  const toggleStatus = (evObj) => {
    const statusCycle = ["planifié", "fait", "non fait"];
    setEvents((prev) => {
      let foundIndex = prev.findIndex(
        (p) => p.date === evObj.date && p.time === evObj.time && p.title === evObj.title
      );
      let newList = [...prev];
      if (foundIndex === -1) {
        foundIndex = newList.length;
        newList.push({ ...evObj, status: "planifié" });
      }
      const currStatus = newList[foundIndex].status || "planifié";
      const nextStatus = statusCycle[(statusCycle.indexOf(currStatus) + 1) % 3];
      newList[foundIndex] = { ...newList[foundIndex], status: nextStatus };
      return newList;
    });
  };

  // --------------------------
  // 9. Statistiques du mois sélectionné
  // --------------------------
  const statsMonth = useMemo(() => {
    const [y, m] = selectedDate.split("-");
    const prefix = `${y}-${m}`;
    const doneThisMonth = events.filter((e) => e.status === "fait" && e.date.startsWith(prefix));

    const groupCount = doneThisMonth.filter((e) => e.type === "groupe").length;
    const privateCount = doneThisMonth.filter((e) => e.type === "privé").length;
    const combatCount = doneThisMonth.filter(
      (e) => e.title && (e.title.toLowerCase().includes("combat") || e.title.toLowerCase().includes("arme"))
    ).length;
    const competitionCount = doneThisMonth.filter((e) => e.type === "competition").length;

    const totalDone = groupCount + privateCount * 4;
    return { totalDone, groupCount, privateCount, combatCount, competitionCount };
  }, [events, selectedDate]);

  // --------------------------
  // 10. Sauvegarde automatique locale
  // --------------------------
  useEffect(() => {
    if (!activeProfile) return;
    localStorage.setItem(`karate_events_${activeProfile.id}`, JSON.stringify(events));
  }, [events, activeProfile]);

  // --------------------------
  // RENDER
  // --------------------------
  return (
    <div className="space-y-6">
      {/* Barre filtres / actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="font-medium text-gray-700">
          {activeProfile ? `${activeProfile.nom} — suivi d'entraînement` : "Aucun profil actif"}
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium flex items-center gap-1">
            📅 Date :
          </label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Filtres */}
        <select className="border rounded px-2 py-1 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="tous">Tous</option>
          <option value="planifié">À venir</option>
          <option value="fait">Fait</option>
          <option value="non fait">Non fait</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="tous">Tous les types</option>
          <option value="groupe">Cours de groupe</option>
          <option value="privé">Cours privé</option>
          <option value="semi">Demi-privé</option>
          <option value="maison">Entraînement maison</option>
          <option value="competition">Compétition</option>
          <option value="passage">Passage de ceinture</option>
          <option value="seminaire">Séminaire</option>
        </select>

        {/* Boutons */}
        <button onClick={() => setShowAdd(true)} className="ml-auto flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm">
          <PlusCircle className="w-4 h-4" /> Ajouter
        </button>

        {/* Générer les cours du mois */}
        <button
          onClick={() => {
            if (!planning || planning.length === 0) {
              alert("⚠️ Aucun planning défini dans les paramètres !");
              return;
            }
            const now = new Date(selectedDate);
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const newEvents = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const dayName = new Date(year, month, d).toLocaleDateString("fr-CA", { weekday: "long" });
              const bloc = planning.find((p) => p.jour.toLowerCase() === dayName.toLowerCase());
              if (bloc) {
                bloc.cours.forEach((c) => {
                  newEvents.push({
                    date,
                    title: c.nom,
                    time: c.heure,
                    type: c.type || "groupe",
                    status: "planifié",
                    profileId: activeProfile?.id || "unknown",
                  });
                });
              }
            }

            setEvents((prev) => [...prev, ...newEvents]);
            alert(`✅ ${newEvents.length} cours générés pour ${now.toLocaleString("fr-CA", { month: "long", year: "numeric" })}`);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
        >
          📆 Générer les cours du mois
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h3 className="text-gray-800 font-semibold text-sm mb-2">Statistiques du mois sélectionné</h3>
        {statsMonth.totalDone === 0 ? (
          <p className="text-gray-500 text-sm">Aucun cours enregistré pour ce mois.</p>
        ) : (
          <ul className="text-sm text-gray-700 leading-relaxed">
            <li>Total (points progression) : <b>{statsMonth.totalDone}</b></li>
            <li>🥋 Cours groupe : {statsMonth.groupCount}</li>
            <li>🤝 Cours privés : {statsMonth.privateCount} <span className="text-xs text-gray-500">(x4)</span></li>
            <li>💪 Armes / Combat : {statsMonth.combatCount}</li>
            <li>🏆 Compétitions : {statsMonth.competitionCount}</li>
          </ul>
        )}
      </div>

      {/* Liste du jour */}
      <div>
        <h3 className="text-gray-800 font-semibold mb-2 text-sm">{selectedDate} — Événements</h3>
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Aucun événement ce jour-là.</p>
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
                <div key={i} onClick={() => toggleStatus(e)} className={`border rounded-xl p-4 cursor-pointer hover:shadow transition ${colorClass}`}>
                  <div className="text-2xl mb-2">{ICONS[e.type || "groupe"] || "🥋"}</div>
                  <h4 className="font-semibold text-gray-800 mb-1">{e.title || "Sans titre"}</h4>
                  <p className="text-gray-600 text-sm mb-1">{e.time || "Heure ?"}</p>
                  <p className="text-xs text-gray-500 italic">{e.type} — {e.status}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddEventModal show={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddEvent} activeProfile={activeProfile} />
    </div>
  );
}
