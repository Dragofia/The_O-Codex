/**
 * The O-Codex — Initiative Tracker Table & Turn Order Engine
 * Sits directly to the left of the Roll Log on the Characters screen without shifting layout.
 * Automatically opens when initiative is rolled.
 * Tracks combatants in turn order (descending initially).
 * 
 * Features:
 * - Displays character HP and max HP as "HP/maxHP" next to each character's name.
 * - Player Current HP (not name) dynamically transitions: Green (> 50%) -> Yellow (<= 50%) -> Red (<= 25%).
 * - DM Mode allows quick-adding enemies (Name, Max HP, Initiative Bonus, Qty) with roll generation.
 * - Enemy health is editable by DM (typed & ticks), while players only see the enemy name transitioning
 *   from green to yellow at ~1/2 health, and yellow to red at ~1/4 health.
 * - Turn Progression:
 *   - DM can advance to the next spot in initiative ("Next Turn ⏭️").
 *   - Once moved: rolls shrink slightly and move further to the right to reduce clutter.
 *   - The lower roll for advantage disappears (only final initiative matters).
 *   - Initial order rank (#1, #2) moves further left, and the starting roll ([19]) remains visible left of the name.
 *   - The combatant who just took their turn moves to the bottom, the next one moves up to the top,
 *     and the active combatant at the top is highlighted with a prominent turn badge.
 * - Targeting & Damage Framework:
 *   - Combatants can be clicked to target them (🎯 Target).
 *   - Single-click attack rolls target the combatant; double-click rolls untargeted.
 *   - Subsequent damage rolls automatically subtract damage from the target's HP with audio and toasts.
 */

(function () {
  const INIT_STORAGE_KEY = 'o_codex_initiative_data';

  class InitiativeTracker {
    constructor() {
      this.isOpen = false;
      this.hasMoved = false;
      this.round = 1;
      this.turnCount = 0;
      this.selectedTargetId = null;
      this.combatants = []; // { id, name, isEnemy: boolean, hpCurrent: number, hpMax: number, rolls: [], activeScore: number, lowerScore: number|null, initialRoll: number, initialRank: number, timestamp: number }
      this.audioCtx = null;
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

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    playTurnSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } catch (e) {}
    }

    playHitSound() {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } catch (e) {}
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
          if (typeof parsed.hasMoved === 'boolean') {
            this.hasMoved = parsed.hasMoved;
          }
          if (typeof parsed.round === 'number') {
            this.round = parsed.round;
          }
          if (typeof parsed.turnCount === 'number') {
            this.turnCount = parsed.turnCount;
          }
          if (parsed.selectedTargetId !== undefined) {
            this.selectedTargetId = parsed.selectedTargetId;
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
          hasMoved: this.hasMoved,
          round: this.round,
          turnCount: this.turnCount,
          selectedTargetId: this.selectedTargetId,
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
      const { combatants, isOpen, hasMoved, round, turnCount, selectedTargetId } = data.payload;
      if (Array.isArray(combatants)) {
        this.combatants = combatants;
      }
      if (typeof isOpen === 'boolean') {
        this.isOpen = isOpen;
      }
      if (typeof hasMoved === 'boolean') {
        this.hasMoved = hasMoved;
      }
      if (typeof round === 'number') {
        this.round = round;
      }
      if (typeof turnCount === 'number') {
        this.turnCount = turnCount;
      }
      if (selectedTargetId !== undefined) {
        this.selectedTargetId = selectedTargetId;
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
          initialRoll: total,
          initialRank: this.combatants.length + 1,
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

      combatant.initialRoll = combatant.activeScore;
      combatant.timestamp = Date.now();
      this.sortCombatants();
    }

    sortCombatants() {
      if (this.hasMoved) return; // Do not scramble turn-cycled order
      this.combatants.sort((a, b) => {
        if (b.activeScore !== a.activeScore) {
          return b.activeScore - a.activeScore;
        }
        return a.timestamp - b.timestamp;
      });
      this.combatants.forEach((c, idx) => {
        c.initialRank = idx + 1;
        if (c.initialRoll === undefined) c.initialRoll = c.activeScore;
      });
    }

    // Advance turn order (DM or hotkey)
    nextTurn() {
      if (this.combatants.length === 0) return;

      if (!this.hasMoved) {
        // First move: ensure initial rank and roll snapshots are stamped
        this.combatants.forEach((c, idx) => {
          if (c.initialRank === undefined) c.initialRank = idx + 1;
          if (c.initialRoll === undefined) c.initialRoll = c.activeScore;
        });
        this.hasMoved = true;
      }

      // Move top combatant (who just took their turn) down to the bottom
      const finished = this.combatants.shift();
      this.combatants.push(finished);

      this.turnCount++;
      if (this.combatants.length > 0 && this.turnCount % this.combatants.length === 0) {
        this.round++;
      }

      const active = this.combatants[0];
      this.playTurnSound();
      window.showToast?.(`⚔️ ${active.name}'s Turn! (Round ${this.round})`, 'info', 2200);

      this.saveStorage(true);
      this.render();
    }

    // Undo last turn move (DM tool)
    prevTurn() {
      if (this.combatants.length === 0 || !this.hasMoved) return;

      // Move bottom combatant back to top
      const prev = this.combatants.pop();
      this.combatants.unshift(prev);

      if (this.turnCount > 0) {
        if (this.turnCount % this.combatants.length === 0 && this.round > 1) {
          this.round--;
        }
        this.turnCount--;
      }

      this.saveStorage(true);
      this.render();
    }

    // Reset initiative order back to original roll order
    resetOrder() {
      this.hasMoved = false;
      this.round = 1;
      this.turnCount = 0;
      this.combatants.sort((a, b) => {
        const rollA = a.initialRoll !== undefined ? a.initialRoll : a.activeScore;
        const rollB = b.initialRoll !== undefined ? b.initialRoll : b.activeScore;
        return rollB - rollA;
      });
      this.combatants.forEach((c, idx) => {
        c.initialRank = idx + 1;
      });
      this.saveStorage(true);
      this.render();
      window.showToast?.('🔄 Initiative reset to original roll order', 'info', 1800);
    }

    // Targeting Management
    selectTarget(id) {
      if (this.selectedTargetId === id) {
        this.selectedTargetId = null;
      } else {
        this.selectedTargetId = id;
        const target = this.combatants.find(c => c.id === id);
        if (target) {
          window.showToast?.(`🎯 Targeted: ${target.name}`, 'info', 1400);
        }
      }
      this.saveStorage(true);
      this.render();
    }

    clearTarget() {
      this.selectedTargetId = null;
      this.saveStorage(true);
      this.render();
    }

    getSelectedTarget() {
      if (!this.selectedTargetId) return null;
      return this.combatants.find(c => c.id === this.selectedTargetId) || null;
    }

    // Apply damage to targeted combatant
    applyTargetDamage(targetId, delta, sourceLabel = '') {
      const target = this.combatants.find(c => c.id === targetId);
      if (!target) return;

      const absDelta = Math.abs(delta);
      this.playHitSound();

      if (target.isEnemy) {
        target.lastDamage = absDelta;
        this.adjustEnemyHp(target.id, delta);
        const remaining = target.hpCurrent || 0;
        window.showToast?.(`💥 Subtracted ${absDelta} HP from ${target.name}! (${remaining} HP left)`, 'info', 2500);
      } else {
        // Player character: update CharacterSheet vitals
        if (window.CharacterSheet && typeof window.CharacterSheet.adjustCharacterHpByName === 'function') {
          window.CharacterSheet.adjustCharacterHpByName(target.name, delta);
        }
        window.showToast?.(`💥 Subtracted ${absDelta} HP from ${target.name}!`, 'info', 2500);
        this.render();
      }
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
      this.hasMoved = false;
      this.round = 1;
      this.turnCount = 0;
      this.selectedTargetId = null;
      this.saveStorage(true);
      this.render();
    }

    removeCombatant(id) {
      this.combatants = this.combatants.filter(c => c.id !== id);
      if (this.selectedTargetId === id) this.selectedTargetId = null;
      if (this.combatants.length === 0) {
        this.hasMoved = false;
        this.round = 1;
        this.turnCount = 0;
      }
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
            hpMax: typeof found.vitals.hpMax === 'number' ? found.vitals.hpMax : 1,
            ac: typeof found.vitals.ac === 'number' ? found.vitals.ac : 10
          };
        }
      }
      return null;
    }

    getTargetAc(target) {
      if (!target) return null;
      if (target.isEnemy) {
        return (typeof target.ac === 'number' && target.ac > 0) ? target.ac : null;
      }
      const vitals = this.getCharacterVitals(target.name);
      if (vitals && typeof vitals.ac === 'number' && vitals.ac > 0) {
        return vitals.ac;
      }
      if (typeof target.ac === 'number' && target.ac > 0) {
        return target.ac;
      }
      return null;
    }

    setEnemyAc(id, newAc) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const parsed = parseInt(newAc, 10);
      enemy.ac = (!isNaN(parsed) && parsed > 0) ? parsed : null;
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

    addEnemy() {
      const nameInput = document.getElementById('init-enemy-name');
      const hpInput = document.getElementById('init-enemy-hp');
      const acInput = document.getElementById('init-enemy-ac');
      const modInput = document.getElementById('init-enemy-mod');
      const countInput = document.getElementById('init-enemy-count');

      const baseName = (nameInput?.value || '').trim() || 'Enemy';
      const maxHp = Math.max(1, parseInt(hpInput?.value, 10) || 15);
      const rawAc = acInput ? parseInt(acInput.value, 10) : NaN;
      const enemyAc = !isNaN(rawAc) && rawAc > 0 ? rawAc : null;
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
          ac: enemyAc,
          initBonus: initBonus,
          rolls: [total],
          activeScore: total,
          lowerScore: null,
          initialRoll: total,
          initialRank: this.combatants.length + i,
          timestamp: Date.now() + i
        };

        this.combatants.push(combatant);
      }

      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
      if (acInput) acInput.value = '';
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
      const maxHp = enemy.hpMax || 10;
      const val = Math.max(0, Math.min(maxHp, parseInt(newHp, 10) || 0));
      const delta = val - (enemy.hpCurrent || 0);
      enemy.hpCurrent = val;
      enemy.lastDamage = null;
      this.saveStorage(true);
      this.render();

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(delta);
      }
    }

    adjustEnemyHp(id, delta) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const maxHp = enemy.hpMax || 10;
      const current = typeof enemy.hpCurrent === 'number' ? enemy.hpCurrent : maxHp;
      enemy.hpCurrent = Math.max(0, Math.min(maxHp, current + delta));
      this.saveStorage(true);
      this.render();

      if (window.CharacterSheet && typeof window.CharacterSheet.playHpSound === 'function') {
        window.CharacterSheet.playHpSound(delta);
      }
    }

    halveEnemyDamage(id) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const maxHp = enemy.hpMax || 10;
      const curHp = typeof enemy.hpCurrent === 'number' ? enemy.hpCurrent : maxHp;
      const damageTaken = Math.max(0, maxHp - curHp);

      if (damageTaken <= 0) {
        window.showToast?.(`${enemy.name} has taken no damage to halve`, 'info', 1600);
        return;
      }

      // If there was a recorded last hit (e.g. from targeted damage), halve that hit
      if (enemy.lastDamage && enemy.lastDamage > 0 && enemy.lastDamage <= damageTaken) {
        const refund = Math.ceil(enemy.lastDamage / 2);
        const prevHit = enemy.lastDamage;
        enemy.lastDamage = 0;
        this.adjustEnemyHp(id, refund);
        window.showToast?.(`🛡️ Resisted: Refunded ${refund} HP (halved ${prevHit} damage hit)`, 'info', 2500);
      } else {
        // Otherwise halve total damage taken
        const newDamageTaken = Math.floor(damageTaken / 2);
        const newHp = Math.min(maxHp, maxHp - newDamageTaken);
        const refund = newHp - curHp;
        if (refund > 0) {
          this.adjustEnemyHp(id, refund);
          window.showToast?.(`🛡️ Resisted: Halved total damage from ${damageTaken} to ${newDamageTaken}`, 'info', 2500);
        }
      }
    }

    doubleEnemyDamage(id) {
      const enemy = this.combatants.find(c => c.id === id);
      if (!enemy) return;
      const maxHp = enemy.hpMax || 10;
      const curHp = typeof enemy.hpCurrent === 'number' ? enemy.hpCurrent : maxHp;
      const damageTaken = Math.max(0, maxHp - curHp);

      if (damageTaken <= 0 && (!enemy.lastDamage || enemy.lastDamage <= 0)) {
        window.showToast?.(`${enemy.name} has taken no damage to double`, 'info', 1600);
        return;
      }

      // If there was a recorded last hit (e.g. from targeted damage), double that hit
      if (enemy.lastDamage && enemy.lastDamage > 0) {
        const extraDmg = enemy.lastDamage;
        const prevHit = enemy.lastDamage;
        enemy.lastDamage = 0;
        this.adjustEnemyHp(id, -extraDmg);
        window.showToast?.(`⚡ Weakness: Dealt extra ${extraDmg} damage (doubled ${prevHit} damage hit to ${prevHit * 2})`, 'info', 2500);
      } else {
        // Otherwise double total damage taken so far
        const extraDmg = damageTaken;
        this.adjustEnemyHp(id, -extraDmg);
        window.showToast?.(`⚡ Weakness: Doubled damage taken from ${damageTaken} to ${damageTaken * 2}`, 'info', 2500);
      }
    }

    render() {
      const isDm = typeof window.isDmMode === 'function' ? window.isDmMode() : false;

      // Update sidebar state class
      const sidebar = document.getElementById('char-init-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('init-has-moved', Boolean(this.hasMoved));
      }

      // Update DM Quick-Add panel visibility
      const dmPanel = document.getElementById('init-dm-panel');
      if (dmPanel) {
        dmPanel.classList.toggle('hidden', !isDm);
      }

      // Update Header Round Pill
      const roundPill = document.getElementById('init-round-pill');
      if (roundPill) {
        if (this.hasMoved && this.combatants.length > 0) {
          roundPill.classList.remove('hidden');
          roundPill.textContent = `Round ${this.round}`;
        } else {
          roundPill.classList.add('hidden');
        }
      }

      // Update Header Next Turn Button
      const nextTurnBtn = document.getElementById('init-next-turn-btn');
      if (nextTurnBtn) {
        // Visible to DM, or when initiative has combatants
        const showNext = this.combatants.length > 0 && (isDm || this.hasMoved);
        nextTurnBtn.classList.toggle('hidden', !showNext);
        nextTurnBtn.textContent = this.hasMoved ? 'Next ⏭️' : 'Start ⏭️';
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
        const isCurrentTurn = this.hasMoved && index === 0;
        const isLeader = !this.hasMoved && index === 0;
        const isEnemy = Boolean(c.isEnemy);
        const isTargeted = this.selectedTargetId === c.id;

        // When moved: advantage lower score is hidden! Only active final score matters
        const showLowerScore = !this.hasMoved && c.lowerScore !== null;
        
        // Initial rank snapshot
        const startRank = c.initialRank !== undefined ? c.initialRank : (index + 1);

        let nameHtml = '';
        let enemyCtrlsHtml = '';

        if (!isEnemy) {
          // Player Character Card:
          // Player Current HP (not name) turns yellow (<= 50%) and red (<= 25%) as HP decreases!
          const vitals = this.getCharacterVitals(c.name);
          let hpBadge = '';
          if (vitals) {
            const curHp = vitals.hpCurrent;
            const maxHp = vitals.hpMax;
            const pct = maxHp > 0 ? (curHp / maxHp) * 100 : 0;

            let hpColor = '#22c55e'; // Green (> 50%)
            if (curHp <= 0) {
              hpColor = '#64748b'; // Defeated / 0 HP
            } else if (pct <= 25) {
              hpColor = '#ef4444'; // Red (<= 25%)
            } else if (pct <= 50) {
              hpColor = '#eab308'; // Yellow (<= 50%)
            }

            hpBadge = `
              <span class="init-card-hp" title="Current / Max HP">
                <span class="init-hp-cur" style="color: ${hpColor}; font-weight: 700;">${curHp}</span><span class="init-hp-slash-dim">/${maxHp}</span>
              </span>
              <span class="init-player-ac-badge" title="Armor Class: ${vitals.ac}">🛡️${vitals.ac}</span>
            `;
          }

          const subtext = this.getPartySubtext(c.name);

          nameHtml = `
            <div class="init-card-name-row">
              <strong class="init-card-name ${isCurrentTurn ? 'is-turn-name' : ''}" title="${this.escapeHtml(c.name)}">
                ${isTargeted ? '<span class="init-card-target-reticle" title="Targeted">🎯</span>' : ''}
                ${this.escapeHtml(c.name)}
                ${isCurrentTurn ? '<span class="init-turn-badge">⚔️ Turn</span>' : ''}
              </strong>
              ${hpBadge}
            </div>
            ${subtext ? `<span class="init-card-sub">${this.escapeHtml(subtext)}</span>` : ''}
          `;
        } else {
          // Enemy Card: Name color transitions green -> yellow -> red
          const curHp = typeof c.hpCurrent === 'number' ? c.hpCurrent : (c.hpMax || 10);
          const maxHp = c.hpMax || 10;
          const damageTaken = Math.max(0, maxHp - curHp);
          const pct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

          let nameColor = '#22c55e'; // Green (> 50%)
          let isDead = false;
          if (pct <= 0) {
            nameColor = '#64748b'; // Defeated
            isDead = true;
          } else if (pct <= 25) {
            nameColor = '#ef4444'; // Red (<= 25%)
          } else if (pct <= 50) {
            nameColor = '#eab308'; // Yellow (<= 50%)
          }

          const styleAttr = isDead 
            ? `style="color: ${nameColor}; text-decoration: line-through; opacity: 0.65;"`
            : `style="color: ${nameColor};"`;

          // Total damage badge shown to party (e.g. -73)
          const playerDmgBadge = (!isDm && damageTaken > 0)
            ? `<span class="init-enemy-dmg-badge" title="Total damage taken: ${damageTaken}">-${damageTaken}</span>`
            : '';

          // DM gets exact HP / maxHp and (-damageTaken) plus AC
          const acDisplay = (c.ac !== null && c.ac !== undefined) ? c.ac : '';
          const dmHpBadge = isDm
            ? `<span class="init-card-hp init-dm-enemy-hp-badge" title="Current: ${curHp} / Max: ${maxHp} (Damage taken: ${damageTaken})">
                <span class="init-hp-cur" style="color: ${nameColor}; font-weight: 700;">${curHp}</span>
                <span class="init-hp-slash-dim">/${maxHp}</span>
                ${damageTaken > 0 ? `<span class="init-enemy-dmg-sub" title="Total damage taken">(-${damageTaken})</span>` : ''}
              </span>
              <span class="init-dm-enemy-ac-badge" title="Enemy AC (Click to edit)">
                <span class="init-ac-shield-icon">🛡️</span>
                <input type="number" class="init-enemy-ac-input" value="${acDisplay}" placeholder="AC" min="1" max="40" data-id="${c.id}" title="Type enemy AC" />
              </span>`
            : '';

          nameHtml = `
            <div class="init-card-name-row">
              <strong class="init-card-name init-enemy-name ${isCurrentTurn ? 'is-turn-name' : ''}" ${styleAttr} title="${this.escapeHtml(c.name)} ${isDead ? '(Defeated)' : ''}">
                ${isTargeted ? '<span class="init-card-target-reticle" title="Targeted">🎯</span>' : ''}
                ${this.escapeHtml(c.name)} ${isDead ? '💀' : ''}
                ${isCurrentTurn ? '<span class="init-turn-badge">⚔️ Turn</span>' : ''}
              </strong>
              ${playerDmgBadge}
              ${dmHpBadge}
            </div>
          `;

          // Max HP & Controls display ONLY for the DM!
          if (isDm) {
            enemyCtrlsHtml = `
              <div class="init-enemy-hp-ctrls">
                <div class="init-enemy-hp-row">
                  <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="-5" title="Subtract 5 HP">-5</button>
                  <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="-1" title="Subtract 1 HP">-1</button>
                  <input type="number" class="init-enemy-hp-input" value="${curHp}" min="0" max="${maxHp}" data-id="${c.id}" title="Type HP directly" />
                  <span class="init-enemy-hp-slash-dim">/${maxHp}</span>
                  <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="1" title="Add 1 HP">+1</button>
                  <button type="button" class="init-hp-tick-btn" data-id="${c.id}" data-delta="5" title="Add 5 HP">+5</button>
                </div>
                <div class="init-enemy-hp-subrow">
                  <button type="button" class="init-hp-calc-btn init-hp-half-btn" data-id="${c.id}" title="Halve damage / apply resistance (1-click)">🛡️ ½ Resist</button>
                  <button type="button" class="init-hp-calc-btn init-hp-double-btn" data-id="${c.id}" title="Double damage / apply weakness (1-click)">⚡ 2× Weakness</button>
                </div>
              </div>
            `;
          }
        }

        html += `
          <div class="init-card ${isCurrentTurn ? 'is-active-turn' : ''} ${isLeader ? 'is-leader' : ''} ${isTargeted ? 'is-targeted' : ''} ${isEnemy ? 'is-enemy-card' : ''}" data-id="${c.id}" title="Click to target ${this.escapeHtml(c.name)}">
            <div class="init-card-rank">#${startRank}</div>
            <div class="init-card-info">
              ${nameHtml}
              ${enemyCtrlsHtml}
            </div>
            <div class="init-card-scores">
              <span class="init-score-active" title="Final Initiative">${c.activeScore}</span>
              ${showLowerScore ? `
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

      // Bind card click for targeting
      container.querySelectorAll('.init-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // If clicking buttons or inputs, do not toggle targeting
          if (e.target.closest('.init-row-del-btn, .init-hp-tick-btn, .init-hp-calc-btn, .init-enemy-hp-input, .init-enemy-ac-input')) {
            return;
          }
          const id = card.dataset.id;
          this.selectTarget(id);
        });
      });

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

      // Bind DM Enemy AC typed inputs
      container.querySelectorAll('.init-enemy-ac-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = input.dataset.id;
          this.setEnemyAc(id, e.target.value);
        });
        input.addEventListener('click', (e) => e.stopPropagation());
      });

      // Bind DM Enemy HP Half button (½ Resist)
      container.querySelectorAll('.init-hp-half-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          this.halveEnemyDamage(id);
        });
      });

      // Bind DM Enemy HP Double button (2× Weakness)
      container.querySelectorAll('.init-hp-double-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          this.doubleEnemyDamage(id);
        });
      });

      // Bind DM Enemy HP tick buttons (-5, -1, +1, +5)
      container.querySelectorAll('.init-hp-tick-btn:not(.init-hp-calc-btn)').forEach(btn => {
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
        if (!e || !e.detail) return;
        const roll = e.detail;

        if (this.isInitiativeRoll(roll)) {
          this.handleNewRoll(roll);
        }
      });

      // Next Turn Button in header
      document.getElementById('init-next-turn-btn')?.addEventListener('click', () => {
        this.nextTurn();
      });

      // DM Undo and Reset Buttons
      document.getElementById('init-dm-undo-turn')?.addEventListener('click', () => {
        this.prevTurn();
      });

      document.getElementById('init-dm-reset-order')?.addEventListener('click', () => {
        if (confirm('Reset initiative order back to original roll results?')) {
          this.resetOrder();
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

      // Spacebar hotkey to advance turn when DM mode is active and initiative tracker is focused
      document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const isDm = typeof window.isDmMode === 'function' ? window.isDmMode() : false;
          if (isDm && this.isOpen && this.combatants.length > 0) {
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
            if (!isTyping) {
              e.preventDefault();
              this.nextTurn();
            }
          }
        }
      });

      // Listen for DM mode changes to live-toggle DM enemy quick-add & controls
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
