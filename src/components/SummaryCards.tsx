import React, { useState } from "react";
import { PortfolioSummary } from "../types";
import { ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, Clock, DollarSign, Calendar, Gift } from "lucide-react";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const [timeframe, setTimeframe] = useState<"gunluk" | "aylik" | "ucAylik" | "altiAylik" | "yillik">("aylik");

  const timeframeLabels = {
    gunluk: "Son 1 Gün",
    aylik: "Son 30 Gün (Aylık)",
    ucAylik: "Son 90 Gün (3 Aylık)",
    altiAylik: "Son 180 Gün (6 Aylık)",
    yillik: "Son 365 Gün (Yıllık)"
  };

  const currentPeriod = summary.donemGetiri.genel[timeframe];
  const isPeriodPositive = (currentPeriod.kz || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-20 h-20 text-blue-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam Portföy Değeri</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ₺{summary.toplamGuncel.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>
              USD: <span className="font-bold text-amber-300 font-mono">${summary.currency.toplamGuncelUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </span>
            <span>
              EUR: <span className="font-bold text-blue-300 font-mono">€{summary.currency.toplamGuncelEUR.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>

        {/* Unrealized Profit / Loss */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Açık (Unrealized) Kar / Zarar</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                summary.toplamKZ >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {summary.toplamKZ >= 0 ? "+" : ""}₺
              {Math.abs(summary.toplamKZ).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full ${
                summary.toplamKZ >= 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {summary.toplamKZ >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              %{Math.abs(summary.toplamKZPct).toFixed(2)}
            </span>
            <span className="text-slate-400 font-medium">BIST100: {summary.currency.bist100Index}</span>
          </div>
        </div>

        {/* Realized Profit & Dividends */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nakit Temettü & Realize Kar</p>
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                (summary.toplamGerceklesen + summary.toplamTemettuGeliri) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              +₺{(summary.toplamGerceklesen + summary.toplamTemettuGeliri).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Satış Karı: <strong className="text-slate-200">₺{summary.toplamGerceklesen.toLocaleString("tr-TR")}</strong></span>
            <span>Temettü: <strong className="text-emerald-300">₺{summary.toplamTemettuGeliri.toLocaleString("tr-TR")}</strong></span>
          </div>
        </div>

        {/* Modified Dietz Period Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dönemsel Performans</p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            {currentPeriod.kz !== null ? (
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isPeriodPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {isPeriodPositive ? "+" : ""}₺
                {Math.abs(currentPeriod.kz).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-xl font-bold text-slate-500">Geçmiş Veri Yok</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-300 font-medium">
            {timeframeLabels[timeframe]}:{" "}
            {currentPeriod.kzPct !== null ? (
              <span className={isPeriodPositive ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                %{currentPeriod.kzPct.toFixed(2)}
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Modified Dietz Period Selector Toolbar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Modified Dietz Zaman Dilimi:</span>
          <span className="text-xs text-slate-400 hidden sm:inline">(Nakit akışlarından arındırılmış net getiri)</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["gunluk", "aylik", "ucAylik", "altiAylik", "yillik"] as const).map((key) => {
            const labelMap = { gunluk: "1 Gün", aylik: "30 Gün", ucAylik: "90 Gün", altiAylik: "180 Gün", yillik: "1 Yıl" };
            return (
              <button
                key={key}
                onClick={() => setTimeframe(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vade Merdiveni (Maturity Ladder) Widget */}
      {summary.vadeMerdiveni.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs uppercase text-slate-200 tracking-wider">
                Vade Merdiveni (Nakit Akış Takvimi)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Sabit getirili enstrümanların aylara göre vadesi</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.vadeMerdiveni.map((bucket) => (
              <div key={bucket.ayYil} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-bold text-amber-300 uppercase block">{bucket.ayAdi}</span>
                <div className="text-sm font-extrabold text-white font-mono">
                  ₺{bucket.toplamAnapara.toLocaleString("tr-TR")}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Net Getiri:</span>
                  <span className="font-semibold text-emerald-400">+₺{bucket.toplamNetGetiri.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hisse Senedi */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📈</span>
              <h3 className="font-bold text-sm text-white">Hisse Senedi</h3>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
              {summary.hisse.netPozisyonAdedi} Pozisyon
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Maliyet:</span>
              <span className="font-semibold text-slate-200">₺{summary.hisse.maliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Güncel Değer:</span>
              <span className="font-semibold text-white">₺{summary.hisse.guncel.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
              <span className="text-slate-300">Açık Kar/Zarar:</span>
              <span className={summary.hisse.kz >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {summary.hisse.kz >= 0 ? "+" : ""}₺{summary.hisse.kz.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (%{summary.hisse.kzPct.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Fon */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🏦</span>
              <h3 className="font-bold text-sm text-white">Yatırım Fonu</h3>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
              {summary.fon.netPozisyonAdedi} Pozisyon
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Maliyet:</span>
              <span className="font-semibold text-slate-200">₺{summary.fon.maliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Güncel Değer:</span>
              <span className="font-semibold text-white">₺{summary.fon.guncel.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
              <span className="text-slate-300">Açık Kar/Zarar:</span>
              <span className={summary.fon.kz >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {summary.fon.kz >= 0 ? "+" : ""}₺{summary.fon.kz.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (%{summary.fon.kzPct.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Bono / Tahvil */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📄</span>
              <h3 className="font-bold text-sm text-white">Bono & Tahvil</h3>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              {summary.bono.aktifKayit} Aktif Kayıt
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Anapara:</span>
              <span className="font-semibold text-slate-200">₺{summary.bono.anapara.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Beklenen Net Getiri:</span>
              <span className="font-semibold text-emerald-400">+₺{summary.bono.net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300">
              <span>Ortalama Vade:</span>
              <span className="font-bold text-amber-300">{summary.bono.ortVadeGün} gün</span>
            </div>
          </div>
        </div>

        {/* Mevduat */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/50 transition-all">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <h3 className="font-bold text-sm text-white">Mevduat</h3>
            </div>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
              {summary.mevduat.aktifKayit} Aktif Kayıt
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Anapara:</span>
              <span className="font-semibold text-slate-200">₺{summary.mevduat.anapara.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Beklenen Net Getiri:</span>
              <span className="font-semibold text-emerald-400">+₺{summary.mevduat.net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300">
              <span>Ortalama Vade:</span>
              <span className="font-bold text-cyan-300">{summary.mevduat.ortVadeGün} gün</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

