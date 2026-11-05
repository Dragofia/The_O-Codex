/**
 * The O-Codex — Initiative Tracker Table
 * Sits directly to the left of the Roll Log on the Characters screen without shifting layout.
 * Automatically opens when initiative is rolled.
 * Tracks combatants in turn order (descending).
 * Displays character HP and max HP as "HP/maxHP" next to each character's name.
 * DM Mode allows quick-adding enemies (Name, Max HP, Initiative Bonus, Qty) with roll generation.
 * Enemy health is editable by DM (typed & ticks), while players only see the enemy name transitioning
 * from green to yellow at ~1/2 health, and yellow to red at ~1/4 health.
 */

(function () {
  const INIT_STORAGE_KEY = 'o_codex_initiative_data';

  class InitiativeTracker {
    constructor() {
      this.isOpen = false;
      this.combatants = []; // { id, name, isEnemy: boolean, hpCurrent: number, hpMax: number, rolls: [], activeScore: number, lowerScore: number|null, timestamp: number }
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
      if (this.isOpen) {
        this.open(false);
      } else {
        this.close(false);
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

        // Firebase Firestore Realtime Cloud Sync
        if (broadcast && window.CampaignCloudSync && typeof window.CampaignCloudSync.pushInitiative === 'function') {
          window.CampaignCloudSync.pushInitiative(payload);
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
      let combatant = this.combatants.find(c => !c.isEnemy && c.name.toLowerCase() === rollerName.toLowerCase());

      if (!combatant) {
        combatant = {
          id: `init_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rollerName,
          isEnemy: false,
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
        toggleBtn.title = 'Collapse Initiative Tracker';
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
        toggleBtn.title = 'Open Initiative Tracker';
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

    getCharacterVitals(name) {
      if (window.CharacterSheet && Array.isArray(window.CharacterSheet.characters)) {
        const found = window.CharacterSheet.characters.find(c => 
          (c.name && c.name.toLowerCase() === name.toLowerCase()) ||
          (c.player && c.player.toLowerCase() === name.toLowerCase())
        );
        if (found && found.vitals) {
          return {
            hpCurrent: typeof found.vitals.hpCurrent === 'number' ? found.vitals.hpCurrent : 0,
            hpMax: typeof found.vitals.hpMax === 'number' ? found.vitals.hpMax : 1
          };
        }
      }
      return null;
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

    addEnemy() {
      const nameInput = document.getElementById('init-enemy-name');
      const hpInput = document.getElementById('init-enemy-hp');
      const modInput = document.getElementById('init-enemy-mod');
      const countInput = document.getElementById('init-enemy-count');

      const baseName = (nameInput?.value || '').trim() || 'Enemy';
      const maxHp = Math.max(1, parseInt(hpInput?.value, 10) || 15);
      const initBonus = parseInt(modInput?.value, 10) || 0;
      const rawCount = countInput?.value?.trim();
      const count = rawCount ? Math.max(1, parseInt(rawCount, 10) || 1) : 1;

      for (let i = 1; i <= count; i++) {
        const enemyName = count > 1 ? `${baseName} ${i}` : baseName;
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + initBonus;

        const combatant = {
          id: `enemy_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: enemyName,
          isEnemy: true,
          hpCurrent: maxHp,
          hpMax: maxHp,
          initBonus: initBonus,
          rolls: [total],
          activeScore: total,
          lowerScore: null,
          timestamp: Date.now() + i
        };

        this.combatants.push(combatant);
      }

      // Reset fields (keep initBonus & maxHp if DM is adding multiple waves, but clear name)
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
      if (countInput) countInput.value = '1';

      this.sortCombatants();
      this.saveStorage(true);
      this.render();

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(-1);
      }
    }

    setEnemyHp(id, newHp) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const val = Math.max(0, parseInt(newHp, 10) || 0);
      const delta = val - (enemy.hpCurrent || 0);
      enemy.hpCurrent = val;
      this.saveStorage(true);
      this.render();

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(delta);
      }
    }

    adjustEnemyHp(id, delta) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const current = typeof enemy.hpCurrent === 'number' ? enemy.hpCurrent : (enemy.hpMax || 10);
      enemy.hpCurrent = Math.max(0, current + delta);
      this.saveStorage(true);
      this.render();

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(delta);
      }
    }

    render() {
      const isDm = typeof window.isDmMode === 'function' ? window.isDmMode() : false;

      // Update DM Quick-Add panel visibility
      const dmPanel = document.getElementById('init-dm-panel');
      if (dmPanel) {
        dmPanel.classList.toggle('hidden', !isDm);
      }

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
            <span class="init-empty-sub">${isDm ? 'Use the Quick-Add bar above or roll initiative on any sheet.' : 'Roll initiative on any sheet or with <code>/init</code> to start turn order.'}</span>
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
        const isEnemy = Boolean(c.isEnemy);

        let nameHtml = '';
        let enemyCtrlsHtml = '';

        if (!isEnemy) {
          // Player Character Card: display name and "HP/maxHP"
          const vitals = this.getCharacterVitals(c.name);
          let hpBadge = '';
          if (vitals) {
            hpBadge = `
              <span class="init-card-hp" title="Current / Max HP">
                <span class="init-hp-cur">${vitals.hpCurrent}</span><span class="init-hp-slash-dim">/${vitals.hpMax}</span>
              </span>
            `;
          }

          nameHtml = `
            <div class="init-card-name-row">
              <strong class="init-card-name" title="${this.escapeHtml(c.name)}">${this.escapeHtml(c.name)}</strong>
              ${hpBadge}
            </div>
            ${subtext ? `<span class="init-card-sub">${this.escapeHtml(subtext)}</span>` : ''}
          `;
        } else {
          // Enemy Card
          const curHp = typeof c.hpCurrent === 'number' ? c.hpCurrent : (c.hpMax || 10);
          const maxHp = c.hpMax || 10;
          const pct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

          // Name Color Transition:
          // Green at full (> 50%) -> Yellow at ~1/2 health (<= 50%) -> Red at ~1/4 health (<= 25%)
          let nameColor = '#22c55e'; // Green
          let isDead = false;
          if (pct <= 0) {
            nameColor = '#64748b'; // Defeated
            isDead = true;
          } else if (pct <= 25) {
            nameColor = '#ef4444'; // Red
          } else if (pct <= 50) {
            nameColor = '#eab308'; // Yellow
          }

          const styleAttr = isDead 
            ? `style="color: ${nameColor}; text-decoration: line-through; opacity: 0.65;"`
            : `style="color: ${nameColor};"`;

          nameHtml = `
            <div class="init-card-name-row">
              <strong class="init-card-name init-enemy-name" ${styleAttr} title="${this.escapeHtml(c.name)} ${isDead ? '(Defeated)' : ''}">
                ${this.escapeHtml(c.name)} ${isDead ? '💀' : ''}
              </strong>
            </div>
          `;

          // Max HP & Controls display ONLY for the DM!
          if (isDm) {
            enemyCtrlsHtml = `
              <div class="init-enemy-hp-row">
                <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="-5" title="Subtract 5 HP">-5</button>
                <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="-1" title="Subtract 1 HP">-1</button>
                <input type="number" class="init-enemy-hp-input" value="${curHp}" min="0" max="${maxHp}" data-id="${c.id}" title="Type HP directly" />
                <span class="init-enemy-hp-slash-dim">/${maxHp}</span>
                <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="1" title="Add 1 HP">+1</button>
                <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="5" title="Add 5 HP">+5</button>
              </div>
            `;
          }
        }

        html += `
          <div class="init-card ${isLeader ? 'is-leader' : ''} ${isEnemy ? 'is-enemy-card' : ''}" data-id="${c.id}">
            <div class="init-card-rank">#${rank}</div>
            <div class="init-card-info">
              ${nameHtml}
              ${enemyCtrlsHtml}
            </div>
            <div class="init-card-scores">
              <span class="init-score-active" title="Active Initiative">${c.activeScore}</span>
              ${hasAdvantage ? `
                <span class="init-score-lower" title="Lower roll (Advantage)">${c.lowerScore}</span>
              ` : ''}
            </div>
            ${(isDm || !isEnemy) ? `
              <button type="button" class="init-row-del-btn" data-id="${c.id}" title="Remove ${this.escapeHtml(c.name)}">✕</button>
            ` : ''}
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

      // Bind DM Enemy HP typed inputs
      container.querySelectorAll('.init-enemy-hp-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = input.dataset.id;
          this.setEnemyHp(id, e.target.value);
        });
        input.addEventListener('click', (e) => e.stopPropagation());
      });

      // Bind DM Enemy HP tick buttons (-5, -1, +1, +5)
      container.querySelectorAll('.init-hp-tick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const delta = parseInt(btn.dataset.delta, 10) || 0;
          this.adjustEnemyHp(id, delta);
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

      // Sword Toggle button in top right of tracker header / docked left of roll log
      document.getElementById('char-toggle-init-btn')?.addEventListener('click', () => {
        this.toggle();
      });

      // DM Quick-Add Enemy Button
      document.getElementById('init-enemy-add-btn')?.addEventListener('click', () => {
        this.addEnemy();
      });

      // Enter key support for DM quick-add fields
      const dmInputs = [
        document.getElementById('init-enemy-name'),
        document.getElementById('init-enemy-hp'),
        document.getElementById('init-enemy-mod'),
        document.getElementById('init-enemy-count')
      ];
      dmInputs.forEach(input => {
        input?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.addEnemy();
          }
        });
      });

      // Listen for DM mode changes to live-toggle DM enemy quick-add & enemy HP controls
      window.addEventListener('dm-mode-changed', () => {
        this.render();
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
