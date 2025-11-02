import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import AddEventModal from "./AddEventModal";

export default function CalendarEnhancedView({
  events,             // événements stockés pour CE profil
  setEvents,          // setter lié à CE profil
  showAdd,
  setShowAdd,
  handleAddEvent,
  activeProfile,
  planning,           // planning régulier (Lundi / Jeudi / Dimanche ...)
}) {
  // ----------------------------------
  // 1. état local UI
  // ----------------------------------
  const todayISO = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterType, setFilterType] = useState("tous");

  // ----------------------------------
  // 2. petite table d'icônes par type
  // ----------------------------------
  const ICONS = {
    groupe: "🥋",
    privé: "🤝",
    semi: "👥",
    maison: "💪",
    competition: "🏆",
    passage: "🎯",
    seminaire: "📚",
  };

  // ----------------------------------
  // 3. auto-mark "non fait" si passé et resté planifié
  //    (ex : hier était planifié mais pas marqué "fait")
  // ----------------------------------
  useEffect(() => {
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    const updated = events.map((e) => {
      if (e.status === "planifié") {
        const [y, m, d] = e.date.split("-");
        const evDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        if (evDate < todayMidnight) {
          return { ...e, status: "non fait" };
        }
      }
      return e;
    });

    // si quelque chose a changé, on push
    const changed =
      JSON.stringify(updated) !== JSON.stringify(events);
    if (changed) {
      setEvents(updated);
    }
  }, [events, setEvents]);

  // ----------------------------------
  // 4. Générer les cours réguliers du planning
  //    pour la date sélectionnée SI pas déjà dans events
  // ----------------------------------

  // util pour convertir Date -> "Lundi", "Mardi", ...
  function weekdayFr(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(y, m - 1, d);
    // getDay(): 0=Dim,1=Lun... On veut texte FR avec majuscule comme dans le planning
    const mapping = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    return mapping[dt.getDay()];
  }

  // cours du planning pour ce jour précis
  const autoLessonsForDay = useMemo(() => {
    if (!planning) return [];
    const wd = weekdayFr(selectedDate); // ex. "Lundi"
    const bloc = planning.find((p) => p.jour === wd);
    if (!bloc) return [];
    // on renvoie une liste d'objets dans le même style que nos events
    return bloc.cours.map((c) => ({
      title: c.nom,
      time: c.heure,
      type: c.type || "groupe",
      date: selectedDate,
      status: "planifié",
      // ATTENTION: pas d'id unique ici, on matchera par title+time+date
    }));
  }, [planning, selectedDate]);

  // maintenant on combine :
  // - les events réellement stockés pour ce profil à cette date
  // - ET les cours auto du planning qui ne sont pas déjà dans ces events
  const dayEventsMerged = useMemo(() => {
    // events du profil pour la date choisie
    const manualThatDay = events.filter((e) => e.date === selectedDate);

    // on évite de dupliquer un cours déjà ajouté
    const dedupAuto = autoLessonsForDay.filter((autoEv) => {
      return !manualThatDay.some(
        (realEv) =>
          realEv.title === autoEv.title &&
          realEv.time === autoEv.time &&
          realEv.date === autoEv.date
      );
    });

    return [...manualThatDay, ...dedupAuto];
  }, [events, autoLessonsForDay, selectedDate]);

  // ----------------------------------
  // 5. filtrage affiché (status / type)
  // ----------------------------------
  const filteredEvents = useMemo(() => {
    return dayEventsMerged
      .filter((e) =>
        filterStatus === "tous" ? true : e.status === filterStatus
      )
      .filter((e) =>
        filterType === "tous" ? true : e.type === filterType
      )
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [dayEventsMerged, filterStatus, filterType]);

  // ----------------------------------
  // 6. changement de statut au clic
  //    - si l'événement vient du planning mais n'est pas encore
  //      sauvegardé dans les events du profil, on doit l'ajouter
  //      d'abord, puis on toggle.
  // ----------------------------------
  const toggleStatus = (evObj) => {
    // status cycle
    const statusCycle = ["planifié", "fait", "non fait"];

    setEvents((prev) => {
      // est-ce que evObj existe déjà dans prev ?
      let foundIndex = prev.findIndex(
        (p) =>
          p.date === evObj.date &&
          p.time === evObj.time &&
          p.title === evObj.title
      );

      // si pas trouvé -> on va l'ajouter
      let newList = [...prev];
      if (foundIndex === -1) {
        foundIndex = newList.length;
        newList.push({
          ...evObj,
          status: evObj.status || "planifié",
          profileId: activeProfile?.id || "unknown",
        });
      }

      // toggle
      const currStatus = newList[foundIndex].status || "planifié";
      const nextStatus =
        statusCycle[(statusCycle.indexOf(currStatus) + 1) % 3];

      newList[foundIndex] = {
        ...newList[foundIndex],
        status: nextStatus,
      };

      return newList;
    });
  };

  // ----------------------------------
  // 7. Statistiques du mois sélectionné
  //    -> nb de cours faits (=status "fait") dans le mois visible
  // ----------------------------------
  const statsMonth = useMemo(() => {
    const [y, m] = selectedDate.split("-");
    const prefix = `${y}-${m}`; // ex "2025-11"

    // On considère seulement les événements STOCKÉS ou bien togglés (donc avec status)
    // pas juste les "autoLessonsForDay" tant qu'ils ne sont pas "fait".
    const doneThisMonth = events.filter(
      (e) => e.status === "fait" && e.date.startsWith(prefix)
    );

    const groupCount = doneThisMonth.filter(
      (e) => e.type === "groupe"
    ).length;
    const privateCount = doneThisMonth.filter(
      (e) => e.type === "privé"
    ).length;
    const combatCount = doneThisMonth.filter(
      (e) =>
        e.title &&
        (e.title.toLowerCase().includes("combat") ||
          e.title.toLowerCase().includes("arme"))
    ).length;
    const competitionCount = doneThisMonth.filter(
      (e) => e.type === "competition"
    ).length;

    const totalDone =
      groupCount + privateCount * 4; // même logique que le dashboard

    return {
      totalDone,
      groupCount,
      privateCount,
      combatCount,
      competitionCount,
    };
  }, [events, selectedDate]);

  // ----------------------------------
  // RENDER
  // ----------------------------------
  return (
    <div className="space-y-6">
      {/* Barre filtres / actions */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Profil actif / titre */}
        <div className="font-medium text-gray-700">
          {activeProfile
            ? `${activeProfile.nom} — suivi d'entraînement`
            : "Aucun profil actif"}
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium flex items-center gap-1">
            <span role="img" aria-label="calendar">
              📅
            </span>
            Date :
          </label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Filtres statut / type */}
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

        {/* bouton Ajouter */}
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Ajouter
        </button>

        {/* Bouton génération mensuelle */}
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
      const dayName = new Date(year, month, d).toLocaleDateString("fr-CA", {
        weekday: "long",
      });

      // recherche du bloc correspondant dans le planning
      const bloc = planning.find(
        (p) => p.jour.toLowerCase() === dayName.toLowerCase()
      );
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
    alert(
      `✅ ${newEvents.length} cours générés pour ${now.toLocaleString("fr-CA", {
        month: "long",
        year: "numeric",
      })}`
    );
  }}
  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
>
  📆 Générer les cours du mois
</button>
      </div>

      {/* ===========================
          Bloc Statistiques du mois
      ============================ */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h3 className="text-gray-800 font-semibold text-sm mb-2">
          Statistiques du mois sélectionné
        </h3>
        {statsMonth.totalDone === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun cours enregistré pour ce mois.
          </p>
        ) : (
          <ul className="text-sm text-gray-700 leading-relaxed">
            <li>
              Total (points progression) :{" "}
              <b>{statsMonth.totalDone}</b>
            </li>
            <li>🥋 Cours groupe : {statsMonth.groupCount}</li>
            <li>
              🤝 Cours privés : {statsMonth.privateCount}{" "}
              <span className="text-xs text-gray-500">
                (x4)
              </span>
            </li>
            <li>
              💪 Armes / Combat : {statsMonth.combatCount}
            </li>
            <li>
              🏆 Compétitions : {statsMonth.competitionCount}
            </li>
          </ul>
        )}
      </div>

      {/* ===========================
          Liste des événements du jour
      ============================ */}
      <div>
        <h3 className="text-gray-800 font-semibold mb-2 text-sm">
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
                  onClick={() => toggleStatus(e)}
                  className={`border rounded-xl p-4 cursor-pointer hover:shadow transition ${colorClass}`}
                >
                  <div className="text-2xl mb-2">
                    {ICONS[e.type] || "❓"}
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {e.title || "Sans titre"}
                  </h4>
                  <p className="text-gray-600 text-sm mb-1">
                    {e.time || "Heure ?"}
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

      {/* modale d'ajout */}
      <AddEventModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddEvent}
        activeProfile={activeProfile}
      />
    </div>
  );
}
