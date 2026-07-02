// ============================================
// LITPAX INITIATIVE TRACKER - EMPLOYEE APP
// ============================================

let currentUser = '';
let allTasks = [];
let currentFilter = 'All';
let selectedRating = '';
let appConfig = {};

// Fallbacks agar Config tab mein key na mile
const DEFAULTS = {
  'App Title': 'Litpax Initiative Tracker',
  'Subtitle': 'Apne improvement ideas record karo, update karo, complete karo.',
  'Rating Options': '😊 Amazing, 🤩 Super Amazing, 🚀 Super Duper Amazing'
};

function cfg(key) {
  return appConfig[key] || DEFAULTS[key] || '';
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Pehle se logged in?
  const savedUser = localStorage.getItem('litpax_initiative_user');

  try {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getInit`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    appConfig = data.config || {};

    // ---- Sab kuch Config sheet se ----
    // Quote
    document.getElementById('quoteText').textContent = cfg('Quote');

    // App Title (browser tab + branding)
    const title = cfg('App Title');
    document.title = title;
    document.getElementById('brandNameLogin').innerHTML = esc(title).replace(/^(\S+)\s(.+)$/, '$1 <span>$2</span>');
    document.getElementById('brandNameTop').textContent = title;

    // Dashboard subtitle
    document.getElementById('dashSub').textContent = cfg('Subtitle');

    // Rating options (comma-separated Config se)
    renderRatingOptions();

    // Employee dropdown
    const select = document.getElementById('nameSelect');
    select.innerHTML = '<option value="">-- Select Your Name --</option>';
    data.employees.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    // Auto-login agar saved user abhi bhi active list mein hai
    if (savedUser && data.employees.includes(savedUser)) {
      currentUser = savedUser;
      showDashboard();
    }
  } catch (err) {
    document.getElementById('quoteText').textContent = 'Connection error. Internet check karke refresh karo.';
    showToast('Data load nahi hua: ' + err.message, true);
  }
}

// ---------- LOGIN / LOGOUT ----------
async function login() {
  const name = document.getElementById('nameSelect').value;
  const pin = document.getElementById('pinInput').value.trim();

  if (!name) {
    showToast('Pehle apna naam select karo', true);
    return;
  }
  if (!pin) {
    showToast('PIN daalo', true);
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Checking...';

  try {
    const res = await fetch(`${CONFIG.GAS_URL}?action=verifyPin&name=${encodeURIComponent(name)}&pin=${encodeURIComponent(pin)}`);
    const data = await res.json();

    if (!data.success) {
      showToast(data.error || 'Galat PIN', true);
      return;
    }

    currentUser = name;
    localStorage.setItem('litpax_initiative_user', name);
    document.getElementById('pinInput').value = '';
    showDashboard();
  } catch (err) {
    showToast('Login error: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Continue →';
  }
}

function logout() {
  localStorage.removeItem('litpax_initiative_user');
  currentUser = '';
  allTasks = [];
  document.getElementById('dashScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
}

function showDashboard() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('dashScreen').classList.add('active');
  document.getElementById('userChip').textContent = currentUser;
  document.getElementById('greeting').textContent = `${currentUser}'s Initiatives`;
  loadTasks();
}

// ---------- LOAD TASKS ----------
async function loadTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '<div class="loader">Loading your initiatives...</div>';

  try {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getTasks&employee=${encodeURIComponent(currentUser)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    allTasks = data.tasks;
    updateStats();
    renderTasks();
  } catch (err) {
    list.innerHTML = '<div class="empty-state">⚠️ Tasks load nahi hue. Refresh karke dekho.</div>';
    showToast('Error: ' + err.message, true);
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allTasks.length;
  document.getElementById('statPending').textContent = allTasks.filter(t => t.status === 'Pending').length;
  document.getElementById('statProgress').textContent = allTasks.filter(t => t.status === 'In Progress').length;
  document.getElementById('statDone').textContent = allTasks.filter(t => t.status === 'Completed').length;
}

// ---------- FILTER ----------
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('#filterTabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ---------- RENDER ----------
function renderTasks() {
  const list = document.getElementById('taskList');
  const tasks = currentFilter === 'All' ? allTasks : allTasks.filter(t => t.status === currentFilter);

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        ${currentFilter === 'All'
          ? 'Abhi koi initiative nahi hai. "＋ New Initiative" dabao aur pehla idea record karo!'
          : `Koi "${currentFilter}" initiative nahi hai.`}
      </div>`;
    return;
  }

  list.innerHTML = tasks.map(t => taskCardHTML(t)).join('');
}

function taskCardHTML(t) {
  const badgeClass = t.status === 'Completed' ? 'done' : t.status === 'In Progress' ? 'progress' : 'pending';

  const metaItems = [];
  if (t.estimatedTime) metaItems.push(`<span class="meta-item">⏱ Time: <b>${esc(t.estimatedTime)}</b></span>`);
  if (t.buddyNeeded === 'Yes' && t.buddyName) metaItems.push(`<span class="meta-item">🤝 Buddy: <b>${esc(t.buddyName)}</b></span>`);
  if (t.funds) metaItems.push(`<span class="meta-item">💰 Requirement: <b>${esc(t.funds)}</b></span>`);
  metaItems.push(`<span class="meta-item">📅 Created: <b>${t.createdOn}</b></span>`);
  if (t.completedOn) metaItems.push(`<span class="meta-item">✅ Completed: <b>${t.completedOn}</b></span>`);

  const ratingChip = t.rating ? `<div class="rating-chip">😊 ${esc(t.rating)}</div>` : '';

  // Action buttons status ke hisaab se
  let actions = '';
  if (t.status !== 'Completed') {
    actions = `
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" onclick="openTaskModal('${t.taskId}')">✏️ Edit</button>
        ${t.status === 'Pending'
          ? `<button class="btn btn-outline-blue btn-sm" onclick="setStatus('${t.taskId}', 'In Progress')">▶ Start Work</button>`
          : `<button class="btn btn-outline-blue btn-sm" onclick="setStatus('${t.taskId}', 'Pending')">⏸ Move to Pending</button>`}
        <button class="btn btn-outline-green btn-sm" onclick="openCompleteModal('${t.taskId}')">✓ Mark Completed</button>
      </div>`;
  }

  return `
    <div class="task-card">
      <div class="task-top">
        <span class="task-id">${t.taskId}</span>
        <span class="badge ${badgeClass}">${t.status}</span>
      </div>
      <div class="task-text">${esc(t.task)}</div>
      ${ratingChip}
      <div class="task-meta">${metaItems.join('')}</div>
      ${actions}
    </div>`;
}

// ---------- TASK MODAL (Add / Edit) ----------
function openTaskModal(taskId) {
  const modal = document.getElementById('taskModal');
  const isEdit = !!taskId;

  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Initiative' : 'New Initiative';
  document.getElementById('saveTaskBtn').textContent = isEdit ? 'Update Initiative' : 'Save Initiative';
  document.getElementById('editTaskId').value = taskId || '';

  if (isEdit) {
    const t = allTasks.find(x => x.taskId === taskId);
    if (!t) return;
    document.getElementById('fTask').value = t.task || '';
    document.getElementById('fTime').value = t.estimatedTime || '';
    document.querySelector(`input[name="fBuddy"][value="${t.buddyNeeded === 'Yes' ? 'Yes' : 'No'}"]`).checked = true;
    document.getElementById('fBuddyName').value = t.buddyName || '';
    document.getElementById('fFunds').value = t.funds || '';
  } else {
    document.getElementById('fTask').value = '';
    document.getElementById('fTime').value = '';
    document.querySelector('input[name="fBuddy"][value="No"]').checked = true;
    document.getElementById('fBuddyName').value = '';
    document.getElementById('fFunds').value = '';
  }

  toggleBuddyName();
  modal.classList.add('open');
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('open');
}

function toggleBuddyName() {
  const isYes = document.querySelector('input[name="fBuddy"]:checked').value === 'Yes';
  document.getElementById('buddyNameWrap').classList.toggle('hidden', !isYes);
}

async function saveTask() {
  const task = document.getElementById('fTask').value.trim();
  if (!task) {
    showToast('Task likhna zaroori hai', true);
    return;
  }

  const taskId = document.getElementById('editTaskId').value;
  const buddyNeeded = document.querySelector('input[name="fBuddy"]:checked').value;

  const payload = {
    action: taskId ? 'updateTask' : 'addTask',
    employee: currentUser,
    task: task,
    estimatedTime: document.getElementById('fTime').value.trim(),
    buddyNeeded: buddyNeeded,
    buddyName: buddyNeeded === 'Yes' ? document.getElementById('fBuddyName').value.trim() : '',
    funds: document.getElementById('fFunds').value.trim()
  };
  if (taskId) payload.taskId = taskId;

  const btn = document.getElementById('saveTaskBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const result = await postToGAS(payload);
    if (!result.success) throw new Error(result.error);

    closeTaskModal();
    showToast(taskId ? `${taskId} update ho gaya ✓` : `Initiative ${result.taskId} record ho gaya ✓`);
    loadTasks();
  } catch (err) {
    showToast('Save nahi hua: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = taskId ? 'Update Initiative' : 'Save Initiative';
  }
}

// ---------- STATUS ----------
async function setStatus(taskId, status) {
  try {
    showToast('Updating...');
    const result = await postToGAS({ action: 'updateTask', taskId: taskId, status: status });
    if (!result.success) throw new Error(result.error);
    showToast(`${taskId} → ${status} ✓`);
    loadTasks();
  } catch (err) {
    showToast('Update nahi hua: ' + err.message, true);
  }
}

// ---------- COMPLETE + RATING ----------
function renderRatingOptions() {
  const wrap = document.getElementById('ratingOptions');
  const options = cfg('Rating Options').split(',').map(s => s.trim()).filter(Boolean);

  wrap.innerHTML = options.map(opt => {
    // Emoji hata ke plain rating store hoti hai Sheet mein
    const plain = opt.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    return `<button class="rating-btn" data-rating="${esc(plain)}" onclick="selectRating(this)">${esc(opt)}</button>`;
  }).join('');
}

function openCompleteModal(taskId) {
  selectedRating = '';
  document.getElementById('completeTaskId').value = taskId;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('confirmCompleteBtn').disabled = true;
  document.getElementById('completeModal').classList.add('open');
}

function closeCompleteModal() {
  document.getElementById('completeModal').classList.remove('open');
}

function selectRating(btn) {
  selectedRating = btn.dataset.rating;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('confirmCompleteBtn').disabled = false;
}

async function confirmComplete() {
  const taskId = document.getElementById('completeTaskId').value;
  const btn = document.getElementById('confirmCompleteBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const result = await postToGAS({
      action: 'updateTask',
      taskId: taskId,
      status: 'Completed',
      rating: selectedRating
    });
    if (!result.success) throw new Error(result.error);

    closeCompleteModal();
    showToast(`🎉 ${taskId} completed — ${selectedRating}!`);
    loadTasks();
  } catch (err) {
    showToast('Complete nahi hua: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Mark Completed';
  }
}

// ---------- HELPERS ----------
async function postToGAS(payload) {
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS preflight avoid
    body: JSON.stringify(payload)
  });
  return res.json();
}

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
