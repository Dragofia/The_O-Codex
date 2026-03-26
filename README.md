# D&D World Codex

This project is a simple static codex website for your campaign. It uses only HTML, CSS, vanilla JavaScript, and one JSON data file.

## What each file does

- `index.html`: the page structure, templates, search controls, and modal container.
- `styles.css`: the visual design, layout, card styles, modal styles, and responsive rules.
- `script.js`: loads the JSON file, renders entries, opens the modal, and handles search and filtering.
- `world-data.json`: all codex content lives here.
- `images/`: place entry images here and point to them from `world-data.json`.

## Important local preview note

Because the site loads `world-data.json` with JavaScript, some browsers will block it if you open `index.html` directly as a local file.

For local testing, use a simple static server instead. Examples:

- Python: `python -m http.server 8000`
- Python on Windows launcher: `py -m http.server 8000`
- VS Code extension: Live Server

Then open `http://localhost:8000`

Once hosted on GitHub Pages, your friends can just use the live link.

## How to add a new entry

Open `world-data.json` and find the `"entries"` array.

Each entry looks like this:

```json
{
  "id": "character-example-name",
  "category": "characters",
  "name": "Example Name",
  "summary": "A short card summary.",
  "description": "The full text shown in the modal.",
  "tags": ["ally", "mage"],
  "aliases": ["Misspelling", "Nickname"],
  "image": "images/example-image.png",
  "details": {
    "Role": "Court wizard",
    "Status": "Missing"
  }
}
```

Tips:

- `id` should be unique.
- `category` must match one of the category `id` values in the `"categories"` list.
- Use `name` for people, places, and items.
- Use `title` instead of `name` if that reads better for quests or events.
- `aliases` are optional, but useful for nicknames, common misspellings, or sound-alike search terms.
- `image` is optional. If you leave it out, the site shows a fallback card image.
- `details` is optional. It is a good place for neat extra info.

You can also add extra fields outside `details`, like `"status": "Missing"` or `"dangerLevel": "High"`. The site will still show them in the modal details area automatically.

## How to add a new image

1. Put the image file inside the `images/` folder.
2. Add the file path to the entry's `image` field.

Example:

```json
"image": "images/cooper-vale.png"
```

You can also make subfolders later if you want:

```json
"image": "images/characters/cooper-vale.png"
```

## How to add a new category later

1. Open `world-data.json`
2. Add a new object to the `"categories"` array
3. Use that category `id` in any new entries

Example:

```json
{
  "id": "factions",
  "label": "Factions",
  "description": "Guilds, orders, and political groups."
}
```

Then create entries like:

```json
{
  "id": "faction-night-court",
  "category": "factions",
  "name": "Night Court",
  "summary": "A secretive noble circle.",
  "description": "Full faction notes go here."
}
```

You do not need to rewrite the rendering code just to add the new category.

## Which parts of the code control rendering

The main rendering functions are in `script.js`:

- `loadWorldData()`: loads `world-data.json`
- `renderApp()`: refreshes the whole page after data or filters change
- `renderResults()`: groups entries by category and sends them to the page
- `buildCategorySection()`: creates one category section
- `buildEntryCard()`: creates one card
- `openModal()`: fills the modal with the clicked entry
- `collectDetailPairs()`: gathers extra fields so unknown fields still display cleanly

## Which parts of the code control filtering

The filtering and search logic is also in `script.js`:

- `getGroupedResults()`: applies the current filters and search
- `passesCategoryFilter()`: checks category filters
- `passesTagFilter()`: checks tag filters
- `getSearchScore()`: ranks matches for the search bar
- `phoneticKey()`: helps with sound-alike matching
- `levenshteinDistance()`: helps with typo matching

Search behavior:

- Results stay grouped by category
- Search shows up to 5 matches per category
- Aliases are searched too
- Light typo and phonetic matching are included, but aliases are still the best way to guarantee unusual names are found

## How to host it as a static site later

The easiest path is GitHub Pages.

Basic steps:

1. Create a GitHub repository
2. Upload these files
3. In the repository settings, open `Pages`
4. Publish from the main branch
5. GitHub gives you a public link to share with your group

Only people with access to your GitHub repository can edit the files. Visitors to the site can view it, but they cannot change it.

## Suggested editing workflow for you

The simplest long-term workflow is:

1. Keep using `world-data.json` as the source of truth
2. Add new entries by copying an existing entry and editing it
3. Add aliases for names your players might misspell
4. Upload new images into `images/`
5. Publish changes to GitHub Pages when you update the campaign

If you later want a form-based editor, this structure is simple enough to connect to a Git-backed CMS or a custom admin page without rebuilding the whole site.
