import React from "react";
import { HelpCircle, CheckCircle2, Code2, Zap, ShieldCheck, ArrowRight, Lightbulb, TrendingUp, DollarSign, Bell } from "lucide-react";

export const RecommendationsView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/80 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="bg-purple-500/20 border border-purple-500/40 p-3 rounded-2xl shrink-0">
            <Lightbulb className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">
              Portföy Takip Sistemi v6.1 - Detaylı Geliştirme ve Mimari Önerileri Raporu
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Paylaştığınız Google Apps Script kod yapısı (v6.1) detaylıca incelenmiştir. Kodunuz Modified Dietz yöntemi, erken çıkış stopaj hesapları ve otomatik e-posta raporlaması ile harika bir temele sahiptir. Aşağıda uygulayabileceğiniz ileri seviye kod, finansal ve mimari iyileştirmeler özetlenmiştir.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation Category 1: Code & Performance Optimizations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm border-b border-slate-800 pb-3">
          <Code2 className="w-5 h-5" />
          1. Apps Script Kod & Performans İyileştirmeleri (Performans & Hız)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Batch Formula & Array İşlemleri
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Mevcut kodda her satır eklendiğinde tek tek <code className="text-blue-300 font-mono">setFormula</code> çağrılıyor. Portföy büyüdükçe Apps Script çalıştırma süresi uzayabilir.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300/90">
              Öneri: Tek satır eklemek yerine <code className="text-emerald-300">setFormulasR1C1()</code> kullanarak formülleri toplu yazdırabilirsiniz.
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Canlı TEFAS & GOOGLEFINANCE Hata Koruması
            </h4>
            <p className="text-slate-300 leading-relaxed">
              TEFAS veya Google Finance verileri bazen borsa kapanış saatlerinde boş dönebilir. Bu durum K/Z hesaplamalarında <code className="text-rose-300 font-mono">#N/A</code> hatasına yol açar.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300/90">
              Formül içi koruma: <code className="text-blue-300">=IFERROR(GOOGLEFINANCE(...); ÖNCEKİ_SON_FİYAT)</code>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Category 2: Financial Capabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5" />
          2. Finansal & Hesaplama Yetenek İyileştirmeleri (İleri Finans)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>💵</span> Dolar / Euro Bazlı Getiri Analizi
            </div>
            <p className="text-slate-300 leading-relaxed">
              TL bazlı karlar enflasyon ortamında yanıltıcı olabilir. Her işlemin yapıldığı günkü TCMB Dolar kuru kaydedilerek Dolar bazlı maliyet ve getiri takip edilebilir.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>🎁</span> Temettü (Nakit Kar Payı) Modülü
            </div>
            <p className="text-slate-300 leading-relaxed">
              Hisse senetlerinin ödediği net temettülerin WAP maliyetinden düşülmesi veya portföye nakit akışı olarak eklenmesi net hisse verimini (Dividend Yield) ortaya çıkarır.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>🏆</span> BIST100 & Enflasyon Benchmarkı
            </div>
            <p className="text-slate-300 leading-relaxed">
              Portföyünüzün aynı dönemde BIST 100 endeksi (XU100) veya Mevduat/Enflasyon karşısındaki reel performansını (Alpha / Göreli Getiri) ölçümleyin.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation Category 3: UX & Automation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-3">
          <Bell className="w-5 h-5" />
          3. Otomasyon & Mobil Deneyim Önerileri
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>📱</span> Telegram Botu İle İşlem Kaydı & Raporlama
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Google Apps Script Webhook sayesinde Telegram botuna <code className="text-amber-300 font-mono">/al THYAO 100 315</code> yazarak anında telefondan işlem kaydı girebilir ve sabah raporunu Telegram mesajı olarak alabilirsiniz.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>⏰</span> Vade Dolum Erken Uyarı Bildirimleri
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Vadesine 3 gün veya 1 gün kalan mevduat/bonolar için her gün sabah otomatik kontrol çalıştırıp paranın boşta kalmaması için hatırlatma bildirimi yollama.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
