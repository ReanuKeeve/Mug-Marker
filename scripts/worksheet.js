document.addEventListener('DOMContentLoaded', () => {
  initWorksheetPage().catch(err => {
    console.error('Error loading worksheet:', err);
  });
});

async function initWorksheetPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const response = await fetch('data/worksheets.json');
  const worksheets = await response.json();

  const worksheet = worksheets.find(w => w.id === id);
  if (!worksheet) {
    console.warn('Worksheet not found for id:', id);
    return;
  }

  const titleElem       = document.getElementById('worksheets-title');
  const imageContainer  = document.getElementById('worksheet-image');
  const descriptionElem = document.getElementById('worksheet-description');
  const tagsElem        = document.getElementById('worksheet-tags');

  if (titleElem) {
    titleElem.textContent = worksheet.title;
  }

  if (imageContainer) {
  imageContainer.innerHTML = '';

  if (Array.isArray(worksheet.images)) {
    worksheet.images.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = worksheet.title;
      imageContainer.appendChild(img);
    });
  } else if (worksheet.image) {
    const img = document.createElement('img');
    img.src = worksheet.image;
    img.alt = worksheet.title;
    imageContainer.appendChild(img);
  }
}

  if (descriptionElem && worksheet.description) {
    descriptionElem.textContent = worksheet.description;
  }

  if (tagsElem && worksheet.tags) {
    if (Array.isArray(worksheet.tags)) {
      tagsElem.textContent = worksheet.tags.join(', ');
    } else {
      tagsElem.textContent = worksheet.tags;
    }
  }

  const filesList = document.getElementById('worksheet-files');

if (filesList && Array.isArray(worksheet.files)) {
  filesList.innerHTML = '';
  worksheet.files.forEach(file => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = file.url;
    a.textContent = file.label || 'Download';
    a.download = '';
    li.appendChild(a);
    filesList.appendChild(li);
  });
}
}