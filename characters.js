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
  const CURRENT_ROSTER_VERSION = 'v4_grimoire';

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
        saveProfs: ['con', 'int'],
        skillProfs: ['arcana', 'history', 'investigation', 'perception']
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
      spellSlots: {
        '1': { max: 4, used: 0 },
        '2': { max: 3, used: 0 },
        '3': { max: 2, used: 0 }
      },
      spellsKnown: [
        'Guidance', 'Mold Earth', 'Minor Illusion', 'Prestidigitation', 'Message', 'Mind Sliver',
        'Silent Image', 'Absorb Elements', 'Faerie Fire', 'Cure Wounds', 'Sanctuary', 'Shield',
        'Feather Fall', 'Magic Missile', "Tasha's Hideous Laughter", 'Magnify Gravity',
        'Find Familiar', 'Comprehend Languages', 'Identify',
        'Suggestion', 'Invisibility', 'Web', 'Vortex Warp',
        'Haste', 'Counterspell', 'Hypnotic Pattern', "Leomund's Tiny Hut"
      ],
      spellsPrepared: [
        'Guidance', 'Mold Earth', 'Minor Illusion', 'Prestidigitation', 'Message', 'Mind Sliver',
        'Absorb Elements', 'Cure Wounds', 'Shield', 'Magic Missile', "Tasha's Hideous Laughter", 'Magnify Gravity',
        'Invisibility', 'Web', 'Vortex Warp',
        'Counterspell', 'Hypnotic Pattern'
      ],
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
          description: "Cantrips: Guidance, Mold Earth, Minor Illusion, Prestidigitation, Message, Mind Sliver.\n1st Level (4 slots): Silent Image (At Will), Absorb Elements, Faerie Fire, Cure Wounds, Sanctuary, Shield, Feather Fall, Magic Missile, Tasha's Hideous Laughter, Magnify Gravity, Find Familiar, Comprehend Languages, Identify.\n2nd Level (3 slots): Suggestion, Invisibility, Web, Vortex Warp.\n3rd Level (2 slots): Haste, Counterspell, Hypnotic Pattern, Leomund's Tiny Hut."
        },
        {
          id: 'feat_v7',
          name: 'Proficiencies & Languages',
          source: 'Class & Background',
          description: "Armor: Light Armor, Medium Armor, Shields.\nWeapons: Simple Weapons, Crossbows, Daggers, Darts, Slings, Quarterstaffs.\nTools: Thieves' Tools, Tinkerer's Tools, Alchemist's Supplies, Playing Card Set, Piano.\nLanguages: Common, Celestial.\nPassive Perception: 14."
        }
      ],
      equipment: [
        { id: 'eq_v2', name: 'Spellbook (Shield)', qty: 1, notes: 'Shield doubles as arcane spellbook focus (+2 AC)' },
        { id: 'eq_v4', name: "Thieves' Tools", qty: 1, notes: 'Lockpicks, file, pliers' },
        { id: 'eq_v5', name: 'Crowbar', qty: 1, notes: 'Advantage on Strength checks to pry open' },
        { id: 'eq_v7', name: 'Casual Dress', qty: 1, notes: 'Daywear' },
        { id: 'eq_v8', name: 'Winter Clothes', qty: 1, notes: '-1 Cold damage taken' },
        { id: 'eq_v9', name: 'Black Shard', qty: 1, notes: 'A mysterious key for something' }
      ],
      consumables: [
        {
          id: 'con_v1',
          name: "Dungeoneer's Pack Supplies",
          qty: 10,
          type: 'Adventuring Gear',
          notes: '10 torches, 10 rations, tinderbox, waterskin, 10 pitons, 50ft rope'
        }
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
        saveProfs: ['wis', 'cha'],
        skillProfs: ['athletics', 'insight', 'intimidation', 'perception']
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
      spellSlots: {
        '1': { max: 4, used: 0 },
        '2': { max: 2, used: 0 }
      },
      spellsKnown: [
        'Ceremony', 'Searing Smite', 'Shield of Faith', 'Command', 'Alarm', 'Detect Magic',
        'Lesser Restoration', 'Branding Smite', 'Moonbeam'
      ],
      spellsPrepared: [
        'Ceremony', 'Searing Smite', 'Shield of Faith', 'Command', 'Detect Magic',
        'Lesser Restoration', 'Branding Smite', 'Moonbeam'
      ],
      magicItems: [],
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
          description: "• Watcher's Will: As an action, choose up to 3 creatures within 30ft. For 1 minute, targets gain advantage on Int, Wis, and Cha saving throws.\n• Abjure the Extraplanar: Turn aberrations, celestials, elementals, fey, or fiends within 30ft that fail a DC 14 Wisdom save."
        },
        {
          id: 'feat_b4',
          name: 'Deathless Nature',
          source: 'Reborn Racial Feature',
          description: "• Advantage on saves vs disease, poison, and death saving throws.\n• Resistance to poison damage.\n• Do not need to eat, drink, or breathe.\n• Don't need to sleep; 4 hours of motionless resting counts as a long rest."
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
        { id: 'eq_b4', name: 'Holy Symbol', qty: 1, notes: 'Paladin spellcasting focus' }
      ],
      consumables: [
        {
          id: 'con_b1',
          name: 'Javelins',
          qty: 4,
          type: 'Thrown Weapon',
          bonus: 6,
          damageFormula: '1d6+3',
          damageType: 'Piercing',
          notes: 'Thrown weapon (range 30/120ft)'
        },
        {
          id: 'con_b2',
          name: 'Potion of Healing',
          qty: 1,
          type: 'Potion',
          healFormula: '2d4+2',
          notes: 'Restores 2d4+2 hit points when consumed as an action.'
        },
        {
          id: 'con_b3',
          name: 'Potion of Stoneskin',
          qty: 1,
          type: 'Potion',
          notes: 'Grants resistance to nonmagical bludgeoning, piercing, and slashing damage for up to 1 hour (requires concentration).'
        },
        {
          id: 'con_b4',
          name: 'Tiny Potion of Healing',
          qty: 1,
          type: 'Potion',
          healFormula: '2d4+2',
          notes: 'Small pocket vial; restores 2d4+2 hit points when consumed.'
        },
        {
          id: 'con_b5',
          name: "Priest's Pack Supplies",
          qty: 2,
          type: 'Adventuring Gear',
          notes: 'Blanket, 10 candles, tinderbox, alms box, 2 blocks incense, censer, vestments, 2 days rations, waterskin'
        }
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
        saveProfs: ['wis', 'cha'],
        skillProfs: ['athletics', 'nature', 'perception', 'survival']
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
      spellSlots: {
        '1': { max: 4, used: 0 },
        '2': { max: 3, used: 0 },
        '3': { max: 2, used: 0 }
      },
      spellsKnown: [
        'Mending', 'Sacred Flame', 'Spare the Dying', 'Produce Flame', 'Control Flames',
        'Thunderous Smite', 'Command', 'Detect Magic', 'Ceremony', 'Shield of Faith',
        'Charm Person', 'Goodberry', 'Speak with Animals', 'Cure Wounds', 'Burning Hands',
        'Flame Blade', 'Enhance Ability', 'Air Bubble', 'Pass Without Trace',
        'Dispel Magic', 'Plant Growth', 'Revivify'
      ],
      spellsPrepared: [
        'Mending', 'Sacred Flame', 'Spare the Dying', 'Produce Flame', 'Control Flames',
        'Thunderous Smite', 'Command', 'Detect Magic', 'Shield of Faith', 'Goodberry', 'Cure Wounds',
        'Flame Blade', 'Pass Without Trace',
        'Dispel Magic', 'Revivify'
      ],
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
        { id: 'eq_t5', name: 'Hand Crossbow', qty: 1, notes: 'Light ranged weapon (30/120)' }
      ],
      consumables: [
        {
          id: 'con_t1',
          name: 'Holy Water (Flask)',
          qty: 1,
          type: 'Consumable',
          damageFormula: '2d6',
          damageType: 'Radiant',
          notes: 'Ranged weapon attack (range 20ft). On hit, fiend or undead takes 2d6 radiant damage.'
        },
        {
          id: 'con_t2',
          name: 'Oil (Flask)',
          qty: 1,
          type: 'Consumable',
          notes: 'Can splash creature within 20ft or pool on ground. If creature takes fire damage before oil dries, takes 5 extra fire damage.'
        },
        {
          id: 'con_t3',
          name: 'Wooden Stakes',
          qty: 3,
          type: 'Consumable',
          notes: 'Sharpened stakes suitable for slaying vampires or piercing undead.'
        },
        {
          id: 'con_t4',
          name: "Explorer's Pack Supplies",
          qty: 10,
          type: 'Adventuring Gear',
          notes: 'Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope'
        },
        {
          id: 'con_t5',
          name: "Monster Hunter's Pack Supplies",
          qty: 1,
          type: 'Adventuring Gear',
          notes: 'Chest, crowbar, hammer, holy symbol, manacles, steel mirror, tinderbox, 3 torches'
        }
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

  // Standard D&D 5e Skills Grouped by Core Stat
  const SKILLS_BY_STAT = {
    str: [
      { id: 'athletics', name: 'Athletics' }
    ],
    dex: [
      { id: 'acrobatics', name: 'Acrobatics' },
      { id: 'sleight_of_hand', name: 'Sleight of Hand' },
      { id: 'stealth', name: 'Stealth' }
    ],
    con: [],
    int: [
      { id: 'arcana', name: 'Arcana' },
      { id: 'history', name: 'History' },
      { id: 'investigation', name: 'Investigation' },
      { id: 'nature', name: 'Nature' },
      { id: 'religion', name: 'Religion' }
    ],
    wis: [
      { id: 'animal_handling', name: 'Animal Handling' },
      { id: 'insight', name: 'Insight' },
      { id: 'medicine', name: 'Medicine' },
      { id: 'perception', name: 'Perception' },
      { id: 'survival', name: 'Survival' }
    ],
    cha: [
      { id: 'deception', name: 'Deception' },
      { id: 'intimidation', name: 'Intimidation' },
      { id: 'performance', name: 'Performance' },
      { id: 'persuasion', name: 'Persuasion' }
    ]
  };

  // Standard D&D 5e SRD Weapons & Common Combat Actions Compendium
  const SRD_WEAPONS = [
    // Simple Melee
    { name: 'Club', category: 'Simple Melee', dice: '1d4', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Light' },
    { name: 'Dagger', category: 'Simple Melee', dice: '1d4', type: 'Piercing', finesse: true, ranged: false, notes: 'Finesse, light, thrown (range 20/60)' },
    { name: 'Greatclub', category: 'Simple Melee', dice: '1d8', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Two-handed' },
    { name: 'Handaxe', category: 'Simple Melee', dice: '1d6', type: 'Slashing', finesse: false, ranged: false, notes: 'Light, thrown (range 20/60)' },
    { name: 'Javelin', category: 'Simple Melee', dice: '1d6', type: 'Piercing', finesse: false, ranged: false, notes: 'Thrown (range 30/120)' },
    { name: 'Light Hammer', category: 'Simple Melee', dice: '1d4', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Light, thrown (range 20/60)' },
    { name: 'Mace', category: 'Simple Melee', dice: '1d6', type: 'Bludgeoning', finesse: false, ranged: false, notes: '' },
    { name: 'Quarterstaff', category: 'Simple Melee', dice: '1d6', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Versatile (1d8)' },
    { name: 'Sickle', category: 'Simple Melee', dice: '1d4', type: 'Slashing', finesse: false, ranged: false, notes: 'Light' },
    { name: 'Spear', category: 'Simple Melee', dice: '1d6', type: 'Piercing', finesse: false, ranged: false, notes: 'Thrown (range 20/60), versatile (1d8)' },
    { name: 'Unarmed Strike', category: 'Simple Melee', dice: '1', type: 'Bludgeoning', finesse: false, ranged: false, notes: '' },

    // Simple Ranged
    { name: 'Crossbow, Light', category: 'Simple Ranged', dice: '1d8', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 80/320), loading, two-handed' },
    { name: 'Dart', category: 'Simple Ranged', dice: '1d4', type: 'Piercing', finesse: true, ranged: true, notes: 'Finesse, thrown (range 20/60)' },
    { name: 'Shortbow', category: 'Simple Ranged', dice: '1d6', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 80/320), two-handed' },
    { name: 'Sling', category: 'Simple Ranged', dice: '1d4', type: 'Bludgeoning', finesse: false, ranged: true, notes: 'Ammunition (range 30/120)' },

    // Martial Melee
    { name: 'Battleaxe', category: 'Martial Melee', dice: '1d8', type: 'Slashing', finesse: false, ranged: false, notes: 'Versatile (1d10)' },
    { name: 'Flail', category: 'Martial Melee', dice: '1d8', type: 'Bludgeoning', finesse: false, ranged: false, notes: '' },
    { name: 'Glaive', category: 'Martial Melee', dice: '1d10', type: 'Slashing', finesse: false, ranged: false, notes: 'Heavy, reach, two-handed' },
    { name: 'Greataxe', category: 'Martial Melee', dice: '1d12', type: 'Slashing', finesse: false, ranged: false, notes: 'Heavy, two-handed' },
    { name: 'Greatsword', category: 'Martial Melee', dice: '2d6', type: 'Slashing', finesse: false, ranged: false, notes: 'Heavy, two-handed' },
    { name: 'Halberd', category: 'Martial Melee', dice: '1d10', type: 'Slashing', finesse: false, ranged: false, notes: 'Heavy, reach, two-handed' },
    { name: 'Lance', category: 'Martial Melee', dice: '1d12', type: 'Piercing', finesse: false, ranged: false, notes: 'Reach, special' },
    { name: 'Longsword', category: 'Martial Melee', dice: '1d8', type: 'Slashing', finesse: false, ranged: false, notes: 'Versatile (1d10)' },
    { name: 'Maul', category: 'Martial Melee', dice: '2d6', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Heavy, two-handed' },
    { name: 'Morningstar', category: 'Martial Melee', dice: '1d8', type: 'Piercing', finesse: false, ranged: false, notes: '' },
    { name: 'Pike', category: 'Martial Melee', dice: '1d10', type: 'Piercing', finesse: false, ranged: false, notes: 'Heavy, reach, two-handed' },
    { name: 'Rapier', category: 'Martial Melee', dice: '1d8', type: 'Piercing', finesse: true, ranged: false, notes: 'Finesse' },
    { name: 'Scimitar', category: 'Martial Melee', dice: '1d6', type: 'Slashing', finesse: true, ranged: false, notes: 'Finesse, light' },
    { name: 'Shortsword', category: 'Martial Melee', dice: '1d6', type: 'Piercing', finesse: true, ranged: false, notes: 'Finesse, light' },
    { name: 'Trident', category: 'Martial Melee', dice: '1d6', type: 'Piercing', finesse: false, ranged: false, notes: 'Thrown (range 20/60), versatile (1d8)' },
    { name: 'War Pick', category: 'Martial Melee', dice: '1d8', type: 'Piercing', finesse: false, ranged: false, notes: '' },
    { name: 'Warhammer', category: 'Martial Melee', dice: '1d8', type: 'Bludgeoning', finesse: false, ranged: false, notes: 'Versatile (1d10)' },
    { name: 'Whip', category: 'Martial Melee', dice: '1d4', type: 'Slashing', finesse: true, ranged: false, notes: 'Finesse, reach' },

    // Martial Ranged
    { name: 'Blowgun', category: 'Martial Ranged', dice: '1', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 25/100), loading' },
    { name: 'Crossbow, Hand', category: 'Martial Ranged', dice: '1d6', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 30/120), light, loading' },
    { name: 'Crossbow, Heavy', category: 'Martial Ranged', dice: '1d10', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 100/400), heavy, loading, two-handed' },
    { name: 'Longbow', category: 'Martial Ranged', dice: '1d8', type: 'Piercing', finesse: false, ranged: true, notes: 'Ammunition (range 150/600), heavy, two-handed' },
    { name: 'Net', category: 'Martial Ranged', dice: '0', type: 'Special', finesse: false, ranged: true, notes: 'Special, thrown (range 5/15)' },

    // Common Spell Attacks
    { name: 'Eldritch Blast', category: 'Spell Attack', dice: '1d10', type: 'Force', finesse: false, ranged: true, spell: true, notes: 'Range 120 ft, beam attack' },
    { name: 'Fire Bolt', category: 'Spell Attack', dice: '1d10', type: 'Fire', finesse: false, ranged: true, spell: true, notes: 'Range 120 ft' },
    { name: 'Ray of Frost', category: 'Spell Attack', dice: '1d8', type: 'Cold', finesse: false, ranged: true, spell: true, notes: 'Range 60 ft, speed reduced 10 ft' },
    { name: 'Sacred Flame', category: 'Spell Attack', dice: '1d8', type: 'Radiant', finesse: false, ranged: true, spell: true, notes: 'Range 60 ft, DEX save' },
    { name: 'Toll the Dead', category: 'Spell Attack', dice: '1d8', type: 'Necrotic', finesse: false, ranged: true, spell: true, notes: 'Range 60 ft, 1d12 if target wounded' },
    { name: 'Guiding Bolt', category: 'Spell Attack', dice: '4d6', type: 'Radiant', finesse: false, ranged: true, spell: true, notes: 'Range 120 ft, advantage on next attack' }
  ];

  class PartyCharacterManager {
    constructor() {
      this.characters = [];
      this.activeCharId = null;
      this.activeTab = 'equipment'; // 'equipment' | 'divions' | 'items' | 'notes'
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

    sanitizeCharacters(list) {
      if (!Array.isArray(list)) return [];
      return list.filter(c => {
        if (!c || !c.name) return false;
        const n = String(c.name).trim().toLowerCase();
        return n !== 'awd' && !n.includes('awd');
      });
    }

    loadStorage() {
      try {
        const rosterVersion = localStorage.getItem(ROSTER_VERSION_KEY);
        if (rosterVersion !== CURRENT_ROSTER_VERSION) {
          // Fresh migration to canon sheets: replace old dummy roster
          this.characters = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
          this.activeCharId = 'char_valorie';
          localStorage.setItem(ROSTER_VERSION_KEY, CURRENT_ROSTER_VERSION);
          this.saveStorage(true);
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

      // Ensure all schema arrays and objects exist on loaded characters
      if (Array.isArray(this.characters)) {
        // Clean up test characters (e.g. 'awd')
        const initCount = this.characters.length;
        this.characters = this.sanitizeCharacters(this.characters);
        if (this.characters.length !== initCount) {
          this.saveStorage(true);
        }

        this.characters.forEach(c => {
          if (!Array.isArray(c.consumables)) c.consumables = [];
          if (!Array.isArray(c.attacks)) c.attacks = [];
          if (!Array.isArray(c.magicItems)) c.magicItems = [];
          if (!Array.isArray(c.equipment)) c.equipment = [];
          if (!Array.isArray(c.divions)) c.divions = [];
          if (!Array.isArray(c.feats)) c.feats = [];
          if (!Array.isArray(c.boons)) c.boons = [];
          if (!c.spellSlots || typeof c.spellSlots !== 'object') c.spellSlots = {};
          if (!Array.isArray(c.spellsKnown)) c.spellsKnown = [];
          if (!Array.isArray(c.spellsPrepared)) c.spellsPrepared = [];
          if (!Array.isArray(c.skillProfs)) c.skillProfs = [];
          if (!c.skills || typeof c.skills !== 'object') c.skills = {};
          if (!c.currency) c.currency = { cp: 0, sp: 0, gp: 0, pp: 0, aetherGems: 0 };
        });
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

      if (window.InitiativeTracker && typeof window.InitiativeTracker.render === 'function') {
        window.InitiativeTracker.render();
      }
    }

    hasPendingLocalChanges() {
      return Boolean(this.debounceTimer);
    }

    onRemoteCharacters(remoteParty, broadcast = false) {
      if (!Array.isArray(remoteParty) || remoteParty.length === 0) return;

      const initLen = remoteParty.length;
      remoteParty = this.sanitizeCharacters(remoteParty);
      const hadTestChars = remoteParty.length !== initLen;

      if (this.debounceTimer) {
        console.warn('[CharacterSheet] Ignoring remote characters update due to pending local modifications.');
        return;
      }

      if (JSON.stringify(remoteParty) === JSON.stringify(this.characters)) {
        if (hadTestChars) {
          this.saveStorage(true);
        }
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
      if (window.InitiativeTracker && typeof window.InitiativeTracker.render === 'function') {
        window.InitiativeTracker.render();
      }

      if (hadTestChars) {
        this.saveStorage(true);
      }
    }

    getActiveCharacter() {
      return this.characters.find(c => c.id === this.activeCharId) || this.characters[0];
    }

    isSkillProficient(char, skillId) {
      if (!char) return false;
      if (char.skills && typeof char.skills === 'object' && char.skills[skillId]) return true;
      if (Array.isArray(char.skillProfs) && char.skillProfs.includes(skillId)) return true;
      if (char.stats && Array.isArray(char.stats.skillProfs) && char.stats.skillProfs.includes(skillId)) return true;
      return false;
    }

    setSkillProficient(char, skillId, enabled) {
      if (!char) return;
      if (!char.skills || typeof char.skills !== 'object') char.skills = {};
      char.skills[skillId] = Boolean(enabled);

      if (!Array.isArray(char.skillProfs)) char.skillProfs = [];
      if (enabled) {
        if (!char.skillProfs.includes(skillId)) char.skillProfs.push(skillId);
      } else {
        char.skillProfs = char.skillProfs.filter(s => s !== skillId);
      }
      if (char.stats) {
        if (!Array.isArray(char.stats.skillProfs)) char.stats.skillProfs = [];
        if (enabled) {
          if (!char.stats.skillProfs.includes(skillId)) char.stats.skillProfs.push(skillId);
        } else {
          char.stats.skillProfs = char.stats.skillProfs.filter(s => s !== skillId);
        }
      }
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
        btn.textContent = this.isEditMode ? 'Done Editing' : 'Edit Sheet';
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
      if (window.InitiativeTracker && typeof window.InitiativeTracker.render === 'function') {
        window.InitiativeTracker.render();
      }
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

    adjustCharacterHpByName(name, delta) {
      if (!name) return null;
      const char = this.characters.find(c => 
        (c.name && c.name.toLowerCase() === name.toLowerCase()) ||
        (c.player && c.player.toLowerCase() === name.toLowerCase())
      );
      if (!char || !char.vitals) return null;
      const oldHp = char.vitals.hpCurrent || 0;
      const maxHp = char.vitals.hpMax || 1;
      const newHp = Math.max(0, Math.min(maxHp, oldHp + delta));
      char.vitals.hpCurrent = newHp;
      this.playHpSound(delta);
      this.saveStorage();
      if (char.id === this.activeCharId) {
        this.renderVitals(char);
      }
      return { char, oldHp, newHp, delta };
    }

    initDOM() {
      // Edit Mode Toggle
      document.getElementById('char-edit-toggle-btn')?.addEventListener('click', () => this.toggleEditMode());

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

      // Clear roll log button
      document.getElementById('rolls-clear-btn')?.addEventListener('click', () => {
        if (!window.DiceRoller) return;
        if (this.rollsTab === 'personal') {
          window.DiceRoller.clearHistory('personal');
        } else {
          window.DiceRoller.clearHistory('all');
        }
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

      // Character Item / Power Inspect Modal Close Handlers
      document.getElementById('char-inspect-close')?.addEventListener('click', () => this.closeInspectModal());
      document.getElementById('char-inspect-backdrop')?.addEventListener('click', () => this.closeInspectModal());

      // Delegated click handler on #char-tab-view for shareable titles
      document.getElementById('char-tab-view')?.addEventListener('click', (e) => {
        const titleTarget = e.target.closest('.item-shareable-title');
        if (!titleTarget) return;

        const type = titleTarget.dataset.shareType;
        const index = parseInt(titleTarget.dataset.index, 10);
        if (type === 'spell') {
          this.shareItemByType(type, index, this.getActiveCharacter(), titleTarget);
          return;
        }
        if (type && !isNaN(index)) {
          this.shareItemByType(type, index, this.getActiveCharacter(), titleTarget);
        }
      });

      // Escape key listener for character inspect modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const inspectModal = document.getElementById('char-inspect-modal');
          if (inspectModal && !inspectModal.classList.contains('hidden')) {
            this.closeInspectModal();
          }
        }
      });

      // Listen for dice roll events to live-update roll sidebar
      window.addEventListener('diceroller:new-roll', () => {
        this.renderRollTracker();
      });

      // Character Form Modals (Attacks, Magic Items, Equipment)
      document.getElementById('attack-modal-close')?.addEventListener('click', () => this.closeAttackModal());
      document.getElementById('attack-modal-backdrop')?.addEventListener('click', () => this.closeAttackModal());
      document.getElementById('attack-modal-cancel')?.addEventListener('click', () => this.closeAttackModal());
      document.getElementById('attack-modal-form')?.addEventListener('submit', (e) => this.saveAttackFromModal(e));

      // Quick dice pills in attack modal
      document.querySelectorAll('.char-dice-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const dice = pill.dataset.dice;
          const input = document.getElementById('atk-form-dmg-dice');
          if (input && dice) {
            input.value = dice;
            this.updateAttackModalPreview();
          }
        });
      });

      // Quick type pills in attack modal
      document.querySelectorAll('.char-type-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const type = pill.dataset.type;
          const input = document.getElementById('atk-form-dmg-type');
          if (input && type) {
            input.value = type;
            this.updateAttackModalPreview();
          }
        });
      });

      // Populate D&D 5e SRD weapons datalist for quick autocomplete
      const datalist = document.getElementById('atk-srd-weapons-list');
      if (datalist && datalist.children.length === 0) {
        SRD_WEAPONS.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w.name;
          opt.label = `${w.dice} ${w.type} (${w.category})`;
          datalist.appendChild(opt);
        });
      }

      // Attack modal preset dropdown listener
      document.getElementById('atk-form-preset-select')?.addEventListener('change', (e) => {
        if (e.target.value) {
          this.applyWeaponPreset(e.target.value);
        }
      });

      // Attack modal name input autocomplete detection
      document.getElementById('atk-form-name')?.addEventListener('input', (e) => {
        const val = (e.target.value || '').trim();
        const matched = SRD_WEAPONS.find(w => w.name.toLowerCase() === val.toLowerCase());
        if (matched) {
          this.applyWeaponPreset(matched.name, false);
        }
      });

      // Attack modal inputs dynamic preview listeners
      ['atk-form-ability', 'atk-form-proficient', 'atk-form-extra-hit', 'atk-form-dmg-dice', 'atk-form-dmg-type', 'atk-form-add-ability-dmg', 'atk-form-extra-dmg'].forEach(id => {
        const el = document.getElementById(id);
        el?.addEventListener('input', () => this.updateAttackModalPreview());
        el?.addEventListener('change', () => this.updateAttackModalPreview());
      });

      // Magic Item Modal
      document.getElementById('magic-item-modal-close')?.addEventListener('click', () => this.closeMagicItemModal());
      document.getElementById('magic-item-modal-backdrop')?.addEventListener('click', () => this.closeMagicItemModal());
      document.getElementById('magic-item-modal-cancel')?.addEventListener('click', () => this.closeMagicItemModal());
      document.getElementById('magic-item-modal-form')?.addEventListener('submit', (e) => this.saveMagicItemFromModal(e));

      // Equipment Modal
      document.getElementById('equipment-modal-close')?.addEventListener('click', () => this.closeEquipmentModal());
      document.getElementById('equipment-modal-backdrop')?.addEventListener('click', () => this.closeEquipmentModal());
      document.getElementById('equipment-modal-cancel')?.addEventListener('click', () => this.closeEquipmentModal());
      document.getElementById('equipment-modal-form')?.addEventListener('submit', (e) => this.saveEquipmentFromModal(e));

      // Divion Modal
      document.getElementById('divion-modal-close')?.addEventListener('click', () => this.closeDivionModal());
      document.getElementById('divion-modal-backdrop')?.addEventListener('click', () => this.closeDivionModal());
      document.getElementById('divion-modal-cancel')?.addEventListener('click', () => this.closeDivionModal());
      document.getElementById('divion-modal-form')?.addEventListener('submit', (e) => this.saveDivionFromModal(e));

      // Feat Modal
      document.getElementById('feat-modal-close')?.addEventListener('click', () => this.closeFeatModal());
      document.getElementById('feat-modal-backdrop')?.addEventListener('click', () => this.closeFeatModal());
      document.getElementById('feat-modal-cancel')?.addEventListener('click', () => this.closeFeatModal());
      document.getElementById('feat-modal-form')?.addEventListener('submit', (e) => this.saveFeatFromModal(e));

      // Boon Modal
      document.getElementById('boon-modal-close')?.addEventListener('click', () => this.closeBoonModal());
      document.getElementById('boon-modal-backdrop')?.addEventListener('click', () => this.closeBoonModal());
      document.getElementById('boon-modal-cancel')?.addEventListener('click', () => this.closeBoonModal());
      document.getElementById('boon-modal-form')?.addEventListener('submit', (e) => this.saveBoonFromModal(e));

      // Consumable Modal
      document.getElementById('consumable-modal-close')?.addEventListener('click', () => this.closeConsumableModal());
      document.getElementById('consumable-modal-backdrop')?.addEventListener('click', () => this.closeConsumableModal());
      document.getElementById('consumable-modal-cancel')?.addEventListener('click', () => this.closeConsumableModal());
      document.getElementById('consumable-modal-form')?.addEventListener('submit', (e) => this.saveConsumableFromModal(e));

      // Spell Slot Modal
      document.getElementById('slot-modal-close')?.addEventListener('click', () => this.closeSlotModal());
      document.getElementById('slot-modal-backdrop')?.addEventListener('click', () => this.closeSlotModal());
      document.getElementById('slot-modal-cancel')?.addEventListener('click', () => this.closeSlotModal());
      document.getElementById('slot-modal-form')?.addEventListener('submit', (e) => this.saveSlotFromModal(e));

      // Escape key listener for all character form modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!document.getElementById('attack-modal')?.classList.contains('hidden')) this.closeAttackModal();
          if (!document.getElementById('magic-item-modal')?.classList.contains('hidden')) this.closeMagicItemModal();
          if (!document.getElementById('equipment-modal')?.classList.contains('hidden')) this.closeEquipmentModal();
          if (!document.getElementById('divion-modal')?.classList.contains('hidden')) this.closeDivionModal();
          if (!document.getElementById('feat-modal')?.classList.contains('hidden')) this.closeFeatModal();
          if (!document.getElementById('boon-modal')?.classList.contains('hidden')) this.closeBoonModal();
          if (!document.getElementById('consumable-modal')?.classList.contains('hidden')) this.closeConsumableModal();
          if (!document.getElementById('slot-modal')?.classList.contains('hidden')) this.closeSlotModal();
        }
      });
    }

    // STAT MOD & DYNAMIC COMBAT HELPERS
    getStatMod(score) {
      const s = parseInt(score, 10);
      return Math.floor(((isNaN(s) ? 10 : s) - 10) / 2);
    }

    computeAttackBonus(char, atk) {
      if (!atk) return 0;
      if (atk.ability && atk.ability !== 'none') {
        const mod = this.getStatMod(char?.stats?.[atk.ability]);
        const prof = (atk.isProficient !== false) ? (char?.vitals?.profBonus || 2) : 0;
        const extra = parseInt(atk.extraHitBonus, 10) || 0;
        return mod + prof + extra;
      }
      if (typeof atk.bonus === 'number') return atk.bonus;
      const parsed = parseInt(atk.bonus, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    computeDamageFormula(char, atk) {
      if (!atk) return '1d8';
      if (atk.damageDice) {
        let mod = 0;
        if (atk.ability && atk.ability !== 'none' && atk.addAbilityToDamage !== false) {
          mod = this.getStatMod(char?.stats?.[atk.ability]);
        }
        const extra = parseInt(atk.extraDamageBonus, 10) || 0;
        const total = mod + extra;
        if (total > 0) return `${atk.damageDice} + ${total}`;
        if (total < 0) return `${atk.damageDice} - ${Math.abs(total)}`;
        return `${atk.damageDice}`;
      }
      if (atk.damageFormula) {
        return atk.damageFormula.replace(/\b(STR|DEX|CON|INT|WIS|CHA)\b/gi, (match) => {
          const m = this.getStatMod(char?.stats?.[match.toLowerCase()]);
          return m >= 0 ? `+ ${m}` : `- ${Math.abs(m)}`;
        }).replace(/\+\s*\+/g, '+').replace(/\+\s*\-/g, '-');
      }
      return '1d8';
    }

    // D&D 5e SRD WEAPON AUTOFILL & OPTIMAL ABILITY SCALING
    determineOptimalAbility(char, weapon) {
      if (!char || !char.stats) return 'str';
      if (weapon.spell) {
        const intMod = this.getStatMod(char.stats.int);
        const wisMod = this.getStatMod(char.stats.wis);
        const chaMod = this.getStatMod(char.stats.cha);
        if (chaMod >= intMod && chaMod >= wisMod) return 'cha';
        if (wisMod >= intMod) return 'wis';
        return 'int';
      }
      if (weapon.finesse) {
        // Compare DEX vs STR and take the higher of whatever modifiers they can use for it
        const dexMod = this.getStatMod(char.stats.dex);
        const strMod = this.getStatMod(char.stats.str);
        return dexMod >= strMod ? 'dex' : 'str';
      }
      if (weapon.ranged) {
        return 'dex';
      }
      return 'str';
    }

    applyWeaponPreset(weaponName, preserveCustomName = false) {
      if (!weaponName) return;
      const weapon = SRD_WEAPONS.find(w => w.name.toLowerCase() === weaponName.trim().toLowerCase());
      if (!weapon) return;

      const char = this.getActiveCharacter();
      const nameInput = document.getElementById('atk-form-name');
      const presetSelect = document.getElementById('atk-form-preset-select');
      const abilitySelect = document.getElementById('atk-form-ability');
      const diceInput = document.getElementById('atk-form-dmg-dice');
      const typeInput = document.getElementById('atk-form-dmg-type');
      const notesInput = document.getElementById('atk-form-notes');
      const profCheck = document.getElementById('atk-form-proficient');
      const addAbilityCheck = document.getElementById('atk-form-add-ability-dmg');

      if (!preserveCustomName && nameInput) {
        if (!nameInput.value || SRD_WEAPONS.some(w => w.name.toLowerCase() === nameInput.value.trim().toLowerCase())) {
          nameInput.value = weapon.name;
        }
      }

      if (presetSelect && presetSelect.value !== weapon.name) {
        presetSelect.value = weapon.name;
      }

      const optimalAbility = this.determineOptimalAbility(char, weapon);
      if (abilitySelect) abilitySelect.value = optimalAbility;
      if (diceInput) diceInput.value = weapon.dice;
      if (typeInput) typeInput.value = weapon.type;
      if (profCheck) profCheck.checked = true;
      if (addAbilityCheck) addAbilityCheck.checked = !weapon.spell || weapon.name === 'Eldritch Blast';

      if (notesInput) {
        if (!notesInput.value || SRD_WEAPONS.some(w => w.notes && w.notes === notesInput.value.trim())) {
          notesInput.value = weapon.notes || '';
        }
      }

      this.updateAttackModalPreview();
    }

    // MODAL CONTROLLERS
    openAttackModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('attack-modal');
      const form = document.getElementById('attack-modal-form');
      const title = document.getElementById('attack-modal-title');
      const presetSelect = document.getElementById('atk-form-preset-select');
      if (!modal || !form) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };

      const profVal = char.vitals?.profBonus || 2;
      const profLabelEl = document.getElementById('atk-form-prof-val');
      if (profLabelEl) profLabelEl.textContent = `+${profVal}`;

      setVal('atk-form-edit-index', (index !== null && index !== undefined) ? index : '');

      if (index !== null && index !== undefined && char.attacks && char.attacks[index]) {
        const atk = char.attacks[index];
        if (title) title.textContent = 'Edit Weapon / Action';
        setVal('atk-form-name', atk.name || '');
        setVal('atk-form-ability', atk.ability || 'dex');
        setCheck('atk-form-proficient', atk.isProficient !== false);
        setVal('atk-form-extra-hit', atk.extraHitBonus || 0);
        setVal('atk-form-dmg-dice', atk.damageDice || (atk.damageFormula ? atk.damageFormula.split('+')[0].trim() : '1d8'));
        setVal('atk-form-dmg-type', atk.damageType || '');
        setCheck('atk-form-add-ability-dmg', atk.addAbilityToDamage !== false);
        setCheck('atk-form-add-mod', atk.addAbilityToDamage !== false);
        setVal('atk-form-extra-dmg', atk.extraDamageBonus || 0);
        setVal('atk-form-notes', atk.notes || '');

        if (presetSelect) {
          const matched = SRD_WEAPONS.find(w => 
            w.name.toLowerCase() === (atk.name || '').toLowerCase() ||
            (atk.name || '').toLowerCase().includes(w.name.toLowerCase())
          );
          presetSelect.value = matched ? matched.name : '';
        }
      } else {
        if (title) title.textContent = 'Add Weapon / Action';
        form.reset();
        setVal('atk-form-edit-index', '');
        if (presetSelect) presetSelect.value = '';

        const dexMod = this.getStatMod(char.stats?.dex);
        const strMod = this.getStatMod(char.stats?.str);
        setVal('atk-form-ability', (strMod > dexMod) ? 'str' : 'dex');
        setCheck('atk-form-proficient', true);
        setVal('atk-form-extra-hit', '0');
        setVal('atk-form-dmg-dice', '1d8');
        setVal('atk-form-dmg-type', 'Slashing');
        setCheck('atk-form-add-ability-dmg', true);
        setCheck('atk-form-add-mod', true);
        setVal('atk-form-extra-dmg', '0');
        setVal('atk-form-notes', '');
      }

      this.updateAttackModalPreview();
      modal.classList.remove('hidden');
      document.getElementById('atk-form-name')?.focus();
    }

    closeAttackModal() {
      document.getElementById('attack-modal')?.classList.add('hidden');
    }

    updateAttackModalPreview() {
      const char = this.getActiveCharacter();
      if (!char) return;

      const ability = document.getElementById('atk-form-ability')?.value || 'dex';
      const isProf = document.getElementById('atk-form-proficient')?.checked;
      const extraHit = parseInt(document.getElementById('atk-form-extra-hit')?.value, 10) || 0;
      const dmgDice = (document.getElementById('atk-form-dmg-dice')?.value || '1d8').trim();
      const dmgType = (document.getElementById('atk-form-dmg-type')?.value || '').trim();
      const addAbilityEl = document.getElementById('atk-form-add-ability-dmg') || document.getElementById('atk-form-add-mod');
      const addAbilityDmg = addAbilityEl ? addAbilityEl.checked : true;
      const extraDmg = parseInt(document.getElementById('atk-form-extra-dmg')?.value, 10) || 0;

      const abilityMod = ability !== 'none' ? this.getStatMod(char.stats?.[ability]) : 0;
      const profBonus = isProf ? (char.vitals?.profBonus || 2) : 0;
      const totalHit = abilityMod + profBonus + extraHit;
      const hitPreview = totalHit >= 0 ? `+${totalHit} to hit` : `${totalHit} to hit`;

      const abilityDmgLabel = document.getElementById('atk-form-ability-dmg-val') || document.getElementById('atk-form-dmg-mod-val');
      if (abilityDmgLabel) {
        if (ability !== 'none') {
          abilityDmgLabel.textContent = `+${ability.toUpperCase()} (${abilityMod >= 0 ? `+${abilityMod}` : abilityMod})`;
        } else {
          abilityDmgLabel.textContent = `+0`;
        }
      }

      const totalDmgMod = (addAbilityDmg && ability !== 'none' ? abilityMod : 0) + extraDmg;
      let dmgPreview = dmgDice;
      if (totalDmgMod > 0) dmgPreview += ` + ${totalDmgMod}`;
      else if (totalDmgMod < 0) dmgPreview += ` - ${Math.abs(totalDmgMod)}`;
      if (dmgType) dmgPreview += ` ${dmgType}`;

      const hitPreviewEl = document.getElementById('atk-form-hit-preview');
      const dmgPreviewEl = document.getElementById('atk-form-dmg-preview');
      if (hitPreviewEl) hitPreviewEl.textContent = hitPreview;
      if (dmgPreviewEl) dmgPreviewEl.textContent = dmgPreview;
    }

    saveAttackFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.attacks)) char.attacks = [];

      const indexStr = document.getElementById('atk-form-edit-index')?.value;
      const name = (document.getElementById('atk-form-name')?.value || '').trim();
      if (!name) return;

      const ability = document.getElementById('atk-form-ability')?.value || 'none';
      const isProficient = document.getElementById('atk-form-proficient')?.checked !== false;
      const extraHitBonus = parseInt(document.getElementById('atk-form-extra-hit')?.value, 10) || 0;
      const damageDice = (document.getElementById('atk-form-dmg-dice')?.value || '1d8').trim();
      const damageType = (document.getElementById('atk-form-dmg-type')?.value || '').trim();
      const addAbilityEl = document.getElementById('atk-form-add-ability-dmg') || document.getElementById('atk-form-add-mod');
      const addAbilityToDamage = addAbilityEl ? addAbilityEl.checked !== false : true;
      const extraDamageBonus = parseInt(document.getElementById('atk-form-extra-dmg')?.value, 10) || 0;
      const notes = (document.getElementById('atk-form-notes')?.value || '').trim();

      const atkData = {
        name,
        ability,
        isProficient,
        extraHitBonus,
        damageDice,
        damageType,
        addAbilityToDamage,
        extraDamageBonus,
        notes
      };

      atkData.bonus = this.computeAttackBonus(char, atkData);
      atkData.damageFormula = this.computeDamageFormula(char, atkData);

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        atkData.id = char.attacks[idx]?.id || `atk_${Date.now()}`;
        char.attacks[idx] = atkData;
      } else {
        atkData.id = `atk_${Date.now()}`;
        char.attacks.push(atkData);
      }

      this.saveStorage();
      this.closeAttackModal();
      this.renderTabContent();
    }

    openMagicItemModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('magic-item-modal');
      const form = document.getElementById('magic-item-modal-form');
      const title = document.getElementById('magic-item-modal-title');
      if (!modal || !form) return;

      document.getElementById('magic-form-edit-index').value = (index !== null && index !== undefined) ? index : '';

      if (index !== null && index !== undefined && char.magicItems && char.magicItems[index]) {
        const item = char.magicItems[index];
        title.textContent = 'Edit Magic Item / Relic';
        document.getElementById('magic-form-name').value = item.name || '';
        document.getElementById('magic-form-rarity').value = item.rarity || 'Rare';
        document.getElementById('magic-form-charges').value = item.charges || '';
        document.getElementById('magic-form-attuned').checked = !!item.attuned;
        document.getElementById('magic-form-desc').value = item.description || '';
      } else {
        title.textContent = 'Add Magic Item / Relic';
        form.reset();
        document.getElementById('magic-form-edit-index').value = '';
        document.getElementById('magic-form-rarity').value = 'Rare';
      }

      modal.classList.remove('hidden');
      document.getElementById('magic-form-name')?.focus();
    }

    closeMagicItemModal() {
      document.getElementById('magic-item-modal')?.classList.add('hidden');
    }

    saveMagicItemFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.magicItems)) char.magicItems = [];

      const indexStr = document.getElementById('magic-form-edit-index')?.value;
      const name = (document.getElementById('magic-form-name')?.value || '').trim();
      if (!name) return;

      const rarity = document.getElementById('magic-form-rarity')?.value || 'Rare';
      const charges = (document.getElementById('magic-form-charges')?.value || '').trim();
      const attuned = !!document.getElementById('magic-form-attuned')?.checked;
      const description = (document.getElementById('magic-form-desc')?.value || '').trim();

      const itemData = { name, rarity, charges, attuned, description };

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        itemData.id = char.magicItems[idx]?.id || `item_${Date.now()}`;
        char.magicItems[idx] = itemData;
      } else {
        itemData.id = `item_${Date.now()}`;
        char.magicItems.push(itemData);
      }

      this.saveStorage();
      this.closeMagicItemModal();
      this.renderTabContent();
    }

    openEquipmentModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('equipment-modal');
      const form = document.getElementById('equipment-modal-form');
      const title = document.getElementById('equipment-modal-title');
      if (!modal || !form) return;

      document.getElementById('eq-form-edit-index').value = (index !== null && index !== undefined) ? index : '';

      if (index !== null && index !== undefined && char.equipment && char.equipment[index]) {
        const eq = char.equipment[index];
        title.textContent = 'Edit Equipment / Gear';
        document.getElementById('eq-form-name').value = eq.name || '';
        document.getElementById('eq-form-qty').value = eq.qty || 1;
        document.getElementById('eq-form-notes').value = eq.notes || '';
      } else {
        title.textContent = 'Add Equipment / Gear';
        form.reset();
        document.getElementById('eq-form-edit-index').value = '';
        document.getElementById('eq-form-qty').value = '1';
      }

      modal.classList.remove('hidden');
      document.getElementById('eq-form-name')?.focus();
    }

    closeEquipmentModal() {
      document.getElementById('equipment-modal')?.classList.add('hidden');
    }

    saveEquipmentFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.equipment)) char.equipment = [];

      const indexStr = document.getElementById('eq-form-edit-index')?.value;
      const name = (document.getElementById('eq-form-name')?.value || '').trim();
      if (!name) return;

      const qty = parseInt(document.getElementById('eq-form-qty')?.value, 10) || 1;
      const notes = (document.getElementById('eq-form-notes')?.value || '').trim();

      const eqData = { name, qty, notes };

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        eqData.id = char.equipment[idx]?.id || `eq_${Date.now()}`;
        char.equipment[idx] = eqData;
      } else {
        eqData.id = `eq_${Date.now()}`;
        char.equipment.push(eqData);
      }

      this.saveStorage();
      this.closeEquipmentModal();
      this.renderTabContent();
    }

    // DIVION MODAL
    openDivionModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('divion-modal');
      const form = document.getElementById('divion-modal-form');
      const title = document.getElementById('divion-modal-title');
      if (!modal || !form) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

      setVal('div-form-edit-index', (index !== null && index !== undefined) ? index : '');

      if (index !== null && index !== undefined && char.divions && char.divions[index]) {
        const div = char.divions[index];
        if (title) title.textContent = 'Edit Manifestation';
        setVal('div-form-name', div.name || '');
        setVal('div-form-type', div.type || '');
        setVal('div-form-rank', div.rank || 'Tier I');
        setVal('div-form-cost', div.cost || '');
        setVal('div-form-effect', div.manifestEffect || '');
      } else {
        if (title) title.textContent = 'Add Manifestation';
        form.reset();
        setVal('div-form-edit-index', '');
        setVal('div-form-rank', 'Tier I');
        setVal('div-form-cost', '1 Flow');
      }

      modal.classList.remove('hidden');
      document.getElementById('div-form-name')?.focus();
    }

    closeDivionModal() {
      document.getElementById('divion-modal')?.classList.add('hidden');
    }

    saveDivionFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.divions)) char.divions = [];

      const indexStr = document.getElementById('div-form-edit-index')?.value;
      const name = (document.getElementById('div-form-name')?.value || '').trim();
      if (!name) return;

      const type = (document.getElementById('div-form-type')?.value || '').trim();
      const rank = (document.getElementById('div-form-rank')?.value || 'Tier I').trim();
      const cost = (document.getElementById('div-form-cost')?.value || '').trim();
      const manifestEffect = (document.getElementById('div-form-effect')?.value || '').trim();

      const divData = { name, type, rank, cost, manifestEffect };

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        divData.id = char.divions[idx]?.id || `div_${Date.now()}`;
        char.divions[idx] = divData;
      } else {
        divData.id = `div_${Date.now()}`;
        char.divions.push(divData);
      }

      this.saveStorage();
      this.closeDivionModal();
      this.renderTabContent();
    }

    // FEAT MODAL
    openFeatModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('feat-modal');
      const form = document.getElementById('feat-modal-form');
      const title = document.getElementById('feat-modal-title');
      if (!modal || !form) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

      setVal('feat-form-edit-index', (index !== null && index !== undefined) ? index : '');

      if (index !== null && index !== undefined && char.feats && char.feats[index]) {
        const feat = char.feats[index];
        if (title) title.textContent = 'Edit Feat / Trait';
        setVal('feat-form-name', feat.name || '');
        setVal('feat-form-source', feat.source || '');
        setVal('feat-form-desc', feat.description || '');
      } else {
        if (title) title.textContent = 'Add Feat / Trait';
        form.reset();
        setVal('feat-form-edit-index', '');
        setVal('feat-form-source', 'Class Feature');
      }

      modal.classList.remove('hidden');
      document.getElementById('feat-form-name')?.focus();
    }

    closeFeatModal() {
      document.getElementById('feat-modal')?.classList.add('hidden');
    }

    saveFeatFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.feats)) char.feats = [];

      const indexStr = document.getElementById('feat-form-edit-index')?.value;
      const name = (document.getElementById('feat-form-name')?.value || '').trim();
      if (!name) return;

      const source = (document.getElementById('feat-form-source')?.value || 'Feat').trim();
      const description = (document.getElementById('feat-form-desc')?.value || '').trim();

      const featData = { name, source, description };

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        featData.id = char.feats[idx]?.id || `feat_${Date.now()}`;
        char.feats[idx] = featData;
      } else {
        featData.id = `feat_${Date.now()}`;
        char.feats.push(featData);
      }

      this.saveStorage();
      this.closeFeatModal();
      this.renderTabContent();
    }

    // BOON MODAL
    openBoonModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('boon-modal');
      const form = document.getElementById('boon-modal-form');
      const title = document.getElementById('boon-modal-title');
      if (!modal || !form) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

      setVal('boon-form-edit-index', (index !== null && index !== undefined) ? index : '');

      if (index !== null && index !== undefined && char.boons && char.boons[index]) {
        const boon = char.boons[index];
        if (title) title.textContent = 'Edit Boon / Blessing';
        setVal('boon-form-name', boon.name || '');
        setVal('boon-form-granted', boon.grantedBy || '');
        setVal('boon-form-effect', boon.effect || '');
      } else {
        if (title) title.textContent = 'Add Boon / Blessing';
        form.reset();
        setVal('boon-form-edit-index', '');
        setVal('boon-form-granted', 'Dungeon Master');
      }

      modal.classList.remove('hidden');
      document.getElementById('boon-form-name')?.focus();
    }

    closeBoonModal() {
      document.getElementById('boon-modal')?.classList.add('hidden');
    }

    saveBoonFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.boons)) char.boons = [];

      const indexStr = document.getElementById('boon-form-edit-index')?.value;
      const name = (document.getElementById('boon-form-name')?.value || '').trim();
      if (!name) return;

      const grantedBy = (document.getElementById('boon-form-granted')?.value || 'Dungeon Master').trim();
      const effect = (document.getElementById('boon-form-effect')?.value || '').trim();

      const boonData = { name, grantedBy, effect };

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        boonData.id = char.boons[idx]?.id || `boon_${Date.now()}`;
        char.boons[idx] = boonData;
      } else {
        boonData.id = `boon_${Date.now()}`;
        char.boons.push(boonData);
      }

      this.saveStorage();
      this.closeBoonModal();
      this.renderTabContent();
    }

    // CONSUMABLE MODAL
    openConsumableModal(index = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('consumable-modal');
      const form = document.getElementById('consumable-modal-form');
      const title = document.getElementById('consumable-modal-title');
      if (!modal || !form) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

      setVal('con-form-edit-index', (index !== null && index !== undefined) ? index : '');

      if (index !== null && index !== undefined && char.consumables && char.consumables[index]) {
        const con = char.consumables[index];
        if (title) title.textContent = 'Edit Consumable Item';
        setVal('con-form-name', con.name || '');
        setVal('con-form-type', con.type || 'Potion');
        setVal('con-form-qty', con.qty || 1);
        setVal('con-form-heal', con.healFormula || '');
        setVal('con-form-dmg', con.damageFormula || '');
        setVal('con-form-notes', con.notes || '');
      } else {
        if (title) title.textContent = 'Add Consumable Item';
        form.reset();
        setVal('con-form-edit-index', '');
        setVal('con-form-type', 'Potion');
        setVal('con-form-qty', 1);
      }

      modal.classList.remove('hidden');
      document.getElementById('con-form-name')?.focus();
    }

    closeConsumableModal() {
      document.getElementById('consumable-modal')?.classList.add('hidden');
    }

    saveConsumableFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!Array.isArray(char.consumables)) char.consumables = [];

      const indexStr = document.getElementById('con-form-edit-index')?.value;
      const name = (document.getElementById('con-form-name')?.value || '').trim();
      if (!name) return;

      const type = (document.getElementById('con-form-type')?.value || 'Potion').trim();
      const qty = parseInt(document.getElementById('con-form-qty')?.value, 10) || 1;
      const healFormula = (document.getElementById('con-form-heal')?.value || '').trim();
      const damageFormula = (document.getElementById('con-form-dmg')?.value || '').trim();
      const notes = (document.getElementById('con-form-notes')?.value || '').trim();

      const conData = { name, type, qty, notes };
      if (healFormula) conData.healFormula = healFormula;
      if (damageFormula) conData.damageFormula = damageFormula;

      if (indexStr !== '' && !isNaN(parseInt(indexStr, 10))) {
        const idx = parseInt(indexStr, 10);
        conData.id = char.consumables[idx]?.id || `con_${Date.now()}`;
        if (char.consumables[idx]?.bonus !== undefined) {
          conData.bonus = char.consumables[idx].bonus;
        }
        char.consumables[idx] = conData;
      } else {
        conData.id = `con_${Date.now()}`;
        char.consumables.push(conData);
      }

      this.saveStorage();
      this.closeConsumableModal();
      this.renderTabContent();
    }

    // SPELL SLOT MODAL
    openSlotModal(level = null) {
      const char = this.getActiveCharacter();
      if (!char) return;
      const modal = document.getElementById('slot-modal');
      const form = document.getElementById('slot-modal-form');
      const title = document.getElementById('slot-modal-title');
      const levelSelect = document.getElementById('slot-form-level');
      const maxInput = document.getElementById('slot-form-max');
      const editInput = document.getElementById('slot-form-edit-level');
      if (!modal || !form) return;

      if (level !== null && level !== undefined && char.spellSlots && char.spellSlots[level]) {
        const lvlStr = String(level);
        const ordinal = lvlStr === '1' ? '1st' : lvlStr === '2' ? '2nd' : lvlStr === '3' ? '3rd' : `${lvlStr}th`;
        if (title) title.textContent = `Configure ${ordinal} Level Spell Slots`;
        if (editInput) editInput.value = lvlStr;
        if (levelSelect) {
          levelSelect.value = lvlStr;
          levelSelect.disabled = true;
        }
        if (maxInput) maxInput.value = char.spellSlots[lvlStr]?.max || 1;
      } else {
        if (title) title.textContent = 'Add Spell Slot Level';
        if (editInput) editInput.value = '';
        if (levelSelect) {
          levelSelect.disabled = false;
          let chosen = '1';
          if (char.spellSlots) {
            for (let i = 1; i <= 9; i++) {
              if (!char.spellSlots[String(i)]) {
                chosen = String(i);
                break;
              }
            }
          }
          levelSelect.value = chosen;
        }
        if (maxInput) maxInput.value = '2';
      }

      modal.classList.remove('hidden');
      maxInput?.focus();
    }

    closeSlotModal() {
      const modal = document.getElementById('slot-modal');
      if (modal) modal.classList.add('hidden');
      const levelSelect = document.getElementById('slot-form-level');
      if (levelSelect) levelSelect.disabled = false;
    }

    saveSlotFromModal(e) {
      if (e) e.preventDefault();
      const char = this.getActiveCharacter();
      if (!char) return;
      if (!char.spellSlots || typeof char.spellSlots !== 'object') char.spellSlots = {};

      const editInput = document.getElementById('slot-form-edit-level');
      const levelSelect = document.getElementById('slot-form-level');
      const maxInput = document.getElementById('slot-form-max');

      const lvl = (editInput && editInput.value) ? editInput.value : (levelSelect ? levelSelect.value : '1');
      const max = Math.max(1, parseInt(maxInput?.value, 10) || 1);

      if (char.spellSlots[lvl]) {
        char.spellSlots[lvl].max = max;
        if (char.spellSlots[lvl].used > max) char.spellSlots[lvl].used = max;
      } else {
        char.spellSlots[lvl] = { max, used: 0 };
      }

      this.saveStorage();
      this.closeSlotModal();
      const container = document.getElementById('char-tab-view');
      if (container) this.renderEquipmentTab(container, char);
      window.showToast?.(`Spell slots updated for Level ${lvl}`, 'success', 2000);
    }

    renderRosterBar() {
      const rosterContainer = document.getElementById('char-roster-list');
      if (!rosterContainer) return;

      const beforeLen = this.characters.length;
      this.characters = this.sanitizeCharacters(this.characters);
      if (this.characters.length !== beforeLen) {
        this.saveStorage(true);
      }

      rosterContainer.innerHTML = '';
      this.characters.forEach(char => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `char-roster-pill ${char.id === this.activeCharId ? 'is-active' : ''}`;
        btn.innerHTML = `
          <span class="char-pill-name">${escapeHtml(char.name)}</span>
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
        editBtn.textContent = this.isEditMode ? 'Done Editing' : 'Edit Sheet';
        editBtn.classList.toggle('is-editing-active', this.isEditMode);
      }

      // Render Persona
      this.renderPersona(char);

      // Render Vitals & Combat Header
      this.renderVitals(char);

      // Render Ability Scores & Associated Skills
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
            <span class="persona-tag"><strong>Race:</strong> ${escapeHtml(char.heritage || 'Human')}</span>
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
          <div class="persona-row persona-row-secondary" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="display: flex; gap: 1rem; flex: 1;">
              <div class="persona-field">
                <label for="char-heritage-input">Race</label>
                <input type="text" id="char-heritage-input" class="persona-input" value="${escapeHtml(char.heritage || '')}" placeholder="e.g. Human" />
              </div>
              <div class="persona-field">
                <label for="char-align-input">Alignment</label>
                <input type="text" id="char-align-input" class="persona-input" value="${escapeHtml(char.alignment || '')}" placeholder="e.g. Chaotic Good" />
              </div>
            </div>
            ${this.characters.length > 1 ? `
              <button type="button" class="btn btn-ghost btn-sm" id="btn-delete-active-char" style="color: #f87171; border-color: rgba(248,113,113,0.3); margin-bottom: 2px;" title="Permanently remove this character">Delete Character</button>
            ` : ''}
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

        container.querySelector('#btn-delete-active-char')?.addEventListener('click', () => {
          if (confirm(`Are you sure you want to delete "${char.name}" from the party roster?`)) {
            this.characters = this.characters.filter(c => c.id !== char.id);
            this.activeCharId = this.characters[0] ? this.characters[0].id : null;
            this.saveStorage(true);
            this.renderRosterBar();
            this.renderCurrentSheet();
            window.showToast?.(`Deleted "${char.name}"`, 'info', 2000);
          }
        });
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
            <button type="button" class="btn btn-secondary btn-xs" id="char-roll-init-btn">Roll Init</button>
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
            <button type="button" class="btn btn-secondary btn-xs death-roll-btn" id="char-roll-death-save-btn" title="Roll raw 1d20 Death Saving Throw">Roll d20</button>
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
            <button type="button" class="btn btn-secondary btn-xs death-roll-btn" id="char-roll-death-save-btn" title="Roll raw 1d20 Death Saving Throw">Roll d20</button>
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
          this.renderAbilityScores(char);
          this.renderTabContent();
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

    // 3. ABILITY SCORES & GROUPED SKILLS (CLICK-BONUS-TO-ROLL vs EDIT)
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
        const isSaveProf = Array.isArray(stats.saveProfs) && stats.saveProfs.includes(ab);
        const saveMod = mod + (isSaveProf ? profBonus : 0);
        const saveModStr = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;

        // Column for this ability (top: stat box, bottom: skills list)
        const col = document.createElement('div');
        col.className = 'char-ability-col';

        // 1. Large Main Stat Box
        const card = document.createElement('div');

        if (!this.isEditMode) {
          // Play Mode: entire box rolls ability check
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
            ${isSaveProf ? `<button type="button" class="stat-save-badge-play" title="Click to roll ${fullNames[ab]} Save (+${saveMod})">Save ${saveModStr}</button>` : ''}
          `;

          card.addEventListener('click', () => {
            if (window.DiceRoller) {
              window.DiceRoller.roll('1d20', `${fullNames[ab]} Check`, char.name, 'normal', mod);
            }
          });

          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (window.DiceRoller) {
                window.DiceRoller.roll('1d20', `${fullNames[ab]} Check`, char.name, 'normal', mod);
              }
            }
          });

          const saveBadge = card.querySelector('.stat-save-badge-play');
          saveBadge?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.DiceRoller) {
              window.DiceRoller.roll('1d20', `${fullNames[ab]} Save`, char.name, 'normal', saveMod);
            }
          });
        } else {
          // Edit Mode: typable score and save proficiency checkbox
          card.className = 'char-stat-card char-stat-card-editing';
          card.innerHTML = `
            <div class="stat-card-title">${abNames[ab]}</div>
            <div class="stat-card-mod">${modStr}</div>
            <div class="stat-card-base">
              <span>Score:</span>
              <input type="number" class="stat-score-input" value="${score}" min="1" max="30" data-stat="${ab}" />
            </div>
            <label class="stat-save-toggle-label">
              <input type="checkbox" class="stat-save-prof-check" data-stat="${ab}" ${isSaveProf ? 'checked' : ''} />
              <span>Save Prof (+${profBonus})</span>
            </label>
          `;

          const scoreInput = card.querySelector('.stat-score-input');
          scoreInput?.addEventListener('change', (e) => {
            stats[ab] = parseInt(e.target.value, 10) || 10;
            this.saveStorage();
            this.renderAbilityScores(char);
            this.renderTabContent();
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
            this.renderAbilityScores(char);
          });
        }

        col.appendChild(card);

        // 2. Associated Skills List right under this stat box
        const skills = SKILLS_BY_STAT[ab] || [];
        const skillsList = document.createElement('div');
        skillsList.className = 'stat-skills-list';

        if (skills.length === 0) {
          skillsList.innerHTML = `<div class="stat-skills-empty">—</div>`;
        } else {
          skills.forEach(skill => {
            const isSkillProf = this.isSkillProficient(char, skill.id);
            const skillTotalMod = mod + (isSkillProf ? profBonus : 0);
            const skillModStr = skillTotalMod >= 0 ? `+${skillTotalMod}` : `${skillTotalMod}`;

            if (!this.isEditMode) {
              const row = document.createElement('div');
              row.className = `stat-skill-row stat-skill-play ${isSkillProf ? 'is-proficient' : ''}`;
              row.tabIndex = 0;
              row.setAttribute('role', 'button');
              row.title = `Click to roll ${skill.name} Check (${abNames[ab]}) ${skillModStr} [${abNames[ab]} ${modStr}${isSkillProf ? ` + PB +${profBonus}` : ''}]`;
              row.innerHTML = `
                <div class="stat-skill-label">
                  <span class="skill-pip" aria-hidden="true"></span>
                  <span class="skill-name">${skill.name}</span>
                </div>
                <span class="skill-mod">${skillModStr}</span>
              `;

              const triggerSkillRoll = (e) => {
                e.stopPropagation();
                if (window.DiceRoller) {
                  window.DiceRoller.roll('1d20', `${skill.name} Check (${abNames[ab]})`, char.name, 'normal', skillTotalMod);
                }
              };

              row.addEventListener('click', triggerSkillRoll);
              row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerSkillRoll(e);
                }
              });

              skillsList.appendChild(row);
            } else {
              // Edit Mode: Checkbox to toggle skill proficiency
              const row = document.createElement('label');
              row.className = `stat-skill-row stat-skill-edit ${isSkillProf ? 'is-proficient' : ''}`;
              row.innerHTML = `
                <div class="stat-skill-label">
                  <input type="checkbox" class="skill-edit-check" data-skill-id="${skill.id}" ${isSkillProf ? 'checked' : ''} />
                  <span class="skill-name">${skill.name}</span>
                </div>
                <span class="skill-mod">${skillModStr}</span>
              `;

              const checkbox = row.querySelector('.skill-edit-check');
              checkbox?.addEventListener('change', (e) => {
                this.setSkillProficient(char, skill.id, e.target.checked);
                this.saveStorage();
                this.renderAbilityScores(char);
              });

              skillsList.appendChild(row);
            }
          });
        }

        col.appendChild(skillsList);
        container.appendChild(col);
      });
    }

    // 4. CORE CONSOLIDATED TABS (Equipment & Manifests, Divions & Feats, Items & Gold, Lore & Notes)
    renderTabContent() {
      const char = this.getActiveCharacter();
      if (!char) return;

      const viewContainer = document.getElementById('char-tab-view');
      if (!viewContainer) return;

      switch (this.activeTab) {
        case 'equipment':
          this.renderEquipmentTab(viewContainer, char);
          break;
        case 'divions':
          this.renderDivionsTab(viewContainer, char);
          break;
        case 'items':
          this.renderItemsTab(viewContainer, char);
          break;
        case 'notes':
          this.renderNotesTab(viewContainer, char);
          break;
        default:
          this.renderEquipmentTab(viewContainer, char);
      }
    }

    // TAB 1: EQUIPMENT & MANIFESTS (Weapons, Magic Items, Carried Gear, Spell Slots & Spellbook)
    renderEquipmentTab(container, char) {
      if (!Array.isArray(char.attacks)) char.attacks = [];
      if (!Array.isArray(char.magicItems)) char.magicItems = [];
      if (!Array.isArray(char.equipment)) char.equipment = [];
      if (!char.spellSlots || typeof char.spellSlots !== 'object') char.spellSlots = {};
      if (!Array.isArray(char.spellsKnown)) char.spellsKnown = [];
      if (!Array.isArray(char.spellsPrepared)) char.spellsPrepared = [];

      // 1. Attacks & Combat Weapons
      let attacksHtml = '';
      if (char.attacks.length === 0) {
        attacksHtml = `<div class="char-empty-msg">No weapons or combat actions registered.${this.isEditMode ? ' Click "Add Weapon / Action" to register!' : ''}</div>`;
      } else {
        attacksHtml = char.attacks.map((atk, index) => {
          const atkBonus = this.computeAttackBonus(char, atk);
          const bonusStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;
          const dmgFormula = this.computeDamageFormula(char, atk);
          const abilityBadge = (atk.ability && atk.ability !== 'none') ? `<span class="atk-stat-pill">+${atk.ability.toUpperCase()}</span>` : '';

          return `
          <div class="char-item-card char-atk-card" data-index="${index}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="attack" data-index="${index}" title="Click to share action to party Roll Log">${escapeHtml(atk.name)}</strong>
                ${abilityBadge}
              </div>
              <div class="item-card-controls">
                <button type="button" class="char-item-edit-btn" data-type="attack" data-index="${index}" title="Edit Weapon / Action">Edit</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="attack" data-index="${index}" title="Remove Weapon / Action">✕</button>` : ''}
              </div>
            </div>
            <div class="atk-card-details">
              <span class="atk-bonus-badge">Atk: ${bonusStr}</span>
              <span class="atk-damage-badge">${escapeHtml(dmgFormula)} ${escapeHtml(atk.damageType || '')}</span>
            </div>
            ${atk.notes ? `<p class="item-card-notes">${escapeHtml(atk.notes)}</p>` : ''}
            <div class="atk-roll-buttons">
              <button type="button" class="btn btn-secondary btn-sm atk-roll-atk-btn" data-index="${index}">
                Roll Attack (${bonusStr})
              </button>
              <button type="button" class="btn btn-secondary btn-sm atk-roll-dmg-btn" data-index="${index}">
                Roll Damage (${escapeHtml(dmgFormula)})
              </button>
            </div>
          </div>
        `;
        }).join('');
      }

      // 2. Magic Items & Relics
      let magicHtml = '';
      if (char.magicItems.length === 0) {
        magicHtml = `<div class="char-empty-msg">No magic items or relics registered.${this.isEditMode ? ' Click "Add Magic Item" to register!' : ''}</div>`;
      } else {
        magicHtml = char.magicItems.map((item, index) => `
          <div class="char-item-card char-magic-card" data-index="${index}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="magic" data-index="${index}" title="Click to share relic details to party Roll Log">${escapeHtml(item.name)}</strong>
                <span class="magic-rarity-badge">${escapeHtml(item.rarity || 'Uncommon')}</span>
                ${item.attuned ? '<span class="magic-attuned-badge">Attuned</span>' : ''}
              </div>
              <div class="item-card-controls">
                <button type="button" class="char-item-edit-btn" data-type="magic" data-index="${index}" title="Edit Magic Item">Edit</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="magic" data-index="${index}" title="Remove Magic Item">✕</button>` : ''}
              </div>
            </div>
            ${item.charges ? `<div class="magic-charges"><strong>Charges:</strong> ${escapeHtml(item.charges)}</div>` : ''}
            <div class="magic-desc">${escapeHtml(item.description || '')}</div>
          </div>
        `).join('');
      }

      // 3. Worn Armor & Standard Equipment
      let eqHtml = '';
      if (char.equipment.length === 0) {
        eqHtml = `<div class="char-empty-msg">No armor or general equipment recorded.${this.isEditMode ? ' Click "Add Equipment / Gear" to register!' : ''}</div>`;
      } else {
        eqHtml = char.equipment.map((eq, index) => `
          <div class="char-eq-row">
            <span class="eq-qty">x${eq.qty || 1}</span>
            <span class="eq-name item-shareable-title" data-share-type="equipment" data-index="${index}" title="Click to share item to party Roll Log">${escapeHtml(eq.name)}</span>
            <span class="eq-notes">${escapeHtml(eq.notes || '')}</span>
            <div class="item-card-controls" style="display:inline-flex; align-items:center;">
              <button type="button" class="char-item-edit-btn" data-type="equipment" data-index="${index}" title="Edit Gear">Edit</button>
              ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="equipment" data-index="${index}" title="Remove Gear">✕</button>` : ''}
            </div>
          </div>
        `).join('');
      }

      // 4. Spell Slots Tracker
      const slotLevels = Object.keys(char.spellSlots).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      let slotRowsHtml = '';
      if (slotLevels.length === 0) {
        slotRowsHtml = `<div class="char-empty-msg">No spell slots configured.${this.isEditMode ? ' Click "+ Add Slot Level" below to add slots!' : ''}</div>`;
      } else {
        slotRowsHtml = slotLevels.map(lvl => {
          const slot = char.spellSlots[lvl] || { max: 0, used: 0 };
          const max = slot.max || 0;
          const used = Math.min(slot.used || 0, max);
          const available = Math.max(0, max - used);
          const lvlLabel = lvl === '1' ? '1st' : lvl === '2' ? '2nd' : lvl === '3' ? '3rd' : `${lvl}th`;
          let pips = '';
          for (let i = 0; i < max; i++) {
            const isUsed = i >= (max - used);
            pips += `<button type="button" class="slot-pip ${isUsed ? 'is-used' : ''}" data-slot-level="${lvl}" data-pip-index="${i}" title="${isUsed ? 'Slot Expended (Click to restore)' : 'Slot Available (Click to expend)'}"></button>`;
          }
          return `
            <div class="slot-level-row">
              <div class="slot-level-info">
                <span class="slot-level-badge">${lvlLabel} Level</span>
                <span class="slot-avail-counter">${available} / ${max} left</span>
              </div>
              <div class="slot-pips-strip">
                ${pips}
              </div>
              ${this.isEditMode ? `
                <div class="slot-edit-controls">
                  <button type="button" class="btn btn-ghost btn-xs btn-slot-edit" data-slot-level="${lvl}" title="Configure max slots">⚙</button>
                  <button type="button" class="btn btn-ghost btn-xs btn-slot-dec" data-slot-level="${lvl}" title="Decrease max slots">-</button>
                  <button type="button" class="btn btn-ghost btn-xs btn-slot-inc" data-slot-level="${lvl}" title="Increase max slots">+</button>
                  <button type="button" class="char-item-del-btn" data-type="slot-level" data-slot-level="${lvl}" title="Delete slot level">✕</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }

      // 5. Prepared Spells & Spellbook Cards
      const grimoire = window.Grimoire;
      const allKnown = Array.from(new Set([...char.spellsKnown, ...char.spellsPrepared]));
      let spellsHtml = '';
      if (allKnown.length === 0) {
        spellsHtml = `
          <div class="char-empty-msg">
            No spells currently inscribed in ${escapeHtml(char.name)}'s spellbook.
            <div style="margin-top: 0.6rem;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-grimoire-empty">
                Browse Grimoire to Inscribe Spells
              </button>
            </div>
          </div>
        `;
      } else {
        const spellCards = allKnown.map(name => {
          const normKey = grimoire ? grimoire.normalizeSpellKey(name) : name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const found = grimoire && grimoire.allSpells ? grimoire.allSpells.find(s => grimoire.normalizeSpellKey(s.name) === normKey) : null;
          const isPrep = char.spellsPrepared.some(p => (grimoire ? grimoire.normalizeSpellKey(p) : p.toLowerCase().replace(/[^a-z0-9]/g, '')) === normKey);
          const level = found ? found.level : 1;
          const school = found ? found.school : 'Arcane';
          const isCantrip = level === 0;
          const castingTime = found ? found.castingTime : '1 action';
          const range = found ? found.range : '60 feet';
          const duration = found ? found.duration : 'Instantaneous';
          const damageFormula = found ? found.damageFormula : '';
          const damageType = found ? found.damageType : '';
          const concentration = found ? !!found.concentration : false;
          const ritual = found ? !!found.ritual : false;
          const description = found ? (found.description || found.desc || '') : '';
          const levelLabel = isCantrip ? 'Cantrip' : `${level}${level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'} Level`;

          return {
            name,
            level,
            school,
            isCantrip,
            castingTime,
            range,
            duration,
            damageFormula,
            damageType,
            concentration,
            ritual,
            description,
            levelLabel,
            isPrep: isCantrip ? true : isPrep
          };
        });

        spellCards.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

        spellsHtml = spellCards.map(sp => `
          <div class="char-item-card char-spell-card ${sp.isPrep ? 'is-prepared' : ''}" data-spell-name="${escapeHtml(sp.name)}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="spell" data-spell-name="${escapeHtml(sp.name)}" title="Click to share spell details to party Roll Log">
                  ${escapeHtml(sp.name)}
                </strong>
                <span class="spell-level-badge">${sp.levelLabel} ${escapeHtml(sp.school || '')}</span>
                ${sp.concentration ? '<span class="spell-tag-badge spell-tag--conc" title="Requires Concentration">C</span>' : ''}
                ${sp.ritual ? '<span class="spell-tag-badge spell-tag--ritual" title="Ritual Castable">R</span>' : ''}
              </div>
              <div class="spell-prep-toggle-group">
                ${sp.isCantrip ? '<span class="spell-cantrip-badge">Cantrip</span>' : `
                  <label class="spell-prep-checkbox-label" title="Toggle prepared status for this spell">
                    <input type="checkbox" class="spell-prep-checkbox" data-spell-name="${escapeHtml(sp.name)}" ${sp.isPrep ? 'checked' : ''} />
                    <span>Prepared</span>
                  </label>
                `}
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="spell" data-spell-name="${escapeHtml(sp.name)}" title="Remove from Spellbook">✕</button>` : ''}
              </div>
            </div>
            <div class="spell-meta-quick">
              <span><strong>Time:</strong> ${escapeHtml(sp.castingTime)}</span>
              <span><strong>Range:</strong> ${escapeHtml(sp.range)}</span>
              <span><strong>Duration:</strong> ${escapeHtml(sp.duration)}</span>
            </div>
            ${sp.description ? `<p class="item-card-notes spell-short-desc">${escapeHtml(sp.description.slice(0, 140))}${sp.description.length > 140 ? '...' : ''}</p>` : ''}
            <div class="atk-roll-buttons spell-card-actions">
              <button type="button" class="btn btn-secondary btn-sm char-spell-cast-btn" data-spell-name="${escapeHtml(sp.name)}" data-spell-level="${sp.level}">
                Cast Spell
              </button>
              ${sp.damageFormula ? `
                <button type="button" class="btn btn-secondary btn-sm char-spell-dmg-btn" data-spell-name="${escapeHtml(sp.name)}" data-damage-formula="${escapeHtml(sp.damageFormula)}" data-damage-type="${escapeHtml(sp.damageType || '')}">
                  Roll Damage (${escapeHtml(sp.damageFormula)})
                </button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-tab-intro">
          <p class="tab-subtitle-lead">All weapons, combat strikes, enchanted relics, durable carried equipment, and arcane spells.</p>
        </div>

        <!-- Section 1: Weapons & Strikes -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Weapons & Combat Strikes</h3>
              <p class="section-subtitle">Weapons, unarmed strikes, smites, and physical actions ready to roll</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-attack">+ Add Weapon / Action</button>` : ''}
          </div>
          <div class="char-cards-grid">${attacksHtml}</div>
        </div>

        <!-- Section 2: Spell Slots & Prepared Spells -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Arcane Grimoire & Spell Slots</h3>
              <p class="section-subtitle">Expendable spell slot pools, daily prepared spells, and castable cantrips</p>
            </div>
            <div class="char-section-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-long-rest-slots" title="Restore all expended spell slots">
                Long Rest (Restore Slots)
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-browse-grimoire" title="Browse Grimoire Compendium">
                Browse Grimoire
              </button>
              ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-slot-level">+ Add Slot Level</button>` : ''}
            </div>
          </div>

          <!-- Slots Tracker Widget -->
          <div class="char-slots-tracker-box">
            <div class="slots-levels-grid">${slotRowsHtml}</div>
          </div>

          <!-- Inscribed Spells Grid -->
          <div class="char-cards-grid" style="margin-top: 1rem;">${spellsHtml}</div>
        </div>

        <!-- Section 3: Magic Items & Relics -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Magic Items & Relics</h3>
              <p class="section-subtitle">Attuned artifacts, enchanted armor, foci, and wondrous gear</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-magic">+ Add Magic Item</button>` : ''}
          </div>
          <div class="char-cards-grid">${magicHtml}</div>
        </div>

        <!-- Section 4: Worn Armor & Gear -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Worn Armor & Carried Gear</h3>
              <p class="section-subtitle">Armor, shields, tools, apparel, and durable non-consumables</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-eq">+ Add Equipment / Gear</button>` : ''}
          </div>
          <div class="char-eq-list">${eqHtml}</div>
        </div>
      `;

      // Attack roll listeners (Single-click rolls vs target if selected; double-click rolls untargeted)
      container.querySelectorAll('.atk-roll-atk-btn').forEach(btn => {
        let clickTimer = null;
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const atk = char.attacks[idx];
          if (!atk || !window.DiceRoller) return;

          const bonus = this.computeAttackBonus(char, atk);

          if (clickTimer) {
            // Double click: bypass targeting
            clearTimeout(clickTimer);
            clickTimer = null;
            window.DiceRoller.roll('1d20', `${atk.name} Attack (Untargeted)`, char.name, 'normal', bonus);
          } else {
            clickTimer = setTimeout(() => {
              clickTimer = null;
              const target = window.InitiativeTracker?.getSelectedTarget?.();
              const targetSuffix = target ? ` vs ${target.name}` : '';
              window.DiceRoller.roll('1d20', `${atk.name} Attack${targetSuffix}`, char.name, 'normal', bonus);
            }, 260);
          }
        });
      });

      container.querySelectorAll('.atk-roll-dmg-btn').forEach(btn => {
        let clickTimer = null;
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const atk = char.attacks[idx];
          if (!atk || !window.DiceRoller) return;

          const formula = this.computeDamageFormula(char, atk);
          const name = atk.name || 'Weapon';
          const dmgType = atk.damageType || '';

          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            window.DiceRoller.roll(formula, `${name} Damage (${dmgType || 'Damage'}) (Untargeted)`, char.name, 'normal', 0);
          } else {
            clickTimer = setTimeout(() => {
              clickTimer = null;
              const target = window.InitiativeTracker?.getSelectedTarget?.();
              const targetSuffix = target ? ` vs ${target.name}` : '';
              window.DiceRoller.roll(formula, `${name} Damage (${dmgType || 'Damage'})${targetSuffix}`, char.name, 'normal', 0);
            }, 260);
          }
        });
      });

      // Spell Slot Pip listeners (Interactive slot clicking, consuming right-to-left)
      container.querySelectorAll('.slot-pip').forEach(pip => {
        pip.addEventListener('click', () => {
          const lvl = pip.dataset.slotLevel;
          const slot = char.spellSlots[lvl];
          if (!slot) return;
          const pipIdx = parseInt(pip.dataset.pipIndex, 10);
          if (pip.classList.contains('is-used')) {
            slot.used = Math.max(0, slot.max - pipIdx - 1);
            this.playHpSound(2);
          } else {
            slot.used = Math.min(slot.max, slot.max - pipIdx);
            this.playHpSound(1);
          }
          this.saveStorage();
          this.renderEquipmentTab(container, char);
        });
      });

      // Long Rest (Restore Slots)
      container.querySelector('#btn-long-rest-slots')?.addEventListener('click', () => {
        let restored = 0;
        Object.keys(char.spellSlots).forEach(lvl => {
          restored += char.spellSlots[lvl].used || 0;
          char.spellSlots[lvl].used = 0;
        });
        this.playHpSound(3);
        window.showToast?.(`Long Rest completed! ${restored} spell slot(s) restored.`, 'success', 2200);
        this.saveStorage();
        this.renderEquipmentTab(container, char);
      });

      // Browse Grimoire button listeners
      const openGrimoire = () => {
        if (window.setAppMode) window.setAppMode('grimoire');
      };
      container.querySelector('#btn-browse-grimoire')?.addEventListener('click', openGrimoire);
      container.querySelector('#btn-browse-grimoire-empty')?.addEventListener('click', openGrimoire);

      // Spell Prepared checkbox listener
      container.querySelectorAll('.spell-prep-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const spellName = cb.dataset.spellName;
          const g = window.Grimoire;
          const normKey = g ? g.normalizeSpellKey(spellName) : spellName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cb.checked) {
            if (!char.spellsPrepared.some(p => (g ? g.normalizeSpellKey(p) : p.toLowerCase().replace(/[^a-z0-9]/g, '')) === normKey)) {
              char.spellsPrepared.push(spellName);
            }
          } else {
            char.spellsPrepared = char.spellsPrepared.filter(p => (g ? g.normalizeSpellKey(p) : p.toLowerCase().replace(/[^a-z0-9]/g, '')) !== normKey);
          }
          this.playHpSound(1);
          this.saveStorage();
          this.renderEquipmentTab(container, char);
        });
      });

      // Spell Cast button listener
      container.querySelectorAll('.char-spell-cast-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const spellName = btn.dataset.spellName;
          const lvl = parseInt(btn.dataset.spellLevel, 10) || 0;
          const g = window.Grimoire;
          const normKey = g ? g.normalizeSpellKey(spellName) : spellName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const spell = g && g.allSpells ? g.allSpells.find(s => g.normalizeSpellKey(s.name) === normKey) : null;

          let slotExpendedMsg = '';
          if (lvl > 0 && char.spellSlots && char.spellSlots[lvl]) {
            const slot = char.spellSlots[lvl];
            if (slot.used < slot.max) {
              slot.used++;
              const remaining = slot.max - slot.used;
              slotExpendedMsg = ` (Expended ${lvl}${lvl === 1 ? 'st' : lvl === 2 ? 'nd' : lvl === 3 ? 'rd' : 'th'} level slot, ${remaining} left)`;
              this.saveStorage();
            } else {
              if (!confirm(`You have no ${lvl}-level spell slots remaining! Cast ${spellName} anyway?`)) {
                return;
              }
            }
          }

          if (spell && g) {
            g.shareSpell(spell);
          } else {
            window.DiceRoller?.shareItem?.({
              name: spellName,
              roller: char.name,
              category: 'SPELL CAST',
              sourceType: 'spell',
              badges: [{ label: lvl === 0 ? 'Cantrip' : `${lvl}-Level Spell`, cls: 'prop-school' }],
              description: `Cast ${spellName}${slotExpendedMsg}`
            });
          }

          this.playHpSound(2);
          window.showToast?.(`Cast ${spellName}!${slotExpendedMsg}`, 'info', 2200);
          this.renderEquipmentTab(container, char);
        });
      });

      // Spell Damage button listener
      container.querySelectorAll('.char-spell-dmg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const formula = btn.dataset.damageFormula;
          const dmgType = btn.dataset.damageType;
          const name = btn.dataset.spellName;
          const target = window.InitiativeTracker?.getSelectedTarget?.();
          const targetSuffix = target ? ` vs ${target.name}` : '';
          if (window.DiceRoller) {
            window.DiceRoller.roll(formula, `${name} Damage (${dmgType || 'Damage'})${targetSuffix}`, char.name, 'normal', 0);
          }
        });
      });

      // Item Edit button listeners (Available in both play and edit modes)
      container.querySelectorAll('.char-item-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          const idx = parseInt(btn.dataset.index, 10);
          if (type === 'attack') this.openAttackModal(idx);
          else if (type === 'magic') this.openMagicItemModal(idx);
          else if (type === 'equipment') this.openEquipmentModal(idx);
        });
      });

      // Edit Mode handlers
      if (this.isEditMode) {
        container.querySelector('#btn-add-attack')?.addEventListener('click', () => {
          this.openAttackModal(null);
        });

        container.querySelector('#btn-add-magic')?.addEventListener('click', () => {
          this.openMagicItemModal(null);
        });

        container.querySelector('#btn-add-eq')?.addEventListener('click', () => {
          this.openEquipmentModal(null);
        });

        container.querySelector('#btn-add-slot-level')?.addEventListener('click', () => {
          this.openSlotModal(null);
        });

        container.querySelectorAll('.btn-slot-edit').forEach(btn => {
          btn.addEventListener('click', () => {
            const lvl = btn.dataset.slotLevel;
            this.openSlotModal(lvl);
          });
        });

        container.querySelectorAll('.btn-slot-inc').forEach(btn => {
          btn.addEventListener('click', () => {
            const lvl = btn.dataset.slotLevel;
            if (char.spellSlots[lvl]) {
              char.spellSlots[lvl].max = (char.spellSlots[lvl].max || 0) + 1;
              this.saveStorage();
              this.renderEquipmentTab(container, char);
            }
          });
        });

        container.querySelectorAll('.btn-slot-dec').forEach(btn => {
          btn.addEventListener('click', () => {
            const lvl = btn.dataset.slotLevel;
            if (char.spellSlots[lvl] && char.spellSlots[lvl].max > 1) {
              char.spellSlots[lvl].max--;
              if (char.spellSlots[lvl].used > char.spellSlots[lvl].max) {
                char.spellSlots[lvl].used = char.spellSlots[lvl].max;
              }
              this.saveStorage();
              this.renderEquipmentTab(container, char);
            }
          });
        });

        container.querySelectorAll('.char-item-del-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const idx = parseInt(btn.dataset.index, 10);
            if (type === 'attack') {
              if (confirm(`Remove "${char.attacks[idx].name}"?`)) {
                char.attacks.splice(idx, 1);
                this.saveStorage();
                this.renderEquipmentTab(container, char);
              }
            } else if (type === 'magic') {
              if (confirm(`Remove "${char.magicItems[idx].name}"?`)) {
                char.magicItems.splice(idx, 1);
                this.saveStorage();
                this.renderEquipmentTab(container, char);
              }
            } else if (type === 'equipment') {
              char.equipment.splice(idx, 1);
              this.saveStorage();
              this.renderEquipmentTab(container, char);
            } else if (type === 'slot-level') {
              const lvl = btn.dataset.slotLevel;
              if (confirm(`Delete ${lvl}-level spell slots?`)) {
                delete char.spellSlots[lvl];
                this.saveStorage();
                this.renderEquipmentTab(container, char);
              }
            } else if (type === 'spell') {
              const spellName = btn.dataset.spellName;
              const g = window.Grimoire;
              const normKey = g ? g.normalizeSpellKey(spellName) : spellName.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (confirm(`Remove "${spellName}" from ${char.name}'s spellbook?`)) {
                char.spellsKnown = char.spellsKnown.filter(p => (g ? g.normalizeSpellKey(p) : p.toLowerCase().replace(/[^a-z0-9]/g, '')) !== normKey);
                char.spellsPrepared = char.spellsPrepared.filter(p => (g ? g.normalizeSpellKey(p) : p.toLowerCase().replace(/[^a-z0-9]/g, '')) !== normKey);
                this.saveStorage();
                this.renderEquipmentTab(container, char);
              }
            }
          });
        });
      }
    }
    // TAB 2: DIVIONS, FEATS, & BOONS (Divions & Manifests, Feats & Class Features, DM Boons & Blessings)
    renderDivionsTab(container, char) {
      if (!Array.isArray(char.divions)) char.divions = [];
      if (!Array.isArray(char.feats)) char.feats = [];
      if (!Array.isArray(char.boons)) char.boons = [];

      // 1. Divions & Flow Manifestations
      let divionsHtml = '';
      if (char.divions.length === 0) {
        divionsHtml = `<div class="char-empty-msg">No Divions recorded.${this.isEditMode ? ' Click "+ Add Divion" below to register manifests!' : ''}</div>`;
      } else {
        divionsHtml = char.divions.map((div, index) => `
          <div class="char-item-card char-divion-card">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="divion" data-index="${index}" title="Click to share manifestation lore to party Roll Log">${escapeHtml(div.name)}</strong>
                <span class="divion-badge-type">${escapeHtml(div.type || 'Manifest')}</span>
                <span class="divion-badge-rank">${escapeHtml(div.rank || 'Tier I')}</span>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="btn btn-secondary btn-xs divion-channel-btn" data-index="${index}" title="Channel Flow and announce to party">Channel</button>
                <button type="button" class="char-item-edit-btn" data-type="divion" data-index="${index}" title="Edit Divion">Edit</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="divion" data-index="${index}" title="Remove Divion">✕</button>` : ''}
              </div>
            </div>
            <div class="divion-cost"><strong>Cost:</strong> ${escapeHtml(div.cost || 'None')}</div>
            <div class="divion-manifest"><strong>Manifestation:</strong> ${escapeHtml(div.manifestEffect || '')}</div>
          </div>
        `).join('');
      }

      // 2. Feats & Traits
      let featsHtml = '';
      if (char.feats.length === 0) {
        featsHtml = `<div class="char-empty-msg">No feats or special traits recorded.${this.isEditMode ? ' Click "+ Add Feat / Feature" to register!' : ''}</div>`;
      } else {
        featsHtml = char.feats.map((feat, index) => `
          <div class="char-item-card" data-index="${index}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="feat" data-index="${index}" title="Click to share feat info to party Roll Log">${escapeHtml(feat.name)}</strong>
                <span class="feat-source-badge">${escapeHtml(feat.source || 'Feat')}</span>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="char-item-edit-btn" data-type="feat" data-index="${index}" title="Edit Feat">Edit</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="feat" data-index="${index}" title="Remove Feat">✕</button>` : ''}
              </div>
            </div>
            <div class="feat-desc">${escapeHtml(feat.description || '')}</div>
          </div>
        `).join('');
      }

      // 3. DM Boons & Blessings
      let boonsHtml = '';
      if (char.boons.length === 0) {
        boonsHtml = `<div class="char-empty-msg">No DM boons or divine blessings recorded.${this.isEditMode ? ' Click "+ Add Boon / Blessing" to register!' : ''}</div>`;
      } else {
        boonsHtml = char.boons.map((boon, index) => `
          <div class="char-item-card char-boon-card" data-index="${index}">
            <div class="item-card-header">
              <div>
                <strong class="item-card-title item-shareable-title" data-share-type="boon" data-index="${index}" title="Click to share boon to party Roll Log">${escapeHtml(boon.name)}</strong>
                <span class="boon-granted-by">Granted by: <em>${escapeHtml(boon.grantedBy || 'Dungeon Master')}</em></span>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="char-item-edit-btn" data-type="boon" data-index="${index}" title="Edit Boon">Edit</button>
                ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="boon" data-index="${index}" title="Remove Boon">✕</button>` : ''}
              </div>
            </div>
            <div class="boon-effect">${escapeHtml(boon.effect || '')}</div>
          </div>
        `).join('');
      }

      container.innerHTML = `
        <div class="char-tab-intro">
          <p class="tab-subtitle-lead">Passive arts, divine Flow manifests, class features, racial traits, and special DM blessings.</p>
        </div>

        <!-- Section 1: Divions & Flow Manifestations -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Divions & Flow Manifestations</h3>
              <p class="section-subtitle">Canon Magic System: Channeling Flow through divine domains and personal manifests</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-divion">+ Add Divion</button>` : ''}
          </div>
          <div class="char-cards-grid">${divionsHtml}</div>
        </div>

        <!-- Section 2: Feats, Features & Traits -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Feats, Class Features & Traits</h3>
              <p class="section-subtitle">Passive benefits, racial abilities, specializations, and prepared spells</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-feat">+ Add Feat / Feature</button>` : ''}
          </div>
          <div class="char-cards-grid">${featsHtml}</div>
        </div>

        <!-- Section 3: DM Boons & Blessings -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>DM Boons & Divine Blessings</h3>
              <p class="section-subtitle">Special campaign rewards, patron blessings, and narrative miracles bestowed by the DM</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-boon">+ Add Boon / Blessing</button>` : ''}
          </div>
          <div class="char-cards-grid">${boonsHtml}</div>
        </div>
      `;

      // Divion channel buttons
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

      // Item Edit button listeners (Available in both play and edit modes)
      container.querySelectorAll('.char-item-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          const idx = parseInt(btn.dataset.index, 10);
          if (type === 'divion') this.openDivionModal(idx);
          else if (type === 'feat') this.openFeatModal(idx);
          else if (type === 'boon') this.openBoonModal(idx);
        });
      });

      // Edit Mode handlers
      if (this.isEditMode) {
        container.querySelector('#btn-add-divion')?.addEventListener('click', () => {
          this.openDivionModal(null);
        });

        container.querySelector('#btn-add-feat')?.addEventListener('click', () => {
          this.openFeatModal(null);
        });

        container.querySelector('#btn-add-boon')?.addEventListener('click', () => {
          this.openBoonModal(null);
        });

        container.querySelectorAll('.char-item-del-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const idx = parseInt(btn.dataset.index, 10);
            if (type === 'divion') {
              if (confirm(`Remove "${char.divions[idx].name}"?`)) {
                char.divions.splice(idx, 1);
                this.saveStorage();
                this.renderDivionsTab(container, char);
              }
            } else if (type === 'feat') {
              if (confirm(`Remove "${char.feats[idx].name}"?`)) {
                char.feats.splice(idx, 1);
                this.saveStorage();
                this.renderDivionsTab(container, char);
              }
            } else if (type === 'boon') {
              if (confirm(`Remove "${char.boons[idx].name}"?`)) {
                char.boons.splice(idx, 1);
                this.saveStorage();
                this.renderDivionsTab(container, char);
              }
            }
          });
        });
      }
    }

    // TAB 3: ITEMS & GOLD (Currencies & Wealth, Potions, Throwing Weapons & Consumables)
    renderItemsTab(container, char) {
      if (!Array.isArray(char.consumables)) char.consumables = [];
      const cur = char.currency || { cp: 0, sp: 0, gp: 0, pp: 0, aetherGems: 0 };

      // 1. Currency Cards
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

      // 2. Consumable Cards
      let consumablesHtml = '';
      if (char.consumables.length === 0) {
        consumablesHtml = `<div class="char-empty-msg">No consumable items or throwing weapons registered.${this.isEditMode ? ' Click "+ Add Consumable Item" below!' : ''}</div>`;
      } else {
        consumablesHtml = char.consumables.map((con, index) => {
          const typeCls = (con.type || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const isHealing = Boolean(con.healFormula || (con.type && con.type.toLowerCase().includes('potion')) || (con.name && con.name.toLowerCase().includes('healing')));
          const hasDamage = Boolean(con.damageFormula);
          const hasBonus = con.bonus !== undefined;

          return `
            <div class="char-item-card char-consumable-card ${con.qty <= 0 ? 'is-depleted' : ''}" data-index="${index}">
              <div class="item-card-header">
                <div>
                  <strong class="item-card-title item-shareable-title" data-share-type="consumable" data-index="${index}" title="Click to share item to party Roll Log">
                    ${escapeHtml(con.name)}
                  </strong>
                  <span class="consumable-badge-type consumable-badge--${typeCls}">${escapeHtml(con.type || 'Consumable')}</span>
                </div>
                <div class="consumable-stepper-box">
                  <div class="consumable-stepper" title="Adjust quantity">
                    <button type="button" class="con-step-btn con-step-minus" data-index="${index}" title="Use / Decrease quantity">-</button>
                    <span class="con-qty-display">${con.qty > 0 ? `x${con.qty}` : '<em class="con-depleted-text">Out</em>'}</span>
                    <button type="button" class="con-step-btn con-step-plus" data-index="${index}" title="Add / Restock quantity">+</button>
                  </div>
                  <button type="button" class="char-item-edit-btn" data-type="consumable" data-index="${index}" title="Edit Item">Edit</button>
                  ${this.isEditMode ? `<button type="button" class="char-item-del-btn" data-type="consumable" data-index="${index}" title="Remove Item">✕</button>` : ''}
                </div>
              </div>

              ${(hasBonus || hasDamage || con.healFormula) ? `
                <div class="con-card-details">
                  ${hasBonus ? `<span class="atk-bonus-badge">Atk: ${con.bonus >= 0 ? '+' + con.bonus : con.bonus}</span>` : ''}
                  ${hasDamage ? `<span class="atk-damage-badge">${escapeHtml(con.damageFormula)} ${escapeHtml(con.damageType || '')}</span>` : ''}
                  ${con.healFormula ? `<span class="con-heal-badge">Heal: ${escapeHtml(con.healFormula)}</span>` : ''}
                </div>
              ` : ''}

              <div class="con-desc">${escapeHtml(con.notes || con.description || '')}</div>

              <div class="con-action-buttons">
                ${isHealing ? `
                  <button type="button" class="btn btn-secondary btn-sm con-drink-btn" data-index="${index}" ${con.qty <= 0 ? 'disabled' : ''} title="Drink potion, roll healing, and decrement quantity">
                    Drink / Heal (${con.healFormula || '2d4+2'})
                  </button>
                ` : ''}
                ${hasDamage ? `
                  <button type="button" class="btn btn-secondary btn-sm con-throw-atk-btn" data-index="${index}" ${con.qty <= 0 ? 'disabled' : ''}>
                    Throw Atk (${hasBonus ? (con.bonus >= 0 ? '+' + con.bonus : con.bonus) : '+0'})
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm con-throw-dmg-btn" data-index="${index}" ${con.qty <= 0 ? 'disabled' : ''}>
                    Throw Dmg (${escapeHtml(con.damageFormula)})
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm con-throw-expend-btn" data-index="${index}" ${con.qty <= 0 ? 'disabled' : ''} title="Expend 1 thrown weapon">
                    Throw (-1)
                  </button>
                ` : ''}
                ${(!isHealing && !hasDamage) ? `
                  <button type="button" class="btn btn-secondary btn-sm con-use-btn" data-index="${index}" ${con.qty <= 0 ? 'disabled' : ''} title="Use item and decrease quantity by 1">
                    Use Item (-1)
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div class="char-tab-intro">
          <p class="tab-subtitle-lead">Consumable items, potions, thrown weapons, and campaign coinage.</p>
        </div>

        <!-- Section 1: Campaign Wealth & Currencies -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Campaign Wealth & Currencies</h3>
              <p class="section-subtitle">Live purse steppers with instant audio feedback and cloud sync</p>
            </div>
          </div>
          <div class="char-currency-panel">
            ${currencyCardsHtml}
          </div>
        </div>

        <!-- Section 2: Consumables & Throwing Weapons -->
        <div class="char-sub-section">
          <div class="char-section-head">
            <div>
              <h3>Potions, Throwing Weapons & Consumables</h3>
              <p class="section-subtitle">Potions, thrown javelins/daggers, adventuring rations, and one-time glyphs</p>
            </div>
            ${this.isEditMode ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-add-consumable">+ Add Consumable Item</button>` : ''}
          </div>
          <div class="char-cards-grid">${consumablesHtml}</div>
        </div>
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
            void input.offsetWidth;
            input.classList.add('pulse-change');
          }

          this.playHpSound(delta);
          this.saveStorage();
        });
      });

      // Consumable Steppers: [-] and [+]
      container.querySelectorAll('.con-step-minus').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (con) {
            con.qty = Math.max(0, (con.qty || 1) - 1);
            this.playHpSound(-1);
            this.saveStorage();
            this.renderItemsTab(container, char);
          }
        });
      });

      container.querySelectorAll('.con-step-plus').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (con) {
            con.qty = (con.qty || 0) + 1;
            this.playHpSound(1);
            this.saveStorage();
            this.renderItemsTab(container, char);
          }
        });
      });

      // Drink / Heal Action
      container.querySelectorAll('.con-drink-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (!con || con.qty <= 0) return;

          const formula = con.healFormula || '2d4+2';
          if (window.DiceRoller) {
            const rollRes = window.DiceRoller.roll(formula, `Drink Potion: ${con.name}`, char.name, 'normal', 0);
            const healed = (rollRes && typeof rollRes.total === 'number') ? rollRes.total : 0;
            if (healed > 0) {
              const vitals = char.vitals || {};
              const curHp = vitals.hpCurrent || 0;
              const maxHp = vitals.hpMax || 1;
              vitals.hpCurrent = Math.min(maxHp, curHp + healed);
              con.qty = Math.max(0, con.qty - 1);
              this.playHpSound(5);
              this.saveStorage();
              this.renderVitals(char);
              this.renderItemsTab(container, char);
            }
          }
        });
      });

      // Thrown Attack & Damage Actions
      container.querySelectorAll('.con-throw-atk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (!con || con.qty <= 0) return;
          if (window.DiceRoller) {
            window.DiceRoller.roll('1d20', `Throw ${con.name} Attack`, char.name, 'normal', con.bonus || 0);
          }
        });
      });

      container.querySelectorAll('.con-throw-dmg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (!con || con.qty <= 0) return;
          if (window.DiceRoller && con.damageFormula) {
            window.DiceRoller.roll(con.damageFormula, `Throw ${con.name} Damage`, char.name, 'normal', 0);
          }
        });
      });

      // Throw expend (-1)
      container.querySelectorAll('.con-throw-expend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (!con || con.qty <= 0) return;
          con.qty = Math.max(0, con.qty - 1);
          this.playHpSound(-1);
          this.saveStorage();
          this.renderItemsTab(container, char);
        });
      });

      // Generic Use Item (-1)
      container.querySelectorAll('.con-use-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          const con = char.consumables[idx];
          if (!con || con.qty <= 0) return;
          con.qty = Math.max(0, con.qty - 1);
          this.playHpSound(-1);
          this.saveStorage();
          this.renderItemsTab(container, char);
        });
      });

      // Item Edit button listeners (Available in both play and edit modes)
      container.querySelectorAll('.char-item-edit-btn[data-type="consumable"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          this.openConsumableModal(idx);
        });
      });

      // Edit Mode Add / Delete Consumables
      if (this.isEditMode) {
        container.querySelector('#btn-add-consumable')?.addEventListener('click', () => {
          this.openConsumableModal(null);
        });

        container.querySelectorAll('.char-item-del-btn[data-type="consumable"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Remove "${char.consumables[idx].name}"?`)) {
              char.consumables.splice(idx, 1);
              this.saveStorage();
              this.renderItemsTab(container, char);
            }
          });
        });
      }
    }

    // TAB 4: LORE & NOTES (Backstory, Campaign Highlights & Allies)
    renderNotesTab(container, char) {
      if (!this.isEditMode) {
        const text = char.notes ? escapeHtml(char.notes).replace(/\n/g, '<br>') : '<em>No notes recorded. Click "Edit Sheet" above to write backstory and session reminders.</em>';
        container.innerHTML = `
          <div class="char-tab-intro">
            <p class="tab-subtitle-lead">Character backstory, personal bonds, campaign reminders, and external Google Doc links.</p>
          </div>
          <div class="char-sub-section">
            <div class="char-section-head">
              <h3>Character Lore & Session Notes</h3>
            </div>
            <div class="char-notes-box char-notes-view">
              <div class="notes-rendered-text">${text}</div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="char-tab-intro">
            <p class="tab-subtitle-lead">Character backstory, personal bonds, campaign reminders, and external Google Doc links.</p>
          </div>
          <div class="char-sub-section">
            <div class="char-section-head">
              <h3>Character Lore & Session Notes</h3>
            </div>
            <div class="char-notes-box">
              <textarea id="char-notes-textarea" class="char-notes-input" placeholder="Write backstory details, campaign reminders, personal goals, and session highlights...">${escapeHtml(char.notes || '')}</textarea>
            </div>
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
        if (item.type === 'share' || item.isShare) {
          const card = document.createElement('div');
          card.className = 'roll-log-card roll-log-share-card';
          const payload = item.itemData || item;
          const badgesHtml = (payload.badges || []).slice(0, 3).map(b => 
            `<span class="roll-log-share-pill ${escapeHtml(b.cls || '')}">${escapeHtml(b.label)}</span>`
          ).join('');

          card.innerHTML = `
            <div class="roll-log-head">
              <strong class="roll-log-roller">${escapeHtml(item.roller)}</strong>
              <span class="roll-log-time">${this.formatTime(item.timestamp)}</span>
            </div>
            <div class="roll-log-share-body">
              <div class="roll-log-share-info">
                <span class="roll-log-share-category">${escapeHtml(item.category || payload.category || 'Shared Item')}</span>
                <strong class="roll-log-share-title">📜 ${escapeHtml(item.label || payload.name)}</strong>
              </div>
              <button type="button" class="roll-log-inspect-btn" title="Inspect item details">Inspect ➔</button>
            </div>
            ${badgesHtml ? `<div class="roll-log-share-badges">${badgesHtml}</div>` : ''}
          `;

          card.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openInspectModal(payload);
          });

          feed.appendChild(card);
          return;
        }

        const card = document.createElement('div');
        const critClass = item.isCrit ? 'is-crit' : (item.isFumble ? 'is-fumble' : '');
        const targetClass = item.targetResult ? (item.targetResult.isHit ? 'has-hit' : 'has-miss') : '';
        card.className = `roll-log-card ${critClass} ${targetClass}`.trim();

        let targetResultHtml = '';
        if (item.targetResult) {
          const tr = item.targetResult;
          targetResultHtml = `
            <div class="roll-log-target-banner ${tr.hitBadgeCls}">
              <span class="roll-log-target-verdict">${escapeHtml(tr.hitText)}</span>
              <span class="roll-log-target-details">vs <strong>${escapeHtml(tr.targetName)}</strong> (${escapeHtml(tr.subText)})</span>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="roll-log-head">
            <strong class="roll-log-roller">${escapeHtml(item.roller)}</strong>
            <span class="roll-log-time">${this.formatTime(item.timestamp)}</span>
          </div>
          <div class="roll-log-body">
            <span class="roll-log-label">${escapeHtml(item.label)}</span>
            <span class="roll-log-total">${item.total}</span>
          </div>
          ${targetResultHtml}
          ${item.isCrit && !item.targetResult ? '<div class="roll-log-tag tag-crit">✨ CRITICAL HIT (NAT 20)</div>' : ''}
          ${item.isFumble && !item.targetResult ? '<div class="roll-log-tag tag-fumble">💀 CRITICAL FUMBLE (NAT 1)</div>' : ''}
          <div class="roll-log-formula">${escapeHtml(item.formula)} ➔ ${escapeHtml(item.detailsText)}</div>
        `;
        feed.appendChild(card);
      });
    }

    shareItemByType(type, index, char, titleEl) {
      if (!char) char = this.getActiveCharacter();
      if (!char) return;

      let item = null;
      let category = 'CHARACTER SHEET';
      const badges = [];
      let description = '';

      if (type === 'attack') {
        item = char.attacks && char.attacks[index];
        if (!item) return;
        category = 'COMBAT ACTION';
        if (item.bonus !== undefined) {
          badges.push({ label: `Atk: ${item.bonus >= 0 ? '+' + item.bonus : item.bonus}`, cls: 'prop-atk' });
        }
        if (item.damageFormula) {
          badges.push({ label: `${item.damageFormula} ${item.damageType || ''}`.trim(), cls: 'prop-dmg' });
        }
        description = item.notes || `Combat action: ${item.name}.\nAttack Bonus: ${item.bonus >= 0 ? '+' + item.bonus : item.bonus}\nDamage: ${item.damageFormula} ${item.damageType || ''}`;
      } else if (type === 'divion') {
        item = char.divions && char.divions[index];
        if (!item) return;
        category = 'DIVION & MANIFEST';
        if (item.type) badges.push({ label: item.type, cls: 'prop-type' });
        if (item.rank) badges.push({ label: item.rank, cls: 'prop-rank' });
        if (item.cost) badges.push({ label: `Cost: ${item.cost}`, cls: 'prop-cost' });
        description = item.manifestEffect || 'Divine flow manifestation.';
      } else if (type === 'boon') {
        item = char.boons && char.boons[index];
        if (!item) return;
        category = 'DM BOON';
        if (item.grantedBy) badges.push({ label: `Granted by ${item.grantedBy}`, cls: 'prop-granted' });
        description = item.effect || 'A campaign boon or divine blessing bestowed by the DM.';
      } else if (type === 'equipment') {
        item = char.equipment && char.equipment[index];
        if (!item) return;
        category = 'EQUIPMENT';
        if (item.qty) badges.push({ label: `Qty: ${item.qty}`, cls: 'prop-qty' });
        description = item.notes || `Equipment item carried in personal inventory.`;
      } else if (type === 'magic') {
        item = char.magicItems && char.magicItems[index];
        if (!item) return;
        category = 'MAGIC ITEM';
        if (item.rarity) badges.push({ label: item.rarity, cls: `prop-rarity prop-${item.rarity.toLowerCase().replace(/\s+/g, '-')}` });
        if (item.attuned) badges.push({ label: '✓ Attuned', cls: 'prop-attuned' });
        if (item.charges) badges.push({ label: `Charges: ${item.charges}`, cls: 'prop-charges' });
        description = item.description || 'A wondrous magical relic or enchanted item.';
      } else if (type === 'feat') {
        item = char.feats && char.feats[index];
        if (!item) return;
        category = 'FEAT / TRAIT';
        if (item.source) badges.push({ label: item.source, cls: 'prop-source' });
        description = item.description || 'Special trait or feat power.';
      } else if (type === 'consumable') {
        item = char.consumables && char.consumables[index];
        if (!item) return;
        category = 'ITEM / CONSUMABLE';
        if (item.type) badges.push({ label: item.type, cls: 'prop-type' });
        if (item.qty !== undefined) badges.push({ label: `Qty: ${item.qty}`, cls: 'prop-qty' });
        if (item.bonus !== undefined) badges.push({ label: `Atk: ${item.bonus >= 0 ? '+' + item.bonus : item.bonus}`, cls: 'prop-atk' });
        if (item.damageFormula) badges.push({ label: `${item.damageFormula} ${item.damageType || ''}`.trim(), cls: 'prop-dmg' });
        if (item.healFormula) badges.push({ label: `Heal: ${item.healFormula}`, cls: 'prop-heal' });
        description = item.notes || item.description || `Quantity: ${item.qty}`;
      } else if (type === 'spell') {
        const spellName = titleEl.dataset.spellName || titleEl.textContent.trim().replace(/📜/g, '').trim();
        const grimoire = window.Grimoire;
        const normKey = grimoire ? grimoire.normalizeSpellKey(spellName) : spellName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = grimoire && grimoire.allSpells ? grimoire.allSpells.find(s => grimoire.normalizeSpellKey(s.name) === normKey) : null;

        item = found || { name: spellName, level: 0, school: 'Arcane', description: 'Spell from character grimoire.' };
        category = 'SPELL';
        const lvlLabel = item.level === 0 ? 'Cantrip' : `${item.level}-Level`;
        badges.push({ label: `${lvlLabel} ${item.school || ''}`.trim(), cls: 'prop-school' });
        if (item.castingTime) badges.push({ label: item.castingTime, cls: 'prop-time' });
        if (item.range) badges.push({ label: item.range, cls: 'prop-range' });
        if (item.duration) badges.push({ label: item.duration, cls: 'prop-duration' });
        if (item.concentration) badges.push({ label: 'Concentration', cls: 'prop-conc' });
        if (item.ritual) badges.push({ label: 'Ritual', cls: 'prop-ritual' });
        if (item.damageFormula) badges.push({ label: `${item.damageFormula} ${item.damageType || ''}`.trim(), cls: 'prop-dmg' });
        description = item.description || item.desc || '';
        if (item.higherLevel) description += `\n\nAt Higher Levels: ${item.higherLevel}`;
      }

      if (!item) return;

      const payload = {
        name: item.name,
        roller: char.name,
        category: category,
        sourceType: type,
        badges: badges,
        description: description,
        raw: item
      };

      // Subtle pulse visual feedback on clicked title
      if (titleEl) {
        titleEl.classList.remove('share-pulse');
        void titleEl.offsetWidth;
        titleEl.classList.add('share-pulse');
      }

      // Audio blip
      this.playHpSound(1);

      // Share through dice roller history, channels, and Firebase sync
      if (window.DiceRoller && typeof window.DiceRoller.shareItem === 'function') {
        window.DiceRoller.shareItem(payload);
      }
    }

    openInspectModal(data) {
      const modal = document.getElementById('char-inspect-modal');
      if (!modal || !data) return;

      const item = data.itemData || data;
      const categoryEl = document.getElementById('char-inspect-category');
      const rollerEl = document.getElementById('char-inspect-roller');
      const titleEl = document.getElementById('char-inspect-title');
      const badgesEl = document.getElementById('char-inspect-badges');
      const descEl = document.getElementById('char-inspect-description');

      if (categoryEl) categoryEl.textContent = item.category || 'CHARACTER DETAIL';
      if (rollerEl) {
        const roller = data.roller || item.roller;
        if (roller) {
          rollerEl.textContent = `Shared by ${roller}`;
          rollerEl.style.display = 'inline-flex';
        } else {
          rollerEl.style.display = 'none';
        }
      }
      if (titleEl) titleEl.textContent = item.name || item.label || 'Item Details';

      if (badgesEl) {
        badgesEl.innerHTML = '';
        const badges = Array.isArray(item.badges) ? item.badges : [];
        badges.forEach(b => {
          const span = document.createElement('span');
          span.className = `char-prop-tag ${b.cls || ''}`;
          span.textContent = b.label;
          badgesEl.appendChild(span);
        });
      }

      if (descEl) {
        const rawDesc = item.description || item.notes || item.effect || item.manifestEffect || 'No additional details provided.';
        const paragraphs = rawDesc.split(/\n\n+/).map(p => {
          return `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`;
        }).join('');
        descEl.innerHTML = paragraphs || '<p>No description recorded.</p>';
      }

      modal.classList.remove('hidden', 'is-closing');
      modal.setAttribute('aria-hidden', 'false');
    }

    closeInspectModal() {
      const modal = document.getElementById('char-inspect-modal');
      if (!modal || modal.classList.contains('hidden')) return;

      modal.classList.add('is-closing');
      modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('is-closing');
      }, 180);
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
        consumables: [],
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
