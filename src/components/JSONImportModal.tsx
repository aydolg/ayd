import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, RefreshCw, Database, Layers } from "lucide-react";
import { parseImportJSON, ParsedImportResult } from "../utils/importParser";
import { StockTransaction, FixedIncomeRecord, DividendRecord, SnapshotEntry } from "../types";

interface JSONImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (
    data: {
      stockTransactions?: StockTransaction[];
      fixedIncomeRecords?: FixedIncomeRecord[];
      dividendRecords?: DividendRecord[];
      snapshots?: SnapshotEntry[];
    },
    mode: "replace" | "merge"
  ) => void;
}

export const JSONImportModal: React.FC<JSONImportModalProps> = ({
  isOpen,
  onClose,
  onImportData
}) => {
  const [jsonText, setJsonText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessRawContent = (content: string, name?: string) => {
    setParseError(null);
    if (!content.trim()) {
      setParsedData(null);
      return;
    }

    try {
      const json = JSON.parse(content);
      const result = parseImportJSON(json);

      if (result.summary.totalRecords === 0 && result.summary.snapshotsCount === 0) {
        setParseError("JSON dosyası ayrıştırıldı fakat içinde geçerli hisse, fon, mevduat veya temettü kaydı bulunamadı.");
        setParsedData(null);
      } else {
        setParsedData(result);
        if (name) setFileName(name);
      }
    } catch (err: any) {
      setParseError("Geçersiz JSON formatı! Lütfen dosya içeriğinin doğru bir JSON yapısına sahip olduğundan emin olun.");
      setParsedData(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      handleProcessRawContent(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    setFileName(null);
    handleProcessRawContent(text);
  };

  const handleExecuteImport = () => {
    if (!parsedData) return;

    onImportData(
      {
        stockTransactions: parsedData.stockTransactions,
        fixedIncomeRecords: parsedData.fixedIncomeRecords,
        dividendRecords: parsedData.dividendRecords,
        snapshots: parsedData.snapshots
      },
      importMode
    );

    // Reset and close
    setJsonText("");
    setParsedData(null);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 text-blue-400 p-2.5 rounded-xl border border-blue-500/30">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">JSON Yedek Dosyasını Geri Yükle</h3>
              <p className="text-xs text-slate-400">
                Portföy yedek dosyanızı seçin veya metin olarak yapıştırın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 hover:bg-slate-950/90 rounded-xl p-5 text-center cursor-pointer transition group"
          >
            <Upload className="w-8 h-8 text-blue-400 group-hover:scale-110 transition mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {fileName ? `Seçilen Dosya: ${fileName}` : "JSON Dosyası Seçmek İçin Tıklayın"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              (.json uzantılı yedek dosyasını bilgisayarınızdan sürükleyip bırakabilirsiniz)
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="bg-slate-900 px-3 text-slate-500">veya metin yapıştırın</span>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={handleTextChange}
            placeholder='{"stockTransactions": [...], "fixedIncomeRecords": [...]}'
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Error State */}
        {parseError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed Preview */}
        {parsedData && (
          <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ayrıştırma Başarılı: Toplam {parsedData.summary.totalRecords} İşlem / Kayıt Bulundu
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Hisse / Fon</span>
                <span className="text-sm font-bold text-sky-400">{parsedData.summary.stocksCount} Kayıt</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Mevduat / Bono</span>
                <span className="text-sm font-bold text-amber-400">{parsedData.summary.fixedIncomeCount} Kayıt</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Temettü</span>
                <span className="text-sm font-bold text-purple-400">{parsedData.summary.dividendCount} Kayıt</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Snapshot</span>
                <span className="text-sm font-bold text-emerald-400">{parsedData.summary.snapshotsCount} Kayıt</span>
              </div>
            </div>

            {/* Import Mode Options */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Yükleme Modunu Seçin:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setImportMode("replace")}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                    importMode === "replace"
                      ? "bg-blue-600/20 border-blue-500 text-white font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <Database className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="block text-xs">Sıfırla ve Yükle (Üstüne Yaz)</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Mevcut verileri temizler, yedekteki verileri koyar.</span>
                  </div>
                </label>

                <label
                  onClick={() => setImportMode("merge")}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                    importMode === "merge"
                      ? "bg-emerald-600/20 border-emerald-500 text-white font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-xs">Birleştir (Mevcut Verilere Ekle)</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Mevcut portföyünüzü korur, yeni kayıtları ekler.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            İptal
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={!parsedData}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-40 transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Portföye Geri Yükle
          </button>
        </div>
      </div>
    </div>
  );
};
