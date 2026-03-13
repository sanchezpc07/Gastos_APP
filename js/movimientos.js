import { supabase, formatCurrency, showToast } from './app.js';

const movForm = document.getElementById('movimiento-form');
const movTable = document.querySelector('#movimientos-table tbody');

movForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('movimiento-id').value;
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
        usuario_id: user.id,
        tipo: document.getElementById('mov-tipo').value,
        categoria_id: document.getElementById('mov-categoria').value,
        descripcion: document.getElementById('mov-descripcion').value,
        valor: document.getElementById('mov-valor').value,
        fecha: document.getElementById('mov-fecha').value
    };

    try {
        if (id) {
            const { error } = await supabase.from('movimientos').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('movimientos').insert([payload]);
            if (error) throw error;
        }
        
        closeModal('movimiento-modal');
        movForm.reset();
        loadMovements();
        showToast('Movimiento guardado', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Expose these globally since they are called from HTML
window.loadMovements = async () => {
    let query = supabase.from('movimientos').select('*, categorias(nombre)').order('fecha', { ascending: false });

    // Filters
    const start = document.getElementById('filter-date-start').value;
    const end = document.getElementById('filter-date-end').value;
    const tipo = document.getElementById('filter-tipo').value;
    const cat = document.getElementById('filter-categoria').value;

    if (start) query = query.gte('fecha', start);
    if (end) query = query.lte('fecha', end);
    if (tipo) query = query.eq('tipo', tipo);
    if (cat) query = query.eq('categoria_id', cat);

    const { data } = await query;
    
    movTable.innerHTML = '';
    data?.forEach(m => {
        movTable.innerHTML += `
            <tr>
                <td>${m.fecha}</td>
                <td><span style="color: ${m.tipo === 'ingreso' ? 'var(--secondary)' : 'var(--danger)'}">${m.tipo.toUpperCase()}</span></td>
                <td>${m.categorias.nombre}</td>
                <td>${m.descripcion}</td>
                <td>${formatCurrency(m.valor)}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem;" onclick="editMovimiento('${m.id}')">✏️</button>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: var(--danger);" onclick="deleteMovimiento('${m.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
};

window.applyFilters = () => {
    loadMovements();
};

window.editMovimiento = async (id) => {
    const { data } = await supabase.from('movimientos').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('movimiento-id').value = data.id;
        document.getElementById('mov-tipo').value = data.tipo;
        document.getElementById('mov-categoria').value = data.categoria_id;
        document.getElementById('mov-descripcion').value = data.descripcion;
        document.getElementById('mov-valor').value = data.valor;
        document.getElementById('mov-fecha').value = data.fecha;
        
        document.getElementById('modal-movimiento-title').innerText = 'Editar Movimiento';
        openModal('movimiento-modal');
    }
};

window.deleteMovimiento = async (id) => {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        await supabase.from('movimientos').delete().eq('id', id);
        loadMovements();
    }
};

window.addEventListener('sectionChanged', (e) => {
    if (e.detail === 'movimientos') loadMovements();
});
