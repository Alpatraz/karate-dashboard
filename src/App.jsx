import React, { useState, useEffect } from "react";
import {
  Target,
  Calendar as CalendarIcon,
  BookOpen,
  LineChart,
  Settings as SettingsIcon,
  Play,
  Users,
  Heart,
  UserCheck,
} from "lucide-react";

import DashboardView from "./components/DashboardView";
import ProgressionView from "./components/ProgressionView";
import VideoLibraryView from "./components/VideoLibraryView";
import InstructorsView from "./components/InstructorsView";
import CalendarEnhancedView from "./components/CalendarEnhancedView";
import AddEventModal from "./components/AddEventModal";
import ProfileManager from "./components/ProfileManager";
import PlanningEditor from "./components/PlanningEditor";

// ==========================================================
// Données globales communes
// ==========================================================

const DEFAULT_RULES = {
  "Blanche→Jaune": 30,
  "Jaune→Orange": 40,
  "Orange→Mauve": 50,
  "Mauve→Verte": 60,
  "Verte→Verte / Bleue": 70,
  "Verte / Bleue→Bleue": 80,
  "Bleue→Brune": 100,
  "Brune→Noire": 120,
};

// ton horaire régulier
const DEFAULT_PLANNING = [
  {
    jour: "Lundi",
    cours: [
      { nom: "Adultes Bleue et+", heure: "19h00-20h00", type: "groupe" },
      { nom: "Combat avancé", heure: "20h00-20h30", type: "groupe" },
    ],
  },
  {
    jour: "Jeudi",
    cours: [
      { nom: "Karaté Adultes", heure: "19h00-20h00", type: "groupe" },
      { nom: "Armes 12+", heure: "20h00-20h30", type: "groupe" },
    ],
  },
  {
    jour: "Dimanche",
    cours: [
      { nom: "Pré-Ados/Adultes 8+", heure: "10h00-11h00", type: "groupe" },
    ],
  },
];

// ==========================================================
// Composant principal
// ==========================================================
export default function KarateDashboard() {
  // ---------------------------
  // Onglet actif dans la barre latérale
  // ---------------------------
  const [activeTab, setActiveTab] = useState("Calendrier"); // <-- on ouvre direct sur Calendrier pour debug

  // ---------------------------
  // Profils
  // ---------------------------
  const [profiles, setProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    } catch {
      return [];
    }
  });

  const [activeProfile, setActiveProfile] = useState(null);

  // Au premier render :
  // - on seed les JSON initiaux si pas déjà faits
  // - on crée un profil par défaut si aucun profil
  useEffect(() => {
    // seed instructeurs (juste pour que ça existe dans localStorage)
    import("./data/instructors.json").then((mod) => {
      localStorage.setItem("karate_instructors", JSON.stringify(mod.default));
    });

    // seed règles
    if (!localStorage.getItem("karate_rules")) {
      localStorage.setItem("karate_rules", JSON.stringify(DEFAULT_RULES));
    }

    // seed planning
    if (!localStorage.getItem("karate_planning")) {
      localStorage.setItem("karate_planning", JSON.stringify(DEFAULT_PLANNING));
    }

    // si pas de profils -> créer un profil par défaut immédiatement
    if (!profiles || profiles.length === 0) {
      const defaultProfile = {
        id: "profile-1",
        nom: "Guillaume",
        dateNaissance: "2000-01-01",
        type: "Adulte",
        abonnementMensuel: 0,
        options: { armes: true, combat: true },
        actif: true,
      };
      const initialProfiles = [defaultProfile];
      setProfiles(initialProfiles);
      localStorage.setItem("karate_profiles", JSON.stringify(initialProfiles));
      setActiveProfile(defaultProfile);
    } else {
      const current = profiles.find((p) => p.actif) || profiles[0];
      setActiveProfile(current || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync profils => localStorage
  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // ---------------------------
  // planning commun (horaire régulier)
  // ---------------------------
  const [planning, setPlanning] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("karate_planning") ||
          JSON.stringify(DEFAULT_PLANNING)
      );
    } catch {
      return DEFAULT_PLANNING;
    }
  });

  useEffect(() => {
    localStorage.setItem("karate_planning", JSON.stringify(planning));
  }, [planning]);

  // ---------------------------
  // règles communes
  // ---------------------------
  const [rules, setRules] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("karate_rules") ||
          JSON.stringify(DEFAULT_RULES)
      );
    } catch {
      return DEFAULT_RULES;
    }
  });

  useEffect(() => {
    localStorage.setItem("karate_rules", JSON.stringify(rules));
  }, [rules]);

  // ---------------------------
  // jours fermés (commun pour tous, pas encore utilisé fort)
  // ---------------------------
  const [holidays, setHolidays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_holidays") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("karate_holidays", JSON.stringify(holidays));
  }, [holidays]);

  // ---------------------------
  // Ceintures (PAR PROFIL maintenant)
  //
  // on stocke chaque profil dans sa propre clé: karate_belts_<id>
  // ---------------------------
  const [beltsByProfile, setBeltsByProfile] = useState({}); // { [profileId]: [...] }

  // charger belts du profil actif
  useEffect(() => {
    if (!activeProfile) return;
    const k = `karate_belts_${activeProfile.id}`;
    const arr = JSON.parse(localStorage.getItem(k) || "[]");
    setBeltsByProfile((prev) => ({ ...prev, [activeProfile.id]: arr }));
  }, [activeProfile]);

  // fonction pour mettre à jour les ceintures d'un profil donné
  const setBeltsForActiveProfile = (newBelts) => {
    if (!activeProfile) return;
    const profileId = activeProfile.id;
    const key = `karate_belts_${profileId}`;
    localStorage.setItem(key, JSON.stringify(newBelts));
    setBeltsByProfile((prev) => ({
      ...prev,
      [profileId]: newBelts,
    }));
  };

  // ---------------------------
  // EVENTS (PAR PROFIL)
  // ---------------------------
  const [eventsByProfile, setEventsByProfile] = useState({}); // { [profileId]: [...] }

  // charger events quand le profil actif change
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_events_${activeProfile.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setEventsByProfile((prev) => ({ ...prev, [activeProfile.id]: stored }));
  }, [activeProfile]);

  // helper pour récupérer les events pour le profil actif sans se planter
  const activeEvents = activeProfile
    ? eventsByProfile[activeProfile.id] || []
    : [];

  // quand on modifie les events -> push dans localStorage + state global
  const setEventsForActiveProfile = (updaterFnOrArray) => {
    if (!activeProfile) return;
    const profId = activeProfile.id;
    const prev = eventsByProfile[profId] || [];
    const next =
      typeof updaterFnOrArray === "function"
        ? updaterFnOrArray(prev)
        : updaterFnOrArray;

    // save
    localStorage.setItem(`karate_events_${profId}`, JSON.stringify(next));

    // update state
    setEventsByProfile((all) => ({
      ...all,
      [profId]: next,
    }));
  };
// Charger les events dès le chargement du profil actif
useEffect(() => {
  if (!activeProfile) return;
  const saved = JSON.parse(localStorage.getItem(`karate_events_${activeProfile.id}`) || "[]");
  setEventsByProfile((prev) => ({ ...prev, [activeProfile.id]: saved }));
}, [activeProfile]);

  // ---------------------------
  // Popup "Ajouter événement"
  // ---------------------------
  const [showAdd, setShowAdd] = useState(false);

  const handleAddEvent = (ev) => {
    if (!activeProfile) return;
    const full = {
      ...ev,
      profileId: activeProfile.id,
      status: "planifié",
    };
    setEventsForActiveProfile((prev) => [...prev, full]);
  };

  // ---------------------------
  // Changer le profil actif depuis l'onglet Profils
  // ---------------------------
  const handleSetActiveProfile = (id) => {
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, actif: p.id === id }))
    );
    const newActive = profiles.find((p) => p.id === id);
    setActiveProfile(newActive || null);
  };

  // ---------------------------
  // Sidebar menu
  // ---------------------------
  const menu = [
    { label: "Tableau de bord", icon: <Target /> },
    { label: "Calendrier", icon: <CalendarIcon /> },
    { label: "Base technique", icon: <BookOpen /> },
    { label: "Progression", icon: <LineChart /> },
    { label: "Vidéos", icon: <Play /> },
    { label: "Instructeurs", icon: <Users /> },
    { label: "Santé", icon: <Heart /> },
    { label: "Profils", icon: <UserCheck /> },
    { label: "Paramètres", icon: <SettingsIcon /> },
  ];

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Barre latérale */}
      <aside className="w-72 bg-white border-r p-4">
        <h1 className="text-xl font-bold text-red-600 mb-6">
          🥋 Progression Karaté
        </h1>

        {/* Profil actif résumé */}
        {activeProfile ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <div className="font-semibold flex justify-between items-center">
              <span>{activeProfile.nom}</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded">
                actif
              </span>
            </div>
            <div className="text-red-800 text-xs mt-1">
              {activeProfile.type} · Abonnement{" "}
              {activeProfile.abonnementMensuel ?? 0}$
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-xs text-yellow-800">
            Aucun profil actif
          </div>
        )}

        <nav className="space-y-2">
          {menu.map((m) => (
            <button
              key={m.label}
              onClick={() => setActiveTab(m.label)}
              className={`flex items-center gap-2 w-full p-2 rounded-md ${
                activeTab === m.label
                  ? "bg-red-50 text-red-600"
                  : "hover:bg-gray-100"
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Zone principale */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "Tableau de bord" && (
          <DashboardView
            events={activeEvents}
            activeProfile={activeProfile}
            belts={beltsByProfile[activeProfile?.id] || []}
            rules={rules}
          />
        )}

        {activeTab === "Calendrier" && (
          <CalendarEnhancedView
            events={activeEvents}
            setEvents={setEventsForActiveProfile}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            handleAddEvent={handleAddEvent}
            activeProfile={activeProfile}
            planning={planning}
          />
        )}

        {activeTab === "Base technique" && (
          <div>Base technique (à venir)</div>
        )}

        {activeTab === "Progression" && (
          <ProgressionView
            events={activeEvents}
            rules={rules}
            belts={beltsByProfile[activeProfile?.id] || []}
            setBelts={(newArr) => setBeltsForActiveProfile(newArr)}
          />
        )}

        {activeTab === "Vidéos" && <VideoLibraryView />}

        {activeTab === "Instructeurs" && <InstructorsView />}

        {activeTab === "Santé" && <div>Santé (à venir)</div>}

        {activeTab === "Profils" && (
          <ProfileManager
            profiles={profiles}
            setProfiles={setProfiles}
            activeProfile={activeProfile}
            onSetActiveProfile={handleSetActiveProfile}
          />
        )}

{activeTab === "Paramètres" && (
  <div className="text-gray-700 space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-2 text-red-600">
        Paramètres globaux
      </h2>
      <p className="text-sm text-gray-600">
        Gère ici l’horaire régulier, les jours fermés et les règles.
      </p>
    </div>

    <div className="bg-gray-50 border rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-3">
        Horaire régulier (planning)
      </h3>

      <PlanningEditor planning={planning} setPlanning={setPlanning} />
    </div>
  </div>
)}


      </main>

      {/* Modale globale d'ajout d'événement */}
      <AddEventModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddEvent}
        activeProfile={activeProfile}
      />
    </div>
  );
}
