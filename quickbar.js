/**
 * The O-Codex — Quick-Bar & Global Navigation Dock
 * Tracks the player's recent entries, supports pinning favorites, and powers 1-5 hotkey jumping.
 */

(function () {
  const STORAGE_KEY = 'o_codex_recent_history';
  const COLLAPSED_KEY = 'o_codex_quickbar_collapsed';
  const MAX_ITEMS = 7;

  class QuickBarManager {
    constructor() {
      this.dock = null;
      this.listEl = null;
      this.countEl = null;
      this.toggleBtn = null;
      this.clearBtn = null;
      this.chevronEl = null;
      this.history = [];
      this.isCollapsed = false;
    }

    init() {
      this.loadStorage();
      this.initElements();
      this.bindEvents();
      this.render();
    }

    loadStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.history = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.history)) this.history = [];
      } catch (e) {
        this.history = [];
      }

      const storedCollapsed = localStorage.getItem(COLLAPSED_KEY);
      if (storedCollapsed !== null) {
        this.isCollapsed = storedCollapsed === 'true';
      } else {
        // Default collapsed on narrow mobile screens
        this.isCollapsed = window.innerWidth <= 640;
      }
    }

    saveStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
      } catch (e) {}
    }

    initElements() {
      this.dock = document.getElementById('quickbar-dock');
      this.listEl = document.getElementById('quickbar-list');
      this.countEl = document.getElementById('quickbar-badge');
      this.toggleBtn = document.getElementById('quickbar-toggle-btn');
      this.clearBtn = document.getElementById('quickbar-clear-btn');
      this.chevronEl = document.getElementById('quickbar-chevron');

      this.updateCollapsedUI();
    }

    record(entry) {
      if (!entry || !entry.id) return;

      const title = entry.title || entry.name || entry.id;
      const category = entry.category || 'general';

      const existingIndex = this.history.findIndex(item => item.id === entry.id);
      let isPinned = false;

      if (existingIndex !== -1) {
        isPinned = Boolean(this.history[existingIndex].pinned);
        this.history.splice(existingIndex, 1);
      }

      // Add to front of history
      this.history.unshift({
        id: entry.id,
        title,
        category,
        pinned: isPinned,
        timestamp: Date.now()
      });

      // Prune unpinned items exceeding limit
      if (this.history.length > MAX_ITEMS) {
        for (let i = this.history.length - 1; i >= 0; i--) {
          if (!this.history[i].pinned) {
            this.history.splice(i, 1);
            break;
          }
        }
      }

      this.saveStorage();
      this.render();
    }

    togglePin(id, event) {
      if (event) event.stopPropagation();
      const item = this.history.find(h => h.id === id);
      if (!item) return;
      item.pinned = !item.pinned;
      this.saveStorage();
      this.render();
      window.showToast?.(
        item.pinned ? `Pinned "${item.title}" to Quick-Bar` : `Unpinned "${item.title}"`,
        "info",
        1800
      );
    }

    remove(id, event) {
      if (event) event.stopPropagation();
      this.history = this.history.filter(h => h.id !== id);
      this.saveStorage();
      this.render();
    }

    clearUnpinned() {
      const beforeCount = this.history.length;
      this.history = this.history.filter(h => h.pinned);
      this.saveStorage();
      this.render();
      const removed = beforeCount - this.history.length;
      if (removed > 0) {
        window.showToast?.(`Cleared ${removed} recent item(s). Pinned entries kept.`, "info", 1800);
      }
    }

    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      localStorage.setItem(COLLAPSED_KEY, this.isCollapsed ? 'true' : 'false');
      this.updateCollapsedUI();
    }

    updateCollapsedUI() {
      if (!this.dock) return;
      this.dock.classList.toggle('is-collapsed', this.isCollapsed);
      if (this.toggleBtn) {
        this.toggleBtn.setAttribute('aria-expanded', (!this.isCollapsed).toString());
        this.toggleBtn.title = this.isCollapsed ? 'Expand Quick-Bar (Recent entries)' : 'Collapse Quick-Bar';
      }
      if (this.chevronEl) {
        this.chevronEl.textContent = this.isCollapsed ? '▴' : '▾';
      }
    }

    openIndex(idx) {
      if (idx < 0 || idx >= this.history.length) return;
      const target = this.history[idx];
      if (target && window.openModal) {
        window.openModal(target.id);
      }
    }

    getCategoryColor(category) {
      const cat = String(category || '').toLowerCase();
      if (cat.includes('settlement') || cat.includes('domain')) return '#fbbf24';
      if (cat.includes('quest') || cat.includes('faction')) return '#38bdf8';
      if (cat.includes('divion') || cat.includes('manifest') || cat.includes('combat')) return '#f43f5e';
      if (cat.includes('eschaton') || cat.includes('creature') || cat.includes('monster')) return '#c084fc';
      if (cat.includes('lore') || cat.includes('relic') || cat.includes('item')) return '#34d399';
      return '#94a3b8';
    }

    render() {
      if (!this.listEl) return;

      if (this.countEl) {
        this.countEl.textContent = this.history.length;
        this.countEl.style.display = this.history.length > 0 ? 'inline-flex' : 'none';
      }

      if (this.clearBtn) {
        const hasUnpinned = this.history.some(h => !h.pinned);
        this.clearBtn.style.display = hasUnpinned ? 'inline-block' : 'none';
      }

      if (this.history.length === 0) {
        this.listEl.innerHTML = `
          <div class="quickbar-empty">
            <span>No recent entries yet. Press <kbd class="quickbar-kbd">/</kbd> to browse.</span>
          </div>
        `;
        return;
      }

      this.listEl.innerHTML = '';
      this.history.forEach((item, index) => {
        const pill = document.createElement('div');
        pill.className = `quickbar-pill ${item.pinned ? 'is-pinned' : ''}`;
        pill.setAttribute('role', 'button');
        pill.setAttribute('tabindex', '0');
        pill.title = `${item.title} (${item.category})\nClick to open${index < 5 ? ` [Hotkey: ${index + 1}]` : ''}`;

        const dotColor = this.getCategoryColor(item.category);
        const hotkeyBadge = index < 5 ? `<span class="quickbar-pill__key" aria-hidden="true">${index + 1}</span>` : '';

        pill.innerHTML = `
          ${hotkeyBadge}
          <span class="quickbar-pill__dot" style="background: ${dotColor};" aria-hidden="true"></span>
          <span class="quickbar-pill__title">${this.escapeHtml(item.title)}</span>
          <button class="quickbar-pill__pin-btn ${item.pinned ? 'is-active' : ''}" type="button" aria-label="${item.pinned ? 'Unpin' : 'Pin'}" title="${item.pinned ? 'Unpin from Quick-Bar' : 'Pin to Quick-Bar'}">
            ${item.pinned ? '📌' : '📍'}
          </button>
          <button class="quickbar-pill__close-btn" type="button" aria-label="Remove" title="Remove from recent">×</button>
        `;

        // Click pill to open entry
        pill.addEventListener('click', (e) => {
          if (e.target.closest('.quickbar-pill__pin-btn') || e.target.closest('.quickbar-pill__close-btn')) {
            return;
          }
          if (window.openModal) {
            window.openModal(item.id);
          }
        });

        pill.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (window.openModal) window.openModal(item.id);
          }
        });

        // Pin toggle
        const pinBtn = pill.querySelector('.quickbar-pill__pin-btn');
        pinBtn?.addEventListener('click', (e) => this.togglePin(item.id, e));

        // Close/Remove
        const closeBtn = pill.querySelector('.quickbar-pill__close-btn');
        closeBtn?.addEventListener('click', (e) => this.remove(item.id, e));

        this.listEl.appendChild(pill);
      });
    }

    escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m]));
    }

    bindEvents() {
      this.toggleBtn?.addEventListener('click', () => this.toggleCollapse());
      this.clearBtn?.addEventListener('click', () => this.clearUnpinned());

      window.addEventListener('codex:entry-opened', (e) => {
        if (e.detail?.entry) {
          this.record(e.detail.entry);
        } else if (e.detail?.entryId && window.state?.worldData?.entries) {
          const found = window.state.worldData.entries.find(item => item.id === e.detail.entryId);
          if (found) this.record(found);
        }
      });
    }
  }

  window.QuickBar = new QuickBarManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.QuickBar.init());
  } else {
    window.QuickBar.init();
  }
})();
