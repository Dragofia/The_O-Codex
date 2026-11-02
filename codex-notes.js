/**
 * The O-Codex — Session Summaries & Dual-Tier Campaign Notes (Phase 3)
 * Powers:
 *  1. Dual-Tier Notes: Personal (Private local scratchpad) vs. Party Shared (Real-time Firebase sync)
 *  2. Markdown & Interactive Checklists: Real-time preview with clickable checkboxes
 *  3. Inline Codex Cross-Linking inside Notes: Automatically turns mentions of lore into interactive links
 *  4. Formatting Toolbar: Quick bold, italic, headings, bullet lists, checkboxes, timestamps
 *  5. Seamless Auto-Save & Attribution: Shows author, timestamp, and saved status
 */

(function () {
  const PERSONAL_STORAGE_KEY = 'o_codex_personal_notes';
  const SHARED_STORAGE_KEY = 'o_codex_shared_notes';

  class CodexNotesManager {
    constructor() {
      this.currentEntryId = null;
      this.currentEntry = null;
      this.activeTab = 'personal'; // 'personal' | 'shared'
      this.activeMode = 'edit';    // 'edit' | 'preview'

      this.personalCache = {}; // { [entryId]: "text" }
      this.sharedCache = {};   // { [entryId]: { content, author, updatedAt } }

      this.saveDebounceTimer = null;
      this.isTyping = false;
      this.typingTimer = null;

      this.loadStorage();
    }

    loadStorage() {
      try {
        const rawPersonal = localStorage.getItem(PERSONAL_STORAGE_KEY);
        this.personalCache = rawPersonal ? JSON.parse(rawPersonal) : {};
        if (typeof this.personalCache !== 'object') this.personalCache = {};
      } catch (e) {
        this.personalCache = {};
      }

      try {
        const rawShared = localStorage.getItem(SHARED_STORAGE_KEY);
        this.sharedCache = rawShared ? JSON.parse(rawShared) : {};
        if (typeof this.sharedCache !== 'object') this.sharedCache = {};
      } catch (e) {
        this.sharedCache = {};
      }
    }

    savePersonalStorage() {
      try {
        localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(this.personalCache));
      } catch (e) {}
    }

    saveSharedStorage() {
      try {
        localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(this.sharedCache));
      } catch (e) {}
    }

    init() {
      this.bindGlobalEvents();
    }

    bindGlobalEvents() {
      // Listen to entry opened in modal
      window.addEventListener('codex:entry-opened', (e) => {
        const entry = e.detail?.entry || (window.state?.worldData?.entries?.find(i => i.id === e.detail?.entryId));
        if (entry) {
          this.attachToEntry(entry);
        }
      });

      // Listen to entry closed
      window.addEventListener('codex:entry-closed', () => {
        this.flushPendingSave();
        this.currentEntryId = null;
        this.currentEntry = null;
      });
    }

    attachToEntry(entry) {
      this.flushPendingSave();
      this.currentEntry = entry;
      this.currentEntryId = entry.id;

      const section = document.getElementById('modal-notes-section');
      if (!section) return;

      // Ensure section is visible
      section.classList.remove('hidden');

      this.initSectionDOM(section);
      this.renderCurrentNote();
    }

    initSectionDOM(section) {
      if (section.dataset.initialized === 'true') return;
      section.dataset.initialized = 'true';

      // Tab switcher
      section.querySelectorAll('.notes-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          const tab = tabBtn.dataset.tab;
          this.switchTab(tab);
        });
      });

      // Mode switcher (Write vs Preview)
      section.querySelectorAll('.notes-mode-btn').forEach(modeBtn => {
        modeBtn.addEventListener('click', () => {
          const mode = modeBtn.dataset.mode;
          this.switchMode(mode);
        });
      });

      // Formatting tools
      section.querySelectorAll('.notes-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          this.insertFormatting(action);
        });
      });

      // Textarea input
      const textarea = document.getElementById('notes-textarea');
      if (textarea) {
        textarea.addEventListener('input', () => {
          this.isTyping = true;
          clearTimeout(this.typingTimer);
          this.typingTimer = setTimeout(() => {
            this.isTyping = false;
          }, 1200);

          this.handleInput(textarea.value);
        });

        // Tab indentation support in textarea
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
            this.handleInput(textarea.value);
          }
        });
      }
    }

    switchTab(tab) {
      if (this.activeTab === tab) return;
      this.flushPendingSave();
      this.activeTab = tab;

      // Update UI tab buttons
      const section = document.getElementById('modal-notes-section');
      if (section) {
        section.querySelectorAll('.notes-tab').forEach(btn => {
          btn.classList.toggle('is-active', btn.dataset.tab === tab);
        });
      }

      this.renderCurrentNote();
    }

    switchMode(mode) {
      this.activeMode = mode;
      const section = document.getElementById('modal-notes-section');
      if (!section) return;

      section.querySelectorAll('.notes-mode-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mode === mode);
      });

      const textarea = document.getElementById('notes-textarea');
      const preview = document.getElementById('notes-preview');

      if (mode === 'preview') {
        textarea?.classList.add('hidden');
        preview?.classList.remove('hidden');
        this.renderPreview();
      } else {
        preview?.classList.add('hidden');
        textarea?.classList.remove('hidden');
        textarea?.focus();
      }
    }

    renderCurrentNote() {
      if (!this.currentEntryId) return;

      const textarea = document.getElementById('notes-textarea');
      const statusIcon = document.getElementById('notes-status-icon');
      const statusText = document.getElementById('notes-status-text');
      const attributionEl = document.getElementById('notes-attribution-label');
      const saveStatus = document.getElementById('notes-save-status');

      if (this.activeTab === 'personal') {
        const text = this.personalCache[this.currentEntryId] || '';
        if (textarea) textarea.value = text;
        if (statusIcon) statusIcon.textContent = '🔒';
        if (statusText) statusText.textContent = 'Personal Notes (Private to you)';
        if (attributionEl) attributionEl.textContent = 'Saved in your browser';
      } else {
        const sharedObj = this.sharedCache[this.currentEntryId];
        const text = sharedObj ? (sharedObj.content || '') : '';
        if (textarea) textarea.value = text;
        if (statusIcon) statusIcon.textContent = '👥';
        if (statusText) statusText.textContent = 'Party Shared Notes (Real-time cloud sync)';

        const author = sharedObj?.author || 'No party notes yet';
        const dateStr = sharedObj?.updatedAt ? this.formatTimeAgo(sharedObj.updatedAt) : '';
        if (attributionEl) {
          attributionEl.textContent = sharedObj ? `Last edited by ${author} · ${dateStr}` : 'Party notes (Start typing to create)';
        }
      }

      if (saveStatus) {
        saveStatus.textContent = 'Saved ✓';
        saveStatus.classList.remove('is-saving');
      }

      // Update indicators
      this.updateTabIndicators();

      // If currently previewing, update preview immediately
      if (this.activeMode === 'preview') {
        this.renderPreview();
      }
    }

    updateTabIndicators() {
      const personalDot = document.getElementById('notes-personal-indicator');
      const sharedDot = document.getElementById('notes-shared-indicator');

      const hasPersonal = Boolean(this.personalCache[this.currentEntryId]?.trim());
      const hasShared = Boolean(this.sharedCache[this.currentEntryId]?.content?.trim());

      if (personalDot) personalDot.style.display = hasPersonal ? 'inline-block' : 'none';
      if (sharedDot) sharedDot.style.display = hasShared ? 'inline-block' : 'none';
    }

    handleInput(content) {
      const saveStatus = document.getElementById('notes-save-status');
      if (saveStatus) {
        saveStatus.textContent = 'Saving...';
        saveStatus.classList.add('is-saving');
      }

      clearTimeout(this.saveDebounceTimer);

      const entryId = this.currentEntryId;
      const tab = this.activeTab;

      this.saveDebounceTimer = setTimeout(() => {
        this.saveNote(entryId, tab, content);
      }, tab === 'personal' ? 300 : 700);
    }

    flushPendingSave() {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
        this.saveDebounceTimer = null;
        const textarea = document.getElementById('notes-textarea');
        if (textarea && this.currentEntryId) {
          this.saveNote(this.currentEntryId, this.activeTab, textarea.value);
        }
      }
    }

    saveNote(entryId, tab, content) {
      if (!entryId) return;

      const playerName = localStorage.getItem('o_codex_player_name') || 'Adventurer';

      if (tab === 'personal') {
        if (content.trim()) {
          this.personalCache[entryId] = content;
        } else {
          delete this.personalCache[entryId];
        }
        this.savePersonalStorage();
      } else {
        const noteRecord = {
          content,
          author: playerName,
          updatedAt: Date.now()
        };

        if (content.trim()) {
          this.sharedCache[entryId] = noteRecord;
        } else {
          delete this.sharedCache[entryId];
        }
        this.saveSharedStorage();

        // Push to Firebase Firestore
        if (window.CampaignCloudSync && typeof window.CampaignCloudSync.pushNote === 'function') {
          window.CampaignCloudSync.pushNote(entryId, noteRecord);
        }
      }

      const saveStatus = document.getElementById('notes-save-status');
      if (saveStatus) {
        saveStatus.textContent = 'Saved ✓';
        saveStatus.classList.remove('is-saving');
      }

      this.updateTabIndicators();
    }

    /* ========================================================================
       CLOUD SYNC LISTENER (Incoming updates from Firebase)
       ======================================================================== */
    onRemoteNotes(data) {
      if (!data || typeof data !== 'object') return;
      const remoteNotes = data.notes || data;
      if (typeof remoteNotes !== 'object') return;

      // Merge into sharedCache
      Object.keys(remoteNotes).forEach(id => {
        const remote = remoteNotes[id];
        if (remote && typeof remote.content === 'string') {
          this.sharedCache[id] = remote;
        }
      });

      this.saveSharedStorage();

      // If user currently has this entry open on the shared tab, update without disrupting active typing
      if (this.currentEntryId && this.activeTab === 'shared' && !this.isTyping) {
        const textarea = document.getElementById('notes-textarea');
        const remote = this.sharedCache[this.currentEntryId];
        if (textarea && remote && textarea.value !== remote.content) {
          textarea.value = remote.content;
          if (this.activeMode === 'preview') {
            this.renderPreview();
          }
        }
        const attributionEl = document.getElementById('notes-attribution-label');
        if (attributionEl && remote) {
          attributionEl.textContent = `Last edited by ${remote.author || 'Party Member'} · ${this.formatTimeAgo(remote.updatedAt)}`;
        }
      }

      this.updateTabIndicators();
    }

    /* ========================================================================
       FORMATTING TOOLBAR
       ======================================================================== */
    insertFormatting(action) {
      const textarea = document.getElementById('notes-textarea');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);

      let replacement = '';
      let cursorOffset = 0;

      switch (action) {
        case 'bold':
          replacement = `**${selected || 'bold text'}**`;
          cursorOffset = selected ? replacement.length : 2;
          break;
        case 'italic':
          replacement = `*${selected || 'italic text'}*`;
          cursorOffset = selected ? replacement.length : 1;
          break;
        case 'heading':
          replacement = `\n### ${selected || 'Section Title'}\n`;
          cursorOffset = replacement.length;
          break;
        case 'bullet':
          replacement = `\n- ${selected || 'List item'}`;
          cursorOffset = replacement.length;
          break;
        case 'checkbox':
          replacement = `\n- [ ] ${selected || 'Task or objective'}`;
          cursorOffset = replacement.length;
          break;
        case 'timestamp':
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          replacement = `[${timeStr}] `;
          cursorOffset = replacement.length;
          break;
        default:
          return;
      }

      textarea.setRangeText(replacement, start, end, 'end');
      textarea.focus();
      this.handleInput(textarea.value);
    }

    /* ========================================================================
       MARKDOWN & CHECKLIST PREVIEW RENDERER
       ======================================================================== */
    renderPreview() {
      const preview = document.getElementById('notes-preview');
      const textarea = document.getElementById('notes-textarea');
      if (!preview || !textarea) return;

      const raw = textarea.value;
      if (!raw.trim()) {
        preview.innerHTML = `
          <div class="notes-preview-empty">
            <em>No notes recorded yet. Switch to "Write" to add session notes or quest checkpoints.</em>
          </div>
        `;
        return;
      }

      const lines = raw.split('\n');
      const htmlLines = lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Checkbox items: "- [ ] " or "- [x] "
        if (line.match(/^[-*]\s+\[ \]\s+(.*)$/i)) {
          const content = line.replace(/^[-*]\s+\[ \]\s+/i, '');
          return `<div class="notes-preview-check">
            <input type="checkbox" data-line="${lineIdx}" aria-label="Toggle task" />
            <span>${this.formatInline(content)}</span>
          </div>`;
        }

        if (line.match(/^[-*]\s+\[x\]\s+(.*)$/i)) {
          const content = line.replace(/^[-*]\s+\[x\]\s+/i, '');
          return `<div class="notes-preview-check is-checked">
            <input type="checkbox" checked data-line="${lineIdx}" aria-label="Toggle task" />
            <span class="notes-checked-text">${this.formatInline(content)}</span>
          </div>`;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return `<h4 class="notes-preview-h3">${this.formatInline(trimmed.substring(4))}</h4>`;
        }
        if (trimmed.startsWith('## ')) {
          return `<h3 class="notes-preview-h2">${this.formatInline(trimmed.substring(3))}</h3>`;
        }
        if (trimmed.startsWith('# ')) {
          return `<h2 class="notes-preview-h1">${this.formatInline(trimmed.substring(2))}</h2>`;
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<li class="notes-preview-li">${this.formatInline(trimmed.substring(2))}</li>`;
        }

        if (!trimmed) {
          return '<div class="notes-preview-spacer"></div>';
        }

        return `<p class="notes-preview-p">${this.formatInline(line)}</p>`;
      });

      preview.innerHTML = htmlLines.join('');

      // Wire interactive checkbox toggles in preview mode!
      preview.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const lineIdx = parseInt(chk.dataset.line, 10);
          this.toggleCheckboxLine(lineIdx, chk.checked);
        });
      });
    }

    formatInline(text) {
      if (!text) return '';

      // Escape base HTML
      let escaped = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Timestamps: [HH:MM]
      escaped = escaped.replace(/\[(\d{1,2}:\d{2})\]/g, '<span class="notes-preview-time">[$1]</span>');

      // Bold: **text**
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Italic: *text*
      escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Inline Codex Cross-linking (via CodexLinker if available)
      if (window.CodexLinker && typeof window.CodexLinker.linkifyText === 'function') {
        escaped = window.CodexLinker.linkifyText(escaped, this.currentEntryId);
      }

      return escaped;
    }

    toggleCheckboxLine(lineIdx, isChecked) {
      const textarea = document.getElementById('notes-textarea');
      if (!textarea) return;

      const lines = textarea.value.split('\n');
      if (lineIdx >= 0 && lineIdx < lines.length) {
        if (isChecked) {
          lines[lineIdx] = lines[lineIdx].replace(/^([-*]\s+\[) \]/i, '$1x]');
        } else {
          lines[lineIdx] = lines[lineIdx].replace(/^([-*]\s+\[)x\]/i, '$1 ]');
        }
        textarea.value = lines.join('\n');
        this.saveNote(this.currentEntryId, this.activeTab, textarea.value);
        this.renderPreview();
      }
    }

    formatTimeAgo(timestamp) {
      if (!timestamp) return '';
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  }

  window.CodexNotes = new CodexNotesManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CodexNotes.init());
  } else {
    window.CodexNotes.init();
  }
})();
