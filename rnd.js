// =============================================================
// LITPAX R&D PROJECT TRACKER - FRONTEND LOGIC
// =============================================================

let currentUser = '';
let currentRole = '';
let allProjects = [];
let allUsers = [];
let currentFilter = 'All';
let currentProjectId = '';
let currentProject = null;
let appConfig = {};
let ratingOptions = [];
let uploadQueue = [];
let selectedReviewRating = '';

const LS_KEY = 'litpax_rd_user';

const DEFAULTS = {
  'App Title': 'Litpax R&D Tracker',
  'Subtitle': 'Director task assign karein, R&D team execute kare.',
  'Rating Options': '⭐ Good, 🌟 Very Good, 🚀 Excellent'
};
const cfg = k => appConfig[k] || DEFAULTS[k] || '';

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  try {
    const data = await getJSON('rdGetInit');
    if (!data.success) throw new Error(data.error);

    appConfig = data.config || {};
    allUsers = data.users || [];
    ratingOptions = cfg('Rating Options').split(',').map(s => s.trim()).filter(Boolean);

    const title = cfg('App Title');
    document.title = title;
    document.getElementById('brandNameLogin').innerHTML = esc(title).replace(/^(\S+)\s(.+)$/, '$1 <span>$2</span>');
    document.getElementById('brandNameTop').textContent = title;
    document.getElementById('quoteText').textContent = cfg('Quote');
    document.getElementById('dashSub').textContent = cfg('Subtitle');

    const sel = document.getElementById('nameSelect');
    sel.innerHTML = '<option value="">-- Select Your Name --</option>';
    allUsers.forEach(u => {
      const o = document.createElement('option');
      o.value = u.name; o.textContent = `${u.name} (${u.role})`;
      sel.appendChild(o);
    });

    if (saved && allUsers.find(u => u.name === saved.name)) {
      currentUser = saved.name; currentRole = saved.role;
      showList();
    }
  } catch (err) {
    document.getElementById('quoteText').textContent = 'Connection error. Internet check karke refresh karo.';
    showToast('Load fail: ' + err.message, true);
  }
}

// ---------- LOGIN ----------
async function login() {
  const name = document.getElementById('nameSelect').value;
  const pin = document.getElementById('pinInput').value.trim();
  if (!name) return showToast('Naam select karo', true);
  if (!pin) return showToast('PIN daalo', true);

  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Checking...';
  try {
    const data = await getJSON('rdVerifyPin', { name, pin });
    if (!data.success) return showToast(data.error || 'Galat PIN', true);
    currentUser = data.name; currentRole = data.role;
    localStorage.setItem(LS_KEY, JSON.stringify({ name: currentUser, role: currentRole }));
    document.getElementById('pinInput').value = '';
    showList();
  } catch (err) {
    showToast('Login error: ' + err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Continue →';
  }
}

function logout() {
  localStorage.removeItem(LS_KEY);
  currentUser = ''; currentRole = ''; allProjects = [];
  showScreen('loginScreen');
}

// ---------- ROLE HELPERS ----------
const canAssign = () => currentRole === 'Director' || currentRole === 'Admin';
const canReview = () => currentRole === 'Director' || currentRole === 'Admin';

// ---------- LIST ----------
function showList() {
  showScreen('listScreen');
  document.getElementById('userChip').textContent = currentUser;
  document.getElementById('roleChip').textContent = currentRole;
  document.getElementById('roleChip2').textContent = currentRole;
  document.getElementById('greeting').textContent =
    canAssign() ? 'All R&D Projects' : 'My R&D Projects';
  document.getElementById('assignBtn').classList.toggle('hidden', !canAssign());
  loadProjects();
}

async function loadProjects() {
  const list = document.getElementById('projectList');
  list.innerHTML = '<div class="loader">Loading projects...</div>';
  try {
    const data = await getJSON('rdGetProjects', { user: currentUser, role: currentRole });
    if (!data.success) throw new Error(data.error);
    allProjects = data.projects;
    updateStats();
    renderProjects();
  } catch (err) {
    list.innerHTML = '<div class="empty-state">⚠️ Load nahi hua. Refresh karo.</div>';
    showToast('Error: ' + err.message, true);
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allProjects.length;
  document.getElementById('statActive').textContent =
    allProjects.filter(p => ['Assigned', 'In Progress', 'Testing'].includes(p.status)).length;
  document.getElementById('statReview').textContent =
    allProjects.filter(p => p.status === 'Completed' && p.approval === 'Pending').length;
  document.getElementById('statApproved').textContent =
    allProjects.filter(p => p.status === 'Approved').length;
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('#filterTabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderProjects();
}

function renderProjects() {
  const list = document.getElementById('projectList');
  let items = currentFilter === 'All' ? allProjects : allProjects.filter(p => p.status === currentFilter);

  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔬</div>
      ${currentFilter === 'All'
        ? (canAssign() ? 'Abhi koi project nahi. "＋ Assign Project" dabao.' : 'Aapko abhi koi project assign nahi hua.')
        : `Koi "${currentFilter}" project nahi.`}</div>`;
    return;
  }
  list.innerHTML = items.map(projectCard).join('');
}

function badgeClass(status) {
  return { 'Assigned': 'assigned', 'In Progress': 'progress', 'Testing': 'testing',
    'Completed': 'pending', 'Approved': 'approved', 'Rejected': 'rejected' }[status] || 'pending';
}

function projectCard(p) {
  const reviewFlag = (p.status === 'Completed' && p.approval === 'Pending')
    ? '<span class="approval Pending">⏳ Review pending</span>' : '';
  const approvalPill = (p.approval && p.approval !== 'Pending')
    ? `<span class="approval ${esc(p.approval)}">${p.approval === 'Approved' ? '✓ Approved' : '✕ Rejected'}</span>` : '';

  const meta = [];
  meta.push(`<span class="meta-item">👤 By: <b>${esc(p.assignedBy)}</b></span>`);
  meta.push(`<span class="meta-item">🎯 To: <b>${esc(p.assignedTo)}</b></span>`);
  if (p.deadline) meta.push(`<span class="meta-item">📅 Deadline: <b>${esc(p.deadline)}</b></span>`);
  meta.push(`<span class="meta-item">🕒 Updated: <b>${esc(p.lastUpdated)}</b></span>`);

  return `
    <div class="task-card" style="cursor:pointer;" onclick="openDetail('${p.projectId}')">
      <div class="pcard-head">
        <div class="pcard-tags">
          <span class="task-id">${p.projectId}</span>
          <span class="pri ${esc(p.priority)}">${esc(p.priority)}</span>
        </div>
        <span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span>
      </div>
      <div class="task-text">${esc(p.title)}</div>
      <div class="pcard-people">${meta.join('')}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${reviewFlag}${approvalPill}
        ${p.rating ? `<span class="rating-chip">${esc(p.rating)}</span>` : ''}</div>
    </div>`;
}

// ---------- DETAIL ----------
async function openDetail(id) {
  currentProjectId = id;
  showScreen('detailScreen');
  document.getElementById('detailBody').innerHTML = '<div class="loader">Loading...</div>';
  try {
    const data = await getJSON('rdGetProject', { projectId: id });
    if (!data.success) throw new Error(data.error);
    currentProject = data.project;
    renderDetail(data.project, data.timeline);
  } catch (err) {
    document.getElementById('detailBody').innerHTML = '<div class="empty-state">⚠️ Load fail.</div>';
    showToast(err.message, true);
  }
}

function backToList() { showScreen('listScreen'); loadProjects(); }

function renderDetail(p, timeline) {
  const isOwner = p.assignedTo === currentUser;
  const canWork = isOwner || currentRole === 'Admin';

  // Feedback banner
  let banner = '';
  if (p.feedback && p.approval === 'Approved') banner = `<div class="fb-banner ok"><b>✓ Approved${p.rating ? ' — ' + esc(p.rating) : ''}.</b> ${esc(p.feedback)}</div>`;
  else if (p.feedback && p.approval === 'Rejected') banner = `<div class="fb-banner no"><b>✕ Rejected — dobara dekho.</b> ${esc(p.feedback)}</div>`;

  // Action bar
  let actions = '';
  if (canWork && p.status !== 'Approved') {
    const btns = [];
    if (p.status === 'Assigned') btns.push(`<button class="btn btn-outline-blue" onclick="setStatus('In Progress')">▶ Start Work</button>`);
    if (p.status === 'In Progress') btns.push(`<button class="btn btn-outline-blue" onclick="setStatus('Testing')">🧪 Move to Testing</button>`);
    if (p.status === 'Testing') btns.push(`<button class="btn btn-outline-blue" onclick="setStatus('In Progress')">↩ Back to Progress</button>`);
    if (p.status === 'In Progress' || p.status === 'Testing')
      btns.push(`<button class="btn btn-outline-green" onclick="setStatus('Completed')">✓ Mark Completed</button>`);
    btns.push(`<button class="btn btn-ghost" onclick="openEntryModal()">＋ Note / Remark</button>`);
    btns.push(`<button class="btn btn-ghost" onclick="openUploadModal()">📎 Upload Media</button>`);
    actions = `<div class="action-bar">${btns.join('')}</div>`;
  }
  // Director review action
  if (canReview() && p.status === 'Completed' && p.approval === 'Pending') {
    actions += `<div class="action-bar">
      <button class="btn btn-primary" onclick="openReviewModal()">🧪 Review — Approve / Reject</button>
      <button class="btn btn-ghost" onclick="openEntryModal()">＋ Remark</button>
    </div>`;
  }

  const meta = [];
  meta.push(`<span class="meta-item">👤 Assigned by: <b>${esc(p.assignedBy)}</b></span>`);
  meta.push(`<span class="meta-item">🎯 To: <b>${esc(p.assignedTo)}</b></span>`);
  if (p.deadline) meta.push(`<span class="meta-item">📅 Deadline: <b>${esc(p.deadline)}</b></span>`);
  meta.push(`<span class="meta-item">📆 Created: <b>${esc(p.createdOn)}</b></span>`);
  if (p.completedOn) meta.push(`<span class="meta-item">✅ Completed: <b>${esc(p.completedOn)}</b></span>`);

  document.getElementById('detailBody').innerHTML = `
    <div class="detail-head">
      <div class="pcard-head">
        <div class="pcard-tags">
          <span class="task-id">${p.projectId}</span>
          <span class="pri ${esc(p.priority)}">${esc(p.priority)}</span>
        </div>
        <span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span>
      </div>
      <div class="detail-title">${esc(p.title)}</div>
      ${p.description ? `<div class="detail-desc">${esc(p.description)}</div>` : ''}
      <div class="detail-meta">${meta.join('')}</div>
    </div>
    ${banner}
    ${actions}
    <div class="detail-head">
      <div class="tl-head">📜 Project Timeline</div>
      ${renderTimeline(timeline)}
    </div>`;
}

function renderTimeline(items) {
  if (!items || !items.length) return '<div class="empty-state" style="padding:20px;">Abhi koi activity nahi.</div>';
  const dotIcon = { assigned: '📌', status: '🔄', note: '📝', remark: '💬', review: '⚖️',
    photo: '🖼', video: '🎬', doc: '📄', link: '🔗' };
  const dotClass = t => (['photo', 'video', 'doc', 'link'].includes(t)) ? 'media'
    : (['assigned', 'status'].includes(t) ? 'status' : t);

  return `<div class="timeline">${items.map(it => {
    let body = '';
    if (['photo', 'video', 'doc', 'link'].includes(it.type)) {
      body = mediaHTML(it);
    } else if (it.type === 'remark') {
      body = `<div class="tl-body tl-remark">${esc(it.content)}</div>`;
    } else {
      body = `<div class="tl-body">${esc(it.content)}</div>`;
    }
    return `
      <div class="tl-item">
        <div class="tl-dot ${dotClass(it.type)}">${dotIcon[it.type] || '•'}</div>
        <div class="tl-by">${esc(it.by || '—')} <span class="tl-time">· ${esc(it.at)}</span></div>
        ${body}
      </div>`;
  }).join('')}</div>`;
}

function mediaHTML(it) {
  if (it.type === 'photo' && it.fileId) {
    const thumb = `https://drive.google.com/thumbnail?id=${it.fileId}&sz=w600`;
    return `<div class="tl-media">
      <img class="tl-photo" src="${thumb}" onclick="openLightbox('${thumb.replace('w600','w1200')}')" loading="lazy" alt="">
      ${it.content ? `<div class="tl-cap">${esc(it.content)}</div>` : ''}</div>`;
  }
  const url = it.fileUrl || '#';
  const icon = it.type === 'video' ? '🎬' : it.type === 'link' ? '🔗' : '📄';
  const label = it.fileName || it.content || (it.type === 'video' ? 'Video' : it.type === 'link' ? 'Link' : 'Document');
  return `<div class="tl-media">
    <a class="tl-file" href="${esc(url)}" target="_blank" rel="noopener">${icon} ${esc(label)}</a>
    ${(it.content && it.fileName) ? `<div class="tl-cap">${esc(it.content)}</div>` : ''}</div>`;
}

// ---------- STATUS ----------
async function setStatus(status) {
  try {
    showToast('Updating...');
    const r = await postJSON({ action: 'rdUpdateStatus', projectId: currentProjectId, status, by: currentUser });
    if (!r.success) throw new Error(r.error);
    showToast(`Status → ${status} ✓`);
    openDetail(currentProjectId);
  } catch (err) { showToast(err.message, true); }
}

// ---------- ASSIGN ----------
function openAssignModal() {
  document.getElementById('aTitle').value = '';
  document.getElementById('aDesc').value = '';
  document.getElementById('aDeadline').value = '';
  document.querySelector('input[name="aPri"][value="Medium"]').checked = true;
  const sel = document.getElementById('aAssignTo');
  const rd = allUsers.filter(u => u.role === 'R&D');
  sel.innerHTML = (rd.length ? rd : allUsers).map(u => `<option value="${esc(u.name)}">${esc(u.name)}</option>`).join('');
  openModal('assignModal');
}

async function saveAssign() {
  const title = document.getElementById('aTitle').value.trim();
  const assignedTo = document.getElementById('aAssignTo').value;
  if (!title) return showToast('Title likho', true);
  if (!assignedTo) return showToast('Kisko assign karna hai select karo', true);

  const btn = document.getElementById('assignSaveBtn');
  btn.disabled = true; btn.textContent = 'Assigning...';
  try {
    const r = await postJSON({
      action: 'rdAssign', title,
      description: document.getElementById('aDesc').value.trim(),
      assignedBy: currentUser, assignedTo,
      priority: document.querySelector('input[name="aPri"]:checked').value,
      deadline: document.getElementById('aDeadline').value
    });
    if (!r.success) throw new Error(r.error);
    closeModal('assignModal');
    showToast(`${r.projectId} assign ho gaya ✓`);
    loadProjects();
  } catch (err) { showToast(err.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Assign Project'; }
}

// ---------- ENTRY (Note / Remark / Link) ----------
let entryType = 'note';
function openEntryModal() {
  entryType = 'note';
  document.getElementById('eContent').value = '';
  document.getElementById('eUrl').value = '';
  document.getElementById('eLinkName').value = '';
  document.querySelectorAll('#entrySeg .tab').forEach(t => t.classList.toggle('active', t.dataset.etype === 'note'));
  applyEntryType();
  openModal('entryModal');
}
function setEntryType(t, btn) {
  entryType = t;
  document.querySelectorAll('#entrySeg .tab').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  applyEntryType();
}
function applyEntryType() {
  const isLink = entryType === 'link';
  document.getElementById('eLinkWrap').classList.toggle('hidden', !isLink);
  document.getElementById('eContent').classList.toggle('hidden', isLink);
  document.getElementById('entryLabel').classList.toggle('hidden', isLink);
  document.getElementById('entryTitle').textContent = { note: 'Add Note', remark: 'Add Remark', link: 'Add Link' }[entryType];
  document.getElementById('entryLabel').textContent = entryType === 'remark' ? 'Remark' : 'Note';
}
async function saveEntry() {
  const btn = document.getElementById('entrySaveBtn');
  let payload = { action: 'rdAddEntry', projectId: currentProjectId, type: entryType, by: currentUser };
  if (entryType === 'link') {
    const url = document.getElementById('eUrl').value.trim();
    if (!url) return showToast('Link paste karo', true);
    payload.url = url;
    payload.content = document.getElementById('eLinkName').value.trim();
    payload.fileName = document.getElementById('eLinkName').value.trim();
  } else {
    const content = document.getElementById('eContent').value.trim();
    if (!content) return showToast('Kuch likho', true);
    payload.content = content;
  }
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const r = await postJSON(payload);
    if (!r.success) throw new Error(r.error);
    closeModal('entryModal');
    showToast('Add ho gaya ✓');
    openDetail(currentProjectId);
  } catch (err) { showToast(err.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Save'; }
}

// ---------- UPLOAD ----------
function openUploadModal() {
  uploadQueue = [];
  document.getElementById('uCaption').value = '';
  document.getElementById('uploadList').innerHTML = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadStartBtn').disabled = true;
  openModal('uploadModal');
}
function queueFiles(files) {
  uploadQueue = Array.from(files).map(f => ({ file: f, status: 'wait' }));
  renderUploadList();
  document.getElementById('uploadStartBtn').disabled = uploadQueue.length === 0;
}
function renderUploadList() {
  const map = { wait: 'Ready', up: 'Uploading...', done: 'Done ✓', err: 'Failed' };
  document.getElementById('uploadList').innerHTML = uploadQueue.map((q, i) => `
    <div class="upl-item">
      <span>${q.file.type.startsWith('image') ? '🖼' : q.file.type.startsWith('video') ? '🎬' : '📄'}</span>
      <span class="upl-name">${esc(q.file.name)}</span>
      <span class="upl-status ${q.status}">${map[q.status]}</span>
    </div>`).join('');
}
function fileType(f) {
  if (f.type.startsWith('image')) return 'photo';
  if (f.type.startsWith('video')) return 'video';
  return 'doc';
}
function readB64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('File read fail'));
    r.readAsDataURL(file);
  });
}
async function startUpload() {
  const btn = document.getElementById('uploadStartBtn');
  const caption = document.getElementById('uCaption').value.trim();
  btn.disabled = true; btn.textContent = 'Uploading...';
  let ok = 0;
  for (let i = 0; i < uploadQueue.length; i++) {
    if (uploadQueue[i].status === 'done') { ok++; continue; }
    uploadQueue[i].status = 'up'; renderUploadList();
    try {
      const b64 = await readB64(uploadQueue[i].file);
      const r = await postJSON({
        action: 'rdUploadMedia', projectId: currentProjectId,
        fileName: uploadQueue[i].file.name, mimeType: uploadQueue[i].file.type,
        mediaType: fileType(uploadQueue[i].file), dataBase64: b64,
        caption, by: currentUser
      });
      if (!r.success) throw new Error(r.error);
      uploadQueue[i].status = 'done'; ok++;
    } catch (err) {
      uploadQueue[i].status = 'err';
      showToast(uploadQueue[i].file.name + ': ' + err.message, true);
    }
    renderUploadList();
  }
  btn.textContent = 'Upload';
  if (ok === uploadQueue.length) {
    showToast(`${ok} file upload ✓`);
    setTimeout(() => { closeModal('uploadModal'); openDetail(currentProjectId); }, 700);
  } else {
    btn.disabled = false;
  }
}

// ---------- REVIEW ----------
function openReviewModal() {
  selectedReviewRating = '';
  document.getElementById('rFeedback').value = '';
  document.getElementById('reviewRatings').innerHTML = ratingOptions.map(opt => {
    const plain = opt.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u2B50]/gu, '').trim();
    return `<button class="rating-btn" data-r="${esc(plain)}" onclick="pickReviewRating(this)">${esc(opt)}</button>`;
  }).join('');
  openModal('reviewModal');
}
function pickReviewRating(btn) {
  selectedReviewRating = btn.dataset.r;
  document.querySelectorAll('#reviewRatings .rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}
async function submitReview(decision) {
  if (decision === 'Approved' && !selectedReviewRating) return showToast('Rating select karo', true);
  try {
    showToast('Saving review...');
    const r = await postJSON({
      action: 'rdReview', projectId: currentProjectId, decision,
      rating: decision === 'Approved' ? selectedReviewRating : '',
      feedback: document.getElementById('rFeedback').value.trim(), by: currentUser
    });
    if (!r.success) throw new Error(r.error);
    closeModal('reviewModal');
    showToast(decision === 'Approved' ? '✅ Approved' : '❌ Rejected — wapas bheja');
    openDetail(currentProjectId);
  } catch (err) { showToast(err.message, true); }
}

// ---------- LIGHTBOX ----------
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }

// ---------- SCREEN / MODAL ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---------- NETWORK ----------
async function getJSON(action, params = {}) {
  const q = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${CONFIG.GAS_URL}?${q}`);
  return res.json();
}
async function postJSON(payload) {
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// ---------- HELPERS ----------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
