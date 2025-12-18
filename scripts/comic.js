document.addEventListener('DOMContentLoaded', () => {
  initComicPage().catch(err => {
    console.error('Error loading comic:', err);
  });
});

async function initComicPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    return;
  }

  const response = await fetch('data/comics.json');
  const comics = await response.json();

  const comic = comics.find(c => c.id === id);
  if (!comic) {
    return;
  }

  const titleElem = document.getElementById('comic-title');
  const imageElem = document.getElementById('comic-image');
  const altElem   = document.getElementById('comic-alt');

  const index = comics.findIndex(c => c.id === id);
  const firstComicId = comics[0].id;
  const lastComicId  = comics[comics.length - 1].id;
  const prevComicId  = index > 0 ? comics[index - 1].id : null;
  const nextComicId  = index < comics.length - 1 ? comics[index + 1].id : null;

  // Populate content
  titleElem.textContent = comic.title;
  imageElem.src = comic.image;
  imageElem.alt = comic.alt || comic.title;
  if (altElem) {
    altElem.textContent = comic.alt || '';
  }

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


  // Wire nav buttons
  const firstBtn  = document.getElementById('first-link');
  const prevBtn   = document.getElementById('prev-link');
  const randomBtn = document.getElementById('random-link');
  const nextBtn   = document.getElementById('next-link');
  const lastBtn   = document.getElementById('last-link');

  if (firstBtn) firstBtn.href = `comic.html?id=${firstComicId}`;
  if (lastBtn)  lastBtn.href  = `comic.html?id=${lastComicId}`;

  if (prevBtn) {
    if (prevComicId) {
      prevBtn.href = `comic.html?id=${prevComicId}`;
    } else {
      prevBtn.classList.add('disabled');
    }
  }

  if (nextBtn) {
    if (nextComicId) {
      nextBtn.href = `comic.html?id=${nextComicId}`;
    } else {
      nextBtn.classList.add('disabled');
    }
  }

  // Random button
  if (randomBtn) {
    const randomIndex = Math.floor(Math.random() * comics.length);
    const randomID = comics[randomIndex].id;
    randomBtn.href = `comic.html?id=${randomID}`;
  }

  const firstBtnBot  = document.getElementById('first-link-bottom');
  const prevBtnBot   = document.getElementById('prev-link-bottom');
  const randomBtnBot = document.getElementById('random-link-bottom');
  const nextBtnBot   = document.getElementById('next-link-bottom');
  const lastBtnBot   = document.getElementById('last-link-bottom');

  if (firstBtnBot) firstBtnBot.href = `comic.html?id=${firstComicId}`;
  if (lastBtnBot)  lastBtnBot.href  = `comic.html?id=${lastComicId}`;

  if (prevBtnBot) {
    if (prevComicId) {
      prevBtnBot.href = `comic.html?id=${prevComicId}`;
    } else {
      prevBtnBot.classList.add('disabled'); // optional styling
    }
  }

  if (nextBtnBot) {
    if (nextComicId) {
      nextBtnBot.href = `comic.html?id=${nextComicId}`;
    } else {
      nextBtnBot.classList.add('disabled');
    }
  }

  // Random button
  if (randomBtnBot) {
    const randomIndex = Math.floor(Math.random() * comics.length);
    const randomID = comics[randomIndex].id;
    randomBtnBot.href = `comic.html?id=${randomID}`;
  }

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