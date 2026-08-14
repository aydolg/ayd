import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SummaryCards } from "./components/SummaryCards";
import { AllocationChart } from "./components/AllocationChart";
import { AssetTable } from "./components/AssetTable";
import { TransactionForm } from "./components/TransactionForm";
import { AIAdvisor } from "./components/AIAdvisor";
import { RecommendationsView } from "./components/RecommendationsView";
import { ScriptCodeExportModal } from "./components/ScriptCodeExportModal";
import { GoogleSyncModal } from "./components/GoogleSyncModal";
import { ResetConfirmModal } from "./components/ResetConfirmModal";
import { JSONImportModal } from "./components/JSONImportModal";
import { autoSyncIfEnabled } from "./utils/googleSyncService";

import {
  initialStockTransactions,
  initialFixedIncomeRecords,
  initialDividendRecords,
  mockCurrentMarketPrices,
  initialSnapshots
} from "./data/mockData";

import {
  StockTransaction,
  FixedIncomeRecord,
  DividendRecord,
  SnapshotEntry
} from "./types";

import {
  buildPortfolioSummary,
  calculateStockPositions
} from "./utils/calculations";

export default function App() {
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem("pt_stock_transactions");
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    const isInitialized = localStorage.getItem("pt_initialized");
    if (isInitialized) return [];
    return initialStockTransactions;
  });

  const [fixedIncomeRecords, setFixedIncomeRecords] = useState<FixedIncomeRecord[]>(() => {
    const saved = localStorage.getItem("pt_fixed_income");
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    const isInitialized = localStorage.getItem("pt_initialized");
    if (isInitialized) return [];
    return initialFixedIncomeRecords;
  });

  const [dividendRecords, setDividendRecords] = useState<DividendRecord[]>(() => {
    const saved = localStorage.getItem("pt_dividend_records");
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    const isInitialized = localStorage.getItem("pt_initialized");
    if (isInitialized) return [];
    return initialDividendRecords;
  });

  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("pt_market_prices");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return mockCurrentMarketPrices;
  });
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>(() => {
    const saved = localStorage.getItem("pt_snapshots");
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    const isInitialized = localStorage.getItem("pt_initialized");
    if (isInitialized) return [];
    return initialSnapshots;
  });

  const [activeTab, setActiveTab] = useState<"ozet" | "islem" | "detay" | "ai" | "oneriler" | "script" | "sync">("ozet");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("pt_stock_transactions", JSON.stringify(stockTransactions));
  }, [stockTransactions]);

  useEffect(() => {
    localStorage.setItem("pt_fixed_income", JSON.stringify(fixedIncomeRecords));
  }, [fixedIncomeRecords]);

  useEffect(() => {
    localStorage.setItem("pt_dividend_records", JSON.stringify(dividendRecords));
  }, [dividendRecords]);

  useEffect(() => {
    localStorage.setItem("pt_snapshots", JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem("pt_market_prices", JSON.stringify(marketPrices));
  }, [marketPrices]);

  const handleImportData = (
    data: {
      stockTransactions?: StockTransaction[];
      fixedIncomeRecords?: FixedIncomeRecord[];
      dividendRecords?: DividendRecord[];
      snapshots?: SnapshotEntry[];
    },
    mode: "replace" | "merge" = "replace"
  ) => {
    let count = 0;

    if (mode === "replace") {
      if (data.stockTransactions && Array.isArray(data.stockTransactions)) {
        setStockTransactions(data.stockTransactions);
        count += data.stockTransactions.length;
      }
      if (data.fixedIncomeRecords && Array.isArray(data.fixedIncomeRecords)) {
        setFixedIncomeRecords(data.fixedIncomeRecords);
        count += data.fixedIncomeRecords.length;
      }
      if (data.dividendRecords && Array.isArray(data.dividendRecords)) {
        setDividendRecords(data.dividendRecords);
        count += data.dividendRecords.length;
      }
      if (data.snapshots && Array.isArray(data.snapshots)) {
        setSnapshots(data.snapshots);
      }
    } else {
      // Merge mode
      if (data.stockTransactions && Array.isArray(data.stockTransactions)) {
        setStockTransactions((prev) => [...data.stockTransactions!, ...prev]);
        count += data.stockTransactions.length;
      }
      if (data.fixedIncomeRecords && Array.isArray(data.fixedIncomeRecords)) {
        setFixedIncomeRecords((prev) => [...data.fixedIncomeRecords!, ...prev]);
        count += data.fixedIncomeRecords.length;
      }
      if (data.dividendRecords && Array.isArray(data.dividendRecords)) {
        setDividendRecords((prev) => [...data.dividendRecords!, ...prev]);
        count += data.dividendRecords.length;
      }
      if (data.snapshots && Array.isArray(data.snapshots)) {
        setSnapshots((prev) => [...data.snapshots!, ...prev]);
      }
    }

    localStorage.setItem("pt_initialized", "true");

    setResetSuccessMessage(
      `Geri yükleme başarılı! (${count} toplam işlem kaydı portföyünüze aktarıldı - Mod: ${
        mode === "replace" ? "Sıfırla ve Yükle" : "Birleştir"
      })`
    );
    setTimeout(() => setResetSuccessMessage(null), 6000);
  };

  const handleRefreshLivePrices = async () => {
    setIsRefreshingPrices(true);
    try {
      const activeSymbols = Array.from(
        new Set(stockTransactions.map((tx) => tx.sembol.toUpperCase()))
      );
      const queryParam = activeSymbols.length > 0 ? `?symbols=${activeSymbols.join(",")}` : "";
      const res = await fetch(`/api/market/quotes${queryParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.quotes) {
        setMarketPrices((prev) => ({ ...prev, ...data.quotes }));
      }
    } catch (err) {
      console.warn("Market quotes fetch warning:", err);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  // Auto fetch live market prices on load
  useEffect(() => {
    handleRefreshLivePrices();
  }, []);

  const handleUpdateSinglePrice = (sembol: string, newPrice: number) => {
    setMarketPrices((prev) => ({
      ...prev,
      [sembol.toUpperCase()]: newPrice
    }));
  };

  const summary = buildPortfolioSummary(
    stockTransactions,
    fixedIncomeRecords,
    dividendRecords,
    marketPrices,
    snapshots
  );

  const stockCalc = calculateStockPositions(stockTransactions, dividendRecords, marketPrices, "Hisse Senedi");
  const fundCalc = calculateStockPositions(stockTransactions, dividendRecords, marketPrices, "Fon");

  const handleAddStockTransaction = (tx: StockTransaction) => {
    setStockTransactions((prev) => [tx, ...prev]);
    autoSyncIfEnabled({ action: "add_transaction", transaction: tx });
  };

  const handleAddFixedIncomeRecord = (rec: FixedIncomeRecord) => {
    setFixedIncomeRecords((prev) => [rec, ...prev]);
    autoSyncIfEnabled({ action: "add_fixed_income", fixedIncome: rec });
  };

  const handleAddDividendRecord = (div: DividendRecord) => {
    setDividendRecords((prev) => [div, ...prev]);
    autoSyncIfEnabled({ action: "add_dividend", dividend: div });
  };

  const handleQuickSellStock = (sembol: string, tip: "Hisse Senedi" | "Fon") => {
    const currentPos = [...stockCalc.positions, ...fundCalc.positions].find(
      (p) => p.sembol === sembol && p.tip === tip
    );

    if (!currentPos) return;

    const sellAdet = prompt(`${sembol} satmak istediğiniz miktarı girin (Max: ${currentPos.toplamMiktar}):`, String(currentPos.toplamMiktar));
    if (!sellAdet) return;

    const numAdet = parseFloat(sellAdet);
    if (isNaN(numAdet) || numAdet <= 0 || numAdet > currentPos.toplamMiktar) {
      alert("Geçersiz miktar girildi.");
      return;
    }

    const sellFiyat = prompt(`${sembol} birim satış fiyatını girin (₺):`, String(currentPos.guncelFiyat));
    if (!sellFiyat) return;

    const numFiyat = parseFloat(sellFiyat);
    if (isNaN(numFiyat) || numFiyat <= 0) {
      alert("Geçersiz fiyat.");
      return;
    }

    const newTx: StockTransaction = {
      id: `st-${Date.now()}`,
      tarih: new Date().toISOString().split("T")[0],
      tip,
      sembol,
      islem: "Sat",
      miktar: numAdet,
      fiyat: numFiyat,
      stopajOrani: currentPos.stopajOrani
    };

    setStockTransactions((prev) => [newTx, ...prev]);
    autoSyncIfEnabled({ action: "add_transaction", transaction: newTx });
  };

  const handleQuickCloseFixedIncome = (recordId: string, isVadeSonu: boolean) => {
    const rec = fixedIncomeRecords.find((r) => r.id === recordId);
    if (!rec) return;

    const bas = new Date(rec.baslangicTarihi);
    const vad = new Date(rec.vadeTarihi);
    const today = new Date();
    const totalDays = Math.max(1, Math.round((vad.getTime() - bas.getTime()) / (1000 * 3600 * 24)));

    const brut = rec.anapara * (rec.faizOrani / 100) * (totalDays / 365);
    const stopaj = brut * ((rec.stopajOrani || 17.5) / 100);
    const netGetiri = brut - stopaj;

    setFixedIncomeRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            kapanisTarihi: today.toISOString().split("T")[0],
            kapanisTuru: isVadeSonu ? "Vade Sonu" : "Erken Çıkış",
            gerceklesenNetKZ: netGetiri
          };
        }
        return r;
      })
    );
  };

  const handleExportJSON = () => {
    const backupData = {
      stockTransactions,
      fixedIncomeRecords,
      dividendRecords,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfoy_yedek_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const executeResetAllData = () => {
    localStorage.setItem("pt_initialized", "true");
    localStorage.setItem("pt_stock_transactions", JSON.stringify([]));
    localStorage.setItem("pt_fixed_income", JSON.stringify([]));
    localStorage.setItem("pt_dividend_records", JSON.stringify([]));
    localStorage.setItem("pt_snapshots", JSON.stringify([]));

    setStockTransactions([]);
    setFixedIncomeRecords([]);
    setDividendRecords([]);
    setSnapshots([]);

    setIsResetModalOpen(false);
    setResetSuccessMessage("Tüm portföy verileri ve varlıklar kalıcı olarak silindi ve sıfırlandı.");

    setTimeout(() => setResetSuccessMessage(null), 5000);
  };

  const activeStockPositionsList = [...stockCalc.positions, ...fundCalc.positions].map((p) => ({
    sembol: p.sembol,
    netAdet: p.toplamMiktar,
    wap: p.wap
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportJSON={handleExportJSON}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onClearAllData={() => setIsResetModalOpen(true)}
      />

      <JSONImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={handleImportData}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={executeResetAllData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {resetSuccessMessage && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
            <span>{resetSuccessMessage}</span>
            <button
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}
        {activeTab === "ozet" && (
          <div className="space-y-6 animate-fade-in">
            <SummaryCards summary={summary} />
            <AllocationChart summary={summary} />
            <AssetTable
              stockPositions={stockCalc.positions}
              fundPositions={fundCalc.positions}
              fixedIncomeRecords={fixedIncomeRecords}
              onQuickSellStock={handleQuickSellStock}
              onQuickCloseFixedIncome={handleQuickCloseFixedIncome}
              onUpdatePrice={handleUpdateSinglePrice}
              onRefreshPrices={handleRefreshLivePrices}
              isRefreshingPrices={isRefreshingPrices}
            />
          </div>
        )}

        {activeTab === "islem" && (
          <div className="animate-fade-in">
            <TransactionForm
              onAddStockTransaction={handleAddStockTransaction}
              onAddFixedIncomeRecord={handleAddFixedIncomeRecord}
              onAddDividendRecord={handleAddDividendRecord}
              activeStockPositions={activeStockPositionsList}
            />
          </div>
        )}

        {activeTab === "detay" && (
          <div className="animate-fade-in">
            <AssetTable
              stockPositions={stockCalc.positions}
              fundPositions={fundCalc.positions}
              fixedIncomeRecords={fixedIncomeRecords}
              onQuickSellStock={handleQuickSellStock}
              onQuickCloseFixedIncome={handleQuickCloseFixedIncome}
              onUpdatePrice={handleUpdateSinglePrice}
              onRefreshPrices={handleRefreshLivePrices}
              isRefreshingPrices={isRefreshingPrices}
            />
          </div>
        )}

        {activeTab === "ai" && (
          <div className="animate-fade-in">
            <AIAdvisor
              summary={summary}
              stockPositions={stockCalc.positions}
              fundPositions={fundCalc.positions}
            />
          </div>
        )}

        {activeTab === "oneriler" && (
          <div className="animate-fade-in">
            <RecommendationsView />
          </div>
        )}

        {activeTab === "sync" && (
          <div className="animate-fade-in">
            <GoogleSyncModal
              stockTransactions={stockTransactions}
              fixedIncomeRecords={fixedIncomeRecords}
              dividendRecords={dividendRecords}
              onImportData={handleImportData}
              onOpenScriptTab={() => setActiveTab("script")}
            />
          </div>
        )}

        {activeTab === "script" && (
          <div className="animate-fade-in">
            <ScriptCodeExportModal />
          </div>
        )}
      </main>
    </div>
  );
}

