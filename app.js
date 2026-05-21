lucide.createIcons();

const API_LEADS = '/api/leads';
const API_FINANCE = '/api/finance';
const API_GOALS = '/api/goals';

let leadsData = [];
let financeData = [];
let goalsData = {};

// Chart instances
let leadsChartInstance = null;
let financeChartInstance = null;
let customGrowthChartInstance = null;

// DOM - Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// DOM - Leads
const recentLeadsBody = document.getElementById('recent-leads-body');
const leadsTableBody = document.getElementById('leads-table-body');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');

// DOM - Finance
const financeTableBody = document.getElementById('finance-table-body');
const financeModal = document.getElementById('finance-modal');
const financeForm = document.getElementById('finance-form');

// DOM - Goals
const goalMonthSelect = document.getElementById('goal-month-select');
const goalTargetInput = document.getElementById('goal-target-input');
const saveGoalBtn = document.getElementById('save-goal-btn');
const goalTrackerSubtitle = document.getElementById('goal-tracker-subtitle');
const goalRemaining = document.getElementById('goal-remaining');
const goalProgressBar = document.getElementById('goal-progress-bar');
const goalPercent = document.getElementById('goal-percent');
const goalCurrent = document.getElementById('goal-current');
const goalTarget = document.getElementById('goal-target');

const finAvgTicket = document.getElementById('fin-avg-ticket');
const leadsConversion = document.getElementById('leads-conversion');
const leadsConversionRatio = document.getElementById('leads-conversion-ratio');
const leadsCompletedCount = document.getElementById('leads-completed-count');

const growthPeriodSelect = document.getElementById('growth-period-select');
const growthMetricSelect = document.getElementById('growth-metric-select');
const growthStartDate = document.getElementById('growth-start-date');
const growthEndDate = document.getElementById('growth-end-date');

// DOM - Reports KPIs
const repLeadsCount = document.getElementById('rep-leads-count');
const repSalesCount = document.getElementById('rep-sales-count');
const repConversionRate = document.getElementById('rep-conversion-rate');
const repAvgTicket = document.getElementById('rep-avg-ticket');
const leadsChartViewSelect = document.getElementById('leads-chart-view-select');

// Set current month in goals input as default
const today = new Date();
const currentYYYYMM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
if (goalMonthSelect) goalMonthSelect.value = currentYYYYMM;

// --- TABS LOGIC ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.getAttribute('data-tab');
        switchTab(tabId);
    });
});

function switchTab(tabId) {
    navItems.forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if(activeNav) activeNav.classList.add('active');

    tabContents.forEach(tab => tab.style.display = 'none');
    const activeTab = document.getElementById(tabId);
    if(activeTab) activeTab.style.display = 'block';

    // Switch tab hooks
    if(tabId === 'reports') {
        setTimeout(renderReports, 100);
    } else if(tabId === 'goals') {
        setTimeout(renderGoals, 100);
    }
}

// --- DATA FETCHING ---
async function fetchAllData() {
    try {
        const [resLeads, resFinance, resGoals] = await Promise.all([
            fetch(API_LEADS),
            fetch(API_FINANCE),
            fetch(API_GOALS)
        ]);
        leadsData = await resLeads.json();
        financeData = await resFinance.json();
        goalsData = await resGoals.json();

        renderLeads();
        renderFinance();
        
        // Active tab rendering updates
        const activeTab = document.querySelector('.tab-content:not([style*="display: none"])');
        if(activeTab) {
            if(activeTab.id === 'reports') renderReports();
            if(activeTab.id === 'goals') renderGoals();
        }
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
    }
}

// --- LEADS LOGIC ---
function renderLeads() {
    updateKPIs();
    
    // Render Recent (max 5)
    recentLeadsBody.innerHTML = '';
    const recent = leadsData.slice(0, 5);
    recent.forEach(lead => {
        recentLeadsBody.appendChild(createLeadRow(lead, true));
    });

    // Render All
    handleSearch();
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    const filtered = leadsData.filter(lead => 
        lead.name.toLowerCase().includes(query) || 
        lead.phone.toLowerCase().includes(query) || 
        lead.device.toLowerCase().includes(query)
    );

    leadsTableBody.innerHTML = '';
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        leadsTableBody.parentElement.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        leadsTableBody.parentElement.style.display = 'table';
        filtered.forEach(lead => {
            leadsTableBody.appendChild(createLeadRow(lead, false));
        });
    }
    lucide.createIcons();
}

function createLeadRow(lead, isRecent) {
    const row = document.createElement('tr');
    const statusMap = {
        'pending': { label: 'Aguardando', class: 'pending' },
        'contacted': { label: 'Em Contato', class: 'contacted' },
        'completed': { label: 'Concluído', class: 'completed' },
        'failed': { label: 'Não Concluiu', class: 'failed' }
    };
    const currentStatus = statusMap[lead.status] || statusMap['pending'];
    const waPhone = lead.phone.replace(/\D/g, '');
    const waLink = `https://wa.me/55${waPhone}?text=Olá%20${encodeURIComponent(lead.name)},%20recebemos%20sua%20solicitação%20de%20blindagem%20KRYPTON!`;

    if (isRecent) {
        row.innerHTML = `
            <td>${formatDate(lead.createdAt)}</td>
            <td style="font-weight: 500;">${lead.name}</td>
            <td><a href="${waLink}" target="_blank" class="whatsapp-link"><i data-lucide="message-circle" style="width:16px; height:16px;"></i> ${lead.phone}</a></td>
            <td>${lead.device}</td>
            <td><div class="status-badge ${currentStatus.class}"><div class="status-dot-small"></div>${currentStatus.label}</div></td>
        `;
    } else {
        row.innerHTML = `
            <td>${formatDate(lead.createdAt)}</td>
            <td style="font-weight: 500;">${lead.name}</td>
            <td><a href="${waLink}" target="_blank" class="whatsapp-link"><i data-lucide="message-circle" style="width:16px; height:16px;"></i> ${lead.phone}</a></td>
            <td>${lead.device}</td>
            <td>${lead.service_type === 'local' ? 'No Local' : 'Retirada'}</td>
            <td><div class="status-badge ${currentStatus.class}"><div class="status-dot-small"></div>${currentStatus.label}</div></td>
            <td>
                <div style="display:flex; align-items:center;">
                    <select class="action-select" onchange="updateStatus('${lead.id}', this.value)" style="${lead.status === 'failed' ? 'color: #ef4444; border-color: rgba(239, 68, 68, 0.4);' : ''}">
                        <option value="pending" ${lead.status === 'pending' ? 'selected' : ''}>Aguardando</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Em Contato</option>
                        <option value="completed" ${lead.status === 'completed' ? 'selected' : ''}>Concluído</option>
                        <option value="failed" ${lead.status === 'failed' ? 'selected' : ''} style="color: #ef4444; font-weight: 600;">Não Concluiu</option>
                    </select>
                    <button class="btn-delete" onclick="deleteLead('${lead.id}')"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>
                </div>
            </td>
        `;
    }
    return row;
}

function updateKPIs() {
    document.getElementById('kpi-total').textContent = leadsData.length;
    document.getElementById('kpi-pending').textContent = leadsData.filter(l => l.status === 'pending').length;
    document.getElementById('kpi-contacted').textContent = leadsData.filter(l => l.status === 'contacted').length;
    document.getElementById('kpi-completed').textContent = leadsData.filter(l => l.status === 'completed').length;
}

async function updateStatus(id, newStatus) {
    await fetch(`${API_LEADS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    fetchAllData();
}

async function deleteLead(id) {
    if(!confirm('Excluir lead?')) return;
    await fetch(`${API_LEADS}/${id}`, { method: 'DELETE' });
    fetchAllData();
}

// --- FINANCE LOGIC ---
function renderFinance() {
    financeTableBody.innerHTML = '';
    
    let totalIncome = 0;
    let totalExpense = 0;

    financeData.forEach(tx => {
        if(tx.type === 'income') totalIncome += tx.amount;
        if(tx.type === 'expense') totalExpense += tx.amount;

        const row = document.createElement('tr');
        const isIncome = tx.type === 'income';
        
        row.innerHTML = `
            <td>${formatDate(tx.date).split(' ')[0]}</td>
            <td style="font-weight:500;">${tx.description}</td>
            <td>${tx.method}</td>
            <td><span class="${isIncome ? 'badge-income' : 'badge-expense'}">${isIncome ? 'Entrada' : 'Saída'}</span></td>
            <td style="text-align: right; font-weight: 600; color: ${isIncome ? '#10b981' : '#ef4444'}">
                ${isIncome ? '+' : '-'} R$ ${tx.amount.toFixed(2).replace('.', ',')}
            </td>
            <td style="text-align: center;">
                <button class="btn-delete" onclick="deleteFinance('${tx.id}')"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>
            </td>
        `;
        financeTableBody.appendChild(row);
    });

    const profit = totalIncome - totalExpense;
    document.getElementById('fin-income').textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
    document.getElementById('fin-expense').textContent = `R$ ${totalExpense.toFixed(2).replace('.', ',')}`;
    document.getElementById('fin-profit').textContent = `R$ ${profit.toFixed(2).replace('.', ',')}`;
    
    lucide.createIcons();
}

function openFinanceModal() { financeModal.style.display = 'flex'; }
function closeFinanceModal() { financeModal.style.display = 'none'; financeForm.reset(); }

financeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        type: document.querySelector('input[name="fin_type"]:checked').value,
        description: document.getElementById('fin_desc').value,
        amount: parseFloat(document.getElementById('fin_amount').value),
        method: document.getElementById('fin_method').value
    };

    const res = await fetch(API_FINANCE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        closeFinanceModal();
        fetchAllData();
    } else {
        alert('Erro ao salvar registro.');
    }
});

async function deleteFinance(id) {
    if(!confirm('Excluir transação financeira?')) return;
    await fetch(`${API_FINANCE}/${id}`, { method: 'DELETE' });
    fetchAllData();
}

// --- MANUAL LEAD REGISTRATION MODAL LOGIC ---
function openLeadModal() {
    const leadModal = document.getElementById('lead-modal');
    if (leadModal) leadModal.style.display = 'flex';
}

function closeLeadModal() {
    const leadModal = document.getElementById('lead-modal');
    const leadForm = document.getElementById('lead-form');
    if (leadModal) leadModal.style.display = 'none';
    if (leadForm) leadForm.reset();
}

const leadFormElement = document.getElementById('lead-form');
if (leadFormElement) {
    leadFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('lead_name').value,
            phone: document.getElementById('lead_phone').value,
            device: document.getElementById('lead_device').value,
            city: document.getElementById('lead_city').value,
            service_type: document.getElementById('lead_service_type').value,
            status: document.getElementById('lead_status').value
        };

        const res = await fetch(API_LEADS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeLeadModal();
            fetchAllData();
        } else {
            alert('Erro ao salvar o lead.');
        }
    });
}

// --- REPORTS LOGIC (CHART.JS) ---
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function renderReports() {
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Performance Operational KPIs Calculations for current month
    const currentMonthLeads = leadsData.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    }).length;

    const currentMonthCompletedLeads = leadsData.filter(l => {
        const d = new Date(l.createdAt);
        return l.status === 'completed' && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    }).length;

    const currentMonthRevenue = financeData.filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    }).reduce((sum, t) => sum + t.amount, 0);

    const conversionRateVal = currentMonthLeads === 0 ? 0 : (currentMonthCompletedLeads / currentMonthLeads) * 100;
    const avgTicketVal = currentMonthCompletedLeads === 0 ? 0 : (currentMonthRevenue / currentMonthCompletedLeads);

    if (repLeadsCount) repLeadsCount.textContent = currentMonthLeads;
    if (repSalesCount) repSalesCount.textContent = currentMonthCompletedLeads;
    if (repConversionRate) repConversionRate.textContent = `${conversionRateVal.toFixed(1).replace('.', ',')}%`;
    if (repAvgTicket) repAvgTicket.textContent = `R$ ${avgTicketVal.toFixed(2).replace('.', ',')}`;

    // Chart 1: Leads
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            label: monthNames[d.getMonth()]
        });
    }

    let leadsChartData = [];
    let leadsChartLabels = [];
    let leadsChartLabelText = '';
    let leadsChartBgColor = '';
    let leadsChartBorderColor = '';

    const viewType = leadsChartViewSelect ? leadsChartViewSelect.value : 'monthly';

    if (viewType === 'weekly') {
        leadsChartLabelText = `Leads por Semana (${monthNames[currentMonthIdx]})`;
        leadsChartBgColor = 'rgba(16, 185, 129, 0.4)';
        leadsChartBorderColor = '#10b981';

        const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
        const weeks = [
            { name: 'Sem. 1', start: 1, end: 7 },
            { name: 'Sem. 2', start: 8, end: 14 },
            { name: 'Sem. 3', start: 15, end: 21 },
            { name: 'Sem. 4', start: 22, end: 28 }
        ];
        if (daysInMonth > 28) {
            weeks.push({ name: 'Sem. 5', start: 29, end: daysInMonth });
        }
        
        leadsChartLabels = weeks.map(w => w.name);
        leadsChartData = weeks.map(w => {
            return leadsData.filter(l => {
                const d = new Date(l.createdAt);
                const day = d.getDate();
                return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear && day >= w.start && day <= w.end;
            }).length;
        });
    } else {
        leadsChartLabelText = 'Cadastros (Leads / Mês)';
        leadsChartBgColor = 'rgba(0, 240, 255, 0.4)';
        leadsChartBorderColor = '#00f0ff';
        
        leadsChartLabels = last6Months.map(m => m.label);
        leadsChartData = last6Months.map(m => {
            return leadsData.filter(l => {
                const d = new Date(l.createdAt);
                return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
            }).length;
        });
    }

    if(leadsChartInstance) leadsChartInstance.destroy();
    const ctxLeads = document.getElementById('leadsChart').getContext('2d');
    leadsChartInstance = new Chart(ctxLeads, {
        type: 'bar',
        data: {
            labels: leadsChartLabels,
            datasets: [{
                label: leadsChartLabelText,
                data: leadsChartData,
                backgroundColor: leadsChartBgColor,
                borderColor: leadsChartBorderColor,
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', precision: 0 } }
            }
        }
    });

    // Chart 2: Finance
    const financeRevenueMonthly = last6Months.map(m => {
        return financeData.filter(t => {
            const d = new Date(t.date);
            return t.type === 'income' && d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
        }).reduce((sum, t) => sum + t.amount, 0);
    });

    const financeExpenseMonthly = last6Months.map(m => {
        return financeData.filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
        }).reduce((sum, t) => sum + t.amount, 0);
    });

    const financeProfitMonthly = financeRevenueMonthly.map((rev, idx) => rev - financeExpenseMonthly[idx]);
    const leadsLabels = last6Months.map(m => m.label);

    if(financeChartInstance) financeChartInstance.destroy();
    const ctxFinance = document.getElementById('financeChart').getContext('2d');
    financeChartInstance = new Chart(ctxFinance, {
        type: 'line',
        data: {
            labels: leadsLabels,
            datasets: [
                {
                    label: 'Faturamento',
                    data: financeRevenueMonthly,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Despesas',
                    data: financeExpenseMonthly,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Lucro Líquido',
                    data: financeProfitMonthly,
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.03)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { labels: { color: '#fff' } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
                        }
                    } 
                }
            }
        }
    });

    // --- Relatório por Cidade ---
    const getLeadRevenue = (lead) => {
        if (lead.status !== 'completed') return 0;
        const tx = financeData.find(t => 
            t.type === 'income' && 
            (t.description.toLowerCase().includes(lead.name.toLowerCase()) || 
             t.description.toLowerCase().includes(lead.device.toLowerCase()))
        );
        return tx ? tx.amount : 250;
    };

    const cities = ["Cruz", "Bela Cruz", "Marco"];
    const cityData = cities.map(city => {
        const cityLeads = leadsData.filter(l => l.city === city);
        const totalLeads = cityLeads.length;
        const completedLeads = cityLeads.filter(l => l.status === 'completed').length;
        const conversionRate = totalLeads === 0 ? 0 : (completedLeads / totalLeads) * 100;
        const faturamento = cityLeads.reduce((sum, l) => sum + getLeadRevenue(l), 0);
        return { city, totalLeads, completedLeads, conversionRate, faturamento };
    });

    const cityCardsGrid = document.getElementById('city-cards-grid');
    if (cityCardsGrid) {
        cityCardsGrid.innerHTML = '';
        cityData.sort((a, b) => b.faturamento - a.faturamento);
        
        cityData.forEach(c => {
            const card = document.createElement('div');
            card.className = 'kpi-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            card.style.padding = '24px';
            card.style.background = 'rgba(255, 255, 255, 0.03)';
            card.style.border = '1px solid rgba(255, 255, 255, 0.06)';
            card.style.borderRadius = '16px';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            
            let accentColor = '#00f0ff';
            if (c.city === 'Marco') accentColor = '#10b981';
            if (c.city === 'Bela Cruz') accentColor = '#fbbf24';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h4 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0;">${c.city}</h4>
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Região KRYPTON</span>
                    </div>
                    <span style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; color: ${accentColor};">
                        📍 Ativo
                    </span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;"><i data-lucide="users" style="width: 15px; height: 15px;"></i> Captados</span>
                        <span style="font-size: 15px; font-weight: 600; color: #fff;">${c.totalLeads} Leads</span>
                    </div>
                    
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;"><i data-lucide="percent" style="width: 15px; height: 15px;"></i> Conversão</span>
                            <span style="font-size: 14px; font-weight: 600; color: ${accentColor};">${c.conversionRate.toFixed(1).replace('.', ',')}%</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden; width: 100%;">
                            <div style="background: ${accentColor}; width: ${c.conversionRate}%; height: 100%; border-radius: 3px; transition: width 0.4s ease;"></div>
                        </div>
                        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px; text-align: right;">${c.completedLeads} de ${c.totalLeads} fecharam</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;"><i data-lucide="trending-up" style="width: 15px; height: 15px;"></i> Receita</span>
                        <span style="font-size: 16px; font-weight: 700; color: #10b981;">R$ ${c.faturamento.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            `;
            cityCardsGrid.appendChild(card);
        });
        lucide.createIcons();
    }
}

function updateGrowthCard(elementId, val) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const isPositive = val >= 0;
    el.textContent = `${isPositive ? '+' : ''}${val.toFixed(1).replace('.', ',')}%`;
    el.className = isPositive ? 'kpi-value text-green' : 'kpi-value text-red';
}

// --- METAS & PERFORMANCE LOGIC ---
if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', async () => {
        const month = goalMonthSelect.value;
        const target = parseFloat(goalTargetInput.value);
        if (!month || isNaN(target)) return alert('Preencha os campos corretamente.');

        const res = await fetch(API_GOALS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, target })
        });

        if (res.ok) {
            goalsData = (await res.json()).goals;
            renderGoals();
            alert('Meta definida com sucesso!');
        } else {
            alert('Erro ao salvar meta.');
        }
    });
}

if (goalMonthSelect) {
    goalMonthSelect.addEventListener('change', renderGoals);
}

function renderGoals() {
    const selectedMonthStr = goalMonthSelect.value; // YYYY-MM
    if(!selectedMonthStr) return;

    const [year, month] = selectedMonthStr.split('-').map(Number);
    const monthIndex = month - 1;

    // --- 1. Acompanhamento de Meta ---
    const targetVal = goalsData[selectedMonthStr] || 0;
    
    // Calculate current revenue for this specific month
    const currentMonthRevenue = financeData.filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === monthIndex && d.getFullYear() === year;
    }).reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, targetVal - currentMonthRevenue);
    const percent = targetVal === 0 ? 0 : Math.min(100, (currentMonthRevenue / targetVal) * 100);

    // Update Meta Tracker visual components
    goalTrackerSubtitle.textContent = `Acompanhamento para ${monthNames[monthIndex]} de ${year}`;
    goalRemaining.textContent = `R$ ${remaining.toFixed(2).replace('.', ',')}`;
    goalProgressBar.style.width = `${percent}%`;
    goalPercent.textContent = `${percent.toFixed(1).replace('.', ',')}%`;
    goalCurrent.textContent = `R$ ${currentMonthRevenue.toFixed(2).replace('.', ',')}`;
    goalTarget.textContent = `R$ ${targetVal.toFixed(2).replace('.', ',')}`;

    // --- 2. Dynamic Custom Growth Chart ---
    renderCustomGrowthChart();
}

// Custom growth chart event listeners
if (growthPeriodSelect) growthPeriodSelect.addEventListener('change', renderCustomGrowthChart);
if (growthMetricSelect) growthMetricSelect.addEventListener('change', renderCustomGrowthChart);
if (growthStartDate) growthStartDate.addEventListener('change', renderCustomGrowthChart);
if (growthEndDate) growthEndDate.addEventListener('change', renderCustomGrowthChart);
if (leadsChartViewSelect) leadsChartViewSelect.addEventListener('change', renderReports);

function renderCustomGrowthChart() {
    const selectedMonthStr = goalMonthSelect.value || currentYYYYMM;
    const [year, month] = selectedMonthStr.split('-').map(Number);
    const monthIndex = month - 1;

    const period = growthPeriodSelect.value; // daily, weekly, monthly
    const metric = growthMetricSelect.value; // all, revenue, profit, completed_leads

    let labels = [];
    let labelText = '';
    let datasets = [];

    const customDateRangeContainer = document.getElementById('custom-date-range-container');
    if (period === 'daily') {
        if (customDateRangeContainer) customDateRangeContainer.style.display = 'flex';
        
        if (growthStartDate && !growthStartDate.value) {
            const firstDay = new Date(year, monthIndex, 1);
            growthStartDate.value = firstDay.toISOString().split('T')[0];
        }
        if (growthEndDate && !growthEndDate.value) {
            const lastDay = new Date(year, monthIndex + 1, 0);
            growthEndDate.value = lastDay.toISOString().split('T')[0];
        }
    } else {
        if (customDateRangeContainer) customDateRangeContainer.style.display = 'none';
    }

    // Gather ranges
    let ranges = [];
    if (period === 'daily') {
        const startVal = growthStartDate ? growthStartDate.value : '';
        const endVal = growthEndDate ? growthEndDate.value : '';
        
        if (startVal && endVal) {
            const start = new Date(startVal + 'T00:00:00');
            const end = new Date(endVal + 'T23:59:59');
            
            let current = new Date(start);
            while (current <= end) {
                const currentDayLabel = `${current.getDate()} ${monthNames[current.getMonth()]}`;
                labels.push(currentDayLabel);
                ranges.push({
                    start: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0),
                    end: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59)
                });
                current.setDate(current.getDate() + 1);
            }
            
            const formatDateString = (dateStr) => {
                if (!dateStr) return '';
                const [y, m, d] = dateStr.split('-');
                return `${d}/${m}/${y}`;
            };
            labelText = `Evolução Diária (${formatDateString(startVal)} a ${formatDateString(endVal)})`;
        } else {
            labelText = 'Evolução Diária';
        }
    } else if (period === 'weekly') {
        labelText = `Evolução Semanal (${monthNames[monthIndex]})`;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const weekWeeks = [
            { startDay: 1, endDay: 7, name: 'Semana 1' },
            { startDay: 8, endDay: 14, name: 'Semana 2' },
            { startDay: 15, endDay: 21, name: 'Semana 3' },
            { startDay: 22, endDay: 28, name: 'Semana 4' }
        ];
        if (daysInMonth > 28) {
            weekWeeks.push({ startDay: 29, endDay: daysInMonth, name: 'Semana 5' });
        }
        weekWeeks.forEach(w => {
            labels.push(w.name);
            ranges.push({
                start: new Date(year, monthIndex, w.startDay, 0, 0, 0),
                end: new Date(year, monthIndex, w.endDay, 23, 59, 59)
            });
        });
    } else if (period === 'monthly') {
        labelText = 'Evolução por Meses';
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                label: monthNames[d.getMonth()]
            });
        }
        labels = last6Months.map(m => m.label);
        ranges = last6Months.map(m => ({
            start: new Date(m.year, m.monthIndex, 1, 0, 0, 0),
            end: new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59)
        }));
    }

    // Calculate sums for active chart period to render in dynamic cards
    const sumRevenue = ranges.reduce((sum, r) => sum + getMetricValueForRange(r.start, r.end, 'revenue'), 0);
    const sumExpense = ranges.reduce((sum, r) => sum + getMetricValueForRange(r.start, r.end, 'expense'), 0);
    const sumProfit = sumRevenue - sumExpense;

    const chartSumRevenue = document.getElementById('chart-sum-revenue');
    const chartSumExpense = document.getElementById('chart-sum-expense');
    const chartSumProfit = document.getElementById('chart-sum-profit');
    
    if (chartSumRevenue) chartSumRevenue.textContent = `R$ ${sumRevenue.toFixed(2).replace('.', ',')}`;
    if (chartSumExpense) chartSumExpense.textContent = `R$ ${sumExpense.toFixed(2).replace('.', ',')}`;
    if (chartSumProfit) chartSumProfit.textContent = `R$ ${sumProfit.toFixed(2).replace('.', ',')}`;

    const getSeriesData = (m) => {
        return ranges.map(r => getMetricValueForRange(r.start, r.end, m));
    };

    if (metric === 'all') {
        datasets = [
            {
                label: 'Faturamento (R$)',
                data: getSeriesData('revenue'),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                tension: 0.3,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#10b981',
                yAxisID: 'y'
            },
            {
                label: 'Despesas (R$)',
                data: getSeriesData('expense'),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                tension: 0.3,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#ef4444',
                yAxisID: 'y'
            },
            {
                label: 'Lucro Líquido (R$)',
                data: getSeriesData('profit'),
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.03)',
                tension: 0.3,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#00f0ff',
                yAxisID: 'y'
            }
        ];
    } else {
        let colorTheme = '#00f0ff';
        let gradientBg = 'rgba(0, 240, 255, 0.1)';
        let seriesLabel = '';
        if (metric === 'revenue') {
            colorTheme = '#10b981';
            gradientBg = 'rgba(16, 185, 129, 0.1)';
            seriesLabel = 'Faturamento (R$)';
        } else if (metric === 'expense') {
            colorTheme = '#ef4444';
            gradientBg = 'rgba(239, 68, 68, 0.1)';
            seriesLabel = 'Despesas (R$)';
        } else if (metric === 'profit') {
            colorTheme = '#00f0ff';
            gradientBg = 'rgba(0, 240, 255, 0.1)';
            seriesLabel = 'Lucro Líquido (R$)';
        }

        datasets = [{
            label: seriesLabel,
            data: getSeriesData(metric),
            borderColor: colorTheme,
            backgroundColor: gradientBg,
            tension: 0.3,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: colorTheme,
            pointRadius: 4,
            yAxisID: 'y'
        }];
    }

    if (customGrowthChartInstance) customGrowthChartInstance.destroy();
    const ctxCustom = document.getElementById('customGrowthChart').getContext('2d');
    
    const scales = {
        x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
        y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af' }
        }
    };

    customGrowthChartInstance = new Chart(ctxCustom, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: scales
        }
    });
}

function getMetricValueForRange(startDate, endDate, metric) {
    if (metric === 'revenue') {
        return financeData.filter(t => {
            const d = new Date(t.date);
            return t.type === 'income' && d >= startDate && d <= endDate;
        }).reduce((sum, t) => sum + t.amount, 0);

    } else if (metric === 'profit') {
        const income = financeData.filter(t => {
            const d = new Date(t.date);
            return t.type === 'income' && d >= startDate && d <= endDate;
        }).reduce((sum, t) => sum + t.amount, 0);

        const expense = financeData.filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && d >= startDate && d <= endDate;
        }).reduce((sum, t) => sum + t.amount, 0);

        return income - expense;

    } else if (metric === 'completed_leads') {
        return leadsData.filter(l => {
            const d = new Date(l.createdAt);
            return l.status === 'completed' && d >= startDate && d <= endDate;
        }).length;
    }
    return 0;
}

// Utils
function formatDate(isoString) {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
}

// Init
searchInput.addEventListener('input', handleSearch);
if(document.getElementById('refresh-leads-btn')) {
    document.getElementById('refresh-leads-btn').addEventListener('click', fetchAllData);
}

fetchAllData();
setInterval(fetchAllData, 30000);

// --- MOBILE SIDEBAR MENU TOGGLING ---
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (sidebar && sidebarOverlay) {
    const openSidebar = () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent page scroll when sidebar is open
    };
    
    const closeSidebar = () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore page scroll
    };

    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Close sidebar on click of any nav menu item
    const navItemsList = document.querySelectorAll('.nav-menu .nav-item');
    navItemsList.forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
}

