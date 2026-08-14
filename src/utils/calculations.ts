import {
  StockTransaction,
  FixedIncomeRecord,
  DividendRecord,
  StockPosition,
  PortfolioSummary,
  PeriodMetricsGroup,
  MaturityBucket,
  SnapshotEntry
} from "../types";

export function calculateStockPositions(
  transactions: StockTransaction[],
  dividendRecords: DividendRecord[],
  marketPrices: Record<string, number>,
  targetType: "Hisse Senedi" | "Fon"
): { positions: StockPosition[]; totalRealizedKZ: number } {
  const filtered = transactions.filter((t) => t.tip === targetType);
  const sembolMap: Record<
    string,
    { topAdet: number; topMaliyet: number; topStopajAdet: number; realizedKZ: number }
  > = {};

  let totalRealizedKZ = 0;

  filtered.forEach((t) => {
    if (!sembolMap[t.sembol]) {
      sembolMap[t.sembol] = {
        topAdet: 0,
        topMaliyet: 0,
        topStopajAdet: 0,
        realizedKZ: 0
      };
    }

    const m = sembolMap[t.sembol];
    if (t.islem === "Al") {
      m.topAdet += t.miktar;
      m.topMaliyet += t.miktar * t.fiyat;
      m.topStopajAdet += t.miktar * (t.stopajOrani || 0);
    } else if (t.islem === "Sat") {
      const wapBefore = m.topAdet > 0 ? m.topMaliyet / m.topAdet : 0;
      const stopajOranBefore = m.topAdet > 0 ? m.topStopajAdet / m.topAdet : 0;
      const wapMaliyetSatilan = wapBefore * t.miktar;
      const satisSatisTutari = t.fiyat * t.miktar;
      const brutSatishKZ = satisSatisTutari - wapMaliyetSatilan;
      const stopajTutarSatish =
        brutSatishKZ > 0 ? brutSatishKZ * (stopajOranBefore / 100) : 0;
      const netSatishKZ = brutSatishKZ - stopajTutarSatish;

      m.realizedKZ += netSatishKZ;
      totalRealizedKZ += netSatishKZ;

      m.topAdet -= t.miktar;
      if (m.topAdet > 0) {
        const kalanOran = m.topAdet / (m.topAdet + t.miktar);
        m.topMaliyet *= kalanOran;
        m.topStopajAdet *= kalanOran;
      } else {
        m.topAdet = 0;
        m.topMaliyet = 0;
        m.topStopajAdet = 0;
      }
    }
  });

  const positions: StockPosition[] = [];

  Object.keys(sembolMap).forEach((sembol) => {
    const m = sembolMap[sembol];
    if (m.topAdet > 0.0001) {
      const guncelFiyat = marketPrices[sembol] || (m.topMaliyet / m.topAdet);
      const wap = m.topMaliyet / m.topAdet;
      const guncelDeger = guncelFiyat * m.topAdet;
      const brutKZ = guncelDeger - m.topMaliyet;
      const stopajOran = m.topAdet > 0 ? m.topStopajAdet / m.topAdet : 0;
      const stopajTutari = brutKZ > 0 ? brutKZ * (stopajOran / 100) : 0;
      const netKZ = brutKZ - stopajTutari;

      const alinanTemettu = dividendRecords
        .filter((d) => d.sembol === sembol)
        .reduce((sum, d) => sum + d.toplamNetTemettu, 0);

      positions.push({
        sembol,
        tip: targetType,
        toplamMiktar: Number(m.topAdet.toFixed(4)),
        wap: Number(wap.toFixed(4)),
        toplamMaliyet: Number(m.topMaliyet.toFixed(2)),
        guncelFiyat: Number(guncelFiyat.toFixed(4)),
        guncelDeger: Number(guncelDeger.toFixed(2)),
        brutKZ: Number(brutKZ.toFixed(2)),
        brutKZPct: m.topMaliyet > 0 ? (brutKZ / m.topMaliyet) * 100 : 0,
        stopajOrani: Number(stopajOran.toFixed(2)),
        stopajTutari: Number(stopajTutari.toFixed(2)),
        netKZ: Number(netKZ.toFixed(2)),
        netKZPct: m.topMaliyet > 0 ? (netKZ / m.topMaliyet) * 100 : 0,
        toplamAlinanTemettu: alinanTemettu
      });
    }
  });

  return { positions, totalRealizedKZ };
}

export function calculateFixedIncomeSummary(
  records: FixedIncomeRecord[],
  targetType: "Bono" | "Mevduat"
) {
  const filtered = records.filter((r) => r.tip === targetType);

  let anapara = 0;
  let brut = 0;
  let stopaj = 0;
  let net = 0;
  let topVade = 0;
  let aktif = 0;
  let realizedKZ = 0;

  filtered.forEach((r) => {
    if (r.kapanisTarihi) {
      realizedKZ += r.gerceklesenNetKZ || 0;
      return;
    }

    const bas = new Date(r.baslangicTarihi);
    const vad = new Date(r.vadeTarihi);
    const gun = Math.max(0, Math.round((vad.getTime() - bas.getTime()) / (1000 * 3600 * 24)));
    const brutGetiri = r.anapara * (r.faizOrani / 100) * (gun / 365);
    const stopajTutar = brutGetiri * ((r.stopajOrani || 17.5) / 100);
    const netGetiri = brutGetiri - stopajTutar;

    anapara += r.anapara;
    brut += brutGetiri;
    stopaj += stopajTutar;
    net += netGetiri;
    topVade += gun;
    aktif += 1;
  });

  const netPct = anapara > 0 ? (net / anapara) * 100 : 0;
  const ortVadeGün = aktif > 0 ? Math.round(topVade / aktif) : 0;

  return {
    anapara,
    brut,
    stopaj,
    net,
    netPct,
    ortVadeGün,
    aktifKayit: aktif,
    toplamKayit: filtered.length,
    gerceklesen: realizedKZ
  };
}

export function calculateMaturityLadder(records: FixedIncomeRecord[]): MaturityBucket[] {
  const map: Record<string, { anapara: number; netGetiri: number; count: number }> = {};

  records
    .filter((r) => !r.kapanisTarihi)
    .forEach((r) => {
      const vad = new Date(r.vadeTarihi);
      const ayYil = `${vad.getFullYear()}-${String(vad.getMonth() + 1).padStart(2, "0")}`;

      const bas = new Date(r.baslangicTarihi);
      const gun = Math.max(0, Math.round((vad.getTime() - bas.getTime()) / (1000 * 3600 * 24)));
      const brutGetiri = r.anapara * (r.faizOrani / 100) * (gun / 365);
      const stopajTutar = brutGetiri * ((r.stopajOrani || 17.5) / 100);
      const netGetiri = brutGetiri - stopajTutar;

      if (!map[ayYil]) {
        map[ayYil] = { anapara: 0, netGetiri: 0, count: 0 };
      }
      map[ayYil].anapara += r.anapara;
      map[ayYil].netGetiri += netGetiri;
      map[ayYil].count += 1;
    });

  const monthsTR: Record<string, string> = {
    "01": "Ocak",
    "02": "Şubat",
    "03": "Mart",
    "04": "Nisan",
    "05": "Mayıs",
    "06": "Haziran",
    "07": "Temmuz",
    "08": "Ağustos",
    "09": "Eylül",
    "10": "Ekim",
    "11": "Kasım",
    "12": "Aralık"
  };

  return Object.keys(map)
    .sort()
    .map((ayYil) => {
      const [yil, ay] = ayYil.split("-");
      return {
        ayYil,
        ayAdi: `${monthsTR[ay] || ay} ${yil}`,
        toplamAnapara: Number(map[ayYil].anapara.toFixed(2)),
        toplamNetGetiri: Number(map[ayYil].netGetiri.toFixed(2)),
        kayitSayisi: map[ayYil].count
      };
    });
}

// Calculate Modified Dietz Performance Metrics
export function calculateModifiedDietzMetrics(
  currentSummary: {
    toplamGuncel: number;
    hisseGuncel: number;
    fonGuncel: number;
    bonoGuncel: number;
    mevduatGuncel: number;
  },
  snapshots: SnapshotEntry[],
  days: number
): { kz: number | null; kzPct: number | null } {
  if (!snapshots || snapshots.length === 0) return { kz: null, kzPct: null };

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);

  let closest: SnapshotEntry | null = null;
  let minDiff = Infinity;

  snapshots.forEach((snap) => {
    const d = new Date(snap.tarih);
    const diff = Math.abs(targetDate.getTime() - d.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = snap;
    }
  });

  if (!closest) return { kz: null, kzPct: null };

  const startVal = (closest as SnapshotEntry).toplamGuncel;
  const endVal = currentSummary.toplamGuncel;

  const kz = endVal - startVal;
  const kzPct = startVal > 0 ? (kz / startVal) * 100 : 0;

  return { kz, kzPct };
}

export function buildPortfolioSummary(
  stockTransactions: StockTransaction[],
  fixedIncomeRecords: FixedIncomeRecord[],
  dividendRecords: DividendRecord[],
  marketPrices: Record<string, number>,
  snapshots: SnapshotEntry[],
  currencyRates: { usdRate: number; eurRate: number; bist100Index: number } = {
    usdRate: 38.65,
    eurRate: 41.50,
    bist100Index: 9850
  }
): PortfolioSummary {
  const hisseCalc = calculateStockPositions(stockTransactions, dividendRecords, marketPrices, "Hisse Senedi");
  const fonCalc = calculateStockPositions(stockTransactions, dividendRecords, marketPrices, "Fon");

  const bonoSummary = calculateFixedIncomeSummary(fixedIncomeRecords, "Bono");
  const mevduatSummary = calculateFixedIncomeSummary(fixedIncomeRecords, "Mevduat");

  const hisseMaliyet = hisseCalc.positions.reduce((acc, p) => acc + p.toplamMaliyet, 0);
  const hisseGuncel = hisseCalc.positions.reduce((acc, p) => acc + p.guncelDeger, 0);
  const hisseKZ = hisseGuncel - hisseMaliyet;
  const hisseKZPct = hisseMaliyet > 0 ? (hisseKZ / hisseMaliyet) * 100 : 0;

  const fonMaliyet = fonCalc.positions.reduce((acc, p) => acc + p.toplamMaliyet, 0);
  const fonGuncel = fonCalc.positions.reduce((acc, p) => acc + p.guncelDeger, 0);
  const fonKZ = fonGuncel - fonMaliyet;
  const fonKZPct = fonMaliyet > 0 ? (fonKZ / fonMaliyet) * 100 : 0;

  const bonoGuncel = bonoSummary.anapara + bonoSummary.net;
  const mevduatGuncel = mevduatSummary.anapara + mevduatSummary.net;

  const toplamYatirim =
    hisseMaliyet + fonMaliyet + bonoSummary.anapara + mevduatSummary.anapara;
  const toplamGuncel =
    hisseGuncel + fonGuncel + bonoGuncel + mevduatGuncel;

  const toplamKZ = toplamGuncel - toplamYatirim;
  const toplamKZPct = toplamYatirim > 0 ? (toplamKZ / toplamYatirim) * 100 : 0;

  const toplamGerceklesen =
    hisseCalc.totalRealizedKZ +
    fonCalc.totalRealizedKZ +
    bonoSummary.gerceklesen +
    mevduatSummary.gerceklesen;

  const toplamTemettuGeliri = dividendRecords.reduce((acc, d) => acc + d.toplamNetTemettu, 0);

  const currObj = {
    toplamGuncel,
    hisseGuncel,
    fonGuncel,
    bonoGuncel,
    mevduatGuncel
  };

  const buildGroup = (val: number): PeriodMetricsGroup => ({
    gunluk: calculateModifiedDietzMetrics({ ...currObj, toplamGuncel: val }, snapshots, 1),
    aylik: calculateModifiedDietzMetrics({ ...currObj, toplamGuncel: val }, snapshots, 30),
    ucAylik: calculateModifiedDietzMetrics({ ...currObj, toplamGuncel: val }, snapshots, 90),
    altiAylik: calculateModifiedDietzMetrics({ ...currObj, toplamGuncel: val }, snapshots, 180),
    yillik: calculateModifiedDietzMetrics({ ...currObj, toplamGuncel: val }, snapshots, 365)
  });

  const vadeMerdiveni = calculateMaturityLadder(fixedIncomeRecords);

  return {
    toplamYatirim,
    toplamGuncel,
    toplamKZ,
    toplamKZPct,
    toplamGerceklesen,
    toplamTemettuGeliri,
    currency: {
      usdRate: currencyRates.usdRate,
      eurRate: currencyRates.eurRate,
      bist100Index: currencyRates.bist100Index,
      toplamGuncelUSD: currencyRates.usdRate > 0 ? Number((toplamGuncel / currencyRates.usdRate).toFixed(2)) : 0,
      toplamYatirimUSD: currencyRates.usdRate > 0 ? Number((toplamYatirim / currencyRates.usdRate).toFixed(2)) : 0,
      toplamGuncelEUR: currencyRates.eurRate > 0 ? Number((toplamGuncel / currencyRates.eurRate).toFixed(2)) : 0
    },
    hisse: {
      maliyet: hisseMaliyet,
      guncel: hisseGuncel,
      kz: hisseKZ,
      kzPct: hisseKZPct,
      gerceklesen: hisseCalc.totalRealizedKZ,
      netPozisyonAdedi: hisseCalc.positions.length
    },
    fon: {
      maliyet: fonMaliyet,
      guncel: fonGuncel,
      kz: fonKZ,
      kzPct: fonKZPct,
      gerceklesen: fonCalc.totalRealizedKZ,
      netPozisyonAdedi: fonCalc.positions.length
    },
    bono: bonoSummary,
    mevduat: mevduatSummary,
    donemGetiri: {
      genel: buildGroup(toplamGuncel),
      hisse: buildGroup(hisseGuncel),
      fon: buildGroup(fonGuncel),
      bono: buildGroup(bonoGuncel),
      mevduat: buildGroup(mevduatGuncel)
    },
    vadeMerdiveni
  };
}

