import React, { useState } from "react";
import { PortfolioSummary, StockPosition } from "../types";
import { Sparkles, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, Zap, TrendingUp } from "lucide-react";

interface AIAdvisorProps {
  summary: PortfolioSummary;
  stockPositions: StockPosition[];
  fundPositions: StockPosition[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ summary, stockPositions, fundPositions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const allPositions = [...stockPositions, ...fundPositions];
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryData: summary,
          positions: allPositions
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Sunucudan beklenmeyen yanıt alındı (${res.status}): ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Sunucu hatası oluştu.");
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError("Sunucuya erişilemedi (Ağ hatası). Lütfen bağlantınızı kontrol edin.");
      } else {
        setError(err.message || "Yapay zeka analizi alınamadı.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-xl">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Gemini AI Portföy Danışmanı & Risk Analisti
            </h2>
            <p className="text-xs text-slate-400">
              Varlık dağılımı, stopaj verimliliği ve vade merdiveniniz yapay zeka ile taranır.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Portföy Analiz Ediliyor...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Yapay Zeka Analizini Başlat
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          {error}
        </div>
      )}

      {analysis ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Gemini AI Değerlendirme Raporu
          </div>
          <div>{analysis}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <TrendingUp className="w-4 h-4" />
              Çeşitlendirme Taraması
            </div>
            <p className="text-slate-400">
              Hisse, fon, bono ve mevduat oranlarınızın riske karşı koruma sağlayıp sağlamadığını kontrol eder.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              Stopaj Optimizasyonu
            </div>
            <p className="text-slate-400">
              Mevduat ve fon stopaj oranlarınızı (örn. %0-%17.5) göz önünde bulundurarak net getiri kaybını azaltma önerisi sunar.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4" />
              Stratejik Adımlar
            </div>
            <p className="text-slate-400">
              Vade merdiveni (maturity ladder) ve enflasyona karşı koruma sağlayan somut 3 aksiyon adımı üretir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
