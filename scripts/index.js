document.addEventListener('DOMContentLoaded', () => {
  initHomeComic().catch(err => console.error('Homepage comic error:', err));
  initUpdatesSection().catch(err => console.error('Homepage updates error:', err));
});

async function initHomeComic() {
  const titleElem = document.getElementById('comic-title');
  const imageElem = document.getElementById('comic-image');

  if (!titleElem || !imageElem) return;

  const response = await fetch('data/comics.json');
  const comics = await response.json();

  if (!Array.isArray(comics) || comics.length === 0) {
    titleElem.textContent = 'No comics found.';
    return;
  }

  // Allow optional ?id= on homepage; otherwise show latest (last)
  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get('id');

  let index = idFromUrl ? comics.findIndex(c => c.id === idFromUrl) : (comics.length - 1);
  if (index < 0) index = comics.length - 1;

  const comic = comics[index];

  // Render
  titleElem.textContent = comic.title || 'Untitled comic';
  imageElem.src = comic.image;
  imageElem.alt = comic.alt || comic.title || 'Mug & Marker comic';

  const dictionaryBox = document.getElementById('comic-dictionary');

if (dictionaryBox && comic.dictionary) {
  const { term, phonetic, pos, definitions } = comic.dictionary;

  dictionaryBox.innerHTML = `
    <div class="dict-term">
      <strong>${term}</strong>
      <span class="dict-phonetic">${phonetic}</span>
      <span class="dict-pos">${pos}</span>
    </div>
    <ol class="dict-definitions">
      ${definitions.map(d => `<li>${d}</li>`).join('')}
    </ol>
  `;

  dictionaryBox.hidden = false;
}

  // --- News (optional, per-comic) ---
  const newsBox = document.getElementById('comic-news');
  if (newsBox) {
    const news = (comic.news ?? '').toString().trim();
    if (news) {
      newsBox.textContent = news;
      newsBox.hidden = false;
    } else {
      newsBox.textContent = '';
      newsBox.hidden = true;
    }
  }
  
  // IDs for nav (top + bottom)
  const ids = {
    first: ['first-link', 'first-link-bottom'],
    prev:  ['prev-link', 'prev-link-bottom'],
    rand:  ['random-link', 'random-link-bottom'],
    next:  ['next-link', 'next-link-bottom'],
    last:  ['last-link', 'last-link-bottom']
  };

  const firstId = comics[0].id;
  const lastId  = comics[comics.length - 1].id;
  const prevId  = index > 0 ? comics[index - 1].id : null;
  const nextId  = index < comics.length - 1 ? comics[index + 1].id : null;

  // Homepage should navigate on homepage (index.html?id=...)
  const homeUrl = (comicId) => `index.html?id=${encodeURIComponent(comicId)}`;

  // Helper to set href (and disabled class when missing)
  const setLinks = (idList, href, disabled) => {
    idList.forEach(domId => {
      const el = document.getElementById(domId);
      if (!el) return;

      if (disabled) {
        el.href = '#';
        el.classList.add('disabled');
        el.setAttribute('aria-disabled', 'true');
        el.addEventListener('click', e => e.preventDefault());
      } else {
        el.href = href;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
      }
    });
  };

  setLinks(ids.first, homeUrl(firstId), false);
  setLinks(ids.last,  homeUrl(lastId),  false);

  setLinks(ids.prev, prevId ? homeUrl(prevId) : '#', !prevId);
  setLinks(ids.next, nextId ? homeUrl(nextId) : '#', !nextId);

  // Random
  const randomIndex = Math.floor(Math.random() * comics.length);
  const randomId = comics[randomIndex].id;
  setLinks(ids.rand, homeUrl(randomId), false);

  function simplifyComicNavForMobile() {
  if (window.innerWidth > 430) return;

  const replacements = {
    'Prev': '<',
    'Next': '>',
  };

  document.querySelectorAll('.comic-nav button, .comic-nav a').forEach(btn => {
    const text = btn.textContent.trim();

    if (replacements[text]) {
      btn.dataset.fullLabel = text;           // store original
      btn.textContent = replacements[text];
      btn.setAttribute('aria-label', text);
      btn.setAttribute('title', text);
    }
  });
}

simplifyComicNavForMobile();

}

async function initUpdatesSection() {
  const list = document.getElementById('updates-list');
  const empty = document.getElementById('updates-empty');

  if (!list) return;

  list.innerHTML = '';
  if (empty) empty.classList.add('hidden');

  let updates = [];
  try {
    const response = await fetch('data/updates.json');
    updates = await response.json();
  } catch (err) {
    console.error('Error fetching updates:', err);
    if (empty) empty.classList.remove('hidden');
    return;
  }

  const published = Array.isArray(updates)
    ? updates.filter(u => u && u.published !== false && u.published !== 'false')
    : [];

  const sorted = published.sort((a, b) => {
    const aPinned = a.pinned === true || a.pinned === 'true';
    const bPinned = b.pinned === true || b.pinned === 'true';
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const dateA = Date.parse(a.date) || 0;
    const dateB = Date.parse(b.date) || 0;
    return dateB - dateA;
  });

  if (!sorted.length) {
    if (empty) empty.classList.remove('hidden');
    return;
  }

  sorted.forEach(update => {
    const card = document.createElement('article');
    card.className = `update-card${update.pinned ? ' is-pinned' : ''}`;

    if (update.pinned) {
      const badge = document.createElement('span');
      badge.className = 'update-card__pill';
      badge.textContent = 'Pinned';
      card.appendChild(badge);
    }

    if (update.image) {
      const media = document.createElement('div');
      media.className = 'update-card__media';
      const img = document.createElement('img');
      img.src = update.image;
      img.alt = update.alt || update.title || 'Update image';
      media.appendChild(img);
      card.appendChild(media);
    }

    if (update.title) {
      const h3 = document.createElement('h3');
      h3.className = 'update-card__title';
      h3.textContent = update.title;
      card.appendChild(h3);
    }

    if (update.date) {
      const meta = document.createElement('p');
      meta.className = 'update-card__meta';
      const formatted = new Date(update.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      meta.textContent = formatted;
      card.appendChild(meta);
    }

    if (update.body) {
      const body = document.createElement('p');
      body.className = 'update-card__body';
      body.textContent = update.body;
      card.appendChild(body);
    }

    if (update.link && update.link.href) {
      const link = document.createElement('a');
      link.className = 'update-card__link';
      link.href = update.link.href;
      link.textContent = update.link.label || 'Read more';
      if (update.link.target) link.target = update.link.target;
      if (update.link.target === '_blank' && !update.link.rel) {
        link.rel = 'noopener noreferrer';
      } else if (update.link.rel) {
        link.rel = update.link.rel;
      }
      card.appendChild(link);
    }

    list.appendChild(card);
  });
}
