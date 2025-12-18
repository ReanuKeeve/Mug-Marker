// Mug & Marker Admin Tool (local)
// Supports: worksheets.json (thumbnail + gallery + files), recipes.json (ingredients + instructions), comics.json
// Loads JSON via file upload, edits in-memory with autosave to localStorage, exports JSON + upload manifest.

const el = (id) => document.getElementById(id);

const DATASETS = {
  worksheets: {
    filename: 'worksheets.json',
    hint: 'Fields: id, title, image (thumb), images[], description, tags[], files[{label,url}]',
    normalize(item) {
      const tags = normalizeTags(item.tags);
      const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
      const files = Array.isArray(item.files) ? item.files.map(f => ({
        label: (f && f.label) ? String(f.label) : '',
        url: (f && f.url) ? String(f.url) : ''
      })) : [];
      return {
        id: String(item.id ?? '').trim(),
        title: String(item.title ?? '').trim(),
        image: String(item.image ?? item.thumbnail ?? '').trim(),
        images,
        description: String(item.description ?? '').trim(),
        tags,
        files
      };
    },
    validate(items) {
      const errors = [];
      const ids = new Set();
      items.forEach((it, i) => {
        if (!it.id) errors.push(`Worksheet #${i + 1}: missing id`);
        if (it.id && ids.has(it.id)) errors.push(`Duplicate id: ${it.id}`);
        ids.add(it.id);
        if (!it.title) errors.push(`Worksheet ${it.id || '#' + (i + 1)}: missing title`);
        if (!it.image) errors.push(`Worksheet ${it.id || '#' + (i + 1)}: missing thumbnail image`);
        // soft warnings as errors? keep as warnings in manifest step; here we keep strict minimum.
      });
      return errors;
    },
    manifestPaths(item) {
      return [
        item.image,
        ...item.images,
        ...item.files.map(f => f.url)
      ].filter(Boolean);
    }
  },

  recipes: {
    filename: 'recipes.json',
    hint: 'Fields: id, title, image, alt?, tags?, ingredients[], instructions',
    normalize(item) {
      const tags = normalizeTags(item.tags);
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients.map(s => String(s)) : [];
      return {
        id: String(item.id ?? '').trim(),
        title: String(item.title ?? '').trim(),
        image: String(item.image ?? '').trim(),
        alt: String(item.alt ?? '').trim(),
        description: String(item.description ?? '').trim(), // optional (not used by your recipe.js but useful)
        tags,
        ingredients,
        instructions: String(item.instructions ?? '').trim()
      };
    },
    validate(items) {
      const errors = [];
      const ids = new Set();
      items.forEach((it, i) => {
        if (!it.id) errors.push(`Recipe #${i + 1}: missing id`);
        if (it.id && ids.has(it.id)) errors.push(`Duplicate id: ${it.id}`);
        ids.add(it.id);
        if (!it.title) errors.push(`Recipe ${it.id || '#' + (i + 1)}: missing title`);
        if (!it.image) errors.push(`Recipe ${it.id || '#' + (i + 1)}: missing image`);
        if (!Array.isArray(it.ingredients) || it.ingredients.filter(Boolean).length === 0) errors.push(`Recipe ${it.id || '#' + (i + 1)}: ingredients empty`);
        if (!it.instructions) errors.push(`Recipe ${it.id || '#' + (i + 1)}: instructions empty`);
      });
      return errors;
    },
    manifestPaths(item) {
      return [item.image].filter(Boolean);
    }
  },

  comics: {
    filename: 'comics.json',
    hint: 'Fields: id, title, image, alt?, description?, tags?, dictionary{term,phonetic,pos,definitions[]}',
    normalize(item) {
      const tags = normalizeTags(item.tags);

      const dict = (item && typeof item.dictionary === 'object' && item.dictionary) ? item.dictionary : null;
      const definitions = dict && Array.isArray(dict.definitions) ? dict.definitions.map(s => String(s).trim()).filter(Boolean) : [];

      const dictionary = dict ? {
        term: String(dict.term ?? '').trim(),
        phonetic: String(dict.phonetic ?? '').trim(),
        pos: String(dict.pos ?? '').trim(),
        definitions
      } : null;

      return {
        id: String(item.id ?? '').trim(),
        title: String(item.title ?? '').trim(),
        image: String(item.image ?? '').trim(),
        alt: String(item.alt ?? '').trim(),
        description: String(item.description ?? '').trim(),
        tags,
        dictionary
      };
    },

    validate(items) {
      const errors = [];
      const ids = new Set();
      items.forEach((it, i) => {
        if (!it.id) errors.push(`Comic #${i + 1}: missing id`);
        if (it.id && ids.has(it.id)) errors.push(`Duplicate id: ${it.id}`);
        ids.add(it.id);
        if (!it.title) errors.push(`Comic ${it.id || '#' + (i + 1)}: missing title`);
        if (!it.image) errors.push(`Comic ${it.id || '#' + (i + 1)}: missing image`);
      });
      return errors;
    },
    manifestPaths(item) {
      return [item.image].filter(Boolean);
    }
  }
};

const STORAGE_KEY = 'mm_admin_tool_v1';

const state = {
  dataset: 'worksheets',
  items: [],
  selectedId: null,
  lastLoadedName: null,
  dirty: false
};

// ---------- DOM refs ----------
const datasetSelect = el('dataset-select');
const itemListEl = el('item-list');
const searchEl = el('search');
const statusEl = el('status');
const bannerEl = el('banner');
const hintEl = el('dataset-hint');

const fileInput = el('file-input');

const formEl = el('editor-form');
const fieldId = el('field-id');
const fieldTitle = el('field-title');
const fieldTags = el('field-tags');
const fieldDescription = el('field-description');

const panels = {
  worksheets: el('panel-worksheets'),
  recipes: el('panel-recipes'),
  comics: el('panel-comics')
};

// worksheet panel
const wsThumb = el('ws-thumb');
const wsImages = el('ws-images');
const wsFiles = el('ws-files');
const wsAddImageBtn = el('ws-add-image');
const wsAddFileBtn = el('ws-add-file');

// recipe panel
const rcpImage = el('rcp-image');
const rcpAlt = el('rcp-alt');
const rcpIngredients = el('rcp-ingredients');
const rcpInstructions = el('rcp-instructions');

// comics panel
const cmcImage = el('cmc-image');
const cmcAlt = el('cmc-alt');
const cmcDictTerm = el('cmc-dict-term');
const cmcDictPhonetic = el('cmc-dict-phonetic');
const cmcDictPos = el('cmc-dict-pos');
const cmcDictDefinitions = el('cmc-dict-definitions');


const editorTitle = el('editor-title');
const editorMeta = el('editor-meta');

// buttons
el('btn-load').addEventListener('click', () => fileInput.click());
el('btn-new').addEventListener('click', onNewItem);
el('btn-duplicate').addEventListener('click', onDuplicateItem);
el('btn-delete').addEventListener('click', onDeleteItem);
el('btn-export').addEventListener('click', onExportJson);
el('btn-manifest').addEventListener('click', onExportManifest);

fileInput.addEventListener('change', onLoadFile);

datasetSelect.addEventListener('change', () => {
  state.dataset = datasetSelect.value;
  state.selectedId = null;
  // Try restore dataset from storage draft
  restoreFromStorage();
  refreshUI();
});

searchEl.addEventListener('input', () => renderList());

// worksheet add row actions
wsAddImageBtn.addEventListener('click', () => {
  const it = getSelected();
  if (!it) return;
  it.images = it.images || [];
  it.images.push('');
  markDirty();
  renderEditor();
});

wsAddFileBtn.addEventListener('click', () => {
  const it = getSelected();
  if (!it) return;
  it.files = it.files || [];
  it.files.push({ label: '', url: '' });
  markDirty();
  renderEditor();
});

// ---------- Helpers ----------
function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    const s = tags.trim();
    if (!s) return [];
    return s.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function setBanner(message, kind = 'error') {
  if (!message) {
    bannerEl.classList.add('hidden');
    bannerEl.textContent = '';
    return;
  }
  bannerEl.classList.remove('hidden');
  bannerEl.textContent = message;
}

function setStatus(msg) {
  statusEl.textContent = msg || '';
}

function markDirty() {
  state.dirty = true;
  saveToStorage();
  setStatus('Draft saved locally.');
}

function saveToStorage() {
  try {
    const payload = {
      dataset: state.dataset,
      selectedId: state.selectedId,
      items: state.items,
      lastLoadedName: state.lastLoadedName
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore
  }
}

function restoreFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.items = [];
      state.selectedId = null;
      state.lastLoadedName = null;
      return;
    }
    const payload = JSON.parse(raw);
    // We store a single dataset at a time. If user switches dataset, keep items if same dataset.
    if (payload && payload.dataset === state.dataset && Array.isArray(payload.items)) {
      state.items = payload.items.map(DATASETS[state.dataset].normalize);
      state.selectedId = payload.selectedId || null;
      state.lastLoadedName = payload.lastLoadedName || null;
    } else {
      state.items = [];
      state.selectedId = null;
      state.lastLoadedName = null;
    }
  } catch (e) {
    state.items = [];
    state.selectedId = null;
    state.lastLoadedName = null;
  }
}

function slugifyId(prefix) {
  const n = state.items.length + 1;
  const padded = String(n).padStart(3, '0');
  const map = { worksheets: 'w', recipes: 'r', comics: 'c' };
  return `${map[state.dataset] || prefix}-${padded}`;
}

function getSelected() {
  if (!state.selectedId) return null;
  return state.items.find(i => i.id === state.selectedId) || null;
}

function selectById(id) {
  state.selectedId = id;
  saveToStorage();
  renderList();
  renderEditor();
}

function clearEditor() {
  editorTitle.textContent = 'No item selected';
  editorMeta.textContent = '';
  fieldId.value = '';
  fieldTitle.value = '';
  fieldTags.value = '';
  fieldDescription.value = '';
  wsThumb.value = '';
  wsImages.innerHTML = '';
  wsFiles.innerHTML = '';
  rcpImage.value = '';
  rcpAlt.value = '';
  rcpIngredients.value = '';
  rcpInstructions.value = '';
  cmcImage.value = '';
  cmcAlt.value = '';
  cmcDictTerm.value = '';
  cmcDictPhonetic.value = '';
  cmcDictPos.value = '';
  cmcDictDefinitions.value = '';
}

function showPanel(which) {
  Object.keys(panels).forEach(k => panels[k].classList.toggle('hidden', k !== which));
}

// ---------- Rendering ----------
function refreshUI() {
  datasetSelect.value = state.dataset;
  hintEl.textContent = DATASETS[state.dataset].hint;
  renderList();
  renderEditor();
  setBanner('');
  setStatus(state.lastLoadedName ? `Loaded: ${state.lastLoadedName}` : 'Tip: Load a JSON file to begin, or click New.');
}

function renderList() {
  const q = (searchEl.value || '').trim().toLowerCase();

  const filtered = state.items.filter(it => {
    if (!q) return true;
    const tags = Array.isArray(it.tags) ? it.tags.join(' ') : '';
    const blob = `${it.id} ${it.title} ${tags}`.toLowerCase();
    return blob.includes(q);
  });

  itemListEl.innerHTML = '';
  filtered.forEach(it => {
    const div = document.createElement('div');
    div.className = 'item' + (it.id === state.selectedId ? ' active' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', it.id === state.selectedId ? 'true' : 'false');

    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = it.title || '(untitled)';

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    const tagPreview = (Array.isArray(it.tags) && it.tags.length) ? ` • ${it.tags.slice(0, 3).join(', ')}${it.tags.length > 3 ? '…' : ''}` : '';
    meta.textContent = `${it.id}${tagPreview}`;

    div.appendChild(title);
    div.appendChild(meta);

    div.addEventListener('click', () => selectById(it.id));
    itemListEl.appendChild(div);
  });

  const total = state.items.length;
  const shown = filtered.length;
  setStatus(state.lastLoadedName ? `Loaded: ${state.lastLoadedName} • Showing ${shown}/${total}` : `Showing ${shown}/${total}`);
}

function renderEditor() {
  const it = getSelected();
  if (!it) {
    clearEditor();
    showPanel('worksheets'); // default hidden anyway; we will hide all then show correct for dataset to avoid jump
    showPanel(state.dataset);
    return;
  }

  setBanner('');
  editorTitle.textContent = it.title || '(untitled)';
  editorMeta.textContent = `Editing ${state.dataset} • id: ${it.id}`;

  fieldId.value = it.id || '';
  fieldTitle.value = it.title || '';
  fieldTags.value = Array.isArray(it.tags) ? it.tags.join(', ') : '';
  fieldDescription.value = it.description || '';

  showPanel(state.dataset);

  if (state.dataset === 'worksheets') {
    wsThumb.value = it.image || '';
    renderWsImages(it);
    renderWsFiles(it);
  } else if (state.dataset === 'recipes') {
    rcpImage.value = it.image || '';
    rcpAlt.value = it.alt || '';
    rcpIngredients.value = Array.isArray(it.ingredients) ? it.ingredients.join('\n') : '';
    rcpInstructions.value = it.instructions || '';
  } else if (state.dataset === 'comics') {
    cmcImage.value = it.image || '';
    cmcAlt.value = it.alt || '';
    const dict = it.dictionary && typeof it.dictionary === 'object' ? it.dictionary : null;

    cmcDictTerm.value = dict ? (dict.term || '') : '';
    cmcDictPhonetic.value = dict ? (dict.phonetic || '') : '';
    cmcDictPos.value = dict ? (dict.pos || '') : '';
    cmcDictDefinitions.value = (dict && Array.isArray(dict.definitions)) ? dict.definitions.join('\n') : '';

  }
}

function renderWsImages(it) {
  const arr = Array.isArray(it.images) ? it.images : [];
  wsImages.innerHTML = '';
  arr.forEach((src, idx) => {
    const row = document.createElement('div');
    row.className = 'row';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '/assets/worksheets/w-001/w-001-1.png';
    input.value = src || '';
    input.addEventListener('input', () => {
      it.images[idx] = input.value;
      markDirty();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.textContent = '✕';
    del.title = 'Remove image';
    del.addEventListener('click', () => {
      it.images.splice(idx, 1);
      markDirty();
      renderEditor();
    });

    row.appendChild(input);
    row.appendChild(del);
    wsImages.appendChild(row);
  });
}

function renderWsFiles(it) {
  const arr = Array.isArray(it.files) ? it.files : [];
  wsFiles.innerHTML = '';
  arr.forEach((f, idx) => {
    const row = document.createElement('div');
    row.className = 'row two';

    const label = document.createElement('input');
    label.type = 'text';
    label.placeholder = 'Label (e.g. Download PDF)';
    label.value = f.label || '';
    label.addEventListener('input', () => {
      it.files[idx].label = label.value;
      markDirty();
    });

    const url = document.createElement('input');
    url.type = 'text';
    url.placeholder = '/assets/worksheets/files/w-001/file.pdf';
    url.value = f.url || '';
    url.addEventListener('input', () => {
      it.files[idx].url = url.value;
      markDirty();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.textContent = '✕';
    del.title = 'Remove file';
    del.addEventListener('click', () => {
      it.files.splice(idx, 1);
      markDirty();
      renderEditor();
    });

    row.appendChild(label);
    row.appendChild(url);
    row.appendChild(del);
    wsFiles.appendChild(row);
  });
}

// ---------- Form binding ----------
function bindCommonFieldHandlers() {
  fieldTitle.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.title = fieldTitle.value;
    markDirty();
    renderList();
    editorTitle.textContent = it.title || '(untitled)';
  });

  fieldTags.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.tags = normalizeTags(fieldTags.value);
    markDirty();
    renderList();
  });

  fieldDescription.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.description = fieldDescription.value;
    markDirty();
  });

  // worksheets fields
  wsThumb.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.image = wsThumb.value;
    markDirty();
  });

  // recipes fields
  rcpImage.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.image = rcpImage.value;
    markDirty();
  });

  rcpAlt.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.alt = rcpAlt.value;
    markDirty();
  });

  rcpIngredients.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.ingredients = rcpIngredients.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    markDirty();
  });

  rcpInstructions.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.instructions = rcpInstructions.value;
    markDirty();
  });

  // comics fields
  cmcImage.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.image = cmcImage.value;
    markDirty();
  });

  cmcAlt.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    it.alt = cmcAlt.value;
    markDirty();
  });
  function ensureComicDictionary(it) {
    if (!it.dictionary || typeof it.dictionary !== 'object') {
      it.dictionary = { term: '', phonetic: '', pos: '', definitions: [] };
    }
  }

  function cleanupComicDictionary(it) {
    const d = it.dictionary;
    if (!d) return;

    const hasAnything =
      (d.term && d.term.trim()) ||
      (d.phonetic && d.phonetic.trim()) ||
      (d.pos && d.pos.trim()) ||
      (Array.isArray(d.definitions) && d.definitions.length);

    if (!hasAnything) it.dictionary = null;
  }

  cmcDictTerm.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    ensureComicDictionary(it);
    it.dictionary.term = cmcDictTerm.value;
    cleanupComicDictionary(it);
    markDirty();
  });

  cmcDictPhonetic.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    ensureComicDictionary(it);
    it.dictionary.phonetic = cmcDictPhonetic.value;
    cleanupComicDictionary(it);
    markDirty();
  });

  cmcDictPos.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    ensureComicDictionary(it);
    it.dictionary.pos = cmcDictPos.value;
    cleanupComicDictionary(it);
    markDirty();
  });

  cmcDictDefinitions.addEventListener('input', () => {
    const it = getSelected(); if (!it) return;
    ensureComicDictionary(it);
    it.dictionary.definitions = cmcDictDefinitions.value
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
    cleanupComicDictionary(it);
    markDirty();
  });

}

// ---------- Actions ----------
async function onLoadFile() {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      setBanner('Loaded JSON must be an array of items. Example: [ { ... }, { ... } ]');
      return;
    }
    const norm = parsed.map(DATASETS[state.dataset].normalize);

    state.items = norm;
    state.lastLoadedName = file.name;
    state.selectedId = state.items[0]?.id || null;
    state.dirty = false;
    saveToStorage();
    refreshUI();
    if (state.selectedId) selectById(state.selectedId);
  } catch (e) {
    setBanner('Could not load JSON.\n\n' + String(e));
  }
}

function onNewItem() {
  const ds = state.dataset;
  const id = uniqueId(slugifyId(ds));
  const blank = DATASETS[ds].normalize({ id, title: '' });

  // dataset-specific defaults
  if (ds === 'worksheets') {
    blank.images = [];
    blank.files = [];
    blank.image = '';
  }
  if (ds === 'recipes') {
    blank.ingredients = [];
    blank.instructions = '';
    blank.image = '';
    blank.alt = '';
  }
  if (ds === 'comics') {
    blank.image = '';
    blank.alt = '';
  }

  state.items.unshift(blank);
  state.selectedId = id;
  markDirty();
  refreshUI();
  selectById(id);
}

function onDuplicateItem() {
  const it = getSelected();
  if (!it) return;

  const copy = JSON.parse(JSON.stringify(it));
  copy.id = uniqueId(it.id + '-copy');
  copy.title = copy.title ? copy.title + ' (copy)' : '(copy)';
  state.items.unshift(copy);
  state.selectedId = copy.id;
  markDirty();
  refreshUI();
  selectById(copy.id);
}

function onDeleteItem() {
  const it = getSelected();
  if (!it) return;
  const ok = confirm(`Delete "${it.title || it.id}"? This cannot be undone.`);
  if (!ok) return;

  const idx = state.items.findIndex(x => x.id === it.id);
  if (idx >= 0) state.items.splice(idx, 1);
  state.selectedId = state.items[0]?.id || null;
  markDirty();
  refreshUI();
  if (state.selectedId) selectById(state.selectedId);
}

function onExportJson() {
  const ds = state.dataset;
  const errors = DATASETS[ds].validate(state.items);
  if (errors.length) {
    setBanner('Fix these issues before export:\n\n- ' + errors.join('\n- '));
    return;
  }
  setBanner('');

  // Ensure final normalized output
  const out = state.items.map(DATASETS[ds].normalize);

  const filename = DATASETS[ds].filename;
  downloadText(filename, JSON.stringify(out, null, 2));
  setStatus(`Exported ${filename}`);
}

function onExportManifest() {
  const ds = state.dataset;
  const issues = [];
  const paths = [];

  state.items.forEach(it => {
    const p = DATASETS[ds].manifestPaths(it);
    p.forEach(x => {
      if (!x) return;
      paths.push(x);
      if (String(x).includes(' ')) issues.push(`URL contains spaces: ${x}`);
    });
  });

  const unique = Array.from(new Set(paths)).sort();

  const lines = [];
  lines.push(`Mug & Marker Upload Manifest`);
  lines.push(`Dataset: ${ds}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  if (issues.length) {
    lines.push('WARNINGS:');
    issues.forEach(w => lines.push('- ' + w));
    lines.push('');
  }

  // group by folder
  const groups = new Map();
  unique.forEach(p => {
    const folder = folderOf(p);
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder).push(p);
  });

  lines.push('UPLOAD THESE FILES (grouped by folder):');
  lines.push('');
  Array.from(groups.keys()).sort().forEach(folder => {
    lines.push(folder || '(no folder)');
    groups.get(folder).forEach(p => lines.push('  - ' + basename(p)));
    lines.push('');
  });

  lines.push('Then replace the JSON on your website:');
  lines.push(`  /data/${DATASETS[ds].filename}`);
  lines.push('');
  lines.push('Note: This admin tool cannot upload or modify your server. It only exports files for you to upload.');

  downloadText(`upload-manifest-${ds}.txt`, lines.join('\n'));
  setStatus('Exported upload manifest.');
}

function folderOf(path) {
  const s = String(path);
  const i = s.lastIndexOf('/');
  return i >= 0 ? s.slice(0, i + 1) : '';
}
function basename(path) {
  const s = String(path);
  const i = s.lastIndexOf('/');
  return i >= 0 ? s.slice(i + 1) : s;
}

function uniqueId(base) {
  let id = String(base).trim() || slugifyId(state.dataset);
  const exists = (x) => state.items.some(it => it.id === x);
  if (!exists(id)) return id;
  let n = 2;
  while (exists(`${id}-${n}`)) n++;
  return `${id}-${n}`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

// ---------- Init ----------
bindCommonFieldHandlers();
restoreFromStorage();
refreshUI();

// If there are items, select the first
if (state.items.length && state.selectedId) {
  selectById(state.selectedId);
}
