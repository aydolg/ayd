import React, { useState } from "react";
import { StockPosition, FixedIncomeRecord } from "../types";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Tag, Lock, DollarSign, Calendar, XCircle, Edit3, RefreshCw } from "lucide-react";

interface AssetTableProps {
  stockPositions: StockPosition[];
  fundPositions: StockPosition[];
  fixedIncomeRecords: FixedIncomeRecord[];
  onQuickSellStock: (sembol: string, tip: "Hisse Senedi" | "Fon") => void;
  onQuickCloseFixedIncome: (recordId: string, isVadeSonu: boolean) => void;
  onUpdatePrice?: (sembol: string, newPrice: number) => void;
  onRefreshPrices?: () => void;
  isRefreshingPrices?: boolean;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  stockPositions,
  fundPositions,
  fixedIncomeRecords,
  onQuickSellStock,
  onQuickCloseFixedIncome,
  onUpdatePrice,
  onRefreshPrices,
  isRefreshingPrices = false
}) => {
  const [activeCategory, setActiveCategory] = useState<"Tümü" | "Hisse Senedi" | "Fon" | "Bono" | "Mevduat">("Tümü");
  const [search, setSearch] = useState("");

  const filteredStocks = stockPositions.filter(
    (p) => (activeCategory === "Tümü" || activeCategory === "Hisse Senedi") && p.sembol.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFunds = fundPositions.filter(
    (p) => (activeCategory === "Tümü" || activeCategory === "Fon") && p.sembol.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFixed = fixedIncomeRecords.filter(
    (r) =>
      (activeCategory === "Tümü" || activeCategory === r.tip) &&
      r.ad.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Açık Varlıklar ve Pozisyon Listesi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Portföyünüzdeki tüm güncel varlıklar, WAP maliyetleri ve net getiriler</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(["Tümü", "Hisse Senedi", "Fon", "Bono", "Mevduat"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Sembol veya Banka Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Stocks & Funds Table Section */}
      {(activeCategory === "Tümü" || activeCategory === "Hisse Senedi" || activeCategory === "Fon") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>📈</span> Hisse Senedi & Yatırım Fonları ({filteredStocks.length + filteredFunds.length})
            </h3>
            {onRefreshPrices && (
              <button
                onClick={onRefreshPrices}
                disabled={isRefreshingPrices}
                className="flex items-center gap-1.5 text-xs bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-800/60 transition disabled:opacity-50"
                title="Yahoo Finance ve piyasa verilerinden güncel fiyatları çek"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrices ? "animate-spin text-blue-400" : ""}`} />
                <span>{isRefreshingPrices ? "Fiyatlar Çekiliyor..." : "Canlı Fiyatları Yenile"}</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Sembol / Tip</th>
                  <th className="py-3 px-4 text-right">Miktar (Adet)</th>
                  <th className="py-3 px-4 text-right">Ort. Maliyet (WAP)</th>
                  <th className="py-3 px-4 text-right">Güncel Fiyat ✏️</th>
                  <th className="py-3 px-4 text-right">Maliyet Bazı</th>
                  <th className="py-3 px-4 text-right">Güncel Değer</th>
                  <th className="py-3 px-4 text-right">Temettü Geliri</th>
                  <th className="py-3 px-4 text-right">Brüt K/Z</th>
                  <th className="py-3 px-4 text-right">Stopaj (%)</th>
                  <th className="py-3 px-4 text-right">Net K/Z</th>
                  <th className="py-3 px-4 text-center">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {[...filteredStocks, ...filteredFunds].length > 0 ? (
                  [...filteredStocks, ...filteredFunds].map((pos) => {
                    const isPositive = pos.netKZ >= 0;
                    return (
                      <tr key={pos.sembol} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 flex items-center gap-2 font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                              pos.tip === "Hisse Senedi" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {pos.tip === "Hisse Senedi" ? "HİSSE" : "FON"}
                          </span>
                          {pos.sembol}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{pos.toplamMiktar.toLocaleString("tr-TR")}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">₺{pos.wap.toFixed(4)}</td>
                        <td className="py-3 px-4 text-right font-mono text-white">
                          <button
                            onClick={() => {
                              if (!onUpdatePrice) return;
                              const val = prompt(
                                `${pos.sembol} için yeni güncel piyasa fiyatını girin (₺):`,
                                pos.guncelFiyat.toString()
                              );
                              if (val !== null && !isNaN(parseFloat(val)) && parseFloat(val) >= 0) {
                                onUpdatePrice(pos.sembol, parseFloat(val));
                              }
                            }}
                            className="group flex items-center justify-end gap-1 font-bold text-amber-300 hover:text-amber-200 hover:underline w-full"
                            title="Fiyatı elle değiştirmek için tıklayın"
                          >
                            <span>₺{pos.guncelFiyat.toFixed(4)}</span>
                            <Edit3 className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          ₺{pos.toplamMaliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ₺{pos.guncelDeger.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {pos.toplamAlinanTemettu ? `+₺${pos.toplamAlinanTemettu.toLocaleString("tr-TR")}` : "—"}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${pos.brutKZ >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {pos.brutKZ >= 0 ? "+" : ""}₺{pos.brutKZ.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">%{pos.stopajOrani}</td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? "+" : ""}₺{pos.netKZ.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (%
                          {pos.netKZPct.toFixed(2)})
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onQuickSellStock(pos.sembol, pos.tip)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg transition"
                          >
                            Satış Yap
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-6 text-center text-slate-500 text-xs">
                      Arama kriterlerine uygun hisse veya fon bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fixed Income Section (Bono & Mevduat) */}
      {(activeCategory === "Tümü" || activeCategory === "Bono" || activeCategory === "Mevduat") && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>📄</span> Sabit Getirili Varlıklar - Bono & Mevduat ({filteredFixed.length})
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Ad / Banka</th>
                  <th className="py-3 px-4">Tür</th>
                  <th className="py-3 px-4 text-right">Anapara (₺)</th>
                  <th className="py-3 px-4 text-right">Yıllık Faiz (%)</th>
                  <th className="py-3 px-4 text-center">Başlangıç - Vade</th>
                  <th className="py-3 px-4 text-right">Kalan Gün</th>
                  <th className="py-3 px-4 text-right">Stopaj (%)</th>
                  <th className="py-3 px-4 text-right">Beklenen Net Getiri</th>
                  <th className="py-3 px-4 text-center">Durum / Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredFixed.length > 0 ? (
                  filteredFixed.map((rec) => {
                    const bas = new Date(rec.baslangicTarihi);
                    const vad = new Date(rec.vadeTarihi);
                    const today = new Date();
                    const kalanGun = Math.max(0, Math.round((vad.getTime() - today.getTime()) / (1000 * 3600 * 24)));
                    const toplamGun = Math.max(1, Math.round((vad.getTime() - bas.getTime()) / (1000 * 3600 * 24)));

                    const brut = rec.anapara * (rec.faizOrani / 100) * (toplamGun / 365);
                    const stopajT = brut * ((rec.stopajOrani || 17.5) / 100);
                    const netGetiri = brut - stopajT;

                    const isClosed = Boolean(rec.kapanisTarihi);

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white">{rec.ad}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                              rec.tip === "Bono" ? "bg-amber-500/20 text-amber-300" : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {rec.tip}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200">
                          ₺{rec.anapara.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">%{rec.faizOrani}</td>
                        <td className="py-3 px-4 text-center text-[11px] text-slate-400 font-mono">
                          {rec.baslangicTarihi} → {rec.vadeTarihi}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {isClosed ? (
                            <span className="text-slate-500">Kapandı</span>
                          ) : kalanGun === 0 ? (
                            <span className="text-amber-400 font-bold">Vadesi Doldu</span>
                          ) : (
                            <span className="text-emerald-300 font-bold">{kalanGun} gün</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">%{rec.stopajOrani}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          +₺{netGetiri.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isClosed ? (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {rec.kapanisTuru}: +₺{rec.gerceklesenNetKZ?.toLocaleString("tr-TR")}
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onQuickCloseFixedIncome(rec.id, true)}
                                className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30 transition"
                                title="Vade Sonu Otomatik Kapat"
                              >
                                Vade Sonu
                              </button>
                              <button
                                onClick={() => onQuickCloseFixedIncome(rec.id, false)}
                                className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 transition"
                                title="Erken Çıkış ile Kapat"
                              >
                                Erken Çıkış
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 text-xs">
                      Sabit getirili varlık kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
