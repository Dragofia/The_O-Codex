/**
 * The O-Codex — Inline Codex Cross-Linker & Hover Preview Cards
 * Automatically cross-links mentions of lore, characters, settlements, and items in descriptions,
 * provides rich hover preview cards, and enables one-click exploration.
 */

(function () {
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'of', 'for', 'to', 'and', 'or', 'with',
    'true', 'false', 'unknown', 'none', 'general', 'entry', 'details', 'name', 'title',
    'from', 'into', 'over', 'under', 'their', 'there', 'they', 'this', 'that', 'these',
    'those', 'what', 'when', 'where', 'which', 'while', 'about', 'after', 'before'
  ]);

  const CATEGORY_COLORS = {
    settlements: '#fbbf24',
    domains: '#fbbf24',
    characters: '#60a5fa',
    manifests: '#f43f5e',
    divions: '#f43f5e',
    eschatons: '#c084fc',
    locations: '#38bdf8',
    factions: '#38bdf8',
    quests: '#38bdf8',
    lore: '#34d399',
    general: '#94a3b8'
  };

  const CATEGORY_ICONS = {
    settlements: '🏰',
    domains: '👑',
    characters: '👤',
    manifests: '⚔️',
    divions: '✨',
    eschatons: '👁️',
    locations: '📍',
    factions: '🛡️',
    quests: '📜',
    lore: '📖',
    general: '📜'
  };

  class CodexLinkerManager {
    constructor() {
      this.cardEl = null;
      this.terms = [];
      this.pattern = null;
      this.hideTimer = null;
      this.showTimer = null;
      this.activeTargetEl = null;
    }

    init() {
      this.ensurePreviewCard();
      this.bindEvents();
    }

    buildIndex(entries) {
      if (!Array.isArray(entries)) return;

      const termsMap = new Map();

      entries.forEach(entry => {
        if (!entry || !entry.id) return;
        const mainTitle = entry.name || entry.title;
        if (mainTitle && mainTitle.length >= 3 && !STOP_WORDS.has(mainTitle.toLowerCase())) {
          termsMap.set(mainTitle.toLowerCase(), {
            term: mainTitle,
            id: entry.id,
            category: entry.category || 'general'
          });
        }

        // Aliases
        if (Array.isArray(entry.aliases)) {
          entry.aliases.forEach(alias => {
            const trimmed = String(alias || '').trim();
            if (trimmed.length >= 3 && !STOP_WORDS.has(trimmed.toLowerCase())) {
              if (!termsMap.has(trimmed.toLowerCase())) {
                termsMap.set(trimmed.toLowerCase(), {
                  term: trimmed,
                  id: entry.id,
                  category: entry.category || 'general'
                });
              }
            }
          });
        }
      });

      this.terms = Array.from(termsMap.values());
      // Sort terms by length descending so longer phrases match first
      this.terms.sort((a, b) => b.term.length - a.term.length);

      const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (this.terms.length > 0) {
        this.pattern = new RegExp('\\b(' + this.terms.map(t => escapeRegex(t.term)).join('|') + ')\\b', 'gi');
      } else {
        this.pattern = null;
      }
    }

    /**
     * Parses raw text and returns a DocumentFragment with text nodes and clickable crosslink buttons
     */
    linkify(rawText, currentEntryId) {
      const fragment = document.createDocumentFragment();
      if (!rawText) return fragment;

      const text = String(rawText);
      const validTerms = this.terms.filter(t => t.id !== currentEntryId);
      const validTermsMap = new Map(validTerms.map(t => [t.term.toLowerCase(), t]));

      // 1. Extract explicit wiki syntax: [[Target Entry|Custom Label]] or [[Target Entry]]
      const wikiRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
      const tokenMap = new Map();
      let tokenCounter = 0;

      const textWithTokens = text.replace(wikiRegex, (match, targetName, customLabel) => {
        const trimmedTarget = targetName.trim().toLowerCase();
        let found = validTerms.find(t => t.term.toLowerCase() === trimmedTarget || t.id.toLowerCase() === trimmedTarget);
        if (!found && window.state?.worldData?.entries) {
          const entry = window.state.worldData.entries.find(e => 
            e.id.toLowerCase() === trimmedTarget || 
            (e.name && e.name.toLowerCase() === trimmedTarget) || 
            (e.title && e.title.toLowerCase() === trimmedTarget)
          );
          if (entry && entry.id !== currentEntryId) {
            found = { term: entry.name || entry.title, id: entry.id, category: entry.category };
          }
        }

        const label = customLabel ? customLabel.trim() : targetName.trim();
        const tokenId = `@@CODEX_LINK_${tokenCounter++}@@`;
        tokenMap.set(tokenId, {
          type: 'link',
          id: found ? found.id : null,
          text: label
        });
        return tokenId;
      });

      // 2. Scan remaining text for automatic term matches
      const linkedIds = new Set();
      // Mark already linked explicit tokens
      for (const token of tokenMap.values()) {
        if (token.id) linkedIds.add(token.id);
      }

      const rawMatches = [];
      if (this.pattern) {
        // Reset regex state
        this.pattern.lastIndex = 0;
        let m;
        while ((m = this.pattern.exec(textWithTokens)) !== null) {
          const matchedText = m[0];
          const matchedTerm = validTermsMap.get(matchedText.toLowerCase());
          if (matchedTerm && !linkedIds.has(matchedTerm.id)) {
            linkedIds.add(matchedTerm.id);
            rawMatches.push({
              start: m.index,
              end: m.index + matchedText.length,
              id: matchedTerm.id,
              text: matchedText
            });
          }
        }
      }

      // 3. Assemble tokens and matches into ordered slices
      let lastIdx = 0;
      const slices = [];
      for (const match of rawMatches) {
        if (match.start > lastIdx) {
          slices.push({ type: 'raw', content: textWithTokens.slice(lastIdx, match.start) });
        }
        slices.push({ type: 'link', id: match.id, text: match.text });
        lastIdx = match.end;
      }
      if (lastIdx < textWithTokens.length) {
        slices.push({ type: 'raw', content: textWithTokens.slice(lastIdx) });
      }

      // 4. Resolve @@CODEX_LINK_X@@ tokens and build real DOM nodes
      const tokenRegex = /(@@CODEX_LINK_\d+@@)/g;
      for (const slice of slices) {
        if (slice.type === 'link') {
          fragment.appendChild(this.createLinkElement(slice.id, slice.text));
        } else {
          const parts = slice.content.split(tokenRegex);
          for (const part of parts) {
            if (!part) continue;
            if (tokenMap.has(part)) {
              const token = tokenMap.get(part);
              if (token.id) {
                fragment.appendChild(this.createLinkElement(token.id, token.text));
              } else {
                fragment.appendChild(document.createTextNode(token.text));
              }
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          }
        }
      }

      return fragment;
    }

    createLinkElement(id, text) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'codex-crosslink';
      button.dataset.entryId = id;
      button.textContent = text;
      button.setAttribute('aria-label', `View codex entry: ${text}`);
      return button;
    }

    renderInto(containerEl, rawText, currentEntryId) {
      if (!containerEl) return;
      containerEl.replaceChildren(this.linkify(rawText, currentEntryId));
    }

    ensurePreviewCard() {
      let card = document.getElementById('codex-preview-card');
      if (!card) {
        card = document.createElement('div');
        card.id = 'codex-preview-card';
        card.className = 'codex-preview-card';
        card.setAttribute('aria-hidden', 'true');
        card.innerHTML = `
          <div class="preview-card__header">
            <span class="preview-card__category-chip">
              <span class="preview-card__dot"></span>
              <span class="preview-card__cat-label">Entry</span>
            </span>
            <span class="preview-card__location hidden"></span>
          </div>
          <div class="preview-card__body">
            <div class="preview-card__thumb hidden"></div>
            <div class="preview-card__content">
              <h4 class="preview-card__title">Title</h4>
              <p class="preview-card__excerpt">Summary</p>
            </div>
          </div>
          <div class="preview-card__footer">
            <span class="preview-card__hint">Click to inspect · Adds to Quick-Bar</span>
          </div>
        `;
        document.body.appendChild(card);
      }
      this.cardEl = card;
    }

    showPreview(targetEl, entryId) {
      if (!this.cardEl || !targetEl || !entryId) return;

      const entries = window.state?.worldData?.entries;
      if (!entries) return;

      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      clearTimeout(this.hideTimer);
      this.activeTargetEl = targetEl;

      const category = entry.category || 'general';
      const catColor = CATEGORY_COLORS[category] || '#94a3b8';
      const catIcon = CATEGORY_ICONS[category] || '📜';

      // Header
      const dot = this.cardEl.querySelector('.preview-card__dot');
      const catLabel = this.cardEl.querySelector('.preview-card__cat-label');
      if (dot) dot.style.background = catColor;
      if (catLabel) {
        catLabel.textContent = `${catIcon} ${(entry.category || 'Lore').toUpperCase()}`;
        catLabel.style.color = catColor;
      }

      // Location
      const locBadge = this.cardEl.querySelector('.preview-card__location');
      const locInfo = window.resolveEntryLocation ? window.resolveEntryLocation(entry) : null;
      if (locBadge) {
        if (locInfo && (locInfo.location || locInfo.domain)) {
          const locText = locInfo.location && locInfo.domain && !locInfo.location.toLowerCase().includes(locInfo.domain.toLowerCase())
            ? `${locInfo.location} · ${locInfo.domain}`
            : (locInfo.location || locInfo.domain);
          locBadge.textContent = `📍 ${locText}`;
          locBadge.classList.remove('hidden');
        } else {
          locBadge.classList.add('hidden');
        }
      }

      // Title & Excerpt
      const titleEl = this.cardEl.querySelector('.preview-card__title');
      const excerptEl = this.cardEl.querySelector('.preview-card__excerpt');
      if (titleEl) titleEl.textContent = entry.name || entry.title || entry.id;
      if (excerptEl) {
        const full = entry.summary || entry.description || 'No description available.';
        excerptEl.textContent = full.length > 135 ? full.slice(0, 132) + '...' : full;
      }

      // Thumbnail
      const thumbEl = this.cardEl.querySelector('.preview-card__thumb');
      if (thumbEl) {
        if (entry.image) {
          thumbEl.innerHTML = `<img src="${entry.image}" alt="" loading="lazy">`;
          thumbEl.classList.remove('hidden');
        } else {
          thumbEl.innerHTML = '';
          thumbEl.classList.add('hidden');
        }
      }

      // Position
      this.positionCard(targetEl);
      this.cardEl.classList.add('is-visible');
      this.cardEl.setAttribute('aria-hidden', 'false');
    }

    positionCard(targetEl) {
      if (!this.cardEl || !targetEl) return;

      const rect = targetEl.getBoundingClientRect();
      const cardWidth = 320;
      const cardHeight = this.cardEl.offsetHeight || 135;

      let left = rect.left + (rect.width / 2) - (cardWidth / 2);
      // Clamp horizontally within viewport
      left = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12));

      let top = rect.top - cardHeight - 8;
      let placeAbove = true;

      // If not enough room above link, place below
      if (top < 12) {
        top = rect.bottom + 8;
        placeAbove = false;
      }

      this.cardEl.style.left = `${left}px`;
      this.cardEl.style.top = `${top}px`;
      this.cardEl.dataset.placement = placeAbove ? 'above' : 'below';
    }

    hidePreview(immediate = false) {
      clearTimeout(this.showTimer);
      if (immediate) {
        clearTimeout(this.hideTimer);
        this.cardEl?.classList.remove('is-visible');
        this.cardEl?.setAttribute('aria-hidden', 'true');
        this.activeTargetEl = null;
        return;
      }

      this.hideTimer = setTimeout(() => {
        this.cardEl?.classList.remove('is-visible');
        this.cardEl?.setAttribute('aria-hidden', 'true');
        this.activeTargetEl = null;
      }, 160);
    }

    bindEvents() {
      // Event delegation for crosslink hover/click
      document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('.codex-crosslink');
        if (link && link.dataset.entryId) {
          clearTimeout(this.showTimer);
          clearTimeout(this.hideTimer);
          this.showTimer = setTimeout(() => {
            this.showPreview(link, link.dataset.entryId);
          }, 100);
        }
      });

      document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('.codex-crosslink');
        if (link) {
          clearTimeout(this.showTimer);
          this.hidePreview(false);
        }
      });

      document.addEventListener('focusin', (e) => {
        const link = e.target.closest('.codex-crosslink');
        if (link && link.dataset.entryId) {
          this.showPreview(link, link.dataset.entryId);
        }
      });

      document.addEventListener('focusout', (e) => {
        const link = e.target.closest('.codex-crosslink');
        if (link) {
          this.hidePreview(false);
        }
      });

      // Keep open if mouse hovers over preview card itself
      this.cardEl?.addEventListener('mouseenter', () => {
        clearTimeout(this.hideTimer);
      });

      this.cardEl?.addEventListener('mouseleave', () => {
        this.hidePreview(false);
      });

      // Click card to open
      this.cardEl?.addEventListener('click', () => {
        if (this.activeTargetEl?.dataset?.entryId) {
          const id = this.activeTargetEl.dataset.entryId;
          this.hidePreview(true);
          if (window.openModal) window.openModal(id);
        }
      });

      // Click on link
      document.addEventListener('click', (e) => {
        const link = e.target.closest('.codex-crosslink');
        if (link && link.dataset.entryId) {
          e.preventDefault();
          const targetId = link.dataset.entryId;
          this.hidePreview(true);
          if (window.openModal) {
            window.openModal(targetId);
          }
        }
      });
    }
  }

  window.CodexLinker = new CodexLinkerManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CodexLinker.init());
  } else {
    window.CodexLinker.init();
  }
})();
