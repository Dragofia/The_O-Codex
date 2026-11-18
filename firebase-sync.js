/**
 * The O-Codex — Firebase Cloud Synchronization Module
 * Provides free, persistent cross-device syncing for custom map pins and DM notes.
 */

(function () {
  const FIREBASE_CONFIG_KEY = 'o_codex_firebase_config';

  // Campaign Firebase configuration for zero-setup multi-device syncing
  window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyBuq5a8bOe3P1ML9tvffldnAfBvytFCtEM",
    authDomain: "the-o-codex.firebaseapp.com",
    projectId: "the-o-codex",
    storageBucket: "the-o-codex.firebasestorage.app",
    messagingSenderId: "927807791399",
    appId: "1:927807791399:web:1ac540e90e1a49462f0902",
    measurementId: "G-0LJ6YEYVX5"
  };

  class CampaignCloudSync {
    constructor() {
      this.app = null;
      this.db = null;
      this.unsubscribe = null;
      this.unsubscribeParty = null;
      this.unsubscribeNotes = null;
      this.unsubscribeRolls = null;
      this.unsubscribeChars = null;
      this.isReady = false;
      this.status = 'unconfigured'; // 'unconfigured' | 'connected' | 'error'
      this.clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      this.lastRollId = null;
      this.lastPartyJson = null;
      this.lastPinsJson = null;
      this.lastOfficialLocationsJson = null;
      this.lastLocationJson = null;
      this.lastPartyUpdatedAt = 0;
      this.latestDocData = null;
    }

    getConfig() {
      // 1. Check localStorage first (user-entered in UI)
      const stored = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.apiKey && parsed.projectId) return parsed;
        } catch (e) {}
      }

      // 2. Check window.FIREBASE_CONFIG
      if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.projectId) {
        return window.FIREBASE_CONFIG;
      }

      return null;
    }

    isConfigured() {
      return this.isReady && Boolean(this.db);
    }

    init() {
      if (typeof firebase === 'undefined') {
        console.warn('[CloudSync] Firebase SDK script not loaded.');
        this.status = 'error';
        this.updateUI();
        return;
      }

      const config = this.getConfig();
      if (!config) {
        this.status = 'unconfigured';
        this.updateUI();
        return;
      }

      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }

        this.db = firebase.firestore();
        
        // Silently sign in anonymously to satisfy secure Firebase security rules
        if (firebase.auth) {
          firebase.auth().signInAnonymously().catch(authErr => {
            console.warn('[CloudSync] Anonymous auth notification:', authErr);
          });
        }

        this.isReady = true;
        this.status = 'connected';
        this.updateUI();
        console.log('[CloudSync] Connected to Firebase Firestore!');

        this.listenToPins();
      } catch (err) {
        console.error('[CloudSync] Failed to initialize Firebase:', err);
        this.status = 'error';
        this.updateUI();
      }
    }

    saveConfig(configObj) {
      if (!configObj || !configObj.apiKey || !configObj.projectId) {
        throw new Error('Invalid Firebase config. Missing apiKey or projectId.');
      }
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(configObj));
      this.init();
    }

    clearConfig() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
      if (this.unsubscribeParty) {
        this.unsubscribeParty();
        this.unsubscribeParty = null;
      }
      if (this.unsubscribeNotes) {
        this.unsubscribeNotes();
        this.unsubscribeNotes = null;
      }
      if (this.unsubscribeRolls) {
        this.unsubscribeRolls();
        this.unsubscribeRolls = null;
      }
      if (this.unsubscribeChars) {
        this.unsubscribeChars();
        this.unsubscribeChars = null;
      }
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
      this.isReady = false;
      this.db = null;
      this.status = 'unconfigured';
      this.updateUI();
    }

    listenToPins() {
      if (!this.isReady || !this.db) return;
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (this.unsubscribeParty) {
        this.unsubscribeParty();
      }
      if (this.unsubscribeNotes) {
        this.unsubscribeNotes();
      }
      if (this.unsubscribeRolls) {
        this.unsubscribeRolls();
      }
      if (this.unsubscribeChars) {
        this.unsubscribeChars();
      }

      try {
        const docRef = this.db.collection('codex_campaign').doc('world_pins');
        this.unsubscribe = docRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            this.latestDocData = data;

            // 1. Sync custom player pins (only if pins changed and not sent by self)
            if (Array.isArray(data.playerPins)) {
              const pinsJson = JSON.stringify(data.playerPins);
              if (pinsJson !== this.lastPinsJson && data.playerPinsSenderId !== this.clientId) {
                this.lastPinsJson = pinsJson;
                if (window.mapEngine && typeof window.mapEngine.syncCloudPins === 'function') {
                  window.mapEngine.syncCloudPins(data.playerPins);
                }
              }
            }

            // 1B. Sync official locations if changed and not sent by self
            if (Array.isArray(data.officialLocations)) {
              const offJson = JSON.stringify(data.officialLocations);
              if (offJson !== this.lastOfficialLocationsJson && data.officialLocationsSenderId !== this.clientId) {
                this.lastOfficialLocationsJson = offJson;
                if (window.mapEngine && typeof window.mapEngine.onRemoteOfficialLocations === 'function') {
                  window.mapEngine.onRemoteOfficialLocations(data.officialLocations);
                }
              }
            }

            // 2. Sync Party Dice Rolls (only if new roll and not sent by self)
            if (data.latestRoll && data.latestRoll.id && data.latestRoll.id !== this.lastRollId && data.rollSenderId !== this.clientId) {
              this.lastRollId = data.latestRoll.id;
              if (window.DiceRoller && typeof window.DiceRoller.onRemoteRoll === 'function') {
                window.DiceRoller.onRemoteRoll(data.latestRoll);
              }
            }

            // 3. Sync Party Location (only if location changed and not sent by self)
            if (data.partyLocation && typeof data.partyLocation.x === 'number' && typeof data.partyLocation.y === 'number') {
              const locJson = JSON.stringify(data.partyLocation);
              if (locJson !== this.lastLocationJson && data.locationSenderId !== this.clientId) {
                this.lastLocationJson = locJson;
                if (window.MapTactics && typeof window.MapTactics.onRemotePartyLocation === 'function') {
                  window.MapTactics.onRemotePartyLocation(data.partyLocation);
                }
              }
            }

            // 4. Sync Characters Roster (only if party actually changed, was not sent by self, and no pending local changes)
            if (Array.isArray(data.party)) {
              data.party = data.party.filter(c => c && c.name && !String(c.name).toLowerCase().includes('awd'));
              const partyJson = JSON.stringify(data.party);
              const isFromSelf = Boolean(data.partySenderId && data.partySenderId === this.clientId);
              const isDifferent = partyJson !== this.lastPartyJson;
              const hasPendingLocal = window.CharacterSheet && typeof window.CharacterSheet.hasPendingLocalChanges === 'function' && window.CharacterSheet.hasPendingLocalChanges();

              if (!isFromSelf && isDifferent && !hasPendingLocal) {
                this.lastPartyJson = partyJson;
                if (data.partyUpdatedAt) this.lastPartyUpdatedAt = data.partyUpdatedAt;
                if (window.CharacterSheet && typeof window.CharacterSheet.onRemoteCharacters === 'function') {
                  window.CharacterSheet.onRemoteCharacters(data.party);
                }
              }
            }

            // 5. Sync Initiative Tracker (combatants and open state)
            if (data.latestInitiative && data.initiativeSenderId !== this.clientId) {
              const initJson = JSON.stringify(data.latestInitiative);
              if (initJson !== this.lastInitiativeJson) {
                this.lastInitiativeJson = initJson;
                if (window.InitiativeTracker && typeof window.InitiativeTracker.onRemoteUpdate === 'function') {
                  window.InitiativeTracker.onRemoteUpdate({ payload: data.latestInitiative });
                }
              }
            }

            // 6. Sync Shrouded Regions / Fog of War
            if (data.shroudedRegions && typeof data.shroudedRegions === 'object' && data.regionsSenderId !== this.clientId) {
              const fogJson = JSON.stringify(data.shroudedRegions);
              if (fogJson !== this.lastFogJson) {
                this.lastFogJson = fogJson;
                if (window.mapEngine && typeof window.mapEngine.onRemoteShroudedRegions === 'function') {
                  window.mapEngine.onRemoteShroudedRegions(data.shroudedRegions, data.mapRegions);
                }
              }
            }
          }
        }, err => {
          console.warn('[CloudSync] Realtime sync listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach realtime listener:', e);
      }

      try {
        const partyRef = this.db.collection('codex_campaign').doc('party_location');
        this.unsubscribeParty = partyRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            if (data && typeof data.x === 'number' && typeof data.y === 'number') {
              const locJson = JSON.stringify(data);
              if (locJson !== this.lastLocationJson && data.locationSenderId !== this.clientId) {
                this.lastLocationJson = locJson;
                if (window.MapTactics && typeof window.MapTactics.onRemotePartyLocation === 'function') {
                  window.MapTactics.onRemotePartyLocation(data);
                }
              }
            }
          }
        }, err => {
          console.warn('[CloudSync] Party location listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach party location listener:', e);
      }

      try {
        const notesRef = this.db.collection('codex_campaign').doc('party_notes');
        this.unsubscribeNotes = notesRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            if (window.CodexNotes && typeof window.CodexNotes.onRemoteNotes === 'function') {
              window.CodexNotes.onRemoteNotes(data);
            }
          }
        }, err => {
          console.warn('[CloudSync] Party notes listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach party notes listener:', e);
      }

      // Realtime listener for Party Dice Rolls
      try {
        const rollsRef = this.db.collection('codex_campaign').doc('dice_rolls');
        this.unsubscribeRolls = rollsRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            if (data && data.latestRoll && data.latestRoll.id && data.latestRoll.id !== this.lastRollId && data.rollSenderId !== this.clientId) {
              this.lastRollId = data.latestRoll.id;
              if (window.DiceRoller && typeof window.DiceRoller.onRemoteRoll === 'function') {
                window.DiceRoller.onRemoteRoll(data.latestRoll);
              }
            }
          }
        }, err => {
          console.warn('[CloudSync] Party dice rolls listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach dice rolls listener:', e);
      }

      // Realtime listener for Party Character Sheets
      try {
        const charsRef = this.db.collection('codex_campaign').doc('characters');
        this.unsubscribeChars = charsRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            if (data && Array.isArray(data.party)) {
              const partyJson = JSON.stringify(data.party);
              const isFromSelf = Boolean(data.partySenderId && data.partySenderId === this.clientId);
              const isDifferent = partyJson !== this.lastPartyJson;
              const hasPendingLocal = window.CharacterSheet && typeof window.CharacterSheet.hasPendingLocalChanges === 'function' && window.CharacterSheet.hasPendingLocalChanges();

              if (!isFromSelf && isDifferent && !hasPendingLocal) {
                this.lastPartyJson = partyJson;
                if (data.partyUpdatedAt) this.lastPartyUpdatedAt = data.partyUpdatedAt;
                if (window.CharacterSheet && typeof window.CharacterSheet.onRemoteCharacters === 'function') {
                  window.CharacterSheet.onRemoteCharacters(data.party);
                }
              }
            }
          }
        }, err => {
          console.warn('[CloudSync] Party characters listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach character sheets listener:', e);
      }
    }

    async pushPins(pins) {
      if (!this.isReady || !this.db) return false;
      try {
        const docRef = this.db.collection('codex_campaign').doc('world_pins');
        this.lastPinsJson = JSON.stringify(pins);
        await docRef.set({
          playerPins: pins,
          playerPinsSenderId: this.clientId,
          playerPinsUpdatedAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });
        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push pins to Firebase:', e);
        return false;
      }
    }

    async pushOfficialLocations(locations) {
      if (!this.isReady || !this.db || !Array.isArray(locations)) return false;
      try {
        const docRef = this.db.collection('codex_campaign').doc('world_pins');
        this.lastOfficialLocationsJson = JSON.stringify(locations);
        await docRef.set({
          officialLocations: locations,
          officialLocationsSenderId: this.clientId,
          officialLocationsUpdatedAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });
        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push official locations to Firebase:', e);
        return false;
      }
    }

    async pushPartyLocation(location) {
      if (!this.isReady || !this.db) return false;
      try {
        // Write to world_pins (verified authorized Firestore document)
        const pinsRef = this.db.collection('codex_campaign').doc('world_pins');
        this.lastLocationJson = JSON.stringify(location);
        await pinsRef.set({
          partyLocation: location,
          locationSenderId: this.clientId,
          locationUpdatedAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });

        // Also try standalone document if permissions ever change
        try {
          const docRef = this.db.collection('codex_campaign').doc('party_location');
          docRef.set({
            ...location,
            locationSenderId: this.clientId,
            updatedAt: Date.now(),
            updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
          }, { merge: true }).catch(() => {});
        } catch (subErr) {}

        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push party location to Firebase:', e);
        return false;
      }
    }

    async pushNote(entryId, noteRecord) {
      if (!this.isReady || !this.db || !entryId) return false;
      try {
        const docRef = this.db.collection('codex_campaign').doc('party_notes');
        await docRef.set({
          notes: {
            [entryId]: {
              ...noteRecord,
              updatedAt: Date.now(),
              updatedBy: localStorage.getItem('o_codex_player_name') || 'Adventurer'
            }
          },
          updatedAt: Date.now()
        }, { merge: true });
        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push note to Firebase:', e);
        return false;
      }
    }

    async pushDiceRoll(rollData) {
      if (!this.isReady || !this.db || !rollData) return false;
      try {
        this.lastRollId = rollData.id;
        // Write to world_pins (verified authorized Firestore document)
        const pinsRef = this.db.collection('codex_campaign').doc('world_pins');
        await pinsRef.set({
          latestRoll: rollData,
          rollSenderId: this.clientId,
          rollUpdatedAt: Date.now(),
          updatedAt: Date.now(),
          updatedBy: rollData.roller || localStorage.getItem('o_codex_player_name') || 'Adventurer'
        }, { merge: true });

        // Also try standalone document if permissions ever change
        try {
          const docRef = this.db.collection('codex_campaign').doc('dice_rolls');
          docRef.set({
            latestRoll: rollData,
            rollSenderId: this.clientId,
            updatedAt: Date.now(),
            updatedBy: rollData.roller || localStorage.getItem('o_codex_player_name') || 'Adventurer'
          }, { merge: true }).catch(() => {});
        } catch (subErr) {}

        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push dice roll to Firebase:', e);
        return false;
      }
    }

    async pushCharacters(charactersList) {
      if (!this.isReady || !this.db || !Array.isArray(charactersList)) return false;
      try {
        const partyJson = JSON.stringify(charactersList);
        this.lastPartyJson = partyJson;
        const now = Date.now();
        this.lastPartyUpdatedAt = now;

        // Write to world_pins (verified authorized Firestore document)
        const pinsRef = this.db.collection('codex_campaign').doc('world_pins');
        await pinsRef.set({
          party: charactersList,
          partySenderId: this.clientId,
          partyUpdatedAt: now,
          updatedAt: now,
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });

        // Also try standalone document if permissions ever change
        try {
          const docRef = this.db.collection('codex_campaign').doc('characters');
          docRef.set({
            party: charactersList,
            partySenderId: this.clientId,
            partyUpdatedAt: now,
            updatedAt: now,
            updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
          }, { merge: true }).catch(() => {});
        } catch (subErr) {}

        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push characters to Firebase:', e);
        return false;
      }
    }

    async pushInitiative(initPayload) {
      if (!this.isReady || !this.db || !initPayload) return false;
      try {
        const initJson = JSON.stringify(initPayload);
        this.lastInitiativeJson = initJson;
        const now = Date.now();

        const pinsRef = this.db.collection('codex_campaign').doc('world_pins');
        await pinsRef.set({
          latestInitiative: initPayload,
          initiativeSenderId: this.clientId,
          updatedAt: now,
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });

        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push initiative to Firebase:', e);
        return false;
      }
    }

    async pushRegions(regionsList) {
      if (!this.isReady || !this.db || !Array.isArray(regionsList)) return false;
      try {
        const shroudStates = {};
        regionsList.forEach(r => {
          shroudStates[r.id] = Boolean(r.shrouded);
        });
        const fogJson = JSON.stringify(shroudStates);
        this.lastFogJson = fogJson;
        const now = Date.now();

        const pinsRef = this.db.collection('codex_campaign').doc('world_pins');
        await pinsRef.set({
          shroudedRegions: shroudStates,
          mapRegions: regionsList,
          regionsSenderId: this.clientId,
          regionsUpdatedAt: now,
          updatedAt: now,
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });

        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push regions to Firebase:', e);
        return false;
      }
    }

    syncToMapEngine() {
      if (!this.latestDocData || !window.mapEngine) return;
      const data = this.latestDocData;
      if (Array.isArray(data.playerPins) && typeof window.mapEngine.syncCloudPins === 'function') {
        window.mapEngine.syncCloudPins(data.playerPins);
      }
      if (Array.isArray(data.officialLocations) && typeof window.mapEngine.onRemoteOfficialLocations === 'function') {
        window.mapEngine.onRemoteOfficialLocations(data.officialLocations);
      }
      if (data.shroudedRegions && typeof window.mapEngine.onRemoteShroudedRegions === 'function') {
        window.mapEngine.onRemoteShroudedRegions(data.shroudedRegions, data.mapRegions);
      }
    }

    updateUI() {
      const badge = document.getElementById('map-cloud-sync-btn');
      if (!badge) return;

      const dot = badge.querySelector('.sync-status-dot');
      const label = badge.querySelector('.sync-status-label');

      badge.classList.remove('sync--connected', 'sync--unconfigured', 'sync--error');

      if (this.status === 'connected') {
        badge.classList.add('sync--connected');
        badge.title = 'Cloud Sync: Active (Connected to Firebase)';
        if (label) label.textContent = 'Cloud Synced';
      } else if (this.status === 'error') {
        badge.classList.add('sync--error');
        badge.title = 'Cloud Sync: Error connecting. Click to check config.';
        if (label) label.textContent = 'Sync Error';
      } else {
        badge.classList.add('sync--unconfigured');
        badge.title = 'Cloud Sync: Not configured. Click to connect free Firebase.';
        if (label) label.textContent = 'Connect Cloud';
      }
    }
  }

  window.CampaignCloudSync = new CampaignCloudSync();

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CampaignCloudSync.init());
  } else {
    window.CampaignCloudSync.init();
  }
})();
