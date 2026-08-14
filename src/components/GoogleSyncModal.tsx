import React, { useState } from "react";
import { Cloud, RefreshCw, UploadCloud, DownloadCloud, CheckCircle2, AlertCircle, ExternalLink, Key, Zap } from "lucide-react";
import { StockTransaction, FixedIncomeRecord, DividendRecord, SnapshotEntry } from "../types";
import { parseImportJSON } from "../utils/importParser";
import { pushToGoogleSheets } from "../utils/googleSyncService";

interface GoogleSyncModalProps {
  stockTransactions: StockTransaction[];
  fixedIncomeRecords: FixedIncomeRecord[];
  dividendRecords: DividendRecord[];
  onImportData: (
    data: {
      stockTransactions?: StockTransaction[];
      fixedIncomeRecords?: FixedIncomeRecord[];
      dividendRecords?: DividendRecord[];
      snapshots?: SnapshotEntry[];
    },
    mode?: "replace" | "merge"
  ) => void;
  onOpenScriptTab?: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  stockTransactions,
  fixedIncomeRecords,
  dividendRecords,
  onImportData,
  onOpenScriptTab
}) => {
  const [scriptUrl, setScriptUrl] = useState(() => {
    return localStorage.getItem("pt_gas_script_url") || "";
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem("pt_auto_sync") === "true";
  });

  const handleSaveUrl = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem("pt_gas_script_url", url.trim());
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    localStorage.setItem("pt_auto_sync", String(nextVal));
  };

  // Fetch data from Google Sheets via Apps Script Web App URL
  const handleFetchFromSheets = async () => {
    if (!scriptUrl.trim()) {
      setStatusMsg({ type: "error", text: "Lütfen önce Google Apps Script Web App URL adresinizi girin." });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "info", text: "Google Sheets tablonuzdan veriler çekiliyor..." });

    try {
      // Append ?api=json to request full JSON data
      const url = scriptUrl.includes("?") ? `${scriptUrl}&api=json` : `${scriptUrl}?api=json`;
      const response = await fetch(url);
      
      const contentType = response.headers.get("content-type") || "";
      let result: any = null;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error("Google Apps Script adresi JSON yerine HTML yanıtı döndürdü. Lütfen Google Apps Script editöründe 'Dağıt > Yeni Dağıtım' seçerek yeni bir sürüm yayınladığınızdan ve erişim izninin 'Herkes' olduğundan emin olun.");
        }
      }

      const parsed = parseImportJSON(result);

      if (parsed.summary.totalRecords > 0) {
        onImportData(
          {
            stockTransactions: parsed.stockTransactions.length > 0 ? parsed.stockTransactions : undefined,
            fixedIncomeRecords: parsed.fixedIncomeRecords.length > 0 ? parsed.fixedIncomeRecords : undefined,
            dividendRecords: parsed.dividendRecords.length > 0 ? parsed.dividendRecords : undefined,
            snapshots: parsed.snapshots.length > 0 ? parsed.snapshots : undefined
          },
          "replace"
        );

        setStatusMsg({
          type: "success",
          text: `Google Sheets'ten ${parsed.summary.totalRecords} kayıt başarıyla çekildi ve portföyünüze aktarıldı! (${new Date().toLocaleTimeString("tr-TR")})`
        });
      } else if (result && result.status === "SUCCESS") {
        setStatusMsg({
          type: "info",
          text: "Google Sheets bağlantısı başarılı ancak tablolarınızda henüz kayıtlı işlem bulunamadı. Lütfen tablonuza işlem ekleyin veya buradaki 'Verileri Google Sheets'e Gönder' butonunu kullanın."
        });
      } else {
        setStatusMsg({
          type: "info",
          text: "Google Sheets'ten yanıt alındı. Sayfada veri bulunuyorsa lütfen Google Apps Script kodunu güncelleyin."
        });
      }
    } catch (err: any) {
      console.error(err);
      let errorDetail = err.message || "";
      if (err.name === "TypeError" && (errorDetail === "Failed to fetch" || errorDetail.includes("fetch"))) {
        errorDetail = "Google Apps Script sunucusuna erişilemedi (CORS veya geçersiz URL). Lütfen Google Apps Script 'Dağıtım Ayarları' penceresinde 'Erişimi olanlar' kısmını 'Herkes' (Anyone) olarak seçtiğinizden emin olun.";
      }
      setStatusMsg({
        type: "error",
        text: `Bağlantı hatası: ${errorDetail}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Push local React data to Google Sheets
  const handlePushToSheets = async () => {
    if (!scriptUrl.trim()) {
      setStatusMsg({ type: "error", text: "Lütfen önce Google Apps Script Web App URL adresinizi girin." });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "info", text: "Yerel verileriniz Google Sheets tablonuza aktarılıyor..." });

    try {
      const result = await pushToGoogleSheets(scriptUrl, {
        action: "sync_full",
        stockTransactions,
        fixedIncomeRecords,
        dividendRecords
      });

      if (result.success) {
        setStatusMsg({
          type: "success",
          text: `Veriler Google Sheets tablonuza başarıyla gönderildi! (${new Date().toLocaleTimeString("tr-TR")})`
        });
      } else {
        setStatusMsg({
          type: "error",
          text: result.message
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: "error",
        text: `Aktarım esnasında hata oluştu: ${err?.message || "Bağlantı kurulamadı"}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Google Sheets Canlı Senkronizasyon (İki Yönlü Veri Motoru)
            </h2>
            <p className="text-xs text-slate-400">
              Bu ekran ile Google Tablonuz ile bu Web Uygulaması arasında anlık veri alışverişi yapabilirsiniz.
            </p>
          </div>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Canlı API Destekli
        </span>
      </div>

      {/* Input URL Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Google Apps Script Web App URL Adresiniz:
          </label>
          {onOpenScriptTab && (
            <button
              onClick={onOpenScriptTab}
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold underline flex items-center gap-1"
            >
              📄 Kod Henüz Yok mu? Apps Script Kodunu Al
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => handleSaveUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            onClick={() => handleSaveUrl(scriptUrl)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-semibold border border-slate-700 transition"
          >
            Kaydet
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          * Google Apps Script'te <b>Dağıt &gt; Yeni Dağıtım</b> yaptıktan sonra aldığınız <code>/exec</code> ile biten web adresi.
        </p>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMsg.type === "success"
              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
              : statusMsg.type === "error"
              ? "bg-rose-950/60 border-rose-800/80 text-rose-300"
              : "bg-blue-950/60 border-blue-800/80 text-blue-300"
          }`}
        >
          {statusMsg.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
          {statusMsg.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          {statusMsg.type === "info" && <RefreshCw className="w-4 h-4 shrink-0 text-blue-400 animate-spin" />}
          <span className="flex-1 font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          onClick={handleFetchFromSheets}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
        >
          <DownloadCloud className="w-4 h-4" />
          {loading ? "Veriler Çekiliyor..." : "1. Google Sheets'ten Verileri Yükle / Çek"}
        </button>

        <button
          onClick={handlePushToSheets}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
        >
          <UploadCloud className="w-4 h-4" />
          {loading ? "Veriler Gönderiliyor..." : "2. Mevcut Verileri Google Sheets'e Gönder"}
        </button>
      </div>

      {/* Auto Sync Toggle */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-200 block">Yeni İşlemlerde Otomatik Google Sheets Eşitleme</span>
          <p className="text-[11px] text-slate-400">
            Açık olduğunda, bu ekrandan yeni alım/satım işlemi eklediğinizde işlem otomatik olarak Google Sheets tablonuza yazılır.
          </p>
        </div>
        <button
          onClick={handleToggleAutoSync}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoSync ? "bg-emerald-600" : "bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoSync ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Architecture Explanation */}
      <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
          🔄 İki Yönlü Eşitleme Nasıl Çalışır?
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
          <li>
            <b>Google Sheets &rarr; Web Uygulaması:</b> Tablonuzdaki hisse, fon, bono ve mevduat verilerini okur ve bu uygulamaya aktarır.
          </li>
          <li>
            <b>Web Uygulaması &rarr; Google Sheets:</b> Bu uygulamada gerçekleştirdiğiniz alım/satım veya mevduat işlemlerini doğrudan Google Sheets tablonuzun ilgili sayfasına yazar.
          </li>
          <li>
            <b>Gizlilik:</b> Tüm iletişim doğrudan tarayıcınız ile Google hesabınız arasında gerçekleşir.
          </li>
        </ul>
      </div>
    </div>
  );
};
