/**
 * The O-Codex — Initiative Tracker Table
 * Sits directly to the left of the Roll Log on the Characters screen.
 * Automatically opens when initiative is rolled.
 * Tracks combatants in turn order (descending).
 * If a combatant rolls twice, displays both rolls, graying out and slightly shrinking the lower one (Advantage).
 */

(function () {
  const INIT_STORAGE_KEY = 'o_codex_initiative_data';

  class InitiativeTracker {
    constructor() {
      this.isOpen = false;
      this.combatants = []; // { id, name, rolls: [], activeScore: number, lowerScore: number|null, timestamp: number }
      this.bc = null;

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.bc = new BroadcastChannel('o_codex_initiative_channel');
          this.bc.onmessage = (event) => {
            if (event && event.data && event.data.type === 'INITIATIVE_UPDATE') {
              this.onRemoteUpdate(event.data);
            }
          };
        } catch (e) {}
      }

      this.loadStorage();
    }

    init() {
      this.bindEvents();
      this.render();
      if (this.isOpen && this.combatants.length > 0) {
        this.open(false);
      }
    }

    loadStorage() {
      try {
        const raw = localStorage.getItem(INIT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.combatants)) {
            this.combatants = parsed.combatants;
          }
          if (typeof parsed.isOpen === 'boolean') {
            this.isOpen = parsed.isOpen;
          }
        }
      } catch (e) {
        this.combatants = [];
      }
    }

    saveStorage(broadcast = true) {
      try {
        const payload = {
          isOpen: this.isOpen,
          combatants: this.combatants
        };
        localStorage.setItem(INIT_STORAGE_KEY, JSON.stringify(payload));

        if (this.bc && broadcast) {
          try {
            this.bc.postMessage({ type: 'INITIATIVE_UPDATE', payload });
          } catch (e) {}
        }
      } catch (e) {}
    }

    onRemoteUpdate(data) {
      if (!data || !data.payload) return;
      const { combatants, isOpen } = data.payload;
      if (Array.isArray(combatants)) {
        this.combatants = combatants;
      }
      if (typeof isOpen === 'boolean') {
        this.isOpen = isOpen;
      }
      this.render();
      if (this.isOpen) {
        this.open(false);
      } else {
        this.close(false);
      }
    }

    isInitiativeRoll(roll) {
      if (!roll || !roll.label) return false;
      const lbl = String(roll.label).toLowerCase().trim();
      return lbl.includes('initiat') || lbl.includes('init check') || lbl === 'init' || lbl.startsWith('init ');
    }

    handleNewRoll(roll) {
      if (!this.isInitiativeRoll(roll)) return;

      const roller = (roll.roller || 'Adventurer').trim();
      const total = typeof roll.total === 'number' ? roll.total : (parseInt(roll.total, 10) || 0);

      this.recordRoll(roller, total, roll);
      this.open(true);
      this.saveStorage(true);
      this.render();
    }

    recordRoll(rollerName, total, roll) {
      let combatant = this.combatants.find(c => c.name.toLowerCase() === rollerName.toLowerCase());

      if (!combatant) {
        combatant = {
          id: `init_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rollerName,
          rolls: [],
          activeScore: total,
          lowerScore: null,
          timestamp: Date.now()
        };
        this.combatants.push(combatant);
      }

      // Check if this single roll was rolled with advantage inside the dice roller
      const isAdvRoll = roll && (roll.advantage === 'advantage' || (roll.formula && roll.formula.includes('(ADV)')));
      if (isAdvRoll && Array.isArray(roll.rolls) && roll.rolls.length >= 2) {
        const mod = roll.modifier || 0;
        const r1 = roll.rolls[0] + mod;
        const r2 = roll.rolls[1] + mod;
        combatant.rolls = [r1, r2];
      } else {
        // Player rolled separately / clicked twice
        combatant.rolls.push(total);
      }

      // Compute highest as activeScore, second highest (if any) as lowerScore
      if (combatant.rolls.length === 1) {
        combatant.activeScore = combatant.rolls[0];
        combatant.lowerScore = null;
      } else {
        const sorted = [...combatant.rolls].sort((a, b) => b - a);
        combatant.activeScore = sorted[0];
        // Lower roll is the lesser value:
        combatant.lowerScore = sorted[1];
      }

      combatant.timestamp = Date.now();
      this.sortCombatants();
    }

    sortCombatants() {
      this.combatants.sort((a, b) => {
        if (b.activeScore !== a.activeScore) {
          return b.activeScore - a.activeScore;
        }
        return a.timestamp - b.timestamp;
      });
    }

    open(broadcast = false) {
      this.isOpen = true;
      const el = document.getElementById('char-init-sidebar');
      if (el) {
        el.classList.remove('is-collapsed');
      }
      const toggleBtn = document.getElementById('char-toggle-init-btn');
      if (toggleBtn) {
        toggleBtn.classList.add('is-active');
      }
      if (broadcast) {
        this.saveStorage(true);
      }
    }

    close(broadcast = false) {
      this.isOpen = false;
      const el = document.getElementById('char-init-sidebar');
      if (el) {
        el.classList.add('is-collapsed');
      }
      const toggleBtn = document.getElementById('char-toggle-init-btn');
      if (toggleBtn) {
        toggleBtn.classList.remove('is-active');
      }
      if (broadcast) {
        this.saveStorage(true);
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close(true);
      } else {
        this.open(true);
      }
    }

    clear() {
      this.combatants = [];
      this.saveStorage(true);
      this.render();
    }

    removeCombatant(id) {
      this.combatants = this.combatants.filter(c => c.id !== id);
      this.saveStorage(true);
      this.render();
    }

    getPartySubtext(name) {
      if (window.CharacterSheet && Array.isArray(window.CharacterSheet.characters)) {
        const found = window.CharacterSheet.characters.find(c => 
          (c.name && c.name.toLowerCase() === name.toLowerCase()) ||
          (c.player && c.player.toLowerCase() === name.toLowerCase())
        );
        if (found) {
          const player = found.player ? found.player : '';
          const cls = found.classLevel ? found.classLevel.split('/')[0].trim() : '';
          return player && cls ? `${player} • ${cls}` : (player || cls || '');
        }
      }
      return '';
    }

    render() {
      const container = document.getElementById('init-list-body');
      const countPill = document.getElementById('init-count-pill');
      if (countPill) {
        countPill.textContent = this.combatants.length;
      }

      if (!container) return;

      if (this.combatants.length === 0) {
        container.innerHTML = `
          <div class="init-empty-state">
            <span class="init-empty-icon">⚔️</span>
            <p class="init-empty-msg">No initiatives rolled yet.</p>
            <span class="init-empty-sub">Roll initiative on any sheet or with <code>/init</code> to start turn order.</span>
          </div>
        `;
        return;
      }

      let html = '<div class="init-cards-flow">';
      this.combatants.forEach((c, index) => {
        const rank = index + 1;
        const subtext = this.getPartySubtext(c.name);
        const hasAdvantage = c.lowerScore !== null;
        const isLeader = rank === 1;

        html += `
          <div class="init-card ${isLeader ? 'is-leader' : ''}" data-id="${c.id}">
            <div class="init-card-rank">#${rank}</div>
            <div class="init-card-info">
              <strong class="init-card-name" title="${this.escapeHtml(c.name)}">${this.escapeHtml(c.name)}</strong>
              ${subtext ? `<span class="init-card-sub">${this.escapeHtml(subtext)}</span>` : ''}
            </div>
            <div class="init-card-scores">
              <span class="init-score-active" title="Active Initiative">${c.activeScore}</span>
              ${hasAdvantage ? `
                <span class="init-score-lower" title="Lower roll (Advantage)">${c.lowerScore}</span>
              ` : ''}
            </div>
            <button type="button" class="init-row-del-btn" data-id="${c.id}" title="Remove ${this.escapeHtml(c.name)}">✕</button>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;

      // Bind delete buttons
      container.querySelectorAll('.init-row-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          this.removeCombatant(id);
        });
      });
    }

    bindEvents() {
      // Listen to new roll events from DiceRoller (local & remote)
      window.addEventListener('diceroller:new-roll', (e) => {
        if (e && e.detail) {
          this.handleNewRoll(e.detail);
        }
      });

      // Clear button
      document.getElementById('init-clear-btn')?.addEventListener('click', () => {
        if (this.combatants.length > 0) {
          if (confirm('Clear all initiatives from the tracker?')) {
            this.clear();
          }
        }
      });

      // Close button
      document.getElementById('init-close-btn')?.addEventListener('click', () => {
        this.close(true);
      });

      // Toggle button in Roll Log
      document.getElementById('char-toggle-init-btn')?.addEventListener('click', () => {
        this.toggle();
      });
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  window.InitiativeTracker = new InitiativeTracker();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.InitiativeTracker.init());
  } else {
    window.InitiativeTracker.init();
  }
})();
