document.addEventListener('DOMContentLoaded', () => {
  initRecipePage().catch(err => console.error('Error loading recipe:', err));
});

async function initRecipePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const response = await fetch('data/recipes.json');
  const recipes = await response.json();

  const recipe = recipes.find(r => String(r.id) === String(id));
  if (!recipe) return;

  const titleElem = document.getElementById('recipe-title');
  const imageContainer = document.getElementById('recipe-image');
  const descSection = document.getElementById('recipe-description');
  const tagsSection = document.getElementById('recipe-tags');
  const ingredientsSection = document.getElementById('recipe-ingredients');
  const equipmentSection = document.getElementById('recipe-equipment');
  const methodSection = document.getElementById('recipe-method');
  const extrasSection = document.getElementById('recipe-extras');

  // Title
  if (titleElem) titleElem.textContent = recipe.title || 'Recipe';

  // Image
  if (imageContainer) {
    imageContainer.innerHTML = '';
    if (recipe.image) {
      const img = document.createElement('img');
      img.src = recipe.image;
      img.alt = recipe.alt || recipe.title || 'Recipe image';
      imageContainer.appendChild(img);
    }
  }

  // Description (uses recipe.description if present)
  if (descSection) {
    descSection.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = 'Description';
    descSection.appendChild(h);

    const p = document.createElement('p');
    p.textContent = recipe.description || '';
    descSection.appendChild(p);

    if (!recipe.description) descSection.style.display = 'none';
    else descSection.style.display = '';
  }

  // Ingredients
  if (ingredientsSection) {
    ingredientsSection.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = 'Ingredients';
    ingredientsSection.appendChild(h);

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      const ul = document.createElement('ul');
      recipe.ingredients.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      ingredientsSection.appendChild(ul);
      ingredientsSection.style.display = '';
    } else {
      ingredientsSection.style.display = 'none';
    }
  }

  // Tags
  if (tagsSection) {
    tagsSection.innerHTML = '';
    const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
    if (tags.length) {
      tagsSection.style.display = '';
      tags.forEach(tag => {
        const chip = document.createElement('a');
        chip.className = 'tag-chip';
        chip.href = `recipes.html?tag=${encodeURIComponent(tag)}`;
        chip.textContent = tag;
        tagsSection.appendChild(chip);
      });
    } else {
      tagsSection.style.display = 'none';
    }
  }

  // Equipment
  if (equipmentSection) {
    equipmentSection.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = 'Equipment';
    equipmentSection.appendChild(h);

    if (Array.isArray(recipe.equipment) && recipe.equipment.length) {
      const ul = document.createElement('ul');
      recipe.equipment.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      equipmentSection.appendChild(ul);
      equipmentSection.style.display = '';
    } else {
      equipmentSection.style.display = 'none';
    }
  }

  // Method (instructions)
  if (methodSection) {
    methodSection.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = 'Method';
    methodSection.appendChild(h);

    if (recipe.instructions) {
      const article = document.createElement('article');
      article.textContent = recipe.instructions;
      methodSection.appendChild(article);
      methodSection.style.display = '';
    } else {
      methodSection.style.display = 'none';
    }
  }

  // Extras: optional fields (safe if absent)
  if (extrasSection) {
    extrasSection.innerHTML = '';
    const hasNotes = typeof recipe.notes === 'string' && recipe.notes.trim();
    const hasImages = Array.isArray(recipe.images) && recipe.images.length;

    if (!hasNotes && !hasImages) {
      extrasSection.style.display = 'none';
    } else {
      extrasSection.style.display = '';
      const h = document.createElement('h3');
      h.textContent = 'Notes / Extras';
      extrasSection.appendChild(h);

      if (hasNotes) {
        const p = document.createElement('p');
        p.textContent = recipe.notes;
        extrasSection.appendChild(p);
      }

      if (hasImages) {
        const grid = document.createElement('div');
        grid.className = 'recipe-extra-grid';
        recipe.images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = recipe.title ? `${recipe.title} extra image` : 'Recipe extra image';
          grid.appendChild(img);
        });
        extrasSection.appendChild(grid);
      }
    }
  }

  const backBtn = document.getElementById('back-button');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'recipes.html';
    });
  }

  const randomBtn = document.getElementById('random-recipe-button');
  if (randomBtn && Array.isArray(recipes) && recipes.length) {
    randomBtn.addEventListener('click', () => {
      const pool = recipes.filter(r => String(r.id) !== String(id));
      const candidates = pool.length ? pool : recipes;
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      if (random?.id !== undefined) {
        window.location.href = `recipe.html?id=${encodeURIComponent(random.id)}`;
      }
    });
  }
}
