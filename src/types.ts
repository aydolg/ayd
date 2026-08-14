export type AssetType = "Hisse Senedi" | "Fon" | "Bono" | "Mevduat";
export type StockTransactionType = "Al" | "Sat";
export type FixedIncomeCloseType = "Açılış" | "Vade Sonu" | "Erken Çıkış";

export interface StockTransaction {
  id: string;
  tarih: string; // YYYY-MM-DD
  tip: "Hisse Senedi" | "Fon";
  sembol: string;
  islem: StockTransactionType;
  miktar: number;
  fiyat: number;
  stopajOrani: number; // e.g. 0 or 10 or 17.5
  note?: string;
}

export interface DividendRecord {
  id: string;
  tarih: string; // YYYY-MM-DD
  sembol: string;
  hisseBasinaNetTemettu: number; // TL
  toplamNetTemettu: number; // TL
  usdKuru?: number;
  note?: string;
}

export interface FixedIncomeRecord {
  id: string;
  tip: "Bono" | "Mevduat";
  ad: string; // Banka veya ISIN / Bono Adı
  anapara: number;
  faizOrani: number; // Yıllık %
  baslangicTarihi: string; // YYYY-MM-DD
  vadeTarihi: string; // YYYY-MM-DD
  stopajOrani: number; // e.g. 17.5
  kapanisTarihi?: string;
  kapanisTuru?: FixedIncomeCloseType;
  gerceklesenNetKZ?: number;
  note?: string;
}

export interface StockPosition {
  sembol: string;
  tip: "Hisse Senedi" | "Fon";
  toplamMiktar: number;
  wap: number; // Weighted Average Price / Ağırlıklı Ortalama Maliyet
  toplamMaliyet: number;
  guncelFiyat: number;
  guncelDeger: number;
  brutKZ: number;
  brutKZPct: number;
  stopajOrani: number;
  stopajTutari: number;
  netKZ: number;
  netKZPct: number;
  toplamAlinanTemettu?: number;
}

export interface PeriodMetric {
  kz: number | null;
  kzPct: number | null;
}

export interface PeriodMetricsGroup {
  gunluk: PeriodMetric;
  aylik: PeriodMetric;
  ucAylik: PeriodMetric;
  altiAylik: PeriodMetric;
  yillik: PeriodMetric;
}

export interface MaturityBucket {
  ayYil: string; // e.g. "2026-08"
  ayAdi: string; // e.g. "Ağustos 2026"
  toplamAnapara: number;
  toplamNetGetiri: number;
  kayitSayisi: number;
}

export interface CurrencySummary {
  usdRate: number;
  eurRate: number;
  bist100Index: number;
  toplamGuncelUSD: number;
  toplamYatirimUSD: number;
  toplamGuncelEUR: number;
}

export interface PortfolioSummary {
  toplamYatirim: number;
  toplamGuncel: number;
  toplamKZ: number;
  toplamKZPct: number;
  toplamGerceklesen: number;
  toplamTemettuGeliri: number;
  currency: CurrencySummary;
  hisse: {
    maliyet: number;
    guncel: number;
    kz: number;
    kzPct: number;
    gerceklesen: number;
    netPozisyonAdedi: number;
  };
  fon: {
    maliyet: number;
    guncel: number;
    kz: number;
    kzPct: number;
    gerceklesen: number;
    netPozisyonAdedi: number;
  };
  bono: {
    anapara: number;
    brut: number;
    stopaj: number;
    net: number;
    netPct: number;
    ortVadeGün: number;
    aktifKayit: number;
    toplamKayit: number;
    gerceklesen: number;
  };
  mevduat: {
    anapara: number;
    brut: number;
    stopaj: number;
    net: number;
    netPct: number;
    ortVadeGün: number;
    aktifKayit: number;
    toplamKayit: number;
    gerceklesen: number;
  };
  donemGetiri: {
    genel: PeriodMetricsGroup;
    hisse: PeriodMetricsGroup;
    fon: PeriodMetricsGroup;
    bono: PeriodMetricsGroup;
    mevduat: PeriodMetricsGroup;
  };
  vadeMerdiveni: MaturityBucket[];
}

export interface SnapshotEntry {
  tarih: string;
  toplamYatirim: number;
  toplamGuncel: number;
  hisseMaliyet: number;
  hisseGuncel: number;
  fonMaliyet: number;
  fonGuncel: number;
  bonoAnapara: number;
  mevduatAnapara: number;
  bonoGuncel: number;
  mevduatGuncel: number;
}

