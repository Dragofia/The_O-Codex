/* ============================================================================
   THE O-CODEX — CARTOGRAPHY & INTERACTIVE MAP ENGINE
   Coordinates: Leaflet L.CRS.Simple on normalized 0-1000 x 0-1000 grid.
   Bridge: window.CodexMapBridge { navigateToPin(codexId), navigateToCodex(codexId) }
============================================================================ */

(function () {
  'use strict';

  /* ========================================================================
     1. PROCEDURAL FANTASY MAP SVG GENERATOR (Inkarnate-Styled 3x3 Maladen Grid)
     ======================================================================== */
  function createProceduralFantasyMapSvg() {
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
      <defs>
        <!-- Domain Biome Background Gradients -->
        <linearGradient id="giaslanSnowBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="45%" stop-color="#eef2f6" />
          <stop offset="100%" stop-color="#dce4ed" />
        </linearGradient>
        <linearGradient id="altasarPlainsBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a49f5a" />
          <stop offset="60%" stop-color="#938e4d" />
          <stop offset="100%" stop-color="#807c40" />
        </linearGradient>
        <linearGradient id="caybluffPlateauBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6e5728" />
          <stop offset="50%" stop-color="#5c471e" />
          <stop offset="100%" stop-color="#4a3715" />
        </linearGradient>
        <linearGradient id="aldenAridBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3d2c1d" />
          <stop offset="100%" stop-color="#22180e" />
        </linearGradient>
        <linearGradient id="klabatsDesertBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a3215" />
          <stop offset="100%" stop-color="#2a1c0b" />
        </linearGradient>
        <linearGradient id="dynesteaPrimeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#143622" />
          <stop offset="100%" stop-color="#0a1d13" />
        </linearGradient>
        <linearGradient id="cirrusiaSkyBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#132c45" />
          <stop offset="100%" stop-color="#0a1624" />
        </linearGradient>
        <linearGradient id="hemwoodDarkBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#211020" />
          <stop offset="100%" stop-color="#0e050e" />
        </linearGradient>
        <linearGradient id="laytideOceanBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0c2547" />
          <stop offset="100%" stop-color="#040e1c" />
        </linearGradient>

        <!-- Water and Sand fills -->
        <linearGradient id="freshWater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#48a0b5" />
          <stop offset="100%" stop-color="#2b7185" />
        </linearGradient>
        <linearGradient id="caybluffBeach" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#5c471e" />
          <stop offset="15%" stop-color="#dcc188" />
          <stop offset="100%" stop-color="#c9ad72" />
        </linearGradient>

        <pattern id="domainGridLines" width="333.33" height="333.33" patternUnits="userSpaceOnUse">
          <path d="M 333.33 0 L 0 0 0 333.33" fill="none" stroke="rgba(90, 232, 255, 0.12)" stroke-width="1.2" stroke-dasharray="4,6" />
        </pattern>
      </defs>

      <!-- Deep Map Parchment Base -->
      <rect width="1000" height="1000" fill="#040913" />

      <!-- 3x3 MALADEN BIOME BASE TILES -->
      <!-- Row 1: North -->
      <rect x="0" y="0" width="335" height="335" fill="url(#aldenAridBg)" />
      <rect x="335" y="0" width="335" height="335" fill="url(#klabatsDesertBg)" />
      <rect x="670" y="0" width="330" height="335" fill="url(#dynesteaPrimeBg)" />

      <!-- Row 2: Middle -->
      <!-- GIASLAN: Snowy Glacial Tundra -->
      <rect x="0" y="335" width="335" height="335" fill="url(#giaslanSnowBg)" />
      <!-- ALTASAR: Golden Grassland Plains -->
      <rect x="335" y="335" width="335" height="335" fill="url(#altasarPlainsBg)" />
      <!-- CIRRUSIA: Cloud Ocean Sky Realm -->
      <rect x="670" y="335" width="330" height="335" fill="url(#cirrusiaSkyBg)" />

      <!-- Row 3: South -->
      <!-- HEMWOOD: Shadowed Heated Forest -->
      <rect x="0" y="670" width="335" height="330" fill="url(#hemwoodDarkBg)" />
      <!-- CAYBLUFF: Earthy Plateau & Coastal Beach -->
      <rect x="335" y="670" width="335" height="330" fill="url(#caybluffPlateauBg)" />
      <!-- LAYTIDE: Vast Eastern Ocean -->
      <rect x="670" y="670" width="330" height="330" fill="url(#laytideOceanBg)" />

      <!-- ======================================================================
           DETAILED INKARNATE ARTWORK: GIASLAN (x: 0-335, y: 335-670)
           ====================================================================== -->
      <!-- Northern Gialden Strip Mountains (along border to Alden) -->
      <g id="inkarnate-gialden-strip" fill="#6c5543" stroke="#3b2b20" stroke-width="1.2">
        <polygon points="20,360 45,340 70,360" />
        <polygon points="65,362 95,338 125,362" />
        <polygon points="120,365 150,342 180,365" />
        <polygon points="210,362 245,338 280,362" />
        <polygon points="275,365 305,340 330,365" />
        <!-- Snow highlight ridge lines -->
        <path d="M 45,340 L 45,360 M 95,338 L 95,362 M 150,342 L 150,365 M 245,338 L 245,362 M 305,340 L 305,365" stroke="#f1f5f9" stroke-width="1.5" />
      </g>

      <!-- Froslan Lake with Island Tower (Northeast Giaslan) -->
      <g id="inkarnate-froslan">
        <ellipse cx="255" cy="405" rx="38" ry="24" fill="#6daab8" stroke="#376874" stroke-width="2" />
        <circle cx="255" cy="405" r="7" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
        <polygon points="255,398 252,408 258,408" fill="#1e293b" />
      </g>

      <!-- Oresalt Lake & Mines (Northwest Giaslan) -->
      <g id="inkarnate-oresalt">
        <path d="M 80,410 Q 95,385 110,415 T 85,445 Z" fill="#78b5c4" stroke="#3d6f7a" stroke-width="1.5" />
        <polygon points="50,420 65,390 80,420" fill="#846e5b" stroke="#4a3b2f" stroke-width="1" />
      </g>

      <!-- Viserion's Peak & Chillspire Fortress Complex (Center Giaslan) -->
      <g id="inkarnate-viserions-peak" stroke="#334155" stroke-width="1.5">
        <!-- Massive central mountain range -->
        <polygon points="110,545 165,440 220,545" fill="#475569" />
        <polygon points="140,550 165,465 190,550" fill="#334155" />
        <polygon points="80,530 115,465 150,530" fill="#64748b" />
        <polygon points="180,535 215,470 250,535" fill="#64748b" />
        <!-- Snow cap peaks -->
        <polygon points="152,465 165,440 178,465" fill="#ffffff" stroke="none" />
        <polygon points="107,480 115,465 123,480" fill="#ffffff" stroke="none" />
        <polygon points="207,485 215,470 223,485" fill="#ffffff" stroke="none" />
        <!-- Chillspire fortress citadel in the center mountain saddle -->
        <rect x="156" y="488" width="18" height="14" fill="#0f172a" stroke="#94a3b8" stroke-width="1.2" />
        <polygon points="153,488 165,476 177,488" fill="#1e293b" stroke="#7dd3fc" stroke-width="1" />
      </g>

      <!-- Shadewood Grove (Dead trees on eastern flank of Viserion's Peak) -->
      <g id="inkarnate-shadewood" stroke="#1e293b" stroke-width="1" stroke-linecap="round">
        <path d="M 200,505 L 200,490 M 197,495 L 200,492 L 203,497" />
        <path d="M 208,508 L 208,493 M 205,498 L 208,495 L 211,500" />
        <path d="M 216,506 L 216,492 M 213,497 L 216,494 L 219,499" />
      </g>

      <!-- Saltwater Camp & Lake (Southeast Giaslan) -->
      <g id="inkarnate-saltwater">
        <ellipse cx="250" cy="640" rx="32" ry="18" fill="#5c9aa8" stroke="#2d5e6a" stroke-width="1.5" />
        <polygon points="220,610 240,580 260,610" fill="#715c4c" stroke="#3b2d23" stroke-width="1" />
        <polygon points="255,615 275,585 295,615" fill="#715c4c" stroke="#3b2d23" stroke-width="1" />
      </g>

      <!-- Snowden Pine Tree Line (Southern border to Hemwood) -->
      <g id="inkarnate-snowden-pines" fill="#1e3a29" stroke="#0e1f15" stroke-width="0.8">
        <polygon points="120,665 125,650 130,665" />
        <polygon points="140,665 145,648 150,665" />
        <polygon points="160,665 165,646 170,665" />
        <polygon points="180,665 185,648 190,665" />
        <polygon points="200,665 205,650 210,665" />
      </g>

      <!-- ======================================================================
           DETAILED INKARNATE ARTWORK: ALTASAR (x: 335-665, y: 335-670)
           ====================================================================== -->
      <!-- Mirage Bay & Lakes (Northwest Altasar) -->
      <g id="inkarnate-mirage-bay">
        <path d="M 370,360 Q 410,345 420,380 T 380,440 Q 360,420 370,360 Z" fill="url(#freshWater)" stroke="#225361" stroke-width="1.8" />
        <ellipse cx="450" cy="405" rx="34" ry="26" fill="url(#freshWater)" stroke="#225361" stroke-width="1.8" />
      </g>

      <!-- Talsancea Falls Mountains (West-Central Altasar) -->
      <g id="inkarnate-talsancea" stroke="#4d422e" stroke-width="1.2" fill="#736345">
        <polygon points="415,485 435,445 455,485" />
        <polygon points="445,490 465,450 485,490" />
        <!-- Waterfalls line -->
        <path d="M 450,455 Q 455,485 450,515" fill="none" stroke="#67e8f9" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- Altasar River System (cascading from Talsancea past Droland & Orville into Caybluff) -->
      <path d="M 450,515 Q 470,535 480,560 Q 485,590 465,620 Q 430,640 400,650 T 470,670" 
            fill="none" stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round" opacity="0.9" />
      <!-- Southwest River Delta Lakes -->
      <ellipse cx="410,545" rx="30" ry="20" fill="url(#freshWater)" stroke="#225361" stroke-width="1.5" />
      <path d="M 520,640 Q 560,630 580,660 T 540,670 Z" fill="url(#freshWater)" stroke="#225361" stroke-width="1.5" />

      <!-- Knotwood Forest & Eastern Lake (Northeast Altasar) -->
      <g id="inkarnate-knotwood">
        <!-- Forest canopy clump -->
        <ellipse cx="575" cy="460" rx="46" ry="34" fill="#2d5324" stroke="#193313" stroke-width="1.5" />
        <ellipse cx="550" cy="445" rx="30" ry="24" fill="#35612b" stroke="#193313" stroke-width="1" />
        <ellipse cx="600" cy="470" rx="28" ry="20" fill="#24451c" stroke="#193313" stroke-width="1" />
        <!-- Eastern Lake -->
        <ellipse cx="630" cy="475" rx="26" ry="18" fill="url(#freshWater)" stroke="#225361" stroke-width="1.5" />
      </g>

      <!-- Mountain Ridges on Altasar Edges -->
      <g id="altasar-boundary-mountains" stroke="#473a27" stroke-width="1.2" fill="#695639">
        <polygon points="580,390 600,365 620,390" />
        <polygon points="610,395 630,370 650,395" />
        <polygon points="560,625 585,595 610,625" />
        <polygon points="595,630 620,600 645,630" />
      </g>

      <!-- Altasar Spire Monolith (North of Droland) -->
      <g id="inkarnate-altasar-spire" transform="translate(475, 435)">
        <ellipse cx="0" cy="10" rx="28" ry="14" fill="#141a12" stroke="#eab308" stroke-width="1.5" stroke-dasharray="3,3" />
        <polygon points="-12,10 0,-48 12,10" fill="#090d09" stroke="#ca8a04" stroke-width="1.5" />
        <circle cx="0" cy="-48" r="4" fill="#ffffff" filter="drop-shadow(0 0 8px #eab308)" />
      </g>

      <!-- Droland Capital (Tiered walled city immediately south of the Spire) -->
      <g id="inkarnate-droland" transform="translate(500, 495)">
        <ellipse cx="0" cy="0" rx="24" ry="16" fill="#475569" stroke="#94a3b8" stroke-width="1.5" />
        <circle cx="0" cy="-2" r="9" fill="#1e293b" stroke="#eab308" stroke-width="1.2" />
        <circle cx="0" cy="-2" r="3" fill="#fef08a" />
      </g>

      <!-- ======================================================================
           DETAILED INKARNATE ARTWORK: CAYBLUFF (x: 335-665, y: 670-1000)
           ====================================================================== -->
      <!-- Northern Mountain Barrier: Mount Pheltil, Mount Famil & Montepass -->
      <g id="inkarnate-northern-caybluff" stroke="#3b2b18" stroke-width="1.2" fill="#614b2d">
        <!-- Mount Pheltil -->
        <polygon points="415,735 440,685 465,735" />
        <path d="M 440,685 L 440,735" stroke="#9a815a" stroke-width="1.2" />
        <!-- Mount Famil -->
        <polygon points="495,745 520,695 545,745" />
        <path d="M 520,695 L 520,745" stroke="#9a815a" stroke-width="1.2" />
        <!-- Montepass Road line between them -->
        <path d="M 470,670 Q 480,720 460,760" fill="none" stroke="#d5b882" stroke-width="2" stroke-dasharray="2,3" />
      </g>

      <!-- Central Fog Basin (Middle of Caybluff) -->
      <g id="inkarnate-fog-basin">
        <ellipse cx="530" cy="800" rx="35" ry="18" fill="#2d6475" stroke="#163943" stroke-width="1.8" />
        <!-- Fog mist wisps -->
        <path d="M 500,795 Q 530,785 560,795 M 510,805 Q 530,815 550,805" fill="none" stroke="rgba(241, 245, 249, 0.6)" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- Caybluff Fissure (Deep black/purple chasm slicing vertically) -->
      <path d="M 565,700 Q 580,750 575,800 Q 570,840 560,880" 
            fill="none" stroke="#050308" stroke-width="6" stroke-linecap="round" />
      <path d="M 565,700 Q 580,750 575,800 Q 570,840 560,880" 
            fill="none" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4,4" />

      <!-- Eastern Coastal Beach Strip (across fissure) -->
      <path d="M 575,695 C 600,690 660,700 665,710 L 665,920 C 650,910 630,900 600,890 Z" 
            fill="url(#caybluffBeach)" stroke="#ad9157" stroke-width="1.2" />

      <!-- Portale City (On the beach strip) -->
      <g id="inkarnate-portale" transform="translate(610, 770)">
        <rect x="-14" y="-12" width="28" height="24" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="0" cy="0" r="5" fill="#f59e0b" />
      </g>

      <!-- The Ocean Wall (Curved sea barrier in the ocean bay off Portale) -->
      <path d="M 635,745 C 650,755 655,785 640,800" 
            fill="none" stroke="#67e8f9" stroke-width="4.5" stroke-linecap="round" opacity="0.9" />

      <!-- Waveside (Southern coastal town) -->
      <g id="inkarnate-waveside" transform="translate(650, 840)">
        <polygon points="-8,6 0,-8 8,6" fill="#78350f" stroke="#d97706" stroke-width="1.2" />
      </g>

      <!-- Massive Mount Solare (Dominating South of Caybluff) -->
      <g id="inkarnate-mount-solare" stroke="#261b0c" stroke-width="2">
        <polygon points="380,985 500,905 620,985" fill="#423016" />
        <polygon points="440,985 500,920 560,985" fill="#573f1d" />
        <!-- Golden rock striations -->
        <path d="M 500,905 L 500,985 M 460,950 L 485,985 M 540,950 L 515,985" stroke="#ca8a04" stroke-width="1.8" />
        <polygon points="485,925 500,905 515,925" fill="#fef08a" stroke="none" />
      </g>

      <!-- ======================================================================
           SURROUNDING REALMS: ALDEN, KLABATS, DYNESTEA, CIRRUSIA, HEMWOOD, LAYTIDE
           ====================================================================== -->
      <!-- Hemwood Hell Sigil (Bottom Left) -->
      <g id="hemwood-sigil" transform="translate(190, 850)">
        <ellipse cx="0" cy="0" rx="36" ry="20" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="3,3" />
        <circle cx="0" cy="0" r="10" fill="#450a0a" stroke="#f87171" stroke-width="1.2" />
      </g>

      <!-- Cirrusia Floating Clouds (Mid Right) -->
      <g id="cirrusia-sky" transform="translate(820, 500)" opacity="0.8">
        <ellipse cx="0" cy="0" rx="42" ry="18" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.2" />
        <ellipse cx="20" cy="-15" rx="30" ry="12" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1" />
      </g>

      <!-- 3x3 Domain Division Grid Lines Overlay -->
      <rect width="1000" height="1000" fill="url(#domainGridLines)" pointer-events="none" />

      <!-- Vintage Nautical Compass Rose (Top Left) -->
      <g id="compass-rose" transform="translate(60, 60)">
        <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(90, 232, 255, 0.4)" stroke-width="1.2" />
        <polygon points="0,-30 5,-6 0,0 -5,-6" fill="#5ae8ff" />
        <polygon points="0,30 4,6 0,0 -4,6" fill="#1e3a5f" />
        <polygon points="30,0 6,4 0,0 6,-4" fill="#7a87ff" />
        <polygon points="-30,0 -6,4 0,0 -6,-4" fill="#1e3a5f" />
        <text x="0" y="-35" text-anchor="middle" font-family="'Segoe UI', serif" font-size="10" font-weight="bold" fill="#eefaff">N</text>
      </g>

      <!-- Map Banner / Title -->
      <g id="map-banner" transform="translate(500, 975)">
        <rect x="-160" y="-16" width="320" height="26" rx="6" fill="rgba(6, 12, 22, 0.9)" stroke="rgba(90, 232, 255, 0.45)" stroke-width="1.2" />
        <text x="0" y="2" text-anchor="middle" font-family="'Cinzel', 'Georgia', serif" font-size="12" font-weight="bold" fill="#a5f3fc" letter-spacing="2">MALADEN — THE 9 DOMAINS</text>
      </g>

      <!-- Map Outer Border -->
      <rect x="8" y="8" width="984" height="984" fill="none" stroke="rgba(90, 232, 255, 0.25)" stroke-width="1.2" />
      <rect x="14" y="14" width="972" height="972" fill="none" stroke="rgba(122, 135, 255, 0.2)" stroke-width="2" />
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
      imageSource: 'assets/maps/maladen_composite.svg',
      isDefault: true,
      regions: [
        // ROW 1: North (Leaflet y: 670 - 1000)
        {
          id: 'reg_alden',
          name: 'Domain of Alden',
          color: '#5ae8ff',
          desc: 'Arid northern empire of builders, inventors, and metalworking, anchored by Laregola.',
          points: [
            [1000, 0], [1000, 335], [670, 335], [670, 0]
          ]
        },
        {
          id: 'reg_klabats',
          name: 'Klabats',
          color: '#f59e0b',
          desc: 'Warlike northern desert badlands of flow warriors, breath discipline, and combat mastery.',
          points: [
            [1000, 335], [1000, 665], [670, 665], [670, 335]
          ]
        },
        {
          id: 'reg_dynestea',
          name: 'Dynestea',
          color: '#10b981',
          desc: 'The lush northeast crossroads of prime magic, abundant in natural resources and reverent of nature.',
          points: [
            [1000, 665], [1000, 1000], [670, 1000], [670, 665]
          ]
        },

        // ROW 2: Middle (Leaflet y: 335 - 670)
        {
          id: 'reg_giaslan',
          name: 'Giaslan',
          color: '#7a87ff',
          desc: 'Frigid mountain realm of astrologers and Chroma magic, centered on Viserion’s Peak and Chillspire.',
          points: [
            [670, 0], [670, 335], [335, 335], [335, 0]
          ]
        },
        {
          id: 'reg_altasar',
          name: 'Altasar',
          color: '#eab308',
          desc: 'Wealthy central grassland democracy of soul magic, tiered waterways in Droland, and The Spire.',
          points: [
            [670, 335], [670, 665], [335, 665], [335, 335]
          ]
        },
        {
          id: 'reg_cirrusia',
          name: 'Cirrusia',
          color: '#38bdf8',
          desc: 'Eastern cloud-ocean sky realm of floating islands, sky-vines, and shifting storms.',
          points: [
            [670, 665], [670, 1000], [335, 1000], [335, 665]
          ]
        },

        // ROW 3: South (Leaflet y: 0 - 335)
        {
          id: 'reg_hemwood',
          name: 'Hemwood',
          color: '#f43f5e',
          desc: 'Dim forest domain under growing geothermal heat, centered on the Hell Sigil and Moonstead.',
          points: [
            [335, 0], [335, 335], [0, 335], [0, 0]
          ]
        },
        {
          id: 'reg_caybluff',
          name: 'Caybluff',
          color: '#a855f7',
          desc: 'Starlit high plateau of sheer cliffs, Mount Solare, the Caybluff Fissure, and the submerged capital Portale.',
          points: [
            [335, 335], [335, 665], [0, 665], [0, 335]
          ]
        },
        {
          id: 'reg_laytide',
          name: 'Laytide',
          color: '#2563eb',
          desc: 'Vast aquatic ocean domain permanently transformed by the historic presence of the sea lord Aquiel.',
          points: [
            [335, 665], [335, 1000], [0, 1000], [0, 665]
          ]
        }
      ],
      officialLocations: [
        // --- GIASLAN (Inkarnate Detailed) ---
        {
          id: 'loc_viserions_peak',
          codexId: 'location-viserions-peak',
          name: "Viserion's Peak",
          category: 'Location',
          region: 'Giaslan',
          x: 165,
          y: 535,
          summary: 'A brutal northern peak of strange cliffs, jagged ice, localized blizzards, and a hidden Canthian door.'
        },
        {
          id: 'loc_chillspire',
          codexId: 'domain-giaslan',
          name: 'Chillspire',
          category: 'Settlement',
          region: 'Giaslan',
          x: 165,
          y: 505,
          summary: 'The capital citadel of Giaslan, nestled in the saddle of Viserion’s Peak where astrologers study constellations.'
        },
        {
          id: 'loc_gialden_strip',
          codexId: 'domain-alden',
          name: 'Gialden Strip',
          category: 'Location',
          region: 'Giaslan',
          x: 165,
          y: 645,
          summary: 'The rugged mountain corridor dividing Giaslan and Alden, rich in mineral deposits and shared outposts.'
        },
        {
          id: 'loc_oresalt_mines',
          codexId: 'domain-giaslan',
          name: 'Oresalt Mines',
          category: 'Dungeon',
          region: 'Giaslan',
          x: 100,
          y: 620,
          summary: 'Crystalline subterranean excavations where miners carve prized salt deposits and mineral veins.'
        },
        {
          id: 'loc_saltmound_camp',
          codexId: 'domain-giaslan',
          name: 'Saltmound Camp',
          category: 'Settlement',
          region: 'Giaslan',
          x: 100,
          y: 590,
          summary: 'Hardy frontier mining camp supporting the workers and caravans of the northern salt basins.'
        },
        {
          id: 'loc_froslan_lake',
          codexId: 'domain-giaslan',
          name: 'Froslan Lake',
          category: 'Location',
          region: 'Giaslan',
          x: 255,
          y: 595,
          summary: 'An ice-sheathed glacial lake in northeast Giaslan with an ancient stone tower solitary on its central isle.'
        },
        {
          id: 'loc_alba',
          codexId: 'domain-giaslan',
          name: 'Alba',
          category: 'Settlement',
          region: 'Giaslan',
          x: 305,
          y: 485,
          summary: 'Eastern border settlement perched upon snowy ridges overlooking the passage into central Altasar.'
        },
        {
          id: 'loc_snowden',
          codexId: 'domain-giaslan',
          name: 'Snowden',
          category: 'Settlement',
          region: 'Giaslan',
          x: 170,
          y: 360,
          summary: 'Southern foothill township bordered by dense pine timberlands at the edge of the Hemwood wild.'
        },
        {
          id: 'loc_alsico',
          codexId: 'domain-giaslan',
          name: 'Alsico',
          category: 'Settlement',
          region: 'Giaslan',
          x: 115,
          y: 400,
          summary: 'Sheltered valley village known for ice-forged crafts and warm hearths amidst permanent frost.'
        },
        {
          id: 'loc_tulin',
          codexId: 'domain-giaslan',
          name: 'Tulin',
          category: 'Settlement',
          region: 'Giaslan',
          x: 165,
          y: 445,
          summary: 'A central crossroads haven south of Chillspire, gathering travelers traversing the mountain passes.'
        },
        {
          id: 'loc_saltwater_camp',
          codexId: 'domain-giaslan',
          name: 'Saltwater Camp',
          category: 'Settlement',
          region: 'Giaslan',
          x: 250,
          y: 395,
          summary: 'Staging encampment for harvesters and traders working the mineral-rich waters of Saltwater Lake.'
        },
        {
          id: 'loc_saltwater_lake',
          codexId: 'domain-giaslan',
          name: 'Saltwater Lake',
          category: 'Location',
          region: 'Giaslan',
          x: 250,
          y: 360,
          summary: 'A dense, high-salinity glacial lake surrounded by craggy bluffs and reflective brine flats.'
        },
        {
          id: 'loc_camlenius_plaza',
          codexId: 'domain-giaslan',
          name: 'Camlenius Plaza',
          category: 'Location',
          region: 'Giaslan',
          x: 70,
          y: 485,
          summary: 'Historic stone pavilion on the western steppe commemorating ancient astrological pacts.'
        },
        {
          id: 'loc_shadewood_grove',
          codexId: 'domain-giaslan',
          name: 'Shadewood Grove',
          category: 'Location',
          region: 'Giaslan',
          x: 205,
          y: 495,
          summary: 'An eerie stand of dark petrified pines on the eastern flank of Viserion’s Peak where spirits linger.'
        },

        // --- ALTASAR (Inkarnate Detailed) ---
        {
          id: 'loc_spire',
          codexId: 'domain-altasar',
          name: 'The Spire',
          category: 'Quest',
          region: 'Altasar',
          x: 475,
          y: 565,
          summary: 'The ancient monolithic Spire rising high over Altasar’s heartland, radiating mysterious cosmic soul energy.'
        },
        {
          id: 'loc_droland',
          codexId: 'settlement-droland',
          name: 'Droland',
          category: 'Settlement',
          region: 'Altasar',
          x: 500,
          y: 505,
          summary: 'Wealthy soul-magic capital of Altasar with tiered stone districts, gondolas, and underground waterways.'
        },
        {
          id: 'loc_orville',
          codexId: 'settlement-orville',
          name: 'Orville',
          category: 'Settlement',
          region: 'Altasar',
          x: 445,
          y: 410,
          summary: 'A modest craft and merchant town in southwest Altasar, recently disturbed by missing children.'
        },
        {
          id: 'loc_talsancea_falls',
          codexId: 'domain-altasar',
          name: 'Talsancea Falls',
          category: 'Location',
          region: 'Altasar',
          x: 450,
          y: 525,
          summary: 'Spectacular tiered cascades descending from the western foothills into Altasar’s primary river network.'
        },
        {
          id: 'loc_mirage_bay',
          codexId: 'domain-altasar',
          name: 'Mirage Bay',
          category: 'Location',
          region: 'Altasar',
          x: 400,
          y: 610,
          summary: 'A shimmering inland lake basin whose deceptive light-bending surface confuses unguided travelers.'
        },
        {
          id: 'loc_knotwood_forest',
          codexId: 'domain-altasar',
          name: 'Knotwood Forest',
          category: 'Location',
          region: 'Altasar',
          x: 565,
          y: 525,
          summary: 'Dense ancient woodland bordering eastern lakes, famous for resilient timber and hidden soul-relic groves.'
        },

        // --- CAYBLUFF (Inkarnate Detailed) ---
        {
          id: 'loc_solare',
          codexId: 'location-mount-solare',
          name: 'Mount Solare',
          category: 'Location',
          region: 'Caybluff',
          x: 500,
          y: 65,
          summary: 'A treacherous, remote mountain lair dominating southern Caybluff where high peril promises exceptional rewards.'
        },
        {
          id: 'loc_portale',
          codexId: 'settlement-portale',
          name: 'Portale',
          category: 'Settlement',
          region: 'Caybluff',
          x: 610,
          y: 230,
          summary: 'Waterside capital of Caybluff featuring extensive underwater districts built with Cirrusian and Alden aid.'
        },
        {
          id: 'loc_ocean_wall',
          codexId: 'location-ocean-wall',
          name: 'The Ocean Wall',
          category: 'Location',
          region: 'Caybluff',
          x: 635,
          y: 240,
          summary: 'The violent natural barrier shielding Portale from open waters; houses the Eschaton Caelum.'
        },
        {
          id: 'loc_waveside',
          codexId: 'settlement-waveside',
          name: 'Waveside',
          category: 'Settlement',
          region: 'Caybluff',
          x: 650,
          y: 160,
          summary: 'Southern coastal settlement of sandstone architecture concealing a hidden Unwound facility.'
        },
        {
          id: 'loc_fissure',
          codexId: 'domain-caybluff',
          name: 'The Caybluff Fissure',
          category: 'Location',
          region: 'Caybluff',
          x: 575,
          y: 240,
          summary: 'A colossal ravine revealing a sideways horizon into which fallen objects plummet endlessly.'
        },
        {
          id: 'loc_fog_basin',
          codexId: 'location-caybluff-fog-basin',
          name: 'Caybluff Fog Basin',
          category: 'Location',
          region: 'Caybluff',
          x: 530,
          y: 200,
          summary: 'Hidden cavern region reached via ascending river cave; holds ancient Canthian ruins and a baby leviathan.'
        },
        {
          id: 'loc_mount_pheltil',
          codexId: 'domain-caybluff',
          name: 'Mount Pheltil',
          category: 'Location',
          region: 'Caybluff',
          x: 440,
          y: 285,
          summary: 'Stout northern crag marking the western gate of the Montepass crossing from Altasar.'
        },
        {
          id: 'loc_mount_famil',
          codexId: 'domain-caybluff',
          name: 'Mount Famil',
          category: 'Location',
          region: 'Caybluff',
          x: 515,
          y: 275,
          summary: 'Companion peak standing sentinel over the northern approaches to the Dust Basin.'
        },
        {
          id: 'loc_montepass',
          codexId: 'domain-caybluff',
          name: 'Montepass',
          category: 'Location',
          region: 'Caybluff',
          x: 480,
          y: 280,
          summary: 'Winding elevated mountain pass that provides safe overland transit between Altasar and Caybluff.'
        },
        {
          id: 'loc_dust_basin',
          codexId: 'domain-caybluff',
          name: 'Dust Basin',
          category: 'Location',
          region: 'Caybluff',
          x: 550,
          y: 300,
          summary: 'Arid depression beneath the northern peaks prone to sudden swirling silt storms.'
        },
        {
          id: 'loc_forkinarod',
          codexId: 'domain-caybluff',
          name: 'Forkinarod',
          category: 'Location',
          region: 'Caybluff',
          x: 430,
          y: 225,
          summary: 'Crucial highway junction where road networks branch toward the fissure and southern plateaus.'
        },
        {
          id: 'loc_epilegos_split',
          codexId: 'domain-caybluff',
          name: "Epilego's Split",
          category: 'Location',
          region: 'Caybluff',
          x: 405,
          y: 180,
          summary: 'A dramatic geological fault canyon carved deep into the western sandstone tablelands.'
        },
        {
          id: 'loc_solasta',
          codexId: 'domain-caybluff',
          name: 'Solasta',
          category: 'Settlement',
          region: 'Caybluff',
          x: 465,
          y: 105,
          summary: 'High mountain enclave nestled in the shadow of Mount Solare, inhabited by austere ascetics.'
        },
        {
          id: 'loc_siracol',
          codexId: 'domain-caybluff',
          name: 'Siracol',
          category: 'Settlement',
          region: 'Caybluff',
          x: 555,
          y: 140,
          summary: 'Eastern plateau waystation serving travelers before they ascend toward the sun-drenched heights.'
        },

        // --- SURROUNDING 6 DOMAINS (Primary Canon Anchors) ---
        {
          id: 'loc_laregola',
          codexId: 'domain-alden',
          name: 'Laregola',
          category: 'Settlement',
          region: 'Domain of Alden',
          x: 180,
          y: 850,
          summary: 'The fortified imperial capital of Alden, showcasing immense engineering and rigid order.'
        },
        {
          id: 'loc_troldith',
          codexId: 'stories-troldith-and-the-malaise',
          name: 'Troldith',
          category: 'Location',
          region: 'Domain of Alden',
          x: 80,
          y: 800,
          summary: 'A settlement in West Alden named by Caelum as a place where the party can learn more about the Malaise.'
        },
        {
          id: 'loc_klabats',
          codexId: 'domain-klabats',
          name: 'Klabats War Encampments',
          category: 'Settlement',
          region: 'Klabats',
          x: 500,
          y: 820,
          summary: 'Scattered tribal kingdoms of flow warriors dedicated to meditative breath discipline and battle.'
        },
        {
          id: 'loc_dynestea',
          codexId: 'domain-dynestea',
          name: 'Heart of Dynestea',
          category: 'Location',
          region: 'Dynestea',
          x: 820,
          y: 820,
          summary: 'The lush northeast crossroads where prime magic and ancient old-growth forests thrive.'
        },
        {
          id: 'loc_cirrusia_isles',
          codexId: 'domain-cirrusia',
          name: 'Cirrusian Sky Isles',
          category: 'Location',
          region: 'Cirrusia',
          x: 820,
          y: 500,
          summary: 'Floating islands drifting on cloud oceans that rotate their positions with celestial winds.'
        },
        {
          id: 'loc_moonstead',
          codexId: 'domain-hemwood',
          name: 'Moonstead',
          category: 'Settlement',
          region: 'Hemwood',
          x: 160,
          y: 180,
          summary: 'The shadowed forest capital of Hemwood, formerly democratic and now gripped by dark geothermal heat.'
        },
        {
          id: 'loc_hell_sigil',
          codexId: 'domain-hemwood',
          name: 'The Hell Sigil',
          category: 'Dungeon',
          region: 'Hemwood',
          x: 190,
          y: 150,
          summary: 'An ancient summoning circle and seal radiating unnatural heat throughout the southern woods.'
        },
        {
          id: 'loc_aquiel',
          codexId: 'domain-laytide',
          name: 'Sunken Domain of Aquiel',
          category: 'Location',
          region: 'Laytide',
          x: 850,
          y: 180,
          summary: 'The aquatic ocean expanse of Laytide, home to ancient sea lords, leviathans, and sunken monuments.'
        }
      ],
      playerPins: []
    }
  ];

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

      // 6. Re-render pins so secret pins appear or disappear and draggability syncs
      this.renderPins();
      this.setMarkerDraggingEnabled(isDm);

      // 7. Refresh territory list if open
      const manageModal = document.getElementById('manage-territories-modal');
      if (manageModal && !manageModal.classList.contains('hidden')) {
        this.renderTerritoriesManagerList();
      }
    }

    loadStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v4';
      let stored = null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          stored = JSON.parse(raw);
          this.maps = stored.maps || [];
          this.activeMapId = stored.activeMapId || (this.maps[0] ? this.maps[0].id : null);
        } catch (e) {
          console.warn('Could not parse stored map data, loading defaults.', e);
        }
      }

      // Seamless migration from v2 or v1 if v3 does not exist yet
      if (!stored) {
        const prevKey = localStorage.getItem('o_codex_cartography_v3') || localStorage.getItem('o_codex_cartography_v2') || localStorage.getItem('o_codex_cartography_v1');
        if (prevKey) {
          try {
            const oldData = JSON.parse(prevKey);
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

      // If user's stored default map has the old placeholder regions or outdated pins, auto-upgrade to 3x3 layout
      if (this.maps[0] && this.maps[0].isDefault && (!this.maps[0].imageSource.includes('maladen_composite') || (this.maps[0].regions || []).length !== 9 || (this.maps[0].officialLocations || []).length < 40)) {
        const existingPlayerPins = this.maps[0].playerPins || [];
        this.maps[0] = JSON.parse(JSON.stringify(DEFAULT_MAPS[0]));
        this.maps[0].playerPins = existingPlayerPins;
        this.saveStorage();
      }
    }

    saveStorage() {
      const STORAGE_KEY = 'o_codex_cartography_v4';
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

    highlightDomainRegion(domainNameOrId) {
      const activeMap = this.getActiveMap();
      if (!activeMap || !activeMap.regions) return null;

      const term = String(domainNameOrId).toLowerCase().replace('domain of ', '').trim();
      const reg = activeMap.regions.find(r => 
        r.id.toLowerCase() === term || 
        r.id.toLowerCase() === `reg_${term}` ||
        r.name.toLowerCase().includes(term) ||
        term.includes(r.name.toLowerCase())
      );

      if (!reg) return null;

      const layer = this.regionPolygonLayers.get(reg.id);
      if (layer) {
        layer.bringToFront();
        const originalColor = reg.color || '#5ae8ff';
        
        // Animated temporary golden highlight
        layer.setStyle({
          color: '#f59e0b',
          weight: 4.5,
          fillColor: '#f59e0b',
          fillOpacity: 0.38,
          dashArray: null
        });

        setTimeout(() => {
          layer.setStyle({
            color: originalColor,
            weight: this.bordersVisible ? 2 : 0,
            fillColor: originalColor,
            fillOpacity: this.bordersVisible ? 0.15 : 0,
            dashArray: '3, 4'
          });
        }, 3500);
      }

      let avgY = 500;
      let avgX = 500;
      if (reg.points && reg.points.length > 0) {
        avgY = reg.points.reduce((sum, p) => sum + p[0], 0) / reg.points.length;
        avgX = reg.points.reduce((sum, p) => sum + p[1], 0) / reg.points.length;
      }

      return { reg, center: [avgY, avgX] };
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
          title: pin.name || pin.title,
          draggable: isDm
        });

        let wasDragged = false;

        if (isDm) {
          marker.on('dragstart', () => {
            if (this.isDrawingRegion || this.isDroppingPin || this.isEditingVertices) {
              if (marker.dragging) marker.dragging.disable();
              return;
            }
            wasDragged = true;
            marker.closeTooltip();
          });

          marker.on('dragend', () => {
            if (!this.isDmMode()) return;
            const pos = marker.getLatLng();
            const clampedX = Math.max(0, Math.min(1000, Math.round(pos.lng)));
            const clampedY = Math.max(0, Math.min(1000, Math.round(pos.lat)));
            marker.setLatLng([clampedY, clampedX]);

            pin.x = clampedX;
            pin.y = clampedY;
            this.movePin(pin.id, clampedX, clampedY);

            setTimeout(() => {
              wasDragged = false;
            }, 120);
          });
        }

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
          if (wasDragged || this.isDrawingRegion || this.isDroppingPin || this.isEditingVertices) return;
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

    movePin(pinId, newX, newY) {
      if (!this.isDmMode()) return;

      const activeMap = this.getActiveMap();
      let targetPin = null;

      if (activeMap.officialLocations) {
        targetPin = activeMap.officialLocations.find(p => p.id === pinId);
      }
      if (!targetPin && activeMap.playerPins) {
        targetPin = activeMap.playerPins.find(p => p.id === pinId);
      }

      if (!targetPin) return;

      targetPin.x = newX;
      targetPin.y = newY;
      this.saveStorage();

      // If drawer is currently open for this pin, update coordinates readout
      if (this.currentHighlightedPinId === (targetPin.codexId || targetPin.id)) {
        const coordsEl = document.getElementById('drawer-pin-coords');
        if (coordsEl) {
          coordsEl.textContent = `X: ${newX} · Y: ${newY}`;
        }
      }

      if (typeof window.showToast === 'function') {
        window.showToast(`👑 Moved pin "${targetPin.name || targetPin.title}" to (${newX}, ${newY})`, 'dm');
      }
    }

    setMarkerDraggingEnabled(enabled) {
      const canDrag = Boolean(enabled && this.isDmMode() && !this.isDrawingRegion && !this.isDroppingPin && !this.isEditingVertices);
      this.markerLayers.forEach(marker => {
        if (marker && marker.dragging) {
          if (canDrag) {
            marker.dragging.enable();
          } else {
            marker.dragging.disable();
          }
        }
      });
    }

    // Pin Dropping Workflow
    startPinDropMode() {
      this.isDroppingPin = true;
      this.setMarkerDraggingEnabled(false);
      const canvas = document.getElementById('campaign-map-canvas');
      if (canvas) canvas.classList.add('cursor-crosshair');
      document.getElementById('pin-drop-banner')?.classList.remove('hidden');
    }

    exitPinDropMode() {
      this.isDroppingPin = false;
      this.setMarkerDraggingEnabled(true);
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
      this.setMarkerDraggingEnabled(false);

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
      this.setMarkerDraggingEnabled(true);
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

      // Dynamic list of Codex entries associated with this domain
      const entriesSection = document.getElementById('view-territory-entries-section');
      const entriesList = document.getElementById('view-territory-entries-list');
      if (entriesSection && entriesList) {
        entriesList.innerHTML = '';
        const allEntries = window.state?.worldData?.entries || [];
        const domainKey = reg.name.toLowerCase().replace('domain of ', '').trim();

        const linkedEntries = allEntries.filter(e => {
          if (e.id === `domain-${domainKey}` || e.id === `domain-${reg.id.replace('reg_', '')}`) return false;
          const loc = window.resolveEntryLocation ? window.resolveEntryLocation(e) : null;
          if (loc?.domain && loc.domain.toLowerCase().includes(domainKey)) return true;
          if (loc?.location && loc.location.toLowerCase().includes(domainKey)) return true;
          if (e.domain && e.domain.toLowerCase().includes(domainKey)) return true;
          return false;
        });

        if (linkedEntries.length > 0) {
          entriesSection.classList.remove('hidden');
          linkedEntries.forEach(item => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'territory-entry-chip';
            chip.innerHTML = `<span>📖</span> <span>${escapeHtml(item.name || item.title)}</span>`;
            chip.addEventListener('click', () => {
              this.closeModal('view-territory-modal');
              if (window.CodexMapBridge) {
                window.CodexMapBridge.navigateToCodex(item.id);
              }
            });
            entriesList.appendChild(chip);
          });
        } else {
          entriesSection.classList.add('hidden');
        }
      }

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
      this.setMarkerDraggingEnabled(false);
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
      this.setMarkerDraggingEnabled(true);
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
    // Navigate from Codex -> Map location (smart routing: pin, parent pin, or domain highlight without pin)
    navigateToLocation(entryOrId) {
      if (window.setAppMode) {
        window.setAppMode('map');
      }

      setTimeout(() => {
        if (!window.mapEngine) return;
        window.mapEngine.invalidateSize();

        let entry = null;
        const entryId = typeof entryOrId === 'string' ? entryOrId : entryOrId?.id;
        if (typeof entryOrId === 'object') {
          entry = entryOrId;
        } else if (window.state?.worldData?.entries) {
          entry = window.state.worldData.entries.find(e => e.id === entryId || (e.name && e.name.toLowerCase() === entryId.toLowerCase()));
        }

        const entryName = entry?.name || entry?.title || entryId || 'Entry';

        // 1. Direct pin match
        const activeMap = window.mapEngine.getActiveMap();
        const allPins = [
          ...(activeMap.officialLocations || []),
          ...(activeMap.playerPins || [])
        ];

        let targetPin = allPins.find(p => p.codexId === entryId || (p.name && p.name.toLowerCase() === entryName.toLowerCase()));

        if (targetPin) {
          window.mapEngine.map.flyTo([targetPin.y, targetPin.x], 1.2, { duration: 1 });
          window.mapEngine.openPinDrawer(targetPin);
          return;
        }

        // 2. Resolve location / domain reference
        const locInfo = window.resolveEntryLocation ? window.resolveEntryLocation(entry) : null;
        const specificLoc = locInfo?.location || entry?.location || entry?.details?.Location || entry?.details?.Settlement;
        const domainTarget = locInfo?.domain || entry?.domain || entry?.details?.Domain || entry?.details?.Homeland;

        // Check if specificLoc matches an existing pin (e.g. Droland, Viserion's Peak, Portale)
        if (specificLoc) {
          const parentPin = allPins.find(p => p.name && specificLoc.toLowerCase().includes(p.name.toLowerCase()));
          if (parentPin) {
            window.mapEngine.map.flyTo([parentPin.y, parentPin.x], 1.2, { duration: 1 });
            window.mapEngine.openPinDrawer(parentPin);
            if (typeof window.showToast === 'function') {
              window.showToast(`📍 Located at ${parentPin.name} — ${entryName}`, 'info');
            }
            return;
          }
        }

        // 3. Domain territory highlight (NO PIN ADDED)
        const targetDomain = domainTarget || specificLoc || (entry?.category === 'domains' ? entryName : null);
        if (targetDomain) {
          const result = window.mapEngine.highlightDomainRegion(targetDomain);
          if (result) {
            window.mapEngine.map.flyTo(result.center, 0.75, { duration: 1.2 });
            
            const hudName = document.getElementById('map-region-hud-name');
            const hudDesc = document.getElementById('map-region-hud-desc');
            const hudEl = document.getElementById('map-region-hud');
            if (hudName) hudName.textContent = result.reg.name;
            if (hudDesc) hudDesc.textContent = `📍 ${entryName} is located within ${result.reg.name}.`;
            if (hudEl) hudEl.classList.remove('hidden');

            if (typeof window.showToast === 'function') {
              window.showToast(`📍 ${entryName} is located in ${result.reg.name}`, 'info');
            }
            return;
          }
        }

        // Fallback: Center of map
        window.mapEngine.map.flyTo([500, 500], 0, { duration: 0.8 });
        if (typeof window.showToast === 'function') {
          window.showToast(`Showing Maladen World Map for ${entryName}`, 'info');
        }
      }, 250);
    },

    navigateToPin(codexId) {
      this.navigateToLocation(codexId);
    },

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
