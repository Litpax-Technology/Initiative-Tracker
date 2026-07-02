// ============================================
// LITPAX INITIATIVE TRACKER - ADMIN VIEW
// ============================================

let allTasks = [];
let allEmployees = [];
let statusFilter = 'All';
let employeeFilter = ''; // '' = sab employees

document.addEventListener('DOMContentLoaded', loadAll);

async function loadAll() {
  document.getElementById('empGrid').innerHTML = '<div class="loader">Loading team data...</div>';
  document.getElementById('taskList').innerHTML = '<div class="loader">Loading initiatives...</div>';

  try {
    // Employees + saare tasks parallel mein
    const [initRes, tasksRes] = await Promise.all([
      fetch(`${CONFIG.GAS_URL}?action=getInit`).then(r => r.json()),
      fetch(`${CONFIG.GAS_URL}?action=getTasks`).then(r => r.json())
    ]);

    if (!initRes.success) throw new Error(initRes.error);
    if (!tasksRes.success) throw new Error(tasksRes.error);

    allEmployees = initRes.employees;
    allTasks = tasksRes.tasks;

    // Title Config sheet se
    const title = (initRes.config && initRes.config['App Title']) || 'Litpax Initiative Tracker';
    document.title = title + ' · Admin';
    document.getElementById('brandNameAdmin').textContent = title;

    updateOverallStats();
    renderEmployeeCards();
    renderTasks();
    renderFundsView();
  } catch (err) {
    document.getElementById('taskList').innerHTML = '<div class="empty-state">⚠️ Data load nahi hua. Refresh karke dekho.</div>';
    showToast('Error: ' + err.message, true);
  }
}

// ---------- OVERALL STATS ----------
function updateOverallStats() {
  document.getElementById('statTotal').textContent = allTasks.length;
  document.getElementById('statPending').textContent = allTasks.filter(t => t.status === 'Pending').length;
  document.getElementById('statProgress').textContent = allTasks.filter(t => t.status === 'In Progress').length;
  document.getElementById('statDone').textContent = allTasks.filter(t => t.status === 'Completed').length;
}

// ---------- EMPLOYEE CARDS ----------
function renderEmployeeCards() {
  const grid = document.getElementById('empGrid');

  grid.innerHTML = allEmployees.map(name => {
    const tasks = allTasks.filter(t => t.employee === name);
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const progress = tasks.filter(t => t.status === 'In Progress').length;
    const done = tasks.filter(t => t.status === 'Completed').length;
    const selected = employeeFilter === name ? 'selected' : '';

    return `
      <div class="emp-card ${selected}" onclick="toggleEmployee('${esc(name)}')">
        <div class="emp-name">${esc(name)}</div>
        <div class="emp-nums">
          <span class="emp-num n-total"><b>${tasks.length}</b>Total</span>
          <span class="emp-num n-pending"><b>${pending}</b>Pending</span>
          <span class="emp-num n-progress"><b>${progress}</b>Active</span>
          <span class="emp-num n-done"><b>${done}</b>Done</span>
        </div>
      </div>`;
  }).join('');
}

function toggleEmployee(name) {
  employeeFilter = employeeFilter === name ? '' : name;
  renderEmployeeCards();
  renderTasks();
}

// ---------- STATUS FILTER ----------
function setFilter(filter, btn) {
  statusFilter = filter;
  document.querySelectorAll('#filterTabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ---------- RENDER TASKS ----------
function renderTasks() {
  const list = document.getElementById('taskList');

  let tasks = allTasks;
  if (employeeFilter) tasks = tasks.filter(t => t.employee === employeeFilter);
  if (statusFilter !== 'All') tasks = tasks.filter(t => t.status === statusFilter);

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        Koi initiative nahi mila${employeeFilter ? ` — ${esc(employeeFilter)}` : ''}${statusFilter !== 'All' ? ` (${statusFilter})` : ''}.
      </div>`;
    return;
  }

  list.innerHTML = tasks.map(t => {
    const badgeClass = t.status === 'Completed' ? 'done' : t.status === 'In Progress' ? 'progress' : 'pending';

    const metaItems = [];
    if (t.estimatedTime) metaItems.push(`<span class="meta-item">⏱ Time: <b>${esc(t.estimatedTime)}</b></span>`);
    if (t.buddyNeeded === 'Yes' && t.buddyName) metaItems.push(`<span class="meta-item">🤝 Buddy: <b>${esc(t.buddyName)}</b></span>`);
    if (t.funds) metaItems.push(`<span class="meta-item">💰 Requirement: <b>${esc(t.funds)}</b></span>`);
    metaItems.push(`<span class="meta-item">📅 Created: <b>${t.createdOn}</b></span>`);
    if (t.lastUpdated) metaItems.push(`<span class="meta-item">🔄 Updated: <b>${t.lastUpdated}</b></span>`);
    if (t.completedOn) metaItems.push(`<span class="meta-item">✅ Completed: <b>${t.completedOn}</b></span>`);

    const ratingChip = t.rating ? `<div class="rating-chip">😊 ${esc(t.rating)}</div>` : '';

    return `
      <div class="task-card">
        <div class="task-top">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="task-id">${t.taskId}</span>
            <span class="admin-task-employee">👤 ${esc(t.employee)}</span>
          </div>
          <span class="badge ${badgeClass}">${t.status}</span>
        </div>
        <div class="task-text">${esc(t.task)}</div>
        ${ratingChip}
        <div class="task-meta">${metaItems.join('')}</div>
      </div>`;
  }).join('');
}

// ---------- VIEW SWITCH (All / Funds) ----------
function setView(view) {
  const isFunds = view === 'funds';
  document.getElementById('viewAll').classList.toggle('hidden', isFunds);
  document.getElementById('viewFunds').classList.toggle('hidden', !isFunds);
  document.getElementById('tabAll').classList.toggle('active', !isFunds);
  document.getElementById('tabFunds').classList.toggle('active', isFunds);
}

// ---------- FUNDS REQUIRED VIEW ----------
function renderFundsView() {
  const list = document.getElementById('fundsList');

  // Sirf wo tasks jinme funds/machine requirement likhi hai
  const fundsTasks = allTasks.filter(t => String(t.funds || '').trim() !== '');

  // Tab pe count badge
  document.getElementById('fundsCount').textContent = fundsTasks.length > 0 ? fundsTasks.length : '';

  if (fundsTasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        Abhi kisi initiative mein funds ya machine ki requirement nahi hai.
      </div>`;
    return;
  }

  // Employee-wise group karke dikhao
  const grouped = {};
  fundsTasks.forEach(t => {
    if (!grouped[t.employee]) grouped[t.employee] = [];
    grouped[t.employee].push(t);
  });

  list.innerHTML = Object.keys(grouped).map(emp => {
    const cards = grouped[emp].map(t => {
      const badgeClass = t.status === 'Completed' ? 'done' : t.status === 'In Progress' ? 'progress' : 'pending';
      return `
        <div class="task-card">
          <div class="task-top">
            <span class="task-id">${t.taskId}</span>
            <span class="badge ${badgeClass}">${t.status}</span>
          </div>
          <div class="funds-highlight">💰 ${esc(t.funds)}</div>
          <div class="task-text" style="font-size:13.5px; font-weight:500; color:var(--text-soft);">Initiative: ${esc(t.task)}</div>
          <div class="task-meta">
            ${t.estimatedTime ? `<span class="meta-item">⏱ Time: <b>${esc(t.estimatedTime)}</b></span>` : ''}
            <span class="meta-item">📅 Created: <b>${t.createdOn}</b></span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="funds-group">
        <div class="funds-group-head">👤 ${esc(emp)} <span class="funds-group-count">${grouped[emp].length} request${grouped[emp].length > 1 ? 's' : ''}</span></div>
        ${cards}
      </div>`;
  }).join('');
}

// ---------- HELPERS ----------
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
