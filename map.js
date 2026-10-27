/* ============================================================================
   THE O-CODEX — CARTOGRAPHY & INTERACTIVE MAP ENGINE
   Coordinates: Leaflet L.CRS.Simple on normalized 0-1000 x 0-1000 grid.
   Bridge: window.CodexMapBridge { navigateToPin(codexId), navigateToCodex(codexId) }
============================================================================ */

(function () {
  'use strict';

  /* ========================================================================
     1. PROCEDURAL FANTASY MAP SVG GENERATOR (Default / Fallback Map)
     ======================================================================== */
  function createProceduralFantasyMapSvg() {
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
      <defs>
        <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0a121e" />
          <stop offset="65%" stop-color="#050a12" />
          <stop offset="100%" stop-color="#020408" />
        </radialGradient>
        <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#142132" />
          <stop offset="50%" stop-color="#0e1825" />
          <stop offset="100%" stop-color="#09101b" />
        </linearGradient>
        <pattern id="celestialGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(90, 232, 255, 0.08)" stroke-width="0.75" stroke-dasharray="2,4" />
        </pattern>
      </defs>

      <!-- Ocean Background -->
      <rect width="1000" height="1000" fill="url(#oceanGrad)" />
      <rect width="1000" height="1000" fill="url(#celestialGrid)" opacity="0.7" />

      <!-- Deep Shallows / Ocean Contours -->
      <path d="M 120,180 Q 240,110 400,100 T 700,140 Q 850,220 880,450 T 820,750 Q 650,880 400,880 T 150,700 Q 80,450 120,180 Z" 
            fill="none" stroke="#163854" stroke-width="32" opacity="0.35" stroke-linejoin="round" />
      <path d="M 140,200 Q 250,130 420,120 T 680,160 Q 830,240 850,450 T 800,720 Q 630,850 420,850 T 180,680 Q 110,450 140,200 Z" 
            fill="none" stroke="#22577a" stroke-width="12" opacity="0.3" stroke-linejoin="round" />

      <!-- Main Continents -->
      <g id="continental-land">
        <path d="M 160,220 C 220,160 340,140 450,130 C 550,120 680,150 780,220 C 860,280 880,380 840,480 C 800,560 850,650 790,750 C 720,850 560,860 440,840 C 320,820 220,860 180,780 C 130,700 170,580 160,480 C 150,380 110,280 160,220 Z" 
              fill="url(#landGrad)" stroke="#5ae8ff" stroke-width="2.5" stroke-opacity="0.7" />
        <path d="M 150,520 Q 90,560 110,640 Q 150,680 190,620 Z" fill="url(#landGrad)" stroke="#5ae8ff" stroke-width="2" stroke-opacity="0.6" />
        <path d="M 130,730 Q 100,780 140,810 Q 180,800 160,750 Z" fill="url(#landGrad)" stroke="#5ae8ff" stroke-width="1.8" stroke-opacity="0.6" />
        <path d="M 820,190 Q 880,180 870,240 Q 820,260 800,210 Z" fill="url(#landGrad)" stroke="#5ae8ff" stroke-width="1.8" stroke-opacity="0.6" />
      </g>

      <!-- Mountain Ranges -->
      <g id="aldren-peaks" stroke="#475569" stroke-width="2" fill="#0d1726">
        <polygon points="360,160 390,110 420,160" />
        <polygon points="400,165 430,105 460,165" />
        <polygon points="440,170 470,120 500,170" />
        <polygon points="480,175 510,125 540,175" />
        <path d="M 390,110 L 395,160 M 430,105 L 435,165 M 470,120 L 472,170 M 510,125 L 512,175" stroke="#7dd3fc" stroke-width="1.5" />
      </g>
      <g id="southern-spine" stroke="#334155" stroke-width="1.8" fill="#0c1522">
        <polygon points="240,480 270,420 300,480" />
        <polygon points="280,490 310,430 340,490" />
        <polygon points="320,500 350,440 380,500" />
      </g>
      <g id="spire-crater" stroke="#7a87ff" stroke-width="1.5" fill="#15122b">
        <ellipse cx="640" cy="280" rx="45" ry="25" fill="#0e0c1f" stroke="#7a87ff" stroke-width="2" stroke-dasharray="3,3" />
        <polygon points="690,320 720,270 750,320" />
        <polygon points="730,340 760,290 790,340" />
      </g>

      <!-- Rivers & Features -->
      <g id="aether-rivers" fill="none" stroke="#5ae8ff" stroke-width="2.2" opacity="0.8" stroke-linecap="round">
        <path d="M 430,165 Q 400,280 430,360 T 480,450 Q 520,530 460,620 T 360,780 Q 280,820 180,780" />
        <path d="M 520,480 Q 640,500 720,440 T 780,380" />
      </g>
      <g id="verdant-clusters" fill="#064e3b" stroke="#10b981" stroke-width="1" opacity="0.7">
        <circle cx="480" cy="530" r="14" /><circle cx="505" cy="525" r="18" /><circle cx="490" cy="550" r="16" />
      </g>

      <!-- Celestial Compass Rose -->
      <g id="compass-rose" transform="translate(100, 100)">
        <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(90, 232, 255, 0.4)" stroke-width="1.5" />
        <polygon points="0,-46 7,-10 0,0 -7,-10" fill="#5ae8ff" />
        <polygon points="0,46 6,10 0,0 -6,10" fill="#1e3a5f" />
        <polygon points="46,0 10,6 0,0 10,-6" fill="#7a87ff" />
        <polygon points="-46,0 -10,6 0,0 -10,-6" fill="#1e3a5f" />
        <text x="0" y="-52" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="bold" fill="#eefaff">N</text>
      </g>

      <!-- Border Frame -->
      <rect x="15" y="15" width="970" height="970" fill="none" stroke="rgba(90, 232, 255, 0.25)" stroke-width="1" />
      <rect x="20" y="20" width="960" height="960" fill="none" stroke="rgba(122, 135, 255, 0.2)" stroke-width="2" />
    </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
  }

  /* ========================================================================
     2. POINT-IN-POLYGON ALGORITHM (Ray-casting)
     ======================================================================== */
  function isPointInPolygon(point, vs) {
    const y = point[0], x = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const yi = vs[i][0], xi = vs[i][1];
      const yj = vs[j][0], xj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /* ========================================================================
     3. PIN CATEGORIES & ICONS
     ======================================================================== */
  const PIN_THEMES = {
    Settlement: {
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      label: 'Settlement',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l4-2v16M19 21V11l-4-2v12M9 9h2M9 13h2M9 17h2M15 13h2M15 17h2"/></svg>`
    },
    Domain: {
      color: '#5ae8ff',
      glow: 'rgba(90, 232, 255, 0.45)',
      label: 'Domain',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20"/></svg>`
    },
    Location: {
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      label: 'Location',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    },
    Dungeon: {
      color: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.45)',
      label: 'Dungeon / Hazard',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"/></svg>`
    },
    Quest: {
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.45)',
      label: 'Quest / Spire',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line></svg>`
    },
    Note: {
      color: '#94a3b8',
      glow: 'rgba(148, 163, 184, 0.35)',
      label: 'Note',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
    },
    Campsite: {
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.45)',
      label: 'Campsite / Safehouse',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21 12 4 5 21"></path><path d="M12 4v17"></path><path d="m9 21 3-5 3 5"></path></svg>`
    },
    Danger: {
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.5)',
      label: 'Danger / Monster',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
    },
    Loot: {
      color: '#eab308',
      glow: 'rgba(234, 179, 8, 0.45)',
      label: 'Loot / Relic',
      iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9"></polygon><polyline points="2 9 12 22 22 9"></polyline><line x1="12" y1="22" x2="12" y2="9"></line><line x1="2" y1="9" x2="22" y2="9"></line></svg>`
    }
  };

  function createMarkerIcon(category, isHighlighted = false) {
    const theme = PIN_THEMES[category] || PIN_THEMES.Location;
    const pulseHtml = isHighlighted ? '<div class="map-marker-pulse"></div>' : '';
    const html = `
      <div class="map-marker-wrapper" style="width: 32px; height: 32px;">
        ${pulseHtml}
        <div class="map-marker-body" style="background: #060b14; border: 2px solid ${theme.color}; box-shadow: 0 0 12px ${theme.glow};">
          <span style="color: ${theme.color}; display: flex; align-items: center; justify-content: center;">${theme.iconSvg}</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html: html,
      className: 'custom-codex-map-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  /* ========================================================================
     4. DEFAULT DATA SEEDS (Matching O-Codex Lore)
     ======================================================================== */
  const DEFAULT_MAPS = [
    {
      id: 'map_surface_default',
      title: 'The Surface World',
      subtitle: 'Known Domains & Settlements',
      imageSource: createProceduralFantasyMapSvg(),
      isDefault: true,
      regions: [
        {
          id: 'reg_alden',
          name: 'Domain of Alden',
          color: '#5ae8ff',
          desc: 'An arid land of inventors, engineering marvels, and empire.',
          points: [
            [220, 260],
            [340, 240],
            [480, 280],
            [540, 420],
            [460, 560],
            [300, 560],
            [210, 420]
          ]
        },
        {
          id: 'reg_giaslan',
          name: 'Giaslan Reach',
          color: '#f59e0b',
          desc: 'Rich mountain surplus of metal shared with Alden.',
          points: [
            [600, 240],
            [740, 280],
            [780, 420],
            [680, 520],
            [560, 480],
            [550, 320]
          ]
        },
        {
          id: 'reg_whisperwood',
          name: 'Whisperwood Domain',
          color: '#10b981',
          desc: 'Dense ancient forest whispering secrets of the Old World.',
          points: [
            [420, 480],
            [560, 500],
            [660, 640],
            [540, 780],
            [380, 740],
            [360, 600]
          ]
        }
      ],
      officialLocations: [
        {
          id: 'loc_alden',
          codexId: 'domain-alden',
          name: 'Alden',
          category: 'Domain',
          region: 'Domain of Alden',
          x: 390,
          y: 380,
          summary: 'An arid land of inventors, engineering marvels, and rigid control.'
        },
        {
          id: 'loc_channeling',
          codexId: 'lore-channeling',
          name: 'Channeling Conduit',
          category: 'Quest',
          region: 'The Spire Caldera',
          x: 640,
          y: 280,
          summary: 'A Spire-unlocked form of Divion assignment channeling divine power.'
        }
      ],
      playerPins: []
    }
  ];

  /* ========================================================================
     5. CAMPAIGN MAP ENGINE
     ======================================================================== */
  class CampaignMapEngine {
    constructor() {
      this.maps = [];
      this.activeMapId = 'map_surface_default';
      this.currentHighlightedPinId = null;
      this.bordersVisible = true;

      // Tool states
      this.isDrawingRegion = false;
      this.drawingPoints = [];
      this.tempDrawingLayer = null;
      this.startPointMarker = null;
      this.isDroppingPin = false;
      this.pendingPinCoords = null;

      // Leaflet references
      this.map = null;
      this.imageOverlay = null;
      this.regionPolygonLayers = new Map();
      this.markerLayers = new Map();

      this.loadStorage();
      this.initLeaflet();
      this.setupDOM();
      this.renderAll();
    }

    loadStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v1';
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.maps = data.maps || [];
          this.activeMapId = data.activeMapId || 'map_surface_default';
        } catch (e) {
          console.warn('Could not parse stored map data, loading defaults.', e);
        }
      }

      if (!this.maps || this.maps.length === 0) {
        this.maps = JSON.parse(JSON.stringify(DEFAULT_MAPS));
      }
    }

    saveStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v1';
      try {
        const payload = {
          maps: this.maps,
          activeMapId: this.activeMapId
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error('Storage save failed:', e);
      }
    }

    getActiveMap() {
      return this.maps.find(m => m.id === this.activeMapId) || this.maps[0];
    }

    initLeaflet() {
      const container = document.getElementById('campaign-map-canvas');
      if (!container) return;

      this.map = L.map('campaign-map-canvas', {
        crs: L.CRS.Simple,
        minZoom: -1.5,
        maxZoom: 3,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        attributionControl: false
      });

      const activeMap = this.getActiveMap();
      this.imageOverlay = L.imageOverlay(activeMap.imageSource, [[0, 0], [1000, 1000]]).addTo(this.map);
      this.map.fitBounds([[0, 0], [1000, 1000]]);
      this.map.setMaxBounds([[-100, -100], [1100, 1100]]);

      this.bindMapEvents();
    }

    bindMapEvents() {
      // Hover Territory Detection (Ray-casting HUD)
      this.map.on('mousemove', (e) => {
        const x = Math.round(Math.max(0, Math.min(1000, e.latlng.lng)));
        const y = Math.round(Math.max(0, Math.min(1000, e.latlng.lat)));

        const activeMap = this.getActiveMap();
        let matchedRegion = null;

        if (activeMap.regions) {
          for (const reg of activeMap.regions) {
            if (isPointInPolygon([y, x], reg.points)) {
              matchedRegion = reg;
              break;
            }
          }
        }

        const hudName = document.getElementById('map-region-hud-name');
        const hudDot = document.getElementById('map-region-hud-dot');
        const hudCoords = document.getElementById('map-region-hud-coords');

        if (hudCoords) {
          hudCoords.textContent = `X: ${x} · Y: ${y}`;
        }

        if (matchedRegion) {
          if (hudName) {
            hudName.textContent = matchedRegion.name;
            hudName.style.color = matchedRegion.color || '#5ae8ff';
          }
          if (hudDot) {
            hudDot.style.backgroundColor = matchedRegion.color || '#5ae8ff';
          }
        } else {
          if (hudName) {
            hudName.textContent = 'Uncharted Territory';
            hudName.style.color = 'var(--text-soft)';
          }
          if (hudDot) {
            hudDot.style.backgroundColor = 'var(--accent)';
          }
        }

        // Live polygon drawing preview
        if (this.isDrawingRegion && this.drawingPoints.length > 0) {
          let previewTarget = [y, x];
          if (this.drawingPoints.length >= 3) {
            const startPt = this.drawingPoints[0];
            const dist = Math.hypot(x - startPt[1], y - startPt[0]);
            // Snapping preview to the start dot when cursor gets close
            if (dist <= 25) {
              previewTarget = [startPt[0], startPt[1]];
            }
          }
          const previewPoints = [...this.drawingPoints, previewTarget];
          if (this.tempDrawingLayer) {
            this.tempDrawingLayer.setLatLngs(previewPoints);
          }
        }
      });

      // Map Click Handler (Drawing or Pin Drop)
      this.map.on('click', (e) => {
        const x = Math.round(Math.max(0, Math.min(1000, e.latlng.lng)));
        const y = Math.round(Math.max(0, Math.min(1000, e.latlng.lat)));

        // 1. Territory Drawing Mode
        if (this.isDrawingRegion) {
          // If we have at least 3 points and user clicks near the starting dot, finish drawing
          if (this.drawingPoints.length >= 3) {
            const startPt = this.drawingPoints[0];
            const dist = Math.hypot(x - startPt[1], y - startPt[0]);
            if (dist <= 25) {
              this.finishTerritoryDraw();
              return;
            }
          }

          this.drawingPoints.push([y, x]);
          const counter = document.getElementById('drawing-point-count');
          if (counter) counter.textContent = this.drawingPoints.length;

          // If this is the very first vertex, place the interactive start dot
          if (this.drawingPoints.length === 1) {
            this.createStartPointMarker(y, x);
          } else if (this.drawingPoints.length >= 3) {
            this.updateStartPointMarkerReady();
          }

          if (!this.tempDrawingLayer) {
            this.tempDrawingLayer = L.polygon(this.drawingPoints, {
              color: '#10b981',
              weight: 2,
              fillColor: '#10b981',
              fillOpacity: 0.2,
              dashArray: '4, 4'
            }).addTo(this.map);
          } else {
            this.tempDrawingLayer.setLatLngs(this.drawingPoints);
          }
          return;
        }

        // 2. Pin Dropping Mode
        if (this.isDroppingPin) {
          this.pendingPinCoords = { x, y };
          this.exitPinDropMode();
          this.openCreatePinModal(x, y);
        }
      });
    }

    switchActiveMap(mapId) {
      const target = this.maps.find(m => m.id === mapId);
      if (!target) return;

      this.activeMapId = mapId;
      this.saveStorage();

      if (this.imageOverlay) {
        this.map.removeLayer(this.imageOverlay);
      }
      this.imageOverlay = L.imageOverlay(target.imageSource, [[0, 0], [1000, 1000]]).addTo(this.map);
      this.imageOverlay.bringToBack();

      this.renderAll();
      this.map.fitBounds([[0, 0], [1000, 1000]]);
    }

    invalidateSize() {
      if (this.map) {
        this.map.invalidateSize();
      }
    }

    renderAll() {
      this.renderHeaderUI();
      this.renderRegions();
      this.renderPins();
    }

    renderHeaderUI() {
      const activeMap = this.getActiveMap();
      const titleEl = document.getElementById('map-current-title');
      if (titleEl) titleEl.textContent = activeMap.title;

      // Populate map list dropdown
      const listEl = document.getElementById('map-selector-list');
      if (listEl) {
        listEl.innerHTML = '';
        this.maps.forEach(m => {
          const isCur = m.id === this.activeMapId;
          const item = document.createElement('button');
          item.type = 'button';
          item.className = `map-dropdown-item${isCur ? ' is-active' : ''}`;
          item.innerHTML = `
            <span>${escapeHtml(m.title)}</span>
            ${isCur ? '<span class="map-badge-active">Active</span>' : ''}
          `;
          item.addEventListener('click', () => {
            this.switchActiveMap(m.id);
            this.toggleMapDropdown(false);
          });
          listEl.appendChild(item);
        });
      }
    }

    renderRegions() {
      this.regionPolygonLayers.forEach(layer => this.map.removeLayer(layer));
      this.regionPolygonLayers.clear();

      const activeMap = this.getActiveMap();
      if (!activeMap.regions) return;

      activeMap.regions.forEach(reg => {
        const polygon = L.polygon(reg.points, {
          color: reg.color || '#5ae8ff',
          weight: this.bordersVisible ? 2 : 0,
          fillColor: reg.color || '#5ae8ff',
          fillOpacity: this.bordersVisible ? 0.15 : 0,
          dashArray: '3, 4',
          interactive: false
        }).addTo(this.map);

        this.regionPolygonLayers.set(reg.id, polygon);
      });
    }

    renderPins() {
      this.markerLayers.forEach(layer => this.map.removeLayer(layer));
      this.markerLayers.clear();

      const activeMap = this.getActiveMap();
      const allPins = [
        ...(activeMap.officialLocations || []).map(p => ({ ...p, isOfficial: true })),
        ...(activeMap.playerPins || []).map(p => ({ ...p, isOfficial: false }))
      ];

      allPins.forEach(pin => {
        const isHighlighted = (pin.codexId || pin.id) === this.currentHighlightedPinId;
        const marker = L.marker([pin.y, pin.x], {
          icon: createMarkerIcon(pin.category, isHighlighted),
          title: pin.name || pin.title
        });

        // Hover tooltip
        marker.bindTooltip(`
          <div class="map-tooltip">
            <strong>${escapeHtml(pin.name || pin.title)}</strong>
            <span>${escapeHtml(pin.category || 'Location')}${pin.region ? ' · ' + escapeHtml(pin.region) : ''}</span>
          </div>
        `, {
          direction: 'top',
          offset: [0, -14],
          className: 'custom-map-tooltip'
        });

        marker.on('click', () => {
          if (this.isDrawingRegion || this.isDroppingPin) return;
          this.openPinDrawer(pin);
        });

        marker.addTo(this.map);
        this.markerLayers.set(pin.id, marker);
      });
    }

    openPinDrawer(pin) {
      this.currentHighlightedPinId = pin.codexId || pin.id;
      this.renderPins();

      const drawer = document.getElementById('map-pin-drawer');
      if (!drawer) return;

      document.getElementById('drawer-pin-title').textContent = pin.name || pin.title;
      document.getElementById('drawer-pin-category').textContent = pin.category || 'General';
      document.getElementById('drawer-pin-coords').textContent = `X: ${pin.x} · Y: ${pin.y}`;
      document.getElementById('drawer-pin-summary').textContent = pin.summary || pin.note || 'No notes added.';

      // Codex linking CTA
      const codexActionContainer = document.getElementById('drawer-codex-action');
      if (codexActionContainer) {
        codexActionContainer.innerHTML = '';
        if (pin.codexId) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'drawer-cta-button';
          btn.innerHTML = `<span>Open in O-Codex</span> <span>↗</span>`;
          btn.addEventListener('click', () => {
            window.CodexMapBridge.navigateToCodex(pin.codexId);
          });
          codexActionContainer.appendChild(btn);
        }
      }

      // Delete Pin Button (for player pins or DM)
      const deleteBtnContainer = document.getElementById('drawer-delete-action');
      if (deleteBtnContainer) {
        deleteBtnContainer.innerHTML = '';
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'drawer-delete-button';
        delBtn.textContent = 'Delete Pin';
        delBtn.addEventListener('click', () => {
          if (confirm(`Delete pin "${pin.name || pin.title}"?`)) {
            this.deletePin(pin.id);
            this.closePinDrawer();
          }
        });
        deleteBtnContainer.appendChild(delBtn);
      }

      drawer.classList.remove('is-collapsed');
    }

    closePinDrawer() {
      const drawer = document.getElementById('map-pin-drawer');
      if (drawer) {
        drawer.classList.add('is-collapsed');
      }
      this.currentHighlightedPinId = null;
      this.renderPins();
    }

    deletePin(pinId) {
      const activeMap = this.getActiveMap();
      if (activeMap.officialLocations) {
        activeMap.officialLocations = activeMap.officialLocations.filter(p => p.id !== pinId);
      }
      if (activeMap.playerPins) {
        activeMap.playerPins = activeMap.playerPins.filter(p => p.id !== pinId);
      }
      this.saveStorage();
      this.renderPins();
    }

    // Pin Dropping Workflow
    startPinDropMode() {
      this.isDroppingPin = true;
      const canvas = document.getElementById('campaign-map-canvas');
      if (canvas) canvas.classList.add('cursor-crosshair');
      document.getElementById('pin-drop-banner')?.classList.remove('hidden');
    }

    exitPinDropMode() {
      this.isDroppingPin = false;
      const canvas = document.getElementById('campaign-map-canvas');
      if (canvas) canvas.classList.remove('cursor-crosshair');
      document.getElementById('pin-drop-banner')?.classList.add('hidden');
    }

    openCreatePinModal(x, y) {
      const modal = document.getElementById('create-pin-modal');
      if (!modal) return;

      document.getElementById('new-pin-coords-display').textContent = `X: ${x} · Y: ${y}`;
      document.getElementById('new-pin-title').value = '';
      document.getElementById('new-pin-notes').value = '';

      // Populate Codex Entry link options from active worldData
      const linkSelect = document.getElementById('new-pin-codex-link');
      if (linkSelect && window.state && window.state.worldData) {
        linkSelect.innerHTML = '<option value="">None (Custom Standalone Pin)</option>';
        window.state.worldData.entries.forEach(entry => {
          const opt = document.createElement('option');
          opt.value = entry.id;
          opt.textContent = `${entry.name || entry.title} (${entry.category})`;
          linkSelect.appendChild(opt);
        });
      }

      modal.classList.remove('hidden');
    }

    saveNewPin() {
      const title = document.getElementById('new-pin-title').value.trim();
      if (!title) {
        alert('Please give the pin a name or title.');
        return;
      }

      const category = document.getElementById('new-pin-category').value;
      const notes = document.getElementById('new-pin-notes').value.trim();
      const codexId = document.getElementById('new-pin-codex-link')?.value || null;
      const coords = this.pendingPinCoords || { x: 500, y: 500 };

      const activeMap = this.getActiveMap();
      if (!activeMap.playerPins) activeMap.playerPins = [];

      const newPin = {
        id: `pin_${Date.now()}`,
        name: title,
        title: title,
        category: category,
        x: coords.x,
        y: coords.y,
        note: notes,
        summary: notes,
        codexId: codexId,
        createdAt: Date.now()
      };

      activeMap.playerPins.push(newPin);
      this.saveStorage();
      this.renderPins();
      this.closeModal('create-pin-modal');
    }

    // Territory Drawing Workflow
    startTerritoryDrawMode() {
      this.isDrawingRegion = true;
      this.drawingPoints = [];
      if (this.startPointMarker) {
        this.map.removeLayer(this.startPointMarker);
        this.startPointMarker = null;
      }
      if (this.tempDrawingLayer) {
        this.map.removeLayer(this.tempDrawingLayer);
        this.tempDrawingLayer = null;
      }
      const canvas = document.getElementById('campaign-map-canvas');
      if (canvas) canvas.classList.add('cursor-crosshair');
      document.getElementById('drawing-banner')?.classList.remove('hidden');
      const counter = document.getElementById('drawing-point-count');
      if (counter) counter.textContent = '0';
    }

    createStartPointMarker(y, x) {
      if (this.startPointMarker) {
        this.map.removeLayer(this.startPointMarker);
      }

      const icon = L.divIcon({
        className: 'custom-drawing-start-marker',
        html: `
          <div class="drawing-start-dot" id="drawing-start-dot-el">
            <span class="drawing-start-pulse"></span>
            <span class="drawing-start-core"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      this.startPointMarker = L.marker([y, x], {
        icon: icon,
        zIndexOffset: 3000,
        interactive: true
      }).addTo(this.map);

      this.startPointMarker.bindTooltip('Starting Point (Add 3+ points then click here to finish)', {
        direction: 'top',
        offset: [0, -14],
        className: 'custom-map-tooltip'
      });

      this.startPointMarker.on('click', (e) => {
        if (e) {
          L.DomEvent.stopPropagation(e);
        }
        if (this.drawingPoints.length >= 3) {
          this.finishTerritoryDraw();
        } else {
          alert(`Please add at least 3 boundary points before closing the territory (currently ${this.drawingPoints.length}).`);
        }
      });
    }

    updateStartPointMarkerReady() {
      if (!this.startPointMarker) return;
      const el = document.getElementById('drawing-start-dot-el') || this.startPointMarker.getElement()?.querySelector('.drawing-start-dot');
      if (el) {
        el.classList.add('can-close');
      }
      this.startPointMarker.setTooltipContent('✨ Click here to finish & save territory!');
    }

    finishTerritoryDraw() {
      if (this.drawingPoints.length < 3) {
        alert('A territory requires at least 3 points. Click on the map to add points.');
        return;
      }

      this.exitTerritoryDrawMode();
      this.openSaveTerritoryModal();
    }

    cancelTerritoryDraw() {
      this.exitTerritoryDrawMode();
      this.drawingPoints = [];
    }

    exitTerritoryDrawMode() {
      this.isDrawingRegion = false;
      const canvas = document.getElementById('campaign-map-canvas');
      if (canvas) canvas.classList.remove('cursor-crosshair');
      document.getElementById('drawing-banner')?.classList.add('hidden');

      if (this.startPointMarker) {
        this.map.removeLayer(this.startPointMarker);
        this.startPointMarker = null;
      }
      if (this.tempDrawingLayer) {
        this.map.removeLayer(this.tempDrawingLayer);
        this.tempDrawingLayer = null;
      }
    }

    openSaveTerritoryModal() {
      const modal = document.getElementById('save-territory-modal');
      if (!modal) return;
      document.getElementById('new-territory-name').value = '';
      document.getElementById('new-territory-desc').value = '';
      modal.classList.remove('hidden');
    }

    saveNewTerritory() {
      const name = document.getElementById('new-territory-name').value.trim();
      if (!name) {
        alert('Please enter a territory name.');
        return;
      }
      const color = document.getElementById('new-territory-color').value || '#5ae8ff';
      const desc = document.getElementById('new-territory-desc').value.trim();

      const activeMap = this.getActiveMap();
      if (!activeMap.regions) activeMap.regions = [];

      const newRegion = {
        id: `reg_${Date.now()}`,
        name: name,
        color: color,
        desc: desc,
        points: [...this.drawingPoints]
      };

      activeMap.regions.push(newRegion);
      this.saveStorage();

      if (this.tempDrawingLayer) {
        this.map.removeLayer(this.tempDrawingLayer);
        this.tempDrawingLayer = null;
      }
      this.drawingPoints = [];

      this.renderRegions();
      this.closeModal('save-territory-modal');
    }

    // Feature A: Copy & Paste Data Between Maps
    openCopyDataModal() {
      const modal = document.getElementById('copy-map-data-modal');
      if (!modal) return;

      const sourceSelect = document.getElementById('copy-source-map-select');
      if (sourceSelect) {
        sourceSelect.innerHTML = '';
        this.maps.forEach(m => {
          if (m.id !== this.activeMapId) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.title} (${(m.regions || []).length} territories, ${(m.playerPins || []).length + (m.officialLocations || []).length} pins)`;
            sourceSelect.appendChild(opt);
          }
        });
      }

      modal.classList.remove('hidden');
    }

    executeCopyData() {
      const sourceMapId = document.getElementById('copy-source-map-select')?.value;
      const sourceMap = this.maps.find(m => m.id === sourceMapId);
      if (!sourceMap) {
        alert('Please select a valid source map.');
        return;
      }

      const copyTerritories = document.getElementById('copy-opt-territories')?.checked;
      const copyPins = document.getElementById('copy-opt-pins')?.checked;

      const activeMap = this.getActiveMap();

      if (copyTerritories && sourceMap.regions) {
        const clonedRegions = JSON.parse(JSON.stringify(sourceMap.regions)).map(r => ({
          ...r,
          id: `reg_cloned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        activeMap.regions = [...(activeMap.regions || []), ...clonedRegions];
      }

      if (copyPins) {
        if (sourceMap.officialLocations) {
          const clonedOfficial = JSON.parse(JSON.stringify(sourceMap.officialLocations)).map(p => ({
            ...p,
            id: `loc_cloned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
          }));
          activeMap.officialLocations = [...(activeMap.officialLocations || []), ...clonedOfficial];
        }
        if (sourceMap.playerPins) {
          const clonedPlayer = JSON.parse(JSON.stringify(sourceMap.playerPins)).map(p => ({
            ...p,
            id: `pin_cloned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
          }));
          activeMap.playerPins = [...(activeMap.playerPins || []), ...clonedPlayer];
        }
      }

      this.saveStorage();
      this.renderAll();
      this.closeModal('copy-map-data-modal');
      alert(`Copied data from "${sourceMap.title}" into "${activeMap.title}"!`);
    }

    // Feature B: Update Map Image
    openEditMapModal() {
      const modal = document.getElementById('edit-map-modal');
      if (!modal) return;

      const activeMap = this.getActiveMap();
      document.getElementById('edit-map-title').value = activeMap.title;
      document.getElementById('edit-map-subtitle').value = activeMap.subtitle || '';
      document.getElementById('edit-map-image-url').value = activeMap.imageSource.startsWith('data:') ? '' : activeMap.imageSource;

      modal.classList.remove('hidden');
    }

    saveEditMap() {
      const activeMap = this.getActiveMap();
      const title = document.getElementById('edit-map-title').value.trim();
      const subtitle = document.getElementById('edit-map-subtitle').value.trim();
      const imageUrl = document.getElementById('edit-map-image-url').value.trim();

      if (title) activeMap.title = title;
      activeMap.subtitle = subtitle;
      if (imageUrl) activeMap.imageSource = imageUrl;

      this.saveStorage();
      this.switchActiveMap(activeMap.id);
      this.closeModal('edit-map-modal');
    }

    // Create New Map Layer
    openCreateMapModal() {
      const modal = document.getElementById('create-map-modal');
      if (!modal) return;
      document.getElementById('new-map-title').value = '';
      document.getElementById('new-map-subtitle').value = '';
      document.getElementById('new-map-image-url').value = '';
      modal.classList.remove('hidden');
    }

    saveNewMap() {
      const title = document.getElementById('new-map-title').value.trim();
      if (!title) {
        alert('Please give your new map layer a title.');
        return;
      }
      const subtitle = document.getElementById('new-map-subtitle').value.trim();
      const imageUrl = document.getElementById('new-map-image-url').value.trim() || createProceduralFantasyMapSvg();

      const newMap = {
        id: `map_${Date.now()}`,
        title: title,
        subtitle: subtitle || 'Custom Map Layer',
        imageSource: imageUrl,
        regions: [],
        officialLocations: [],
        playerPins: []
      };

      this.maps.push(newMap);
      this.activeMapId = newMap.id;
      this.saveStorage();
      this.switchActiveMap(newMap.id);
      this.closeModal('create-map-modal');
    }

    closeModal(modalId) {
      document.getElementById(modalId)?.classList.add('hidden');
    }

    toggleBorders() {
      this.bordersVisible = !this.bordersVisible;
      const btn = document.getElementById('map-toggle-borders-btn');
      if (btn) btn.classList.toggle('is-active', this.bordersVisible);
      this.renderRegions();
    }

    toggleMapDropdown(forceState) {
      const dd = document.getElementById('map-selector-dropdown');
      if (!dd) return;
      const isHidden = typeof forceState === 'boolean' ? !forceState : !dd.classList.contains('hidden');
      dd.classList.toggle('hidden', isHidden);
    }

    setupDOM() {
      // Wire Map Header Buttons
      document.getElementById('map-selector-btn')?.addEventListener('click', () => this.toggleMapDropdown());
      document.getElementById('map-add-new-btn')?.addEventListener('click', () => {
        this.toggleMapDropdown(false);
        this.openCreateMapModal();
      });
      document.getElementById('map-settings-btn')?.addEventListener('click', () => this.openEditMapModal());
      document.getElementById('map-copy-data-btn')?.addEventListener('click', () => this.openCopyDataModal());

      // Wire Toolbar Tools
      document.getElementById('map-tool-pin')?.addEventListener('click', () => this.startPinDropMode());
      document.getElementById('map-tool-draw')?.addEventListener('click', () => this.startTerritoryDrawMode());
      document.getElementById('map-toggle-borders-btn')?.addEventListener('click', () => this.toggleBorders());
      document.getElementById('map-drawer-close')?.addEventListener('click', () => this.closePinDrawer());

      // Wire Drawing Banner Actions
      document.getElementById('drawing-finish-btn')?.addEventListener('click', () => this.finishTerritoryDraw());
      document.getElementById('drawing-cancel-btn')?.addEventListener('click', () => this.cancelTerritoryDraw());
      document.getElementById('pin-drop-cancel-btn')?.addEventListener('click', () => this.exitPinDropMode());

      // Wire Modals
      document.getElementById('save-new-pin-btn')?.addEventListener('click', () => this.saveNewPin());
      document.getElementById('cancel-new-pin-btn')?.addEventListener('click', () => this.closeModal('create-pin-modal'));

      document.getElementById('save-new-territory-btn')?.addEventListener('click', () => this.saveNewTerritory());
      document.getElementById('cancel-new-territory-btn')?.addEventListener('click', () => this.cancelTerritoryDraw());

      document.getElementById('execute-copy-data-btn')?.addEventListener('click', () => this.executeCopyData());
      document.getElementById('cancel-copy-data-btn')?.addEventListener('click', () => this.closeModal('copy-map-data-modal'));

      document.getElementById('save-edit-map-btn')?.addEventListener('click', () => this.saveEditMap());
      document.getElementById('cancel-edit-map-btn')?.addEventListener('click', () => this.closeModal('edit-map-modal'));

      document.getElementById('save-new-map-btn')?.addEventListener('click', () => this.saveNewMap());
      document.getElementById('cancel-new-map-btn')?.addEventListener('click', () => this.closeModal('create-map-modal'));

      // Outside click handler for map dropdown
      document.addEventListener('click', (e) => {
        const dd = document.getElementById('map-selector-dropdown');
        const btn = document.getElementById('map-selector-btn');
        if (dd && !dd.classList.contains('hidden') && !dd.contains(e.target) && !btn.contains(e.target)) {
          this.toggleMapDropdown(false);
        }
      });
    }
  }

  /* ========================================================================
     6. BIDIRECTIONAL CODEX-MAP BRIDGE
     ======================================================================== */
  window.CodexMapBridge = {
    // Navigate from Codex -> Map pin
    navigateToPin(codexId) {
      if (window.setAppMode) {
        window.setAppMode('map');
      }

      setTimeout(() => {
        if (!window.mapEngine) return;
        window.mapEngine.invalidateSize();

        // Search for pin with this codexId across maps
        let targetMap = null;
        let targetPin = null;

        for (const m of window.mapEngine.maps) {
          const match = [
            ...(m.officialLocations || []),
            ...(m.playerPins || [])
          ].find(p => p.codexId === codexId || (p.name && p.name.toLowerCase() === codexId.toLowerCase()));

          if (match) {
            targetMap = m;
            targetPin = match;
            break;
          }
        }

        if (targetMap && targetMap.id !== window.mapEngine.activeMapId) {
          window.mapEngine.switchActiveMap(targetMap.id);
        }

        if (targetPin) {
          window.mapEngine.map.flyTo([targetPin.y, targetPin.x], 1, { duration: 1 });
          window.mapEngine.openPinDrawer(targetPin);
        } else {
          // If no specific pin exists yet, open map at center
          window.mapEngine.map.flyTo([500, 500], 0, { duration: 0.8 });
        }
      }, 250);
    },

    // Navigate from Map pin -> Codex entry
    navigateToCodex(codexId) {
      if (window.setAppMode) {
        window.setAppMode('codex');
      }

      setTimeout(() => {
        if (typeof window.openModal === 'function') {
          window.openModal(codexId);
        }
      }, 250);
    }
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize Map Engine when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.mapEngine = new CampaignMapEngine();
  });

})();
