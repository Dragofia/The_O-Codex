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
  "details",
  "_createdIndex"
]);

const state = {
  worldData: null,
  query: "",
  activeView: "complete-codex",
  sortMode: "newest-first",
  activeTags: new Set(),
  selectedEntryId: null
};

let viewTransitionTimer = null;

const elements = {
  siteTitle: document.getElementById("site-title"),
  siteSubtitle: document.getElementById("site-subtitle"),
  viewTabs: document.getElementById("view-tabs"),
  controls: document.getElementById("controls"),
  searchInput: document.getElementById("search-input"),
  clearFilters: document.getElementById("clear-filters"),
  sortControls: document.getElementById("sort-controls"),
  sortSelect: document.getElementById("sort-select"),
  resultsSummary: document.getElementById("results-summary"),
  tagSuggestionsBlock: document.getElementById("tag-suggestions-block"),
  tagFilters: document.getElementById("tag-filters"),
  results: document.getElementById("results"),
  sectionTemplate: document.getElementById("section-template"),
  cardTemplate: document.getElementById("card-template"),
  modal: document.getElementById("entry-modal"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalClose: document.getElementById("modal-close"),
  modalCategory: document.getElementById("modal-category"),
  modalTitle: document.getElementById("modal-title"),
  modalSummary: document.getElementById("modal-summary"),
  modalDescription: document.getElementById("modal-description"),
  modalBody: document.getElementById("modal-body"),
  modalMedia: document.getElementById("modal-media"),
  modalTagsSection: document.getElementById("modal-tags-section"),
  modalTags: document.getElementById("modal-tags"),
  modalAliasesSection: document.getElementById("modal-aliases-section"),
  modalAliases: document.getElementById("modal-aliases"),
  modalDetailsSection: document.getElementById("modal-details-section"),
  modalDetails: document.getElementById("modal-details")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadWorldData();
  renderApp();
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

// Event wiring
function bindEvents() {
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

  elements.modalClose.addEventListener("click", closeModal);
  elements.modalBackdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
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
  elements.sortControls.classList.toggle("hidden", !isCategoryView);
  elements.sortSelect.value = state.sortMode;
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

function switchView(nextViewId) {
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
  const category = cardNode.querySelector(".entry-card__category");
  const title = cardNode.querySelector(".entry-card__title");
  const summary = cardNode.querySelector(".entry-card__summary");
  const tags = cardNode.querySelector(".entry-card__tags");

  category.textContent = categoryLabel;
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
    if (!passesCategoryFilter(entry) || !passesTagFilter(entry)) {
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
    orderedEntries.sort((left, right) => right._createdIndex - left._createdIndex);
    return orderedEntries;
  }

  orderedEntries.sort((left, right) => compareEntries(left, right, state.sortMode));
  return orderedEntries;
}

function compareEntries(left, right, sortMode) {
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

function passesCategoryFilter(entry) {
  return state.activeView === "complete-codex" || entry.category === state.activeView;
}

function passesTagFilter(entry) {
  return state.activeTags.size === 0 || entry.tags.some((tag) => state.activeTags.has(tag));
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

function getSuggestedTags() {
  const query = normalizeText(state.query);
  if (!query) {
    return [];
  }

  const suggestions = new Map();
  const allTags = [...new Set(state.worldData.entries.flatMap((entry) => entry.tags))];
  const matchedEntries = state.worldData.entries
    .filter((entry) => passesCategoryFilter(entry))
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

function getActiveViewLabel() {
  if (state.activeView === "complete-codex") {
    return "Complete Codex";
  }

  return state.worldData.categories.find((category) => category.id === state.activeView)?.label ?? "Selected Category";
}


// Modal behavior
function openModal(entryId) {
  const entry = state.worldData.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  const category = state.worldData.categories.find((item) => item.id === entry.category);
  const detailPairs = collectDetailPairs(entry);

  state.selectedEntryId = entryId;
  elements.modalCategory.textContent = category?.label ?? "Entry";
  elements.modalTitle.textContent = getEntryTitle(entry);
  elements.modalSummary.textContent = entry.summary ?? "No summary added yet.";
  elements.modalDescription.textContent = entry.description ?? "No full description has been added yet.";
  elements.modalMedia.replaceChildren(buildMediaFrame(entry, true));
  applyModalMediaLayout("side");
  void updateModalMediaLayout(entry);

  elements.modalTags.replaceChildren(...buildChips(entry.tags));
  elements.modalTagsSection.classList.toggle("hidden", entry.tags.length === 0);

  elements.modalAliases.textContent = entry.aliases.join(", ");
  elements.modalAliasesSection.classList.toggle("hidden", entry.aliases.length === 0);

  renderDetailPairs(detailPairs);

  elements.modal.classList.remove("hidden");
  elements.modal.setAttribute("aria-hidden", "false");
  elements.modalClose.focus();
}

function closeModal() {
  state.selectedEntryId = null;
  elements.modal.classList.add("hidden");
  elements.modal.setAttribute("aria-hidden", "true");
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

function renderDetailPairs(detailPairs) {
  elements.modalDetails.innerHTML = "";
  elements.modalDetailsSection.classList.toggle("hidden", detailPairs.length === 0);
  elements.modalDetailsSection.classList.toggle("modal__section--wide", hasWideDetailContent(detailPairs));

  if (detailPairs.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  detailPairs.forEach(([label, value]) => {
    const wrapper = document.createElement("dl");
    wrapper.className = "detail-item";

    const term = document.createElement("dt");
    term.textContent = label;

    const description = document.createElement("dd");
    description.append(renderValue(value));

    wrapper.append(term, description);
    fragment.append(wrapper);
  });

  elements.modalDetails.append(fragment);
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
