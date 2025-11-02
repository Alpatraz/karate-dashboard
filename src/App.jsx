import React, { useState, useEffect, useMemo } from "react";
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

const BELTS = [
  "Blanche", "Jaune", "Orange", "Mauve", "Verte", "Verte / Bleue",
  "Bleue", "Bleue / Brune", "Brune", "Brune / Noire",
  "Noire", "Noire 1 Dan", "Noire 2 Dan", "Noire 3 Dan",
];
const beltIndex = (b) => BELTS.indexOf(b);

const DEFAULT_RULES = {
  "Blanche→Jaune": 30, "Jaune→Orange": 40, "Orange→Mauve": 50,
  "Mauve→Verte": 60, "Verte→Verte / Bleue": 70,
  "Verte / Bleue→Bleue": 80, "Bleue→Brune": 100, "Brune→Noire": 120,
};

const DEFAULT_PLANNING = [
  {
    jour: "Lundi",
    cours: [
      { nom: "Adultes Bleue et+", heure: "19h00-20h00", type: "Adulte" },
      { nom: "Combat avancé", heure: "20h00-20h30", type: "Adulte" },
    ],
  },
  {
    jour: "Jeudi",
    cours: [
      { nom: "Karaté Adultes", heure: "19h00-20h00", type: "Adulte" },
      { nom: "Armes 12+", heure: "20h00-20h30", type: "Adulte" },
    ],
  },
  {
    jour: "Dimanche",
    cours: [{ nom: "Pré-Ados/Adultes 8+", heure: "10h00-11h00", type: "Adulte" }],
  },
];

export default function KarateDashboard() {
  const [activeTab, setActiveTab] = useState("Tableau de bord");

  // ---------------------- PROFILS ----------------------
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
    import("./data/belts.json").then((mod) => {
      localStorage.setItem("karate_belts_rules", JSON.stringify(mod.default));
    });
    import("./data/profile.json").then((mod) => {
      localStorage.setItem("karate_profile", JSON.stringify(mod.default));
    });

    if (!profiles || profiles.length === 0) {
      const defaultProfile = {
        id: "profile-1",
        nom: "Profil Principal",
        dateNaissance: "2000-01-01",
        type: "Adulte",
        abonnementMensuel: 0,
        options: { armes: false, combat: false },
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("karate_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // ---------------------- EVENTS ----------------------
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_events_${activeProfile.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setEvents(stored);
  }, [activeProfile]);
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_events_${activeProfile.id}`;
    localStorage.setItem(key, JSON.stringify(events));
  }, [events, activeProfile]);

  // ---------------------- BELTS PAR PROFIL ----------------------
  const [belts, setBelts] = useState([]);
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_belts_${activeProfile.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setBelts(stored);
  }, [activeProfile]);
  useEffect(() => {
    if (!activeProfile) return;
    const key = `karate_belts_${activeProfile.id}`;
    localStorage.setItem(key, JSON.stringify(belts));
  }, [belts, activeProfile]);

  // ---------------------- PARAMÈTRES COMMUNS ----------------------
  const [rules, setRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_rules") || JSON.stringify(DEFAULT_RULES));
    } catch {
      return DEFAULT_RULES;
    }
  });
  const [planning, setPlanning] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_planning") || JSON.stringify(DEFAULT_PLANNING));
    } catch {
      return DEFAULT_PLANNING;
    }
  });
  const [holidays, setHolidays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("karate_holidays") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => localStorage.setItem("karate_rules", JSON.stringify(rules)), [rules]);
  useEffect(() => localStorage.setItem("karate_planning", JSON.stringify(planning)), [planning]);
  useEffect(() => localStorage.setItem("karate_holidays", JSON.stringify(holidays)), [holidays]);

  // ---------------------- MODALE D’AJOUT ----------------------
  const [showAdd, setShowAdd] = useState(false);
  const handleAddEvent = (ev) => {
    if (!activeProfile) return;
    const full = { ...ev, profileId: activeProfile.id, status: "planifié" };
    setEvents((prev) => [...prev, full]);
  };

  // ---------------------- CHANGEMENT DE PROFIL ----------------------
  const handleSetActiveProfile = (id) => {
    setProfiles((prev) => prev.map((p) => ({ ...p, actif: p.id === id })));
    const newActive = profiles.find((p) => p.id === id);
    setActiveProfile(newActive || null);
  };

  // ---------------------- MENU ----------------------
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

  // ---------------------- RENDER ----------------------
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r p-4">
        <h1 className="text-xl font-bold text-red-600 mb-6">🥋 Progression Karaté</h1>

        {activeProfile ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <div className="font-semibold flex justify-between items-center">
              <span>{activeProfile.nom}</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded">actif</span>
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
              onClick={() => setActiveTab(m.label)}
              className={`flex items-center gap-2 w-full p-2 rounded-md ${
                activeTab === m.label ? "bg-red-50 text-red-600" : "hover:bg-gray-100"
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "Tableau de bord" && (
          <DashboardView events={events} activeProfile={activeProfile} belts={belts} />
        )}
        {activeTab === "Calendrier" && (
          <CalendarEnhancedView
            events={events}
            setEvents={setEvents}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            handleAddEvent={handleAddEvent}
            activeProfile={activeProfile}
          />
        )}
        {activeTab === "Progression" && (
          <ProgressionView
            events={events}
            rules={rules}
            belts={belts}
            setBelts={setBelts}
            activeProfile={activeProfile}
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
          <div className="text-gray-700">
            <h2 className="text-2xl font-bold mb-4">Paramètres</h2>
            <p>Ici tu pourras gérer planning, jours fermés, règles de passage, etc.</p>
          </div>
        )}
      </main>

      <AddEventModal show={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddEvent} activeProfile={activeProfile} />
    </div>
  );
}
