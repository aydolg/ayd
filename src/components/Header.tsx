import React, { useRef } from "react";
import { TrendingUp, PlusCircle, PieChart, Sparkles, FileCode, HelpCircle, Download, Upload, Cloud, Trash2 } from "lucide-react";

interface HeaderProps {
  activeTab: "ozet" | "islem" | "detay" | "ai" | "oneriler" | "script" | "sync";
  setActiveTab: (tab: "ozet" | "islem" | "detay" | "ai" | "oneriler" | "script" | "sync") => void;
  onExportJSON: () => void;
  onOpenImportModal: () => void;
  onClearAllData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onExportJSON, onOpenImportModal, onClearAllData }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("ozet")}>
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-white flex items-center gap-2">
                Portföy Takip <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">v6.5 Pro</span>
              </h1>
              <p className="text-xs text-slate-400">Google Apps Script & Web Entegrasyonlu Finans Motoru</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("sync")}
              className="flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition font-medium"
              title="Google Sheets Eşitleme Paneli"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              Google Sheets Eşitle
            </button>

            <button
              onClick={onExportJSON}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Portföy Verisini İndir / Yedeğini Al"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Yedekle
            </button>

            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg border border-blue-500/30 transition font-medium"
              title="Yedeklenen JSON Dosyasını Geri Yükle"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              JSON Geri Yükle
            </button>

            {onClearAllData && (
              <button
                onClick={onClearAllData}
                className="flex items-center gap-1.5 text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-800/60 transition"
                title="Tüm Portföy Verilerini Temizle"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Verileri Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar pt-1 pb-2">
          <button
            onClick={() => setActiveTab("ozet")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "ozet"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Özet & Grafikler
          </button>

          <button
            onClick={() => setActiveTab("islem")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "islem"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Yeni İşlem Ekle
          </button>

          <button
            onClick={() => setActiveTab("detay")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "detay"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Varlık Detayları
          </button>

          <button
            onClick={() => setActiveTab("sync")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "sync"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-300" />
            Google Sheets Eşitleme
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "ai"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            AI Analiz & Danışman
          </button>

          <button
            onClick={() => setActiveTab("oneriler")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "oneriler"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-purple-300" />
            Geliştirme Önerileri
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all border ${
              activeTab === "script"
                ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-300" />
            Apps Script Kodu
          </button>
        </nav>
      </div>
    </header>
  );
};
