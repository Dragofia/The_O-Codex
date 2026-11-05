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
  const ROSTER_VERSION_KEY = 'o_codex_roster_version';
  const CURRENT_ROSTER_VERSION = 'v2_canon_sheets';

  // Campaign Currency Configuration Framework (visible: false hides from UI while keeping framework & data intact)
  const CURRENCY_REGISTRY = [
    { key: 'cp', label: 'CP', name: 'Copper', color: '#d97706', visible: true },
    { key: 'sp', label: 'SP', name: 'Silver', color: '#cbd5e1', visible: true },
    { key: 'gp', label: 'GP', name: 'Gold', color: '#eab308', visible: true },
    { key: 'pp', label: 'PP', name: 'Platinum', color: '#38bdf8', visible: false },
    { key: 'aetherGems', label: '💎 Aether', name: 'Aether Gems', color: '#a855f7', visible: false }
  ];

  // Canon party default roster for zero-setup start
  const DEFAULT_ROSTER = [
    {
      id: 'char_valorie',
      name: 'Valorie Whispthorn',
      player: 'Dawn',
      heritage: 'Variant Human',
      classLevel: 'Artificer 1 / Wizard 5 (Chronurgist)',
      level: 6,
      alignment: 'Chaotic Good',
      vitals: {
        hpCurrent: 48,
        hpMax: 48,
        hpTemp: 0,
        ac: 19,
        initiative: 6,
        speed: 30,
        profBonus: 3,
        hitDice: '1d8, 5d6',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 10,
        dex: 14,
        con: 16,
        int: 18,
        wis: 12,
        cha: 10,
        saveProfs: ['con', 'int']
      },
      attacks: [
        {
          id: 'atk_v1',
          name: 'Dagger',
          bonus: 5,
          damageFormula: '1d4+2',
          damageType: 'Piercing',
          notes: 'Finesse, Light, Thrown (range 20/60)'
        },
        {
          id: 'atk_v2',
          name: 'Mind Sliver (Cantrip)',
          bonus: 7,
          damageFormula: '1d6',
          damageType: 'Psychic',
          notes: 'Range 60ft; INT Save DC 15 or take 1d6 psychic damage and subtract 1d4 from next saving throw before end of next turn'
        },
        {
          id: 'atk_v3',
          name: 'Shadow Blade (Staff)',
          bonus: 7,
          damageFormula: '2d8+2',
          damageType: 'Psychic',
          notes: 'Cast via Staff of Better Illusion (3 charges). Finesse, Light, Thrown (20/60). Advantage in dim light/darkness'
        },
        {
          id: 'atk_v4',
          name: 'Magic Missile (1st Level)',
          bonus: 0,
          damageFormula: '3x(1d4+1)',
          damageType: 'Force',
          notes: 'Range 120ft; automatically creates 3 darts that hit unerringly'
        }
      ],
      divions: [],
      boons: [],
      magicItems: [
        {
          id: 'item_v1',
          name: 'Staff of Better Illusion',
          rarity: 'Rare',
          attuned: true,
          charges: '4 / 4',
          description: 'Regains 2d2 charges daily at dawn. Spells:\n• Silent Image (1 charge)\n• Disguise Self (2 charges)\n• Distort Value (2 charges)\n• Shadow Blade (3 charges)'
        },
        {
          id: 'item_v2',
          name: 'Scale Mail +1',
          rarity: 'Rare',
          attuned: false,
          charges: 'Passive',
          description: 'AC 15 + DEX (max 2) + 1 magic bonus = 17. Combined with Shield (+2 AC) = AC 19 total.'
        }
      ],
      feats: [
        {
          id: 'feat_v1',
          name: 'Eldritch Adept: Eldritch Mind',
          source: 'Feat (Variant Human)',
          description: 'You have advantage on Constitution saving throws that you make to maintain concentration on a spell.'
        },
        {
          id: 'feat_v2',
          name: 'Temporal Awareness',
          source: 'Chronurgy Wizard (Lv 2)',
          description: 'You can add your Intelligence modifier (+4) to your initiative rolls, giving an Initiative of +6.'
        },
        {
          id: 'feat_v3',
          name: 'Chronal Shift',
          source: 'Chronurgy Wizard (Lv 2)',
          description: '2 uses per long rest. As a reaction when you or a creature you can see within 30ft makes an attack roll, ability check, or saving throw, force the creature to reroll and use the second result.'
        },
        {
          id: 'feat_v4',
          name: 'Arcane Recovery',
          source: 'Wizard Class Feature',
          description: 'Once per day when you finish a short rest, recover expended spell slots with a combined level up to 3 (half wizard level rounded up).'
        },
        {
          id: 'feat_v5',
          name: 'Magical Tinkering',
          source: 'Artificer (Lv 1)',
          description: 'Touch a Tiny nonmagical object to invest a spark of magic (up to 4 objects): shed 5ft light, emit 6-second recorded message, emit odor/sound, or show static visual effect.'
        },
        {
          id: 'feat_v6',
          name: 'Spellbook & Prepared Spells',
          source: 'Artificer 1 / Wizard 5 (DC 15, +7 Atk)',
          description: 'Cantrips: Guidance, Mold Earth, Minor Illusion, Prestidigitation, Message, Mind Sliver.\n1st Level (4 slots): Silent Image (At Will), Absorb Elements, Faerie Fire, Cure Wounds, Sanctuary, Shield, Feather Fall, Magic Missile, Tasha\'s Hideous Laughter, Magnify Gravity, Find Familiar, Comprehend Languages, Identify.\n2nd Level (3 slots): Suggestion, Invisibility, Web, Vortex Warp.\n3rd Level (2 slots): Haste, Counterspell, Hypnotic Pattern, Leomund\'s Tiny Hut.'
        },
        {
          id: 'feat_v7',
          name: 'Proficiencies & Languages',
          source: 'Class & Background',
          description: 'Armor: Light Armor, Medium Armor, Shields.\nWeapons: Simple Weapons, Crossbows, Daggers, Darts, Slings, Quarterstaffs.\nTools: Thieves\' Tools, Tinkerer\'s Tools, Alchemist\'s Supplies, Playing Card Set, Piano.\nLanguages: Common, Celestial.\nPassive Perception: 14.'
        }
      ],
      equipment: [
        { id: 'eq_v1', name: 'Scale Mail +1', qty: 1, notes: 'Magical medium armor' },
        { id: 'eq_v2', name: 'Spellbook (Shield)', qty: 1, notes: 'Shield doubles as arcane spellbook focus' },
        { id: 'eq_v3', name: 'Dagger', qty: 1, notes: 'Simple melee / finesse' },
        { id: 'eq_v4', name: 'Thieves\' Tools', qty: 1, notes: 'Lockpicks, file, pliers' },
        { id: 'eq_v5', name: 'Crowbar', qty: 1, notes: 'Advantage on Strength checks to pry open' },
        { id: 'eq_v6', name: 'Dungeoneer\'s Pack', qty: 1, notes: 'Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope' },
        { id: 'eq_v7', name: 'Casual Dress', qty: 1, notes: 'Daywear' },
        { id: 'eq_v8', name: 'Winter Clothes', qty: 1, notes: '-1 Cold damage taken' },
        { id: 'eq_v9', name: 'Black Shard', qty: 1, notes: 'A mysterious key for something' }
      ],
      currency: { cp: 0, sp: 2, gp: 45, pp: 0, aetherGems: 0 },
      notes: `AGE: 18 | HEIGHT: 5'5" | WEIGHT: 105 lbs | EYES: Faded Blue | SKIN: White | HAIR: Dark Brown

PERSONALITY TRAITS:
"I get bored easily and tend to start trouble just to keep things interesting."

IDEALS:
"Kindness. Even if I tease people, I'll always step in when someone truly needs help. (Good)"

BONDS:
"Magic is my way of understanding the world—it's the one constant I can rely on when everything else changes."

FLAWS:
"I have a hard time taking responsibility for my mistakes, blaming others or 'bad luck' instead."

GOOGLE DOC BACKSTORY:
https://docs.google.com/document/d/1mbFLHEUX9IQnIFy87m29QfroVF_t2S2w8-dA7Feqwow/edit?usp=sharing

ALLIES & REMINDERS:
• Bones (Max)
• Thalexus (lich)
• Aquiel Alden
• Cassius
• Marea
• Astie
• Azzie (human)
• Hendrickson (Palace Guard)
• Rennek (Guide)
• Marrows (informants)
• Tornga (Half orc)
• Onera
• Clarissa Faehand, Kaleb Faehand, Castro Faehand
• Lottette (spider familiar)
• Johnson (Fog Leviathan)
• Tesara
• hhgrevis
• Eris
• Swimmer (5:00 left)`
    },
    {
      id: 'char_bones',
      name: 'Garron Forworth (Bones)',
      player: 'Max',
      heritage: 'Human Reborn',
      classLevel: 'Oath of the Watchers Paladin 6',
      level: 6,
      alignment: 'Chaotic Neutral',
      vitals: {
        hpCurrent: 51,
        hpMax: 51,
        hpTemp: 0,
        ac: 18,
        initiative: 0,
        speed: 30,
        profBonus: 3,
        hitDice: '6d10',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 16,
        dex: 11,
        con: 15,
        int: 8,
        wis: 13,
        cha: 16,
        saveProfs: ['wis', 'cha']
      },
      attacks: [
        {
          id: 'atk_b1',
          name: 'Longsword',
          bonus: 6,
          damageFormula: '1d8+3',
          damageType: 'Slashing',
          notes: 'Versatile (1d10+3). Extra Attack: can attack twice per Attack action.'
        },
        {
          id: 'atk_b2',
          name: 'Divine Smite',
          bonus: 0,
          damageFormula: '+2d8',
          damageType: 'Radiant',
          notes: 'Expend 1st-level slot on melee hit (+1d8 per higher slot level, max 5d8; +1d8 extra vs fiends/undead)'
        },
        {
          id: 'atk_b3',
          name: 'Javelin (x4)',
          bonus: 6,
          damageFormula: '1d6+3',
          damageType: 'Piercing',
          notes: 'Thrown range 30/120ft'
        },
        {
          id: 'atk_b4',
          name: 'Interception Fighting Style',
          bonus: 0,
          damageFormula: '1d10+3',
          damageType: 'Damage Reduction',
          notes: 'Reaction: When a creature within 5ft is hit by an attack, reduce damage by 1d10 + prof (+3)'
        },
        {
          id: 'atk_b5',
          name: 'Lay on Hands',
          bonus: 0,
          damageFormula: 'Pool 30 HP',
          damageType: 'Healing',
          notes: 'Touch to restore HP from pool of 30, or expend 5 HP to cure disease/poison'
        }
      ],
      divions: [],
      boons: [],
      magicItems: [
        {
          id: 'item_b1',
          name: 'Potion of Stoneskin',
          rarity: 'Rare',
          attuned: false,
          charges: '1 use',
          description: 'Grants resistance to nonmagical bludgeoning, piercing, and slashing damage for up to 1 hour (requires concentration).'
        },
        {
          id: 'item_b2',
          name: 'Potion of Healing',
          rarity: 'Common',
          attuned: false,
          charges: '1 use',
          description: 'Restores 2d4+2 hit points when consumed as an action.'
        },
        {
          id: 'item_b3',
          name: 'Tiny Potion of Healing',
          rarity: 'Common',
          attuned: false,
          charges: '1 use',
          description: 'Small pocket vial; restores 2d4+2 hit points when consumed.'
        }
      ],
      feats: [
        {
          id: 'feat_b1',
          name: 'Aura of Protection',
          source: 'Paladin Level 6 Feature',
          description: 'Whenever you or a friendly creature within 10 feet must make a saving throw, gain a +3 bonus (your Charisma modifier) to that saving throw.'
        },
        {
          id: 'feat_b2',
          name: 'Shield Master',
          source: 'Feat',
          description: '• If you take the Attack action, use a bonus action to shove a creature within 5ft.\n• Add +2 shield AC bonus to DEX saves against effects targeting only you.\n• Reaction: take 0 damage instead of half on successful DEX saving throw against area effects.'
        },
        {
          id: 'feat_b3',
          name: 'Channel Divinity (1/short or long rest)',
          source: 'Oath of the Watchers',
          description: '• Watcher\'s Will: As an action, choose up to 3 creatures within 30ft. For 1 minute, targets gain advantage on Int, Wis, and Cha saving throws.\n• Abjure the Extraplanar: Turn aberrations, celestials, elementals, fey, or fiends within 30ft that fail a DC 14 Wisdom save.'
        },
        {
          id: 'feat_b4',
          name: 'Deathless Nature',
          source: 'Reborn Racial Feature',
          description: '• Advantage on saves vs disease, poison, and death saving throws.\n• Resistance to poison damage.\n• Do not need to eat, drink, or breathe.\n• Don\'t need to sleep; 4 hours of motionless resting counts as a long rest.'
        },
        {
          id: 'feat_b5',
          name: 'Knowledge from a Past Life',
          source: 'Reborn Racial Feature',
          description: 'When you make an ability check that uses a skill, roll a d6 and add the number to the d20 roll (usable after seeing the d20 roll, 3 times per long rest).'
        },
        {
          id: 'feat_b6',
          name: 'Divine Sense & Divine Health',
          source: 'Paladin Features',
          description: '• Divine Sense (3/day): detect celestial, fiend, or undead within 60ft.\n• Divine Health: immune to disease.'
        },
        {
          id: 'feat_b7',
          name: 'Paladin Spells Prepared (DC 14, +6 Atk)',
          source: 'Watchers Spellcasting (Slot Pool: 4x 1st, 2x 2nd)',
          description: '1st Level (4 slots): Ceremony, Searing Smite, Shield of Faith, Command, Alarm, Detect Magic.\n2nd Level (2 slots): Lesser Restoration, Branding Smite, Moonbeam.'
        },
        {
          id: 'feat_b8',
          name: 'Proficiencies & Languages',
          source: 'Paladin Proficiencies',
          description: 'Armor: All armor, shields.\nWeapons: Simple weapons, martial weapons.\nLanguages: Common, Celestial, Deep Speech.\nPassive Perception: 12.'
        }
      ],
      equipment: [
        { id: 'eq_b1', name: 'Longsword', qty: 1, notes: 'Versatile martial weapon (1d8/1d10)' },
        { id: 'eq_b2', name: 'Shield', qty: 1, notes: '+2 AC' },
        { id: 'eq_b3', name: 'Chain Mail', qty: 1, notes: 'AC 16, disadvantage on stealth' },
        { id: 'eq_b4', name: 'Holy Symbol', qty: 1, notes: 'Paladin spellcasting focus' },
        { id: 'eq_b5', name: 'Javelins', qty: 4, notes: 'Thrown weapons (range 30/120)' },
        { id: 'eq_b6', name: 'Priest\'s Pack', qty: 1, notes: 'Backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks incense, censer, vestments, 2 days rations, waterskin' }
      ],
      currency: { cp: 0, sp: 6, gp: 7, pp: 0, aetherGems: 0 },
      notes: `AGE: 44 (when killed) [244] | HEIGHT: 6'3" | WEIGHT: 180 lbs | EYES: Grey | SKIN: Pale | HAIR: Grey

PERSONALITY TRAITS:
"Extremely Stubborn"

IDEALS:
"Deception is a weapon. Strike from where your foes won't expect. (Chaotic)"

BONDS:
"Valorie (Doesn't remember)"

FLAWS:
"I see morality entirely in black and white."

BACKSTORY & DEATH NOTE:
"He was impaled by his longsword and that's how he seemingly died."`
    },
    {
      id: 'char_thiollier',
      name: 'Thiollier Thornsong',
      player: 'William',
      heritage: 'Half-Elf',
      classLevel: 'Paladin 2 / Druid 4 (Circle of Wildfire)',
      level: 6,
      alignment: 'Lawful Neutral',
      vitals: {
        hpCurrent: 29,
        hpMax: 34,
        hpTemp: 0,
        ac: 16,
        initiative: -1,
        speed: 30,
        profBonus: 3,
        hitDice: '2d10 + 4d8',
        deathSaves: { successes: 0, failures: 0 }
      },
      stats: {
        str: 14,
        dex: 9,
        con: 10,
        int: 9,
        wis: 16,
        cha: 14,
        saveProfs: ['wis', 'cha']
      },
      attacks: [
        {
          id: 'atk_t1',
          name: 'Warhammer',
          bonus: 5,
          damageFormula: '1d8+2',
          damageType: 'Bludgeoning',
          notes: 'Versatile (1d10+2 two-handed)'
        },
        {
          id: 'atk_t2',
          name: 'Sacred Flame (Cantrip)',
          bonus: 6,
          damageFormula: '1d8',
          damageType: 'Radiant',
          notes: 'Range 60ft, DC 14 DEX save or 1d8 radiant; ignores cover'
        },
        {
          id: 'atk_t3',
          name: 'Divine Smite',
          bonus: 0,
          damageFormula: '+2d8',
          damageType: 'Radiant',
          notes: 'Expend spell slot on melee hit (+1d8 per higher slot level, +1d8 vs fiends/undead)'
        },
        {
          id: 'atk_t4',
          name: 'Longbow',
          bonus: 2,
          damageFormula: '1d8-1',
          damageType: 'Piercing',
          notes: 'Range 150/600ft, two-handed, heavy'
        },
        {
          id: 'atk_t5',
          name: 'Hand Crossbow',
          bonus: 2,
          damageFormula: '1d6-1',
          damageType: 'Piercing',
          notes: 'Range 30/120ft, light, loading'
        },
        {
          id: 'atk_t6',
          name: 'Produce Flame (Cantrip)',
          bonus: 6,
          damageFormula: '1d8',
          damageType: 'Fire',
          notes: '10ft light; hurled 30ft as ranged spell attack'
        }
      ],
      divions: [],
      boons: [],
      magicItems: [
        {
          id: 'item_t1',
          name: 'Elderwood Bracelet',
          rarity: 'Uncommon',
          attuned: true,
          charges: 'Focus',
          description: 'Carved from the sacred Elderwood tree in Il-Fiore. Serves as both Druidic Focus and Paladin Holy Symbol.'
        }
      ],
      feats: [
        {
          id: 'feat_t1',
          name: 'Summon Wildfire Spirit',
          source: 'Circle of Wildfire Feature',
          description: 'Expend one Wild Shape use to summon a spirit of wildfire (lasts 1 hour, 15 HP, 30ft fly speed). On summon, each creature within 10ft must make DC 14 Dex save or take 2d6 fire damage. Spirit can use Flame Seed (+6 atk, 1d6+3 fire) or Fiery Teleportation (15ft teleport for spirit and willing allies within 5ft, dealing 1d6+3 fire to enemies adjacent to origin).'
        },
        {
          id: 'feat_t2',
          name: 'Wild Shape (2/short rest)',
          source: 'Druid Level 2 Feature',
          description: 'Transform into a beast of CR 1/2 or lower without a flying speed for up to 2 hours.'
        },
        {
          id: 'feat_t3',
          name: 'Blessed Warrior',
          source: 'Paladin Fighting Style',
          description: 'Learned Sacred Flame and Hand of Radiance cantrips from the Cleric spell list (Charisma based).'
        },
        {
          id: 'feat_t4',
          name: 'Divine Sense & Lay on Hands',
          source: 'Paladin Level 1-2 Features',
          description: '• Divine Sense (3 uses/long rest): detect celestials, fiends, and undead within 60ft.\n• Lay on Hands: Pool of 10 HP to restore hit points or cure diseases/poisons (5 HP each).'
        },
        {
          id: 'feat_t5',
          name: 'Fey Ancestry & Darkvision',
          source: 'Half-Elf Racial Features',
          description: '• Advantage on saving throws against being charmed; magic cannot put you to sleep.\n• Darkvision 60ft.\n• High Elf Cantrip: Mending.'
        },
        {
          id: 'feat_t6',
          name: 'Heart of Darkness',
          source: 'Haunted One Background Feature',
          description: 'Commoners recognize that you face horrific evil and will extend shelter, hospitality, and assistance to you and your allies.'
        },
        {
          id: 'feat_t7',
          name: 'Spells Prepared (DC 14, +6 Atk)',
          source: 'Paladin 2 / Druid 4 (Slots: 4x 1st, 3x 2nd, 2x 3rd)',
          description: 'Cantrips: Mending, Sacred Flame, Spare the Dying, Produce Flame, Control Flames.\n1st Level (4 slots): Thunderous Smite, Command, Detect Magic, Ceremony, Shield of Faith, Charm Person, Goodberry, Speak with Animals, Cure Wounds, Burning Hands.\n2nd Level (3 slots): Flame Blade, Enhance Ability, Air Bubble, Pass Without Trace.\n3rd Level (2 slots): Dispel Magic, Plant Growth, Revivify.'
        },
        {
          id: 'feat_t8',
          name: 'Proficiencies & Languages',
          source: 'Proficiencies & Languages',
          description: 'Armor: All armor, shields.\nWeapons: Simple weapons, martial weapons.\nTools: Herbalism Kit.\nLanguages: Common, Sylvan, Seraphian, Stygian.\nPassive Perception: 13.'
        }
      ],
      equipment: [
        { id: 'eq_t1', name: 'Ringmail', qty: 1, notes: 'AC 14, disadvantage on stealth' },
        { id: 'eq_t2', name: 'Shield', qty: 1, notes: '+2 AC' },
        { id: 'eq_t3', name: 'Warhammer', qty: 1, notes: 'Versatile martial weapon (1d8/1d10)' },
        { id: 'eq_t4', name: 'Longbow', qty: 1, notes: 'Ranged weapon (150/600)' },
        { id: 'eq_t5', name: 'Hand Crossbow', qty: 1, notes: 'Light ranged weapon (30/120)' },
        { id: 'eq_t6', name: 'Elderwood Bracelet', qty: 1, notes: 'Druidic focus / holy symbol' },
        { id: 'eq_t7', name: 'Explorer\'s Pack', qty: 1, notes: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope' },
        { id: 'eq_t8', name: 'Monster Hunter\'s Pack', qty: 1, notes: 'Chest, crowbar, hammer, 3 wooden stakes, holy symbol, holy water, manacles, steel mirror, oil flask, tinderbox, 3 torches' }
      ],
      currency: { cp: 0, sp: 5, gp: 6, pp: 0, aetherGems: 0 },
      notes: `AGE: 21 | HEIGHT: 6'0" | WEIGHT: 180 lbs | EYES: Gold | SKIN: Pale yellow | HAIR: Gold

PERSONALITY TRAITS:
"I like to read and memorize poetry. It keeps me calm and brings me fleeting moments of happiness."

IDEALS:
"Logic. I like to know my enemy's capabilities and weaknesses before rushing into battle. (Lawful)"

BONDS:
"There's evil in me, I can feel it. It must never be set free."

FLAWS:
"I feel no compassion for the dead. They're the lucky ones."

ORGANIZATIONS / ALLIES:
Lurreko

BACKSTORY:
Parents were important people - son of noble family Thornsong, kidnapped when adolescent. Poetry book.
Il-Fiore, the capital of Dynestea. My family had a spiritual role, and took care of a massive tree, the Elderwood, in the capital's center. In Dynestea, people worshiped nature, I was supposed to become the tree's caretaker - but this was ruined bc ya boi got kidnapped. The people waited for me to come back. Lived five years without using Thaumic magic, since Hag hated it. Hag's name is Grettle. FUCKING DIABLO?! See discord for worship of previous god.`
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
      this.bc = null;

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.bc = new BroadcastChannel('o_codex_party_channel');
          this.bc.onmessage = (event) => {
            if (event && event.data && event.data.type === 'PARTY_UPDATE' && Array.isArray(event.data.party)) {
              this.onRemoteCharacters(event.data.party, false);
            }
          };
        } catch (e) {}
      }

      this.loadStorage();
    }

    loadStorage() {
      try {
        const rosterVersion = localStorage.getItem(ROSTER_VERSION_KEY);
        if (rosterVersion !== CURRENT_ROSTER_VERSION) {
          // Fresh migration to canon sheets: replace old dummy roster
          this.characters = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
          this.activeCharId = 'char_valorie';
          localStorage.setItem(ROSTER_VERSION_KEY, CURRENT_ROSTER_VERSION);
          this.saveStorage(false);
          return;
        }

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

      if (this.bc && broadcast) {
        try {
          this.bc.postMessage({ type: 'PARTY_UPDATE', party: this.characters });
        } catch (e) {}
      }

      if (broadcast && window.CampaignCloudSync && typeof window.CampaignCloudSync.pushCharacters === 'function') {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          window.CampaignCloudSync.pushCharacters(this.characters);
        }, 600);
      }
    }

    hasPendingLocalChanges() {
      return Boolean(this.debounceTimer);
    }

    onRemoteCharacters(remoteParty, broadcast = false) {
      if (!Array.isArray(remoteParty) || remoteParty.length === 0) return;

      if (this.debounceTimer) {
        console.warn('[CharacterSheet] Ignoring remote characters update due to pending local modifications.');
        return;
      }

      if (JSON.stringify(remoteParty) === JSON.stringify(this.characters)) {
        return;
      }

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

    playHealthSound(delta) {
      this.playHpSound(typeof delta === 'number' ? delta : (delta ? 1 : -1));
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
        document.getElementById('rolls-tab-everyone')?.classList.remove('has-unread');
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

      if (!char.vitals) char.vitals = {};
      const vitals = char.vitals;
      if (!vitals.deathSaves) vitals.deathSaves = { successes: 0, failures: 0 };
      if (typeof vitals.deathSaves.successes !== 'number') vitals.deathSaves.successes = 0;
      if (typeof vitals.deathSaves.failures !== 'number') vitals.deathSaves.failures = 0;

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
            const deathSaves = vitals.deathSaves;
            if (result.total >= 10) {
              if (result.isCrit) {
                // Natural 20: Regain 1 HP and stabilize
                vitals.hpCurrent = Math.max(1, (vitals.hpCurrent || 0) + 1);
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
      const deathSaves = vitals.deathSaves;
      for (let i = 1; i <= 3; i++) {
        container.querySelector(`#death-succ-${i}`)?.addEventListener('click', (e) => {
          const isChecked = e.target.checked;
          deathSaves.successes = isChecked ? i : i - 1;
          for (let j = 1; j <= 3; j++) {
            const cb = container.querySelector(`#death-succ-${j}`);
            if (cb) cb.checked = j <= deathSaves.successes;
          }
          this.playHpSound(isChecked ? 1 : -1);
          this.saveStorage();
        });
        container.querySelector(`#death-fail-${i}`)?.addEventListener('click', (e) => {
          const isChecked = e.target.checked;
          deathSaves.failures = isChecked ? i : i - 1;
          for (let j = 1; j <= 3; j++) {
            const cb = container.querySelector(`#death-fail-${j}`);
            if (cb) cb.checked = j <= deathSaves.failures;
          }
          this.playHpSound(isChecked ? -1 : 1);
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

      // Framework for all campaign currencies (visible: false hides PP and Aether from UI while keeping framework & data intact)
      const visibleCurrencies = CURRENCY_REGISTRY.filter(c => c.visible);
      const currencyCardsHtml = visibleCurrencies.map(c => `
        <div class="currency-group" data-coin="${c.key}">
          <div class="currency-header-row">
            <span class="currency-badge currency-badge--${c.key}">${c.label}</span>
            <span class="currency-coin-name">${c.name}</span>
          </div>
          <div class="currency-stepper-row">
            <button type="button" class="cur-tick-btn cur-tick-down-5" data-coin="${c.key}" data-delta="-5" title="Subtract 5 ${c.label}">-5</button>
            <button type="button" class="cur-tick-btn cur-tick-down-1" data-coin="${c.key}" data-delta="-1" title="Subtract 1 ${c.label}">-1</button>
            <input type="number" id="cur-${c.key}" class="cur-input" value="${cur[c.key] || 0}" min="0" data-coin="${c.key}" title="Click or type ${c.label} directly" />
            <button type="button" class="cur-tick-btn cur-tick-up-1" data-coin="${c.key}" data-delta="1" title="Add 1 ${c.label}">+1</button>
            <button type="button" class="cur-tick-btn cur-tick-up-5" data-coin="${c.key}" data-delta="5" title="Add 5 ${c.label}">+5</button>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="char-section-head">
          <h3>Equipment & Inventory</h3>
          ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-eq">+ Add Equipment</button>` : ''}
        </div>

        <div class="char-currency-panel">
          ${currencyCardsHtml}
        </div>

        <div class="char-eq-list">${eqHtml}</div>
      `;

      // Currency controls are ALWAYS active and directly editable (without needing "Edit Sheet" mode!)
      container.querySelectorAll('.cur-input').forEach(input => {
        const updateCoin = (val) => {
          const coinKey = input.dataset.coin;
          const num = Math.max(0, parseInt(val, 10) || 0);
          cur[coinKey] = num;
          char.currency = cur;
          this.saveStorage();
        };
        input.addEventListener('input', (e) => updateCoin(e.target.value));
        input.addEventListener('change', (e) => {
          updateCoin(e.target.value);
          input.value = cur[input.dataset.coin] || 0;
        });
      });

      // Currency tick steppers: -5, -1, +1, +5
      container.querySelectorAll('.cur-tick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const coinKey = btn.dataset.coin;
          const delta = parseInt(btn.dataset.delta, 10) || 0;
          const currentVal = cur[coinKey] || 0;
          const newVal = Math.max(0, currentVal + delta);
          cur[coinKey] = newVal;
          char.currency = cur;

          const input = container.querySelector(`#cur-${coinKey}`);
          if (input) {
            input.value = newVal;
            input.classList.remove('pulse-change');
            void input.offsetWidth; // trigger reflow
            input.classList.add('pulse-change');
          }

          this.playHpSound(delta);
          this.saveStorage();
        });
      });

      if (this.isEditMode) {
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
    renderRollTracker(newRemoteRoll) {
      const feed = document.getElementById('char-rolls-feed');
      if (!feed) return;

      const char = this.getActiveCharacter();
      const allHistory = (window.DiceRoller && Array.isArray(window.DiceRoller.history)) ? window.DiceRoller.history : [];

      if (newRemoteRoll && this.rollsTab === 'personal') {
        const rName = (newRemoteRoll.roller || '').toLowerCase();
        const isMine = rName === (char?.name || '').toLowerCase() || 
                       rName === (char?.player || '').toLowerCase() || 
                       rName === (localStorage.getItem('o_codex_player_name') || '').toLowerCase();
        if (!isMine) {
          document.getElementById('rolls-tab-everyone')?.classList.add('has-unread');
        }
      }

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
