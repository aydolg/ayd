import { StockTransaction, FixedIncomeRecord, SnapshotEntry } from "../types";

export const initialStockTransactions: StockTransaction[] = [
  {
    id: "st-1",
    tarih: "2026-01-15",
    tip: "Hisse Senedi",
    sembol: "THYAO",
    islem: "Al",
    miktar: 250,
    fiyat: 280.00,
    stopajOrani: 0,
    note: "İlk THYAO alımı"
  },
  {
    id: "st-2",
    tarih: "2026-02-10",
    tip: "Hisse Senedi",
    sembol: "THYAO",
    islem: "Al",
    miktar: 150,
    fiyat: 295.50,
    stopajOrani: 0
  },
  {
    id: "st-3",
    tarih: "2026-03-01",
    tip: "Hisse Senedi",
    sembol: "GARAN",
    islem: "Al",
    miktar: 500,
    fiyat: 102.40,
    stopajOrani: 0
  },
  {
    id: "st-4",
    tarih: "2026-04-12",
    tip: "Hisse Senedi",
    sembol: "ASELS",
    islem: "Al",
    miktar: 400,
    fiyat: 58.20,
    stopajOrani: 0
  },
  {
    id: "st-5",
    tarih: "2026-05-20",
    tip: "Fon",
    sembol: "TI2",
    islem: "Al",
    miktar: 200000,
    fiyat: 0.04250,
    stopajOrani: 10
  },
  {
    id: "st-6",
    tarih: "2026-06-05",
    tip: "Fon",
    sembol: "AK2",
    islem: "Al",
    miktar: 15000,
    fiyat: 1.1500,
    stopajOrani: 7.5
  },
  {
    id: "st-7",
    tarih: "2026-07-02",
    tip: "Hisse Senedi",
    sembol: "THYAO",
    islem: "Sat",
    miktar: 100,
    fiyat: 312.00,
    stopajOrani: 0
  }
];

export const initialFixedIncomeRecords: FixedIncomeRecord[] = [
  {
    id: "fi-1",
    tip: "Bono",
    ad: "TRT260126T12 - Hazine Bonosu",
    anapara: 150000,
    faizOrani: 44.50,
    baslangicTarihi: "2026-02-01",
    vadeTarihi: "2026-11-01",
    stopajOrani: 10.0
  },
  {
    id: "fi-2",
    tip: "Mevduat",
    ad: "Garanti BBVA 92 Gün Vadeli",
    anapara: 200000,
    faizOrani: 48.00,
    baslangicTarihi: "2026-06-01",
    vadeTarihi: "2026-09-01",
    stopajOrani: 17.5
  },
  {
    id: "fi-3",
    tip: "Mevduat",
    ad: "İş Bankası Hoşgeldin Mevduatı",
    anapara: 100000,
    faizOrani: 49.50,
    baslangicTarihi: "2026-07-15",
    vadeTarihi: "2026-08-15",
    stopajOrani: 17.5,
    kapanisTarihi: "2026-08-15",
    kapanisTuru: "Vade Sonu",
    gerceklesenNetKZ: 3375.34
  }
];

export const initialDividendRecords = [
  {
    id: "div-1",
    tarih: "2026-04-20",
    sembol: "THYAO",
    hisseBasinaNetTemettu: 6.25,
    toplamNetTemettu: 2500,
    note: "2025 Yılı Kar Payı Dağıtımı"
  },
  {
    id: "div-2",
    tarih: "2026-05-10",
    sembol: "GARAN",
    hisseBasinaNetTemettu: 3.80,
    toplamNetTemettu: 1900,
    note: "1. Taksit Temettu"
  }
];

export const mockCurrentMarketPrices: Record<string, number> = {
  THYAO: 318.50,
  GARAN: 119.80,
  ASELS: 65.40,
  TI2: 0.04850,
  AK2: 1.2850
};

export const initialSnapshots: SnapshotEntry[] = [
  {
    tarih: "2026-08-11", // 1 gün önce
    toplamYatirim: 561250,
    toplamGuncel: 618400,
    hisseMaliyet: 102500,
    hisseGuncel: 118400,
    fonMaliyet: 25750,
    fonGuncel: 28900,
    bonoAnapara: 150000,
    bonoGuncel: 184000,
    mevduatAnapara: 200000,
    mevduatGuncel: 220000
  },
  {
    tarih: "2026-07-12", // 30 gün önce
    toplamYatirim: 512000,
    toplamGuncel: 554000,
    hisseMaliyet: 98000,
    hisseGuncel: 108000,
    fonMaliyet: 25750,
    fonGuncel: 27500,
    bonoAnapara: 150000,
    bonoGuncel: 178500,
    mevduatAnapara: 100000,
    mevduatGuncel: 108000
  },
  {
    tarih: "2026-05-12", // 90 gün önce
    toplamYatirim: 420000,
    toplamGuncel: 442000,
    hisseMaliyet: 85000,
    hisseGuncel: 91000,
    fonMaliyet: 15000,
    fonGuncel: 15800,
    bonoAnapara: 150000,
    bonoGuncel: 168000,
    mevduatAnapara: 100000,
    mevduatGuncel: 104500
  },
  {
    tarih: "2026-02-12", // 180 gün önce
    toplamYatirim: 310000,
    toplamGuncel: 321000,
    hisseMaliyet: 60000,
    hisseGuncel: 64000,
    fonMaliyet: 0,
    fonGuncel: 0,
    bonoAnapara: 150000,
    bonoGuncel: 153000,
    mevduatAnapara: 100000,
    mevduatGuncel: 101000
  },
  {
    tarih: "2025-08-12", // 365 gün önce
    toplamYatirim: 200000,
    toplamGuncel: 205000,
    hisseMaliyet: 40000,
    hisseGuncel: 42000,
    fonMaliyet: 0,
    fonGuncel: 0,
    bonoAnapara: 100000,
    bonoGuncel: 101000,
    mevduatAnapara: 60000,
    mevduatGuncel: 61000
  }
];
