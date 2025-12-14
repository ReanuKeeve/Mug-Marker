document.addEventListener('DOMContentLoaded', () => {
  initRecipePage().catch(err => {
    console.error('Error loading recipe:', err);
  });
});

async function initRecipePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) return;

  const response = await fetch('/data/recipes.json');
  const recipes = await response.json();

  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  const titleElem        = document.getElementById('recipe-title');
  const imageContainer   = document.getElementById('recipe-image');
  const ingredientsElem  = document.getElementById('recipe-ingredients'); 
  const instructionsElem = document.getElementById('recipe-instructions');

  // Title
  if (titleElem) {
    titleElem.textContent = recipe.title;
  }

  // Image
  if (imageContainer && recipe.image) {
    const img = document.createElement('img');
    img.src = recipe.image;
    img.alt = recipe.alt || recipe.title;
    imageContainer.innerHTML = '';
    imageContainer.appendChild(img);
  }

  // Ingredients list (array of strings)
  if (ingredientsElem && Array.isArray(recipe.ingredients)) {
    const ul = document.createElement('ul');
    recipe.ingredients.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
    ingredientsElem.innerHTML = '';
    ingredientsElem.appendChild(ul);
  }

  // Instruction article 
  if (instructionsElem) {
    const article = document.createElement('article');
    article.textContent = recipe.instructions;
    instructionsElem.innerHTML = '';
    instructionsElem.appendChild(article);
  }
}
