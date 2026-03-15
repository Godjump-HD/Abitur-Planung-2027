const API_BASE = 'https://abiturplanung2027-database.lostixd8.workers.dev/api';
let allUsers = [];
let editingUserId = null;
let deletingUserId = null;

// ── AUTH CHECK ──
function getToken() { return localStorage.getItem('abi_token'); }

function logout() {
    localStorage.removeItem('abi_token');
    localStorage.removeItem('abi_user');
    window.location.href = '/login';
}

function initSidebar() {
    const user = JSON.parse(localStorage.getItem('abi_user') || '{}');
    if (user.name) {
        document.getElementById('sidebarName').textContent = user.name;
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('sidebarAvatar').textContent = initials;
    }
}

// ── TOAST ──
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── LOAD USERS ──
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/admin/users`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        allUsers = data.users || [];
        renderUsers(allUsers);
        updateStats(allUsers);
    } catch (e) {
        allUsers = [
            { id: 1, name: 'Admin User', username: 'admin', role: 'admin', active: true, created_at: '2025-01-10' },
            { id: 2, name: 'Lisa Moderator', username: 'lisa.mod', role: 'moderator', active: true, created_at: '2025-01-12' },
            { id: 3, name: 'Tim Schulze', username: 'tim.schulze', role: 'user', active: true, created_at: '2025-01-15' },
            { id: 4, name: 'Anna Berger', username: 'anna.berger', role: 'user', active: false, created_at: '2025-01-20' },
        ];
        renderUsers(allUsers);
        updateStats(allUsers);
    }
}

function updateStats(users) {
    document.getElementById('statTotal').textContent = users.length;
    document.getElementById('statActive').textContent = users.filter(u => u.active).length;
    document.getElementById('statAdmins').textContent = users.filter(u => u.role === 'admin').length;
    document.getElementById('statMods').textContent = users.filter(u => u.role === 'moderator').length;
}

function renderUsers(users) {
    const tbody = document.getElementById('userTableBody');
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">Keine Nutzer gefunden.</td></tr>`;
        return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--navy-light);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;color:var(--navy-mid);flex-shrink:0">
              ${u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <span style="font-weight:500">${u.name}</span>
          </div>
        </td>
        <td style="color:var(--text-muted);font-family:monospace;font-size:0.82rem">${u.username}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>
          <span class="status-dot ${u.active ? 'status-active' : 'status-inactive'}"></span>
          ${u.active ? 'Aktiv' : 'Inaktiv'}
        </td>
        <td style="color:var(--text-muted);font-size:0.82rem">${formatDate(u.created_at)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm" style="background:var(--navy-light);color:var(--navy-mid)" onclick="openEditModal(${u.id})">Bearbeiten</button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${u.id})">Löschen</button>
          </div>
        </td>
      </tr>
    `).join('');
}

function formatDate(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function filterUsers() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderUsers(allUsers.filter(u =>
        u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.includes(q)
    ));
}

// ── CREATE MODAL ──
function openCreateModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Nutzer anlegen';
    document.getElementById('modalSubtitle').textContent = 'Erstelle einen neuen Account. Das Passwort kann temporär sein.';
    document.getElementById('modalSubmitBtn').textContent = 'Nutzer anlegen';
    document.getElementById('fieldName').value = '';
    document.getElementById('fieldUsername').value = '';
    document.getElementById('fieldPassword').value = '';
    document.getElementById('fieldRole').value = 'user';
    document.getElementById('fieldPassword').placeholder = 'Temporäres Passwort';
    document.getElementById('userModal').classList.add('show');
}

function openEditModal(id) {
    const u = allUsers.find(u => u.id === id);
    if (!u) return;
    editingUserId = id;
    document.getElementById('modalTitle').textContent = 'Nutzer bearbeiten';
    document.getElementById('modalSubtitle').textContent = 'Ändere Name, Rolle oder setze ein neues Passwort.';
    document.getElementById('modalSubmitBtn').textContent = 'Änderungen speichern';
    document.getElementById('fieldName').value = u.name;
    document.getElementById('fieldUsername').value = u.username;
    document.getElementById('fieldPassword').value = '';
    document.getElementById('fieldPassword').placeholder = 'Leer lassen = nicht ändern';
    document.getElementById('fieldRole').value = u.role;
    document.getElementById('userModal').classList.add('show');
}

function closeModal() { document.getElementById('userModal').classList.remove('show'); }

async function submitUser() {
    const name = document.getElementById('fieldName').value.trim();
    const username = document.getElementById('fieldUsername').value.trim();
    const password = document.getElementById('fieldPassword').value;
    const role = document.getElementById('fieldRole').value;
    if (!name || !username) { showToast('Name und Benutzername sind erforderlich.', 'error'); return; }

    const payload = { name, username, role };
    if (password) payload.password = password;

    try {
        const url = editingUserId ? `${API_BASE}/admin/users/${editingUserId}` : `${API_BASE}/admin/users`;
        const method = editingUserId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showToast(editingUserId ? 'Änderungen gespeichert.' : 'Nutzer angelegt!', 'success');
            closeModal();
            loadUsers();
        } else {
            showToast(data.error || 'Fehler beim Speichern.', 'error');
        }
    } catch (e) {
        // Demo ohne Backend
        if (editingUserId) {
            const idx = allUsers.findIndex(u => u.id === editingUserId);
            if (idx > -1) { allUsers[idx] = { ...allUsers[idx], name, username, role }; }
        } else {
            allUsers.push({ id: Date.now(), name, username, role, active: true, created_at: new Date().toISOString() });
        }
        renderUsers(allUsers);
        updateStats(allUsers);
        showToast(editingUserId ? 'Änderungen gespeichert (Demo).' : 'Nutzer angelegt (Demo)!', 'success');
        closeModal();
    }
}

// ── DELETE MODAL ──
function openDeleteModal(id) {
    deletingUserId = id;
    const u = allUsers.find(u => u.id === id);
    document.getElementById('deleteModalText').textContent =
        `"${u?.name || 'Dieser Nutzer'}" wird dauerhaft gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.`;
    document.getElementById('deleteModal').classList.add('show');
    document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
}

function closeDeleteModal() { document.getElementById('deleteModal').classList.remove('show'); }

async function confirmDelete() {
    try {
        const res = await fetch(`${API_BASE}/admin/users/${deletingUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
            showToast('Nutzer gelöscht.', 'success');
        } else {
            showToast('Fehler beim Löschen.', 'error');
        }
    } catch (e) {
        showToast('Nutzer gelöscht (Demo).', 'success');
    }
    allUsers = allUsers.filter(u => u.id !== deletingUserId);
    renderUsers(allUsers);
    updateStats(allUsers);
    closeDeleteModal();
}

// ── INIT ──
initSidebar();
loadUsers();