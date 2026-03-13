import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { showToast } from './app.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const nameGroup = document.getElementById('name-group');
const btnText = document.getElementById('btn-text');
const toggleAuth = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const passwordInput = document.getElementById('password');

let isLogin = true;

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.innerText = isPassword ? '🙈' : '👁️';
    });
}


toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    
    if (isLogin) {
        authTitle.innerText = "Iniciar Sesión";
        nameGroup.style.display = "none";
        btnText.innerText = "Entrar";
        toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-auth" style="color: var(--primary); text-decoration: none; font-weight: 600;">Regístrate</a>';
    } else {
        authTitle.innerText = "Crear Cuenta";
        nameGroup.style.display = "block";
        btnText.innerText = "Registrarse";
        toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-auth" style="color: var(--primary); text-decoration: none; font-weight: 600;">Entra</a>';
    }
    
    // Re-attach listener because we replaced innerHTML
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuth.click();
    });
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value;

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nombre }
                }
            });
            if (error) throw error;
            showToast('¡Registro exitoso! Por favor inicia sesión.', 'success');
            isLogin = true;
            toggleAuth.click();
            return;
        }
        window.location.href = './dashboard.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
});
