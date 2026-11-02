/**
 * The O-Codex — Party Character Sheet & Roster Manager
 * Complete campaign management for players and DM:
 *  - Full Party Roster (Pre-seeded with canon characters + custom creation)
 *  - Interactive Vitals (HP steppers, Temp HP, AC, Speed, Initiative, Death Saves)
 *  - Six Core Ability Scores with one-click Check & Saving Throw rolling via DiceRoller
 *  - Weapon & Attack Actions with direct Roll Attack & Roll Damage buttons
 *  - Equipment & Armor tracker
 *  - Magic Items & Relics with attunement and charges
 *  - Feats & Traits tracker
 *  - DM Boons & Divine Blessings
 *  - Divions & Manifestations (O-Codex Canon Magic System)
 *  - Currency & Aether Gems tracker
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
      this.debounceTimer = null;

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

      // Merge remote changes
      this.characters = remoteParty;
      localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(this.characters));

      if (!this.characters.some(c => c.id === this.activeCharId) && this.characters.length > 0) {
        this.activeCharId = this.characters[0].id;
      }

      this.renderRosterBar();
      this.renderCurrentSheet();

      if (typeof window.showToast === 'function') {
        window.showToast('✨ Character Sheets synced from party cloud', 'info', 2000);
      }
    }

    getActiveCharacter() {
      return this.characters.find(c => c.id === this.activeCharId) || this.characters[0];
    }

    setActiveCharacter(id) {
      if (this.characters.some(c => c.id === id)) {
        this.activeCharId = id;
        localStorage.setItem(ACTIVE_CHAR_KEY, id);
        this.renderRosterBar();
        this.renderCurrentSheet();
      }
    }

    init() {
      this.initDOM();
      this.renderRosterBar();
      this.renderCurrentSheet();
    }

    initDOM() {
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

      // Populate Header Inputs
      const nameInput = document.getElementById('char-name-input');
      const playerInput = document.getElementById('char-player-input');
      const classInput = document.getElementById('char-class-input');
      const heritageInput = document.getElementById('char-heritage-input');
      const alignInput = document.getElementById('char-align-input');

      if (nameInput) nameInput.value = char.name || '';
      if (playerInput) playerInput.value = char.player || '';
      if (classInput) classInput.value = char.classLevel || '';
      if (heritageInput) heritageInput.value = char.heritage || '';
      if (alignInput) alignInput.value = char.alignment || '';

      this.attachHeaderListeners();

      // Render Vitals & Combat Header
      this.renderVitals(char);

      // Render Ability Scores
      this.renderAbilityScores(char);

      // Render Active Tab Content
      this.renderTabContent();
    }

    attachHeaderListeners() {
      const char = this.getActiveCharacter();
      if (!char) return;

      const bindInput = (id, prop) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.oninput = (e) => {
          char[prop] = e.target.value;
          this.saveStorage();
          if (prop === 'name') this.renderRosterBar();
        };
      };

      bindInput('char-name-input', 'name');
      bindInput('char-player-input', 'player');
      bindInput('char-class-input', 'classLevel');
      bindInput('char-heritage-input', 'heritage');
      bindInput('char-align-input', 'alignment');
    }

    renderVitals(char) {
      const vitals = char.vitals || {
        hpCurrent: 10, hpMax: 10, hpTemp: 0, ac: 10, initiative: 0, speed: 30, profBonus: 2, deathSaves: { successes: 0, failures: 0 }
      };

      // HP display & steppers
      const hpCurEl = document.getElementById('char-hp-current');
      const hpMaxEl = document.getElementById('char-hp-max');
      const hpTempEl = document.getElementById('char-hp-temp');
      const hpBarFill = document.getElementById('char-hp-bar-fill');

      if (hpCurEl) hpCurEl.value = vitals.hpCurrent;
      if (hpMaxEl) hpMaxEl.value = vitals.hpMax;
      if (hpTempEl) hpTempEl.value = vitals.hpTemp || 0;

      const hpPercent = Math.min(100, Math.max(0, (vitals.hpCurrent / (vitals.hpMax || 1)) * 100));
      if (hpBarFill) {
        hpBarFill.style.width = `${hpPercent}%`;
        hpBarFill.style.backgroundColor = hpPercent > 50 ? '#38bdf8' : (hpPercent > 25 ? '#f59e0b' : '#ef4444');
      }

      // Steppers for HP
      const setupHpBtn = (id, delta) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onclick = () => {
          vitals.hpCurrent = Math.max(0, vitals.hpCurrent + delta);
          this.saveStorage();
          this.renderVitals(char);
        };
      };
      setupHpBtn('char-hp-minus-5', -5);
      setupHpBtn('char-hp-minus-1', -1);
      setupHpBtn('char-hp-plus-1', 1);
      setupHpBtn('char-hp-plus-5', 5);

      if (hpCurEl) hpCurEl.onchange = (e) => {
        vitals.hpCurrent = parseInt(e.target.value, 10) || 0;
        this.saveStorage();
        this.renderVitals(char);
      };
      if (hpMaxEl) hpMaxEl.onchange = (e) => {
        vitals.hpMax = Math.max(1, parseInt(e.target.value, 10) || 1);
        this.saveStorage();
        this.renderVitals(char);
      };
      if (hpTempEl) hpTempEl.onchange = (e) => {
        vitals.hpTemp = parseInt(e.target.value, 10) || 0;
        this.saveStorage();
      };

      // AC, Speed, Initiative, Proficiency
      const acEl = document.getElementById('char-ac-input');
      const speedEl = document.getElementById('char-speed-input');
      const profEl = document.getElementById('char-prof-input');
      const initModEl = document.getElementById('char-init-mod');

      if (acEl) {
        acEl.value = vitals.ac;
        acEl.onchange = (e) => { vitals.ac = parseInt(e.target.value, 10) || 10; this.saveStorage(); };
      }
      if (speedEl) {
        speedEl.value = vitals.speed;
        speedEl.onchange = (e) => { vitals.speed = parseInt(e.target.value, 10) || 30; this.saveStorage(); };
      }
      if (profEl) {
        profEl.value = vitals.profBonus;
        profEl.onchange = (e) => { vitals.profBonus = parseInt(e.target.value, 10) || 2; this.saveStorage(); };
      }

      // Initiative Roll Button
      const initMod = vitals.initiative || 0;
      if (initModEl) initModEl.textContent = initMod >= 0 ? `+${initMod}` : initMod;
      const rollInitBtn = document.getElementById('char-roll-init-btn');
      if (rollInitBtn) {
        rollInitBtn.onclick = () => {
          if (window.DiceRoller) {
            window.DiceRoller.roll('1d20', 'Initiative Check', char.name, 'normal', initMod);
          }
        };
      }

      // Death Saves
      const deathSaves = vitals.deathSaves || { successes: 0, failures: 0 };
      for (let i = 1; i <= 3; i++) {
        const sBox = document.getElementById(`death-succ-${i}`);
        const fBox = document.getElementById(`death-fail-${i}`);
        if (sBox) {
          sBox.checked = deathSaves.successes >= i;
          sBox.onchange = () => {
            let count = 0;
            for (let j = 1; j <= 3; j++) {
              if (document.getElementById(`death-succ-${j}`)?.checked) count++;
            }
            deathSaves.successes = count;
            this.saveStorage();
          };
        }
        if (fBox) {
          fBox.checked = deathSaves.failures >= i;
          fBox.onchange = () => {
            let count = 0;
            for (let j = 1; j <= 3; j++) {
              if (document.getElementById(`death-fail-${j}`)?.checked) count++;
            }
            deathSaves.failures = count;
            this.saveStorage();
          };
        }
      }
    }

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
        card.className = 'char-stat-card';
        card.innerHTML = `
          <div class="stat-card-title">${abNames[ab]}</div>
          <div class="stat-card-mod">${modStr}</div>
          <div class="stat-card-base">
            <span>Score:</span>
            <input type="number" class="stat-score-input" value="${score}" min="1" max="30" data-stat="${ab}" />
          </div>
          <div class="stat-card-actions">
            <button type="button" class="stat-action-btn stat-btn-check" data-stat="${ab}" title="Roll ${fullNames[ab]} Ability Check">
              Check (${modStr})
            </button>
            <button type="button" class="stat-action-btn stat-btn-save ${isProf ? 'is-proficient' : ''}" data-stat="${ab}" title="Roll ${fullNames[ab]} Save (${saveModStr})">
              Save ${saveModStr}
            </button>
          </div>
        `;

        // Input change
        const input = card.querySelector('.stat-score-input');
        input?.addEventListener('change', (e) => {
          stats[ab] = parseInt(e.target.value, 10) || 10;
          this.saveStorage();
          this.renderAbilityScores(char);
          this.renderVitals(char);
        });

        // Click to Roll Check
        const checkBtn = card.querySelector('.stat-btn-check');
        checkBtn?.addEventListener('click', () => {
          if (window.DiceRoller) {
            window.DiceRoller.roll('1d20', `${fullNames[ab]} Check`, char.name, 'normal', mod);
          }
        });

        // Click to Roll Save
        const saveBtn = card.querySelector('.stat-btn-save');
        saveBtn?.addEventListener('click', () => {
          if (window.DiceRoller) {
            window.DiceRoller.roll('1d20', `${fullNames[ab]} Save`, char.name, 'normal', saveMod);
          }
        });

        container.appendChild(card);
      });
    }

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

    // 1. COMBAT & ATTACKS TAB
    renderCombatTab(container, char) {
      if (!Array.isArray(char.attacks)) char.attacks = [];

      let attacksHtml = '';
      if (char.attacks.length === 0) {
        attacksHtml = `<div class="char-empty-msg">No attacks or weapons registered. Click "Add Attack" below!</div>`;
      } else {
        attacksHtml = char.attacks.map((atk, index) => `
          <div class="char-item-card char-atk-card" data-index="${index}">
            <div class="item-card-header">
              <strong class="item-card-title">${escapeHtml(atk.name)}</strong>
              <div class="item-card-controls">
                <button type="button" class="char-item-del-btn" data-type="attack" data-index="${index}" title="Remove Attack">✕</button>
              </div>
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
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-attack">+ Add Attack / Weapon</button>
        </div>
        <div class="char-cards-grid">${attacksHtml}</div>
      `;

      // Handlers
      container.querySelector('#btn-add-attack')?.addEventListener('click', () => {
        const name = prompt('Weapon / Attack Name (e.g., Shortsword, Fire Bolt):');
        if (!name) return;
        const bonus = parseInt(prompt('Attack Bonus (e.g. 5 for +5):', '5'), 10) || 0;
        const damageFormula = prompt('Damage Formula (e.g., 1d8+3, 2d6):', '1d8+3') || '1d8';
        const damageType = prompt('Damage Type (e.g., Slashing, Radiant):', 'Slashing') || '';
        const notes = prompt('Additional Notes / Properties (optional):', '') || '';

        char.attacks.push({
          id: `atk_${Date.now()}`,
          name,
          bonus,
          damageFormula,
          damageType,
          notes
        });
        this.saveStorage();
        this.renderCombatTab(container, char);
      });

      container.querySelectorAll('.char-item-del-btn[data-type="attack"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.dataset.index, 10);
          if (confirm(`Remove "${char.attacks[idx].name}"?`)) {
            char.attacks.splice(idx, 1);
            this.saveStorage();
            this.renderCombatTab(container, char);
          }
        });
      });

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

    // 2. DIVIONS & MANIFESTS TAB (The O-Codex Canon Magic)
    renderDivionsTab(container, char) {
      if (!Array.isArray(char.divions)) char.divions = [];

      let divionsHtml = '';
      if (char.divions.length === 0) {
        divionsHtml = `<div class="char-empty-msg">No Divions recorded. Register your manifests, domain resonance, or Flow arts below!</div>`;
      } else {
        divionsHtml = char.divions.map((div, index) => `
          <div class="char-item-card char-divion-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(div.name)}</strong>
                <span class="divion-badge-type">${escapeHtml(div.type || 'Manifest')}</span>
                <span class="divion-badge-rank">${escapeHtml(div.rank || 'Tier I')}</span>
              </div>
              <button type="button" class="char-item-del-btn" data-type="divion" data-index="${index}" title="Remove Divion">✕</button>
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
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-divion">+ Add Divion</button>
        </div>
        <div class="char-cards-grid">${divionsHtml}</div>
      `;

      container.querySelector('#btn-add-divion')?.addEventListener('click', () => {
        const name = prompt('Divion / Manifest Name:');
        if (!name) return;
        const type = prompt('Domain / School (e.g., Illusion, Light, Kinetic, Primal):', 'Domain Manifest') || '';
        const rank = prompt('Tier / Rank (e.g., Tier I, Tier II, Master):', 'Tier I') || '';
        const cost = prompt('Flow / Aether Cost (e.g., 1 Flow, 2 Shards):', '1 Flow') || '';
        const manifestEffect = prompt('Manifestation Effect & Lore:') || '';

        char.divions.push({
          id: `div_${Date.now()}`,
          name,
          type,
          rank,
          cost,
          manifestEffect
        });
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

    // 3. DM BOONS & BLESSINGS TAB
    renderBoonsTab(container, char) {
      if (!Array.isArray(char.boons)) char.boons = [];

      let boonsHtml = '';
      if (char.boons.length === 0) {
        boonsHtml = `<div class="char-empty-msg">No DM boons or divine blessings recorded yet. When the DM awards a boon, write it here!</div>`;
      } else {
        boonsHtml = char.boons.map((boon, index) => `
          <div class="char-item-card char-boon-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(boon.name)}</strong>
                <span class="boon-granted-by">Granted by: <em>${escapeHtml(boon.grantedBy || 'Dungeon Master')}</em></span>
              </div>
              <button type="button" class="char-item-del-btn" data-type="boon" data-index="${index}" title="Remove Boon">✕</button>
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
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-boon">+ Add Boon / Blessing</button>
        </div>
        <div class="char-cards-grid">${boonsHtml}</div>
      `;

      container.querySelector('#btn-add-boon')?.addEventListener('click', () => {
        const name = prompt('Boon / Blessing Title (e.g. Azzie\'s Calming Aegis):');
        if (!name) return;
        const grantedBy = prompt('Granted By / Origin (e.g., Azzie, The High Sovereign, Ancient Entity):', 'Dungeon Master') || 'Dungeon Master';
        const effect = prompt('Boon Effect / Power details:') || '';

        char.boons.push({
          id: `boon_${Date.now()}`,
          name,
          grantedBy,
          effect
        });
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

    // 4. EQUIPMENT & CURRENCY TAB
    renderEquipmentTab(container, char) {
      if (!Array.isArray(char.equipment)) char.equipment = [];
      const cur = char.currency || { cp: 0, sp: 0, gp: 0, pp: 0, aetherGems: 0 };

      let eqHtml = '';
      if (char.equipment.length === 0) {
        eqHtml = `<div class="char-empty-msg">No equipment items recorded. Keep track of packs, armor, kits and provisions!</div>`;
      } else {
        eqHtml = char.equipment.map((eq, index) => `
          <div class="char-eq-row">
            <span class="eq-qty">x${eq.qty || 1}</span>
            <span class="eq-name">${escapeHtml(eq.name)}</span>
            <span class="eq-notes">${escapeHtml(eq.notes || '')}</span>
            <button type="button" class="char-item-del-btn" data-type="equipment" data-index="${index}">✕</button>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Equipment & Inventory</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-eq">+ Add Equipment</button>
        </div>

        <div class="char-currency-panel">
          <div class="currency-group">
            <label>Copper (CP)</label>
            <input type="number" id="cur-cp" value="${cur.cp || 0}" min="0" />
          </div>
          <div class="currency-group">
            <label>Silver (SP)</label>
            <input type="number" id="cur-sp" value="${cur.sp || 0}" min="0" />
          </div>
          <div class="currency-group">
            <label>Gold (GP)</label>
            <input type="number" id="cur-gp" value="${cur.gp || 0}" min="0" />
          </div>
          <div class="currency-group">
            <label>Platinum (PP)</label>
            <input type="number" id="cur-pp" value="${cur.pp || 0}" min="0" />
          </div>
          <div class="currency-group currency-special">
            <label>💎 Aether Gems</label>
            <input type="number" id="cur-gems" value="${cur.aetherGems || 0}" min="0" />
          </div>
        </div>

        <div class="char-eq-list">${eqHtml}</div>
      `;

      // Bind currency
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

        char.equipment.push({
          id: `eq_${Date.now()}`,
          name,
          qty,
          notes
        });
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

    // 5. MAGIC ITEMS & RELICS TAB
    renderMagicTab(container, char) {
      if (!Array.isArray(char.magicItems)) char.magicItems = [];

      let itemsHtml = '';
      if (char.magicItems.length === 0) {
        itemsHtml = `<div class="char-empty-msg">No magic items or relics attuned. Add rare grimoires, aetherial amulets, and relics below!</div>`;
      } else {
        itemsHtml = char.magicItems.map((item, index) => `
          <div class="char-item-card char-magic-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title">${escapeHtml(item.name)}</strong>
                <span class="magic-rarity-badge">${escapeHtml(item.rarity || 'Uncommon')}</span>
                ${item.attuned ? '<span class="magic-attuned-badge">✓ Attuned</span>' : ''}
              </div>
              <button type="button" class="char-item-del-btn" data-type="magic" data-index="${index}">✕</button>
            </div>
            ${item.charges ? `<div class="magic-charges"><strong>Charges:</strong> ${escapeHtml(item.charges)}</div>` : ''}
            <div class="magic-desc">${escapeHtml(item.description || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Magic Items & Relics</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-magic">+ Add Magic Item</button>
        </div>
        <div class="char-cards-grid">${itemsHtml}</div>
      `;

      container.querySelector('#btn-add-magic')?.addEventListener('click', () => {
        const name = prompt('Magic Item Name:');
        if (!name) return;
        const rarity = prompt('Rarity (Common, Uncommon, Rare, Very Rare, Legendary, Artifact):', 'Rare') || 'Uncommon';
        const attuned = confirm('Is this item Attuned to your character?');
        const charges = prompt('Charges / Uses (e.g. 3 / 3 daily, Passive):', 'Passive') || '';
        const description = prompt('Item Description & Powers:') || '';

        char.magicItems.push({
          id: `item_${Date.now()}`,
          name,
          rarity,
          attuned,
          charges,
          description
        });
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

    // 6. FEATS & TRAITS TAB
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
              <button type="button" class="char-item-del-btn" data-type="feat" data-index="${index}">✕</button>
            </div>
            <div class="feat-desc">${escapeHtml(feat.description || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Feats & Special Traits</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-feat">+ Add Feat</button>
        </div>
        <div class="char-cards-grid">${featsHtml}</div>
      `;

      container.querySelector('#btn-add-feat')?.addEventListener('click', () => {
        const name = prompt('Feat / Trait Name:');
        if (!name) return;
        const source = prompt('Source (e.g., General Feat, Racial Trait, Class):', 'General Feat') || 'Feat';
        const description = prompt('Feat Rules & Benefits:') || '';

        char.feats.push({
          id: `feat_${Date.now()}`,
          name,
          source,
          description
        });
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

    // 7. BACKSTORY & SESSION NOTES TAB
    renderNotesTab(container, char) {
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
          hpCurrent: 10,
          hpMax: 10,
          hpTemp: 0,
          ac: 10,
          initiative: 0,
          speed: 30,
          profBonus: 2,
          hitDice: '1d8',
          deathSaves: { successes: 0, failures: 0 }
        },
        stats: {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10,
          saveProfs: []
        },
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
