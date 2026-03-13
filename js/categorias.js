import { supabase, showToast } from './app.js';

const catForm = document.getElementById('categoria-form');
const catGrid = document.getElementById('categorias-grid');

catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
        usuario_id: user.id,
        nombre: document.getElementById('cat-nombre').value,
        tipo: document.getElementById('cat-tipo').value
    };

    try {
        const { error } = await supabase.from('categorias').insert([payload]);
        if (error) throw error;
        
        closeModal('categoria-modal');
        catForm.reset();
        loadCategories();
        if (window.loadCategoriesForSelects) window.loadCategoriesForSelects();
        showToast('Categoría creada', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

window.loadCategories = async () => {
    const { data } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
    
    catGrid.innerHTML = '';
    data?.forEach(c => {
        const isSystem = c.usuario_id === null;
        catGrid.innerHTML += `
            <div class="stat-card" style="border-left: 4px solid ${c.tipo === 'ingreso' ? 'var(--secondary)' : 'var(--danger)'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="value" style="font-size: 1.1rem;">${c.nombre}</div>
                        <div class="label">${c.tipo === 'ingreso' ? '🟢 Ingreso' : '🔴 Egreso'}</div>
                        ${isSystem ? '<span style="font-size: 0.7rem; background: var(--border-color); padding: 0.1rem 0.4rem; border-radius: 4px;">Sistema</span>' : ''}
                    </div>
                    ${!isSystem ? `<button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: var(--danger);" onclick="deleteCategoria('${c.id}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
    });
};

window.deleteCategoria = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta categoría? Solo podrás eliminarla si no tiene movimientos asociados.')) {
        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (error) showToast('No se puede eliminar: tiene movimientos asociados.', 'error');
        else {
            loadCategories();
            if (window.loadCategoriesForSelects) window.loadCategoriesForSelects();
            showToast('Categoría eliminada', 'success');
        }
    }
};

window.addEventListener('sectionChanged', (e) => {
    if (e.detail === 'categorias') loadCategories();
});
