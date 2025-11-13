import React, { useState, useMemo, useEffect } from "react";
import {
  PlusCircle,
  CheckCircle2,
  CircleSlash,
  Clock4,
  Edit3,
  Trash2,
  CalendarPlus,
  Users as UsersIcon,
} from "lucide-react";
import AddEventModal from "./AddEventModal";
import BulkPrivatesModal from "./BulkPrivatesModal";

export default function CalendarEnhancedView({
  events,
  setEvents,
  showAdd,
  setShowAdd,
  handleAddEvent,
  activeProfile,
  planning,
}) {
  // --------------------------
  // 1. États locaux
  // --------------------------
  const todayISO = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterType, setFilterType] = useState("tous");
  const [showBulk, setShowBulk] = useState(false);
  const [editDraft, setEditDraft] = useState(null); // {index, event}

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
  // 3. Marquer auto "non fait" si passé
  // --------------------------
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
      if (e.status === "planifié" && e.date) {
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
  // 4. Helpers
  // --------------------------
  const weekdayFr = (dateStr) => {
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("fr-CA", { weekday: "long" });
  };

  const ensureId = (e) =>
    e.id ||
    `${e.date ?? "?"}|${e.time ?? "?"}|${e.title ?? "?"}|${
      e.profileId ?? "p"
    }`;

  const upsertEvent = (evObj) => {
    const key = ensureId(evObj);
    setEvents((prev) => {
      const idx = prev.findIndex((x) => ensureId(x) === key);
      if (idx === -1) return [...prev, { ...evObj, id: key }];
      const next = [...prev];
      next[idx] = { ...next[idx], ...evObj, id: key };
      return next;
    });
  };

  const deleteEvent = (evObj) => {
    const key = ensureId(evObj);
    setEvents((prev) => prev.filter((x) => ensureId(x) !== key));
  };

  const markStatus = (evObj, status) => {
    upsertEvent({
      ...evObj,
      status,
      profileId: activeProfile?.id || "unknown",
    });
  };

  // ------------------------------------------------------
  // 5. Ajouter un paiement dans Finance pour le profil actif
  // ------------------------------------------------------
  const addPaymentToFinance = (profile, paiement) => {
    if (!profile) return;
    const profiles = JSON.parse(localStorage.getItem("karate_profiles") || "[]");

    const updated = profiles.map((p) => {
      if (p.id !== profile.id) return p;

      const existing = Array.isArray(p.paiements) ? p.paiements : [];
      return {
        ...p,
        paiements: [
          ...existing,
          {
            type: paiement.type || "Cours privé",
            montant: paiement.montant || 0,
            date: paiement.date || new Date().toISOString().split("T")[0],
            statut: paiement.statut || "À payer",
            payeur: profile.nom || "Inconnu",
            methode: paiement.methode || "—",
          },
        ],
      };
    });

    localStorage.setItem("karate_profiles", JSON.stringify(updated));
  };

  // --------------------------
  // 6. Cours automatiques du planning
  // --------------------------
  const autoLessonsForDay = useMemo(() => {
    if (!planning) return [];
    const wd = weekdayFr(selectedDate);
    const bloc = planning.find(
      (p) => p.jour.toLowerCase() === wd.toLowerCase()
    );
    if (!bloc) return [];
    return bloc.cours.map((c) => ({
      title: c.nom || "Cours de groupe",
      time: c.heure || "",
      ttype: ["privé", "semi", "groupe", "arme", "combat"].includes(c.type)
      ? c.type
      : "groupe",
      date: selectedDate,
      status: "planifié",
      profileId: activeProfile?.id || "unknown",
    }));
  }, [planning, selectedDate, activeProfile]);

  // --------------------------
  // 7. Fusion : events réels + auto du jour
  // --------------------------
  const dayEventsMerged = useMemo(() => {
    const manualThatDay = events.filter((e) => e.date === selectedDate);
    const dedupAuto = autoLessonsForDay.filter(
      (autoEv) =>
        !manualThatDay.some(
          (realEv) =>
            realEv.title === autoEv.title &&
            realEv.time === autoEv.time &&
            realEv.date === autoEv.date
        )
    );
    return [...manualThatDay, ...dedupAuto];
  }, [events, autoLessonsForDay, selectedDate]);

  // --------------------------
  // 8. Filtrage affiché
  // --------------------------
  const filteredEvents = useMemo(() => {
    return dayEventsMerged
      .filter((e) =>
        filterStatus === "tous" ? true : (e.status || "planifié") === filterStatus
      )
      .filter((e) => (filterType === "tous" ? true : e.type === filterType))
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [dayEventsMerged, filterStatus, filterType]);

  // --------------------------
  // 9. Stats du mois sélectionné
  // --------------------------
  const statsMonth = useMemo(() => {
    const [y, m] = selectedDate.split("-");
    const prefix = `${y}-${m}`;
    const doneThisMonth = events.filter(
      (e) => e.status === "fait" && e.date?.startsWith(prefix)
    );

    const groupCount = doneThisMonth.filter((e) => e.type === "groupe").length;
    const privateCount = doneThisMonth.filter((e) => e.type === "privé").length;
    const combatCount = doneThisMonth.filter(
      (e) =>
        e.title &&
        (e.title.toLowerCase().includes("combat") ||
          e.title.toLowerCase().includes("arme"))
    ).length;
    const competitionCount = doneThisMonth.filter(
      (e) => e.type === "competition"
    ).length;

    const totalDone = groupCount + privateCount * 4;
    return {
      totalDone,
      groupCount,
      privateCount,
      combatCount,
      competitionCount,
    };
  }, [events, selectedDate]);

  // --------------------------
  // 10. Sauvegarde automatique
  // --------------------------
  useEffect(() => {
    if (!activeProfile) return;
    localStorage.setItem(
      `karate_events_${activeProfile.id}`,
      JSON.stringify(events)
    );
  }, [events, activeProfile]);

  // --------------------------
  // 11. Générer les cours du mois (planning récurrent)
  // --------------------------
  const generateMonthFromPlanning = () => {
    if (!planning || planning.length === 0) {
      alert("⚠️ Aucun planning défini dans les paramètres !");
      return;
    }

    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const toAdd = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;

      const dayName = new Date(year, month, d).toLocaleDateString("fr-CA", {
        weekday: "long",
      });

      const bloc = planning.find(
        (p) => p.jour.toLowerCase() === dayName.toLowerCase()
      );
      if (!bloc) continue;

      bloc.cours.forEach((c) => {
        const ev = {
          date,
          title: c.nom || "Cours de groupe",
          time: c.heure || "",
          type: ["privé", "semi", "groupe", "arme", "combat"].includes(c.type)
  ? c.type
  : "groupe",
          status: "planifié",
          profileId: activeProfile?.id || "unknown",
        };
        toAdd.push({ ...ev, id: ensureId(ev) });
      });
    }

    setEvents((prev) => {
      const existing = new Set(prev.map((e) => ensureId(e)));
      const fresh = toAdd.filter((e) => !existing.has(ensureId(e)));
      return [...prev, ...fresh];
    });

    alert(
      `✅ ${toAdd.length} cours générés pour ${now.toLocaleString("fr-CA", {
        month: "long",
        year: "numeric",
      })}`
    );
  };

  // --------------------------
  // 12. Rendu principal
  // --------------------------
  return (
    <div className="space-y-6">
      {/* Barre filtres / actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-medium text-gray-700">
          {activeProfile
            ? `${activeProfile.nom} — suivi d'entraînement`
            : "Aucun profil actif"}
        </div>

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

        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" /> Ajouter
        </button>

        <button
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black text-sm"
        >
          <UsersIcon className="w-4 h-4" />
          Ajouter plusieurs cours privés
        </button>

        <button
          onClick={generateMonthFromPlanning}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
        >
          <CalendarPlus className="w-4 h-4" />
          Générer les cours du mois
        </button>
      </div>

      {/* Liste du jour */}
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
            {filteredEvents.map((e) => {
              const status = e.status || "planifié";
              const colorClass =
                status === "fait"
                  ? "bg-green-50 border-green-400"
                  : status === "non fait"
                  ? "bg-red-50 border-red-400"
                  : "bg-white border-gray-200";

              return (
                <div
                  key={ensureId(e)}
                  className={`border rounded-xl p-4 hover:shadow transition ${colorClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-2xl">{ICONS[e.type || "groupe"] || "🥋"}</div>
                    <div className="flex items-center gap-2">
                      <button
                        title="Marquer fait"
                        onClick={() => markStatus(e, "fait")}
                        className="p-1 rounded hover:bg-green-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        title="Marquer non fait"
                        onClick={() => markStatus(e, "non fait")}
                        className="p-1 rounded hover:bg-red-100"
                      >
                        <CircleSlash className="w-4 h-4 text-red-600" />
                      </button>
                      <button
                        title="Remettre planifié"
                        onClick={() => markStatus(e, "planifié")}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Clock4 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        title="Éditer"
                        onClick={() =>
                          setEditDraft({
                            event: { ...e },
                          })
                        }
                        className="p-1 rounded hover:bg-blue-100"
                      >
                        <Edit3 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => deleteEvent(e)}
                        className="p-1 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-800 mt-2">
                    {e.title || "Sans titre"}
                  </h4>
                  <p className="text-gray-600 text-sm">{e.time || "Heure ?"}</p>
                  <p className="text-xs text-gray-500 italic">
                    {e.type} — {status}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEventModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(ev) => {
          const withMeta = {
            ...ev,
            status: ev.status || "planifié",
            profileId: activeProfile?.id || "unknown",
          };
          handleAddEvent(withMeta);
          if (["privé", "semi"].includes(ev.type) && ev.prix > 0) {
            addPaymentToFinance(activeProfile, {
              type: ev.type === "semi" ? "Cours demi-privé" : "Cours privé",
              montant: ev.prix,
              date: ev.date,
              statut: "À payer",
            });
          }
        }}
      />

      <BulkPrivatesModal
        show={showBulk}
        onClose={() => setShowBulk(false)}
        onAddMany={(list) => {
          const withMeta = list.map((ev) => ({
            ...ev,
            profileId: activeProfile?.id || "unknown",
            status: "planifié",
          }));
          setEvents((prev) => [...prev, ...withMeta]);
          setShowBulk(false);
          list.forEach((ev) => {
            if (["privé", "semi"].includes(ev.type) && ev.prix > 0) {
              addPaymentToFinance(activeProfile, {
                type: ev.type === "semi" ? "Cours demi-privé" : "Cours privé",
                montant: ev.prix,
                date: ev.date,
                statut: "À payer",
              });
            }
          });
        }}
      />
      {/* --- Modal d'édition d'un cours --- */}
{editDraft && (
  <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg p-5 w-[420px] shadow-xl">
      <h3 className="font-semibold mb-3">Modifier l’événement</h3>

      <input
        className="border p-2 w-full rounded mb-2"
        value={editDraft.event.title || ""}
        onChange={(e) =>
          setEditDraft((d) => ({
            ...d,
            event: { ...d.event, title: e.target.value },
          }))
        }
        placeholder="Titre"
      />

      <input
        type="date"
        className="border p-2 w-full rounded mb-2"
        value={editDraft.event.date || ""}
        onChange={(e) =>
          setEditDraft((d) => ({
            ...d,
            event: { ...d.event, date: e.target.value },
          }))
        }
      />

      <input
        className="border p-2 w-full rounded mb-2"
        value={editDraft.event.time || ""}
        onChange={(e) =>
          setEditDraft((d) => ({
            ...d,
            event: { ...d.event, time: e.target.value },
          }))
        }
        placeholder="Heure (ex: 18h-19h)"
      />

      <select
        className="border p-2 w-full rounded mb-3"
        value={editDraft.event.type || "groupe"}
        onChange={(e) =>
          setEditDraft((d) => ({
            ...d,
            event: { ...d.event, type: e.target.value },
          }))
        }
      >
        <option value="groupe">Cours de groupe</option>
        <option value="privé">Cours privé</option>
        <option value="semi">Demi-privé</option>
        <option value="maison">Entraînement maison</option>
        <option value="competition">Compétition</option>
        <option value="passage">Passage de ceinture</option>
        <option value="seminaire">Séminaire</option>
      </select>

      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-2 rounded bg-gray-100"
          onClick={() => setEditDraft(null)}
        >
          Annuler
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white"
          onClick={() => {
            // met à jour (créé si auto-cours sans id)
            upsertEvent(editDraft.event);
            setEditDraft(null);
          }}
        >
          Sauvegarder
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
