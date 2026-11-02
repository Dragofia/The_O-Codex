/**
 * The O-Codex — Tactical Map Enhancements (Phase 2)
 * Powers:
 *  1. Map Pin Layer Filter Pills (Settlements, Dungeons, Landmarks, Quests, Player Pins)
 *  2. Zoom Level of Detail (LOD) Decluttering & Label Plates
 *  3. Distance & Travel Time Ruler Tool (576 mi Canon Scale, Overland Travel Estimates)
 *  4. Party Location Beacon & "Find Party" Camera Snap with Cloud Sync
 */

(function () {
  const FILTER_STORAGE_KEY = 'o_codex_map_filters';
  const PARTY_STORAGE_KEY = 'o_codex_party_location';

  // Canon scale from world-data.json:
  // 3x3 domain grid spans 576 x 576 miles across the 1000 x 1000 coordinate plane.
  // 1 map unit = 0.576 miles.
  const MILES_PER_UNIT = 0.576;
  const WALKING_MILES_PER_DAY = 24;  // 8 hours @ 3 mph (20-min mile)
  const MOUNTED_MILES_PER_DAY = 32;  // 8 hours @ 4 mph

  class MapTacticsEngine {
    constructor() {
      this.mapEngine = null;
      this.map = null;

      // Filter state (Set of allowed categories, plus 'Player')
      this.activeFilters = new Set(['Settlement', 'Dungeon', 'Location', 'Quest', 'Player']);

      // Measure tool state
      this.isMeasuring = false;
      this.measurePoints = []; // [{ x, y, latLng }]
      this.measureLineLayer = null;
      this.measureGuideLine = null;
      this.measureMarkers = [];
      this.measureTooltip = null;

      // Party beacon state
      this.partyLocation = { x: 500, y: 505, region: 'Altasar' };
      this.partyMarker = null;

      this.loadStorage();
    }

    loadStorage() {
      try {
        const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
        if (storedFilters) {
          const parsed = JSON.parse(storedFilters);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.activeFilters = new Set(parsed);
          }
        }
      } catch (e) {}

      try {
        const storedParty = localStorage.getItem(PARTY_STORAGE_KEY);
        if (storedParty) {
          const parsed = JSON.parse(storedParty);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            this.partyLocation = parsed;
          }
        }
      } catch (e) {}
    }

    saveFilterStorage() {
      try {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(this.activeFilters)));
      } catch (e) {}
    }

    savePartyStorage() {
      try {
        localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(this.partyLocation));
      } catch (e) {}
    }

    /* ========================================================================
       1. INITIALIZATION & LIFECYCLE
       ======================================================================== */
    bindMapEngine(engine) {
      if (!engine || !engine.map) return;
      this.mapEngine = engine;
      this.map = engine.map;

      this.initFilterBar();
      this.initLODController();
      this.initRulerControls();
      this.initPartyBeacon();

      // Keyboard shortcut P for Find Party
      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
          return;
        }
        if (e.key === 'p' || e.key === 'P') {
          // If in codex mode, switch to map first
          if (window.state?.appMode !== 'map' && window.setAppMode) {
            window.setAppMode('map');
            setTimeout(() => this.findParty(), 280);
          } else {
            this.findParty();
          }
        }
      });
    }

    /* ========================================================================
       2. PIN CATEGORY FILTERS
       ======================================================================== */
    initFilterBar() {
      const filterBar = document.getElementById('map-filter-bar');
      if (!filterBar) return;

      filterBar.querySelectorAll('.map-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const cat = pill.dataset.category;
          this.toggleFilter(cat);
        });
      });

      this.updateFilterUI();
    }

    toggleFilter(category) {
      if (category === 'all') {
        const allCategories = ['Settlement', 'Dungeon', 'Location', 'Quest', 'Player'];
        const allActive = allCategories.every(c => this.activeFilters.has(c));
        if (allActive) {
          // Keep at least Settlements active so map isn't completely empty
          this.activeFilters.clear();
          this.activeFilters.add('Settlement');
        } else {
          allCategories.forEach(c => this.activeFilters.add(c));
        }
      } else {
        if (this.activeFilters.has(category)) {
          // Don't allow deselecting everything to prevent confusion
          if (this.activeFilters.size > 1) {
            this.activeFilters.delete(category);
          } else {
            window.showToast?.('At least one pin category must remain active.', 'info', 1600);
            return;
          }
        } else {
          this.activeFilters.add(category);
        }
      }

      this.saveFilterStorage();
      this.updateFilterUI();
      if (this.mapEngine && typeof this.mapEngine.renderPins === 'function') {
        this.mapEngine.renderPins();
      }
    }

    updateFilterUI() {
      const filterBar = document.getElementById('map-filter-bar');
      if (!filterBar) return;

      const allCategories = ['Settlement', 'Dungeon', 'Location', 'Quest', 'Player'];
      const allActive = allCategories.every(c => this.activeFilters.has(c));

      const allPill = filterBar.querySelector('[data-category="all"]');
      if (allPill) {
        allPill.classList.toggle('is-active', allActive);
      }

      filterBar.querySelectorAll('.map-filter-pill[data-category]:not([data-category="all"])').forEach(pill => {
        const cat = pill.dataset.category;
        const isActive = this.activeFilters.has(cat);
        pill.classList.toggle('is-active', isActive);
        pill.classList.toggle('is-dimmed', !isActive);
      });
    }

    isPinVisible(pin) {
      if (!pin) return false;
      // Access control: secret pins handled by DM check
      if (pin.isSecret && !this.mapEngine?.isDmMode()) return false;

      // Custom player pins
      if (pin.isOfficial === false) {
        return this.activeFilters.has('Player');
      }

      // Official pins categorized by theme
      const category = pin.category || 'Location';
      return this.activeFilters.has(category);
    }

    updateFilterCounts(allPins = []) {
      const counts = {
        all: 0,
        Settlement: 0,
        Dungeon: 0,
        Location: 0,
        Quest: 0,
        Player: 0
      };

      const isDm = this.mapEngine?.isDmMode();

      allPins.forEach(p => {
        if (p.isSecret && !isDm) return;
        counts.all++;
        if (p.isOfficial === false) {
          counts.Player++;
        } else {
          const cat = p.category || 'Location';
          if (counts[cat] !== undefined) {
            counts[cat]++;
          } else {
            counts.Location++;
          }
        }
      });

      const setElText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setElText('count-all', counts.all);
      setElText('count-settlement', counts.Settlement);
      setElText('count-dungeon', counts.Dungeon);
      setElText('count-location', counts.Location);
      setElText('count-quest', counts.Quest);
      setElText('count-player', counts.Player);
    }

    /* ========================================================================
       3. ZOOM LEVEL OF DETAIL (LOD) CONTROLLER
       ======================================================================== */
    initLODController() {
      if (!this.map) return;
      this.updateZoomLOD();

      // Listen to zoomanim so LOD classes change IMMEDIATELY at the start of a zoom transition,
      // not waiting for the camera motion to halt!
      this.map.on('zoomanim', (e) => {
        if (typeof e.zoom === 'number') {
          this.updateZoomLOD(e.zoom);
        }
      });
      this.map.on('zoom', () => this.updateZoomLOD());
      this.map.on('zoomstart', () => this.updateZoomLOD());
      this.map.on('zoomend', () => this.updateZoomLOD());

      // Pre-emptively adapt on wheel rotation
      const container = this.map.getContainer();
      container?.addEventListener('wheel', (e) => {
        const cur = this.map.getZoom();
        const delta = e.deltaY < 0 ? 0.4 : -0.4;
        this.updateZoomLOD(cur + delta);
      }, { passive: true });
    }

    updateZoomLOD(customZoom) {
      if (!this.map) return;
      const zoom = typeof customZoom === 'number' ? customZoom : this.map.getZoom();
      const container = this.map.getContainer();
      if (!container) return;

      container.classList.remove('map-lod-low', 'map-lod-mid', 'map-lod-high');

      if (zoom < 0.1) {
        // Zoomed out overview: compact glowing micro-dots
        container.classList.add('map-lod-low');
      } else if (zoom < 0.95) {
        // Standard regional view: regular icon badges
        container.classList.add('map-lod-mid');
      } else {
        // Zoomed in tactical view: prominent badges + persistent nameplate labels
        container.classList.add('map-lod-high');
      }
    }

    /* ========================================================================
       4. DISTANCE & TRAVEL TIME RULER TOOL
       ======================================================================== */
    initRulerControls() {
      const measureBtn = document.getElementById('map-tool-measure');
      const banner = document.getElementById('measure-banner');
      const clearBtn = document.getElementById('measure-clear-btn');
      const doneBtn = document.getElementById('measure-done-btn');

      measureBtn?.addEventListener('click', () => {
        if (this.isMeasuring) {
          this.exitMeasureMode();
        } else {
          this.startMeasureMode();
        }
      });

      clearBtn?.addEventListener('click', () => this.clearMeasureRoute());
      doneBtn?.addEventListener('click', () => this.exitMeasureMode());

      if (this.map) {
        this.map.on('click', (e) => this.onMapClick(e));
        this.map.on('mousemove', (e) => this.onMapMouseMove(e));
      }
    }

    startMeasureMode() {
      if (!this.map) return;

      // Cancel conflicting tools
      if (this.mapEngine) {
        if (this.mapEngine.isDroppingPin) this.mapEngine.exitPinDropMode();
        if (this.mapEngine.isDrawingRegion) this.mapEngine.cancelTerritoryDraw();
        if (this.mapEngine.isEditingVertices) this.mapEngine.exitVertexMoveMode();
      }

      this.isMeasuring = true;
      const measureBtn = document.getElementById('map-tool-measure');
      measureBtn?.classList.add('is-active');

      const banner = document.getElementById('measure-banner');
      banner?.classList.remove('hidden');

      const bannerText = document.getElementById('measure-banner-text');
      if (bannerText) {
        bannerText.textContent = 'Ruler Tool: Click on the map to place Point A (Starting Location)';
      }

      this.map.getContainer().classList.add('map-cursor-measuring');
    }

    exitMeasureMode() {
      this.isMeasuring = false;

      const measureBtn = document.getElementById('map-tool-measure');
      measureBtn?.classList.remove('is-active');

      const banner = document.getElementById('measure-banner');
      banner?.classList.add('hidden');

      this.map?.getContainer().classList.remove('map-cursor-measuring');

      // Remove temporary guide line and cursor tooltip
      if (this.measureGuideLine) {
        this.map?.removeLayer(this.measureGuideLine);
        this.measureGuideLine = null;
      }
      if (this.measureTooltip) {
        this.map?.removeLayer(this.measureTooltip);
        this.measureTooltip = null;
      }
    }

    clearMeasureRoute() {
      this.measurePoints = [];
      if (this.measureLineLayer) {
        this.map?.removeLayer(this.measureLineLayer);
        this.measureLineLayer = null;
      }
      if (this.measureGuideLine) {
        this.map?.removeLayer(this.measureGuideLine);
        this.measureGuideLine = null;
      }
      if (this.measureTooltip) {
        this.map?.removeLayer(this.measureTooltip);
        this.measureTooltip = null;
      }
      this.measureMarkers.forEach(m => this.map?.removeLayer(m));
      this.measureMarkers = [];

      const bannerText = document.getElementById('measure-banner-text');
      if (bannerText) {
        bannerText.textContent = 'Ruler Tool: Click on the map to place Point A (Starting Location)';
      }
    }

    onMapClick(e) {
      if (!this.isMeasuring || !this.map) return;

      const latLng = e.latlng || (e.target && typeof e.target.getLatLng === 'function' ? e.target.getLatLng() : null);
      if (!latLng) return;
      const x = Math.max(0, Math.min(1000, Math.round(latLng.lng)));
      const y = Math.max(0, Math.min(1000, Math.round(latLng.lat)));

      this.measurePoints.push({ x, y, latLng });

      // Add small glowing waypoint marker
      const markerHtml = `
        <div class="ruler-waypoint-marker">
          <span class="ruler-waypoint-dot"></span>
          <span class="ruler-waypoint-label">${this.measurePoints.length === 1 ? 'A' : (this.measurePoints.length === 2 ? 'B' : this.measurePoints.length)}</span>
        </div>
      `;
      const marker = L.marker([y, x], {
        icon: L.divIcon({
          html: markerHtml,
          className: 'custom-ruler-waypoint',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }),
        interactive: false
      }).addTo(this.map);
      this.measureMarkers.push(marker);

      // Redraw permanent route polyline
      if (this.measurePoints.length >= 2) {
        const latLngs = this.measurePoints.map(p => [p.y, p.x]);
        if (!this.measureLineLayer) {
          this.measureLineLayer = L.polyline(latLngs, {
            color: '#5ae8ff',
            weight: 3.5,
            dashArray: '8, 8',
            opacity: 0.95
          }).addTo(this.map);
        } else {
          this.measureLineLayer.setLatLngs(latLngs);
        }

        // Calculate cumulative distance
        const totalDistance = this.calculateTotalDistance();
        this.updateBannerMeasurement(totalDistance);
      } else {
        const bannerText = document.getElementById('measure-banner-text');
        if (bannerText) {
          bannerText.textContent = 'Point A placed. Click Point B (or next waypoint) to measure route.';
        }
      }
    }

    onMapMouseMove(e) {
      if (!this.isMeasuring || !this.map || this.measurePoints.length === 0) return;

      const lastPoint = this.measurePoints[this.measurePoints.length - 1];
      const curLatLng = e.latlng;
      const curX = Math.max(0, Math.min(1000, Math.round(curLatLng.lng)));
      const curY = Math.max(0, Math.min(1000, Math.round(curLatLng.lat)));

      // Render or update live guide line
      const guideLatLngs = [[lastPoint.y, lastPoint.x], [curY, curX]];
      if (!this.measureGuideLine) {
        this.measureGuideLine = L.polyline(guideLatLngs, {
          color: '#fbbf24',
          weight: 2.5,
          dashArray: '5, 6',
          opacity: 0.85
        }).addTo(this.map);
      } else {
        this.measureGuideLine.setLatLngs(guideLatLngs);
      }

      // Calculate segment distance and total
      const segUnits = Math.hypot(curX - lastPoint.x, curY - lastPoint.y);
      const segMiles = Math.round(segUnits * MILES_PER_UNIT * 10) / 10;
      const prevTotal = this.calculateTotalDistance();
      const totalMiles = Math.round((prevTotal + segMiles) * 10) / 10;

      const estimates = this.getTravelEstimates(totalMiles);

      const tooltipContent = `
        <div class="ruler-live-tooltip">
          <div class="ruler-tooltip-header">
            <span class="ruler-tooltip-dist">${totalMiles} miles</span>
            ${this.measurePoints.length > 1 ? `<span class="ruler-tooltip-seg">(+${segMiles} mi segment)</span>` : ''}
          </div>
          <div class="ruler-tooltip-body">
            <span>🚶 <strong>${estimates.walking}</strong> (Normal Pace)</span>
            <span>🐎 <strong>${estimates.mounted}</strong> (Mounted / Fast)</span>
          </div>
        </div>
      `;

      if (!this.measureTooltip) {
        this.measureTooltip = L.tooltip({
          permanent: true,
          direction: 'right',
          offset: [14, 0],
          className: 'ruler-live-floating-tooltip'
        })
        .setContent(tooltipContent)
        .setLatLng(curLatLng)
        .addTo(this.map);
      } else {
        this.measureTooltip.setContent(tooltipContent).setLatLng(curLatLng);
      }
    }

    calculateTotalDistance() {
      if (this.measurePoints.length < 2) return 0;
      let totalUnits = 0;
      for (let i = 1; i < this.measurePoints.length; i++) {
        const p1 = this.measurePoints[i - 1];
        const p2 = this.measurePoints[i];
        totalUnits += Math.hypot(p2.x - p1.x, p2.y - p1.y);
      }
      return Math.round(totalUnits * MILES_PER_UNIT * 10) / 10;
    }

    getTravelEstimates(miles) {
      if (miles <= 0) return { walking: '0 hrs', mounted: '0 hrs' };

      // Under 24 miles: show hours (3 mph walking, 4 mph mounted)
      if (miles < WALKING_MILES_PER_DAY) {
        const walkHours = (miles / 3).toFixed(1);
        const mountHours = (miles / 4).toFixed(1);
        return {
          walking: `~${walkHours} hrs`,
          mounted: `~${mountHours} hrs`
        };
      }

      // 24+ miles: show days (24 mi/day walking, 32 mi/day mounted)
      const walkDays = (miles / WALKING_MILES_PER_DAY).toFixed(1);
      const mountDays = (miles / MOUNTED_MILES_PER_DAY).toFixed(1);
      return {
        walking: `~${walkDays} days`,
        mounted: `~${mountDays} days`
      };
    }

    updateBannerMeasurement(miles) {
      const bannerText = document.getElementById('measure-banner-text');
      if (!bannerText) return;

      const estimates = this.getTravelEstimates(miles);
      bannerText.innerHTML = `
        <strong>${miles} miles</strong> (${this.measurePoints.length} waypoints) · 
        🚶 <strong>${estimates.walking}</strong> · 
        🐎 <strong>${estimates.mounted}</strong>
      `;
    }

    /* ========================================================================
       5. PARTY LOCATION BEACON & "FIND PARTY"
       ======================================================================== */
    initPartyBeacon() {
      const findPartyBtn = document.getElementById('map-find-party-btn');
      findPartyBtn?.addEventListener('click', () => this.findParty());

      this.renderPartyBeacon();
    }

    renderPartyBeacon() {
      if (!this.map) return;

      const { x, y } = this.partyLocation;
      const isDm = this.mapEngine?.isDmMode();

      if (this.partyMarker) {
        this.partyMarker.setLatLng([y, x]);
        if (this.partyMarker.dragging) {
          if (isDm) this.partyMarker.dragging.enable();
          else this.partyMarker.dragging.disable();
        }
        return;
      }

      const iconHtml = `
        <div class="party-beacon-wrapper" id="party-beacon-token">
          <div class="party-beacon-aura"></div>
          <div class="party-beacon-pulse"></div>
          <div class="party-beacon-body">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" fill="#0f172a" fill-opacity="0.95"/>
              <polygon points="12 3 15 10 21 12 15 14 12 21 9 14 3 12 9 10 12 3" fill="#fbbf24" stroke="#fbbf24"/>
            </svg>
          </div>
          <span class="party-beacon-tag">Party</span>
        </div>
      `;

      this.partyMarker = L.marker([y, x], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'custom-party-beacon-marker',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        }),
        draggable: isDm,
        zIndexOffset: 1000
      }).addTo(this.map);

      this.updatePartyTooltip();

      // Drag events for DM
      this.partyMarker.on('dragend', () => {
        if (!this.mapEngine?.isDmMode()) return;
        const pos = this.partyMarker.getLatLng();
        const clampedX = Math.max(0, Math.min(1000, Math.round(pos.lng)));
        const clampedY = Math.max(0, Math.min(1000, Math.round(pos.lat)));

        this.partyMarker.setLatLng([clampedY, clampedX]);
        this.updatePartyLocation({ x: clampedX, y: clampedY });
      });

      this.partyMarker.on('click', (e) => {
        if (this.isMeasuring) {
          this.onMapClick(e);
          return;
        }
        const regionName = this.detectPartyRegion();
        window.showToast?.(`🧭 Party Current Location: ${regionName} (X: ${this.partyLocation.x}, Y: ${this.partyLocation.y})`, 'info', 2800);
      });
    }

    updatePartyLocation(newLoc, options = {}) {
      if (!newLoc || typeof newLoc.x !== 'number' || typeof newLoc.y !== 'number') return;

      this.partyLocation.x = newLoc.x;
      this.partyLocation.y = newLoc.y;
      this.partyLocation.region = newLoc.region || this.detectPartyRegion();

      this.savePartyStorage();

      if (this.partyMarker) {
        this.partyMarker.setLatLng([newLoc.y, newLoc.x]);
        this.updatePartyTooltip();
      }

      if (!options.fromRemote) {
        if (window.CampaignCloudSync && typeof window.CampaignCloudSync.pushPartyLocation === 'function') {
          window.CampaignCloudSync.pushPartyLocation(this.partyLocation);
        }
        window.showToast?.(`Party moved to ${this.partyLocation.region} (X: ${newLoc.x}, Y: ${newLoc.y})`, 'info', 2000);
      }
    }

    onRemotePartyLocation(data) {
      if (!data || typeof data.x !== 'number' || typeof data.y !== 'number') return;
      this.updatePartyLocation(data, { fromRemote: true });
    }

    detectPartyRegion() {
      if (!this.mapEngine) return 'Maladen Overland';
      const activeMap = this.mapEngine.getActiveMap();
      if (!activeMap || !Array.isArray(activeMap.regions)) return 'Maladen Overland';

      const pt = [this.partyLocation.y, this.partyLocation.x];
      for (const reg of activeMap.regions) {
        if (Array.isArray(reg.points) && this.isPointInPolygon(pt, reg.points)) {
          return reg.name || 'Overland';
        }
      }
      return 'Maladen Overland';
    }

    isPointInPolygon(point, vs) {
      const y = point[0], x = point[1];
      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][1], yi = vs[i][0];
        const xj = vs[j][1], yj = vs[j][0];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    updatePartyTooltip() {
      if (!this.partyMarker) return;
      const region = this.detectPartyRegion();
      this.partyMarker.unbindTooltip();
      this.partyMarker.bindTooltip(`
        <div class="map-tooltip party-tooltip">
          <strong>🧭 Adventuring Party</strong>
          <span>${region} · X: ${this.partyLocation.x}, Y: ${this.partyLocation.y}</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -18],
        className: 'custom-map-tooltip'
      });
    }

    findParty() {
      if (!this.map) return;
      const { x, y } = this.partyLocation;

      this.map.flyTo([y, x], 1.25, { duration: 1.0 });

      // Trigger radiating beacon shockwave animation
      const token = document.getElementById('party-beacon-token');
      if (token) {
        token.classList.remove('is-pinging');
        void token.offsetWidth; // trigger reflow
        token.classList.add('is-pinging');
      }

      const region = this.detectPartyRegion();
      window.showToast?.(`Located party in ${region}`, 'info', 1800);
    }
  }

  window.MapTactics = new MapTacticsEngine();

  // Bind to mapEngine once available
  const tryBind = () => {
    if (window.mapEngine && window.mapEngine.map) {
      window.MapTactics.bindMapEngine(window.mapEngine);
    } else {
      setTimeout(tryBind, 100);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryBind);
  } else {
    tryBind();
  }
})();
