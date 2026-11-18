/**
 * The O-Codex — Grimoire & Spell Compendium
 * Complete spell library, bookmarking, personal spellbooks, custom spell creator,
 * and intelligent deduplication/auto-merge engine for external sources (5e SRD, Donjon, 5e-tools).
 */

(function () {
  const CUSTOM_SPELLS_KEY = 'o_codex_custom_spells';
  const FAVORITES_KEY = 'o_codex_spell_favorites';

  class GrimoireManager {
    constructor() {
      this.srdSpells = [];
      this.customSpells = [];
      this.favorites = new Set();
      this.searchQuery = '';
      this.selectedClass = 'all';
      this.selectedLevel = 'all';
      this.selectedSchool = 'all';
      this.onlyFavorites = false;
      this.onlyInSpellbook = false;
      this.onlyConcentration = false;
      this.onlyRitual = false;
      this.expandedCards = new Set();
      this.isLoaded = false;
    }

    async init() {
      this.loadFavorites();
      this.loadCustomSpells();
      await this.loadSrdSpells();
      this.isLoaded = true;
      this.initDOM();
      this.render();
      window.dispatchEvent(new CustomEvent('grimoire-loaded'));
    }

    loadFavorites() {
      try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          this.favorites = new Set(arr);
        }
      } catch (e) {
        this.favorites = new Set();
      }
    }

    saveFavorites() {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(this.favorites)));
      } catch (e) {}
    }

    loadCustomSpells() {
      try {
        const raw = localStorage.getItem(CUSTOM_SPELLS_KEY);
        if (raw) {
          this.customSpells = JSON.parse(raw) || [];
        }
      } catch (e) {
        this.customSpells = [];
      }
    }

    saveCustomSpells() {
      try {
        localStorage.setItem(CUSTOM_SPELLS_KEY, JSON.stringify(this.customSpells));
      } catch (e) {}
    }

    async loadSrdSpells() {
      try {
        const res = await fetch('spells-srd.json?v=1');
        if (res.ok) {
          this.srdSpells = await res.json();
        }
      } catch (e) {
        console.warn('[Grimoire] Could not fetch spells-srd.json, using fallback:', e);
        this.srdSpells = [];
      }
    }

    // Normalizes spell name for clean auto-merging and deduplication
    normalizeSpellKey(name) {
      if (!name) return '';
      return String(name)
        .toLowerCase()
        .replace(/^(tasha's|leomund's|mordenkainen's|bigby's|otto's|drawmij's|rary's|aganazzar's|snilloc's|evard's|otiluke's|nystul's)\s+/i, '')
        .replace(/[^a-z0-9]/g, '');
    }

    // Merges all spell libraries with intelligent deduplication
    getAllSpells() {
      const map = new Map();

      // 1. Add official SRD and base canon spells
      for (const spell of this.srdSpells) {
        const key = this.normalizeSpellKey(spell.name);
        map.set(key, { ...spell, isCustom: false });
      }

      // 2. Auto-merge custom & imported spells
      for (const custom of this.customSpells) {
        const key = this.normalizeSpellKey(custom.name);
        if (map.has(key)) {
          // Merge enrichments into existing entry without creating duplicate cards
          const existing = map.get(key);
          map.set(key, this.mergeSpellObjects(existing, custom, custom.source || 'Custom'));
        } else {
          map.set(key, { ...custom, isCustom: true });
        }
      }

      return Array.from(map.values()).sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    }

    // Intelligent auto-merge of two representations of the same spell
    mergeSpellObjects(base, incoming, incomingSource) {
      const merged = { ...base };
      
      // Preserve richer description or higher level text
      if (!merged.description || (incoming.description && incoming.description.length > merged.description.length)) {
        merged.description = incoming.description;
      }
      if (!merged.higherLevel && incoming.higherLevel) {
        merged.higherLevel = incoming.higherLevel;
      }
      if (!merged.damageFormula && incoming.damageFormula) {
        merged.damageFormula = incoming.damageFormula;
        merged.damageType = incoming.damageType || merged.damageType;
      }
      if (!merged.castingTime && incoming.castingTime) merged.castingTime = incoming.castingTime;
      if (!merged.range && incoming.range) merged.range = incoming.range;
      if (!merged.duration && incoming.duration) merged.duration = incoming.duration;
      if (!merged.components && incoming.components) merged.components = incoming.components;

      // Union classes
      const classSet = new Set(merged.classes || []);
      (incoming.classes || []).forEach(c => classSet.add(c));
      merged.classes = Array.from(classSet);

      // Union sources
      const sources = new Set(merged.sources || [merged.source || '5e SRD']);
      if (incomingSource) sources.add(incomingSource);
      merged.sources = Array.from(sources);
      merged.source = merged.sources.join(', ');

      return merged;
    }

    // Donjon, 5e-tools, or standard JSON batch import with auto-merging
    importSpellsFromData(parsedData, sourceLabel = 'Imported') {
      let spellsArray = [];
      if (Array.isArray(parsedData)) {
        spellsArray = parsedData;
      } else if (parsedData && Array.isArray(parsedData.spells)) {
        spellsArray = parsedData.spells;
      } else if (parsedData && typeof parsedData === 'object') {
        spellsArray = [parsedData];
      }

      if (spellsArray.length === 0) {
        throw new Error('No valid spell entries detected in data.');
      }

      const existingMap = new Map();
      this.customSpells.forEach(s => existingMap.set(this.normalizeSpellKey(s.name), s));
      const srdKeys = new Set(this.srdSpells.map(s => this.normalizeSpellKey(s.name)));

      let addedCount = 0;
      let mergedCount = 0;

      for (const item of spellsArray) {
        const name = item.name || item.title;
        if (!name) continue;

        const key = this.normalizeSpellKey(name);
        
        // Parse level
        let level = 0;
        if (typeof item.level === 'number') {
          level = item.level;
        } else if (typeof item.level === 'string') {
          const match = item.level.match(/\d+/);
          level = match ? parseInt(match[0], 10) : (item.level.toLowerCase().includes('cantrip') ? 0 : 1);
        }

        // Parse school
        let school = 'Evocation';
        if (typeof item.school === 'string') school = item.school;
        else if (item.school && typeof item.school.name === 'string') school = item.school.name;

        // Parse description
        let desc = item.description || item.desc || item.text || '';
        if (Array.isArray(desc)) desc = desc.join('\n\n');
        if (item.entries && Array.isArray(item.entries)) {
          desc = item.entries.map(e => typeof e === 'string' ? e : (e.text || JSON.stringify(e))).join('\n\n');
        }

        // Parse classes
        let classes = [];
        if (Array.isArray(item.classes)) {
          classes = item.classes.map(c => typeof c === 'string' ? c : (c.name || ''));
        } else if (typeof item.classes === 'string') {
          classes = item.classes.split(',').map(s => s.trim());
        }

        const normalizedSpell = {
          id: `custom_${key}_${Date.now()}`,
          name: name.trim(),
          level,
          school: school.trim(),
          castingTime: item.castingTime || item.casting_time || item.time || '1 action',
          range: item.range || 'Self',
          components: item.components || (item.verbal || item.somatic || item.material ? 'V, S' : 'V'),
          duration: item.duration || 'Instantaneous',
          concentration: Boolean(item.concentration || (typeof item.duration === 'string' && item.duration.toLowerCase().includes('concentration'))),
          ritual: Boolean(item.ritual || item.is_ritual),
          classes: classes.filter(Boolean),
          damageFormula: item.damageFormula || item.damage || '',
          damageType: item.damageType || '',
          description: desc,
          higherLevel: item.higherLevel || item.higher_level || '',
          source: sourceLabel
        };

        if (existingMap.has(key)) {
          // Merge into existing custom spell
          const existing = existingMap.get(key);
          const merged = this.mergeSpellObjects(existing, normalizedSpell, sourceLabel);
          const idx = this.customSpells.indexOf(existing);
          if (idx !== -1) this.customSpells[idx] = merged;
          mergedCount++;
        } else if (srdKeys.has(key)) {
          // Enhancing an existing base SRD spell without duplicating
          this.customSpells.push(normalizedSpell);
          existingMap.set(key, normalizedSpell);
          mergedCount++;
        } else {
          // Brand new spell
          this.customSpells.push(normalizedSpell);
          existingMap.set(key, normalizedSpell);
          addedCount++;
        }
      }

      this.saveCustomSpells();
      this.render();
      return { added: addedCount, merged: mergedCount, total: spellsArray.length };
    }

    // Toggle favorite bookmark
    toggleFavorite(spellId) {
      if (this.favorites.has(spellId)) {
        this.favorites.delete(spellId);
      } else {
        this.favorites.add(spellId);
      }
      this.saveFavorites();
      this.render();
    }

    // Active Character Spellbook Integration
    getActiveCharacter() {
      if (window.CharacterSheet && typeof window.CharacterSheet.getActiveCharacter === 'function') {
        return window.CharacterSheet.getActiveCharacter();
      }
      return null;
    }

    isInSpellbook(spell, char) {
      if (!char) return false;
      const key = this.normalizeSpellKey(spell.name);
      const known = Array.isArray(char.spellsKnown) ? char.spellsKnown : [];
      return known.some(k => this.normalizeSpellKey(k) === key);
    }

    isPrepared(spell, char) {
      if (!char) return false;
      const key = this.normalizeSpellKey(spell.name);
      const prep = Array.isArray(char.spellsPrepared) ? char.spellsPrepared : [];
      return prep.some(p => this.normalizeSpellKey(p) === key);
    }

    toggleSpellbook(spell, char) {
      if (!char) char = this.getActiveCharacter();
      if (!char) return;

      if (!Array.isArray(char.spellsKnown)) char.spellsKnown = [];
      if (!Array.isArray(char.spellsPrepared)) char.spellsPrepared = [];

      const key = this.normalizeSpellKey(spell.name);
      const idx = char.spellsKnown.findIndex(k => this.normalizeSpellKey(k) === key);

      if (idx !== -1) {
        // Remove from spellbook and prepared list
        char.spellsKnown.splice(idx, 1);
        char.spellsPrepared = char.spellsPrepared.filter(p => this.normalizeSpellKey(p) !== key);
      } else {
        // Add to spellbook
        char.spellsKnown.push(spell.name);
        // Cantrips are always prepared automatically
        if (spell.level === 0 && !char.spellsPrepared.some(p => this.normalizeSpellKey(p) === key)) {
          char.spellsPrepared.push(spell.name);
        }
      }

      if (window.CharacterSheet && typeof window.CharacterSheet.saveStorage === 'function') {
        window.CharacterSheet.saveStorage();
        window.CharacterSheet.renderCurrentSheet();
      }

      this.render();
    }

    togglePrepared(spell, char) {
      if (!char) char = this.getActiveCharacter();
      if (!char) return;

      if (!Array.isArray(char.spellsPrepared)) char.spellsPrepared = [];
      const key = this.normalizeSpellKey(spell.name);
      const idx = char.spellsPrepared.findIndex(p => this.normalizeSpellKey(p) === key);

      if (idx !== -1) {
        char.spellsPrepared.splice(idx, 1);
      } else {
        char.spellsPrepared.push(spell.name);
      }

      if (window.CharacterSheet && typeof window.CharacterSheet.saveStorage === 'function') {
        window.CharacterSheet.saveStorage();
        window.CharacterSheet.renderCurrentSheet();
      }

      this.render();
    }

    // Share spell card directly to Roll Log
    shareSpell(spell, triggerEl) {
      const char = this.getActiveCharacter();
      const badges = [
        { label: spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`, cls: 'prop-rank' },
        { label: spell.school, cls: 'prop-type' },
        { label: spell.castingTime, cls: 'prop-source' },
        { label: spell.range, cls: 'prop-cost' }
      ];

      if (spell.concentration) badges.push({ label: 'Concentration', cls: 'prop-attuned' });
      if (spell.ritual) badges.push({ label: 'Ritual', cls: 'prop-granted' });
      if (spell.damageFormula) {
        badges.push({ label: `${spell.damageFormula} ${spell.damageType || ''}`.trim(), cls: 'prop-dmg' });
      }

      const descText = `${spell.description}${spell.higherLevel ? '\n\nAt Higher Levels: ' + spell.higherLevel : ''}\n\nComponents: ${spell.components || 'V, S'}\nDuration: ${spell.duration || 'Instantaneous'}\nClasses: ${(spell.classes || []).join(', ')}`;

      const payload = {
        name: spell.name,
        roller: char ? char.name : 'Grimoire',
        category: 'SPELL',
        sourceType: 'spell',
        badges: badges,
        description: descText,
        raw: spell
      };

      if (triggerEl) {
        triggerEl.classList.remove('share-pulse');
        void triggerEl.offsetWidth;
        triggerEl.classList.add('share-pulse');
      }

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(1);
      }

      if (window.DiceRoller && typeof window.DiceRoller.shareItem === 'function') {
        window.DiceRoller.shareItem(payload);
      }
    }

    // Cast spell or roll damage
    castSpell(spell) {
      const char = this.getActiveCharacter();
      const casterName = char ? char.name : 'Caster';

      if (window.DiceRoller) {
        if (spell.damageFormula) {
          window.DiceRoller.roll(spell.damageFormula, `${spell.name} Damage`, casterName, 'normal', 0);
        } else {
          window.DiceRoller.roll('1d20', `Cast ${spell.name}`, casterName, 'normal', 0);
        }
      }
    }

    initDOM() {
      // Search input listener
      const searchInput = document.getElementById('grimoire-search-input');
      searchInput?.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderGrid();
      });

      // Clear search button
      document.getElementById('grimoire-search-clear')?.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchQuery = '';
          this.renderGrid();
        }
      });

      // Quick filter buttons in toolbar
      document.getElementById('grimoire-btn-custom')?.addEventListener('click', () => this.openCustomSpellModal());
      document.getElementById('grimoire-btn-import')?.addEventListener('click', () => this.openImportModal());
      document.getElementById('grimoire-btn-export')?.addEventListener('click', () => this.exportSpellsJSON());

      // Class, Level, and School filters
      const classSelect = document.getElementById('grimoire-class-filter');
      classSelect?.addEventListener('change', (e) => {
        this.selectedClass = e.target.value;
        this.renderGrid();
      });

      const levelSelect = document.getElementById('grimoire-level-filter');
      levelSelect?.addEventListener('change', (e) => {
        this.selectedLevel = e.target.value;
        this.renderGrid();
      });

      const schoolSelect = document.getElementById('grimoire-school-filter');
      schoolSelect?.addEventListener('change', (e) => {
        this.selectedSchool = e.target.value;
        this.renderGrid();
      });

      // Toggle pills (Favorites, In Spellbook, Concentration, Ritual)
      document.getElementById('grimoire-toggle-fav')?.addEventListener('click', (e) => {
        this.onlyFavorites = !this.onlyFavorites;
        e.currentTarget.classList.toggle('is-active', this.onlyFavorites);
        this.renderGrid();
      });

      document.getElementById('grimoire-toggle-spellbook')?.addEventListener('click', (e) => {
        this.onlyInSpellbook = !this.onlyInSpellbook;
        e.currentTarget.classList.toggle('is-active', this.onlyInSpellbook);
        this.renderGrid();
      });

      document.getElementById('grimoire-toggle-conc')?.addEventListener('click', (e) => {
        this.onlyConcentration = !this.onlyConcentration;
        e.currentTarget.classList.toggle('is-active', this.onlyConcentration);
        this.renderGrid();
      });

      document.getElementById('grimoire-toggle-ritual')?.addEventListener('click', (e) => {
        this.onlyRitual = !this.onlyRitual;
        e.currentTarget.classList.toggle('is-active', this.onlyRitual);
        this.renderGrid();
      });

      // Modals close buttons
      document.getElementById('custom-spell-close')?.addEventListener('click', () => this.closeCustomSpellModal());
      document.getElementById('custom-spell-cancel')?.addEventListener('click', () => this.closeCustomSpellModal());
      document.getElementById('custom-spell-form')?.addEventListener('submit', (e) => this.saveNewCustomSpell(e));

      document.getElementById('spell-import-close')?.addEventListener('click', () => this.closeImportModal());
      document.getElementById('spell-import-cancel')?.addEventListener('click', () => this.closeImportModal());
      document.getElementById('spell-import-btn')?.addEventListener('click', () => this.executeImport());
    }

    render() {
      const activeChar = this.getActiveCharacter();
      const bookToggleBtn = document.getElementById('grimoire-toggle-spellbook');
      if (bookToggleBtn) {
        bookToggleBtn.textContent = activeChar ? `📖 In ${activeChar.name.split(' ')[0]}'s Book` : '📖 In Spellbook';
      }
      this.renderGrid();
    }

    renderGrid() {
      const container = document.getElementById('grimoire-grid');
      const counterEl = document.getElementById('grimoire-count-badge');
      if (!container) return;

      const activeChar = this.getActiveCharacter();
      const allSpells = this.getAllSpells();

      const filtered = allSpells.filter(spell => {
        // Query search
        if (this.searchQuery) {
          const nameMatch = spell.name.toLowerCase().includes(this.searchQuery);
          const schoolMatch = spell.school.toLowerCase().includes(this.searchQuery);
          const descMatch = (spell.description || '').toLowerCase().includes(this.searchQuery);
          const classMatch = (spell.classes || []).some(c => c.toLowerCase().includes(this.searchQuery));
          if (!nameMatch && !schoolMatch && !descMatch && !classMatch) return false;
        }

        // Class filter
        if (this.selectedClass !== 'all') {
          const hasClass = (spell.classes || []).some(c => c.toLowerCase() === this.selectedClass.toLowerCase());
          if (!hasClass) return false;
        }

        // Level filter
        if (this.selectedLevel !== 'all') {
          const lvl = parseInt(this.selectedLevel, 10);
          if (spell.level !== lvl) return false;
        }

        // School filter
        if (this.selectedSchool !== 'all') {
          if (spell.school.toLowerCase() !== this.selectedSchool.toLowerCase()) return false;
        }

        // Favorites
        if (this.onlyFavorites && !this.favorites.has(spell.id)) return false;

        // In active character's spellbook
        if (this.onlyInSpellbook && !this.isInSpellbook(spell, activeChar)) return false;

        // Concentration
        if (this.onlyConcentration && !spell.concentration) return false;

        // Ritual
        if (this.onlyRitual && !spell.ritual) return false;

        return true;
      });

      if (counterEl) {
        counterEl.textContent = `${filtered.length} of ${allSpells.length} Spells`;
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="grimoire-empty">
            <span class="grimoire-empty-icon">✨</span>
            <p>No spells found matching your criteria.<br>Try adjusting your search query or filters, or add a custom spell!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(spell => {
        const isFav = this.favorites.has(spell.id);
        const inBook = this.isInSpellbook(spell, activeChar);
        const isExpanded = this.expandedCards.has(spell.id);
        const levelLabel = spell.level === 0 ? 'Cantrip' : `${spell.level}${this.getOrdinal(spell.level)}-Level`;

        return `
          <div class="char-item-card grimoire-card ${inBook ? 'is-in-book' : ''}" data-spell-id="${spell.id}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title grimoire-spell-title" data-spell-id="${spell.id}" title="Click to share spell details to Roll Log">
                  ${escapeHtml(spell.name)} <span class="share-hint-icon" aria-hidden="true">📜</span>
                </strong>
                <span class="grimoire-badge-level">${levelLabel}</span>
                <span class="grimoire-badge-school">${escapeHtml(spell.school)}</span>
                ${spell.concentration ? '<span class="grimoire-badge-conc" title="Requires Concentration">Conc.</span>' : ''}
                ${spell.ritual ? '<span class="grimoire-badge-ritual" title="Can be cast as a Ritual">Ritual</span>' : ''}
              </div>
              <div class="grimoire-card-controls">
                <button type="button" class="grimoire-star-btn ${isFav ? 'is-active' : ''}" data-spell-id="${spell.id}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}">
                  ${isFav ? '★' : '☆'}
                </button>
                <button type="button" class="btn btn-secondary btn-xs grimoire-book-btn ${inBook ? 'is-in-book-active' : ''}" data-spell-id="${spell.id}" title="${inBook ? 'In spellbook (click to remove)' : 'Add to active character spellbook'}">
                  ${inBook ? '✓ In Book' : '+ Add'}
                </button>
              </div>
            </div>

            <div class="grimoire-meta-grid">
              <div class="grimoire-meta-item">
                <span class="grimoire-meta-label">Casting:</span>
                <span class="grimoire-meta-val">${escapeHtml(spell.castingTime)}</span>
              </div>
              <div class="grimoire-meta-item">
                <span class="grimoire-meta-label">Range:</span>
                <span class="grimoire-meta-val">${escapeHtml(spell.range)}</span>
              </div>
              <div class="grimoire-meta-item">
                <span class="grimoire-meta-label">Duration:</span>
                <span class="grimoire-meta-val">${escapeHtml(spell.duration)}</span>
              </div>
              <div class="grimoire-meta-item">
                <span class="grimoire-meta-label">Comp:</span>
                <span class="grimoire-meta-val" title="${escapeHtml(spell.components)}">${escapeHtml(spell.components)}</span>
              </div>
            </div>

            ${spell.damageFormula ? `
              <div class="grimoire-damage-pill">
                <span class="atk-damage-badge">${escapeHtml(spell.damageFormula)} ${escapeHtml(spell.damageType || '')}</span>
              </div>
            ` : ''}

            <div class="grimoire-desc-box ${isExpanded ? 'is-expanded' : ''}">
              <div class="grimoire-desc-text">${escapeHtml(spell.description || '').replace(/\n/g, '<br>')}</div>
              ${spell.higherLevel ? `
                <div class="grimoire-higher-level">
                  <strong>At Higher Levels:</strong> ${escapeHtml(spell.higherLevel)}
                </div>
              ` : ''}
            </div>

            <div class="grimoire-card-footer">
              <span class="grimoire-classes-tag">${(spell.classes || []).slice(0, 4).join(', ')}${(spell.classes || []).length > 4 ? '...' : ''}</span>
              <div class="grimoire-action-buttons">
                <button type="button" class="grimoire-toggle-desc-btn" data-spell-id="${spell.id}">
                  ${isExpanded ? '▲ Less' : '▼ Details'}
                </button>
                <button type="button" class="btn btn-secondary btn-xs grimoire-share-btn" data-spell-id="${spell.id}" title="Share spell info card to party chat">
                  📜 Share
                </button>
                ${spell.damageFormula ? `
                  <button type="button" class="btn btn-secondary btn-xs atk-roll-dmg-btn grimoire-dmg-btn" data-spell-id="${spell.id}" title="Roll spell damage formula">
                    💥 ${escapeHtml(spell.damageFormula)}
                  </button>
                ` : `
                  <button type="button" class="btn btn-secondary btn-xs grimoire-cast-btn" data-spell-id="${spell.id}" title="Announce cast to Roll Log">
                    ✨ Cast
                  </button>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire interactive events on grid
      container.querySelectorAll('.grimoire-star-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorite(btn.dataset.spellId);
        });
      });

      container.querySelectorAll('.grimoire-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const spell = allSpells.find(s => s.id === btn.dataset.spellId);
          if (spell) this.toggleSpellbook(spell, activeChar);
        });
      });

      container.querySelectorAll('.grimoire-toggle-desc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.spellId;
          if (this.expandedCards.has(id)) {
            this.expandedCards.delete(id);
          } else {
            this.expandedCards.add(id);
          }
          this.renderGrid();
        });
      });

      container.querySelectorAll('.grimoire-share-btn, .grimoire-spell-title').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.spellId;
          const spell = allSpells.find(s => s.id === id);
          if (spell) this.shareSpell(spell, btn);
        });
      });

      container.querySelectorAll('.grimoire-dmg-btn, .grimoire-cast-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.spellId;
          const spell = allSpells.find(s => s.id === id);
          if (spell) this.castSpell(spell);
        });
      });
    }

    getOrdinal(n) {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Modal controls for Custom Spell
    openCustomSpellModal() {
      const modal = document.getElementById('custom-spell-modal');
      modal?.classList.remove('hidden');
    }

    closeCustomSpellModal() {
      const modal = document.getElementById('custom-spell-modal');
      modal?.classList.add('hidden');
    }

    saveNewCustomSpell(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.spellName?.value?.trim();
      if (!name) return;

      const level = parseInt(form.spellLevel?.value || '0', 10);
      const school = form.spellSchool?.value || 'Evocation';
      const castingTime = form.spellCastingTime?.value || '1 action';
      const range = form.spellRange?.value || 'Self';
      const components = form.spellComponents?.value || 'V, S';
      const duration = form.spellDuration?.value || 'Instantaneous';
      const concentration = Boolean(form.spellConc?.checked);
      const ritual = Boolean(form.spellRitual?.checked);
      const damageFormula = form.spellDamageFormula?.value?.trim() || '';
      const damageType = form.spellDamageType?.value?.trim() || '';
      const description = form.spellDescription?.value?.trim() || '';
      const higherLevel = form.spellHigherLevel?.value?.trim() || '';

      const checkedClasses = [];
      form.querySelectorAll('input[name="spellClass"]:checked').forEach(cb => checkedClasses.push(cb.value));

      const key = this.normalizeSpellKey(name);
      const newSpell = {
        id: `custom_${key}_${Date.now()}`,
        name,
        level,
        school,
        castingTime,
        range,
        components,
        duration,
        concentration,
        ritual,
        classes: checkedClasses,
        damageFormula,
        damageType,
        description,
        higherLevel,
        source: 'Homebrew'
      };

      // Check if spell already exists for auto-merge
      const existingIdx = this.customSpells.findIndex(s => this.normalizeSpellKey(s.name) === key);
      if (existingIdx !== -1) {
        this.customSpells[existingIdx] = this.mergeSpellObjects(this.customSpells[existingIdx], newSpell, 'Homebrew');
      } else {
        this.customSpells.push(newSpell);
      }

      this.saveCustomSpells();
      form.reset();
      this.closeCustomSpellModal();
      this.render();
    }

    // Modal controls for Donjon & External Import
    openImportModal() {
      const modal = document.getElementById('spell-import-modal');
      modal?.classList.remove('hidden');
    }

    closeImportModal() {
      const modal = document.getElementById('spell-import-modal');
      modal?.classList.add('hidden');
    }

    executeImport() {
      const textarea = document.getElementById('spell-import-textarea');
      const sourceInput = document.getElementById('spell-import-source');
      const statusEl = document.getElementById('spell-import-status');
      const rawText = textarea?.value?.trim();

      if (!rawText) {
        if (statusEl) statusEl.textContent = 'Please paste JSON or Donjon spell text into the box above.';
        return;
      }

      try {
        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch (jsonErr) {
          // If not strict JSON, attempt parsing line-by-line tab-delimited Donjon export
          parsed = this.parseDonjonTabbed(rawText);
        }

        const sourceLabel = sourceInput?.value?.trim() || 'Donjon / External';
        const result = this.importSpellsFromData(parsed, sourceLabel);

        if (statusEl) {
          statusEl.innerHTML = `
            <span style="color: #4ade80; font-weight: 700;">
              ✓ Import Complete! ${result.added} new spells added, ${result.merged} existing spells auto-merged (0 duplicates).
            </span>
          `;
        }

        setTimeout(() => {
          this.closeImportModal();
          if (textarea) textarea.value = '';
          if (statusEl) statusEl.textContent = '';
        }, 1600);
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: #ef4444;">Error importing data: ${escapeHtml(err.message)}</span>`;
        }
      }
    }

    parseDonjonTabbed(text) {
      // Donjon spell sheet CSV or tabbed parser
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const spells = [];
      for (const line of lines) {
        const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
        if (parts.length >= 4) {
          spells.push({
            name: parts[0]?.trim(),
            level: parts[1]?.trim(),
            school: parts[2]?.trim(),
            castingTime: parts[3]?.trim(),
            range: parts[4]?.trim() || '',
            duration: parts[5]?.trim() || '',
            components: parts[6]?.trim() || '',
            description: parts.slice(7).join(' ').trim()
          });
        }
      }
      return spells;
    }

    exportSpellsJSON() {
      const spells = this.getAllSpells();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spells, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `o_codex_spells_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  window.Grimoire = new GrimoireManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Grimoire.init());
  } else {
    window.Grimoire.init();
  }
})();
