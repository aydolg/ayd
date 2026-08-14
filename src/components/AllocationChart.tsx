import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { PortfolioSummary } from "../types";

interface AllocationChartProps {
  summary: PortfolioSummary;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

export const AllocationChart: React.FC<AllocationChartProps> = ({ summary }) => {
  const pieData = [
    { name: "Hisse Senedi", value: summary.hisse.guncel },
    { name: "Fon", value: summary.fon.guncel },
    { name: "Bono / Tahvil", value: summary.bono.anapara + summary.bono.net },
    { name: "Mevduat", value: summary.mevduat.anapara + summary.mevduat.net }
  ].filter((item) => item.value > 0);

  const barData = [
    {
      name: "Hisse",
      Maliyet: summary.hisse.maliyet,
      Güncel: summary.hisse.guncel,
      KarZarar: summary.hisse.kz
    },
    {
      name: "Fon",
      Maliyet: summary.fon.maliyet,
      Güncel: summary.fon.guncel,
      KarZarar: summary.fon.kz
    },
    {
      name: "Bono",
      Maliyet: summary.bono.anapara,
      Güncel: summary.bono.anapara + summary.bono.net,
      KarZarar: summary.bono.net
    },
    {
      name: "Mevduat",
      Maliyet: summary.mevduat.anapara,
      Güncel: summary.mevduat.anapara + summary.mevduat.net,
      KarZarar: summary.mevduat.net
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Varlık Dağılımı Pie Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>🎨</span> Portföy Varlık Dağılımı
        </h3>
        {pieData.length > 0 ? (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (%${((percent || 0) * 100).toFixed(1)})`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `₺${Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Portföyde henüz aktif varlık yok.
          </div>
        )}
      </div>

      {/* Maliyet vs Güncel Kar/Zarar Karşılaştırma Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>📊</span> Varlık Sınıfı Maliyet & Değer Analizi
        </h3>
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => `₺${Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar dataKey="Maliyet" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Güncel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
