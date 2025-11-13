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
  DollarSign,
  Menu,
  Trophy,
  Dumbbell,
  X,
} from "lucide-react";

import DashboardView from "./components/DashboardView";
import ProgressionView from "./components/ProgressionView";
import CompetitionsView from "./components/CompetitionsView";
import VideoLibraryView from "./components/VideoLibraryView";
import HomeTrainingView from "./components/HomeTrainingView.jsx";
import InstructorsView from "./components/InstructorsView";
import CalendarEnhancedView from "./components/CalendarEnhancedView";
import AddEventModal from "./components/AddEventModal";
import ProfileManager from "./components/ProfileManager";
import PlanningEditor from "./components/PlanningEditor";
import FinancesView from "./components/FinanceView";

// ==========================================================
// Données globales communes
// ==========================================================
const DEFAULT_RULES = {
  "Blanche→Jaune": 30,
  "Jaune→Orange": 40,
  "Orange→Mauve": 50,
  "Mauve→Verte": 60,
  "Verte→Verte / Bleue": 40,
  "Verte / Bleue→Bleue": 40,
  "Bleue→Bleue / Brune": 100,
  "Bleue / Brune→Brune": 40,
  "Brune→Brune / Noire": 100,
  "Brune / Noire→Noire": 120,
};

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
  const [activeTab, setActiveTab] = useState("Calendrier");
  const [menuOpen, setMenuOpen] = useState(false);

  const [profiles, setProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    } catch {
      return [];
    }
  });
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    import("./data/instructors.json").then((mod) => {
      localStorage.setItem("karate_instructors", JSON.stringify(mod.default));
    });

    if (!localStorage.getItem("karate_rules")) {
      localStorage.setItem("karate_rules", JSON.stringify(DEFAULT_RULES));
    }
    if (!localStorage.getItem("karate_planning")) {
      localStorage.setItem("karate_planning", JSON.stringify(DEFAULT_PLANNING));
    }

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
  }, []); // eslint-disable-line

  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

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

  const [beltsByProfile, setBeltsByProfile] = useState({});
  useEffect(() => {
    if (!activeProfile) return;
    const k = `karate_belts_${activeProfile.id}`;
    const arr = JSON.parse(localStorage.getItem(k) || "[]");
    setBeltsByProfile((prev) => ({ ...prev, [activeProfile.id]: arr }));
  }, [activeProfile]);

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

  const [eventsByProfile, setEventsByProfile] = useState({});
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_events_${activeProfile.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setEventsByProfile((prev) => ({ ...prev, [activeProfile.id]: stored }));
  }, [activeProfile]);

  const activeEvents = activeProfile
    ? eventsByProfile[activeProfile.id] || []
    : [];

  const setEventsForActiveProfile = (updaterFnOrArray) => {
    if (!activeProfile) return;
    const profId = activeProfile.id;
    const prev = eventsByProfile[profId] || [];
    const next =
      typeof updaterFnOrArray === "function"
        ? updaterFnOrArray(prev)
        : updaterFnOrArray;

    localStorage.setItem(`karate_events_${profId}`, JSON.stringify(next));
    setEventsByProfile((all) => ({
      ...all,
      [profId]: next,
    }));
  };

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

  const handleSetActiveProfile = (id) => {
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, actif: p.id === id }))
    );
    const newActive = profiles.find((p) => p.id === id);
    setActiveProfile(newActive || null);
  };

  const menu = [
    { label: "Tableau de bord", icon: <Target /> },
    { label: "Calendrier", icon: <CalendarIcon /> },
    { label: "Base technique", icon: <BookOpen /> },
    { label: "Compétitions", icon: <Trophy /> },
    { label: "Progression", icon: <LineChart /> },
    { label: "Entraînement maison", icon: <Dumbbell /> },
    { label: "Vidéos", icon: <Play /> },
    { label: "Instructeurs", icon: <Users /> },
    { label: "Santé", icon: <Heart /> },
    { label: "Finances", icon: <DollarSign /> },
    { label: "Profils", icon: <UserCheck /> },
    { label: "Paramètres", icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Bouton menu mobile */}
      <div className="md:hidden bg-white border-b flex items-center justify-between p-3">
        <h1 className="text-lg font-bold text-red-600">🥋 Progression</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded hover:bg-gray-100"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Barre latérale */}
      <aside
        className={`${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        } transform transition-transform duration-300 fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r p-4 overflow-y-auto`}
      >
        <h1 className="hidden md:block text-xl font-bold text-red-600 mb-6">
          🥋 Progression Karaté
        </h1>

        {activeProfile ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <div className="font-semibold flex justify-between items-center">
              <span>{activeProfile.nom}</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded">
                actif
              </span>
            </div>
            <div className="text-red-800 text-xs mt-1">
              {activeProfile.type} · Abonnement {activeProfile.abonnementMensuel ?? 0}$
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
              onClick={() => {
                setActiveTab(m.label);
                setMenuOpen(false);
              }}
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

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Contenu principal */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto mt-2 md:mt-0">
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

        {activeTab === "Progression" && (
          <ProgressionView
            events={activeEvents}
            rules={rules}
            belts={beltsByProfile[activeProfile?.id] || []}
            setBelts={(newArr) => setBeltsForActiveProfile(newArr)}
          />
        )}

{activeTab === "Compétitions" && (
  <CompetitionsView activeProfile={activeProfile} />
)}


{activeTab === "Entraînement maison" && (
  <HomeTrainingView activeProfile={activeProfile} />
)}
        {activeTab === "Vidéos" && <VideoLibraryView />}
        {activeTab === "Instructeurs" && <InstructorsView />}
        {activeTab === "Santé" && <div>Santé (à venir)</div>}
        {activeTab === "Finances" && (
          <FinancesView activeProfile={activeProfile} events={activeEvents} />
        )}
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

      <AddEventModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddEvent}
        activeProfile={activeProfile}
      />
    </div>
  );
}
