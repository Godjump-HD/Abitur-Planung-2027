const API_BASE = 'https://abiturplanung2027-database.lostixd8.workers.dev/api'; // Cloudflare Worker URL hier eintragen

function togglePw() {
    const pw = document.getElementById('password');
    const eye = document.getElementById('pwEye');
    if (pw.type === 'password') {
        pw.type = 'text';
        eye.textContent = '🙈';
    } else {
        pw.type = 'password';
        eye.textContent = '👁';
    }
}

function setLoading(loading) {
    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const text = document.getElementById('btnText');
    const arrow = document.getElementById('btnArrow');
    btn.disabled = loading;
    spinner.style.display = loading ? 'block' : 'none';
    text.textContent = loading ? 'Einloggen...' : 'Einloggen';
    arrow.style.display = loading ? 'none' : 'block';
}

function showError(msg) {
    const box = document.getElementById('errorBox');
    document.getElementById('errorMsg').textContent = msg;
    box.classList.add('show');
}

function hideError() {
    document.getElementById('errorBox').classList.remove('show');
}

async function handleLogin(e) {
    e.preventDefault();
    hideError();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return;

    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.token) {
            localStorage.setItem('abi_token', data.token);
            localStorage.setItem('abi_user', JSON.stringify(data.user));
            // Weiterleitung je nach Rolle
            if (data.user.role === 'admin') {
                window.location.href = '/admin/admin.html';
            } else {
                window.location.href = '/dashboard';
            }
        } else {
            showError(data.error || 'Nutzername oder Passwort falsch.');
        }
    } catch (err) {
        showError('Verbindungsfehler. Bitte versuche es erneut.');
    }
    setLoading(false);
}
