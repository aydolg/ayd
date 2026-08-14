import React, { useState } from "react";
import { StockTransaction, FixedIncomeRecord, DividendRecord } from "../types";
import { PlusCircle, CheckCircle } from "lucide-react";

interface TransactionFormProps {
  onAddStockTransaction: (tx: StockTransaction) => void;
  onAddFixedIncomeRecord: (rec: FixedIncomeRecord) => void;
  onAddDividendRecord: (div: DividendRecord) => void;
  activeStockPositions: { sembol: string; netAdet: number; wap: number }[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddStockTransaction,
  onAddFixedIncomeRecord,
  onAddDividendRecord,
  activeStockPositions
}) => {
  const [assetCategory, setAssetCategory] = useState<"Hisse Senedi" | "Fon" | "Bono" | "Mevduat" | "Temettü">("Hisse Senedi");
  const [stockAction, setStockAction] = useState<"Al" | "Sat">("Al");

  // Stock / Fund form state
  const [sembol, setSembol] = useState("THYAO");
  const [miktar, setMiktar] = useState<number | "">(100);
  const [fiyat, setFiyat] = useState<number | "">(320.0);
  const [stopajOrani, setStopajOrani] = useState<number>(0);
  const [tarih, setTarih] = useState<string>(new Date().toISOString().split("T")[0]);

  // Dividend form state
  const [divSembol, setDivSembol] = useState("THYAO");
  const [hisseBasinaNet, setHisseBasinaNet] = useState<number | "">(6.25);
  const [toplamNetTemettu, setToplamNetTemettu] = useState<number | "">(2500);

  // Fixed Income form state
  const [ad, setAd] = useState("İş Bankası 32 Gün Vadeli");
  const [anapara, setAnapara] = useState<number | "">(100000);
  const [faizOrani, setFaizOrani] = useState<number | "">(48.5);
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vadeTarihi, setVadeTarihi] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [fixedStopaj, setFixedStopaj] = useState<number>(17.5);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live calculation helpers
  const numMiktar = typeof miktar === "number" ? miktar : 0;
  const numFiyat = typeof fiyat === "number" ? fiyat : 0;
  const totalMaliyet = numMiktar * numFiyat;

  const numAnapara = typeof anapara === "number" ? anapara : 0;
  const numFaiz = typeof faizOrani === "number" ? faizOrani : 0;

  const daysDiff = Math.max(
    1,
    Math.round(
      (new Date(vadeTarihi).getTime() - new Date(baslangicTarihi).getTime()) / (1000 * 3600 * 24)
    )
  );

  const brutGetiri = numAnapara * (numFaiz / 100) * (daysDiff / 365);
  const stopajTutar = brutGetiri * (fixedStopaj / 100);
  const netGetiri = brutGetiri - stopajTutar;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (assetCategory === "Temettü") {
      const netTutar = typeof toplamNetTemettu === "number" ? toplamNetTemettu : 0;
      if (!divSembol || netTutar <= 0) return;

      onAddDividendRecord({
        id: `div-${Date.now()}`,
        tarih,
        sembol: divSembol.toUpperCase().trim(),
        hisseBasinaNetTemettu: typeof hisseBasinaNet === "number" ? hisseBasinaNet : 0,
        toplamNetTemettu: netTutar
      });

      setToastMsg(`${divSembol.toUpperCase()} ₺${netTutar.toLocaleString("tr-TR")} Temettü kaydı eklendi!`);
    } else if (assetCategory === "Hisse Senedi" || assetCategory === "Fon") {
      if (!sembol || numMiktar <= 0 || numFiyat <= 0) return;

      onAddStockTransaction({
        id: `st-${Date.now()}`,
        tarih,
        tip: assetCategory,
        sembol: sembol.toUpperCase().trim(),
        islem: stockAction,
        miktar: numMiktar,
        fiyat: numFiyat,
        stopajOrani
      });

      setToastMsg(`${sembol.toUpperCase()} ${stockAction} işlemi başarıyla eklendi!`);
    } else {
      if (!ad || numAnapara <= 0 || numFaiz <= 0) return;

      onAddFixedIncomeRecord({
        id: `fi-${Date.now()}`,
        tip: assetCategory,
        ad: ad.trim(),
        anapara: numAnapara,
        faizOrani: numFaiz,
        baslangicTarihi,
        vadeTarihi,
        stopajOrani: fixedStopaj
      });

      setToastMsg(`${ad} (${assetCategory}) kaydı başarıyla eklendi!`);
    }

    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Category selector buttons */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Varlık Türü / İşlem Seçin
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: "Hisse Senedi", label: "Hisse", icon: "📈" },
            { id: "Fon", label: "Fon", icon: "🏦" },
            { id: "Bono", label: "Bono", icon: "📄" },
            { id: "Mevduat", label: "Mevduat", icon: "🏛️" },
            { id: "Temettü", label: "Temettü", icon: "💸" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAssetCategory(item.id as any)}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border font-bold text-xs transition-all ${
                assetCategory === item.id
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                  : "bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {assetCategory === "Temettü" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Hisse Sembolü</label>
              <input
                type="text"
                value={divSembol}
                onChange={(e) => setDivSembol(e.target.value)}
                placeholder="Örn: THYAO, GARAN..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ödeme Tarihi</label>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Hisse Başına Net Temettü (₺)</label>
              <input
                type="number"
                step="0.0001"
                value={hisseBasinaNet}
                onChange={(e) => setHisseBasinaNet(e.target.value ? Number(e.target.value) : "")}
                placeholder="6.25"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Hesaba Yatan Toplam Net Temettü (₺)</label>
              <input
                type="number"
                step="0.01"
                value={toplamNetTemettu}
                onChange={(e) => setToplamNetTemettu(e.target.value ? Number(e.target.value) : "")}
                placeholder="2500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold text-emerald-400"
                required
              />
            </div>
          </div>
        )}

        {(assetCategory === "Hisse Senedi" || assetCategory === "Fon") && (
          <>
            {/* Al / Sat Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full sm:w-64">
              <button
                type="button"
                onClick={() => setStockAction("Al")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stockAction === "Al" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Alış (Yeni Pozisyon)
              </button>
              <button
                type="button"
                onClick={() => setStockAction("Sat")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stockAction === "Sat" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Satış (Kapatma)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sembol / Ad</label>
                <input
                  type="text"
                  value={sembol}
                  onChange={(e) => setSembol(e.target.value)}
                  placeholder="Örn: THYAO, GARAN, TI2..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">İşlem Tarihi</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Miktar (Adet)</label>
                <input
                  type="number"
                  step="any"
                  value={miktar}
                  onChange={(e) => setMiktar(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Birim Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={fiyat}
                  onChange={(e) => setFiyat(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Stopaj Oranı (% {assetCategory === "Fon" ? "örn: Fon Türüne Göre 0, 7.5 veya 10" : "Hisselerde Genellikle %0"})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={stopajOrani}
                  onChange={(e) => setStopajOrani(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Toplam İşlem Tutarı:</span>
                <span className="font-bold text-white font-mono text-sm">
                  ₺{totalMaliyet.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {stockAction === "Al"
                  ? "Ağırlıklı Ortalama Maliyet (WAP) otomatik olarak yeniden hesaplanacak."
                  : "Gerçekleşen net Kar/Zarar stopaj düşüldükten sonra portföy özetine yansıyacak."}
              </p>
            </div>
          </>
        )}

        {(assetCategory === "Bono" || assetCategory === "Mevduat") && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ad / Banka / Enstrüman Adı</label>
                <input
                  type="text"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder="Örn: Garanti BBVA 92 Gün Vadeli, TRT260126... "
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Anapara (₺)</label>
                <input
                  type="number"
                  step="any"
                  value={anapara}
                  onChange={(e) => setAnapara(e.target.value ? Number(e.target.value) : "")}
                  placeholder="100000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Yıllık Faiz Oranı (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={faizOrani}
                  onChange={(e) => setFaizOrani(e.target.value ? Number(e.target.value) : "")}
                  placeholder="48.5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-emerald-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Vade Tarihi</label>
                <input
                  type="date"
                  value={vadeTarihi}
                  onChange={(e) => setVadeTarihi(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Stopaj Oranı (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fixedStopaj}
                  onChange={(e) => setFixedStopaj(Number(e.target.value))}
                  placeholder="17.5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-amber-300"
                />
              </div>
            </div>

            {/* Sabit Getiri Hesaplama Onizleme */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Vade Süresi:</span>
                <span className="font-bold text-white font-mono">{daysDiff} Gün</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Brüt Faiz Getirisi:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  ₺{brutGetiri.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Stopaj Kesintisi (%{fixedStopaj}):</span>
                <span className="font-semibold text-amber-400 font-mono">
                  -₺{stopajTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 font-bold text-sm">
                <span className="text-slate-200">Tahmini Net Getiri:</span>
                <span className="text-emerald-400 font-mono">
                  +₺{netGetiri.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (%
                  {numAnapara > 0 ? ((netGetiri / numAnapara) * 100).toFixed(2) : 0})
                </span>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          İşlemi Kaydet ve Hesapla
        </button>
      </form>
    </div>
  );
};

