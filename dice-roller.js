/**
 * The O-Codex — Universal Party Dice Roller & Shared Live Feed
 * Powers:
 *  1. Interactive Dice Tray (d4, d6, d8, d10, d12, d20, d100)
 *  2. Advantage / Disadvantage and Custom Formula Evaluation (e.g., 2d6+4, 1d20+7)
 *  3. Critical Hit (Natural 20) and Fumble (Natural 1) detection with celebratory visual effects
 *  4. Real-time Firebase Cloud Broadcasting so the entire party and DM see rolls live
 *  5. Web Audio API synthesized dice clatter (zero external dependencies)
 *  6. Global Roll Log with player attribution
 */

(function () {
  const ROLLS_STORAGE_KEY = 'o_codex_recent_rolls';
  const MAX_HISTORY = 30;

  class PartyDiceRoller {
    constructor() {
      this.isOpen = false;
      this.history = [];
      this.currentFormula = '1d20';
      this.currentModifier = 0;
      this.advantageMode = 'normal'; // 'normal' | 'advantage' | 'disadvantage'
      this.audioCtx = null;

      this.loadStorage();
    }

    loadStorage() {
      try {
        const raw = localStorage.getItem(ROLLS_STORAGE_KEY);
        this.history = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.history)) this.history = [];
      } catch (e) {
        this.history = [];
      }
    }

    saveStorage() {
      try {
        localStorage.setItem(ROLLS_STORAGE_KEY, JSON.stringify(this.history.slice(0, MAX_HISTORY)));
      } catch (e) {}
    }

    init() {
      this.initDOM();
      this.renderHistory();

      // Keyboard shortcut: Ctrl + R or 'D' (when not in input) opens Dice Tray
      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
          return;
        }
        if ((e.ctrlKey && (e.key === 'r' || e.key === 'R')) || (e.key === 'd' || e.key === 'D')) {
          if (!e.ctrlKey) {
            e.preventDefault();
            this.toggleTray();
          }
        }
      });
    }

    initDOM() {
      const toggleBtn = document.getElementById('dice-tray-toggle');
      const closeBtn = document.getElementById('dice-tray-close');
      const backdrop = document.getElementById('dice-tray-backdrop');
      const rollBtn = document.getElementById('dice-roll-execute-btn');
      const clearBtn = document.getElementById('dice-clear-btn');

      toggleBtn?.addEventListener('click', () => this.toggleTray());
      closeBtn?.addEventListener('click', () => this.closeTray());
      backdrop?.addEventListener('click', () => this.closeTray());

      // Polyhedral Dice quick buttons
      document.querySelectorAll('.dice-btn[data-die]').forEach(btn => {
        btn.addEventListener('click', () => {
          const die = btn.dataset.die; // 'd4', 'd6', etc.
          this.addDieToFormula(die);
        });
      });

      // Advantage / Normal / Disadvantage buttons
      document.querySelectorAll('.dice-adv-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setAdvantageMode(btn.dataset.mode);
        });
      });

      // Modifier stepper
      document.getElementById('dice-mod-plus')?.addEventListener('click', () => this.adjustModifier(1));
      document.getElementById('dice-mod-minus')?.addEventListener('click', () => this.adjustModifier(-1));
      document.getElementById('dice-mod-input')?.addEventListener('input', (e) => {
        this.currentModifier = parseInt(e.target.value, 10) || 0;
        this.updateFormulaDisplay();
      });

      // Clear formula
      clearBtn?.addEventListener('click', () => {
        this.currentFormula = '1d20';
        this.currentModifier = 0;
        this.setAdvantageMode('normal');
        this.updateFormulaDisplay();
      });

      // Roll Execute
      rollBtn?.addEventListener('click', () => {
        const label = document.getElementById('dice-label-input')?.value.trim() || 'General Roll';
        this.executeCurrentRoll(label);
      });

      // Enter key in label input executes roll
      document.getElementById('dice-label-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const label = e.target.value.trim() || 'General Roll';
          this.executeCurrentRoll(label);
        }
      });
    }

    toggleTray() {
      if (this.isOpen) this.closeTray();
      else this.openTray();
    }

    openTray() {
      this.isOpen = true;
      const tray = document.getElementById('dice-tray-drawer');
      const backdrop = document.getElementById('dice-tray-backdrop');
      tray?.classList.remove('is-collapsed');
      backdrop?.classList.remove('hidden');
      this.updateFormulaDisplay();
      this.renderHistory();
      document.getElementById('dice-label-input')?.focus();
    }

    closeTray() {
      this.isOpen = false;
      const tray = document.getElementById('dice-tray-drawer');
      const backdrop = document.getElementById('dice-tray-backdrop');
      tray?.classList.add('is-collapsed');
      backdrop?.classList.add('hidden');
    }

    setAdvantageMode(mode) {
      this.advantageMode = mode || 'normal';
      document.querySelectorAll('.dice-adv-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mode === this.advantageMode);
      });
      this.updateFormulaDisplay();
    }

    adjustModifier(delta) {
      this.currentModifier += delta;
      const input = document.getElementById('dice-mod-input');
      if (input) input.value = this.currentModifier;
      this.updateFormulaDisplay();
    }

    addDieToFormula(die) {
      if (die === 'd20') {
        this.currentFormula = '1d20';
      } else {
        // If current formula is just 1d20 default, replace with clicked die
        if (this.currentFormula === '1d20') {
          this.currentFormula = `1${die}`;
        } else if (this.currentFormula.endsWith(die)) {
          // Increment count: e.g. 1d6 -> 2d6
          const match = this.currentFormula.match(/^(\d+)(d\d+)$/);
          if (match) {
            const count = parseInt(match[1], 10) + 1;
            this.currentFormula = `${count}${match[2]}`;
          } else {
            this.currentFormula += `+1${die}`;
          }
        } else {
          this.currentFormula += `+1${die}`;
        }
      }
      this.updateFormulaDisplay();
    }

    updateFormulaDisplay() {
      const formulaEl = document.getElementById('dice-current-formula');
      if (!formulaEl) return;

      let display = this.currentFormula;
      if (this.currentModifier !== 0) {
        display += this.currentModifier > 0 ? ` + ${this.currentModifier}` : ` - ${Math.abs(this.currentModifier)}`;
      }

      if (this.advantageMode === 'advantage') display += ' (Advantage)';
      else if (this.advantageMode === 'disadvantage') display += ' (Disadvantage)';

      formulaEl.textContent = display;
    }

    /* ========================================================================
       CORE ROLL EVALUATION
       ======================================================================== */
    executeCurrentRoll(label = 'Dice Roll') {
      const charName = localStorage.getItem('o_codex_active_char_name') || localStorage.getItem('o_codex_player_name') || 'Adventurer';
      return this.roll({
        formula: this.currentFormula,
        modifier: this.currentModifier,
        advantage: this.advantageMode,
        label,
        charName
      });
    }

    roll(options = {}) {
      const {
        formula = '1d20',
        modifier = 0,
        advantage = 'normal',
        label = 'Check',
        charName = (localStorage.getItem('o_codex_active_char_name') || 'Adventurer')
      } = options;

      this.playDiceSound();

      let rolls = [];
      let total = 0;
      let isCrit = false;
      let isFumble = false;
      let detailsText = '';

      if (formula.includes('d20') && (advantage === 'advantage' || advantage === 'disadvantage')) {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        const chosen = advantage === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
        const dropped = advantage === 'advantage' ? Math.min(r1, r2) : Math.max(r1, r2);

        rolls = [r1, r2];
        total = chosen + modifier;
        isCrit = chosen === 20;
        isFumble = chosen === 1;

        detailsText = `[${chosen}] (dropped ${dropped})` + (modifier !== 0 ? ` ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)}` : '');
      } else {
        // Standard formula parsing: e.g. "2d6+1d4"
        const parts = formula.split('+');
        let diceBreakdowns = [];

        parts.forEach(part => {
          const match = part.trim().match(/^(\d*)d(\d+)$/i);
          if (match) {
            const count = parseInt(match[1], 10) || 1;
            const sides = parseInt(match[2], 10);
            const partRolls = [];
            for (let i = 0; i < count; i++) {
              const val = Math.floor(Math.random() * sides) + 1;
              partRolls.push(val);
              rolls.push(val);
              total += val;
              if (sides === 20 && val === 20) isCrit = true;
              if (sides === 20 && val === 1) isFumble = true;
            }
            diceBreakdowns.push(`d${sides}: [${partRolls.join(', ')}]`);
          }
        });

        total += modifier;
        detailsText = diceBreakdowns.join(' + ') + (modifier !== 0 ? ` ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)}` : '');
      }

      const rollResult = {
        id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roller: charName,
        label,
        formula: `${formula}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}${advantage !== 'normal' ? ` (${advantage})` : ''}`,
        rolls,
        total,
        isCrit,
        isFumble,
        detailsText,
        timestamp: Date.now()
      };

      // Add to local history
      this.history.unshift(rollResult);
      if (this.history.length > MAX_HISTORY) this.history.pop();
      this.saveStorage();

      // Show in UI
      this.renderLatestResult(rollResult);
      this.renderHistory();

      // Show floating party roll toast
      this.showRollToast(rollResult);

      // Broadcast to Firebase Firestore for real-time party sync!
      if (window.CampaignCloudSync && typeof window.CampaignCloudSync.pushDiceRoll === 'function') {
        window.CampaignCloudSync.pushDiceRoll(rollResult);
      }

      return rollResult;
    }

    renderLatestResult(result) {
      const container = document.getElementById('dice-latest-result');
      if (!container) return;

      container.classList.remove('hidden', 'is-crit', 'is-fumble');
      void container.offsetWidth; // force reflow for animation

      if (result.isCrit) container.classList.add('is-crit');
      else if (result.isFumble) container.classList.add('is-fumble');

      const critBadge = result.isCrit ? '<span class="dice-crit-badge">✨ CRITICAL HIT (NAT 20)!</span>' : 
                        (result.isFumble ? '<span class="dice-fumble-badge">💀 CRITICAL FUMBLE (NAT 1)</span>' : '');

      container.innerHTML = `
        <div class="dice-result-top">
          <span class="dice-result-label">${escapeHtml(result.label)}</span>
          <span class="dice-result-formula">${escapeHtml(result.formula)}</span>
        </div>
        <div class="dice-result-center">
          <span class="dice-result-total">${result.total}</span>
          ${critBadge}
        </div>
        <div class="dice-result-breakdown">
          <span>${escapeHtml(result.detailsText)}</span>
        </div>
      `;
    }

    renderHistory() {
      const listEl = document.getElementById('dice-history-list');
      if (!listEl) return;

      if (this.history.length === 0) {
        listEl.innerHTML = `<div class="dice-history-empty">No rolls yet. Roll a d20 or pick dice above!</div>`;
        return;
      }

      listEl.innerHTML = '';
      this.history.forEach(item => {
        const el = document.createElement('div');
        el.className = `dice-history-item ${item.isCrit ? 'is-crit' : ''} ${item.isFumble ? 'is-fumble' : ''}`;
        el.innerHTML = `
          <div class="dice-history-head">
            <strong class="dice-history-roller">${escapeHtml(item.roller)}</strong>
            <span class="dice-history-time">${this.formatTime(item.timestamp)}</span>
          </div>
          <div class="dice-history-body">
            <span class="dice-history-label">${escapeHtml(item.label)}</span>
            <span class="dice-history-total">${item.total}</span>
          </div>
          <div class="dice-history-foot">
            <span>${escapeHtml(item.formula)} ➔ ${escapeHtml(item.detailsText)}</span>
          </div>
        `;
        listEl.appendChild(el);
      });
    }

    showRollToast(roll) {
      if (typeof window.showToast !== 'function') return;

      let msg = `🎲 <strong>${escapeHtml(roll.roller)}</strong> rolled <strong>${roll.total}</strong> for <em>${escapeHtml(roll.label)}</em>`;
      if (roll.isCrit) msg += ` · ✨ <strong>NAT 20!</strong>`;
      else if (roll.isFumble) msg += ` · 💀 <strong>NAT 1!</strong>`;

      window.showToast(msg, roll.isCrit ? 'success' : (roll.isFumble ? 'warning' : 'info'), 3200);
    }

    onRemoteRoll(remoteRoll) {
      if (!remoteRoll || !remoteRoll.id) return;
      // If already recorded locally, skip
      if (this.history.some(h => h.id === remoteRoll.id)) return;

      this.history.unshift(remoteRoll);
      if (this.history.length > MAX_HISTORY) this.history.pop();
      this.saveStorage();

      this.renderHistory();
      this.showRollToast(remoteRoll);
      this.playDiceSound();
    }

    playDiceSound() {
      try {
        if (!this.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.audioCtx = new AudioContext();
        }
        if (!this.audioCtx) return;

        // Simple synthesized wood/dice clatter sounds
        const now = this.audioCtx.currentTime;
        [0, 0.04, 0.09, 0.15].forEach((delay, i) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320 + Math.random() * 240 + (i * 60), now + delay);
          gain.gain.setValueAtTime(0.08, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        });
      } catch (e) {}
    }

    formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

  window.DiceRoller = new PartyDiceRoller();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.DiceRoller.init());
  } else {
    window.DiceRoller.init();
  }
})();
