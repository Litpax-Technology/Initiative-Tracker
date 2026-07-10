<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Litpax R&D Tracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- ================= LOGIN ================= -->
  <div id="loginScreen" class="screen active">
    <div class="login-box">
      <div class="brand">
        <div class="brand-mark">🔬</div>
        <div class="brand-name" id="brandNameLogin">Litpax <span>R&D Tracker</span></div>
      </div>
      <div class="quote-card">
        <div class="quote-icon">&ldquo;</div>
        <p id="quoteText" class="quote-text">Loading...</p>
      </div>
      <div class="login-form">
        <label class="field-label" for="nameSelect">Select Your Name</label>
        <select id="nameSelect" class="input"><option value="">Loading names...</option></select>
        <label class="field-label" for="pinInput">Enter Your PIN</label>
        <input type="password" id="pinInput" class="input" inputmode="numeric" maxlength="6" placeholder="****" onkeydown="if(event.key==='Enter')login()">
        <button id="loginBtn" class="btn btn-primary btn-block" onclick="login()">Continue →</button>
      </div>
    </div>
  </div>

  <!-- ================= LIST / DASHBOARD ================= -->
  <div id="listScreen" class="screen">
    <header class="topbar">
      <div class="brand small">
        <div class="brand-mark">🔬</div>
        <div class="brand-name" id="brandNameTop">R&D Tracker</div>
      </div>
      <div class="topbar-right">
        <span id="roleChip" class="role-chip"></span>
        <span id="userChip" class="user-chip"></span>
        <button class="btn btn-ghost" onclick="logout()">Logout</button>
      </div>
    </header>

    <main class="container admin-container">
      <div class="dash-head">
        <div>
          <h1 id="greeting" class="dash-title">R&D Projects</h1>
          <p class="dash-sub" id="dashSub">Loading...</p>
        </div>
        <button id="assignBtn" class="btn btn-primary hidden" onclick="openAssignModal()">＋ Assign Project</button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card"><div class="stat-num" id="statTotal">0</div><div class="stat-label">Total</div></div>
        <div class="stat-card progress"><div class="stat-num" id="statActive">0</div><div class="stat-label">Active</div></div>
        <div class="stat-card pending"><div class="stat-num" id="statReview">0</div><div class="stat-label">Review Pending</div></div>
        <div class="stat-card done"><div class="stat-num" id="statApproved">0</div><div class="stat-label">Approved</div></div>
      </div>

      <!-- Filter -->
      <div class="filter-tabs" id="filterTabs">
        <button class="tab active" data-filter="All" onclick="setFilter('All', this)">All</button>
        <button class="tab" data-filter="Assigned" onclick="setFilter('Assigned', this)">Assigned</button>
        <button class="tab" data-filter="In Progress" onclick="setFilter('In Progress', this)">In Progress</button>
        <button class="tab" data-filter="Testing" onclick="setFilter('Testing', this)">Testing</button>
        <button class="tab" data-filter="Completed" onclick="setFilter('Completed', this)">Review</button>
        <button class="tab" data-filter="Approved" onclick="setFilter('Approved', this)">Approved</button>
      </div>

      <div id="projectList" class="task-list">
        <div class="loader">Loading projects...</div>
      </div>
    </main>
  </div>

  <!-- ================= PROJECT DETAIL ================= -->
  <div id="detailScreen" class="screen">
    <header class="topbar">
      <div class="brand small">
        <div class="brand-mark">🔬</div>
        <div class="brand-name">R&D Tracker</div>
      </div>
      <div class="topbar-right">
        <span id="roleChip2" class="role-chip"></span>
        <button class="btn btn-ghost" onclick="backToList()">← Back</button>
      </div>
    </header>
    <main class="container">
      <button class="back-link" onclick="backToList()">← All Projects</button>
      <div id="detailBody">
        <div class="loader">Loading...</div>
      </div>
    </main>
  </div>

  <!-- ================= ASSIGN MODAL ================= -->
  <div id="assignModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-head"><h2>Assign R&D Project</h2><button class="modal-close" onclick="closeModal('assignModal')">✕</button></div>
      <div class="modal-body">
        <label class="field-label">Project Title *</label>
        <input type="text" id="aTitle" class="input" placeholder="e.g. Naye 48V pack ka thermal test">
        <label class="field-label">Description / Task Detail</label>
        <textarea id="aDesc" class="input" rows="3" placeholder="Kya karna hai, kya expected output hai..."></textarea>
        <label class="field-label">Assign To (R&D) *</label>
        <select id="aAssignTo" class="input"></select>
        <label class="field-label">Priority</label>
        <div class="radio-row">
          <label class="radio-pill"><input type="radio" name="aPri" value="High"> High</label>
          <label class="radio-pill"><input type="radio" name="aPri" value="Medium" checked> Medium</label>
          <label class="radio-pill"><input type="radio" name="aPri" value="Low"> Low</label>
        </div>
        <label class="field-label">Deadline (optional)</label>
        <input type="date" id="aDeadline" class="input">
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('assignModal')">Cancel</button>
        <button id="assignSaveBtn" class="btn btn-primary" onclick="saveAssign()">Assign Project</button>
      </div>
    </div>
  </div>

  <!-- ================= ADD ENTRY MODAL (Note / Remark / Link) ================= -->
  <div id="entryModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-head"><h2 id="entryTitle">Add Note</h2><button class="modal-close" onclick="closeModal('entryModal')">✕</button></div>
      <div class="modal-body">
        <div class="seg" id="entrySeg">
          <button class="tab active" data-etype="note" onclick="setEntryType('note', this)">📝 Note</button>
          <button class="tab" data-etype="remark" onclick="setEntryType('remark', this)">💬 Remark</button>
          <button class="tab" data-etype="link" onclick="setEntryType('link', this)">🔗 Link</button>
        </div>
        <label class="field-label" id="entryLabel">Note</label>
        <textarea id="eContent" class="input" rows="3" placeholder="Yahan likho..."></textarea>
        <div id="eLinkWrap" class="hidden">
          <label class="field-label">Paste link (Drive / YouTube / kuch bhi)</label>
          <input type="text" id="eUrl" class="input" placeholder="https://...">
          <label class="field-label">Label (optional)</label>
          <input type="text" id="eLinkName" class="input" placeholder="e.g. Test video">
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('entryModal')">Cancel</button>
        <button id="entrySaveBtn" class="btn btn-primary" onclick="saveEntry()">Save</button>
      </div>
    </div>
  </div>

  <!-- ================= UPLOAD MODAL ================= -->
  <div id="uploadModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-head"><h2>Upload Media</h2><button class="modal-close" onclick="closeModal('uploadModal')">✕</button></div>
      <div class="modal-body">
        <div class="drop" onclick="document.getElementById('fileInput').click()">
          <div class="drop-icon">📎</div>
          <div class="drop-text">Photos / Videos / Documents chuno</div>
          <div class="drop-sub">Max 30MB per file. Bade video ke liye "Link add karo".</div>
        </div>
        <input type="file" id="fileInput" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xlsx" class="hidden" onchange="queueFiles(this.files)">
        <label class="field-label" style="margin-top:14px;">Caption (optional, sabhi files pe lagega)</label>
        <input type="text" id="uCaption" class="input" placeholder="e.g. Prototype v2 photos">
        <div id="uploadList" class="upload-list"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('uploadModal')">Close</button>
        <button id="uploadStartBtn" class="btn btn-primary" onclick="startUpload()" disabled>Upload</button>
      </div>
    </div>
  </div>

  <!-- ================= REVIEW MODAL ================= -->
  <div id="reviewModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-head"><h2>🧪 Review Project</h2><button class="modal-close" onclick="closeModal('reviewModal')">✕</button></div>
      <div class="modal-body">
        <p class="modal-question">Rating do (approve karte waqt):</p>
        <div class="review-ratings" id="reviewRatings"></div>
        <label class="field-label">Feedback / Remarks</label>
        <textarea id="rFeedback" class="input" rows="3" placeholder="Kaam kaisa laga? Kya change chahiye?"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost btn-outline-red" style="color:var(--red);border:1px solid var(--red);background:#fff;" onclick="submitReview('Rejected')">✕ Reject</button>
        <button class="btn btn-primary" style="background:var(--green);" onclick="submitReview('Approved')">✓ Approve</button>
      </div>
    </div>
  </div>

  <!-- Lightbox -->
  <div id="lightbox" class="lightbox" onclick="closeLightbox()">
    <button class="lightbox-close">✕</button>
    <img id="lightboxImg" src="" alt="">
  </div>

  <div id="toast" class="toast"></div>

  <script src="config.js"></script>
  <script src="rnd.js"></script>
</body>
</html>
