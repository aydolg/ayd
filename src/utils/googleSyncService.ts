import { StockTransaction, FixedIncomeRecord, DividendRecord } from "../types";

/**
 * Sends full portfolio or single item to Google Apps Script Web App.
 */
export async function pushToGoogleSheets(
  scriptUrl: string,
  payload: {
    action: "sync_full" | "add_transaction" | "add_fixed_income" | "add_dividend";
    stockTransactions?: StockTransaction[];
    fixedIncomeRecords?: FixedIncomeRecord[];
    dividendRecords?: DividendRecord[];
    transaction?: StockTransaction;
    fixedIncome?: FixedIncomeRecord;
    dividend?: DividendRecord;
  }
): Promise<{ success: boolean; message: string }> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: "Google Apps Script Web App URL adresi tanımlanmamış." };
  }

  try {
    const cleanUrl = scriptUrl.trim();

    // Send payload using text/plain to avoid preflight CORS restrictions in Google Apps Script
    await fetch(cleanUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      })
    });

    return {
      success: true,
      message: "Veriler Google Sheets tablonuza başarıyla iletildi!"
    };
  } catch (err: any) {
    console.error("pushToGoogleSheets Error:", err);
    return {
      success: false,
      message: `Google Sheets'e gönderim hatası: ${err?.message || "Bağlantı kurulamadı."}`
    };
  }
}

/**
 * Helper to auto-sync a new item if autoSync is enabled
 */
export function autoSyncIfEnabled(payload: {
  action: "add_transaction" | "add_fixed_income" | "add_dividend";
  transaction?: StockTransaction;
  fixedIncome?: FixedIncomeRecord;
  dividend?: DividendRecord;
}) {
  const isAutoSync = localStorage.getItem("pt_auto_sync") === "true";
  const scriptUrl = localStorage.getItem("pt_gas_script_url") || "";

  if (isAutoSync && scriptUrl) {
    pushToGoogleSheets(scriptUrl, payload).catch((err) => {
      console.warn("Auto sync background push warning:", err);
    });
  }
}
