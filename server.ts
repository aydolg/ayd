import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini AI Portfolio Advisor
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const ai = getAIClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY tanımlanmamış. Lütfen secrets panelinden anahtar ekleyin."
      });
    }

    const { summaryData, positions } = req.body;

    const prompt = `
Sen kıdemli bir finansal portföy analisti ve Türkiye piyasaları (BIST, TEFAS, Bono, Mevduat, Stopaj mevzuatı) uzmanısın.
Aşağıda kullanıcının güncel portföy verileri ve açık pozisyonları verilmiştir.

Portföy Özeti:
- Toplam Yatırılan Anapara: ${summaryData?.toplamYatirim?.toLocaleString("tr-TR") || 0} TL
- Toplam Güncel Değer: ${summaryData?.toplamGuncel?.toLocaleString("tr-TR") || 0} TL
- Açık Kar/Zarar: ${summaryData?.toplamKZ?.toLocaleString("tr-TR") || 0} TL (%${summaryData?.toplamKZPct?.toFixed(2) || 0})
- Gerçekleşen Kar/Zarar: ${summaryData?.toplamGerceklesen?.toLocaleString("tr-TR") || 0} TL

Varlık Dağılımı:
- Hisse Senedi: ${summaryData?.hisse?.guncel?.toLocaleString("tr-TR") || 0} TL (Kar/Zarar: ${summaryData?.hisse?.kz?.toLocaleString("tr-TR") || 0} TL)
- Fon: ${summaryData?.fon?.guncel?.toLocaleString("tr-TR") || 0} TL (Kar/Zarar: ${summaryData?.fon?.kz?.toLocaleString("tr-TR") || 0} TL)
- Bono/Tahvil: ${(summaryData?.bono?.anapara + summaryData?.bono?.net)?.toLocaleString("tr-TR") || 0} TL (Net Getiri: ${summaryData?.bono?.net?.toLocaleString("tr-TR") || 0} TL)
- Mevduat: ${(summaryData?.mevduat?.anapara + summaryData?.mevduat?.net)?.toLocaleString("tr-TR") || 0} TL (Net Getiri: ${summaryData?.mevduat?.net?.toLocaleString("tr-TR") || 0} TL)

Detaylı Pozisyonlar:
${JSON.stringify(positions || [], null, 2)}

Lütfen Türkçe olarak aşağıdaki yapıda profesyonel, yapıcı, maddeler halinde ve nesnel tavsiyeler üret:
1. **Portföy Çeşitlendirme Değerlendirmesi**: Riskin varlık sınıflarına dağılımı dengeli mi? (Aşırı hisse, aşırı mevduat vb.)
2. **Stopaj ve Vergi Verimliliği**: Mevcut vergi/stopaj yükü (özellikle fonlar ve mevduat/bono) için optimizasyon ipuçları.
3. **Vade Yapısı ve Likidite Riskleri**: Bono ve mevduat vadeleri yeterince kademeli mi (vade merdiveni / maturity ladder)?
4. **Geliştirme ve Aksiyon Önerileri**: Portföy getirisini artırmak veya riskleri azaltmak için 3 somut stratejik adım.

Yanıtın net, şık, anlaşılır Markdown biçiminde olsun.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({ error: "Yapay zeka analizi oluşturulurken hata oluştu: " + err.message });
  }
});

// Google Finance Scraper for BIST assets
async function fetchGoogleFinanceQuote(symbol: string): Promise<number | null> {
  const cleanSymbol = symbol.trim().toUpperCase().replace(".IS", "");
  const url = `https://www.google.com/finance/quote/${cleanSymbol}:IST`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Primary Pattern: ["/g/...",["SYMBOL","IST"], "Company Name", 0, "TRY", [PRICE, CHANGE, PERCENT_CHANGE]]
    const match = html.match(
      new RegExp(`\\["\\/g\\/[^"]+",\\["${cleanSymbol}","IST"\\][^\\]]*?,0,"TRY",\\[([0-9.]+)`)
    );
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val > 0 && val < 100000) return val;
    }

    // Secondary Pattern: [[null,["SYMBOL","IST"]],null,HIGH,"/g/...",LOW,OPEN,PRICE]
    const match2 = html.match(
      new RegExp(`\\[\\[null,\\["${cleanSymbol}","IST"\\]\\],null,[0-9.]+,[^,]+,[0-9.]+,[0-9.]+,([0-9.]+)`)
    );
    if (match2 && match2[1]) {
      const val = parseFloat(match2[1]);
      if (!isNaN(val) && val > 0 && val < 100000) return val;
    }
  } catch (err) {
    console.warn(`Google Finance fetch error for ${cleanSymbol}:`, err);
  }

  return null;
}

// TEFAS Fund Scraper for Turkish Mutual & Pension Funds (e.g. MAC, TCD, TI2, AK2, AFT, YAY)
async function fetchTefasFundQuote(symbol: string): Promise<number | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  try {
    const response = await fetch(`https://api.fundfy.net/api/v1/fund/detail/${cleanSymbol}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (typeof data.price === "number" && data.price > 0) {
        return data.price;
      }
    }
  } catch (err) {
    console.warn(`TEFAS Fund fetch error for ${cleanSymbol}:`, err);
  }

  return null;
}

// Live Market Quotes Endpoint using Google Finance & TEFAS
app.get("/api/market/quotes", async (req, res) => {
  const fallbackQuotes: Record<string, number> = {
    "THYAO": 315.50,
    "GARAN": 118.20,
    "ASELS": 64.75,
    "KCHOL": 224.00,
    "BIMAS": 485.00,
    "AKBNK": 62.10,
    "SISE": 52.80,
    "TUPRS": 178.90,
    "EREGL": 48.30,
    "SASA": 39.50,
    "FROTO": 1050.00,
    "HEKTS": 14.80,
    "EKGYO": 11.20,
    "TI2": 0.1258,
    "AK2": 0.5346,
    "TCD": 49.083,
    "MAC": 0.7608,
    "AFT": 0.9933,
    "YAY": 1862.14,
    "IJZ": 14.76,
    "TI1": 1651.69
  };

  const requestedSymbols = req.query.symbols
    ? (req.query.symbols as string).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : Object.keys(fallbackQuotes);

  const quotesResult: Record<string, number> = { ...fallbackQuotes };

  // Fetch prices in parallel from Google Finance & TEFAS
  const fetchPromises = requestedSymbols.map(async (symbol) => {
    // 1. Try Google Finance first for stocks
    let price = await fetchGoogleFinanceQuote(symbol);

    // 2. If not found on Google Finance or for TEFAS fund codes, query TEFAS Fund API
    if (price === null) {
      price = await fetchTefasFundQuote(symbol);
    }

    if (price !== null) {
      quotesResult[symbol] = price;
    }
  });

  await Promise.allSettled(fetchPromises);

  res.json({ quotes: quotesResult, timestamp: new Date().toISOString(), provider: "Google Finance & TEFAS" });
});

// Explicit API 404 handler to ensure /api/* endpoints always return JSON, never HTML
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
