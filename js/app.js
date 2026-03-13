import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    return { ...session.user, profile };
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(value);
}

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; margin-left:1rem;">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

