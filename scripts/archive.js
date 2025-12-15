const comicsList = document.getElementById('comics-list');
const worksheetsList = document.getElementById('worksheets-list');
const recipesList = document.getElementById('recipes-list');

if (comicsList) {
    fetch('data/comics.json')
        .then(response => response.json())
        .then(comics => {
            comics.forEach(comic => {
                const item = document.createElement('div');
                const link = document.createElement('a');
                const img = document.createElement('img');
                img.src = comic.image;
                img.alt = comic.title;
                link.href = `comic.html?id=${comic.id}`;
                link.appendChild(img);
                item.appendChild(link);

                const title = document.createElement('h3');
                title.textContent = comic.title;
                item.appendChild(title);

                comicsList.appendChild(item);
            });
        })
        .catch(err => console.error("Error loading comics:", err));
}

if (worksheetsList) {
  initArchive({
    listEl: worksheetsList,
    jsonUrl: 'data/worksheets.json',
    pageType: 'worksheet',
    searchInputId: 'worksheet-search',
    tagsWrapId: 'worksheet-tags',
    groupToggleId: 'worksheet-group-toggle',
    clearBtnId: 'worksheet-clear',
    resultsId: 'worksheet-results'
  });
}

if (recipesList) {
  initArchive({
    listEl: recipesList,
    jsonUrl: 'data/recipes.json',
    pageType: 'recipe',
    searchInputId: 'recipe-search',
    tagsWrapId: 'recipe-tags',
    groupToggleId: 'recipe-group-toggle',
    clearBtnId: 'recipe-clear',
    resultsId: 'recipe-results'
  });
}

async function initArchive(cfg) {
  const {
    listEl, jsonUrl, pageType,
    searchInputId, tagsWrapId, groupToggleId, clearBtnId, resultsId
  } = cfg;

  const searchEl = document.getElementById(searchInputId);
  const tagsWrap = document.getElementById(tagsWrapId);
  const groupToggle = document.getElementById(groupToggleId);
  const clearBtn = document.getElementById(clearBtnId);
  const resultsEl = document.getElementById(resultsId);

  const response = await fetch(jsonUrl);
  const rawItems = await response.json();

  // Normalize tags: allow tags as array or string
  const items = rawItems.map(item => {
    const tags = Array.isArray(item.tags)
      ? item.tags
      : (typeof item.tags === 'string' && item.tags.trim() ? item.tags.split(',').map(t => t.trim()) : []);

    // Build a searchable text blob (recipes have ingredients/instructions)
    const searchBlobParts = [
      item.title || '',
      item.description || '',
      ...(Array.isArray(item.ingredients) ? item.ingredients : []),
      item.instructions || '',
      ...tags
    ];

    return {
      ...item,
      tags,
      _search: searchBlobParts.join(' ').toLowerCase()
    };
  });

  // Build tag list
  const allTags = Array.from(
    new Set(items.flatMap(i => i.tags.map(t => t.toLowerCase())))
  ).sort();

  const state = {
    q: '',
    activeTag: null,
    groupByTag: false
  };

  // Render tag chips
  tagsWrap.innerHTML = '';
  allTags.forEach(tagLower => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-chip';
    btn.textContent = tagLower;
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', () => {
      state.activeTag = (state.activeTag === tagLower) ? null : tagLower;
      // update pressed state
      [...tagsWrap.querySelectorAll('.tag-chip')].forEach(b => {
        b.setAttribute('aria-pressed', b.textContent === state.activeTag ? 'true' : 'false');
      });
      render();
    });

    tagsWrap.appendChild(btn);
  });

  function renderCards(targetEl, subset) {
    targetEl.innerHTML = '';

    subset.forEach(item => {
      const card = document.createElement('div');

      const link = document.createElement('a');
      link.href = `${pageType}.html?id=${item.id}`;

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.alt || item.title;

      link.appendChild(img);
      card.appendChild(link);

      const title = document.createElement('h3');
      title.textContent = item.title;
      card.appendChild(title);

      targetEl.appendChild(card);
    });
  }

  function renderGrouped(subset) {
    listEl.innerHTML = '';

    // group by first tag; if no tag, bucket under "untagged"
    const groups = new Map();
    subset.forEach(item => {
      const key = (item.tags[0] || 'untagged').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    [...groups.keys()].sort().forEach(tag => {
      const section = document.createElement('div');
      section.className = 'tag-section';

      const h3 = document.createElement('h3');
      h3.textContent = tag;
      section.appendChild(h3);

      const grid = document.createElement('div');
     
      grid.className = listEl.className; 
      section.appendChild(grid);

      renderCards(grid, groups.get(tag));
      listEl.appendChild(section);
    });
  }

  function render() {
    const q = state.q.trim().toLowerCase();
    let filtered = items;

    if (q) filtered = filtered.filter(i => i._search.includes(q));
    if (state.activeTag) filtered = filtered.filter(i => i.tags.map(t => t.toLowerCase()).includes(state.activeTag));

    if (resultsEl) {
      resultsEl.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
    }

    if (state.groupByTag) {
      renderGrouped(filtered);
    } else {
      renderCards(listEl, filtered);
    }
  }

  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      state.q = e.target.value;
      render();
    });
  }

  if (groupToggle) {
    groupToggle.addEventListener('change', (e) => {
      state.groupByTag = e.target.checked;
      render();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.q = '';
      state.activeTag = null;
      state.groupByTag = false;

      if (searchEl) searchEl.value = '';
      if (groupToggle) groupToggle.checked = false;

      [...tagsWrap.querySelectorAll('.tag-chip')].forEach(b => b.setAttribute('aria-pressed', 'false'));
      render();
    });
  }

  render();
}