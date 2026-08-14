import { StockTransaction, FixedIncomeRecord, DividendRecord, SnapshotEntry } from "../types";

export interface ParsedImportResult {
  stockTransactions: StockTransaction[];
  fixedIncomeRecords: FixedIncomeRecord[];
  dividendRecords: DividendRecord[];
  snapshots: SnapshotEntry[];
  summary: {
    stocksCount: number;
    fixedIncomeCount: number;
    dividendCount: number;
    snapshotsCount: number;
    totalRecords: number;
  };
}

/**
 * Flexible JSON parser that parses and normalizes portfolio data from any JSON structure.
 * Supports:
 * - Standard export format ({ stockTransactions: [...], fixedIncomeRecords: [...], dividendRecords: [...] })
 * - Snake_case keys ({ stock_transactions: [...], fixed_income: [...], dividends: [...] })
 * - Turkish keys ({ hisseler: [...], mevduatlar: [...], temettuler: [...] })
 * - Root-level arrays of transactions
 * - Nested objects ({ data: { ... } }, { payload: { ... } }, { result: { ... } })
 */
export function parseImportJSON(input: any): ParsedImportResult {
  const stockTransactions: StockTransaction[] = [];
  const fixedIncomeRecords: FixedIncomeRecord[] = [];
  const dividendRecords: DividendRecord[] = [];
  const snapshots: SnapshotEntry[] = [];

  if (!input) {
    return {
      stockTransactions,
      fixedIncomeRecords,
      dividendRecords,
      snapshots,
      summary: { stocksCount: 0, fixedIncomeCount: 0, dividendCount: 0, snapshotsCount: 0, totalRecords: 0 }
    };
  }

  // Unwrap nested structures like { data: ... } or { payload: ... } or { result: ... }
  let target = input;
  if (typeof target === "object" && !Array.isArray(target)) {
    if (target.data && typeof target.data === "object" && !Array.isArray(target.data)) {
      target = target.data;
    } else if (target.payload && typeof target.payload === "object" && !Array.isArray(target.payload)) {
      target = target.payload;
    } else if (target.result && typeof target.result === "object" && !Array.isArray(target.result)) {
      target = target.result;
    }
  }

  // Case A: Root level array
  if (Array.isArray(target)) {
    target.forEach((item, idx) => {
      categorizeAndAddSingleItem(item, idx, stockTransactions, fixedIncomeRecords, dividendRecords);
    });
  } else if (typeof target === "object") {
    // Case B: Object with key-value arrays
    const rawStocks =
      target.stockTransactions ||
      target.stock_transactions ||
      target.transactions ||
      target.hisseSenetleri ||
      target.hisseler ||
      target.fonlar ||
      target.islemGecmisi ||
      target.islem_gecmisi ||
      target.stocks ||
      [];

    const rawFixedIncome =
      target.fixedIncomeRecords ||
      target.fixed_income ||
      target.fixedIncome ||
      target.sabitGetiri ||
      target.mevduat ||
      target.mevduatlar ||
      target.bono ||
      target.bonolar ||
      [];

    const rawDividends =
      target.dividendRecords ||
      target.dividend_records ||
      target.dividends ||
      target.temettu ||
      target.temettuler ||
      [];

    const rawSnapshots =
      target.snapshots ||
      target.snapshotList ||
      target.history ||
      [];

    if (Array.isArray(rawStocks)) {
      rawStocks.forEach((item, idx) => {
        const parsed = normalizeStockTx(item, idx);
        if (parsed) stockTransactions.push(parsed);
      });
    }

    if (Array.isArray(rawFixedIncome)) {
      rawFixedIncome.forEach((item, idx) => {
        const parsed = normalizeFixedIncome(item, idx);
        if (parsed) fixedIncomeRecords.push(parsed);
      });
    }

    if (Array.isArray(rawDividends)) {
      rawDividends.forEach((item, idx) => {
        const parsed = normalizeDividend(item, idx);
        if (parsed) dividendRecords.push(parsed);
      });
    }

    if (Array.isArray(rawSnapshots)) {
      rawSnapshots.forEach((item) => {
        if (item && item.tarih) {
          snapshots.push({
            tarih: String(item.tarih),
            toplamGuncel: Number(item.toplamGuncel || item.toplamGuncelDeger || item.value || 0),
            toplamYatirim: Number(item.toplamYatirim || item.cost || 0),
            hisseMaliyet: Number(item.hisseMaliyet || 0),
            hisseGuncel: Number(item.hisseGuncel || 0),
            fonMaliyet: Number(item.fonMaliyet || 0),
            fonGuncel: Number(item.fonGuncel || 0),
            bonoAnapara: Number(item.bonoAnapara || 0),
            mevduatAnapara: Number(item.mevduatAnapara || 0),
            bonoGuncel: Number(item.bonoGuncel || 0),
            mevduatGuncel: Number(item.mevduatGuncel || 0)
          });
        }
      });
    }
  }

  const totalRecords = stockTransactions.length + fixedIncomeRecords.length + dividendRecords.length;

  return {
    stockTransactions,
    fixedIncomeRecords,
    dividendRecords,
    snapshots,
    summary: {
      stocksCount: stockTransactions.length,
      fixedIncomeCount: fixedIncomeRecords.length,
      dividendCount: dividendRecords.length,
      snapshotsCount: snapshots.length,
      totalRecords
    }
  };
}

function categorizeAndAddSingleItem(
  item: any,
  idx: number,
  stocks: StockTransaction[],
  fixedIncomes: FixedIncomeRecord[],
  dividends: DividendRecord[]
) {
  if (!item || typeof item !== "object") return;

  if (item.faizOrani !== undefined || item.anapara !== undefined || item.vadeTarihi || item.banka) {
    const rec = normalizeFixedIncome(item, idx);
    if (rec) fixedIncomes.push(rec);
  } else if (item.netTutar !== undefined && (item.hisseSembol || item.sembol) && !item.islem) {
    const div = normalizeDividend(item, idx);
    if (div) dividends.push(div);
  } else if (item.sembol || item.symbol || item.fonKod || item.hisse) {
    const tx = normalizeStockTx(item, idx);
    if (tx) stocks.push(tx);
  }
}

function normalizeStockTx(item: any, idx: number): StockTransaction | null {
  if (!item || typeof item !== "object") return null;

  const sembol = String(item.sembol || item.symbol || item.code || item.fonKod || item.hisse || "").toUpperCase().trim();
  if (!sembol) return null;

  const miktar = Number(item.miktar || item.quantity || item.amount || item.qty || item.shares || item.adet || 0);
  const fiyat = Number(item.fiyat || item.price || item.unitPrice || item.cost || 0);

  if (isNaN(miktar) || isNaN(fiyat) || miktar <= 0) return null;

  let islemRaw = String(item.islem || item.action || item.type || item.buySell || "Al").toLowerCase();
  const islem: "Al" | "Sat" = islemRaw.includes("sat") || islemRaw.includes("sell") ? "Sat" : "Al";

  let tipRaw = String(item.tip || item.type || item.category || "").toLowerCase();
  let tip: "Hisse Senedi" | "Fon" = "Hisse Senedi";

  if (tipRaw.includes("fon") || sembol.length === 3) {
    tip = "Fon";
  }

  const tarih = item.tarih || item.date || item.timestamp || new Date().toISOString().split("T")[0];

  return {
    id: item.id || `st-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    tarih: String(tarih).slice(0, 10),
    tip,
    sembol,
    islem,
    miktar,
    fiyat,
    stopajOrani: item.stopajOrani !== undefined ? Number(item.stopajOrani) : undefined
  };
}

function normalizeFixedIncome(item: any, idx: number): FixedIncomeRecord | null {
  if (!item || typeof item !== "object") return null;

  const ad = String(item.ad || item.banka || item.enstruman || item.title || item.bank || "Banka / Kurum").trim();
  const anapara = Number(item.anapara || item.principal || item.amount || item.tutar || 0);
  const faizOrani = Number(item.faizOrani || item.faiz || item.rate || item.interestRate || 0);

  if (isNaN(anapara) || anapara <= 0) return null;

  let tipRaw = String(item.tip || item.type || "Mevduat").toLowerCase();
  let tip: "Mevduat" | "Bono" = tipRaw.includes("bono") ? "Bono" : "Mevduat";

  const baslangicTarihi = String(item.baslangicTarihi || item.baslangic || item.startDate || new Date().toISOString().split("T")[0]).slice(0, 10);
  const vadeTarihi = String(item.vadeTarihi || item.vade || item.endDate || baslangicTarihi).slice(0, 10);

  return {
    id: item.id || `fi-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    tip,
    ad,
    anapara,
    faizOrani,
    baslangicTarihi,
    vadeTarihi,
    stopajOrani: Number(item.stopajOrani ?? 17.5),
    kapanisTarihi: item.kapanisTarihi ? String(item.kapanisTarihi).slice(0, 10) : undefined,
    kapanisTuru: item.kapanisTuru,
    gerceklesenNetKZ: item.gerceklesenNetKZ !== undefined ? Number(item.gerceklesenNetKZ) : undefined
  };
}

function normalizeDividend(item: any, idx: number): DividendRecord | null {
  if (!item || typeof item !== "object") return null;

  const sembol = String(item.sembol || item.symbol || item.hisseSembol || "").toUpperCase().trim();
  const toplamNetTemettu = Number(item.toplamNetTemettu || item.netTutar || item.tutar || item.amount || item.net || 0);
  const hisseBasinaNetTemettu = Number(item.hisseBasinaNetTemettu || item.hisseBasiNet || 0);

  if (!sembol || isNaN(toplamNetTemettu) || toplamNetTemettu <= 0) return null;

  const tarih = String(item.tarih || item.date || new Date().toISOString().split("T")[0]).slice(0, 10);

  return {
    id: item.id || `div-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    sembol,
    tarih,
    toplamNetTemettu,
    hisseBasinaNetTemettu
  };
}
