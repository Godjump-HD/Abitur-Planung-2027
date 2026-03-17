
  const API_BASE = 'https://abiturplanung2027-database.lostixd8.workers.dev/api';
  let allUsers = [];
  let komiteeRoles = [];
  let editingUserId = null;
  let deletingUserId = null;

  function getToken() { return localStorage.getItem('abi_token'); }

  function logout() {
    localStorage.removeItem('abi_token');
    localStorage.removeItem('abi_user');
    window.location.href = '/login/login.html';
  }

  function showToast(msg, type='') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast show ${type}`;
    setTimeout(() => t.className = 'toast', 3000);
  }

  function initSidebar() {
    const user = JSON.parse(localStorage.getItem('abi_user') || '{}');
    if (user.name) {
      document.getElementById('sidebarName').textContent = user.name;
      document.getElementById('sidebarAvatar').textContent =
        user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    }
  }

  // Komitee-Rollen vom Worker laden
  async function loadKomiteeRoles() {
    try {
      const res = await fetch(`${API_BASE}/roles`);
      const data = await res.json();
      komiteeRoles = data.komiteeRoles || [];
    } catch {
      komiteeRoles = [
        { id:'komitee_abistreiche', label:'Abistreiche-Komitee' },
        { id:'komitee_finanzen',    label:'Finanz-Komitee' },
        { id:'komitee_hoodie',      label:'Hoodie-Komitee' },
        { id:'komitee_mottowoche',  label:'Mottowoche-Komitee' },
        { id:'komitee_abiball',     label:'Abiball-Komitee' },
        { id:'komitee_foto',        label:'Foto/Jahrbuch-Komitee' },
      ];
    }
    renderKomiteeCheckboxes([]);
  }

  function renderKomiteeCheckboxes(selected = []) {
    const container = document.getElementById('komiteeCheckboxes');
    container.innerHTML = komiteeRoles.map(r => `
      <label class="role-check ${selected.includes(r.id) ? 'checked' : ''}" id="check_wrap_${r.id}">
        <input type="checkbox" id="check_${r.id}" value="${r.id}"
          ${selected.includes(r.id) ? 'checked' : ''}
          onchange="toggleCheckStyle('${r.id}')">
        ${r.label}
      </label>
    `).join('');
  }

  function toggleCheckStyle(id) {
    const cb = document.getElementById(`check_${id}`);
    const wrap = document.getElementById(`check_wrap_${id}`);
    wrap.classList.toggle('checked', cb.checked);
  }

  function getSelectedKomiteeRoles() {
    return komiteeRoles
      .filter(r => document.getElementById(`check_${r.id}`)?.checked)
      .map(r => r.id);
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      allUsers = data.users || [];
    } catch {
      allUsers = [];
      showToast('Konnte Nutzer nicht laden.', 'error');
    }
    renderUsers(allUsers);
    updateStats(allUsers);
  }

  function updateStats(users) {
    document.getElementById('statTotal').textContent   = users.length;
    document.getElementById('statActive').textContent  = users.filter(u=>u.active).length;
    document.getElementById('statAdmins').textContent  = users.filter(u=>u.role==='admin').length;
    document.getElementById('statKomitee').textContent = users.filter(u=>(u.komiteeRoles||[]).length>0).length;
  }

  function renderUsers(users) {
    const tbody = document.getElementById('userTableBody');
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">Keine Nutzer gefunden.</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => {
      const komiteeBadges = (u.komiteeRoles||[]).map(kr => {
        const found = komiteeRoles.find(r => r.id === kr);
        return `<span class="role-badge role-komitee">${found ? found.label : kr}</span>`;
      }).join('') || '<span style="color:var(--text-muted);font-size:.8rem">–</span>';

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--navy-light);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;color:var(--navy-mid)">
                ${u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <span style="font-weight:500">${u.name}</span>
            </div>
          </td>
          <td style="color:var(--text-muted);font-family:monospace;font-size:.82rem">${u.username}</td>
          <td><span class="role-badge role-${u.role}">${u.role}</span></td>
          <td>${komiteeBadges}</td>
          <td>
            <span class="status-dot ${u.active?'status-active':'status-inactive'}"></span>
            ${u.active ? 'Aktiv' : 'Inaktiv'}
          </td>
          <td>
            <div class="actions">
              <button class="btn btn-sm" style="background:var(--navy-light);color:var(--navy-mid)" onclick="openEditModal('${u.id}')">Bearbeiten</button>
              <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${u.id}')">Löschen</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterUsers() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderUsers(allUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.includes(q)
    ));
  }

  function openCreateModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Nutzer anlegen';
    document.getElementById('modalSubmitBtn').textContent = 'Nutzer anlegen';
    document.getElementById('fieldName').value = '';
    document.getElementById('fieldUsername').value = '';
    document.getElementById('fieldPassword').value = '';
    document.getElementById('fieldPassword').placeholder = 'Temporäres Passwort';
    document.getElementById('fieldRole').value = 'user';
    renderKomiteeCheckboxes([]);
    document.getElementById('userModal').classList.add('show');
  }

  function openEditModal(id) {
    const u = allUsers.find(u => u.id === id);
    if (!u) return;
    editingUserId = id;
    document.getElementById('modalTitle').textContent = 'Nutzer bearbeiten';
    document.getElementById('modalSubmitBtn').textContent = 'Änderungen speichern';
    document.getElementById('fieldName').value = u.name;
    document.getElementById('fieldUsername').value = u.username;
    document.getElementById('fieldPassword').value = '';
    document.getElementById('fieldPassword').placeholder = 'Leer lassen = nicht ändern';
    document.getElementById('fieldRole').value = u.role;
    renderKomiteeCheckboxes(u.komiteeRoles || []);
    document.getElementById('userModal').classList.add('show');
  }

  function closeModal() { document.getElementById('userModal').classList.remove('show'); }

  async function submitUser() {
    const name = document.getElementById('fieldName').value.trim();
    const username = document.getElementById('fieldUsername').value.trim();
    const password = document.getElementById('fieldPassword').value;
    const role = document.getElementById('fieldRole').value;
    const komiteeRolesSelected = getSelectedKomiteeRoles();

    if (!name || !username) { showToast('Name und Benutzername sind erforderlich.', 'error'); return; }

    const payload = { name, username, role, komiteeRoles: komiteeRolesSelected };
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
        showToast(data.error || 'Fehler.', 'error');
      }
    } catch {
      showToast('Verbindungsfehler.', 'error');
    }
  }

  function openDeleteModal(id) {
    deletingUserId = id;
    const u = allUsers.find(u => u.id === id);
    document.getElementById('deleteModalText').textContent =
      `"${u?.name}" wird dauerhaft gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.`;
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
      if (res.ok) { showToast('Nutzer gelöscht.', 'success'); }
      else { showToast('Fehler beim Löschen.', 'error'); }
    } catch { showToast('Verbindungsfehler.', 'error'); }
    closeDeleteModal();
    loadUsers();
  }

  initSidebar();
  loadKomiteeRoles();
  loadUsers();
