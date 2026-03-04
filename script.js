// Portfolio Data Management
let portfolio = [];
let liveData = {};
let sectorChart = null;
let performanceChart = null;

// Fiyat verisi kaynağı
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeTFovlKfvEp9sPepJb9SGxf_2AgMU7eEPTDCc6WWc0o1Z1AizX6K2mJlaWtcvSderiBym7cyhEdsC/pub?gid=1621608399&single=true&output=csv';
const SHEET_CACHE_TTL_MS = 60000;
let sheetPriceCache = { data: null, loadedAt: 0 };

// ========== YARDIMCI FONKSİYONLAR ==========

function normalizeSymbol(symbol) {
    return String(symbol || '').toUpperCase().trim();
}

function buildSymbolAliases(symbol) {
    const base = normalizeSymbol(symbol);
    if (!base) return [];

    const noSuffix = base.endsWith('.IS') ? base.slice(0, -3) : base;
    const withSuffix = noSuffix + '.IS';

    return [...new Set([base, noSuffix, withSuffix])];
}

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function parsePriceValue(raw) {
    if (raw === undefined || raw === null) return null;
    let txt = String(raw).trim();
    if (!txt) return null;

    txt = txt.replace(/\s/g, '').replace(/[₺$€£]/g, '');
    const lastComma = txt.lastIndexOf(',');
    const lastDot = txt.lastIndexOf('.');

    if (lastComma > lastDot) {
        txt = txt.replace(/\./g, '').replace(',', '.');
    } else {
        txt = txt.replace(/,/g, '');
    }

    const val = Number.parseFloat(txt);
    return Number.isFinite(val) ? val : null;
}

function formatCurrency(value) {
    return '₺' + value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getSectorName(sector) {
    const names = {
        bank: 'Bankacılık',
        tech: 'Teknoloji',
        energy: 'Enerji',
        aviation: 'Havacılık',
        defense: 'Savunma',
        holding: 'Holding',
        automotive: 'Otomotiv',
        retail: 'Perakende',
        other: 'Diğer'
    };
    return names[sector] || 'Diğer';
}

// ========== VERİ ÇEKME FONKSİYONLARI ==========

async function fetchGoogleSheetPriceMap() {
    const now = Date.now();
    if (sheetPriceCache.data && (now - sheetPriceCache.loadedAt) < SHEET_CACHE_TTL_MS) {
        return sheetPriceCache.data;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { 
            headers: { 'Accept': 'text/csv' },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`Google Sheet HTTP ${response.status}`);
        }

        const csv = await response.text();
        const lines = csv.split(/\r?\n/).filter(Boolean);
        const map = {};

        for (const line of lines) {
            const cols = parseCsvLine(line);
            if (!cols.length) continue;

            const symbol = normalizeSymbol(cols[0] || ''); // A sütunu
            const price = parsePriceValue(cols[4]);        // E sütunu
            const change = parsePriceValue(cols[6]);       // G sütunu
            const changePercent = parsePriceValue(cols[7]); // H sütunu

            if (!symbol || price === null) continue;

            for (const alias of buildSymbolAliases(symbol)) {
                map[alias] = { 
                    price, 
                    change: change || 0, 
                    changePercent: changePercent || 0 
                };
            }
        }

        if (!Object.keys(map).length) {
            throw new Error('Google Sheet fiyat verisi boş veya parse edilemedi');
        }

        sheetPriceCache = { data: map, loadedAt: now };
        return map;
    } catch (error) {
        console.error('CSV fetch error:', error);
        throw error;
    }
}

async function fetchGoogleSheetData(symbol) {
    const cleanSymbol = normalizeSymbol(symbol);
    const map = await fetchGoogleSheetPriceMap();
    const data = map[cleanSymbol];

    if (!data || !Number.isFinite(data.price)) {
        const aliases = buildSymbolAliases(cleanSymbol).join(', ');
        throw new Error(`Google Sheet içinde ${cleanSymbol} bulunamadı (denenen: ${aliases})`);
    }

    // Gelen veriyi logla (debug için)
    console.log(`${symbol} ham veri:`, data);

    // Değişim değerlerini kontrol et ve düzelt
    let change = data.change || 0;
    let changePercent = data.changePercent || 0;
    
    // Eğer change değeri çok büyükse (muhtemelen yüzde olarak gelmiş)
    if (Math.abs(change) > 1000 && Math.abs(changePercent) < 100) {
        console.warn(`${symbol}: change değeri çok büyük (${change}), yüzde olabilir mi?`);
        // change değeri aslında yüzde olarak gelmiş olabilir
        // Bu durumda fiyat üzerinden hesapla
        const calculatedChange = (data.price * changePercent) / 100;
        if (Math.abs(calculatedChange) < Math.abs(change)) {
            console.log(`${symbol}: change değeri düzeltildi: ${change} -> ${calculatedChange}`);
            change = calculatedChange;
        }
    }

    const sourceEl = document.getElementById('priceSource');
    if (sourceEl) sourceEl.textContent = 'Kaynak: Google Sheet (A=Symbol, E=Fiyat, G=Değişim, H=Değişim%)';

    return {
        symbol,
        price: data.price,
        previousClose: data.price - change,
        change: change,
        changePercent: changePercent,
        currency: 'TRY',
        exchange: 'BIST',
        marketState: 'LIVE',
        source: 'Google Sheet',
        timestamp: new Date().toISOString()
    };
}

async function fetchLivePriceData(symbol) {
    return await fetchGoogleSheetData(symbol);
}

async function fetchStockInfo(symbol) {
    // API entegrasyonu için hazır, şimdilik null döndürüyor
    return null;
}

// ========== PORTFÖY İŞLEMLERİ ==========

function savePortfolio() {
    try {
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        console.log('Portfolio saved:', portfolio.length, 'items');
    } catch (e) {
        console.error('Failed to save portfolio:', e);
        showToast('Kaydetme hatası');
    }
}

function groupBySymbol() {
    const grouped = {};
    portfolio.forEach(p => {
        if (!grouped[p.symbol]) {
            grouped[p.symbol] = {
                symbol: p.symbol,
                totalQuantity: 0,
                totalCost: 0,
                transactions: [],
                sector: p.sector || 'other'
            };
        }
        grouped[p.symbol].totalQuantity += p.quantity;
        grouped[p.symbol].totalCost += p.quantity * p.price;
        grouped[p.symbol].transactions.push(p);
    });

    Object.values(grouped).forEach(g => {
        g.avgPrice = g.totalCost / g.totalQuantity;
    });

    return grouped;
}

function addTransaction(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('Adding transaction...');

    const symbolInput = document.getElementById('stockSymbol');
    const quantityInput = document.getElementById('stockQuantity');
    const priceInput = document.getElementById('stockPrice');
    const dateInput = document.getElementById('stockDate');
    const sectorInput = document.getElementById('stockSector');

    if (!symbolInput || !quantityInput || !priceInput || !dateInput) {
        console.error('Form elements not found');
        showToast('Form hatası, sayfayı yenileyin');
        return;
    }

    let symbol = symbolInput.value.toUpperCase().trim();
    const quantity = Number(quantityInput.value);
    const price = Number(priceInput.value);
    const date = dateInput.value || new Date().toISOString().split('T')[0];
    const sector = sectorInput ? sectorInput.value : 'other';

    if (!symbol) {
        showToast('Hisse sembolü girin');
        return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        showToast('Geçerli bir miktar girin');
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        showToast('Geçerli bir birim fiyat girin');
        return;
    }

    const transaction = {
        id: Date.now(),
        symbol: symbol,
        quantity: quantity,
        price: price,
        date: date,
        sector: sector,
        timestamp: new Date().toISOString()
    };

    portfolio.push(transaction);
    savePortfolio();

    if (!liveData[symbol]) {
        liveData[symbol] = {
            symbol: symbol,
            price: price,
            previousClose: price,
            change: 0,
            changePercent: 0,
            isFallback: true,
            timestamp: new Date().toISOString()
        };
    }

    closeAddModal();
    showToast(`${symbol} - ${quantity} adet eklendi`);

    symbolInput.value = '';
    quantityInput.value = '';
    priceInput.value = '';
    dateInput.valueAsDate = new Date();
    if (sectorInput) sectorInput.value = 'other';

    updateUI();

    setTimeout(() => {
        updateLivePrices();
    }, 500);
}

function deletePosition(symbol) {
    if (!confirm(`${symbol} pozisyonundaki tüm işlemleri silmek istediğinize emin misiniz?`)) return;

    const initialLength = portfolio.length;
    portfolio = portfolio.filter(p => p.symbol !== symbol);

    if (portfolio.length < initialLength) {
        savePortfolio();
        updateUI();
        showToast(`${symbol} pozisyonu silindi`);
    }
}

// ========== UI GÜNCELLEME FONKSİYONLARI ==========

function updateUI() {
    try {
        updateStats();
        renderTable();
        updateCharts();
    } catch (e) {
        console.error('UI update error:', e);
    }
}

function updateStats() {
    const grouped = groupBySymbol();
    let totalValue = 0;
    let totalCost = 0;
    let totalDayChange = 0;

    Object.entries(grouped).forEach(([symbol, data]) => {
        const live = liveData[symbol];
        const currentPrice = live ? live.price : data.avgPrice;
        
        const value = data.totalQuantity * currentPrice;
        const cost = data.totalQuantity * data.avgPrice;

        totalValue += value;
        totalCost += cost;

        if (live && !live.isFallback) {
            const dayChangeForStock = live.change * data.totalQuantity;
            totalDayChange += dayChangeForStock;
            
            console.log(`${symbol}: Günlük değişim ${live.change} TL * ${data.totalQuantity} = ${dayChangeForStock.toFixed(2)} TL`);
        }
    });

    const totalChange = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0;

    const totalValueEl = document.getElementById('totalValue');
    const totalChangeEl = document.getElementById('totalChange');
    const dayChangeEl = document.getElementById('dayChange');
    const dayChangePercentEl = document.getElementById('dayChangePercent');
    const positionCountEl = document.getElementById('positionCount');

    if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);

    if (totalChangeEl) {
        totalChangeEl.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`;
        totalChangeEl.className = `mono font-bold ${totalChange >= 0 ? 'positive' : 'negative'}`;
    }

    if (dayChangeEl) {
        dayChangeEl.textContent = `${totalDayChange >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalDayChange))}`;
        dayChangeEl.className = `text-3xl font-bold mono ${totalDayChange >= 0 ? 'positive' : 'negative'}`;
    }

    if (dayChangePercentEl) {
        dayChangePercentEl.textContent = `${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`;
        dayChangePercentEl.className = `mono font-bold ${dayChangePercent >= 0 ? 'positive' : 'negative'}`;
    }

    if (positionCountEl) positionCountEl.textContent = Object.keys(grouped).length;
}

function renderTable() {
    const tbody = document.getElementById('portfolioTable');
    const emptyState = document.getElementById('emptyState');

    if (!tbody || !emptyState) return;

    const grouped = groupBySymbol();
    const searchTerm = (document.getElementById('searchInput')?.value || '').toUpperCase();
    const sortType = document.getElementById('sortSelect')?.value || 'value';

    let stocks = Object.values(grouped);

    if (searchTerm) {
        stocks = stocks.filter(s => s.symbol.includes(searchTerm));
    }

    stocks.sort((a, b) => {
        switch(sortType) {
            case 'name': return a.symbol.localeCompare(b.symbol);
            case 'value':
                const valA = a.totalQuantity * (liveData[a.symbol]?.price || a.avgPrice);
                const valB = b.totalQuantity * (liveData[b.symbol]?.price || b.avgPrice);
                return valB - valA;
            case 'change':
                const changeA = liveData[a.symbol]?.changePercent || 0;
                const changeB = liveData[b.symbol]?.changePercent || 0;
                return changeB - changeA;
            case 'date':
                const lastDateA = Math.max(...a.transactions.map(t => new Date(t.date || t.timestamp || 0).getTime()));
                const lastDateB = Math.max(...b.transactions.map(t => new Date(t.date || t.timestamp || 0).getTime()));
                return lastDateB - lastDateA;
            default: return 0;
        }
    });

    if (stocks.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    tbody.innerHTML = stocks.map(stock => {
        const live = liveData[stock.symbol];
        const currentPrice = live ? live.price : stock.avgPrice;
        const previousClose = live ? live.previousClose : stock.avgPrice;
        const currentValue = stock.totalQuantity * currentPrice;
        const costBasis = stock.totalQuantity * stock.avgPrice;
        const profit = currentValue - costBasis;
        const profitPercent = (profit / costBasis) * 100;
        const isProfit = profit >= 0;

        const dayChange = live ? live.change : 0;
        const dayChangePercent = live ? live.changePercent : 0;
        const isDayPositive = dayChange >= 0;
        const isFallback = live?.isFallback || false;

        return `
            <tr class="stock-card hover:bg-white/5 transition cursor-pointer group" data-symbol="${stock.symbol}">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center font-bold text-sm mono border border-white/10">
                            ${stock.symbol.split('.')[0].substring(0, 2)}
                        </div>
                        <div>
                            <div class="font-bold mono text-lg">${stock.symbol} ${isFallback ? '<span class="text-xs text-yellow-500 ml-1">(E)</span>' : ''}</div>
                            <div class="text-xs text-gray-500">${getSectorName(stock.sector)} ${live && !isFallback ? '• BIST' : ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-right mono">${stock.totalQuantity}</td>
                <td class="px-6 py-4 text-right mono text-gray-400">₺${stock.avgPrice.toFixed(2)}</td>
                <td class="px-6 py-4 text-right mono font-bold text-blue-400 ${live && !isFallback ? 'price-update' : ''}">
                    ₺${currentPrice.toFixed(2)}
                    ${live && !isFallback ? `<div class="text-xs text-gray-500">Dün: ₺${previousClose.toFixed(2)}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-right mono">
                    ${!isFallback ? `
                        <div class="${isDayPositive ? 'positive' : 'negative'}">
                            ${isDayPositive ? '+' : ''}${dayChange.toFixed(2)}
                        </div>
                        <div class="text-xs ${isDayPositive ? 'positive' : 'negative'} opacity-70">
                            ${isDayPositive ? '+' : ''}${dayChangePercent.toFixed(2)}%
                        </div>
                    ` : '<span class="text-gray-500 text-xs">-</span>'}
                </td>
                <td class="px-6 py-4 text-right mono font-bold">₺${currentValue.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td class="px-6 py-4 text-right">
                    <div class="mono font-bold ${isProfit ? 'positive' : 'negative'}">
                        ${isProfit ? '+' : ''}₺${profit.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                    </div>
                    <div class="text-xs ${isProfit ? 'positive' : 'negative'} opacity-70">
                        ${isProfit ? '+' : ''}${profitPercent.toFixed(2)}%
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="showStockDetail('${stock.symbol}')"
                            class="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition mr-2" title="Detay">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                    <button onclick="deletePosition('${stock.symbol}')"
                            class="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100" title="Pozisyonu sil">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== GÜNCELLEME FONKSİYONU ==========

async function updateLivePrices() {
    const btn = document.getElementById('updateBtn');
    const btnText = document.getElementById('updateBtnText');
    const icon = document.getElementById('updateIcon');
    const status = document.getElementById('updateStatus');

    if (!portfolio || portfolio.length === 0) {
        showToast('Portföy boş, önce hisse ekleyin');
        return;
    }

    if (btn.disabled) return;

    btn.disabled = true;
    btnText.textContent = 'Güncelleniyor...';
    icon.classList.add('animate-spin');
    status.textContent = 'Bağlanıyor...';
    status.className = 'text-xs text-blue-400';

    const symbols = [...new Set(portfolio.map(p => p.symbol))];
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        status.textContent = `${i+1}/${symbols.length}: ${symbol}...`;

        try {
            const data = await fetchLivePriceData(symbol);
            liveData[symbol] = data;
            successCount++;
            console.log('✓', symbol, '@', data.price.toFixed(2), 'Değişim:', data.changePercent, '%');
        } catch (error) {
            console.error('✗', symbol, error.message);
            failCount++;
            errors.push(`${symbol}: ${error.message}`);

            if (!liveData[symbol]) {
                const stock = portfolio.find(p => p.symbol === symbol);
                if (stock) {
                    liveData[symbol] = {
                        symbol: symbol,
                        price: stock.price,
                        previousClose: stock.price,
                        change: 0,
                        changePercent: 0,
                        isFallback: true,
                        timestamp: new Date().toISOString()
                    };
                }
            }
        }

        if (i < symbols.length - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    try {
        localStorage.setItem('liveData', JSON.stringify(liveData));
        localStorage.setItem('liveDataTime', Date.now().toString());
    } catch (e) {
        console.error('Failed to cache data:', e);
    }

    updateUI();

    btn.disabled = false;
    btnText.textContent = 'Fiyatları Güncelle';
    icon.classList.remove('animate-spin');

    const now = new Date();
    document.getElementById('lastUpdateTime').textContent =
        `Son güncelleme: ${now.toLocaleTimeString('tr-TR')}`;

    if (failCount === 0) {
        status.textContent = `${successCount} hisse güncellendi`;
        status.className = 'text-xs text-green-400';
        showToast(`${successCount} hisse başarıyla güncellendi`);
    } else if (successCount > 0) {
        status.textContent = `${successCount} başarılı, ${failCount} başarısız`;
        status.className = 'text-xs text-yellow-400';
        showToast(`${successCount} güncellendi, ${failCount} hata`);
        console.log('Errors:', errors);
    } else {
        status.textContent = 'Tüm güncellemeler başarısız';
        status.className = 'text-xs text-red-400';
        showToast('Güncelleme başarısız');
        console.error('All errors:', errors);
    }
}

// ========== DETAY MODAL FONKSİYONLARI ==========

async function showStockDetail(symbol) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');

    if (!modal || !content) return;

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-flex');

    content.innerHTML = `
        <div class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-gray-400">Detaylar yükleniyor...</span>
        </div>
    `;

    try {
        const grouped = groupBySymbol()[symbol];
        const live = liveData[symbol];

        if (!grouped) {
            content.innerHTML = '<div class="text-red-400">Hisse bulunamadı</div>';
            return;
        }

        let html = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-3xl font-bold mono">${symbol}</h2>
                    <p class="text-gray-400 mt-1">${symbol}</p>
                </div>
                <div class="text-right">
                    <div class="text-3xl font-bold mono text-blue-400">₺${live?.price?.toFixed(2) || grouped.avgPrice.toFixed(2)}</div>
                    ${live && !live.isFallback ? `
                        <div class="${(live.change || 0) >= 0 ? 'positive' : 'negative'}">
                            ${(live.change || 0) >= 0 ? '+' : ''}${live.change?.toFixed(2) || 0}
                            (${(live.changePercent || 0) >= 0 ? '+' : ''}${live.changePercent?.toFixed(2) || 0}%)
                        </div>
                    ` : '<span class="text-xs text-yellow-500">Eski fiyat</span>'}
                </div>
            </div>
        `;

        html += `
            <div class="glass p-4 rounded-lg mb-6">
                <h3 class="font-bold mb-3 mono">İşlem Geçmişi</h3>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                    ${grouped.transactions.map(t => `
                        <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div>
                                <div class="text-sm">${t.date}</div>
                                <div class="text-xs text-gray-500">${t.quantity} adet @ ₺${t.price.toFixed(2)}</div>
                            </div>
                            <div class="font-bold mono">₺${(t.quantity * t.price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        content.innerHTML = html;

    } catch (e) {
        content.innerHTML = `<div class="text-red-400">Hata: ${e.message}</div>`;
    }
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.add('modal-hidden');
        modal.classList.remove('modal-flex');
    }
}

// ========== MODAL FONKSİYONLARI ==========

function openAddModal() {
    console.log('Opening add modal...');
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.classList.remove('modal-hidden');
        modal.classList.add('modal-flex');
        document.body.style.overflow = 'hidden';

        const dateInput = document.getElementById('stockDate');
        if (dateInput) dateInput.valueAsDate = new Date();
    } else {
        console.error('Add modal not found');
    }
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.classList.add('modal-hidden');
        modal.classList.remove('modal-flex');
        document.body.style.overflow = '';
    }
}

// ========== CHART FONKSİYONLARI ==========

function initCharts() {
    try {
        const sectorCtx = document.getElementById('sectorChart');
        const perfCtx = document.getElementById('performanceChart');

        if (!sectorCtx || !perfCtx) return;

        if (sectorChart) sectorChart.destroy();
        if (performanceChart) performanceChart.destroy();

        sectorChart = new Chart(sectorCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }
                    }
                }
            }
        });

        performanceChart = new Chart(perfCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Getiri %',
                    data: [],
                    backgroundColor: [],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart initialization error:', e);
    }
}

function updateCharts() {
    try {
        const grouped = groupBySymbol();

        // Sector Chart
        const sectorData = {};
        Object.values(grouped).forEach(stock => {
            const live = liveData[stock.symbol];
            const value = stock.totalQuantity * (live ? live.price : stock.avgPrice);
            sectorData[stock.sector] = (sectorData[stock.sector] || 0) + value;
        });

        if (sectorChart) {
            sectorChart.data.labels = Object.keys(sectorData).map(getSectorName);
            sectorChart.data.datasets[0].data = Object.values(sectorData);
            sectorChart.update('none');
        }

        // Performance Chart
        const sortedStocks = Object.values(grouped).sort((a, b) => {
            const liveA = liveData[a.symbol];
            const liveB = liveData[b.symbol];
            const changeA = liveA && !liveA.isFallback ? ((liveA.price - a.avgPrice) / a.avgPrice) * 100 : -999;
            const changeB = liveB && !liveB.isFallback ? ((liveB.price - b.avgPrice) / b.avgPrice) * 100 : -999;
            return changeB - changeA;
        }).slice(0, 5);

        if (performanceChart) {
            performanceChart.data.labels = sortedStocks.map(s => s.symbol.split('.')[0]);
            performanceChart.data.datasets[0].data = sortedStocks.map(s => {
                const live = liveData[s.symbol];
                return live && !live.isFallback ? ((live.price - s.avgPrice) / s.avgPrice) * 100 : 0;
            });
            performanceChart.data.datasets[0].backgroundColor = sortedStocks.map(s => {
                const live = liveData[s.symbol];
                const change = live && !live.isFallback ? ((live.price - s.avgPrice) / s.avgPrice) * 100 : 0;
                return change >= 0 ? '#10b981' : '#ef4444';
            });
            performanceChart.update('none');
        }
    } catch (e) {
        console.error('Chart update error:', e);
    }
}

// ========== FİLTRELEME VE SIRALAMA ==========

function filterStocks() { 
    renderTable(); 
}

function sortStocks() { 
    renderTable(); 
}

// ========== TOAST BİLDİRİMLERİ ==========

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

// ========== VERİ DIŞA/İÇE AKTARMA ==========

function exportData() {
    const exportObj = {
        portfolio: portfolio,
        liveData: liveData,
        exportDate: new Date().toISOString(),
        version: '3.1.0'
    };

    try {
        const dataStr = JSON.stringify(exportObj, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Veriler dışa aktarıldı');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Dışa aktarma hatası');
    }
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const isValidTransaction = (item) => {
        return item &&
            typeof item.symbol === 'string' && item.symbol.trim().length > 0 &&
            Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 &&
            Number.isFinite(Number(item.price)) && Number(item.price) > 0 &&
            typeof item.date === 'string' && item.date.length > 0;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            console.log('Importing data:', data);

            let importedPortfolio = null;
            let importedLiveData = null;

            if (data.portfolio && Array.isArray(data.portfolio)) {
                importedPortfolio = data.portfolio;
                importedLiveData = data.liveData || {};
            }
            else if (Array.isArray(data)) {
                importedPortfolio = data;
            }
            else if (data.transactions && Array.isArray(data.transactions)) {
                importedPortfolio = data.transactions;
            }

            if (importedPortfolio && importedPortfolio.length > 0) {
                const sanitized = importedPortfolio
                    .filter(isValidTransaction)
                    .map(item => ({
                        id: item.id || Date.now() + Math.floor(Math.random() * 100000),
                        symbol: item.symbol.toUpperCase().trim(),
                        quantity: Number(item.quantity),
                        price: Number(item.price),
                        date: item.date,
                        sector: item.sector || 'other',
                        timestamp: item.timestamp || new Date().toISOString()
                    }));

                if (sanitized.length === 0) {
                    alert('Geçerli işlem bulunamadı');
                    return;
                }

                portfolio = sanitized;
                if (importedLiveData) liveData = importedLiveData;

                savePortfolio();
                localStorage.setItem('liveData', JSON.stringify(liveData));
                updateUI();
                showToast(`${portfolio.length} işlem içe aktarıldı`);
                console.log('Import successful:', portfolio.length, 'items');
            } else {
                alert('Geçersiz veya boş dosya formatı');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Dosya okuma hatası: ' + err.message);
        }

        input.value = '';
    };

    reader.onerror = (e) => {
        console.error('File read error:', e);
        alert('Dosya okunamadı');
        input.value = '';
    };

    reader.readAsText(file);
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Portfolio Terminal...');

    // Load portfolio
    const saved = localStorage.getItem('portfolio');
    if (saved) {
        try {
            portfolio = JSON.parse(saved);
            console.log('Loaded portfolio:', portfolio.length, 'items');
        } catch (e) {
            console.error('Failed to load portfolio:', e);
            portfolio = [];
        }
    }

    // Load cached live data
    const cached = localStorage.getItem('liveData');
    const cachedTime = localStorage.getItem('liveDataTime');
    if (cached && cachedTime) {
        try {
            const age = Date.now() - parseInt(cachedTime);
            if (age < 300000) {
                liveData = JSON.parse(cached);
                console.log('Loaded cached live data');
                document.getElementById('lastUpdateTime').textContent =
                    `Son güncelleme: ${new Date(parseInt(cachedTime)).toLocaleTimeString('tr-TR')}`;
            }
        } catch (e) {
            console.error('Failed to load cached data:', e);
        }
    }

    // Set default date
    const dateInput = document.getElementById('stockDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Initialize charts and UI
    initCharts();
    updateUI();

    console.log('Initialization complete');
    console.log('Price data source: Google Sheet CSV (A=Symbol, E=Fiyat, G=Değişim Miktarı, H=Değişim Yüzdesi)');
});

// ========== EVENT LISTENERS ==========

document.addEventListener('click', (e) => {
    const addModal = document.getElementById('addModal');
    const detailModal = document.getElementById('detailModal');

    if (e.target === addModal) closeAddModal();
    if (e.target === detailModal) closeDetailModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddModal();
        closeDetailModal();
    }
});
