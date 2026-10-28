
const CANON_DOMAINS = [
  { id: 'reg_alden', name: 'Alden', fullName: 'Domain of Alden' },
  { id: 'reg_klabats', name: 'Klabats', fullName: 'Klabats' },
  { id: 'reg_dynestea', name: 'Dynestea', fullName: 'Dynestea' },
  { id: 'reg_giaslan', name: 'Giaslan', fullName: 'Giaslan' },
  { id: 'reg_altasar', name: 'Altasar', fullName: 'Altasar' },
  { id: 'reg_cirrusia', name: 'Cirrusia', fullName: 'Cirrusia' },
  { id: 'reg_hemwood', name: 'Hemwood', fullName: 'Hemwood' },
  { id: 'reg_caybluff', name: 'Caybluff', fullName: 'Caybluff' },
  { id: 'reg_laytide', name: 'Laytide', fullName: 'Laytide' }
];

window.resolveEntryLocation = function resolveEntryLocation(entry) {
  if (!entry) return null;

  let domain = entry.domain || null;
  let loc = entry.location || entry.region || entry.homeland || entry.settlement || null;

  if (entry.details && typeof entry.details === "object") {
    if (!domain) {
      domain = entry.details.Domain || entry.details.domain || null;
    }
    if (!loc) {
      loc = entry.details.Location || 
            entry.details.Region || 
            entry.details.Homeland || 
            entry.details.Settlement || 
            entry.details["Found In"] || 
            entry.details["Origin"] || null;
    }
  }

  // Domain category
  if (!domain && (entry.category === "domains" || String(entry.id).startsWith("domain-"))) {
    domain = entry.name || entry.title;
  }

  // Settlement category
  if (!loc && (entry.category === "settlements" || String(entry.id).startsWith("settlement-"))) {
    loc = entry.name || entry.title;
  }

  // If loc mentions a canon domain name, extract domain if missing
  if (!domain && loc) {
    const match = CANON_DOMAINS.find(d => loc.toLowerCase().includes(d.name.toLowerCase()));
    if (match) domain = match.name;
  }

  if (!domain && !loc) return null;

  return { domain, location: loc };
};

const DATA_URL = "world-data.json";
const COMPLETE_CODEX_PREVIEW_LIMIT = 8;
const VIEW_TRANSITION_OUT_MS = 110;
const VIEW_TRANSITION_IN_MS = 500;

const RESERVED_ENTRY_KEYS = new Set([
  "id",
  "category",
  "name",
  "title",
  "summary",
  "description",
  "tags",
  "aliases",
  "image",
  "imageLayout",
  "quickStats",
  "upgradeQuestId",
  "upgradeNotes",
  "linkedManifestId",
  "linkedManifestIds",
  "linkedDivionId",
  "linkedDivionIds",
  "upgradesEntryId",
  "upgradesEntryIds",
  "upgradesManifestId",
  "upgradesManifestIds",
  "upgradesDivionId",
  "upgradesDivionIds",
  "upgradeStatus",
  "details",
  "_createdIndex"
]);

const state = {
  worldData: null,
  query: "",
  activeView: "complete-codex",
  sortMode: "newest-first",
  questStatusFilter: "ongoing",
  activeTags: new Set(),
  selectedEntryId: null,
  isHelpOpen: false,
  appMode: "codex",
  isDmMode: false,
  playerName: "Adventurer"
};

let viewTransitionTimer = null;

const elements = {};

// ============================================================================
// DOM TOAST NOTIFICATIONS (Non-blocking replacement for native alert & confirm)
// ============================================================================
window.showToast = function(message, type = "info", duration = 3200) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `codex-toast codex-toast--${type}`;

  const iconMap = {
    dm: "👑",
    info: "ℹ️",
    success: "✓",
    warning: "⚠️",
    error: "✕"
  };
  const icon = iconMap[type] || "✨";

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  const removeToast = () => {
    toast.classList.add("is-hiding");
    setTimeout(() => toast.remove(), 220);
  };

  const timer = setTimeout(removeToast, duration);
  toast.addEventListener("click", () => {
    clearTimeout(timer);
    removeToast();
  });
};

// ============================================================================
// ACCESS CONTROL & PERSISTENCE (DM MODE & PLAYER IDENTITY)
// ============================================================================
function initAccessControl() {
  const params = new URLSearchParams(window.location.search);
  let urlCleanNeeded = false;

  // 1. Process DM URL flag (?dm=true, ?dm=1, ?dm=false, etc.)
  if (params.has("dm")) {
    const dmVal = (params.get("dm") || "").toLowerCase();
    const isDm = dmVal === "true" || dmVal === "1" || dmVal === "";
    localStorage.setItem("o_codex_dm_mode", isDm ? "true" : "false");
    params.delete("dm");
    urlCleanNeeded = true;
  }

  // 2. Process Player Identity (?player=Name)
  if (params.has("player")) {
    const pVal = params.get("player");
    if (pVal && pVal.trim()) {
      localStorage.setItem("o_codex_player_name", pVal.trim());
    }
    params.delete("player");
    urlCleanNeeded = true;
  }

  // 3. Scrub sensitive URL params without triggering a reload
  if (urlCleanNeeded) {
    const newSearch = params.toString() ? `?${params.toString()}` : "";
    const cleanUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
    try {
      window.history.replaceState(null, "", cleanUrl);
    } catch {
      // Fallback if sandboxed
    }
  }

  // 4. Load persisted preferences
  state.isDmMode = localStorage.getItem("o_codex_dm_mode") === "true";
  state.playerName = localStorage.getItem("o_codex_player_name") || "Adventurer";

  updateDmModeUI();

  // 5. Global Keyboard Shortcut: Ctrl + Shift + D (or Cmd + Shift + D on macOS)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
      e.preventDefault();
      window.toggleDmMode();
    }
  });
}

window.isDmMode = function() {
  return Boolean(state.isDmMode);
};

window.setDmMode = function(enabled, notify = true) {
  state.isDmMode = Boolean(enabled);
  localStorage.setItem("o_codex_dm_mode", state.isDmMode ? "true" : "false");
  updateDmModeUI();

  if (window.mapEngine && typeof window.mapEngine.updateDmModeUI === "function") {
    window.mapEngine.updateDmModeUI();
  }

  if (notify) {
    if (state.isDmMode) {
      window.showToast("👑 Dungeon Master Mode Enabled — Map tools, boundaries, and secrets unlocked.", "dm");
    } else {
      window.showToast("🛡️ Player Mode Active — DM tools and secrets hidden.", "info");
    }
  }
};

window.toggleDmMode = function() {
  window.setDmMode(!state.isDmMode);
};

function updateDmModeUI() {
  const toggleBtn = document.getElementById("dm-mode-toggle");
  const toggleIcon = document.getElementById("dm-toggle-icon");
  const toggleLabel = document.getElementById("dm-toggle-label");

  if (toggleBtn) {
    if (state.isDmMode) {
      toggleBtn.classList.add("is-dm-active");
      toggleBtn.title = "Dungeon Master Mode is Active. Click or press Ctrl+Shift+D to switch to Player Mode.";
      if (toggleIcon) toggleIcon.textContent = "👑";
      if (toggleLabel) toggleLabel.textContent = "DM Active";
    } else {
      toggleBtn.classList.remove("is-dm-active");
      toggleBtn.title = "Player Mode. Click or press Ctrl+Shift+D to switch to Dungeon Master Mode.";
      if (toggleIcon) toggleIcon.textContent = "🛡️";
      if (toggleLabel) toggleLabel.textContent = "Player";
    }
  }
}

function initElements() {
  elements.appModeBar = document.getElementById("app-mode-bar");
  elements.viewportStage = document.getElementById("viewport-stage");
  elements.modeTabCodex = document.getElementById("mode-tab-codex");
  elements.modeTabMap = document.getElementById("mode-tab-map");
  elements.modeTabCharacters = document.getElementById("mode-tab-characters");
  elements.dmModeToggle = document.getElementById("dm-mode-toggle");
  elements.modalViewOnMap = document.getElementById("modal-view-on-map");
  elements.modalLocationBadge = document.getElementById("modal-location-badge");
  elements.siteTitle = document.getElementById("site-title");
  elements.siteSubtitle = document.getElementById("site-subtitle");
  elements.helpButton = document.getElementById("help-button");
  elements.helpModal = document.getElementById("help-modal");
  elements.helpBackdrop = document.getElementById("help-backdrop");
  elements.helpClose = document.getElementById("help-close");
  elements.viewTabs = document.getElementById("view-tabs");
  elements.controls = document.getElementById("controls");
  elements.searchInput = document.getElementById("search-input");
  elements.clearFilters = document.getElementById("clear-filters");
  elements.sortControls = document.getElementById("sort-controls");
  elements.sortSelect = document.getElementById("sort-select");
  elements.questStatusControls = document.getElementById("quest-status-controls");
  elements.questStatusSelect = document.getElementById("quest-status-select");
  elements.resultsSummary = document.getElementById("results-summary");
  elements.tagSuggestionsBlock = document.getElementById("tag-suggestions-block");
  elements.tagFilters = document.getElementById("tag-filters");
  elements.results = document.getElementById("results");
  elements.sectionTemplate = document.getElementById("section-template");
  elements.cardTemplate = document.getElementById("card-template");
  elements.modal = document.getElementById("entry-modal");
  elements.modalBackdrop = document.getElementById("modal-backdrop");
  elements.modalClose = document.getElementById("modal-close");
  elements.modalCopyLink = document.getElementById("modal-copy-link");
  elements.modalCategory = document.getElementById("modal-category");
  elements.modalTitle = document.getElementById("modal-title");
  elements.modalSummary = document.getElementById("modal-summary");
  elements.modalDescription = document.getElementById("modal-description");
  elements.modalBody = document.getElementById("modal-body");
  elements.modalMedia = document.getElementById("modal-media");
  elements.modalQuickStatsSection = document.getElementById("modal-quick-stats-section");
  elements.modalQuickStats = document.getElementById("modal-quick-stats");
  elements.modalUpgradeSection = document.getElementById("modal-upgrade-section");
  elements.modalUpgradeCopy = document.getElementById("modal-upgrade-copy");
  elements.modalTagsSection = document.getElementById("modal-tags-section");
  elements.modalTags = document.getElementById("modal-tags");
  elements.modalAliasesSection = document.getElementById("modal-aliases-section");
  elements.modalAliases = document.getElementById("modal-aliases");
  elements.modalDetailsSection = document.getElementById("modal-details-section");
  elements.modalDetails = document.getElementById("modal-details");
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initElements();
  initAccessControl();
  window.state = state;
  window.openModal = openModal;
  bindEvents();
  await loadWorldData();
  router.applyInitialRoute();
}

// Data loading
async function loadWorldData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Unable to load ${DATA_URL} (${response.status})`);
    }

    const data = await response.json();
    state.worldData = normaliseWorldData(data);
  } catch (error) {
    showLoadError(error);
  }
}

function normaliseWorldData(data) {
  const safeData = data ?? {};
  const categories = Array.isArray(safeData.categories) ? safeData.categories : [];
  const entries = Array.isArray(safeData.entries) ? safeData.entries : [];

  return {
    site: safeData.site ?? {},
    categories: categories.map((category) => ({
      id: category.id,
      label: category.label ?? category.id ?? "Untitled Category",
      description: category.description ?? ""
    })),
    entries: entries
      .filter((entry) => entry && entry.id && entry.category)
      .map((entry, index) => ({
        ...entry,
        _createdIndex: index,
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        aliases: Array.isArray(entry.aliases) ? entry.aliases : []
      }))
  };
}

function showLoadError(error) {
  elements.resultsSummary.textContent = "The codex could not load its data file.";
  elements.results.innerHTML = "";

  const message = document.createElement("section");
  message.className = "category-section panel";
  message.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="section-kicker">Load Error</p>
        <h2 class="section-title">world-data.json could not be loaded</h2>
      </div>
    </div>
    <p class="section-description">
      This site expects to be opened through a simple static server or a hosted site like GitHub Pages.
      Some browsers block loading JSON directly from local files.
    </p>
    <p class="empty-state">
      Error details: ${escapeHtml(error.message)}
    </p>
  `;

  elements.results.append(message);
}

// View Mode Management (The O-Codex vs World Map)
window.setAppMode = function(mode, options = {}) {
  const { syncUrl = true, pushHistory = true } = options;
  state.appMode = mode;

  const stage = elements.viewportStage || document.getElementById("viewport-stage");
  const tabCodex = elements.modeTabCodex || document.getElementById("mode-tab-codex");
  const tabMap = elements.modeTabMap || document.getElementById("mode-tab-map");

  if (mode === "map") {
    if (stage) {
      stage.classList.remove("mode--codex");
      stage.classList.add("mode--map");
    }
    document.body.classList.add("map-mode-active");
    tabCodex?.classList.remove("is-active");
    tabMap?.classList.add("is-active");

    if (syncUrl) {
      try {
        if (pushHistory) {
          window.history.pushState({ mode: "map" }, "", "#map");
        } else {
          window.history.replaceState({ mode: "map" }, "", "#map");
        }
      } catch {
        window.location.hash = "#map";
      }
    }

    // Invalidate Leaflet map size during slide and after slide finishes
    if (window.mapEngine) {
      window.mapEngine.invalidateSize();
      setTimeout(() => window.mapEngine?.invalidateSize(), 150);
      setTimeout(() => window.mapEngine?.invalidateSize(), 460);
    }
  } else {
    if (stage) {
      stage.classList.remove("mode--map");
      stage.classList.add("mode--codex");
    }
    document.body.classList.remove("map-mode-active");
    tabMap?.classList.remove("is-active");
    tabCodex?.classList.add("is-active");

    if (syncUrl && window.location.hash.toLowerCase() === "#map") {
      try {
        if (pushHistory) {
          window.history.pushState({ mode: "codex" }, "", window.location.pathname);
        } else {
          window.history.replaceState({ mode: "codex" }, "", window.location.pathname);
        }
      } catch {
        window.location.hash = "";
      }
    }
  }
};

// Event wiring
function bindEvents() {
  // Mode Bar Navigation
  elements.modeTabCodex?.addEventListener("click", () => {
    window.setAppMode("codex");
  });

  elements.modeTabMap?.addEventListener("click", () => {
    window.setAppMode("map");
  });

  elements.modeTabCharacters?.addEventListener("click", () => {
    window.showToast("Character Sheets mode is in development and coming in a future update!", "info");
  });

  elements.dmModeToggle?.addEventListener("click", () => {
    window.toggleDmMode();
  });

  // Mobile/touch pull-down handle toggle
  elements.appModeBar?.addEventListener("click", (event) => {
    if (event.target.closest(".mode-tab")) return;
    elements.appModeBar.classList.toggle("is-expanded");
  });

  document.addEventListener("click", (event) => {
    if (elements.appModeBar && !elements.appModeBar.contains(event.target)) {
      elements.appModeBar.classList.remove("is-expanded");
    }
  });

  // Entry Modal View On Map (Smart location routing without requiring pins)
  if (elements.modalViewOnMap) {
    elements.modalViewOnMap.addEventListener("click", () => {
      const currentId = state.selectedEntryId;
      const entry = state.worldData?.entries?.find(e => e.id === currentId);
      closeModal({ syncUrl: false });
      if (window.CodexMapBridge && (entry || currentId)) {
        window.CodexMapBridge.navigateToLocation(entry || currentId);
      } else {
        window.setAppMode("map");
      }
    });
  }
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderApp();
  });

  elements.clearFilters.addEventListener("click", () => {
    state.query = "";
    state.activeTags.clear();
    elements.searchInput.value = "";
    renderApp();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sortMode = event.target.value;
    renderApp();
  });

  elements.questStatusSelect.addEventListener("change", (event) => {
    state.questStatusFilter = event.target.value;
    renderApp();
  });

  elements.modalClose.addEventListener("click", () => closeModal());
  elements.modalBackdrop.addEventListener("click", () => closeModal());

  if (elements.modalCopyLink) {
    elements.modalCopyLink.addEventListener("click", copyEntryLink);
  }

  if (elements.helpButton) {
    elements.helpButton.addEventListener("click", () => openHelpModal());
  }
  if (elements.helpClose) {
    elements.helpClose.addEventListener("click", () => closeHelpModal());
  }
  if (elements.helpBackdrop) {
    elements.helpBackdrop.addEventListener("click", () => closeHelpModal());
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.isHelpOpen) {
        closeHelpModal();
        return;
      }
      if (!elements.modal.classList.contains("hidden")) {
        closeModal();
        return;
      }
    }

    if (
      event.key === "/" &&
      document.activeElement !== elements.searchInput &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) &&
      elements.modal.classList.contains("hidden") &&
      !state.isHelpOpen
    ) {
      event.preventDefault();
      elements.searchInput.focus();
      elements.searchInput.select();
    }
  });

  window.addEventListener("popstate", () => {
    router.handlePopState();
  });

  window.addEventListener("hashchange", () => {
    router.handlePopState();
  });
}

// Rendering
function renderApp() {
  if (!state.worldData) {
    return;
  }

  updateSiteText();
  renderViewTabs();
  renderSortControls();
  renderTagSuggestions();
  renderResults();
}

function updateSiteText() {
  const site = state.worldData.site;

  if (site.title) {
    elements.siteTitle.textContent = site.title;
    document.title = site.title;
  }

  if (site.subtitle) {
    elements.siteSubtitle.textContent = site.subtitle;
  }
}

function renderViewTabs() {
  const fragment = document.createDocumentFragment();

  fragment.append(buildViewTabButton("Complete Codex", "complete-codex"));

  state.worldData.categories.forEach((category) => {
    fragment.append(buildViewTabButton(category.label, category.id));
  });

  elements.viewTabs.replaceChildren(fragment);
}

function renderSortControls() {
  const isCategoryView = state.activeView !== "complete-codex";
  const isQuestView = state.activeView === "quests";
  elements.sortControls.classList.toggle("hidden", !isCategoryView);
  elements.questStatusControls.classList.toggle("hidden", !isQuestView);
  elements.sortSelect.value = state.sortMode;
  elements.questStatusSelect.value = state.questStatusFilter;
}

function buildViewTabButton(label, viewId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `view-tab${state.activeView === viewId ? " is-active" : ""}`;
  button.textContent = label;
  button.addEventListener("click", () => {
    switchView(viewId);
  });

  return button;
}

function switchView(nextViewId, options = {}) {
  const { syncUrl = true, pushHistory = true } = options;

  if (state.activeView === nextViewId) {
    return;
  }

  if (viewTransitionTimer) {
    clearTimeout(viewTransitionTimer);
    viewTransitionTimer = null;
  }

  clearViewTransitionClasses();
  elements.controls.classList.add("view-transition-out");
  elements.results.classList.add("view-transition-out");

  viewTransitionTimer = setTimeout(() => {
    state.activeView = nextViewId;
    renderApp();
    if (syncUrl) {
      router.updateUrl({ viewId: nextViewId, pushHistory });
    }
    elements.controls.classList.add("view-transition-in");
    elements.results.classList.add("view-transition-in");

    viewTransitionTimer = setTimeout(() => {
      clearViewTransitionClasses();
      viewTransitionTimer = null;
    }, VIEW_TRANSITION_IN_MS);
  }, VIEW_TRANSITION_OUT_MS);
}

function clearViewTransitionClasses() {
  elements.controls.classList.remove("view-transition-out", "view-transition-in");
  elements.results.classList.remove("view-transition-out", "view-transition-in");
}

function renderTagSuggestions() {
  const suggestions = getSuggestedTags();

  if (!state.query || suggestions.length === 0) {
    elements.tagSuggestionsBlock.classList.add("hidden");
    elements.tagFilters.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();

  suggestions.forEach((tag) => {
    const button = buildChipButton(tag, state.activeTags.has(tag), () => toggleSetValue(state.activeTags, tag));
    fragment.append(button);
  });

  elements.tagFilters.replaceChildren(fragment);
  elements.tagSuggestionsBlock.classList.remove("hidden");
}

function buildChipButton(label, isActive, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chip-button${isActive ? " is-active" : ""}`;
  button.textContent = label;
  button.addEventListener("click", () => {
    onClick();
    renderApp();
  });

  return button;
}

function renderResults() {
  const groupedResults = getGroupedResults();
  const hasSearchQuery = state.query.length > 0;
  const hasActiveRefinement = hasSearchQuery || state.activeTags.size > 0;
  const visibleCategories = getVisibleCategories(groupedResults, hasActiveRefinement);

  renderSummary(groupedResults, hasSearchQuery, hasActiveRefinement, visibleCategories);

  const fragment = document.createDocumentFragment();

  visibleCategories.forEach((category) => {
    const matches = groupedResults.get(category.id) ?? [];
    const orderedMatches = getOrderedEntries(matches);
    const entriesToShow =
      state.activeView === "complete-codex"
        ? orderedMatches.slice(0, COMPLETE_CODEX_PREVIEW_LIMIT)
        : orderedMatches;

    fragment.append(buildCategorySection(category, entriesToShow, matches.length, hasSearchQuery));
  });

  elements.results.replaceChildren(fragment);
}

function getVisibleCategories(groupedResults, hasActiveRefinement) {
  const baseCategories =
    state.activeView === "complete-codex"
      ? state.worldData.categories
      : state.worldData.categories.filter((category) => category.id === state.activeView);

  if (!hasActiveRefinement) {
    return baseCategories;
  }

  return baseCategories.filter((category) => (groupedResults.get(category.id) ?? []).length > 0);
}

function renderSummary(groupedResults, hasSearchQuery, hasActiveRefinement, visibleCategories) {
  const totalMatches = [...groupedResults.values()].reduce((sum, entries) => sum + entries.length, 0);
  const isCategoryView = state.activeView !== "complete-codex";
  const activeCategoryLabel = getActiveViewLabel();

  if (!isCategoryView && !hasActiveRefinement) {
    elements.resultsSummary.textContent =
      `Showing all ${state.worldData.entries.length} sample entries across ${state.worldData.categories.length} categories.`;
    return;
  }

  if (isCategoryView && !hasActiveRefinement) {
    elements.resultsSummary.textContent =
      `Showing ${totalMatches} entr${totalMatches === 1 ? "y" : "ies"} in ${activeCategoryLabel}.`;
    return;
  }

  if (hasSearchQuery) {
    const tagSummary = state.activeTags.size > 0 ? ` with ${state.activeTags.size} tag filter(s)` : "";

    if (isCategoryView) {
    elements.resultsSummary.textContent =
      `Found ${totalMatches} matching entr${totalMatches === 1 ? "y" : "ies"} in ${activeCategoryLabel} for "${state.query}"${tagSummary}.`;
      return;
    }

    elements.resultsSummary.textContent =
      `Found ${totalMatches} matching entr${totalMatches === 1 ? "y" : "ies"} for "${state.query}"${tagSummary}.`;
    return;
  }

  if (isCategoryView) {
    elements.resultsSummary.textContent =
      `Showing ${totalMatches} entr${totalMatches === 1 ? "y" : "ies"} in ${activeCategoryLabel} with ${state.activeTags.size} tag filter(s).`;
    return;
  }

  elements.resultsSummary.textContent =
    `Showing ${totalMatches} entr${totalMatches === 1 ? "y" : "ies"} across ${visibleCategories.length} visible categor${visibleCategories.length === 1 ? "y" : "ies"} with ${state.activeTags.size} tag filter(s).`;
}

function buildCategorySection(category, entriesToShow, totalMatches, hasSearchQuery) {
  const sectionNode = elements.sectionTemplate.content.firstElementChild.cloneNode(true);
  const kicker = sectionNode.querySelector(".section-kicker");
  const title = sectionNode.querySelector(".section-title");
  const note = sectionNode.querySelector(".section-note");
  const description = sectionNode.querySelector(".section-description");
  const grid = sectionNode.querySelector(".card-grid");
  const emptyState = sectionNode.querySelector(".empty-state");
  const isCompleteCodexView = state.activeView === "complete-codex";
  const displayedCount = entriesToShow.length;

  kicker.textContent = "Category";
  title.textContent = category.label;
  description.textContent = category.description;
  grid.classList.toggle("card-grid--preview", isCompleteCodexView);

  if (hasSearchQuery && totalMatches > 0) {
    note.textContent = "";
  } else if (isCompleteCodexView && totalMatches > displayedCount) {
    note.textContent = `${displayedCount} of ${totalMatches} entries shown.`;
  } else if (totalMatches > 0) {
    note.textContent = `${totalMatches} entr${totalMatches === 1 ? "y" : "ies"} shown.`;
  } else {
    note.textContent = "No current matches.";
  }

  if (entriesToShow.length === 0) {
    grid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.textContent = hasSearchQuery
      ? "No entries in this category match the current search."
      : "No entries in this category match the current filters.";

    return sectionNode;
  }

  const cardFragment = document.createDocumentFragment();
  entriesToShow.forEach((entry) => cardFragment.append(buildEntryCard(entry, category.label)));
  grid.replaceChildren(cardFragment);

  return sectionNode;
}

function buildEntryCard(entry, categoryLabel) {
  const cardNode = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  const button = cardNode.querySelector(".entry-card__button");
  const media = cardNode.querySelector(".entry-card__media");
  const meta = cardNode.querySelector(".entry-card__meta");
  const category = cardNode.querySelector(".entry-card__category");
  const title = cardNode.querySelector(".entry-card__title");
  const summary = cardNode.querySelector(".entry-card__summary");
  const tags = cardNode.querySelector(".entry-card__tags");

  category.textContent = categoryLabel;
  meta.replaceChildren(category);
  appendEntryMetaBadge(meta, entry);
  title.textContent = getEntryTitle(entry);
  summary.textContent = entry.summary ?? "No summary added yet.";
  button.setAttribute("aria-label", `Open details for ${getEntryTitle(entry)}`);
  media.append(buildMediaFrame(entry, false));
  tags.replaceChildren(...buildChips(entry.tags));

  button.addEventListener("click", () => openModal(entry.id));

  return cardNode;
}

function buildMediaFrame(entry, isLarge) {
  const frame = document.createElement("div");
  frame.className = "media-frame";

  const fallback = document.createElement("div");
  fallback.className = "media-fallback";

  const wrapper = document.createElement("div");
  const initial = document.createElement("div");
  const message = document.createElement("p");

  initial.className = "media-fallback__initial";
  initial.textContent = getEntryTitle(entry).charAt(0).toUpperCase();
  message.textContent = isLarge ? "No image added for this entry yet." : "Image coming later.";

  wrapper.append(initial, message);
  fallback.append(wrapper);
  frame.append(fallback);

  if (entry.image) {
    const image = new Image();
    image.src = entry.image;
    image.alt = `${getEntryTitle(entry)} image`;

    image.addEventListener("load", () => {
      frame.classList.add("has-image");
    });

    image.addEventListener("error", () => {
      image.remove();
    });

    frame.prepend(image);
  }

  return frame;
}

function buildChips(values) {
  return (values ?? []).map((value) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = value;
    return chip;
  });
}

// Filtering and search
function getGroupedResults() {
  const groupedResults = new Map(state.worldData.categories.map((category) => [category.id, []]));

  state.worldData.entries.forEach((entry) => {
    if (!passesCategoryFilter(entry) || !passesTagFilter(entry) || !passesQuestStatusFilter(entry)) {
      return;
    }

    const score = getSearchScore(entry, state.query);

    if (state.query && score <= 0) {
      return;
    }

    const entryWithScore = { ...entry, _score: score };
    groupedResults.get(entry.category)?.push(entryWithScore);
  });

  if (state.query && state.activeView === "complete-codex") {
    groupedResults.forEach((entries) => {
      entries.sort((left, right) => {
        if (right._score !== left._score) {
          return right._score - left._score;
        }

        return getEntryTitle(left).localeCompare(getEntryTitle(right));
      });
    });
  }

  return groupedResults;
}

function getOrderedEntries(entries) {
  const orderedEntries = [...entries];

  if (state.activeView === "complete-codex") {
    orderedEntries.sort((left, right) => compareEntries(left, right, "newest-first", { preserveScore: !!state.query }));
    return orderedEntries;
  }

  orderedEntries.sort((left, right) => compareEntries(left, right, state.sortMode));
  return orderedEntries;
}

function compareEntries(left, right, sortMode, options = {}) {
  if (options.preserveScore && right._score !== left._score) {
    return right._score - left._score;
  }

  const storyPriorityComparison = compareStoryPriority(left, right);
  if (storyPriorityComparison !== 0) {
    return storyPriorityComparison;
  }

  const leftTitle = getEntryTitle(left);
  const rightTitle = getEntryTitle(right);

  switch (sortMode) {
    case "alphabetical-asc":
      return leftTitle.localeCompare(rightTitle);
    case "alphabetical-desc":
      return rightTitle.localeCompare(leftTitle);
    case "oldest-first":
      return left._createdIndex - right._createdIndex;
    case "newest-first":
    default:
      return right._createdIndex - left._createdIndex;
  }
}

function compareStoryPriority(left, right) {
  if (left.category !== "stories" || right.category !== "stories") {
    return 0;
  }

  return getStoryPriorityWeight(right) - getStoryPriorityWeight(left);
}

function passesCategoryFilter(entry) {
  return state.activeView === "complete-codex" || entry.category === state.activeView;
}

function passesTagFilter(entry) {
  return state.activeTags.size === 0 || entry.tags.some((tag) => state.activeTags.has(tag));
}

function passesQuestStatusFilter(entry) {
  if (state.activeView !== "quests" || entry.category !== "quests") {
    return true;
  }

  return getQuestStatus(entry) === state.questStatusFilter;
}

function getSearchScore(entry, rawQuery) {
  if (!rawQuery) {
    return 1;
  }

  const query = normalizeText(rawQuery);
  if (!query) {
    return 1;
  }

  const title = normalizeText(getEntryTitle(entry));
  const aliases = entry.aliases.map((alias) => normalizeText(alias));
  const tags = entry.tags.map((tag) => normalizeText(tag));
  const summary = normalizeText(entry.summary ?? "");

  const searchableFields = [title, summary, ...aliases, ...tags];
  const tokenPool = searchableFields.flatMap((value) => value.split(/\s+/).filter(Boolean));
  const uniqueTokens = [...new Set(tokenPool)];

  let score = 0;

  searchableFields.forEach((field) => {
    if (field === query) {
      score = Math.max(score, 120);
    } else if (field.startsWith(query)) {
      score = Math.max(score, 100);
    } else if (field.includes(query)) {
      score = Math.max(score, 82);
    }
  });

  uniqueTokens.forEach((token) => {
    if (token === query) {
      score = Math.max(score, 110);
    } else if (token.startsWith(query)) {
      score = Math.max(score, 92);
    } else if (levenshteinDistance(token, query) <= typoThreshold(query)) {
      score = Math.max(score, 68);
    } else if (phoneticKey(token) === phoneticKey(query)) {
      score = Math.max(score, 62);
    }
  });

  if (aliases.some((alias) => phoneticKey(alias) === phoneticKey(query))) {
    score = Math.max(score, 90);
  }

  return score;
}

window.searchCodexEntries = function(rawQuery, limit = 6) {
  if (!state.worldData || !Array.isArray(state.worldData.entries)) {
    return [];
  }

  const query = String(rawQuery ?? "").trim();
  if (!query) {
    const prioCategories = new Set(["settlements", "domains", "locations", "quests", "eschatons", "lore"]);
    const samples = state.worldData.entries.filter(e => prioCategories.has(String(e.category || "").toLowerCase()));
    return (samples.length > 0 ? samples : state.worldData.entries)
      .slice(0, limit)
      .map(entry => ({
        id: entry.id,
        name: getEntryTitle(entry),
        category: entry.category,
        summary: entry.summary || ""
      }));
  }

  const scored = [];
  for (const entry of state.worldData.entries) {
    const score = getSearchScore(entry, query);
    if (score > 0) {
      scored.push({
        id: entry.id,
        name: getEntryTitle(entry),
        category: entry.category,
        summary: entry.summary || "",
        score: score
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return scored.slice(0, limit);
};

function getSuggestedTags() {
  const query = normalizeText(state.query);
  if (!query) {
    return [];
  }

  const suggestions = new Map();
  const allTags = [...new Set(state.worldData.entries.flatMap((entry) => entry.tags))];
  const matchedEntries = state.worldData.entries
    .filter((entry) => passesCategoryFilter(entry) && passesQuestStatusFilter(entry))
    .map((entry) => ({ entry, score: getSearchScore(entry, state.query) }))
    .filter(({ score }) => score > 0);

  allTags.forEach((tag) => {
    const score = getTagSimilarityScore(tag, query);
    if (score > 0) {
      suggestions.set(tag, score);
    }
  });

  matchedEntries.forEach(({ entry, score }) => {
    entry.tags.forEach((tag) => {
      const existingScore = suggestions.get(tag) ?? 0;
      suggestions.set(tag, Math.max(existingScore, score + 14));
    });
  });

  return [...suggestions.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 10)
    .map(([tag]) => tag);
}

function getTagSimilarityScore(tag, query) {
  const normalizedTag = normalizeText(tag);

  if (!normalizedTag) {
    return 0;
  }

  if (normalizedTag === query) {
    return 120;
  }

  if (normalizedTag.startsWith(query) || query.startsWith(normalizedTag)) {
    return 94;
  }

  if (normalizedTag.includes(query) || query.includes(normalizedTag)) {
    return 82;
  }

  if (levenshteinDistance(normalizedTag, query) <= typoThreshold(query)) {
    return 66;
  }

  if (phoneticKey(normalizedTag) === phoneticKey(query)) {
    return 58;
  }

  return 0;
}

function typoThreshold(query) {
  if (query.length <= 4) {
    return 1;
  }

  if (query.length <= 8) {
    return 2;
  }

  return 3;
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneticKey(value) {
  const normalized = normalizeText(value)
    .replace(/[cq]/g, "k")
    .replace(/x/g, "ks")
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/oo|ou|ue|ew|eu|ui|uy/g, "u")
    .replace(/ee|ea|ei|ie|ey|ai|ay/g, "e")
    .replace(/oa|ow|au|aw/g, "o");

  return normalized
    .split(" ")
    .map((word) => {
      if (!word) {
        return "";
      }

      const firstChar = word.charAt(0);
      const remainder = word.slice(1).replace(/[aeiouy]/g, "");
      return `${firstChar}${remainder}`.replace(/(.)\1+/g, "$1");
    })
    .join(" ");
}

function levenshteinDistance(left, right) {
  if (left === right) {
    return 0;
  }

  if (!left) {
    return right.length;
  }

  if (!right) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
}

function toggleSetValue(set, value) {
  if (set.has(value)) {
    set.delete(value);
    return;
  }

  set.add(value);
}

function getQuestStatus(entry) {
  const normalized = String(entry.questStatus ?? "")
    .trim()
    .toLowerCase();

  if (["completed", "complete", "done", "finished"].includes(normalized)) {
    return "completed";
  }

  return "ongoing";
}

function appendEntryMetaBadge(container, entry) {
  const badgeConfig = getEntryMetaBadgeConfig(entry);

  if (!badgeConfig) {
    return;
  }

  const badge = document.createElement("span");
  badge.className = `entry-meta-badge ${badgeConfig.className}`;
  badge.textContent = badgeConfig.label;
  container.append(badge);
}

function getEntryMetaBadgeConfig(entry) {
  if (entry.category === "quests") {
    const questStatus = getQuestStatus(entry);
    return {
      label: questStatus === "completed" ? "Completed" : "Ongoing",
      className: `entry-meta-badge--quest-${questStatus}`
    };
  }

  if (entry.category === "stories") {
    const storyPriority = getStoryPriorityLabel(entry);

    if (!storyPriority) {
      return null;
    }

    return {
      label: storyPriority.label,
      className: `entry-meta-badge--story-${storyPriority.tone}`
    };
  }

  return null;
}

function getStoryPriorityWeight(entry) {
  const rawPriority = entry.priority;

  if (typeof rawPriority === "number" && Number.isFinite(rawPriority)) {
    return rawPriority;
  }

  const normalized = String(rawPriority ?? "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "critical":
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
    case "normal":
      return 2;
    case "low":
      return 1;
    case "background":
    case "backburner":
      return 0;
    default:
      return 0;
  }
}

function getStoryPriorityLabel(entry) {
  const rawPriority = entry.priority;

  if (rawPriority == null || rawPriority === "") {
    return null;
  }

  if (typeof rawPriority === "number" && Number.isFinite(rawPriority)) {
    if (rawPriority >= 4) {
      return { label: "Critical", tone: "critical" };
    }

    if (rawPriority >= 3) {
      return { label: "High", tone: "high" };
    }

    if (rawPriority >= 2) {
      return { label: "Normal", tone: "normal" };
    }

    return { label: "Low", tone: "low" };
  }

  const normalized = String(rawPriority).trim().toLowerCase();

  switch (normalized) {
    case "critical":
    case "urgent":
      return { label: "Critical", tone: "critical" };
    case "high":
      return { label: "High", tone: "high" };
    case "medium":
    case "normal":
      return { label: "Normal", tone: "normal" };
    case "background":
    case "backburner":
      return { label: "Background", tone: "low" };
    case "low":
      return { label: "Low", tone: "low" };
    default:
      return { label: formatLabel(rawPriority), tone: "normal" };
  }
}

function getActiveViewLabel() {
  if (state.activeView === "complete-codex") {
    return "Complete Codex";
  }

  return state.worldData.categories.find((category) => category.id === state.activeView)?.label ?? "Selected Category";
}


// ============================================================================
// URL ROUTER & DEEP LINKING MODULE
// Modular navigation handler for direct entry/category linking, browser history
// synchronization, and clipboard sharing.
// ============================================================================
const router = {
  // Parse current URL hash into an actionable route intent
  parseRoute() {
    let raw = window.location.hash.replace(/^#\/?/, "").trim();

    if (!raw && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("entry") || params.has("item") || params.has("id")) {
        raw = params.get("entry") || params.get("item") || params.get("id");
      } else if (params.has("category") || params.has("view")) {
        raw = params.get("category") || params.get("view");
      } else if (params.has("help")) {
        raw = "help";
      }
    }

    if (!raw) {
      return { type: "home", id: null };
    }

    const decoded = decodeURIComponent(raw).trim();

    if (decoded.toLowerCase() === "help") {
      return { type: "help", id: "help" };
    }

    if (decoded.toLowerCase() === "map") {
      return { type: "map", id: "map" };
    }

    const entryPrefixMatch = decoded.match(/^(?:entry[\/:]|item[\/:]|id[\/:])(.+)$/i);
    const candidateEntryId = (entryPrefixMatch ? entryPrefixMatch[1].trim() : decoded).toLowerCase();

    const categoryPrefixMatch = decoded.match(/^(?:category[\/:]|view[\/:])(.+)$/i);
    const candidateCatId = (categoryPrefixMatch ? categoryPrefixMatch[1].trim() : decoded).toLowerCase();

    if (state.worldData) {
      // 1. Direct entry ID match (e.g. #domain-alden, #lore-channeling)
      let matchedEntry = state.worldData.entries.find(
        (entry) => entry.id.toLowerCase() === candidateEntryId
      );
      if (matchedEntry) {
        return { type: "entry", id: matchedEntry.id, entry: matchedEntry };
      }

      // 2. Direct category match (e.g. #characters, #settlements)
      const matchedCategory = state.worldData.categories.find(
        (category) =>
          category.id.toLowerCase() === candidateCatId ||
          category.label.toLowerCase() === candidateCatId
      );
      if (matchedCategory || candidateCatId === "complete-codex") {
        return {
          type: "category",
          id: matchedCategory ? matchedCategory.id : "complete-codex"
        };
      }

      // 3. Match entry by Name or Title (e.g. #alden, #channeling)
      matchedEntry = state.worldData.entries.find((entry) => {
        const title = (entry.name || entry.title || "").toLowerCase();
        return title === candidateEntryId;
      });
      if (matchedEntry) {
        return { type: "entry", id: matchedEntry.id, entry: matchedEntry };
      }

      // 4. Match entry by stripped prefix (e.g. #function-channeling -> #channeling)
      const stripped = candidateEntryId.replace(/^[a-z0-9]+[_-]+/i, "");
      if (stripped && stripped !== candidateEntryId) {
        matchedEntry = state.worldData.entries.find((entry) => {
          const title = (entry.name || entry.title || "").toLowerCase();
          const cleanId = entry.id.replace(/^[a-z0-9]+[_-]+/i, "").toLowerCase();
          return title === stripped || cleanId === stripped;
        });
        if (matchedEntry) {
          return { type: "entry", id: matchedEntry.id, entry: matchedEntry };
        }
      }

      // 5. Match entry by Aliases (e.g. #Divion Assignment)
      matchedEntry = state.worldData.entries.find(
        (entry) =>
          Array.isArray(entry.aliases) &&
          entry.aliases.some((alias) => alias.toLowerCase() === candidateEntryId)
      );
      if (matchedEntry) {
        return { type: "entry", id: matchedEntry.id, entry: matchedEntry };
      }
    }

    return { type: "unknown", id: decoded };
  },

  formatEntryHash(entryId) {
    return `#${encodeURIComponent(entryId)}`;
  },

  formatCategoryHash(categoryId) {
    if (!categoryId || categoryId === "complete-codex") {
      return "";
    }
    return `#${encodeURIComponent(categoryId)}`;
  },

  getAbsoluteEntryUrl(entryId) {
    const url = new URL(window.location.href);
    url.hash = router.formatEntryHash(entryId);
    return url.href;
  },

  getAbsoluteCategoryUrl(categoryId) {
    const url = new URL(window.location.href);
    url.hash = router.formatCategoryHash(categoryId);
    return url.href;
  },

  updateUrl({ entryId = null, viewId = null, pushHistory = false } = {}) {
    let targetHash = "";

    if (entryId) {
      targetHash = router.formatEntryHash(entryId);
    } else if (viewId) {
      targetHash = router.formatCategoryHash(viewId);
    } else if (state.activeView && state.activeView !== "complete-codex") {
      targetHash = router.formatCategoryHash(state.activeView);
    }

    const currentHash = window.location.hash;
    if (currentHash === targetHash || (!currentHash && !targetHash)) {
      return;
    }

    const targetUrl = targetHash
      ? `${window.location.pathname}${window.location.search}${targetHash}`
      : `${window.location.pathname}${window.location.search}`;

    try {
      if (pushHistory) {
        window.history.pushState({ entryId, viewId: viewId ?? state.activeView }, "", targetUrl);
      } else {
        window.history.replaceState({ entryId, viewId: viewId ?? state.activeView }, "", targetUrl);
      }
    } catch {
      window.location.hash = targetHash;
    }
  },

  handlePopState() {
    if (!state.worldData) {
      return;
    }

    const route = router.parseRoute();

    if (route.type === "map") {
      window.setAppMode("map", { syncUrl: false });
      return;
    } else if (state.appMode === "map") {
      window.setAppMode("codex", { syncUrl: false });
    }

    if (route.type === "entry") {
      const entry = route.entry || state.worldData.entries.find(
        (item) => item.id.toLowerCase() === route.id.toLowerCase()
      );
      if (entry) {
        if (state.selectedEntryId !== entry.id) {
          openModal(entry.id, { syncUrl: false, pushHistory: false });
        }
        return;
      }
    }

    if (state.selectedEntryId) {
      closeModal({ syncUrl: false, pushHistory: false });
    }

    if (route.type === "help") {
      openHelpModal();
      return;
    }

    if (state.isHelpOpen) {
      closeHelpModal();
    }

    if (route.type === "category") {
      if (state.activeView !== route.id) {
        switchView(route.id, { syncUrl: false, pushHistory: false });
      }
      return;
    }

    if (route.type === "home") {
      if (state.activeView !== "complete-codex") {
        switchView("complete-codex", { syncUrl: false, pushHistory: false });
      }
    }
  },

  applyInitialRoute() {
    const route = router.parseRoute();

    if (route.type === "map") {
      renderApp();
      window.setAppMode("map", { syncUrl: false });
      return;
    }

    if (route.type === "entry") {
      const entry = route.entry || state.worldData.entries.find(
        (item) => item.id.toLowerCase() === route.id.toLowerCase()
      );
      if (entry) {
        if (entry.category && state.worldData.categories.some((c) => c.id === entry.category)) {
          state.activeView = entry.category;
        }
        renderApp();
        openModal(entry.id, { syncUrl: false, pushHistory: false });
        return;
      }
    }

    if (route.type === "category") {
      state.activeView = route.id;
      renderApp();
      return;
    }

    if (route.type === "help") {
      renderApp();
      openHelpModal();
      return;
    }

    renderApp();
  },

  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall back below
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }
};

// Modal behavior
let modalCloseTimer = null;
let helpCloseTimer = null;

function openModal(entryId, options = {}) {
  const { syncUrl = true, pushHistory = true } = options;
  const entry = state.worldData.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  const category = state.worldData.categories.find((item) => item.id === entry.category);
  const quickStatPairs = collectQuickStatPairs(entry);
  const detailPairs = collectDetailPairs(entry);

  state.selectedEntryId = entryId;
  resetCopyLinkButton();

  elements.modalCategory.textContent = category?.label ?? "Entry";
  elements.modalTitle.textContent = getEntryTitle(entry);
  elements.modalSummary.textContent = entry.summary ?? "No summary added yet.";
  elements.modalDescription.textContent = entry.description ?? "No full description has been added yet.";
  elements.modalMedia.replaceChildren(buildMediaFrame(entry, true));
  applyModalMediaLayout("side");
  void updateModalMediaLayout(entry);
  renderQuickStatPairs(quickStatPairs);
  renderUpgradePath(entry);

  elements.modalTags.replaceChildren(...buildChips(entry.tags));
  elements.modalTagsSection.classList.toggle("hidden", entry.tags.length === 0);

  elements.modalAliases.textContent = entry.aliases.join(", ");
  elements.modalAliasesSection.classList.toggle("hidden", entry.aliases.length === 0);

  renderDetailPairs(detailPairs);

  const locInfo = window.resolveEntryLocation ? window.resolveEntryLocation(entry) : null;

  // Render clickable Location Badge in modal header
  if (elements.modalLocationBadge) {
    if (locInfo && (locInfo.domain || locInfo.location)) {
      elements.modalLocationBadge.classList.remove("hidden");
      const displayText = locInfo.location && locInfo.domain && !locInfo.location.toLowerCase().includes(locInfo.domain.toLowerCase())
        ? `${locInfo.location} · ${locInfo.domain}`
        : (locInfo.location || `Domain: ${locInfo.domain}`);

      elements.modalLocationBadge.innerHTML = `<span class="loc-pin-icon" aria-hidden="true">📍</span> <span>${displayText}</span> <span class="loc-subtext">↗ View on Map</span>`;
      elements.modalLocationBadge.onclick = () => {
        closeModal({ syncUrl: false });
        if (window.CodexMapBridge) {
          window.CodexMapBridge.navigateToLocation(entry);
        } else {
          window.setAppMode("map");
        }
      };
    } else {
      elements.modalLocationBadge.classList.add("hidden");
      elements.modalLocationBadge.onclick = null;
    }
  }

  if (elements.modalViewOnMap) {
    const isMappableCategory = ["settlement", "settlements", "domain", "domains", "location", "locations", "quest", "quests", "eschaton", "eschatons"].includes(String(entry.category || "").toLowerCase());
    const hasLocationRef = Boolean(locInfo && (locInfo.domain || locInfo.location));
    let hasLocationPin = false;
    if (window.mapEngine && window.mapEngine.maps) {
      for (const m of window.mapEngine.maps) {
        const found = [
          ...(m.officialLocations || []),
          ...(m.playerPins || [])
        ].some(p => p.codexId === entry.id || (p.name && p.name.toLowerCase() === (entry.name || entry.title || "").toLowerCase()));
        if (found) {
          hasLocationPin = true;
          break;
        }
      }
    }
    elements.modalViewOnMap.classList.toggle("hidden", !(isMappableCategory || hasLocationPin || hasLocationRef));
  }

  if (modalCloseTimer) {
    clearTimeout(modalCloseTimer);
    modalCloseTimer = null;
    elements.modal.classList.remove("is-closing");
  }

  elements.modal.classList.remove("hidden");
  elements.modal.setAttribute("aria-hidden", "false");
  elements.modalClose.focus();

  if (syncUrl) {
    router.updateUrl({ entryId, pushHistory });
  }
}

function closeModal(options = {}) {
  const { syncUrl = true, pushHistory = false } = options;
  if (!state.selectedEntryId && elements.modal.classList.contains("hidden")) {
    return;
  }

  state.selectedEntryId = null;
  resetCopyLinkButton();

  if (syncUrl) {
    router.updateUrl({ viewId: state.activeView, pushHistory });
  }

  if (modalCloseTimer) {
    clearTimeout(modalCloseTimer);
    modalCloseTimer = null;
  }

  elements.modal.classList.add("is-closing");
  elements.modal.setAttribute("aria-hidden", "true");

  modalCloseTimer = setTimeout(() => {
    elements.modal.classList.remove("is-closing");
    elements.modal.classList.add("hidden");
    modalCloseTimer = null;
  }, 200);
}

function openHelpModal() {
  if (helpCloseTimer) {
    clearTimeout(helpCloseTimer);
    helpCloseTimer = null;
    if (elements.helpModal) {
      elements.helpModal.classList.remove("is-closing");
    }
  }

  state.isHelpOpen = true;
  if (elements.helpModal) {
    elements.helpModal.classList.remove("hidden");
    elements.helpModal.setAttribute("aria-hidden", "false");
  }
  if (elements.helpClose) {
    elements.helpClose.focus();
  }
}

function closeHelpModal() {
  state.isHelpOpen = false;
  if (!elements.helpModal || elements.helpModal.classList.contains("hidden")) {
    return;
  }

  if (helpCloseTimer) {
    clearTimeout(helpCloseTimer);
    helpCloseTimer = null;
  }

  elements.helpModal.classList.add("is-closing");
  elements.helpModal.setAttribute("aria-hidden", "true");

  helpCloseTimer = setTimeout(() => {
    if (elements.helpModal) {
      elements.helpModal.classList.remove("is-closing");
      elements.helpModal.classList.add("hidden");
    }
    helpCloseTimer = null;
  }, 200);

  if (elements.helpButton) {
    elements.helpButton.focus();
  }
}

let copyResetTimer = null;

async function copyEntryLink() {
  if (!state.selectedEntryId) {
    return;
  }

  const url = router.getAbsoluteEntryUrl(state.selectedEntryId);
  const success = await router.copyToClipboard(url);

  if (success && elements.modalCopyLink) {
    const labelSpan = elements.modalCopyLink.querySelector(".copy-label");
    const iconSpan = elements.modalCopyLink.querySelector(".copy-icon");

    if (labelSpan) labelSpan.textContent = "Link Copied!";
    if (iconSpan) iconSpan.textContent = "✓";
    elements.modalCopyLink.classList.add("is-copied");

    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }

    copyResetTimer = setTimeout(resetCopyLinkButton, 2000);
  }
}

function resetCopyLinkButton() {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
    copyResetTimer = null;
  }

  if (elements.modalCopyLink) {
    const labelSpan = elements.modalCopyLink.querySelector(".copy-label");
    const iconSpan = elements.modalCopyLink.querySelector(".copy-icon");

    if (labelSpan) labelSpan.textContent = "Copy Link";
    if (iconSpan) iconSpan.textContent = "🔗";
    elements.modalCopyLink.classList.remove("is-copied");
  }
}

async function updateModalMediaLayout(entry) {
  const overrideLayout = normalizeModalMediaLayout(entry.imageLayout);

  if (overrideLayout) {
    applyModalMediaLayout(overrideLayout);
    return;
  }

  if (!entry.image) {
    applyModalMediaLayout("side");
    return;
  }

  try {
    const { width, height } = await loadImageDimensions(entry.image);

    if (state.selectedEntryId !== entry.id) {
      return;
    }

    applyModalMediaLayout(getModalLayoutFromDimensions(width, height));
  } catch {
    if (state.selectedEntryId === entry.id) {
      applyModalMediaLayout("side");
    }
  }
}

function normalizeModalMediaLayout(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value).toLowerCase().trim();
  if (["top", "side"].includes(normalized)) {
    return normalized;
  }

  return "";
}

function getModalLayoutFromDimensions(width, height) {
  if (!width || !height) {
    return "side";
  }

  return width / height >= 1.45 ? "top" : "side";
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      });
    });

    image.addEventListener("error", reject);
    image.src = src;
  });
}

function applyModalMediaLayout(layout) {
  elements.modalBody.classList.remove("modal__body--media-top", "modal__body--media-side");
  elements.modalBody.classList.add(layout === "top" ? "modal__body--media-top" : "modal__body--media-side");
}

function collectDetailPairs(entry) {
  const detailPairs = [];

  if (entry.details && typeof entry.details === "object" && !Array.isArray(entry.details)) {
    Object.entries(entry.details).forEach(([key, value]) => {
      detailPairs.push([key, value]);
    });
  }

  Object.entries(entry).forEach(([key, value]) => {
    if (RESERVED_ENTRY_KEYS.has(key) || key === "_score" || value == null || value === "") {
      return;
    }

    detailPairs.push([formatLabel(key), value]);
  });

  return detailPairs;
}

function collectQuickStatPairs(entry) {
  if (!isReferenceFirstEntry(entry)) {
    return [];
  }

  if (!entry.quickStats || typeof entry.quickStats !== "object" || Array.isArray(entry.quickStats)) {
    return [];
  }

  return Object.entries(entry.quickStats);
}

function isReferenceFirstEntry(entry) {
  return ["manifests", "divions"].includes(entry.category);
}

function renderQuickStatPairs(quickStatPairs) {
  elements.modalQuickStats.innerHTML = "";
  elements.modalQuickStatsSection.classList.toggle("hidden", quickStatPairs.length === 0);

  if (quickStatPairs.length === 0) {
    return;
  }

  elements.modalQuickStats.append(buildDetailItemsFragment(quickStatPairs));
}

function renderDetailPairs(detailPairs) {
  elements.modalDetails.innerHTML = "";
  elements.modalDetailsSection.classList.toggle("hidden", detailPairs.length === 0);
  elements.modalDetailsSection.classList.toggle("modal__section--wide", hasWideDetailContent(detailPairs));

  if (detailPairs.length === 0) {
    return;
  }

  elements.modalDetails.append(buildDetailItemsFragment(detailPairs));
}

function buildDetailItemsFragment(pairs) {
  const fragment = document.createDocumentFragment();

  pairs.forEach(([label, value]) => {
    const wrapper = document.createElement("dl");
    wrapper.className = "detail-item";

    const term = document.createElement("dt");
    term.textContent = label;

    const description = document.createElement("dd");
    description.append(renderValue(value));

    wrapper.append(term, description);
    fragment.append(wrapper);
  });

  return fragment;
}

function renderUpgradePath(entry) {
  const upgradeInfo = getUpgradeInfo(entry);
  elements.modalUpgradeCopy.replaceChildren();
  elements.modalUpgradeSection.classList.toggle("hidden", !upgradeInfo);

  if (!upgradeInfo) {
    return;
  }

  elements.modalUpgradeCopy.append(buildLinkedEntryCopy(upgradeInfo.prefix, upgradeInfo.targets));

  if (upgradeInfo.notes.length > 0) {
    upgradeInfo.notes.forEach((note) => {
      const noteLine = document.createElement("div");
      noteLine.textContent = note;
      elements.modalUpgradeCopy.append(noteLine);
    });
  }
}

function getUpgradeInfo(entry) {
  const notes = normalizeUpgradeNotes(entry.upgradeNotes);

  if (entry.upgradeQuestId) {
    const linkedQuest = state.worldData.entries.find((item) => item.id === entry.upgradeQuestId);
    if (!linkedQuest) {
      return null;
    }

    const upgradeStatus = getUpgradeStatus(entry);

    return {
      prefix: upgradeStatus === "completed"
        ? "Was upgraded upon completing "
        : "Can be upgraded by completing ",
      notes,
      targets: [
        {
          id: linkedQuest.id,
          title: getEntryTitle(linkedQuest)
        }
      ]
    };
  }

  if (entry.category === "quests") {
    const linkedEntries = getQuestUpgradeTargets(entry);
    if (linkedEntries.length === 0) {
      return null;
    }

    return {
      prefix: getQuestStatus(entry) === "completed" ? "Upgraded " : "Can upgrade ",
      notes,
      targets: linkedEntries.map((linkedEntry) => ({
        id: linkedEntry.id,
        title: getEntryTitle(linkedEntry)
      }))
    };
  }

  return null;
}

function normalizeUpgradeNotes(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  const text = String(value).trim();
  return text ? [text] : [];
}

function getQuestUpgradeTargets(entry) {
  const explicitTargetIds = collectQuestUpgradeTargetIds(entry);
  const inferredTargetIds = state.worldData.entries
    .filter((item) => isReferenceFirstEntry(item) && item.upgradeQuestId === entry.id)
    .map((item) => item.id);
  const targetIds = [...new Set([...explicitTargetIds, ...inferredTargetIds])];

  return targetIds
    .map((targetId) => state.worldData.entries.find((item) => item.id === targetId))
    .filter(Boolean);
}

function collectQuestUpgradeTargetIds(entry) {
  const targetIds = [];
  const keys = [
    "linkedManifestId",
    "linkedManifestIds",
    "linkedDivionId",
    "linkedDivionIds",
    "upgradesEntryId",
    "upgradesEntryIds",
    "upgradesManifestId",
    "upgradesManifestIds",
    "upgradesDivionId",
    "upgradesDivionIds"
  ];

  keys.forEach((key) => {
    const value = entry[key];

    if (typeof value === "string" && value.trim()) {
      targetIds.push(value.trim());
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string" && item.trim()) {
          targetIds.push(item.trim());
        }
      });
    }
  });

  return targetIds;
}

function buildLinkedEntryCopy(prefix, targets) {
  const fragment = document.createDocumentFragment();
  fragment.append(document.createTextNode(prefix));

  targets.forEach((target, index) => {
    if (index > 0) {
      const joiner = index === targets.length - 1 ? " and " : ", ";
      fragment.append(document.createTextNode(joiner));
    }

    const linkButton = document.createElement("button");
    linkButton.type = "button";
    linkButton.className = "inline-link-button";
    linkButton.textContent = target.title;
    linkButton.addEventListener("click", () => {
      openModal(target.id);
    });

    fragment.append(linkButton);
  });

  return fragment;
}

function getUpgradeStatus(entry) {
  const normalized = String(entry.upgradeStatus ?? "")
    .trim()
    .toLowerCase();

  if (["completed", "upgraded", "done", "finished"].includes(normalized)) {
    return "completed";
  }

  return "available";
}

function renderValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return document.createTextNode("None");
    }

    if (value.every(isSimpleValue)) {
      return document.createTextNode(value.join(", "));
    }

    const list = document.createElement("ul");
    list.className = "detail-list";

    value.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.append(renderValue(item));
      list.append(listItem);
    });

    return list;
  }

  if (value && typeof value === "object") {
    const list = document.createElement("dl");
    list.className = "detail-sublist";

    Object.entries(value).forEach(([key, nestedValue]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");

      term.textContent = formatLabel(key);
      description.append(renderValue(nestedValue));

      row.append(term, description);
      list.append(row);
    });

    return list;
  }

  return document.createTextNode(String(value));
}

function isSimpleValue(value) {
  return ["string", "number", "boolean"].includes(typeof value);
}

function hasWideDetailContent(detailPairs) {
  return detailPairs.some(([, value]) => getValueComplexity(value) >= 110);
}

function getValueComplexity(value) {
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + getValueComplexity(item), 0);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((sum, [key, nestedValue]) => {
      return sum + String(key).length + getValueComplexity(nestedValue);
    }, 0);
  }

  return String(value ?? "").length;
}

// Helpers
function getEntryTitle(entry) {
  return entry.name ?? entry.title ?? "Untitled Entry";
}

function formatLabel(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
