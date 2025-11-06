import React, { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function FinanceView() {
  const [profiles, setProfiles] = useState([]);
  const [selectedYear, setSelectedYear] = useState("toutes");
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(
    () => localStorage.getItem("auto_pay_enabled") === "true"
  );

  // === Charger les profils ===
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    const fixed = saved.map((p) => ({
      ...p,
      abonnementTotal:
        p.abonnementTotal ??
        (parseFloat(p.abonnementMensuel || 0) +
          parseFloat(p.optionCombatMontant || 0) +
          parseFloat(p.optionArmesMontant || 0)),
    }));
    setProfiles(fixed);
    localStorage.setItem("karate_profiles", JSON.stringify(fixed));
  }, []);

  // === Sauvegarder le paramètre auto-generation ===
  useEffect(() => {
    localStorage.setItem("auto_pay_enabled", autoGenerateEnabled ? "true" : "false");
  }, [autoGenerateEnabled]);

  // === Génération automatique ===
  const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const monthsBetween = (lastYM, nowYM) => {
    if (!lastYM) return [nowYM];
    const [ly, lm] = lastYM.split("-").map(Number);
    const [ny, nm] = nowYM.split("-").map(Number);
    const out = [];
    let y = ly,
      m = lm;
    while (y < ny || (y === ny && m < nm)) {
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      out.push(`${y}-${String(m).padStart(2, "0")}`);
    }
    return out;
  };

  useEffect(() => {
    if (!autoGenerateEnabled || profiles.length === 0) return;

    const today = new Date();
    const nowYM = ym(today);
    const lastYM = localStorage.getItem("auto_pay_last_generated");
    const toGenerate = monthsBetween(lastYM, nowYM);
    if (toGenerate.length === 0) return;

    const updated = profiles.map((p) => {
      const pays = Array.isArray(p.paiements) ? [...p.paiements] : [];
      const montantMensuel =
        parseFloat(
          p.abonnementTotal ||
            parseFloat(p.abonnementMensuel || 0) +
              parseFloat(p.optionCombatMontant || 0) +
              parseFloat(p.optionArmesMontant || 0)
        ) || 0;

      if (montantMensuel <= 0) return { ...p, paiements: pays };

      toGenerate.forEach((ymStr) => {
        const already = pays.some((pay) => {
          if (!pay.date) return false;
          const d = new Date(pay.date);
          const sameMonth = ym(d) === ymStr;
          const t = (pay.type || "").toLowerCase();
          return sameMonth && t.includes("abonnement") && t.includes("mensuel");
        });
        if (already) return;

        pays.push({
          type: "Abonnement mensuel",
          montant: montantMensuel,
          date: `${ymStr}-01`,
          statut: "À payer",
          payeur: p.nom,
          methode: "—",
        });
      });
      return { ...p, paiements: pays };
    });

    localStorage.setItem("karate_profiles", JSON.stringify(updated));
    localStorage.setItem("auto_pay_last_generated", nowYM);
    setProfiles(updated);
  }, [autoGenerateEnabled]); // ✅ on simplifie pour éviter re-render infini

  // === Extraction des paiements ===
  const allPayments = useMemo(() => {
    return profiles.flatMap((p) =>
      (p.paiements || []).map((pay) => ({
        profileName: p.nom || "Profil sans nom",
        statut: pay.statut || "Payé",
        montant: parseFloat(pay.montant) || 0,
        date: pay.date || "",
        methode: pay.methode || "—",
        payeur: pay.payeur || "—",
        type: pay.type || "Autre",
      }))
    );
  }, [profiles]);

  const totalPaid = allPayments
    .filter((p) => p.statut === "Payé")
    .reduce((acc, p) => acc + p.montant, 0);

  const totalPending = allPayments
    .filter((p) => p.statut === "À payer")
    .reduce((acc, p) => acc + p.montant, 0);

  const filteredPayments =
    selectedYear === "toutes"
      ? allPayments
      : allPayments.filter(
          (p) => new Date(p.date).getFullYear().toString() === selectedYear
        );

  const monthlyData = useMemo(() => {
    const map = {};
    allPayments.forEach((p) => {
      if (!p.date) return;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: key, payé: 0, "à payer": 0 };
      if (p.statut === "Payé") map[key].payé += p.montant;
      else if (p.statut === "À payer") map[key]["à payer"] += p.montant;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [allPayments]);

  const totalsByProfile = useMemo(() => {
    const res = {};
    profiles.forEach((p) => {
      const payes = (p.paiements || []).filter((x) => x.statut === "Payé");
      const apayer = (p.paiements || []).filter((x) => x.statut === "À payer");
      res[p.nom || "Profil sans nom"] = {
        totalPayé: payes.reduce((acc, x) => acc + (parseFloat(x.montant) || 0), 0),
        totalÀPayer: apayer.reduce((acc, x) => acc + (parseFloat(x.montant) || 0), 0),
      };
    });
    return res;
  }, [profiles]);

// ------------------------------------------------------
// Ajouter un paiement dans Finance pour le profil actif
// ------------------------------------------------------
const addPaymentToFinance = (profile, paiement) => {
    if (!profile) return;
  
    // Charger tous les profils existants
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
  

  // === Rendu ===
  return (
    <div className="p-6 text-gray-800">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
          <DollarSign /> Suivi financier global
        </h1>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Settings className="w-4 h-4 text-gray-500" />
            <input
              type="checkbox"
              checked={autoGenerateEnabled}
              onChange={(e) => setAutoGenerateEnabled(e.target.checked)}
            />
            Générer automatiquement chaque 1er du mois
          </label>
          <button
            onClick={() => {
              const bump = Date.now();
              localStorage.setItem("auto_pay_force", String(bump));
              setProfiles(JSON.parse(localStorage.getItem("karate_profiles") || "[]"));
            }}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Générer maintenant
          </button>
        </div>
      </div>

      {/* Sélecteur année */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm text-gray-600">Filtrer par année :</label>
        <select
          className="border rounded p-2 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="toutes">Toutes</option>
          {[...new Set(allPayments.map((p) => new Date(p.date).getFullYear()))]
            .filter((y) => !isNaN(y))
            .sort((a, b) => b - a)
            .map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
        </select>
      </div>

      {/* Totaux globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" />
            <h2 className="font-semibold">Total payé</h2>
          </div>
          <p className="text-2xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
        </div>

        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600" />
            <h2 className="font-semibold">À payer</h2>
          </div>
          <p className="text-2xl font-bold text-red-700">${totalPending.toFixed(2)}</p>
        </div>

        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" />
            <h2 className="font-semibold">Profils suivis</h2>
          </div>
          <p className="text-2xl font-bold text-blue-700">{profiles.length}</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white border rounded-xl shadow p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="text-red-600" />
          <h2 className="text-lg font-semibold text-gray-700">Évolution mensuelle</h2>
        </div>
        {monthlyData.length === 0 ? (
          <p className="text-gray-500">Aucune donnée à afficher.</p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer>
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#ddd" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="payé" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="à payer" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Détail par profil */}
      <div className="bg-white border rounded-xl shadow p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Détail par profil</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Profil</th>
              <th className="p-2 text-right">Payé ($)</th>
              <th className="p-2 text-right">À payer ($)</th>
              <th className="p-2 text-right">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(totalsByProfile).map(([nom, t]) => (
              <tr key={nom} className="border-t">
                <td className="p-2 font-medium">{nom}</td>
                <td className="p-2 text-right text-green-700">${t.totalPayé.toFixed(2)}</td>
                <td className="p-2 text-right text-red-600">${t.totalÀPayer.toFixed(2)}</td>
                <td className="p-2 text-right font-semibold">
                  ${(t.totalPayé + t.totalÀPayer).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tous les paiements */}
      <div className="bg-white border rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Tous les paiements enregistrés
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left w-40">Profil</th>
                <th className="p-2 text-left w-40">Type</th>
                <th className="p-2 text-right w-24">Montant ($)</th>
                <th className="p-2 text-center w-28">Date</th>
                <th className="p-2 text-center w-32">Méthode</th>
                <th className="p-2 text-center w-32">Payeur</th>
                <th className="p-2 text-center w-28">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 p-4 italic">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition">
                    <td className="p-2 font-medium">{p.profileName}</td>
                    <td className="p-2">{p.type}</td>
                    <td className="p-2 text-right font-semibold">${p.montant.toFixed(2)}</td>
                    <td className="p-2 text-center">{p.date}</td>
                    <td className="p-2 text-center">{p.methode}</td>
                    <td className="p-2 text-center">{p.payeur}</td>
                    <td className="p-2 text-center">
  {p.statut === "Payé" ? (
    <span className="text-green-700 font-semibold">Payé</span>
  ) : (
    <button
      onClick={() => {
        const profiles = JSON.parse(localStorage.getItem("karate_profiles") || "[]");
        const updated = profiles.map((pr) => {
          if (pr.nom !== p.profileName) return pr;
          const pays = (pr.paiements || []).map((x) =>
            x.type === p.type && x.date === p.date ? { ...x, statut: "Payé" } : x
          );
          return { ...pr, paiements: pays };
        });
        localStorage.setItem("karate_profiles", JSON.stringify(updated));
        window.location.reload(); // pour rafraîchir la vue
      }}
      className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700"
    >
      Marquer payé
    </button>
  )}
</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
