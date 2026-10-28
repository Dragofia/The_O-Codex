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
      this.isReady = false;
      this.status = 'unconfigured'; // 'unconfigured' | 'connected' | 'error'
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

      try {
        const docRef = this.db.collection('codex_campaign').doc('world_pins');
        this.unsubscribe = docRef.onSnapshot(doc => {
          if (doc && doc.exists) {
            const data = doc.data();
            const cloudPins = Array.isArray(data.playerPins) ? data.playerPins : [];
            if (window.mapEngine && typeof window.mapEngine.syncCloudPins === 'function') {
              window.mapEngine.syncCloudPins(cloudPins);
            }
          }
        }, err => {
          console.warn('[CloudSync] Realtime sync listener warning:', err);
        });
      } catch (e) {
        console.warn('[CloudSync] Could not attach realtime listener:', e);
      }
    }

    async pushPins(pins) {
      if (!this.isReady || !this.db) return false;
      try {
        const docRef = this.db.collection('codex_campaign').doc('world_pins');
        await docRef.set({
          playerPins: pins,
          updatedAt: Date.now(),
          updatedBy: localStorage.getItem('o_codex_player_name') || 'Dungeon Master'
        }, { merge: true });
        return true;
      } catch (e) {
        console.error('[CloudSync] Failed to push pins to Firebase:', e);
        return false;
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
