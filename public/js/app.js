/* ─────────────────────────────────────────────
   FitTrack — Frontend Application Logic
   ───────────────────────────────────────────── */

const API_BASE = window.FITTRACK_API || 'http://localhost:3000';

/* ── Auth ── */
const Auth = {
  TOKEN_KEY: 'fittrack_token',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  headers() {
    const token = this.getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async login(username = 'jose') {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Auth failed (${res.status})`);
    }
    const data = await res.json();
    // Soporta múltiples formatos de respuesta del backend
    const token = data.token || data.access_token || data.jwt || data.accessToken;
    if (!token) throw new Error('No token received from auth endpoint');
    this.setToken(token);
    return token;
  },

  async ensureToken() {
    if (!this.getToken()) {
      await this.login();
    }
    return this.getToken();
  }
};

/* ── API Client ── */
const API = {
  async request(path, options = {}) {
    await Auth.ensureToken();

    // Guardamos el body como string antes del primer intento
    // para poder reutilizarlo en el retry del 401
    const bodyStr = options.body || null;

    const makeRequest = () => fetch(`${API_BASE}${path}`, {
      ...options,
      body: bodyStr,
      headers: { ...Auth.headers(), ...(options.headers || {}) }
    });

    let res = await makeRequest();

    if (res.status === 401) {
      Auth.clearToken();
      await Auth.login();
      res = await makeRequest(); // retry con nuevo token
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `API error ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  },

  getActivities() {
    return this.request('/activities');
  },

  getActivity(id) {
    return this.request(`/activities/${id}`);
  },

  createActivity(data) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateActivity(id, data) {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteActivity(id) {
    return this.request(`/activities/${id}`, { method: 'DELETE' });
  }
};

/* ── Toast Notifications ── */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const icons = { success: 'bi-check-circle-fill', error: 'bi-exclamation-circle-fill', info: 'bi-info-circle-fill' };
    const toast = document.createElement('div');
    toast.className = `toast-custom toast-${type}`;
    toast.innerHTML = `
      <i class="bi ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast-custom').remove()">
        <i class="bi bi-x"></i>
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

/* ── Loading Overlay ── */
const Loader = {
  overlay: null,

  show() {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = '<div class="spinner-custom"></div>';
      document.body.appendChild(this.overlay);
    }
    this.overlay.style.display = 'flex';
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
  }
};

/* ── Activity Utilities ── */
const ActivityUtils = {
  typeIcons: {
    running: '🏃', cycling: '🚴', swimming: '🏊', gym: '🏋️',
    yoga: '🧘', hiking: '🥾', walking: '🚶', other: '⚡'
  },

  typeBadgeClass(type) {
    const map = {
      running: 'badge-running', cycling: 'badge-cycling',
      swimming: 'badge-swimming', gym: 'badge-gym',
      yoga: 'badge-yoga', hiking: 'badge-hiking',
      walking: 'badge-running', other: 'badge-other'
    };
    return map[(type || '').toLowerCase()] || 'badge-other';
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDuration(mins) {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },

  icon(type) {
    return this.typeIcons[(type || '').toLowerCase()] || '⚡';
  }
};

/* ── Animated Counter ── */
function animateCounter(el, target, duration = 1200) {
  if (!el || isNaN(target)) return;
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ── Theme Toggle ── */
const Theme = {
  KEY: 'fittrack_theme',

  get() { return localStorage.getItem(this.KEY) || 'dark'; },

  set(t) {
    localStorage.setItem(this.KEY, t);
    document.documentElement.setAttribute('data-theme', t);
    this.updateToggle(t);
  },

  toggle() {
    this.set(this.get() === 'dark' ? 'light' : 'dark');
  },

  updateToggle(t) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? '<i class="bi bi-sun-fill"></i><span>Light Mode</span>'
      : '<i class="bi bi-moon-fill"></i><span>Dark Mode</span>';
  },

  init() {
    const t = this.get();
    document.documentElement.setAttribute('data-theme', t);
    this.updateToggle(t);
  }
};

/* ── Sidebar Toggle ── */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');

  if (!sidebar) return;

  function open() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }

  function close() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  hamburger?.addEventListener('click', open);
  overlay?.addEventListener('click', close);
}

/* ── Dashboard Page ── */
async function initDashboard() {
  const grid = document.getElementById('activitiesGrid');
  const tbody = document.getElementById('recentTbody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');
  const filterChips = document.querySelectorAll('.filter-chip');

  let activities = [];
  let activeType = 'all';

  Loader.show();

  try {
    activities = await API.getActivities();
    if (!Array.isArray(activities)) activities = activities.data || activities.activities || [];
    renderStats(activities);
    renderCards(activities);
    renderTable(activities);
    renderCharts(activities);
  } catch (e) {
    Toast.error('Failed to load activities: ' + e.message);
    if (emptyState) emptyState.style.display = 'block';
  } finally {
    Loader.hide();
  }

  // Search
  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const filtered = activities.filter(a =>
      (a.type || a.activity_type || '').toLowerCase().includes(q) ||
      (a.notes || '').toLowerCase().includes(q)
    );
    renderCards(filtered, activeType);
    renderTable(filtered, activeType);
  });

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeType = chip.dataset.type || 'all';
      const q = searchInput?.value?.toLowerCase() || '';
      // BUG FIX: aplicar tanto el filtro de texto como el de tipo
      const filtered = activities.filter(a => {
        const matchesText = !q ||
          (a.type || a.activity_type || '').toLowerCase().includes(q) ||
          (a.notes || '').toLowerCase().includes(q);
        return matchesText;
      });
      renderCards(filtered, activeType);
      renderTable(filtered, activeType);
    });
  });

  // Sort select
  filterSelect?.addEventListener('change', () => {
    const val = filterSelect.value;
    let sorted = [...activities];
    if (val === 'date-desc') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (val === 'date-asc') sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (val === 'calories') sorted.sort((a, b) => (b.calories || 0) - (a.calories || 0));
    if (val === 'duration') sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    // BUG FIX: también aplicar el filtro de texto activo
    const q = searchInput?.value?.toLowerCase() || '';
    const filtered = sorted.filter(a =>
      !q ||
      (a.type || a.activity_type || '').toLowerCase().includes(q) ||
      (a.notes || '').toLowerCase().includes(q)
    );
    renderCards(filtered, activeType);
    renderTable(filtered, activeType);
  });

  function filterByType(list, type) {
    if (type === 'all') return list;
    return list.filter(a => (a.type || a.activity_type || '').toLowerCase() === type);
  }

  function renderStats(list) {
    const totalEl = document.getElementById('statTotal');
    const calEl = document.getElementById('statCalories');
    const durEl = document.getElementById('statDuration');
    const typesEl = document.getElementById('statTypes');

    const total = list.length;
    const calories = list.reduce((s, a) => s + (Number(a.calories) || 0), 0);
    const duration = list.reduce((s, a) => s + (Number(a.duration) || 0), 0);
    const types = new Set(list.map(a => (a.type || a.activity_type || '').toLowerCase())).size;

    animateCounter(totalEl, total);
    animateCounter(calEl, calories);
    animateCounter(durEl, duration);
    animateCounter(typesEl, types);
  }

  function renderCards(list, type = activeType) {
    if (!grid) return;
    const filtered = filterByType(list, type);
    grid.innerHTML = '';

    if (!filtered.length) {
      emptyState && (emptyState.style.display = 'block');
      return;
    }

    emptyState && (emptyState.style.display = 'none');

    filtered.forEach((a, i) => {
      const id = a._id || a.id;
      const type_ = a.type || a.activity_type || 'Other';
      const card = document.createElement('div');
      card.className = 'activity-card fade-in-up';
      card.style.animationDelay = `${i * 0.05}s`;

      card.innerHTML = `
        <div class="activity-card-header">
          <span class="activity-type-badge ${ActivityUtils.typeBadgeClass(type_)}">
            ${ActivityUtils.icon(type_)} ${type_}
          </span>
          <span class="activity-date">${ActivityUtils.formatDate(a.date)}</span>
        </div>
        <div class="activity-stats">
          <div class="activity-stat">
            <div class="activity-stat-label">Duration</div>
            <div class="activity-stat-value">${a.duration || 0}<span class="activity-stat-unit">min</span></div>
          </div>
          <div class="activity-stat">
            <div class="activity-stat-label">Calories</div>
            <div class="activity-stat-value">${(a.calories || 0).toLocaleString()}<span class="activity-stat-unit">kcal</span></div>
          </div>
        </div>
        ${a.notes ? `<div class="activity-notes">${a.notes}</div>` : ''}
        <div class="activity-card-footer">
          <a href="/activities/${id}" class="btn-card-action btn-card-details">
            <i class="bi bi-eye"></i> Details
          </a>
          <a href="/activities/edit/${id}" class="btn-card-action">
            <i class="bi bi-pencil"></i> Edit
          </a>
          <button class="btn-card-action btn-card-delete" onclick="confirmDelete('${id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function renderTable(list, type = activeType) {
    if (!tbody) return;
    const filtered = filterByType(list, type).slice(0, 10);
    tbody.innerHTML = '';

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted-custom py-4">No activities found</td></tr>';
      return;
    }

    filtered.forEach(a => {
      const id = a._id || a.id;
      const type_ = a.type || a.activity_type || 'Other';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span class="activity-type-badge ${ActivityUtils.typeBadgeClass(type_)}">
            ${ActivityUtils.icon(type_)} ${type_}
          </span>
        </td>
        <td class="text-primary-custom">${a.duration || 0} min</td>
        <td>${(a.calories || 0).toLocaleString()} kcal</td>
        <td>${ActivityUtils.formatDate(a.date)}</td>
        <td>
          <div style="display:flex;gap:8px;">
            <a href="/activities/${id}" class="btn-card-action btn-card-details" style="padding:5px 10px;font-size:12px;">
              <i class="bi bi-eye"></i>
            </a>
            <a href="/activities/edit/${id}" class="btn-card-action" style="padding:5px 10px;font-size:12px;">
              <i class="bi bi-pencil"></i>
            </a>
            <button class="btn-card-delete btn-card-action" style="padding:5px 10px;font-size:12px;" onclick="confirmDelete('${id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCharts(list) {
    renderWeeklyChart(list);
    renderTypeChart(list);
  }

  function renderWeeklyChart(list) {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas || !window.Chart) return;

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.push(d.toISOString().split('T')[0]);
    }

    const labels = last7.map(d => {
      const dt = new Date(d + 'T12:00:00');
      return dt.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const calories = last7.map(day =>
      list.filter(a => a.date && a.date.startsWith(day))
           .reduce((s, a) => s + (Number(a.calories) || 0), 0)
    );

    const duration = last7.map(day =>
      list.filter(a => a.date && a.date.startsWith(day))
           .reduce((s, a) => s + (Number(a.duration) || 0), 0)
    );

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Calories',
            data: calories,
            backgroundColor: 'rgba(0, 245, 160, 0.7)',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Duration (min)',
            data: duration,
            backgroundColor: 'rgba(0, 212, 255, 0.5)',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#8892a4', font: { family: 'DM Sans' } } } },
        scales: {
          x: { ticks: { color: '#8892a4' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            type: 'linear', position: 'left',
            ticks: { color: '#8892a4' },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y1: {
            type: 'linear', position: 'right',
            ticks: { color: '#8892a4' },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderTypeChart(list) {
    const canvas = document.getElementById('typeChart');
    if (!canvas || !window.Chart) return;

    const typeCounts = {};
    list.forEach(a => {
      const t = (a.type || a.activity_type || 'Other');
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    const colors = ['#00f5a0', '#00d4ff', '#7c3aed', '#ff6b35', '#ecc94b', '#48bb78', '#fc8181'];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8892a4', font: { family: 'DM Sans' }, padding: 16, boxWidth: 12 }
          }
        },
        cutout: '68%'
      }
    });
  }
}

/* ── Delete Confirmation ── */
let deleteTargetId = null;

function confirmDelete(id) {
  deleteTargetId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function executeDelete() {
  if (!deleteTargetId) return;
  const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
  modal?.hide();

  Loader.show();
  try {
    await API.deleteActivity(deleteTargetId);
    Toast.success('Activity deleted successfully!');
    setTimeout(() => window.location.href = '/', 600);
  } catch (e) {
    Toast.error('Failed to delete: ' + e.message);
  } finally {
    Loader.hide();
    deleteTargetId = null;
  }
}

/* ── Create / Edit Form ── */
async function initCreateForm() {
  const form = document.getElementById('activityForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = {
      type: form.querySelector('[name="type"]')?.value,
      duration: Number(form.querySelector('[name="duration"]')?.value),
      calories: Number(form.querySelector('[name="calories"]')?.value),
      date: form.querySelector('[name="date"]')?.value,
      notes: form.querySelector('[name="notes"]')?.value
    };

    Loader.show();
    try {
      await API.createActivity(data);
      Toast.success('Activity created!');
      setTimeout(() => window.location.href = '/', 800);
    } catch (e) {
      Toast.error('Failed to create: ' + e.message);
    } finally {
      Loader.hide();
    }
  });
}

async function initEditForm(activityId) {
  const form = document.getElementById('activityForm');
  if (!form || !activityId) return;

  let loadOk = false;

  Loader.show();
  try {
    const activity = await API.getActivity(activityId);
    const a = activity.data || activity;

    const typeField = form.querySelector('[name="type"]');
    const durField = form.querySelector('[name="duration"]');
    const calField = form.querySelector('[name="calories"]');
    const dateField = form.querySelector('[name="date"]');
    const notesField = form.querySelector('[name="notes"]');

    if (typeField) typeField.value = a.type || a.activity_type || '';
    if (durField) durField.value = a.duration || '';
    if (calField) calField.value = a.calories || '';
    // BUG FIX: manejar fechas ISO con y sin hora
    if (dateField) dateField.value = a.date ? a.date.substring(0, 10) : '';
    if (notesField) notesField.value = a.notes || '';

    loadOk = true;
  } catch (e) {
    Toast.error('Failed to load activity: ' + e.message);
  } finally {
    Loader.hide();
  }

  // BUG FIX: solo registrar el submit si la carga fue exitosa
  if (!loadOk) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = {
      type: form.querySelector('[name="type"]')?.value,
      duration: Number(form.querySelector('[name="duration"]')?.value),
      calories: Number(form.querySelector('[name="calories"]')?.value),
      date: form.querySelector('[name="date"]')?.value,
      notes: form.querySelector('[name="notes"]')?.value
    };

    Loader.show();
    try {
      await API.updateActivity(activityId, data);
      Toast.success('Activity updated!');
      setTimeout(() => window.location.href = '/', 800);
    } catch (e) {
      Toast.error('Failed to update: ' + e.message);
    } finally {
      Loader.hide();
    }
  });
}

/* ── Details Page ── */
async function initDetails(activityId) {
  if (!activityId) return;
  Loader.show();
  try {
    const raw = await API.getActivity(activityId);
    const a = raw.data || raw;
    const type_ = a.type || a.activity_type || 'Other';

    document.getElementById('detailType').textContent = `${ActivityUtils.icon(type_)} ${type_}`;
    document.getElementById('detailDate').textContent = ActivityUtils.formatDate(a.date);
    document.getElementById('detailDuration').textContent = a.duration || 0;
    document.getElementById('detailCalories').textContent = (a.calories || 0).toLocaleString();
    document.getElementById('detailNotes').textContent = a.notes || 'No notes recorded.';

    const badge = document.getElementById('detailBadge');
    if (badge) {
      badge.className = `activity-type-badge ${ActivityUtils.typeBadgeClass(type_)}`;
      badge.textContent = type_;
    }

    // Cal/min efficiency
    const dur = Number(a.duration) || 0;
    const cal = Number(a.calories) || 0;
    const eff = dur && cal ? (cal / dur).toFixed(1) : '—';
    const effEl = document.getElementById('detailEfficiency');
    if (effEl) effEl.textContent = eff;

    // Edit link
    const editBtn = document.getElementById('editBtn');
    if (editBtn) editBtn.href = `/activities/edit/${a._id || a.id}`;

    // Delete
    const delBtn = document.getElementById('deleteBtn');
    if (delBtn) delBtn.onclick = () => confirmDelete(a._id || a.id);

    // BUG FIX: llamar el chart con valores reales, no leer del DOM
    if (typeof window.renderIntensityChart === 'function') {
      window.renderIntensityChart(dur, cal);
    }

  } catch (e) {
    Toast.error('Failed to load activity: ' + e.message);
  } finally {
    Loader.hide();
  }
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Theme.init();
  initSidebar();

  const page = document.querySelector('[data-page]')?.dataset.page;

  if (page === 'dashboard') initDashboard();
  if (page === 'create') initCreateForm();
  if (page === 'edit') initEditForm(window.ACTIVITY_ID);
  if (page === 'details') initDetails(window.ACTIVITY_ID);

  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', executeDelete);
});
