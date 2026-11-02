/**
 * The O-Codex — Party Character Sheet & Roster Manager
 * Complete campaign management for players and DM:
 *  - Full Party Roster (Pre-seeded with canon characters + custom creation)
 *  - Dedicated Left-Side Live Roll Tracker (Personal vs Everyone)
 *  - Clean View/Play Mode by default (no typable text box outlines)
 *  - Click-Bonus-To-Roll (clicking +1 in Constitution automatically rolls check)
 *  - "✏️ Edit Sheet" toggle for modifying stats, notes, items, and inventory
 *  - Interactive Vitals (HP steppers, Temp HP, AC, Speed, Initiative, Death Saves)
 *  - Weapons & Attack Actions with Roll Attack & Roll Damage buttons
 *  - Divions & Manifestations (O-Codex Canon Magic System)
 *  - DM Boons & Divine Blessings
 *  - Equipment, Magic Items (Attunement & Charges), Feats & Aether Gems
 *  - Real-time party cloud synchronization via Firebase Firestore
 */

(function () {
  const CHARACTERS_STORAGE_KEY = 'o_codex_characters';
  const ACTIVE_CHAR_KEY = 'o_codex_active_char_id';

  // Canon party default roster for zero-setup start
  const DEFAULT_ROSTER = [
    {
      id: 'char_valorie',
      name: 'Valorie',
      player: 'Valorie',
      heritage: 'Human (Arcane Scholar)',
      classLevel: 'Manifestor / Scholar 5',
      level: 5,
      alignment: 'Chaotic Good',
      vitals: {
        hpCurrent: 32,
        hpMax: 32,
        hpTemp: 0,
        ac: 13,
        initiative: 2,
        speed: 30,
        profBonus: 3,
        hitDice: '5d8',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 10,
        dex: 14,
        con: 12,
        int: 18,
        wis: 13,
        cha: 15,
        saveProfs: ['int', 'wis']
      },
      attacks: [
        {
          id: 'atk_1',
          name: 'Manifestor Staff',
          bonus: 5,
          damageFormula: '1d6+2',
          damageType: 'Bludgeoning / Arcane',
          notes: 'Focus item; can channel Flow without verbal component'
        },
        {
          id: 'atk_2',
          name: 'Aether Dart',
          bonus: 7,
          damageFormula: '2d4+4',
          damageType: 'Force / Divion',
          notes: 'Range 120ft; pierces minor barriers'
        }
      ],
      divions: [
        {
          id: 'div_1',
          name: 'Weave Distortion',
          type: 'Illusion / Manifest',
          rank: 'Tier II',
          cost: '1 Flow',
          manifestEffect: 'Bends ambient light and sound in a 20ft sphere, masking ally movements.'
        },
        {
          id: 'div_2',
          name: 'Thalexus Resonator',
          type: 'Forbidden Arcana',
          rank: 'Tier III',
          cost: '2 Flow',
          manifestEffect: 'Reconstructs echoes of ancient necromantic vibrations to reveal hidden undead.'
        }
      ],
      boons: [
        {
          id: 'boon_1',
          name: "Azzie's Calming Aegis",
          grantedBy: 'Azzie',
          effect: 'Once per long rest, grant advantage on a saving throw against fear or mind control to self and Bones.'
        }
      ],
      magicItems: [
        {
          id: 'item_1',
          name: 'Stolen Thalexus Codex Grimoire',
          rarity: 'Rare',
          attuned: true,
          charges: '3 / 3',
          description: 'A leather-bound volume salvaged from Eryndor Thalexus cavern collapse.'
        },
        {
          id: 'item_2',
          name: 'Luminescent Aether Vial',
          rarity: 'Uncommon',
          attuned: false,
          charges: '1 use',
          description: 'Restores 1d4+2 Flow when consumed during short rest.'
        }
      ],
      feats: [
        {
          id: 'feat_1',
          name: 'Keen Mind & Archive Memory',
          source: 'Scholar Feat',
          description: 'Can accurately recall anything seen or read within the past month; always knows north.'
        },
        {
          id: 'feat_2',
          name: 'Manifest Weaver',
          source: 'Specialty Feat',
          description: 'Adds Intelligence modifier to Divion concentration checks.'
        }
      ],
      equipment: [
        { id: 'eq_1', name: "Scholar's Robes & Satchel", qty: 1, notes: 'Waterproof ink containers' },
        { id: 'eq_2', name: 'Arcane Focus Crystal', qty: 1, notes: 'Bound into cedar staff' },
        { id: 'eq_3', name: 'Ration Pack (7 days)', qty: 1, notes: 'Hard biscuits and dried fruit' }
      ],
      currency: { cp: 12, sp: 45, gp: 130, pp: 3, aetherGems: 4 },
      notes: 'Investigating Eryndor Thalexus hidden laboratory and the origins of the skeletal giant carcass.'
    },
    {
      id: 'char_bones',
      name: 'Bones',
      player: 'Bones',
      heritage: 'Awakened Skeletal Colossus',
      classLevel: 'Titan Juggernaut 5',
      level: 5,
      alignment: 'Neutral Good',
      vitals: {
        hpCurrent: 58,
        hpMax: 58,
        hpTemp: 0,
        ac: 18,
        initiative: 0,
        speed: 30,
        profBonus: 3,
        hitDice: '5d12',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 19,
        dex: 10,
        con: 18,
        int: 9,
        wis: 11,
        cha: 8,
        saveProfs: ['str', 'con']
      },
      attacks: [
        {
          id: 'atk_b1',
          name: 'Enchanted Greatmaul',
          bonus: 7,
          damageFormula: '2d6+4',
          damageType: 'Bludgeoning',
          notes: 'Reroll 1s and 2s on damage dice.'
        },
        {
          id: 'atk_b2',
          name: 'Armored Gauntlet Slam',
          bonus: 7,
          damageFormula: '1d8+4',
          damageType: 'Bludgeoning',
          notes: 'Target must succeed on DC 15 STR save or be knocked prone.'
        }
      ],
      divions: [
        {
          id: 'div_b1',
          name: 'Sealed Colossus Roar',
          type: 'Primal Kinetic',
          rank: 'Tier I',
          cost: '1 Flow',
          manifestEffect: 'Vibrates the ground in a 15ft cone. Enemies make DC 14 STR save or stagger.'
        }
      ],
      boons: [
        {
          id: 'boon_b1',
          name: "Azzie's Humanoid Seal",
          grantedBy: 'Azzie',
          effect: 'Seals immense titan power into a humanoid shell. Resistance to necrotic and poison damage.'
        }
      ],
      magicItems: [
        {
          id: 'item_b1',
          name: 'Rune-Carved Plate of the Cavern',
          rarity: 'Very Rare',
          attuned: true,
          charges: 'Passive',
          description: 'Forged to restrain and channel the skeletal colossus kinetic mass.'
        }
      ],
      feats: [
        {
          id: 'feat_b1',
          name: 'Heavy Armor Master',
          source: 'Combat Feat',
          description: 'Nonmagical bludgeoning, piercing, and slashing damage is reduced by 3.'
        },
        {
          id: 'feat_b2',
          name: 'Guardian Instinct (Valorie)',
          source: 'Bond Feat',
          description: 'Can intercept an attack intended for Valorie when within 5ft as a reaction.'
        }
      ],
      equipment: [
        { id: 'eq_b1', name: 'Titan Greatmaul', qty: 1, notes: 'Forged from deep iron' },
        { id: 'eq_b2', name: 'Sealed Full Plate Armor', qty: 1, notes: 'Custom fit to skeleton' }
      ],
      currency: { cp: 0, sp: 10, gp: 40, pp: 0, aetherGems: 1 },
      notes: 'Awakened from Eryndor cave wall by Astie. Calmed and given armor seal by Azzie.'
    },
    {
      id: 'char_eris',
      name: 'Eris',
      player: 'Eris',
      heritage: 'Human (Avenger)',
      classLevel: 'Shadow Stalker / Avenger 5',
      level: 5,
      alignment: 'Chaotic Neutral',
      vitals: {
        hpCurrent: 44,
        hpMax: 44,
        hpTemp: 0,
        ac: 16,
        initiative: 4,
        speed: 35,
        profBonus: 3,
        hitDice: '5d10',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 13,
        dex: 18,
        con: 14,
        int: 11,
        wis: 15,
        cha: 10,
        saveProfs: ['dex', 'wis']
      },
      attacks: [
        {
          id: 'atk_e1',
          name: 'Shadow Curved Shortsword',
          bonus: 7,
          damageFormula: '1d6+4',
          damageType: 'Piercing / Dark',
          notes: 'Finesse; extra 2d6 sneak damage if ally is within 5ft.'
        },
        {
          id: 'atk_e2',
          name: 'Twin Throwing Daggers',
          bonus: 7,
          damageFormula: '1d4+4',
          damageType: 'Piercing',
          notes: 'Range 20/60ft.'
        }
      ],
      divions: [
        {
          id: 'div_e1',
          name: 'Vow of Reckoning',
          type: 'Avenger Domain',
          rank: 'Tier II',
          cost: '1 Flow',
          manifestEffect: 'Designates a target for 1 minute; attacks against it score critical hits on 19-20.'
        }
      ],
      boons: [
        {
          id: 'boon_e1',
          name: "Mother's Unyielding Resolve",
          grantedBy: 'Divine Encounter / Memory of Niamh',
          effect: 'Cannot be charmed or frightened when fighting to protect or recover kidnapped innocents.'
        }
      ],
      magicItems: [
        {
          id: 'item_e1',
          name: "Niamh's Carved Wooden Locket",
          rarity: 'Sentimental / Minor Warding',
          attuned: true,
          charges: 'Passive',
          description: 'A hand-whittled pendant of protection holding a lock of Niamh hair.'
        }
      ],
      feats: [
        {
          id: 'feat_e1',
          name: 'Alert',
          source: 'General Feat',
          description: '+5 bonus to initiative; cannot be surprised while conscious.'
        },
        {
          id: 'feat_e2',
          name: 'Relentless Tracker',
          source: 'Class Feature',
          description: 'Advantage on Survival checks to track missing persons and captives.'
        }
      ],
      equipment: [
        { id: 'eq_e1', name: 'Studded Leather Armor', qty: 1, notes: 'Midnight dye' },
        { id: 'eq_e2', name: 'Climber Kit & Grapple Hook', qty: 1, notes: '50ft silk rope' },
        { id: 'eq_e3', name: 'Smoke Bombs', qty: 3, notes: '10ft fog cloud on impact' }
      ],
      currency: { cp: 5, sp: 20, gp: 95, pp: 1, aetherGems: 2 },
      notes: 'Driven by the search for Niamh. Will cross any boundary to find the child she raised.'
    },
    {
      id: 'char_thiollier',
      name: 'Thiollier',
      player: 'Thiollier',
      heritage: 'Half-Elf (Duelist)',
      classLevel: 'Blade Master 5',
      level: 5,
      alignment: 'Neutral Good',
      vitals: {
        hpCurrent: 46,
        hpMax: 46,
        hpTemp: 0,
        ac: 17,
        initiative: 3,
        speed: 30,
        profBonus: 3,
        hitDice: '5d10',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 12,
        dex: 17,
        con: 14,
        int: 12,
        wis: 13,
        cha: 14,
        saveProfs: ['str', 'dex']
      },
      attacks: [
        {
          id: 'atk_t1',
          name: 'Fine Rapier of the Wind',
          bonus: 6,
          damageFormula: '1d8+3',
          damageType: 'Piercing',
          notes: 'Parry reaction adds +2 AC against one melee attack.'
        }
      ],
      divions: [],
      boons: [],
      magicItems: [],
      feats: [
        { id: 'feat_t1', name: 'Dual Wielder', source: 'Combat Feat', description: '+1 AC when wielding separate weapons.' }
      ],
      equipment: [
        { id: 'eq_t1', name: 'Fine Rapier', qty: 1, notes: 'Silver-pommel' },
        { id: 'eq_t2', name: 'Duelist Leathers', qty: 1, notes: 'Lightweight' }
      ],
      currency: { cp: 0, sp: 15, gp: 80, pp: 0, aetherGems: 1 },
      notes: 'Noble duelist honing their bladecraft alongside the party.'
    },
    {
      id: 'char_dove',
      name: 'Dove',
      player: 'Dove',
      heritage: 'Aasimar / Celestial Kin',
      classLevel: 'Aether Mystic / Healer 5',
      level: 5,
      alignment: 'Lawful Good',
      vitals: {
        hpCurrent: 36,
        hpMax: 36,
        hpTemp: 0,
        ac: 15,
        initiative: 1,
        speed: 30,
        profBonus: 3,
        hitDice: '5d8',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 10,
        dex: 13,
        con: 14,
        int: 13,
        wis: 18,
        cha: 14,
        saveProfs: ['wis', 'cha']
      },
      attacks: [
        {
          id: 'atk_d1',
          name: 'Radiant Ray',
          bonus: 7,
          damageFormula: '2d8+4',
          damageType: 'Radiant',
          notes: 'Target cannot benefit from invisibility until end of next turn.'
        }
      ],
      divions: [
        {
          id: 'div_d1',
          name: 'Aether Resurgence',
          type: 'Restoration',
          rank: 'Tier II',
          cost: '1 Flow',
          manifestEffect: 'Heals target within 30ft for 2d8+4 HP and cures poison.'
        }
      ],
      boons: [],
      magicItems: [],
      feats: [
        { id: 'feat_d1', name: 'Healer', source: 'General Feat', description: 'Can tend wounds using healer kit to restore 1d6+4+Level HP.' }
      ],
      equipment: [
        { id: 'eq_d1', name: "Healer's Kit (10 charges)", qty: 2, notes: 'Herbs and clean bandages' }
      ],
      currency: { cp: 8, sp: 30, gp: 65, pp: 0, aetherGems: 3 },
      notes: 'Support and spiritual anchor for the companions.'
    }
  ];

  class PartyCharacterManager {
    constructor() {
      this.characters = [];
      this.activeCharId = null;
      this.activeTab = 'combat'; // 'combat' | 'divions' | 'boons' | 'equipment' | 'magic' | 'feats' | 'notes'
      this.isEditMode = false;   // Default: Play/View Mode (no typable boxes)
      this.rollsTab = 'personal'; // 'personal' | 'everyone'
      this.debounceTimer = null;
      this.audioCtx = null;

      this.loadStorage();
    }

    loadStorage() {
      try {
        const raw = localStorage.getItem(CHARACTERS_STORAGE_KEY);
        if (raw) {
          this.characters = JSON.parse(raw);
          if (!Array.isArray(this.characters) || this.characters.length === 0) {
            this.characters = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
          }
        } else {
          this.characters = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
          this.saveStorage(false);
        }
      } catch (e) {
        this.characters = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
      }

      this.activeCharId = localStorage.getItem(ACTIVE_CHAR_KEY) || (this.characters[0] ? this.characters[0].id : null);
      if (!this.characters.some(c => c.id === this.activeCharId) && this.characters.length > 0) {
        this.activeCharId = this.characters[0].id;
      }
    }

    saveStorage(broadcast = true) {
      try {
        localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(this.characters));
        if (this.activeCharId) {
          localStorage.setItem(ACTIVE_CHAR_KEY, this.activeCharId);
        }
      } catch (e) {
        console.error('[CharacterSheet] Error saving characters:', e);
      }

      if (broadcast && window.CampaignCloudSync && typeof window.CampaignCloudSync.pushCharacters === 'function') {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          window.CampaignCloudSync.pushCharacters(this.characters);
        }, 600);
      }
    }

    onRemoteCharacters(remoteParty) {
      if (!Array.isArray(remoteParty) || remoteParty.length === 0) return;

      this.characters = remoteParty;
      localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(this.characters));

      if (!this.characters.some(c => c.id === this.activeCharId) && this.characters.length > 0) {
        this.activeCharId = this.characters[0].id;
      }

      this.renderRosterBar();
      this.renderCurrentSheet();
      this.renderRollTracker();
    }

    getActiveCharacter() {
      return this.characters.find(c => c.id === this.activeCharId) || this.characters[0];
    }

    setActiveCharacter(id) {
      if (this.characters.some(c => c.id === id)) {
        this.activeCharId = id;
        localStorage.setItem(ACTIVE_CHAR_KEY, id);
        const active = this.getActiveCharacter();
        if (active && active.name) {
          localStorage.setItem('o_codex_active_char_name', active.name);
        }
        this.renderRosterBar();
        this.renderCurrentSheet();
        this.renderRollTracker();
      }
    }

    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      const btn = document.getElementById('char-edit-toggle-btn');
      if (btn) {
        btn.textContent = this.isEditMode ? '✓ Done Editing' : '✏️ Edit Sheet';
        btn.classList.toggle('is-editing-active', this.isEditMode);
      }
      this.renderCurrentSheet();
    }

    init() {
      this.initDOM();
      const active = this.getActiveCharacter();
      if (active && active.name) {
        localStorage.setItem('o_codex_active_char_name', active.name);
      }
      this.renderRosterBar();
      this.renderCurrentSheet();
      this.renderRollTracker();
    }

    playHpSound(delta) {
      try {
        if (!this.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.audioCtx = new AudioContext();
        }
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const isHeal = delta > 0;
        const isBig = Math.abs(delta) >= 5;

        if (isHeal) {
          // Cheerful ascending blip/bloop
          const tones = isBig ? [480, 640, 820] : [520, 680];
          tones.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const startTime = now + (idx * 0.05);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.15, startTime + 0.07);

            gain.gain.setValueAtTime(0.09, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.09);
          });
        } else {
          // Punchy descending blop/thud
          const tones = isBig ? [240, 160, 110] : [220, 150];
          tones.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const startTime = now + (idx * 0.04);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.6), startTime + 0.06);

            gain.gain.setValueAtTime(0.12, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.08);
          });
        }
      } catch (e) {
        // Audio policy error suppression
      }
    }

    initDOM() {
      // Edit Mode Toggle
      document.getElementById('char-edit-toggle-btn')?.addEventListener('click', () => this.toggleEditMode());

      // "+ New Character" button
      document.getElementById('char-add-btn')?.addEventListener('click', () => this.createNewCharacter());

      // Export / Import buttons
      document.getElementById('char-export-btn')?.addEventListener('click', () => this.exportPartyJSON());
      document.getElementById('char-import-btn')?.addEventListener('click', () => {
        document.getElementById('char-import-file')?.click();
      });
      document.getElementById('char-import-file')?.addEventListener('change', (e) => this.importPartyJSON(e));

      // Character Sub-tabs (Combat, Divions, Boons, Equipment, Magic Items, Feats, Notes)
      document.querySelectorAll('.char-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.char-nav-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          this.activeTab = btn.dataset.tab;
          this.renderTabContent();
        });
      });

      // Left-Side Roll Tracker Tabs: Personal vs Everyone
      document.getElementById('rolls-tab-personal')?.addEventListener('click', () => {
        this.rollsTab = 'personal';
        document.getElementById('rolls-tab-personal')?.classList.add('is-active');
        document.getElementById('rolls-tab-everyone')?.classList.remove('is-active');
        this.renderRollTracker();
      });

      document.getElementById('rolls-tab-everyone')?.addEventListener('click', () => {
        this.rollsTab = 'everyone';
        document.getElementById('rolls-tab-everyone')?.classList.add('is-active');
        document.getElementById('rolls-tab-personal')?.classList.remove('is-active');
        this.renderRollTracker();
      });

      // Quick d20 button in roll sidebar
      document.getElementById('char-quick-d20-btn')?.addEventListener('click', () => {
        const char = this.getActiveCharacter();
        if (window.DiceRoller) {
          window.DiceRoller.roll('1d20', 'Quick d20', char?.name || 'Adventurer');
        }
      });

      // Open full tray drawer
      document.getElementById('char-open-drawer-btn')?.addEventListener('click', () => {
        window.DiceRoller?.toggleTray();
      });

      // Listen for dice roll events to live-update roll sidebar
      window.addEventListener('diceroller:new-roll', () => {
        this.renderRollTracker();
      });
    }

    renderRosterBar() {
      const rosterContainer = document.getElementById('char-roster-list');
      if (!rosterContainer) return;

      rosterContainer.innerHTML = '';
      this.characters.forEach(char => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `char-roster-pill ${char.id === this.activeCharId ? 'is-active' : ''}`;
        btn.innerHTML = `
          <span class="char-pill-avatar">🧙</span>
          <span class="char-pill-name">${escapeHtml(char.name)}</span>
          <span class="char-pill-class">Lv.${char.level || 1}</span>
        `;
        btn.addEventListener('click', () => this.setActiveCharacter(char.id));
        rosterContainer.appendChild(btn);
      });
    }

    renderCurrentSheet() {
      const char = this.getActiveCharacter();
      if (!char) return;

      const editBtn = document.getElementById('char-edit-toggle-btn');
      if (editBtn) {
        editBtn.textContent = this.isEditMode ? '✓ Done Editing' : '✏️ Edit Sheet';
        editBtn.classList.toggle('is-editing-active', this.isEditMode);
      }

      // Render Persona
      this.renderPersona(char);

      // Render Vitals & Combat Header
      this.renderVitals(char);

      // Render Ability Scores
      this.renderAbilityScores(char);

      // Render Active Tab Content
      this.renderTabContent();

      // Render Left Roll Tracker
      this.renderRollTracker();
    }

    // 1. PERSONA HEADER (VIEW vs EDIT)
    renderPersona(char) {
      const container = document.getElementById('char-persona-section');
      if (!container) return;

      if (!this.isEditMode) {
        // CLEAN PLAY/VIEW MODE (No typing inputs, pure typography)
        container.className = 'char-persona-card persona-view-mode';
        container.innerHTML = `
          <div class="persona-display-head">
            <div class="persona-title-group">
              <h2 class="persona-hero-name">${escapeHtml(char.name || 'Hero')}</h2>
              <span class="persona-hero-class">${escapeHtml(char.classLevel || 'Adventurer')}</span>
            </div>
            <div class="persona-meta-pill">
              <span class="meta-label">Player:</span>
              <strong class="meta-val">${escapeHtml(char.player || 'Player')}</strong>
            </div>
          </div>
          <div class="persona-display-sub">
            <span class="persona-tag"><strong>Heritage:</strong> ${escapeHtml(char.heritage || 'Human')}</span>
            <span class="persona-tag"><strong>Alignment:</strong> ${escapeHtml(char.alignment || 'Neutral')}</span>
          </div>
        `;
      } else {
        // EDIT MODE (Inputs with clear borders and values)
        container.className = 'char-persona-card persona-edit-mode';
        container.innerHTML = `
          <div class="persona-row persona-row-primary">
            <div class="persona-field persona-field-name">
              <label for="char-name-input">Character Name</label>
              <input type="text" id="char-name-input" class="persona-input persona-input-lg" value="${escapeHtml(char.name || '')}" placeholder="Character Name" />
            </div>
            <div class="persona-field persona-field-class">
              <label for="char-class-input">Class & Level</label>
              <input type="text" id="char-class-input" class="persona-input" value="${escapeHtml(char.classLevel || '')}" placeholder="e.g. Manifestor 5" />
            </div>
            <div class="persona-field persona-field-player">
              <label for="char-player-input">Player Name</label>
              <input type="text" id="char-player-input" class="persona-input" value="${escapeHtml(char.player || '')}" placeholder="Player or DM" />
            </div>
          </div>
          <div class="persona-row persona-row-secondary">
            <div class="persona-field">
              <label for="char-heritage-input">Heritage / Race</label>
              <input type="text" id="char-heritage-input" class="persona-input" value="${escapeHtml(char.heritage || '')}" placeholder="e.g. Human" />
            </div>
            <div class="persona-field">
              <label for="char-align-input">Alignment</label>
              <input type="text" id="char-align-input" class="persona-input" value="${escapeHtml(char.alignment || '')}" placeholder="e.g. Chaotic Good" />
            </div>
          </div>
        `;

        // Wire inputs in edit mode
        const bind = (id, prop) => {
          const el = container.querySelector(`#${id}`);
          el?.addEventListener('input', (e) => {
            char[prop] = e.target.value;
            this.saveStorage();
            if (prop === 'name') this.renderRosterBar();
          });
        };
        bind('char-name-input', 'name');
        bind('char-player-input', 'player');
        bind('char-class-input', 'classLevel');
        bind('char-heritage-input', 'heritage');
        bind('char-align-input', 'alignment');
      }
    }

    // 2. VITALS STRIP (HP, AC, Speed, Initiative, Death Saves)
    renderVitals(char) {
      const container = document.getElementById('char-vitals-section');
      if (!container) return;

      const vitals = char.vitals || {
        hpCurrent: 10, hpMax: 10, hpTemp: 0, ac: 10, initiative: 0, speed: 30, profBonus: 2, deathSaves: { successes: 0, failures: 0 }
      };

      const hpPercent = Math.min(100, Math.max(0, (vitals.hpCurrent / (vitals.hpMax || 1)) * 100));
      const hpColor = hpPercent > 50 ? '#38bdf8' : (hpPercent > 25 ? '#f59e0b' : '#ef4444');
      const initMod = vitals.initiative || 0;
      const initModStr = initMod >= 0 ? `+${initMod}` : `${initMod}`;

      if (!this.isEditMode) {
        // CLEAN PLAY/VIEW MODE
        container.innerHTML = `
          <!-- HP Card -->
          <div class="vital-card vital-card-hp">
            <div class="vital-card-header">
              <span class="vital-label">Hit Points</span>
              <span class="vital-sublabel">${vitals.hpTemp > 0 ? `+${vitals.hpTemp} Temp` : 'Current / Max'}</span>
            </div>
            <div class="hp-stepper-row">
              <button type="button" class="hp-step-btn" id="hp-minus-5">-5</button>
              <button type="button" class="hp-step-btn" id="hp-minus-1">-1</button>
              <div class="hp-static-box">
                <span class="hp-cur-bold">${vitals.hpCurrent}</span>
                <span class="hp-slash">/</span>
                <span class="hp-max-dim">${vitals.hpMax}</span>
              </div>
              <button type="button" class="hp-step-btn" id="hp-plus-1">+1</button>
              <button type="button" class="hp-step-btn" id="hp-plus-5">+5</button>
            </div>
            <div class="hp-bar-track">
              <div class="hp-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
            </div>
          </div>

          <!-- AC -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Armor Class</span>
            <div class="vital-big-static">${vitals.ac}</div>
            <span class="vital-caption">Shield & Armor</span>
          </div>

          <!-- Initiative -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Initiative</span>
            <div class="vital-big-static">${initModStr}</div>
            <button type="button" class="btn btn-secondary btn-xs" id="char-roll-init-btn">🎲 Roll Init</button>
          </div>

          <!-- Speed -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Speed</span>
            <div class="vital-big-static">${vitals.speed}<span class="vital-unit">ft</span></div>
            <span class="vital-caption">Movement</span>
          </div>

          <!-- Proficiency -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Proficiency</span>
            <div class="vital-big-static">+${vitals.profBonus}</div>
            <span class="vital-caption">Bonus</span>
          </div>

          <!-- Death Saves -->
          <div class="vital-card vital-card-death">
            <span class="vital-label">Death Saves</span>
            <div class="death-saves-row">
              <span class="death-save-label">Succ:</span>
              <input type="checkbox" id="death-succ-1" class="death-box death-succ" ${vitals.deathSaves.successes >= 1 ? 'checked' : ''} />
              <input type="checkbox" id="death-succ-2" class="death-box death-succ" ${vitals.deathSaves.successes >= 2 ? 'checked' : ''} />
              <input type="checkbox" id="death-succ-3" class="death-box death-succ" ${vitals.deathSaves.successes >= 3 ? 'checked' : ''} />
            </div>
            <div class="death-saves-row">
              <span class="death-save-label">Fail:</span>
              <input type="checkbox" id="death-fail-1" class="death-box death-fail" ${vitals.deathSaves.failures >= 1 ? 'checked' : ''} />
              <input type="checkbox" id="death-fail-2" class="death-box death-fail" ${vitals.deathSaves.failures >= 2 ? 'checked' : ''} />
              <input type="checkbox" id="death-fail-3" class="death-box death-fail" ${vitals.deathSaves.failures >= 3 ? 'checked' : ''} />
            </div>
            <button type="button" class="btn btn-secondary btn-xs death-roll-btn" id="char-roll-death-save-btn" title="Roll raw 1d20 Death Saving Throw">🎲 Roll d20</button>
          </div>
        `;
      } else {
        // EDIT MODE (Full input controls)
        container.innerHTML = `
          <!-- HP Edit Card -->
          <div class="vital-card vital-card-hp">
            <div class="vital-card-header">
              <span class="vital-label">Hit Points (Edit)</span>
              <span class="vital-sublabel">Current / Max / Temp</span>
            </div>
            <div class="hp-edit-row">
              <label>Cur: <input type="number" id="hp-edit-cur" class="vital-edit-input" value="${vitals.hpCurrent}" min="0" /></label>
              <label>Max: <input type="number" id="hp-edit-max" class="vital-edit-input" value="${vitals.hpMax}" min="1" /></label>
              <label>Temp: <input type="number" id="hp-edit-temp" class="vital-edit-input" value="${vitals.hpTemp || 0}" min="0" /></label>
            </div>
            <div class="hp-bar-track">
              <div class="hp-bar-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
            </div>
          </div>

          <!-- AC Edit -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Armor Class</span>
            <input type="number" id="ac-edit-input" class="vital-edit-input vital-edit-lg" value="${vitals.ac}" min="1" max="50" />
            <span class="vital-caption">Shield & Armor</span>
          </div>

          <!-- Initiative Edit -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Initiative Mod</span>
            <input type="number" id="init-edit-input" class="vital-edit-input vital-edit-lg" value="${vitals.initiative || 0}" />
            <span class="vital-caption">Bonus Mod</span>
          </div>

          <!-- Speed Edit -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Speed (ft)</span>
            <input type="number" id="speed-edit-input" class="vital-edit-input vital-edit-lg" value="${vitals.speed}" min="0" step="5" />
            <span class="vital-caption">Base Movement</span>
          </div>

          <!-- Proficiency Edit -->
          <div class="vital-card vital-card-compact">
            <span class="vital-label">Proficiency</span>
            <input type="number" id="prof-edit-input" class="vital-edit-input vital-edit-lg" value="${vitals.profBonus}" min="1" max="10" />
            <span class="vital-caption">Bonus</span>
          </div>

          <!-- Death Saves -->
          <div class="vital-card vital-card-death">
            <span class="vital-label">Death Saves</span>
            <div class="death-saves-row">
              <span class="death-save-label">Succ:</span>
              <input type="checkbox" id="death-succ-1" class="death-box death-succ" ${vitals.deathSaves.successes >= 1 ? 'checked' : ''} />
              <input type="checkbox" id="death-succ-2" class="death-box death-succ" ${vitals.deathSaves.successes >= 2 ? 'checked' : ''} />
              <input type="checkbox" id="death-succ-3" class="death-box death-succ" ${vitals.deathSaves.successes >= 3 ? 'checked' : ''} />
            </div>
            <div class="death-saves-row">
              <span class="death-save-label">Fail:</span>
              <input type="checkbox" id="death-fail-1" class="death-box death-fail" ${vitals.deathSaves.failures >= 1 ? 'checked' : ''} />
              <input type="checkbox" id="death-fail-2" class="death-box death-fail" ${vitals.deathSaves.failures >= 2 ? 'checked' : ''} />
              <input type="checkbox" id="death-fail-3" class="death-box death-fail" ${vitals.deathSaves.failures >= 3 ? 'checked' : ''} />
            </div>
            <button type="button" class="btn btn-secondary btn-xs death-roll-btn" id="char-roll-death-save-btn" title="Roll raw 1d20 Death Saving Throw">🎲 Roll d20</button>
          </div>
        `;

        // Wire inputs in edit mode
        container.querySelector('#hp-edit-cur')?.addEventListener('change', (e) => {
          const oldVal = vitals.hpCurrent;
          const newVal = Math.max(0, parseInt(e.target.value, 10) || 0);
          if (newVal !== oldVal) {
            this.playHpSound(newVal - oldVal);
          }
          vitals.hpCurrent = newVal;
          this.saveStorage();
        });
        container.querySelector('#hp-edit-max')?.addEventListener('change', (e) => {
          vitals.hpMax = Math.max(1, parseInt(e.target.value, 10) || 1);
          this.saveStorage();
        });
        container.querySelector('#hp-edit-temp')?.addEventListener('change', (e) => {
          vitals.hpTemp = parseInt(e.target.value, 10) || 0;
          this.saveStorage();
        });
        container.querySelector('#ac-edit-input')?.addEventListener('change', (e) => {
          vitals.ac = parseInt(e.target.value, 10) || 10;
          this.saveStorage();
        });
        container.querySelector('#init-edit-input')?.addEventListener('change', (e) => {
          vitals.initiative = parseInt(e.target.value, 10) || 0;
          this.saveStorage();
        });
        container.querySelector('#speed-edit-input')?.addEventListener('change', (e) => {
          vitals.speed = parseInt(e.target.value, 10) || 30;
          this.saveStorage();
        });
        container.querySelector('#prof-edit-input')?.addEventListener('change', (e) => {
          vitals.profBonus = parseInt(e.target.value, 10) || 2;
          this.saveStorage();
        });
      }

      // HP Steppers (Active in view mode)
      const setupHpBtn = (id, delta) => {
        container.querySelector(`#${id}`)?.addEventListener('click', () => {
          this.playHpSound(delta);
          vitals.hpCurrent = Math.max(0, vitals.hpCurrent + delta);
          this.saveStorage();
          this.renderVitals(char);

          // Visual pop on the HP value
          const hpBox = container.querySelector('.hp-static-box');
          if (hpBox) {
            hpBox.classList.add(delta > 0 ? 'pulse-heal' : 'pulse-damage');
            setTimeout(() => hpBox.classList.remove('pulse-heal', 'pulse-damage'), 300);
          }
        });
      };
      setupHpBtn('hp-minus-5', -5);
      setupHpBtn('hp-minus-1', -1);
      setupHpBtn('hp-plus-1', 1);
      setupHpBtn('hp-plus-5', 5);

      // Roll Initiative button
      container.querySelector('#char-roll-init-btn')?.addEventListener('click', () => {
        if (window.DiceRoller) {
          window.DiceRoller.roll('1d20', 'Initiative Check', char.name, 'normal', initMod);
        }
      });

      // Death Saving Throw raw d20 button
      container.querySelector('#char-roll-death-save-btn')?.addEventListener('click', () => {
        if (window.DiceRoller) {
          const result = window.DiceRoller.roll('1d20', 'Death Saving Throw', char.name, 'normal', 0);
          if (result) {
            const deathSaves = vitals.deathSaves || { successes: 0, failures: 0 };
            if (result.total >= 10) {
              if (result.isCrit) {
                // Natural 20: Regain 1 HP and stabilize
                vitals.hpCurrent = Math.max(1, vitals.hpCurrent || 1);
                deathSaves.successes = Math.min(3, deathSaves.successes + 2);
                this.playHpSound(5);
              } else {
                deathSaves.successes = Math.min(3, deathSaves.successes + 1);
                this.playHpSound(1);
              }
            } else {
              if (result.isFumble) {
                // Natural 1: 2 failures
                deathSaves.failures = Math.min(3, deathSaves.failures + 2);
                this.playHpSound(-5);
              } else {
                deathSaves.failures = Math.min(3, deathSaves.failures + 1);
                this.playHpSound(-1);
              }
            }
            this.saveStorage();
            this.renderVitals(char);
          }
        }
      });

      // Death Saves Checkboxes
      const deathSaves = vitals.deathSaves || { successes: 0, failures: 0 };
      for (let i = 1; i <= 3; i++) {
        container.querySelector(`#death-succ-${i}`)?.addEventListener('change', () => {
          let count = 0;
          for (let j = 1; j <= 3; j++) {
            if (container.querySelector(`#death-succ-${j}`)?.checked) count++;
          }
          deathSaves.successes = count;
          this.saveStorage();
        });
        container.querySelector(`#death-fail-${i}`)?.addEventListener('change', () => {
          let count = 0;
          for (let j = 1; j <= 3; j++) {
            if (container.querySelector(`#death-fail-${j}`)?.checked) count++;
          }
          deathSaves.failures = count;
          this.saveStorage();
        });
      }
    }

    // 3. ABILITY SCORES (CLICK-BONUS-TO-ROLL vs EDIT)
    renderAbilityScores(char) {
      const stats = char.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, saveProfs: [] };
      const profBonus = (char.vitals && char.vitals.profBonus) ? char.vitals.profBonus : 2;
      const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      const abNames = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
      const fullNames = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

      const container = document.getElementById('char-ability-grid');
      if (!container) return;

      container.innerHTML = '';
      abilities.forEach(ab => {
        const score = stats[ab] || 10;
        const mod = Math.floor((score - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        const isProf = Array.isArray(stats.saveProfs) && stats.saveProfs.includes(ab);
        const saveMod = mod + (isProf ? profBonus : 0);
        const saveModStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;

        const card = document.createElement('div');

        if (!this.isEditMode) {
          // CLEAN PLAY MODE: The entire card is interactive; clicking anywhere in the box rolls the check!
          card.className = 'char-stat-card stat-card-play';
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', '0');
          card.setAttribute('title', `Click anywhere in this box to roll ${fullNames[ab]} Check (${modStr})`);
          card.innerHTML = `
            <div class="stat-card-title">${abNames[ab]}</div>
            <div class="stat-mod-click-btn">
              ${modStr}
            </div>
            <div class="stat-score-caption">Score ${score}</div>
            ${isProf ? `<button type="button" class="stat-save-badge-play" title="Click to roll ${fullNames[ab]} Save (+${saveMod})">Save ${saveModStr}</button>` : ''}
          `;

          // Clicking anywhere in the ability score box rolls the check automatically!
          card.addEventListener('click', () => {
            if (window.DiceRoller) {
              window.DiceRoller.roll('1d20', `${fullNames[ab]} Check`, char.name, 'normal', mod);
            }
          });

          // Keyboard support (Enter or Space) when focused on the ability box
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (window.DiceRoller) {
                window.DiceRoller.roll('1d20', `${fullNames[ab]} Check`, char.name, 'normal', mod);
              }
            }
          });

          // Clicking save badge specifically rolls the saving throw instead of check
          const saveBadge = card.querySelector('.stat-save-badge-play');
          saveBadge?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.DiceRoller) {
              window.DiceRoller.roll('1d20', `${fullNames[ab]} Save`, char.name, 'normal', saveMod);
            }
          });
        } else {
          // EDIT MODE: Typable score input and save proficiency toggle
          card.className = 'char-stat-card char-stat-card-editing';
          card.innerHTML = `
            <div class="stat-card-title">${abNames[ab]}</div>
            <div class="stat-card-mod">${modStr}</div>
            <div class="stat-card-base">
              <span>Score:</span>
              <input type="number" class="stat-score-input" value="${score}" min="1" max="30" data-stat="${ab}" />
            </div>
            <label class="stat-save-toggle-label">
              <input type="checkbox" class="stat-save-prof-check" data-stat="${ab}" ${isProf ? 'checked' : ''} />
              <span>Save Prof (+${profBonus})</span>
            </label>
          `;

          const scoreInput = card.querySelector('.stat-score-input');
          scoreInput?.addEventListener('change', (e) => {
            stats[ab] = parseInt(e.target.value, 10) || 10;
            this.saveStorage();
            this.renderAbilityScores(char);
          });

          const profCheck = card.querySelector('.stat-save-prof-check');
          profCheck?.addEventListener('change', (e) => {
            if (!Array.isArray(stats.saveProfs)) stats.saveProfs = [];
            if (e.target.checked) {
              if (!stats.saveProfs.includes(ab)) stats.saveProfs.push(ab);
            } else {
              stats.saveProfs = stats.saveProfs.filter(s => s !== ab);
            }
            this.saveStorage();
          });
        }

        container.appendChild(card);
      });
    }

    // 4. SUB-TABS (Combat, Divions, Boons, Equipment, Magic, Feats, Notes)
    renderTabContent() {
      const char = this.getActiveCharacter();
      if (!char) return;

      const viewContainer = document.getElementById('char-tab-view');
      if (!viewContainer) return;

      switch (this.activeTab) {
        case 'combat':
          this.renderCombatTab(viewContainer, char);
          break;
        case 'divions':
          this.renderDivionsTab(viewContainer, char);
          break;
        case 'boons':
          this.renderBoonsTab(viewContainer, char);
          break;
        case 'equipment':
          this.renderEquipmentTab(viewContainer, char);
          break;
        case 'magic':
          this.renderMagicTab(viewContainer, char);
          break;
        case 'feats':
          this.renderFeatsTab(viewContainer, char);
          break;
        case 'notes':
          this.renderNotesTab(viewContainer, char);
          break;
        default:
          this.renderCombatTab(viewContainer, char);
      }
    }

    // COMBAT & ATTACKS TAB
    renderCombatTab(container, char) {
      if (!Array.isArray(char.attacks)) char.attacks = [];

      let attacksHtml = '';
      if (char.attacks.length === 0) {
        attacksHtml = `<div class="char-empty-msg">No attacks or weapons registered.${this.isEditMode ? ' Click "Add Attack" below!' : ''}</div>`;
      } else {
        attacksHtml = char.attacks.map((atk, index) => `
          <div class="char-item-card char-atk-card" data-index="${index}">
            <div class="item-card-header">
              <strong class="item-card-title">${escapeHtml(atk.name)}</strong>
              ${this.isEditMode ? `
                <div class="item-card-controls">
                  <button type="button" class="char-item-del-btn" data-type="attack" data-index="${index}" title="Remove Attack">✕</button>
                </div>
              ` : ''}
            </div>
            <div class="atk-card-details">
              <span class="atk-bonus-badge">Atk: ${atk.bonus >= 0 ? `+${atk.bonus}` : atk.bonus}</span>
              <span class="atk-damage-badge">${escapeHtml(atk.damageFormula)} ${escapeHtml(atk.damageType || '')}</span>
            </div>
            ${atk.notes ? `<p class="item-card-notes">${escapeHtml(atk.notes)}</p>` : ''}
            <div class="atk-roll-buttons">
              <button type="button" class="btn btn-secondary btn-sm atk-roll-atk-btn" data-index="${index}">
                🎲 Roll Attack (${atk.bonus >= 0 ? `+${atk.bonus}` : atk.bonus})
              </button>
              <button type="button" class="btn btn-secondary btn-sm atk-roll-dmg-btn" data-index="${index}">
                💥 Roll Damage (${escapeHtml(atk.damageFormula)})
              </button>
            </div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Attacks & Combat Actions</h3>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-attack">+ Add Attack / Weapon</button>` : ''}
        </div>
        <div class="char-cards-grid">${attacksHtml}</div>
      `;

      // Handlers
      if (this.isEditMode) {
        container.querySelector('#btn-add-attack')?.addEventListener('click', () => {
          const name = prompt('Weapon / Attack Name (e.g. Shortsword, Fire Bolt):');
          if (!name) return;
          const bonus = parseInt(prompt('Attack Bonus (e.g. 5 for +5):', '5'), 10) || 0;
          const damageFormula = prompt('Damage Formula (e.g., 1d8+3, 2d6):', '1d8+3') || '1d8';
          const damageType = prompt('Damage Type (e.g. Slashing, Radiant):', 'Slashing') || '';
          const notes = prompt('Additional Notes / Properties (optional):', '') || '';

          char.attacks.push({ id: `atk_${Date.now()}`, name, bonus, damageFormula, damageType, notes });
          this.saveStorage();
          this.renderCombatTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="attack"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Remove "${char.attacks[idx].name}"?`)) {
              char.attacks.splice(idx, 1);
              this.saveStorage();
              this.renderCombatTab(container, char);
            }
          });
        });
      }

      container.querySelectorAll('.atk-roll-atk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const atk = char.attacks[idx];
          if (window.DiceRoller) {
            window.DiceRoller.roll('1d20', `${atk.name} Attack`, char.name, 'normal', atk.bonus);
          }
        });
      });

      container.querySelectorAll('.atk-roll-dmg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const atk = char.attacks[idx];
          if (window.DiceRoller) {
            window.DiceRoller.roll(atk.damageFormula, `${atk.name} Damage`, char.name, 'normal', 0);
          }
        });
      });
    }

    // DIVIONS & MANIFESTS TAB
    renderDivionsTab(container, char) {
      if (!Array.isArray(char.divions)) char.divions = [];

      let divionsHtml = '';
      if (char.divions.length === 0) {
        divionsHtml = `<div class="char-empty-msg">No Divions recorded.${this.isEditMode ? ' Register manifests or Flow arts below!' : ''}</div>`;
      } else {
        divionsHtml = char.divions.map((div, index) => `
          <div class="char-item-card char-divion-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(div.name)}</strong>
                <span class="divion-badge-type">${escapeHtml(div.type || 'Manifest')}</span>
                <span class="divion-badge-rank">${escapeHtml(div.rank || 'Tier I')}</span>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="btn btn-secondary btn-xs divion-channel-btn" data-index="${index}" title="Channel Flow and announce to party">✨ Channel</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="divion" data-index="${index}" title="Remove Divion">✕</button>` : ''}
              </div>
            </div>
            <div class="divion-cost"><strong>Cost:</strong> ${escapeHtml(div.cost || 'None')}</div>
            <div class="divion-manifest"><strong>Manifestation:</strong> ${escapeHtml(div.manifestEffect || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <div>
            <h3>Divions & Manifestations</h3>
            <p class="section-subtitle">Canon Magic System: Channeling Flow through divine domains and personal manifests.</p>
          </div>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-divion">+ Add Divion</button>` : ''}
        </div>
        <div class="char-cards-grid">${divionsHtml}</div>
      `;

      // Handlers
      container.querySelectorAll('.divion-channel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const div = char.divions[idx];
          if (div && window.DiceRoller) {
            const intScore = char.stats?.int || 10;
            const intMod = Math.floor((intScore - 10) / 2);
            window.DiceRoller.roll('1d20', `Channel: ${div.name}`, char.name, 'normal', intMod);
          }
        });
      });

      if (this.isEditMode) {
        container.querySelector('#btn-add-divion')?.addEventListener('click', () => {
          const name = prompt('Divion / Manifest Name:');
          if (!name) return;
          const type = prompt('Domain / School (e.g. Illusion, Light, Kinetic, Primal):', 'Domain Manifest') || '';
          const rank = prompt('Tier / Rank (e.g. Tier I, Tier II, Master):', 'Tier I') || '';
          const cost = prompt('Flow / Aether Cost (e.g. 1 Flow, 2 Shards):', '1 Flow') || '';
          const manifestEffect = prompt('Manifestation Effect & Lore:') || '';

          char.divions.push({ id: `div_${Date.now()}`, name, type, rank, cost, manifestEffect });
          this.saveStorage();
          this.renderDivionsTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="divion"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Remove "${char.divions[idx].name}"?`)) {
              char.divions.splice(idx, 1);
              this.saveStorage();
              this.renderDivionsTab(container, char);
            }
          });
        });
      }
    }

    // DM BOONS & BLESSINGS TAB
    renderBoonsTab(container, char) {
      if (!Array.isArray(char.boons)) char.boons = [];

      let boonsHtml = '';
      if (char.boons.length === 0) {
        boonsHtml = `<div class="char-empty-msg">No DM boons or divine blessings recorded yet.</div>`;
      } else {
        boonsHtml = char.boons.map((boon, index) => `
          <div class="char-item-card char-boon-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(boon.name)}</strong>
                <span class="boon-granted-by">Granted by: <em>${escapeHtml(boon.grantedBy || 'Dungeon Master')}</em></span>
              </div>
              ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="boon" data-index="${index}" title="Remove Boon">✕</button>` : ''}
            </div>
            <div class="boon-effect">${escapeHtml(boon.effect || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <div>
            <h3>DM Boons, Blessings & Divine Gifts</h3>
            <p class="section-subtitle">Special campaign rewards, patron blessings, and narrative miracles bestowed by the DM.</p>
          </div>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-boon">+ Add Boon / Blessing</button>` : ''}
        </div>
        <div class="char-cards-grid">${boonsHtml}</div>
      `;

      if (this.isEditMode) {
        container.querySelector('#btn-add-boon')?.addEventListener('click', () => {
          const name = prompt('Boon / Blessing Title:');
          if (!name) return;
          const grantedBy = prompt('Granted By (e.g. Azzie, The High Sovereign):', 'Dungeon Master') || 'Dungeon Master';
          const effect = prompt('Boon Effect / Power details:') || '';

          char.boons.push({ id: `boon_${Date.now()}`, name, grantedBy, effect });
          this.saveStorage();
          this.renderBoonsTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="boon"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Remove "${char.boons[idx].name}"?`)) {
              char.boons.splice(idx, 1);
              this.saveStorage();
              this.renderBoonsTab(container, char);
            }
          });
        });
      }
    }

    // EQUIPMENT & CURRENCY TAB
    renderEquipmentTab(container, char) {
      if (!Array.isArray(char.equipment)) char.equipment = [];
      const cur = char.currency || { cp: 0, sp: 0, gp: 0, pp: 0, aetherGems: 0 };

      let eqHtml = '';
      if (char.equipment.length === 0) {
        eqHtml = `<div class="char-empty-msg">No equipment items recorded.</div>`;
      } else {
        eqHtml = char.equipment.map((eq, index) => `
          <div class="char-eq-row">
            <span class="eq-qty">x${eq.qty || 1}</span>
            <span class="eq-name">${escapeHtml(eq.name)}</span>
            <span class="eq-notes">${escapeHtml(eq.notes || '')}</span>
            ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="equipment" data-index="${index}">✕</button>` : ''}
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Equipment & Inventory</h3>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-eq">+ Add Equipment</button>` : ''}
        </div>

        <div class="char-currency-panel ${!this.isEditMode ? 'currency-panel-view' : ''}">
          <div class="currency-group">
            <label>CP</label>
            ${this.isEditMode ? `<input type="number" id="cur-cp" value="${cur.cp || 0}" min="0" />` : `<strong class="cur-static-val">${cur.cp || 0}</strong>`}
          </div>
          <div class="currency-group">
            <label>SP</label>
            ${this.isEditMode ? `<input type="number" id="cur-sp" value="${cur.sp || 0}" min="0" />` : `<strong class="cur-static-val">${cur.sp || 0}</strong>`}
          </div>
          <div class="currency-group">
            <label>GP</label>
            ${this.isEditMode ? `<input type="number" id="cur-gp" value="${cur.gp || 0}" min="0" />` : `<strong class="cur-static-val">${cur.gp || 0}</strong>`}
          </div>
          <div class="currency-group">
            <label>PP</label>
            ${this.isEditMode ? `<input type="number" id="cur-pp" value="${cur.pp || 0}" min="0" />` : `<strong class="cur-static-val">${cur.pp || 0}</strong>`}
          </div>
          <div class="currency-group currency-special">
            <label>💎 Aether</label>
            ${this.isEditMode ? `<input type="number" id="cur-gems" value="${cur.aetherGems || 0}" min="0" />` : `<strong class="cur-static-val">${cur.aetherGems || 0}</strong>`}
          </div>
        </div>

        <div class="char-eq-list">${eqHtml}</div>
      `;

      if (this.isEditMode) {
        ['cp', 'sp', 'gp', 'pp'].forEach(coin => {
          container.querySelector(`#cur-${coin}`)?.addEventListener('change', (e) => {
            cur[coin] = parseInt(e.target.value, 10) || 0;
            char.currency = cur;
            this.saveStorage();
          });
        });
        container.querySelector('#cur-gems')?.addEventListener('change', (e) => {
          cur.aetherGems = parseInt(e.target.value, 10) || 0;
          char.currency = cur;
          this.saveStorage();
        });

        container.querySelector('#btn-add-eq')?.addEventListener('click', () => {
          const name = prompt('Equipment Item Name:');
          if (!name) return;
          const qty = parseInt(prompt('Quantity:', '1'), 10) || 1;
          const notes = prompt('Notes / Details:') || '';

          char.equipment.push({ id: `eq_${Date.now()}`, name, qty, notes });
          this.saveStorage();
          this.renderEquipmentTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="equipment"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            char.equipment.splice(idx, 1);
            this.saveStorage();
            this.renderEquipmentTab(container, char);
          });
        });
      }
    }

    // MAGIC ITEMS & RELICS TAB
    renderMagicTab(container, char) {
      if (!Array.isArray(char.magicItems)) char.magicItems = [];

      let itemsHtml = '';
      if (char.magicItems.length === 0) {
        itemsHtml = `<div class="char-empty-msg">No magic items or relics attuned.</div>`;
      } else {
        itemsHtml = char.magicItems.map((item, index) => `
          <div class="char-item-card char-magic-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(item.name)}</strong>
                <span class="magic-rarity-badge">${escapeHtml(item.rarity || 'Uncommon')}</span>
                ${item.attuned ? '<span class="magic-attuned-badge">✓ Attuned</span>' : ''}
              </div>
              ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="magic" data-index="${index}">✕</button>` : ''}
            </div>
            ${item.charges ? `<div class="magic-charges"><strong>Charges:</strong> ${escapeHtml(item.charges)}</div>` : ''}
            <div class="magic-desc">${escapeHtml(item.description || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Magic Items & Relics</h3>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-magic">+ Add Magic Item</button>` : ''}
        </div>
        <div class="char-cards-grid">${itemsHtml}</div>
      `;

      if (this.isEditMode) {
        container.querySelector('#btn-add-magic')?.addEventListener('click', () => {
          const name = prompt('Magic Item Name:');
          if (!name) return;
          const rarity = prompt('Rarity (Common, Uncommon, Rare, Very Rare, Legendary, Artifact):', 'Rare') || 'Uncommon';
          const attuned = confirm('Is this item Attuned to your character?');
          const charges = prompt('Charges / Uses (e.g. 3 / 3 daily, Passive):', 'Passive') || '';
          const description = prompt('Item Description & Powers:') || '';

          char.magicItems.push({ id: `item_${Date.now()}`, name, rarity, attuned, charges, description });
          this.saveStorage();
          this.renderMagicTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="magic"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Remove "${char.magicItems[idx].name}"?`)) {
              char.magicItems.splice(idx, 1);
              this.saveStorage();
              this.renderMagicTab(container, char);
            }
          });
        });
      }
    }

    // FEATS & TRAITS TAB
    renderFeatsTab(container, char) {
      if (!Array.isArray(char.feats)) char.feats = [];

      let featsHtml = '';
      if (char.feats.length === 0) {
        featsHtml = `<div class="char-empty-msg">No feats or special traits recorded yet.</div>`;
      } else {
        featsHtml = char.feats.map((feat, index) => `
          <div class="char-item-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(feat.name)}</strong>
                <span class="feat-source-badge">${escapeHtml(feat.source || 'Feat')}</span>
              </div>
              ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="feat" data-index="${index}">✕</button>` : ''}
            </div>
            <div class="feat-desc">${escapeHtml(feat.description || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Feats & Special Traits</h3>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-feat">+ Add Feat</button>` : ''}
        </div>
        <div class="char-cards-grid">${featsHtml}</div>
      `;

      if (this.isEditMode) {
        container.querySelector('#btn-add-feat')?.addEventListener('click', () => {
          const name = prompt('Feat / Trait Name:');
          if (!name) return;
          const source = prompt('Source (e.g. General Feat, Racial Trait):', 'General Feat') || 'Feat';
          const description = prompt('Feat Rules & Benefits:') || '';

          char.feats.push({ id: `feat_${Date.now()}`, name, source, description });
          this.saveStorage();
          this.renderFeatsTab(container, char);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="feat"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            char.feats.splice(idx, 1);
            this.saveStorage();
            this.renderFeatsTab(container, char);
          });
        });
      }
    }

    // BACKSTORY & SESSION NOTES TAB
    renderNotesTab(container, char) {
      if (!this.isEditMode) {
        const text = char.notes ? escapeHtml(char.notes).replace(/\n/g, '<br>') : '<em>No notes recorded. Click "Edit Sheet" above to write backstory and session reminders.</em>';
        container.innerHTML = `
          <div class="char-section-head">
            <h3>Character Lore & Session Notes</h3>
          </div>
          <div class="char-notes-box char-notes-view">
            <div class="notes-rendered-text">${text}</div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="char-section-head">
            <h3>Character Lore & Session Notes</h3>
          </div>
          <div class="char-notes-box">
            <textarea id="char-notes-textarea" class="char-notes-input" placeholder="Write backstory details, campaign reminders, personal goals, and session highlights...">${escapeHtml(char.notes || '')}</textarea>
          </div>
        `;

        const area = container.querySelector('#char-notes-textarea');
        area?.addEventListener('input', (e) => {
          char.notes = e.target.value;
          this.saveStorage();
        });
      }
    }

    // 5. LEFT-SIDE ROLL TRACKER WINDOW (PERSONAL vs EVERYONE)
    renderRollTracker() {
      const feed = document.getElementById('char-rolls-feed');
      if (!feed) return;

      const char = this.getActiveCharacter();
      const allHistory = (window.DiceRoller && Array.isArray(window.DiceRoller.history)) ? window.DiceRoller.history : [];

      let rolls = [];
      if (this.rollsTab === 'personal') {
        rolls = allHistory.filter(r => {
          if (!r || !r.roller) return false;
          const rName = r.roller.toLowerCase();
          return rName === (char?.name || '').toLowerCase() || 
                 rName === (char?.player || '').toLowerCase() || 
                 rName === (localStorage.getItem('o_codex_player_name') || '').toLowerCase();
        });
      } else {
        rolls = allHistory;
      }

      if (rolls.length === 0) {
        feed.innerHTML = `
          <div class="rolls-sidebar-empty">
            <span class="empty-dice-icon">🎲</span>
            <p>${this.rollsTab === 'personal' ? `No rolls from <strong>${escapeHtml(char?.name || 'you')}</strong> yet.<br>Click any stat bonus above to roll!` : 'No rolls recorded yet.<br>Roll a d20 to start the party feed!'}</p>
          </div>
        `;
        return;
      }

      feed.innerHTML = '';
      rolls.forEach(item => {
        const card = document.createElement('div');
        card.className = `roll-log-card ${item.isCrit ? 'is-crit' : ''} ${item.isFumble ? 'is-fumble' : ''}`;
        card.innerHTML = `
          <div class="roll-log-head">
            <strong class="roll-log-roller">${escapeHtml(item.roller)}</strong>
            <span class="roll-log-time">${this.formatTime(item.timestamp)}</span>
          </div>
          <div class="roll-log-body">
            <span class="roll-log-label">${escapeHtml(item.label)}</span>
            <span class="roll-log-total">${item.total}</span>
          </div>
          ${item.isCrit ? '<div class="roll-log-tag tag-crit">✨ CRITICAL HIT (NAT 20)</div>' : ''}
          ${item.isFumble ? '<div class="roll-log-tag tag-fumble">💀 CRITICAL FUMBLE (NAT 1)</div>' : ''}
          <div class="roll-log-formula">${escapeHtml(item.formula)} ➔ ${escapeHtml(item.detailsText)}</div>
        `;
        feed.appendChild(card);
      });
    }

    formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    // CREATE NEW CHARACTER
    createNewCharacter() {
      const name = prompt('Enter Character Name:');
      if (!name) return;
      const classLevel = prompt('Class & Level (e.g. Sorcerer 4):', 'Adventurer 1') || 'Adventurer 1';

      const newChar = {
        id: `char_${Date.now()}`,
        name,
        player: localStorage.getItem('o_codex_player_name') || 'Player',
        heritage: 'Human',
        classLevel,
        level: 1,
        alignment: 'Neutral',
        vitals: {
          hpCurrent: 10, hpMax: 10, hpTemp: 0, ac: 10, initiative: 0, speed: 30, profBonus: 2, hitDice: '1d8', deathSaves: { successes: 0, failures: 0 }
        },
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, saveProfs: [] },
        attacks: [],
        divions: [],
        boons: [],
        magicItems: [],
        feats: [],
        equipment: [],
        currency: { cp: 0, sp: 0, gp: 10, pp: 0, aetherGems: 0 },
        notes: ''
      };

      this.characters.push(newChar);
      this.activeCharId = newChar.id;
      this.saveStorage();
      this.renderRosterBar();
      this.renderCurrentSheet();
    }

    // EXPORT PARTY TO JSON
    exportPartyJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.characters, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `o_codex_party_roster_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    // IMPORT PARTY FROM JSON
    importPartyJSON(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported) && imported.length > 0) {
            this.characters = imported;
            this.activeCharId = imported[0].id;
            this.saveStorage();
            this.renderRosterBar();
            this.renderCurrentSheet();
            alert(`Successfully imported ${imported.length} characters!`);
          } else {
            alert('Invalid party roster file format.');
          }
        } catch (err) {
          alert('Could not parse JSON file.');
        }
      };
      reader.readAsText(file);
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

  window.CharacterSheet = new PartyCharacterManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CharacterSheet.init());
  } else {
    window.CharacterSheet.init();
  }
})();
