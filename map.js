/* ============================================================================
   THE O-CODEX — CARTOGRAPHY & INTERACTIVE MAP ENGINE
   Coordinates: Leaflet L.CRS.Simple on normalized 0-1000 x 0-1000 grid.
   Bridge: window.CodexMapBridge { navigateToPin(codexId), navigateToCodex(codexId) }
============================================================================ */

(function () {
  'use strict';

  /* ========================================================================
     1. PROCEDURAL FANTASY MAP SVG GENERATOR (Maladen Continental Canvas)
     ======================================================================== */
  function createProceduralFantasyMapSvg() {
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
      <defs>
        <!-- Ocean Gradients -->
        <radialGradient id="oceanGrad" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stop-color="#091424" />
          <stop offset="60%" stop-color="#040913" />
          <stop offset="100%" stop-color="#020408" />
        </radialGradient>
        <linearGradient id="laytideAbyss" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1d3a" />
          <stop offset="50%" stop-color="#051024" />
          <stop offset="100%" stop-color="#020712" />
        </linearGradient>

        <!-- Biome Gradients -->
        <linearGradient id="giaslanSnow" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="50%" stop-color="#283852" />
          <stop offset="100%" stop-color="#172437" />
        </linearGradient>
        <linearGradient id="aldenArid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2b2015" />
          <stop offset="60%" stop-color="#1e1810" />
          <stop offset="100%" stop-color="#14100c" />
        </linearGradient>
        <linearGradient id="hemwoodDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#190e18" />
          <stop offset="60%" stop-color="#110811" />
          <stop offset="100%" stop-color="#090409" />
        </linearGradient>
        <linearGradient id="klabatsDesert" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2c1e10" />
          <stop offset="50%" stop-color="#1f160b" />
          <stop offset="100%" stop-color="#130e07" />
        </linearGradient>
        <linearGradient id="dynesteaVerdant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0d281e" />
          <stop offset="50%" stop-color="#081b14" />
          <stop offset="100%" stop-color="#04100c" />
        </linearGradient>
        <linearGradient id="altasarSavannah" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#262210" />
          <stop offset="50%" stop-color="#1b180a" />
          <stop offset="100%" stop-color="#100f06" />
        </linearGradient>
        <linearGradient id="caybluffPlateau" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#20152d" />
          <stop offset="60%" stop-color="#140d1e" />
          <stop offset="100%" stop-color="#0b0612" />
        </linearGradient>

        <!-- Grid Pattern -->
        <pattern id="nauticalGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(90, 232, 255, 0.05)" stroke-width="0.75" stroke-dasharray="2,4" />
        </pattern>
      </defs>

      <!-- Ocean Floor & Grid -->
      <rect width="1000" height="1000" fill="url(#oceanGrad)" />
      <rect width="1000" height="1000" fill="url(#nauticalGrid)" opacity="0.8" />

      <!-- Laytide Ocean Shelf (Far East) -->
      <path d="M 750,0 C 820,150 880,350 870,550 C 860,750 920,880 1000,950 L 1000,0 Z" 
            fill="url(#laytideAbyss)" opacity="0.8" />

      <!-- Continental Coastline Outline / Shallows -->
      <path d="M 120,40 C 250,15 480,20 650,45 C 800,70 890,160 880,320 C 870,440 920,520 890,680 C 860,820 820,920 680,950 C 520,980 340,960 220,910 C 120,850 70,720 60,560 C 50,400 80,220 120,40 Z" 
            fill="none" stroke="#1c3b5e" stroke-width="28" opacity="0.4" stroke-linejoin="round" />
      <path d="M 140,55 C 260,35 480,40 640,65 C 780,90 870,170 860,320 C 850,430 900,510 870,670 C 840,800 800,900 670,930 C 510,960 340,940 230,890 C 130,830 90,710 80,560 C 70,410 100,230 140,55 Z" 
            fill="none" stroke="#2563eb" stroke-width="8" opacity="0.3" stroke-linejoin="round" />

      <!-- 1. Giaslan Tundra & Northern Peaks (SVG Top Left) -->
      <path d="M 150,50 C 260,30 450,40 520,80 C 500,180 460,220 360,240 C 240,240 180,180 150,50 Z" 
            fill="url(#giaslanSnow)" stroke="#7a87ff" stroke-width="1.8" stroke-opacity="0.8" />
      <!-- Viserion's Peak Mountains -->
      <g id="viserions-peaks" stroke="#94a3b8" stroke-width="1.5" fill="#0f172a">
        <polygon points="320,130 350,75 380,130" />
        <polygon points="360,140 390,85 420,140" />
        <polygon points="270,150 300,95 330,150" />
        <polygon points="400,160 430,110 460,160" />
        <!-- Snow highlight caps -->
        <polygon points="340,95 350,75 360,95" fill="#e2e8f0" stroke="none" />
        <polygon points="380,105 390,85 400,105" fill="#e2e8f0" stroke="none" />
        <polygon points="290,115 300,95 310,115" fill="#e2e8f0" stroke="none" />
      </g>

      <!-- 2. Alden Arid Empire & Forges (SVG Top Right) -->
      <path d="M 520,80 C 650,60 780,80 850,150 C 860,250 820,320 740,320 C 660,320 540,240 520,80 Z" 
            fill="url(#aldenArid)" stroke="#5ae8ff" stroke-width="1.8" stroke-opacity="0.8" />
      <!-- Gialden Strip Mountains (Dividing Giaslan & Alden) -->
      <g id="gialden-strip" stroke="#78350f" stroke-width="1.5" fill="#1c120c">
        <polygon points="480,190 505,140 530,190" />
        <polygon points="510,210 535,160 560,210" />
        <polygon points="460,230 485,180 510,230" />
        <!-- Copper crest highlights -->
        <path d="M 505,140 L 507,190 M 535,160 L 537,210" stroke="#f59e0b" stroke-width="1.2" />
      </g>

      <!-- 3. Hemwood Shadowed Forest (SVG Upper Mid-Left) -->
      <path d="M 360,240 C 460,220 540,240 540,350 C 500,420 400,420 320,360 C 340,300 350,260 360,240 Z" 
            fill="url(#hemwoodDark)" stroke="#f43f5e" stroke-width="1.8" stroke-opacity="0.8" />
      <!-- Hell Sigil Core Aura in Hemwood -->
      <ellipse cx="460" cy="280" rx="30" ry="18" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="3,3" opacity="0.8" />
      <ellipse cx="460" cy="280" rx="14" ry="8" fill="#450a0a" stroke="#f87171" stroke-width="1" opacity="0.9" />

      <!-- 4. Klabats Western Deserts & Badlands (SVG Mid-Left) -->
      <path d="M 80,320 C 180,300 320,360 320,500 C 300,620 180,640 100,580 C 70,480 70,380 80,320 Z" 
            fill="url(#klabatsDesert)" stroke="#f59e0b" stroke-width="1.8" stroke-opacity="0.8" />
      <!-- Desert Ridge Dunes -->
      <path d="M 120,400 Q 180,380 240,420 M 140,460 Q 200,440 260,480 M 110,520 Q 180,500 230,540" 
            fill="none" stroke="#b45309" stroke-width="1.5" opacity="0.6" stroke-linecap="round" />

      <!-- 5. Dynestea Central Verdant Heartland (SVG Center) -->
      <path d="M 320,360 C 400,420 540,350 640,380 C 660,500 580,580 480,580 C 380,580 320,500 320,360 Z" 
            fill="url(#dynesteaVerdant)" stroke="#10b981" stroke-width="2" stroke-opacity="0.85" />
      <!-- Confluent Prime Rivers -->
      <path d="M 500,80 Q 480,240 500,380 Q 520,460 480,550 Q 420,620 360,700" 
            fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.85" stroke-linecap="round" />
      <path d="M 500,380 Q 600,420 680,420" 
          fill="none" stroke="#38bdf8" stroke-width="1.8" opacity="0.75" stroke-linecap="round" />

      <!-- 6. Altasar Eastern Savannah & Plains (SVG Mid-Right) -->
      <path d="M 640,380 C 740,320 850,320 890,440 C 900,560 840,650 720,650 C 640,650 620,540 640,380 Z" 
            fill="url(#altasarSavannah)" stroke="#eab308" stroke-width="1.8" stroke-opacity="0.85" />
      <!-- The Spire Monolith Crater in Altasar -->
      <g id="altasar-spire" transform="translate(760, 440)">
        <ellipse cx="0" cy="0" rx="40" ry="22" fill="#181504" stroke="#eab308" stroke-width="1.5" stroke-dasharray="3,3" />
        <polygon points="-8,8 0,-36 8,8" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
        <circle cx="0" cy="-36" r="3.5" fill="#ffffff" filter="drop-shadow(0 0 6px #eab308)" />
      </g>

      <!-- 7. Cirrusia Sky Islands & Cloud Ocean (SVG Lower Center/Left) -->
      <path d="M 320,580 C 420,580 520,580 560,700 C 520,820 380,880 260,820 C 200,720 240,640 320,580 Z" 
            fill="#0c1929" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.8" />
      <!-- Floating Clouds and Sky Islands -->
      <g id="cirrusia-clouds" opacity="0.75">
        <ellipse cx="380" cy="720" rx="35" ry="14" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2" />
        <ellipse cx="460" cy="740" rx="45" ry="16" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.2" />
        <ellipse cx="330" cy="770" rx="28" ry="12" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="1" />
      </g>

      <!-- 8. Caybluff Starlit Plateau & Cliffs (SVG Lower Right) -->
      <path d="M 560,700 C 640,650 780,650 860,720 C 880,840 820,920 680,940 C 580,940 520,820 560,700 Z" 
            fill="url(#caybluffPlateau)" stroke="#a855f7" stroke-width="2" stroke-opacity="0.85" />
      <!-- Caybluff Fissure Ravine -->
      <path d="M 820,740 Q 840,780 830,830" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.85" stroke-linecap="round" />
      <!-- Ocean Wall Circular Currents outside Portale -->
      <g id="ocean-wall-currents" fill="none" stroke="#38bdf8" stroke-width="1.8" opacity="0.7">
        <circle cx="890" cy="650" r="28" stroke-dasharray="4,4" />
        <circle cx="890" cy="650" r="16" stroke-dasharray="3,3" />
      </g>

      <!-- Vintage Nautical Compass Rose (Top Left) -->
      <g id="compass-rose" transform="translate(90, 90)">
        <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(90, 232, 255, 0.35)" stroke-width="1.2" />
        <polygon points="0,-40 6,-8 0,0 -6,-8" fill="#5ae8ff" />
        <polygon points="0,40 5,8 0,0 -5,8" fill="#1e3a5f" />
        <polygon points="40,0 8,5 0,0 8,-5" fill="#7a87ff" />
        <polygon points="-40,0 -8,5 0,0 -8,-5" fill="#1e3a5f" />
        <text x="0" y="-46" text-anchor="middle" font-family="'Segoe UI', serif" font-size="11" font-weight="bold" fill="#eefaff">N</text>
      </g>

      <!-- Map Cartouche / Banner -->
      <g id="map-cartouche" transform="translate(500, 965)">
        <rect x="-140" y="-18" width="280" height="28" rx="6" fill="rgba(6, 12, 22, 0.85)" stroke="rgba(90, 232, 255, 0.4)" stroke-width="1" />
        <text x="0" y="2" text-anchor="middle" font-family="'Segoe UI', serif" font-size="12" font-weight="bold" fill="#90e0ef" letter-spacing="2">MALADEN — THE SURFACE WORLD</text>
      </g>

      <!-- Ornamental Border Frame -->
      <rect x="12" y="12" width="976" height="976" fill="none" stroke="rgba(90, 232, 255, 0.25)" stroke-width="1.2" />
      <rect x="18" y="18" width="964" height="964" fill="none" stroke="rgba(122, 135, 255, 0.18)" stroke-width="1.8" />
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

  function createMarkerIcon(category, isHighlighted = false, isSecret = false) {
    const theme = PIN_THEMES[category] || PIN_THEMES.Location;
    const pulseHtml = isHighlighted ? '<div class="map-marker-pulse"></div>' : '';
    const secretClass = isSecret ? ' is-secret-marker' : '';
    const html = `
      <div class="map-marker-wrapper" style="width: 32px; height: 32px;">
        ${pulseHtml}
        <div class="map-marker-body" style="background: #060b14; border: 2px solid ${isSecret ? '#c084fc' : theme.color}; box-shadow: 0 0 12px ${isSecret ? 'rgba(192, 132, 252, 0.8)' : theme.glow};">
          <span style="color: ${isSecret ? '#c084fc' : theme.color}; display: flex; align-items: center; justify-content: center;">${theme.iconSvg}</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html: html,
      className: `custom-codex-map-marker${secretClass}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  /* ========================================================================
     4. DEFAULT DATA SEEDS (Matching Canon O-Codex Lore)
     ======================================================================== */
  const DEFAULT_MAPS = [
    {
      id: 'map_surface_default',
      title: 'Maladen — The Surface World',
      subtitle: 'Domains, Settlements & Relic Locations',
      imageSource: createProceduralFantasyMapSvg(),
      isDefault: true,
      regions: [
        {
          id: 'reg_giaslan',
          name: 'Giaslan',
          color: '#7a87ff',
          desc: 'Frigid northern mountain realm of astrologers and precise Chroma magic, ruled from Chillspire.',
          points: [
            [960, 200], [980, 420], [920, 520], [820, 480], [780, 360], [800, 220], [890, 150]
          ]
        },
        {
          id: 'reg_alden',
          name: 'Domain of Alden',
          color: '#5ae8ff',
          desc: 'Arid land of inventors, engineering marvels, and rigid imperial control, anchored by Laregola.',
          points: [
            [920, 520], [940, 720], [880, 840], [740, 820], [720, 680], [760, 540], [820, 480]
          ]
        },
        {
          id: 'reg_hemwood',
          name: 'Hemwood',
          color: '#f43f5e',
          desc: 'Dim forest domain under growing geothermal heat, centered on the Hell Sigil and Moonstead.',
          points: [
            [780, 360], [820, 480], [760, 540], [650, 520], [620, 420], [680, 320]
          ]
        },
        {
          id: 'reg_klabats',
          name: 'Klabats',
          color: '#f59e0b',
          desc: 'Warlike western badlands and deserts of flow warriors, breath discipline, and combat mastery.',
          points: [
            [680, 80], [700, 260], [640, 340], [520, 320], [400, 300], [420, 100], [550, 60]
          ]
        },
        {
          id: 'reg_dynestea',
          name: 'Dynestea',
          color: '#10b981',
          desc: 'The verdant crossroads of all Maladen climates, rich in natural resources and prime magic.',
          points: [
            [650, 520], [720, 680], [620, 680], [500, 660], [450, 540], [480, 380], [620, 420]
          ]
        },
        {
          id: 'reg_altasar',
          name: 'Altasar',
          color: '#eab308',
          desc: 'Wealthy grassland democracy of soul magic, proud research, tiered Droland, and The Spire.',
          points: [
            [740, 820], [720, 920], [580, 940], [460, 880], [450, 720], [500, 660], [620, 680], [720, 680]
          ]
        },
        {
          id: 'reg_cirrusia',
          name: 'Cirrusia',
          color: '#38bdf8',
          desc: 'Cloud-ocean sky realm of floating islands, shifting ecosystems, sky-vines, and violent storms.',
          points: [
            [450, 360], [450, 540], [380, 600], [240, 560], [140, 480], [160, 340], [300, 300]
          ]
        },
        {
          id: 'reg_caybluff',
          name: 'Caybluff',
          color: '#a855f7',
          desc: 'Starlit high plateau of Chroma sorcery, sheer cliffs, and the partially submerged capital Portale.',
          points: [
            [460, 880], [450, 720], [380, 600], [240, 560], [160, 620], [120, 760], [220, 880], [340, 900]
          ]
        },
        {
          id: 'reg_laytide',
          name: 'Laytide',
          color: '#2563eb',
          desc: 'Vast aquatic ocean domain permanently transformed by the historic presence of the sea lord Aquiel.',
          points: [
            [580, 940], [720, 920], [780, 990], [240, 990], [120, 960], [220, 880], [340, 900], [460, 880]
          ]
        }
      ],
      officialLocations: [
        // Giaslan
        {
          id: 'loc_viserions_peak',
          codexId: 'location-viserions-peak',
          name: "Viserion's Peak",
          category: 'Location',
          region: 'Giaslan',
          x: 350,
          y: 880,
          summary: 'A brutal northern height of strange cliffs, jagged ice, localized blizzards, and a hidden Canthian door.'
        },
        {
          id: 'loc_chillspire',
          codexId: 'domain-giaslan',
          name: 'Chillspire',
          category: 'Settlement',
          region: 'Giaslan',
          x: 370,
          y: 870,
          summary: 'The capital of Giaslan, built across Viserion’s Peak where astrologers study constellations.'
        },

        // Alden
        {
          id: 'loc_laregola',
          codexId: 'domain-alden',
          name: 'Laregola',
          category: 'Settlement',
          region: 'Domain of Alden',
          x: 700,
          y: 820,
          summary: 'The fortified imperial capital of Alden, showcasing immense engineering and rigid order.'
        },
        {
          id: 'loc_troldith',
          codexId: 'stories-troldith-and-the-malaise',
          name: 'Troldith',
          category: 'Location',
          region: 'Domain of Alden',
          x: 560,
          y: 760,
          summary: 'A settlement in West Alden named by Caelum as a place where the party can learn more about the Malaise.'
        },
        {
          id: 'loc_gialden_strip',
          codexId: 'domain-alden',
          name: 'The Gialden Strip',
          category: 'Location',
          region: 'Domain of Alden',
          x: 500,
          y: 800,
          summary: 'Mountain surplus corridor rich in metal, shared between Alden and Giaslan.'
        },

        // Hemwood
        {
          id: 'loc_moonstead',
          codexId: 'domain-hemwood',
          name: 'Moonstead',
          category: 'Settlement',
          region: 'Hemwood',
          x: 420,
          y: 700,
          summary: 'The shadowed forest capital of Hemwood, formerly democratic and now gripped by tyranny.'
        },
        {
          id: 'loc_hell_sigil',
          codexId: 'domain-hemwood',
          name: 'The Hell Sigil',
          category: 'Dungeon',
          region: 'Hemwood',
          x: 460,
          y: 720,
          summary: 'An ancient summoning circle and seal radiating unnatural heat throughout the domain.'
        },

        // Klabats
        {
          id: 'loc_klabats',
          codexId: 'domain-klabats',
          name: 'Klabats War Encampment',
          category: 'Settlement',
          region: 'Klabats',
          x: 190,
          y: 540,
          summary: 'Scattered tribal kingdoms of flow warriors dedicated to meditative breath discipline and battle.'
        },

        // Dynestea
        {
          id: 'loc_dynestea',
          codexId: 'domain-dynestea',
          name: 'Heart of Dynestea',
          category: 'Location',
          region: 'Dynestea',
          x: 520,
          y: 560,
          summary: 'The fertile continental crossroads where green forests, deserts, and mountain air converge.'
        },

        // Altasar
        {
          id: 'loc_spire',
          codexId: 'domain-altasar',
          name: 'The Spire',
          category: 'Quest',
          region: 'Altasar',
          x: 760,
          y: 560,
          summary: 'The ancient monolithic Spire rising over Altasar’s heartland, radiating mysterious power.'
        },
        {
          id: 'loc_droland',
          codexId: 'settlement-droland',
          name: 'Droland',
          category: 'Settlement',
          region: 'Altasar',
          x: 820,
          y: 630,
          summary: 'Wealthy soul-magic capital of Altasar with tiered districts, gondolas, and underground waterways.'
        },
        {
          id: 'loc_orville',
          codexId: 'settlement-orville',
          name: 'Orville',
          category: 'Settlement',
          region: 'Altasar',
          x: 700,
          y: 490,
          summary: 'A modest craft and merchant town in southwest Altasar, lately disturbed by missing children.'
        },

        // Caybluff
        {
          id: 'loc_portale',
          codexId: 'settlement-portale',
          name: 'Portale',
          category: 'Settlement',
          region: 'Caybluff',
          x: 850,
          y: 340,
          summary: 'Waterside capital of Caybluff featuring extensive underwater districts built with Cirrusian and Alden aid.'
        },
        {
          id: 'loc_fog_basin',
          codexId: 'location-caybluff-fog-basin',
          name: 'Caybluff Fog Basin',
          category: 'Location',
          region: 'Caybluff',
          x: 820,
          y: 270,
          summary: 'Hidden cavern region reached via ascending river cave; holds ancient Canthian ruins and a baby leviathan.'
        },
        {
          id: 'loc_waveside',
          codexId: 'settlement-waveside',
          name: 'Waveside',
          category: 'Settlement',
          region: 'Caybluff',
          x: 750,
          y: 180,
          summary: 'Southern coastal settlement of sandstone architecture concealing a hidden Unwound facility.'
        },
        {
          id: 'loc_fissure',
          codexId: 'domain-caybluff',
          name: 'The Caybluff Fissure',
          category: 'Location',
          region: 'Caybluff',
          x: 840,
          y: 220,
          summary: 'A colossal ravine revealing a sideways horizon into which fallen objects plummet endlessly.'
        },
        {
          id: 'loc_solare',
          codexId: 'location-mount-solare',
          name: 'Mount Solare',
          category: 'Location',
          region: 'Caybluff',
          x: 680,
          y: 240,
          summary: 'A treacherous, remote mountain lair where high peril promises exceptional rewards.'
        },

        // Laytide
        {
          id: 'loc_ocean_wall',
          codexId: 'location-ocean-wall',
          name: 'The Ocean Wall',
          category: 'Location',
          region: 'Laytide',
          x: 920,
          y: 350,
          summary: 'The violent natural barrier shielding Portale from open waters; houses the Eschaton Caelum.'
        },
        {
          id: 'loc_aquiel',
          codexId: 'domain-laytide',
          name: 'Sunken Domain of Aquiel',
          category: 'Location',
          region: 'Laytide',
          x: 940,
          y: 440,
          summary: 'The aquatic ocean expanse of Laytide, home to leviathans and sea dragons.'
        },

        // Cirrusia
        {
          id: 'loc_cirrusia_isles',
          codexId: 'domain-cirrusia',
          name: 'Cirrusian Sky Isles',
          category: 'Location',
          region: 'Cirrusia',
          x: 440,
          y: 290,
          summary: 'Floating islands drifting on cloud oceans that rotate their positions every few days.'
        },
        {
          id: 'loc_sky_vines',
          codexId: 'domain-cirrusia',
          name: 'Sky-Vines Ascent',
          category: 'Location',
          region: 'Cirrusia',
          x: 480,
          y: 360,
          summary: 'Vast ascending botanical tendrils that bridge the cloud sea to the high floating islands.'
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
      this.activeEditingRegionId = null;
      this.isEditingVertices = false;
      this.isRedrawingRegionId = null;
      this.vertexMarkers = [];
      this.backupEditingPoints = null;

      // Leaflet references
      this.map = null;
      this.imageOverlay = null;
      this.regionPolygonLayers = new Map();
      this.markerLayers = new Map();

      this.loadStorage();
      this.initLeaflet();
      this.setupDOM();
      this.renderAll();
      this.updateDmModeUI();
    }

    isDmMode() {
      if (typeof window.isDmMode === 'function') {
        return window.isDmMode();
      }
      return localStorage.getItem('o_codex_dm_mode') === 'true';
    }

    getPlayerName() {
      return localStorage.getItem('o_codex_player_name') || 'Adventurer';
    }

    updateDmModeUI() {
      const isDm = this.isDmMode();

      // 1. Draw Territory button (Toolbar)
      const drawBtn = document.getElementById('map-tool-draw');
      if (drawBtn) {
        drawBtn.classList.toggle('hidden', !isDm);
      }

      // 2. Edit Map button (Header)
      const editMapBtn = document.getElementById('map-settings-btn');
      if (editMapBtn) {
        editMapBtn.classList.toggle('hidden', !isDm);
      }

      // 3. Copy Data button (Header - DM only and only if multiple maps exist)
      const copyDataBtn = document.getElementById('map-copy-data-btn');
      if (copyDataBtn) {
        copyDataBtn.classList.toggle('hidden', !isDm || (this.maps && this.maps.length <= 1));
      }

      // 4. New Map button in dropdown
      const addNewMapBtn = document.getElementById('map-add-new-btn');
      if (addNewMapBtn) {
        addNewMapBtn.classList.toggle('hidden', !isDm);
      }

      // 5. Territory Manager list & Draw button
      const drawNewTerritoryBtn = document.getElementById('territories-manager-new-btn');
      if (drawNewTerritoryBtn) {
        drawNewTerritoryBtn.classList.toggle('hidden', !isDm);
      }

      // 6. Re-render pins so secret pins appear or disappear
      this.renderPins();

      // 7. Refresh territory list if open
      const manageModal = document.getElementById('manage-territories-modal');
      if (manageModal && !manageModal.classList.contains('hidden')) {
        this.renderTerritoriesManagerList();
      }
    }

    loadStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v2';
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

      // Seamless migration from v1 if v2 does not exist yet
      if (!stored) {
        const v1 = localStorage.getItem('o_codex_cartography_v1');
        if (v1) {
          try {
            const oldData = JSON.parse(v1);
            const oldPins = oldData.maps?.[0]?.playerPins || [];
            if (oldPins.length > 0) {
              DEFAULT_MAPS[0].playerPins = oldPins;
            }
          } catch (e) {}
        }
      }

      if (!this.maps || this.maps.length === 0) {
        this.maps = JSON.parse(JSON.stringify(DEFAULT_MAPS));
        this.saveStorage();
      }

      // If user's stored default map has the old placeholder regions, auto-upgrade to canon Maladen layout
      if (this.maps[0] && this.maps[0].isDefault && (this.maps[0].regions || []).length <= 3) {
        const existingPlayerPins = this.maps[0].playerPins || [];
        this.maps[0] = JSON.parse(JSON.stringify(DEFAULT_MAPS[0]));
        this.maps[0].playerPins = existingPlayerPins;
        this.saveStorage();
      }
    }

    saveStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v2';
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
      this.updateDmModeUI();
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

      // Update Territories button label with count
      const terrLabel = document.getElementById('map-territories-label');
      if (terrLabel) {
        terrLabel.textContent = `Territories (${(activeMap.regions || []).length})`;
      }

      // Map switcher: only render when multiple maps exist; keep hidden until more maps are added
      const selectorContainer = document.getElementById('map-selector-container') || document.querySelector('.map-dropdown-container');
      if (selectorContainer) {
        selectorContainer.classList.toggle('hidden', this.maps.length <= 1);
      }

      // Copy data button: only relevant if multiple maps exist
      const copyBtn = document.getElementById('map-copy-data-btn');
      if (copyBtn) {
        copyBtn.classList.toggle('hidden', this.maps.length <= 1);
      }

      // Populate map list dropdown
      const listEl = document.getElementById('map-selector-list');
      if (listEl && this.maps.length > 1) {
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
          interactive: true
        });

        // Click to inspect territory (DM Mode: Edit modal | Player Mode: Read-only lore view)
        polygon.on('click', (e) => {
          if (this.isDrawingRegion || this.isDroppingPin || this.isEditingVertices) return;
          L.DomEvent.stopPropagation(e);
          if (this.isDmMode()) {
            this.openEditTerritoryModal(reg.id);
          } else {
            this.openViewTerritoryModal(reg.id);
          }
        });

        polygon.on('mouseover', () => {
          if (this.isDrawingRegion || this.isDroppingPin || this.isEditingVertices) return;
          polygon.setStyle({
            weight: 3.5,
            fillOpacity: 0.28
          });
        });

        polygon.on('mouseout', () => {
          if (this.isDrawingRegion || this.isDroppingPin || this.isEditingVertices) return;
          polygon.setStyle({
            weight: this.bordersVisible ? 2 : 0,
            fillOpacity: this.bordersVisible ? 0.15 : 0
          });
        });

        polygon.addTo(this.map);
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

      const isDm = this.isDmMode();

      allPins.forEach(pin => {
        // Access Control: Hide secret pins from players completely
        if (pin.isSecret && !isDm) {
          return;
        }

        const isHighlighted = (pin.codexId || pin.id) === this.currentHighlightedPinId;
        const marker = L.marker([pin.y, pin.x], {
          icon: createMarkerIcon(pin.category, isHighlighted, pin.isSecret),
          title: pin.name || pin.title
        });

        const secretSuffix = pin.isSecret ? ' · 🔒 Secret' : '';
        // Hover tooltip
        marker.bindTooltip(`
          <div class="map-tooltip">
            <strong>${escapeHtml(pin.name || pin.title)}${pin.isSecret ? ' 🔒' : ''}</strong>
            <span>${escapeHtml(pin.category || 'Location')}${pin.region ? ' · ' + escapeHtml(pin.region) : ''}${secretSuffix}</span>
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

      const categoryBadge = document.getElementById('drawer-pin-category');
      if (categoryBadge) {
        if (pin.isSecret) {
          categoryBadge.textContent = `${pin.category || 'General'} · 🔒 DM Secret`;
          categoryBadge.className = 'drawer-badge drawer-badge--secret';
        } else {
          categoryBadge.textContent = pin.category || 'General';
          categoryBadge.className = 'drawer-badge';
        }
      }

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

      // Delete Pin Button (DM or author only, with safe two-step inline confirmation)
      const deleteBtnContainer = document.getElementById('drawer-delete-action');
      if (deleteBtnContainer) {
        deleteBtnContainer.innerHTML = '';

        const isDm = this.isDmMode();
        const playerName = this.getPlayerName();
        // Official locations can ONLY be deleted by the DM.
        // Custom pins can be deleted by DM or the creating player.
        const canDelete = isDm || (!pin.isOfficial && (!pin.author || pin.author === playerName));

        if (canDelete) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'drawer-delete-button';
          delBtn.textContent = pin.isOfficial ? 'Delete Official Location' : 'Delete Pin';

          let isConfirming = false;
          let confirmTimer = null;

          delBtn.addEventListener('click', () => {
            if (!isConfirming) {
              isConfirming = true;
              delBtn.classList.add('is-confirming');
              delBtn.textContent = '⚠️ Click to Confirm Delete';
              confirmTimer = setTimeout(() => {
                isConfirming = false;
                delBtn.classList.remove('is-confirming');
                delBtn.textContent = pin.isOfficial ? 'Delete Official Location' : 'Delete Pin';
              }, 4000);
            } else {
              clearTimeout(confirmTimer);
              this.deletePin(pin.id);
              this.closePinDrawer();
              window.showToast?.(`Removed pin "${pin.name || pin.title}"`, 'info');
            }
          });

          deleteBtnContainer.appendChild(delBtn);
        }
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

      // Reset combobox link state
      this.clearPinCodexLink();

      // Secret pin option (DM Only)
      const secretWrapper = document.getElementById('new-pin-secret-wrapper');
      const secretCheckbox = document.getElementById('new-pin-is-secret');
      if (secretWrapper && secretCheckbox) {
        secretWrapper.classList.toggle('hidden', !this.isDmMode());
        secretCheckbox.checked = false;
      }

      modal.classList.remove('hidden');
    }

    handlePinLinkSearch(rawQuery) {
      const suggestionsEl = document.getElementById('pin-link-suggestions');
      const clearBtn = document.getElementById('pin-link-clear-btn');
      if (!suggestionsEl) return;

      const query = String(rawQuery ?? '').trim();
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !query);
      }

      let matches = [];
      if (typeof window.searchCodexEntries === 'function') {
        matches = window.searchCodexEntries(query, 5);
      } else if (window.state && window.state.worldData && Array.isArray(window.state.worldData.entries)) {
        matches = window.state.worldData.entries.slice(0, 5).map(e => ({
          id: e.id,
          name: e.name || e.title,
          category: e.category,
          summary: e.summary || ''
        }));
      }

      if (matches.length === 0 && query) {
        suggestionsEl.innerHTML = `
          <div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.82rem; text-align: center;">
            No matching lore entries found for "${escapeHtml(query)}".
          </div>
          <div class="pin-suggestion-standalone" id="pin-suggest-none">
            Keep as custom standalone pin (No link)
          </div>
        `;
        document.getElementById('pin-suggest-none')?.addEventListener('click', () => {
          this.clearPinCodexLink();
          this.hidePinLinkSuggestions();
        });
        suggestionsEl.classList.remove('hidden');
        return;
      }

      suggestionsEl.innerHTML = '';
      matches.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'pin-suggestion-item';
        item.innerHTML = `
          <div class="pin-suggestion-header">
            <span class="pin-suggestion-name">${escapeHtml(entry.name)}</span>
            <span class="pin-suggestion-badge">${escapeHtml(entry.category || 'Entry')}</span>
          </div>
          ${entry.summary ? `<span class="pin-suggestion-snippet">${escapeHtml(entry.summary)}</span>` : ''}
        `;
        item.addEventListener('click', () => {
          this.selectPinCodexLink(entry);
        });
        suggestionsEl.appendChild(item);
      });

      // Always include standalone option at bottom
      const standaloneOpt = document.createElement('div');
      standaloneOpt.className = 'pin-suggestion-standalone';
      standaloneOpt.textContent = 'None (Custom Standalone Pin)';
      standaloneOpt.addEventListener('click', () => {
        this.clearPinCodexLink();
        this.hidePinLinkSuggestions();
      });
      suggestionsEl.appendChild(standaloneOpt);

      suggestionsEl.classList.remove('hidden');
    }

    selectPinCodexLink(entry) {
      const hiddenInput = document.getElementById('new-pin-codex-link');
      const badge = document.getElementById('pin-link-selected-badge');
      const categoryBadge = document.getElementById('pin-selected-category');
      const titleBadge = document.getElementById('pin-selected-title');
      const inputWrapper = document.getElementById('pin-link-input-wrapper');
      const searchInput = document.getElementById('new-pin-codex-search');

      if (hiddenInput) hiddenInput.value = entry.id;
      if (categoryBadge) categoryBadge.textContent = entry.category || 'Entry';
      if (titleBadge) titleBadge.textContent = entry.name;
      if (badge) badge.classList.remove('hidden');
      if (inputWrapper) inputWrapper.classList.add('hidden');
      if (searchInput) searchInput.value = '';

      this.hidePinLinkSuggestions();

      // Auto-fill pin title if empty
      const titleInput = document.getElementById('new-pin-title');
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = entry.name;
      }

      // Auto-select matching category
      const categorySelect = document.getElementById('new-pin-category');
      if (categorySelect && entry.category) {
        const catMap = {
          settlement: 'Settlement',
          settlements: 'Settlement',
          domain: 'Domain',
          domains: 'Domain',
          location: 'Location',
          locations: 'Location',
          quest: 'Quest',
          quests: 'Quest',
          dungeon: 'Dungeon',
          dungeons: 'Dungeon'
        };
        const mapped = catMap[entry.category.toLowerCase()];
        if (mapped) {
          categorySelect.value = mapped;
        }
      }
    }

    clearPinCodexLink() {
      const hiddenInput = document.getElementById('new-pin-codex-link');
      const badge = document.getElementById('pin-link-selected-badge');
      const inputWrapper = document.getElementById('pin-link-input-wrapper');
      const searchInput = document.getElementById('new-pin-codex-search');
      const clearBtn = document.getElementById('pin-link-clear-btn');

      if (hiddenInput) hiddenInput.value = '';
      if (badge) badge.classList.add('hidden');
      if (inputWrapper) inputWrapper.classList.remove('hidden');
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');
    }

    hidePinLinkSuggestions() {
      document.getElementById('pin-link-suggestions')?.classList.add('hidden');
    }

    saveNewPin() {
      const title = document.getElementById('new-pin-title').value.trim();
      if (!title) {
        window.showToast?.('Please give the pin a name or title.', 'warning');
        return;
      }

      const category = document.getElementById('new-pin-category').value;
      const notes = document.getElementById('new-pin-notes').value.trim();
      const codexId = document.getElementById('new-pin-codex-link')?.value || null;
      const coords = this.pendingPinCoords || { x: 500, y: 500 };

      const activeMap = this.getActiveMap();
      if (!activeMap.playerPins) activeMap.playerPins = [];

      const isSecret = this.isDmMode() && Boolean(document.getElementById('new-pin-is-secret')?.checked);

      const newPin = {
        id: `pin_${Date.now()}`,
        author: this.isDmMode() ? 'Dungeon Master' : this.getPlayerName(),
        authorColor: this.isDmMode() ? '#f59e0b' : '#5ae8ff',
        name: title,
        title: title,
        category: category,
        x: coords.x,
        y: coords.y,
        note: notes,
        summary: notes,
        codexId: codexId,
        isOfficial: false,
        isSecret: isSecret,
        createdAt: Date.now()
      };

      activeMap.playerPins.push(newPin);
      this.saveStorage();
      this.renderPins();
      this.closeModal('create-pin-modal');
      window.showToast?.(isSecret ? `Created secret pin "${title}" 🔒` : `Placed pin "${title}"`, isSecret ? 'dm' : 'success');
    }

    // Territory Drawing Workflow
    startTerritoryDrawMode() {
      if (!this.isDmMode()) {
        window.showToast?.('Drawing territory boundaries is restricted to the Dungeon Master.', 'warning');
        return;
      }

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
          window.showToast?.(`Please add at least 3 boundary points before closing the territory (currently ${this.drawingPoints.length}).`, 'warning');
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
        window.showToast?.('A territory requires at least 3 points. Click on the map to add points.', 'warning');
        return;
      }

      // If redrawing an existing territory's shape
      if (this.isRedrawingRegionId) {
        const activeMap = this.getActiveMap();
        const reg = (activeMap.regions || []).find(r => r.id === this.isRedrawingRegionId);
        if (reg) {
          reg.points = [...this.drawingPoints];
          this.saveStorage();
          this.exitTerritoryDrawMode();
          this.drawingPoints = [];
          this.isRedrawingRegionId = null;
          this.renderRegions();
          this.renderHeaderUI();
          window.showToast?.(`Successfully updated boundaries for "${reg.name}"!`, 'success');
          return;
        }
        this.isRedrawingRegionId = null;
      }

      this.exitTerritoryDrawMode();
      this.openSaveTerritoryModal();
    }

    cancelTerritoryDraw() {
      this.exitTerritoryDrawMode();
      this.drawingPoints = [];
      this.closeModal('save-territory-modal');

      if (this.isRedrawingRegionId) {
        this.isRedrawingRegionId = null;
        this.renderRegions();
      }
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
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can define realm territories.', 'warning');
        return;
      }

      const name = document.getElementById('new-territory-name').value.trim();
      if (!name) {
        window.showToast?.('Please enter a territory name.', 'warning');
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
      this.renderHeaderUI();
      this.closeModal('save-territory-modal');
      window.showToast?.(`Saved domain territory "${name}"!`, 'success');
    }

    // Territory Editing & Management
    openEditTerritoryModal(regionId) {
      if (!this.isDmMode()) {
        this.openViewTerritoryModal(regionId);
        return;
      }

      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === regionId);
      if (!reg) return;

      this.activeEditingRegionId = regionId;
      const modal = document.getElementById('edit-territory-modal');
      if (!modal) return;

      document.getElementById('edit-territory-modal-title').textContent = `Edit "${reg.name}"`;
      document.getElementById('edit-territory-name').value = reg.name || '';
      document.getElementById('edit-territory-color').value = reg.color || '#5ae8ff';
      document.getElementById('edit-territory-desc').value = reg.desc || '';
      document.getElementById('edit-territory-meta').textContent = `${(reg.points || []).length} boundary vertices · ID: ${reg.id}`;

      // Reset delete confirmation button state
      const delBtn = document.getElementById('delete-territory-btn');
      if (delBtn) {
        delBtn.classList.remove('is-confirming');
        delBtn.textContent = 'Delete Territory';
      }

      modal.classList.remove('hidden');
    }

    // Read-only Territory Lore Inspector (Safe for Players)
    openViewTerritoryModal(regionId) {
      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === regionId);
      if (!reg) return;

      const modal = document.getElementById('view-territory-modal');
      if (!modal) return;

      const nameEl = document.getElementById('view-territory-name');
      const metaEl = document.getElementById('view-territory-meta');
      const descEl = document.getElementById('view-territory-desc');
      const catEl = document.getElementById('view-territory-category');

      if (nameEl) nameEl.textContent = reg.name || 'Territory';
      if (metaEl) metaEl.textContent = `${(reg.points || []).length} boundary vertices · Established Realm`;
      if (catEl) {
        catEl.textContent = 'Domain Realm';
        catEl.style.color = reg.color || '#5ae8ff';
      }
      if (descEl) descEl.textContent = reg.desc || 'No historical lore or description recorded for this realm yet.';

      modal.classList.remove('hidden');
    }

    saveEditTerritory() {
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can modify territories.', 'warning');
        return;
      }

      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === this.activeEditingRegionId);
      if (!reg) return;

      const name = document.getElementById('edit-territory-name').value.trim();
      if (!name) {
        window.showToast?.('Please enter a valid territory name.', 'warning');
        return;
      }

      reg.name = name;
      reg.color = document.getElementById('edit-territory-color').value || '#5ae8ff';
      reg.desc = document.getElementById('edit-territory-desc').value.trim();

      this.saveStorage();
      this.renderRegions();
      this.renderHeaderUI();
      this.closeModal('edit-territory-modal');
      this.renderTerritoriesManagerList();
      window.showToast?.(`Updated territory "${reg.name}".`, 'success');
    }

    deleteTerritory(regionId) {
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can delete territories.', 'warning');
        return;
      }

      const targetId = regionId || this.activeEditingRegionId;
      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === targetId);
      if (!reg) return;

      activeMap.regions = activeMap.regions.filter(r => r.id !== targetId);
      this.saveStorage();
      this.renderRegions();
      this.renderHeaderUI();
      this.closeModal('edit-territory-modal');
      this.renderTerritoriesManagerList();
      window.showToast?.(`Territory "${reg.name}" deleted.`, 'info');
    }

    startMovingVertices(regionId) {
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can modify boundary vertices.', 'warning');
        return;
      }

      const targetId = regionId || this.activeEditingRegionId;
      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === targetId);
      if (!reg || !reg.points || reg.points.length === 0) return;

      this.closeModal('edit-territory-modal');
      this.closeModal('manage-territories-modal');

      this.isEditingVertices = true;
      this.activeEditingRegionId = targetId;
      this.backupEditingPoints = JSON.parse(JSON.stringify(reg.points));
      this.clearVertexMarkers();

      document.getElementById('vertex-move-banner')?.classList.remove('hidden');

      // Create draggable handle for each vertex
      reg.points.forEach((pt, idx) => {
        const marker = L.marker([pt[0], pt[1]], {
          draggable: true,
          zIndexOffset: 2500,
          icon: L.divIcon({
            className: 'custom-vertex-handle-marker',
            html: `
              <div class="vertex-handle-dot" title="Drag to move vertex ${idx + 1}">
                <span class="vertex-handle-core" style="background: ${reg.color || '#5ae8ff'};"></span>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(this.map);

        marker.on('drag', (e) => {
          const newY = Math.round(Math.max(0, Math.min(1000, e.latlng.lat)));
          const newX = Math.round(Math.max(0, Math.min(1000, e.latlng.lng)));
          reg.points[idx] = [newY, newX];

          const polyLayer = this.regionPolygonLayers.get(reg.id);
          if (polyLayer) {
            polyLayer.setLatLngs(reg.points);
          }
        });

        this.vertexMarkers.push(marker);
      });
    }

    finishMovingVertices() {
      this.saveStorage();
      this.clearVertexMarkers();
      this.isEditingVertices = false;
      this.backupEditingPoints = null;
      document.getElementById('vertex-move-banner')?.classList.add('hidden');
      this.renderRegions();
      this.renderHeaderUI();
    }

    cancelMovingVertices() {
      const activeMap = this.getActiveMap();
      const reg = (activeMap.regions || []).find(r => r.id === this.activeEditingRegionId);
      if (reg && this.backupEditingPoints) {
        reg.points = this.backupEditingPoints;
      }
      this.clearVertexMarkers();
      this.isEditingVertices = false;
      this.backupEditingPoints = null;
      document.getElementById('vertex-move-banner')?.classList.add('hidden');
      this.renderRegions();
    }

    clearVertexMarkers() {
      this.vertexMarkers.forEach(m => this.map.removeLayer(m));
      this.vertexMarkers = [];
    }

    startRedrawTerritory(regionId) {
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can redraw territory boundaries.', 'warning');
        return;
      }

      const targetId = regionId || this.activeEditingRegionId;
      this.closeModal('edit-territory-modal');
      this.closeModal('manage-territories-modal');
      this.isRedrawingRegionId = targetId;

      // Temporarily remove the existing polygon visual layer
      const poly = this.regionPolygonLayers.get(targetId);
      if (poly) {
        this.map.removeLayer(poly);
      }

      this.startTerritoryDrawMode();
    }

    openManageTerritoriesModal() {
      this.renderTerritoriesManagerList();
      document.getElementById('manage-territories-modal')?.classList.remove('hidden');
    }

    renderTerritoriesManagerList() {
      const listEl = document.getElementById('territories-manager-list');
      if (!listEl) return;

      const activeMap = this.getActiveMap();
      const regions = activeMap.regions || [];
      const isDm = this.isDmMode();

      // Adjust header summary based on DM mode
      const summaryEl = document.querySelector('#manage-territories-modal .modal__summary');
      if (summaryEl) {
        summaryEl.textContent = isDm
          ? 'Inspect, edit, adjust boundaries, or delete realm territories on this layer.'
          : 'Browse established realm territories and domain lore on this map layer.';
      }

      const drawNewBtn = document.getElementById('territories-manager-new-btn');
      if (drawNewBtn) {
        drawNewBtn.classList.toggle('hidden', !isDm);
      }

      if (regions.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            No territories defined yet on this map layer.${isDm ? ' Click "+ Draw New Territory" below to create one!' : ''}
          </div>
        `;
        return;
      }

      listEl.innerHTML = '';
      regions.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'territory-item-card';

        const actionsHtml = isDm ? `
          <div class="territory-item-actions">
            <button type="button" class="territory-btn-mini territory-btn-mini--edit btn-edit-reg" title="Edit territory settings">Edit</button>
            <button type="button" class="territory-btn-mini territory-btn-mini--edit btn-move-reg" title="Move & drag boundary points">Move</button>
            <button type="button" class="territory-btn-mini territory-btn-mini--delete btn-del-reg" title="Delete territory">✕</button>
          </div>
        ` : '';

        item.innerHTML = `
          <div class="territory-item-info">
            <span class="territory-color-pill" style="background-color: ${escapeHtml(reg.color || '#5ae8ff')}; color: ${escapeHtml(reg.color || '#5ae8ff')};"></span>
            <div class="territory-item-text">
              <span class="territory-item-name">${escapeHtml(reg.name)}</span>
              <span class="territory-item-meta">${(reg.points || []).length} vertices${reg.desc ? ' · ' + escapeHtml(reg.desc) : ''}</span>
            </div>
          </div>
          ${actionsHtml}
        `;

        item.querySelector('.territory-item-info').addEventListener('click', () => {
          this.closeModal('manage-territories-modal');
          if (isDm) {
            this.openEditTerritoryModal(reg.id);
          } else {
            this.openViewTerritoryModal(reg.id);
          }
          const poly = this.regionPolygonLayers.get(reg.id);
          if (poly) {
            this.map.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 1 });
          }
        });

        if (isDm) {
          item.querySelector('.btn-edit-reg')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeModal('manage-territories-modal');
            this.openEditTerritoryModal(reg.id);
          });

          item.querySelector('.btn-move-reg')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startMovingVertices(reg.id);
          });

          const delMiniBtn = item.querySelector('.btn-del-reg');
          let delMiniConfirming = false;
          let delMiniTimer = null;
          delMiniBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!delMiniConfirming) {
              delMiniConfirming = true;
              delMiniBtn.classList.add('is-confirming');
              delMiniBtn.textContent = 'Del?';
              delMiniTimer = setTimeout(() => {
                delMiniConfirming = false;
                delMiniBtn.classList.remove('is-confirming');
                delMiniBtn.textContent = '✕';
              }, 4000);
            } else {
              clearTimeout(delMiniTimer);
              this.deleteTerritory(reg.id);
            }
          });
        }

        listEl.appendChild(item);
      });
    }

    // Feature A: Copy & Paste Data Between Maps (DM Only)
    openCopyDataModal() {
      if (!this.isDmMode()) {
        window.showToast?.('Copying map layers is restricted to the Dungeon Master.', 'warning');
        return;
      }

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
      if (!this.isDmMode()) {
        window.showToast?.('Copying map layers is restricted to the Dungeon Master.', 'warning');
        return;
      }

      const sourceMapId = document.getElementById('copy-source-map-select')?.value;
      const sourceMap = this.maps.find(m => m.id === sourceMapId);
      if (!sourceMap) {
        window.showToast?.('Please select a valid source map layer.', 'warning');
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
      window.showToast?.(`Copied data from "${sourceMap.title}" into "${activeMap.title}"!`, 'success');
    }

    // Feature B: Update Map Image (DM Only)
    openEditMapModal() {
      if (!this.isDmMode()) {
        window.showToast?.('Map layer settings are restricted to the Dungeon Master.', 'warning');
        return;
      }

      const modal = document.getElementById('edit-map-modal');
      if (!modal) return;

      const activeMap = this.getActiveMap();
      document.getElementById('edit-map-title').value = activeMap.title;
      document.getElementById('edit-map-subtitle').value = activeMap.subtitle || '';
      document.getElementById('edit-map-image-url').value = activeMap.imageSource.startsWith('data:') ? '' : activeMap.imageSource;

      modal.classList.remove('hidden');
    }

    saveEditMap() {
      if (!this.isDmMode()) {
        window.showToast?.('Only the Dungeon Master can modify map layer settings.', 'warning');
        return;
      }

      const activeMap = this.getActiveMap();
      const title = document.getElementById('edit-map-title').value.trim();
      const subtitle = document.getElementById('edit-map-subtitle').value.trim();
      const imageUrl = document.getElementById('edit-map-image-url').value.trim();

      if (!title) {
        window.showToast?.('Map title cannot be blank.', 'warning');
        return;
      }

      activeMap.title = title;
      activeMap.subtitle = subtitle;
      if (imageUrl) activeMap.imageSource = imageUrl;

      this.saveStorage();
      this.switchActiveMap(activeMap.id);
      this.closeModal('edit-map-modal');
      window.showToast?.(`Updated map settings for "${activeMap.title}".`, 'success');
    }

    // Create New Map Layer (DM Only)
    openCreateMapModal() {
      if (!this.isDmMode()) {
        window.showToast?.('Creating new map layers is restricted to the Dungeon Master.', 'warning');
        return;
      }

      const modal = document.getElementById('create-map-modal');
      if (!modal) return;
      document.getElementById('new-map-title').value = '';
      document.getElementById('new-map-subtitle').value = '';
      document.getElementById('new-map-image-url').value = '';
      modal.classList.remove('hidden');
    }

    saveNewMap() {
      if (!this.isDmMode()) {
        window.showToast?.('Creating new map layers is restricted to the Dungeon Master.', 'warning');
        return;
      }

      const title = document.getElementById('new-map-title').value.trim();
      if (!title) {
        window.showToast?.('Please give your new map layer a title.', 'warning');
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
      window.showToast?.(`Created new map layer "${title}"!`, 'success');
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
      document.getElementById('map-territories-btn')?.addEventListener('click', () => this.openManageTerritoriesModal());

      // Wire Toolbar Tools
      document.getElementById('map-tool-pin')?.addEventListener('click', () => this.startPinDropMode());
      document.getElementById('map-tool-draw')?.addEventListener('click', () => this.startTerritoryDrawMode());
      document.getElementById('map-toggle-borders-btn')?.addEventListener('click', () => this.toggleBorders());
      document.getElementById('map-drawer-close')?.addEventListener('click', () => this.closePinDrawer());

      // Wire Drawing Banner Actions
      document.getElementById('drawing-finish-btn')?.addEventListener('click', () => this.finishTerritoryDraw());
      document.getElementById('drawing-cancel-btn')?.addEventListener('click', () => this.cancelTerritoryDraw());
      document.getElementById('pin-drop-cancel-btn')?.addEventListener('click', () => this.exitPinDropMode());

      // Wire Vertex Move Banner Actions
      document.getElementById('vertex-move-done-btn')?.addEventListener('click', () => this.finishMovingVertices());
      document.getElementById('vertex-move-cancel-btn')?.addEventListener('click', () => this.cancelMovingVertices());

      // Wire Modals
      document.getElementById('save-new-pin-btn')?.addEventListener('click', () => this.saveNewPin());
      document.getElementById('cancel-new-pin-btn')?.addEventListener('click', () => this.closeModal('create-pin-modal'));

      // Pin Modal Codex Link Combobox
      const codexSearchInput = document.getElementById('new-pin-codex-search');
      codexSearchInput?.addEventListener('input', (e) => this.handlePinLinkSearch(e.target.value));
      codexSearchInput?.addEventListener('focus', (e) => this.handlePinLinkSearch(e.target.value));
      document.getElementById('pin-link-clear-btn')?.addEventListener('click', () => {
        if (codexSearchInput) codexSearchInput.value = '';
        this.handlePinLinkSearch('');
      });
      document.getElementById('pin-selected-remove-btn')?.addEventListener('click', () => {
        this.clearPinCodexLink();
      });

      // Outside click handler to hide combobox suggestions
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#pin-link-combobox')) {
          this.hidePinLinkSuggestions();
        }
      });

      // Save Territory Modal
      document.getElementById('save-new-territory-btn')?.addEventListener('click', () => this.saveNewTerritory());
      document.getElementById('cancel-new-territory-btn')?.addEventListener('click', () => this.cancelTerritoryDraw());
      document.getElementById('close-save-territory-btn')?.addEventListener('click', () => this.cancelTerritoryDraw());

      // Edit Territory Modal
      document.getElementById('save-edit-territory-btn')?.addEventListener('click', () => this.saveEditTerritory());
      document.getElementById('cancel-edit-territory-btn')?.addEventListener('click', () => this.closeModal('edit-territory-modal'));
      document.getElementById('close-edit-territory-btn')?.addEventListener('click', () => this.closeModal('edit-territory-modal'));

      let delTerritoryConfirming = false;
      let delTerritoryTimer = null;
      const delTerritoryBtn = document.getElementById('delete-territory-btn');
      delTerritoryBtn?.addEventListener('click', () => {
        if (!this.isDmMode()) {
          window.showToast?.('Only the Dungeon Master can delete territories.', 'warning');
          return;
        }
        if (!delTerritoryConfirming) {
          delTerritoryConfirming = true;
          delTerritoryBtn.classList.add('is-confirming');
          delTerritoryBtn.textContent = '⚠️ Confirm Delete Territory?';
          delTerritoryTimer = setTimeout(() => {
            delTerritoryConfirming = false;
            delTerritoryBtn.classList.remove('is-confirming');
            delTerritoryBtn.textContent = 'Delete Territory';
          }, 4000);
        } else {
          clearTimeout(delTerritoryTimer);
          delTerritoryConfirming = false;
          delTerritoryBtn.classList.remove('is-confirming');
          delTerritoryBtn.textContent = 'Delete Territory';
          this.deleteTerritory();
        }
      });

      document.getElementById('edit-territory-move-pts-btn')?.addEventListener('click', () => this.startMovingVertices());
      document.getElementById('edit-territory-redraw-btn')?.addEventListener('click', () => this.startRedrawTerritory());

      // Read-Only Territory View Modal (Player)
      document.getElementById('close-view-territory-btn')?.addEventListener('click', () => this.closeModal('view-territory-modal'));
      document.getElementById('done-view-territory-btn')?.addEventListener('click', () => this.closeModal('view-territory-modal'));

      // Manage All Territories Modal
      document.getElementById('close-manage-territories-btn')?.addEventListener('click', () => this.closeModal('manage-territories-modal'));
      document.getElementById('done-manage-territories-btn')?.addEventListener('click', () => this.closeModal('manage-territories-modal'));
      document.getElementById('territories-manager-new-btn')?.addEventListener('click', () => {
        this.closeModal('manage-territories-modal');
        this.startTerritoryDrawMode();
      });

      // Copy Data Modal
      document.getElementById('execute-copy-data-btn')?.addEventListener('click', () => this.executeCopyData());
      document.getElementById('cancel-copy-data-btn')?.addEventListener('click', () => this.closeModal('copy-map-data-modal'));

      // Edit Map Modal
      document.getElementById('save-edit-map-btn')?.addEventListener('click', () => this.saveEditMap());
      document.getElementById('cancel-edit-map-btn')?.addEventListener('click', () => this.closeModal('edit-map-modal'));

      // Create Map Modal
      document.getElementById('save-new-map-btn')?.addEventListener('click', () => this.saveNewMap());
      document.getElementById('cancel-new-map-btn')?.addEventListener('click', () => this.closeModal('create-map-modal'));

      // Modal backdrop clicks to close
      const modalBackdrops = [
        { id: 'create-pin-modal', onCancel: () => this.closeModal('create-pin-modal') },
        { id: 'save-territory-modal', onCancel: () => this.cancelTerritoryDraw() },
        { id: 'edit-territory-modal', onCancel: () => this.closeModal('edit-territory-modal') },
        { id: 'view-territory-modal', onCancel: () => this.closeModal('view-territory-modal') },
        { id: 'manage-territories-modal', onCancel: () => this.closeModal('manage-territories-modal') },
        { id: 'copy-map-data-modal', onCancel: () => this.closeModal('copy-map-data-modal') },
        { id: 'edit-map-modal', onCancel: () => this.closeModal('edit-map-modal') },
        { id: 'create-map-modal', onCancel: () => this.closeModal('create-map-modal') }
      ];

      modalBackdrops.forEach(({ id, onCancel }) => {
        const modal = document.getElementById(id);
        const backdrop = modal?.querySelector('.modal__backdrop');
        backdrop?.addEventListener('click', onCancel);
      });

      // Escape key handler for active map workflows
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.isDrawingRegion) {
            this.cancelTerritoryDraw();
            return;
          }
          if (this.isEditingVertices) {
            this.cancelMovingVertices();
            return;
          }
          if (this.isDroppingPin) {
            this.exitPinDropMode();
            return;
          }
          for (const { id, onCancel } of modalBackdrops) {
            const m = document.getElementById(id);
            if (m && !m.classList.contains('hidden')) {
              onCancel();
              return;
            }
          }
          const drawer = document.getElementById('map-pin-drawer');
          if (drawer && !drawer.classList.contains('is-collapsed')) {
            this.closePinDrawer();
          }
        }
      });

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
