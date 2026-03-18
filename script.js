
  const ROLE_LABELS = {
    admin:                 'Admin',
    moderator:             'Moderator',
    user:                  'Mitglied',
    komitee_abistreiche:   'Abistreiche-Komitee',
    komitee_finanzen:      'Finanz-Komitee',
    komitee_hoodie:        'Hoodie-Komitee',
    komitee_mottowoche:    'Mottowoche-Komitee',
    komitee_abiball:       'Abiball-Komitee',
    komitee_foto:          'Foto-Komitee',
  };

  const MODULE_ROLE_MAP = {
    abistreiche: 'komitee_abistreiche',
    finanzen:    'komitee_finanzen',
    hoodie:      'komitee_hoodie',
    mottowoche:  'komitee_mottowoche',
  };

  function getRoleLabel(roles) {
    if (roles.includes('admin'))     return 'Admin';
    if (roles.includes('moderator')) return 'Moderator';
    const komitee = roles.find(r => r.startsWith('komitee_'));
    if (komitee) return ROLE_LABELS[komitee] || komitee;
    return 'Mitglied';
  }

  function initUserBadge() {
    const token = localStorage.getItem('abi_token');
    const user  = JSON.parse(localStorage.getItem('abi_user') || '{}');
    if (!token || !user.name) return;

    const roles = user.roles || [user.role];

    // Badge anzeigen
    const badge = document.getElementById('userBadge');
    badge.classList.add('visible');

    // Avatar Initialen
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent   = user.name;
    document.getElementById('userRoleLabel').textContent = getRoleLabel(roles);

    // Login-Button & CTA verstecken / anpassen
    document.getElementById('loginBtn').style.display = 'none';
    const cta = document.getElementById('heroCta');

    //Change
    Object.entries(MODULE_ROLE_MAP).forEach(([module, role]) => {
      if(role.includes('admin')){
        cta.textContent = 'Zum Dashboard';
        cta.href = roles.includes('admin') ? '/admin/admin.html' : '#';
      } else {
        cta.style.display ? 'none';
      }
    });

    // Komitee-Badges auf Karten anzeigen
    Object.entries(MODULE_ROLE_MAP).forEach(([module, role]) => {
      if (roles.includes(role) || roles.includes('admin') || roles.includes('moderator')) {
        const el = document.getElementById(`badge_${module}`);
        if (el) el.classList.add('visible');
      }
    });
  }

  function logout() {
    localStorage.removeItem('abi_token');
    localStorage.removeItem('abi_user');
    location.reload();
  }

  initUserBadge();
