document.addEventListener('DOMContentLoaded', () => {
  initRecipePage().catch(err => console.error('Error loading recipe:', err));
});

async function initRecipePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const response = await fetch('data/recipes.json');
  const recipes = await response.json();

  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  const titleElem = document.getElementById('recipe-title');
  const imageContainer = document.getElementById('recipe-image');
  const descSection = document.getElementById('recipe-description');
  const ingredientsSection = document.getElementById('recipe-ingredients');
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
}
