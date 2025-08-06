const oldJsonInput = document.getElementById('oldJsonInput');
const newQuotesContainer = document.getElementById('newQuotesContainer');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');

// Load view.json automatically on page load
window.addEventListener('load', async () => {
  status.textContent = 'Loading view.json...';
  try {
    const response = await fetch('view.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const jsonData = await response.json();
    oldJsonInput.value = JSON.stringify(jsonData, null, 2);
    status.textContent = 'Loaded existing view.json';
  } catch (err) {
    status.style.color = 'red';
    status.textContent = `Failed to load view.json: ${err.message}`;
  }
});

function createQuoteForm(id) {
  const div = document.createElement('div');
  div.className = 'quoteForm';

  div.innerHTML = `
    <label>Text:<textarea rows="2" required></textarea></label>
    <label>Author:<input type="text" /></label>
    <label>Tags (comma separated):<input type="text" /></label>
    <label>Favorite (true/false):<input type="text" value="false" /></label>
    <label>Created (timestamp or leave blank for now):<input type="number" /></label>
    <label>Updated (timestamp or leave blank for now):<input type="number" /></label>
    <button class="removeBtn" type="button">Remove</button>
  `;

  div.querySelector('.removeBtn').addEventListener('click', () => {
    div.remove();
  });

  return div;
}

addQuoteBtn.addEventListener('click', () => {
  const form = createQuoteForm(Date.now());
  newQuotesContainer.appendChild(form);
});

// Generate new ID helper
function generateId(existingIds) {
  let id;
  do {
    id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  } while (existingIds.has(id));
  return id;
}

mergeBtn.addEventListener('click', () => {
  status.textContent = '';
  let oldQuotes;
  try {
    oldQuotes = JSON.parse(oldJsonInput.value.trim() || '[]');
    if (!Array.isArray(oldQuotes)) throw new Error('Old JSON must be an array');
  } catch (e) {
    status.style.color = 'red';
    status.textContent = 'Error parsing old JSON: ' + e.message;
    return;
  }

  const existingIds = new Set(oldQuotes.map(q => q.id));

  const newQuotes = [];
  const forms = newQuotesContainer.querySelectorAll('.quoteForm');
  for (const form of forms) {
    const text = form.querySelector('textarea').value.trim();
    if (!text) continue;

    const author = form.querySelector('input[type="text"]').value.trim() || 'Unknown';
    const tagsRaw = form.querySelectorAll('input[type="text"]')[1].value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length) : [];

    let favRaw = form.querySelectorAll('input[type="text"]')[2].value.trim().toLowerCase();
    const fav = (favRaw === 'true');

    let createdRaw = form.querySelector('input[type="number"]').value.trim();
    const created = createdRaw ? Number(createdRaw) : Date.now();

    let updatedRaw = form.querySelectorAll('input[type="number"]')[1].value.trim();
    const updated = updatedRaw ? Number(updatedRaw) : created;

    const id = generateId(existingIds);
    existingIds.add(id);

    newQuotes.push({
      id,
      text,
      author,
      tags,
      fav,
      created,
      updated
    });
  }

  const combined = oldQuotes.concat(newQuotes);

  const jsonStr = JSON.stringify(combined, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'view_merged.json';
  a.click();

  URL.revokeObjectURL(url);

  status.style.color = 'green';
  status.textContent = `Merged ${oldQuotes.length} old quotes with ${newQuotes.length} new quotes.\nDownloaded "view_merged.json".`;
});
