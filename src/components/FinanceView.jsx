import React, { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
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

  // Charger tous les profils
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("karate_profiles") || "[]");
    setProfiles(saved);
  }, []);

  // Extraction et normalisation de tous les paiements
  const allPayments = useMemo(() => {
    return profiles.flatMap((p) =>
      (p.paiements || []).map((pay) => ({
        ...pay,
        profileName: p.nom,
        statut: pay.statut || "Payé",
        montant: parseFloat(pay.montant) || 0,
        date: pay.date || "",
        modePaiement: pay.modePaiement || "",
        payePar: pay.payePar || "",
      }))
    );
  }, [profiles]);

  // Totaux globaux
  const totalPaid = allPayments
    .filter((p) => p.statut === "Payé")
    .reduce((acc, p) => acc + p.montant, 0);

  const totalPending = allPayments
    .filter((p) => p.statut === "À payer")
    .reduce((acc, p) => acc + p.montant, 0);

  // Filtrage par année
  const filteredPayments =
    selectedYear === "toutes"
      ? allPayments
      : allPayments.filter(
          (p) => new Date(p.date).getFullYear().toString() === selectedYear
        );

  // Groupement par année + mois
  const monthlyData = useMemo(() => {
    const map = {};
    allPayments.forEach((p) => {
      if (!p.date) return;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: key, payé: 0, "à payer": 0 };
      if (p.statut === "Payé") map[key].payé += p.montant;
      else map[key]["à payer"] += p.montant;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [allPayments]);

  // Totaux par profil
  const totalsByProfile = useMemo(() => {
    const res = {};
    profiles.forEach((p) => {
      const payes = (p.paiements || []).filter((x) => x.statut === "Payé");
      const apayer = (p.paiements || []).filter((x) => x.statut === "À payer");
      res[p.nom] = {
        totalPayé: payes.reduce((acc, x) => acc + (parseFloat(x.montant) || 0), 0),
        totalÀPayer: apayer.reduce((acc, x) => acc + (parseFloat(x.montant) || 0), 0),
      };
    });
    return res;
  }, [profiles]);

  return (
    <div className="p-6 text-gray-800">
      <h1 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-2">
        <DollarSign /> Suivi financier global
      </h1>

      {/* Sélecteur d’année */}
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

      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" />{" "}
            <h2 className="font-semibold">Total payé</h2>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ${totalPaid.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600" />{" "}
            <h2 className="font-semibold">À payer</h2>
          </div>
          <p className="text-2xl font-bold text-red-700">
            ${totalPending.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border rounded-xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" />{" "}
            <h2 className="font-semibold">Profils suivis</h2>
          </div>
          <p className="text-2xl font-bold text-blue-700">{profiles.length}</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white border rounded-xl shadow p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="text-red-600" />{" "}
          <h2 className="text-lg font-semibold text-gray-700">
            Évolution mensuelle
          </h2>
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
                <Line
                  type="monotone"
                  dataKey="payé"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="à payer"
                  stroke="#dc2626"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Détail par profil */}
      <div className="bg-white border rounded-xl shadow p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Détail par profil
        </h2>
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
                <td className="p-2 text-right text-green-700">
                  ${t.totalPayé.toFixed(2)}
                </td>
                <td className="p-2 text-right text-red-600">
                  ${t.totalÀPayer.toFixed(2)}
                </td>
                <td className="p-2 text-right font-semibold">
                  ${(t.totalPayé + t.totalÀPayer).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Liste de tous les paiements */}
      <div className="bg-white border rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Tous les paiements enregistrés
        </h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Profil</th>
              <th className="p-2 text-left">Catégorie</th>
              <th className="p-2 text-left">Détail</th>
              <th className="p-2 text-right">Montant ($)</th>
              <th className="p-2 text-center">Date</th>
              <th className="p-2 text-center">Mode paiement</th>
              <th className="p-2 text-center">Payé par</th>
              <th className="p-2 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center text-gray-500 p-4 italic"
                >
                  Aucun paiement trouvé.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium">{p.profileName}</td>
                  <td className="p-2">{p.categorie}</td>
                  <td className="p-2">{p.detail}</td>
                  <td className="p-2 text-right font-semibold">
                    ${p.montant.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">{p.date}</td>
                  <td className="p-2 text-center">{p.modePaiement || "—"}</td>
                  <td className="p-2 text-center">{p.payePar || "—"}</td>
                  <td
                    className={`p-2 text-center font-semibold ${
                      p.statut === "Payé"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {p.statut}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
