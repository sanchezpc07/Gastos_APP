import { supabase, getCurrentUser, formatCurrency, showToast } from './app.js';

let user = null;
let mainChart = null;
let pieChart = null;

async function init() {
    user = await getCurrentUser();
    if (!user) {
        window.location.href = './auth.html';
        return;
    }

    document.getElementById('user-welcome').innerText = `Hola, ${user.profile.nombre || user.email}`;
    document.getElementById('user-avatar').innerText = (user.profile.nombre || user.email).charAt(0).toUpperCase();

    if (user.profile.rol === 'admin') {
        document.getElementById('admin-link').style.display = 'flex';
        loadUsers();
    }

    loadDashboardStats();
    loadRecentMovements();
    loadCategoriesForSelects();

    // Listeners
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = './auth.html';
    });

    window.addEventListener('sectionChanged', (e) => {
        if (e.detail === 'dashboard') loadDashboardStats();
        if (e.detail === 'movimientos') loadMovements();
        if (e.detail === 'categorias') loadCategories();
        if (e.detail === 'admin') loadUsers();
    });
}

async function loadDashboardStats() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: movements } = await supabase
        .from('movimientos')
        .select('*, categorias(nombre)')
        .gte('fecha', firstDay);

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    movements?.forEach(m => {
        const val = parseFloat(m.valor);
        if (m.tipo === 'ingreso') income += val;
        else {
            expense += val;
            categoryTotals[m.categorias.nombre] = (categoryTotals[m.categorias.nombre] || 0) + val;
        }
    });

    document.getElementById('stats-income').innerText = formatCurrency(income);
    document.getElementById('stats-expense').innerText = formatCurrency(expense);
    document.getElementById('stats-balance').innerText = formatCurrency(income - expense);
    
    const daysInMonth = now.getDate();
    document.getElementById('stats-avg').innerText = formatCurrency(expense / daysInMonth);

    updateCharts(movements, categoryTotals);
}

function updateCharts(movements, categoryTotals) {
    const ctxMain = document.getElementById('mainChart').getContext('2d');
    const ctxPie = document.getElementById('pieChart').getContext('2d');

    // Destroy existing
    if (mainChart) mainChart.destroy();
    if (pieChart) pieChart.destroy();

    // Main Chart (Daily evolution)
    const dailyData = {};
    movements.forEach(m => {
        const d = new Date(m.fecha).getDate();
        if (!dailyData[d]) dailyData[d] = { income: 0, expense: 0 };
        if (m.tipo === 'ingreso') dailyData[d].income += parseFloat(m.valor);
        else dailyData[d].expense += parseFloat(m.valor);
    });

    const labels = Object.keys(dailyData).sort((a,b) => a-b);
    
    mainChart = new Chart(ctxMain, {
        type: 'line',
        data: {
            labels: labels.map(l => `Día ${l}`),
            datasets: [
                {
                    label: 'Ingresos',
                    data: labels.map(l => dailyData[l].income),
                    borderColor: '#10b981',
                    tension: 0.3
                },
                {
                    label: 'Egresos',
                    data: labels.map(l => dailyData[l].expense),
                    borderColor: '#ef4444',
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, MaintainAspectRatio: false }
    });

    // Pie Chart
    pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            }]
        }
    });
}

async function loadRecentMovements() {
    const { data } = await supabase
        .from('movimientos')
        .select('*, categorias(nombre)')
        .order('fecha', { ascending: false })
        .limit(5);

    const tbody = document.querySelector('#recent-table tbody');
    tbody.innerHTML = '';
    data?.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.fecha}</td>
                <td><span style="color: ${m.tipo === 'ingreso' ? 'var(--secondary)' : 'var(--danger)'}">${m.tipo.toUpperCase()}</span></td>
                <td>${m.categorias.nombre}</td>
                <td>${m.descripcion}</td>
                <td>${formatCurrency(m.valor)}</td>
            </tr>
        `;
    });
}

// Global exposure for UI
window.loadCategoriesForSelects = async () => {
    const { data } = await supabase
        .from('categorias')
        .select('*');
    
    const selects = [document.getElementById('filter-categoria'), document.getElementById('mov-categoria')];
    selects.forEach(s => {
        if (!s) return;
        const currentVal = s.value;
        s.innerHTML = s.id === 'filter-categoria' ? '<option value="">Todas las categorías</option>' : '';
        data?.forEach(c => {
            s.innerHTML += `<option value="${c.id}">${c.nombre} (${c.tipo})</option>`;
        });
        s.value = currentVal;
    });
};

init();

// Placeholder for other section loaders
async function loadMovements() { /* implementation in movimientos.js */ }
async function loadCategories() { /* implementation in categorias.js */ }
async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*');
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    data?.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.nombre || 'N/A'}</td>
                <td>${u.email}</td>
                <td>${u.rol}</td>
                <td>${u.activo ? '✅ Activo' : '❌ Inactivo'}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem;" onclick="toggleUserStatus('${u.id}', ${u.activo})">
                        ${u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    });
}
window.toggleUserStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ activo: !currentStatus }).eq('id', id);
    if (!error) {
        showToast(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`, 'success');
        loadUsers();
    } else {
        showToast(error.message, 'error');
    }
};
