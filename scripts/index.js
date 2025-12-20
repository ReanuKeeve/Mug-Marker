document.addEventListener('DOMContentLoaded', () => {
  initHomeComic().catch(err => console.error('Homepage comic error:', err));
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