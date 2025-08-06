const oldJsonInput = document.getElementById('oldJsonInput');
const newQuotesContainer = document.getElementById('newQuotesContainer');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');

// Load quotes.json on page load
window.addEventListener('load', async () => {
  status.textContent = 'Loading quotes.json...';
  try {
    const response = await fetch('quotes.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    oldJsonInput.value = JSON.stringify(data, null, 2);
    status.textContent = '✅ Loaded quotes.json';
  } catch (err) {
    status.style.color = 'red';
    status.textContent = `❌ Failed to load quotes.json: ${err.message}`;
  }
});

// Create a new quote form
function createQuoteForm() {
  const div = document.createElement('div');
  div.className = 'quoteForm';

  div.innerHTML = `
    <label>Text:<textarea name="text" rows="2" required></textarea></label>
    <label>Author:<input type="text" name="author" /></label>
    <label>Tags (comma separated):<input type="text" name="tags" /></label>
    <label>Created:<input type="date" name="created" /></label>
    <label>Updated:<input type="date" name="updated" /></label>

    <div class="toggle-container">
      <span>Favorite:</span>
      <div class="toggle" title="Click to toggle"></div>
    </div>

    <button class="removeBtn" type="button">Remove</button>
  `;

  // Add toggle logic
  const toggle = div.querySelector('.toggle');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
  });

  div.querySelector('.removeBtn').addEventListener('click', () => {
    div.remove();
  });

  return div;
}

addQuoteBtn.addEventListener('click', () => {
  const form = createQuoteForm();
  newQuotesContainer.appendChild(form);
});

// Generate unique ID
function generateId(existingIds) {
  let id;
  do {
    id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  } while (existingIds.has(id));
  return id;
}

mergeBtn.addEventListener('click', async () => {
  status.style.color = '';
  status.textContent = '';

  let oldQuotes;
  try {
    oldQuotes = JSON.parse(oldJsonInput.value.trim() || '[]');
    if (!Array.isArray(oldQuotes)) throw new Error('Old JSON must be an array');
  } catch (e) {
    status.style.color = 'red';
    status.textContent = '❌ Error parsing old JSON: ' + e.message;
    return;
  }

  const existingIds = new Set(oldQuotes.map(q => q.id));
  const newQuotes = [];

  const forms = newQuotesContainer.querySelectorAll('.quoteForm');
  for (const form of forms) {
    const text = form.querySelector('textarea[name="text"]').value.trim();
    if (!text) continue;

    const author = form.querySelector('input[name="author"]').value.trim() || 'Unknown';
    const tagsRaw = form.querySelector('input[name="tags"]').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

    const createdInput = form.querySelector('input[name="created"]').value;
    const updatedInput = form.querySelector('input[name="updated"]').value;
    const created = createdInput ? new Date(createdInput).getTime() : Date.now();
    const updated = updatedInput ? new Date(updatedInput).getTime() : created;

    const fav = form.querySelector('.toggle').classList.contains('active');

    const id = generateId(existingIds);
    existingIds.add(id);

    newQuotes.push({ id, text, author, tags, fav, created, updated });
  }

  const combined = oldQuotes.concat(newQuotes);
  const jsonStr = JSON.stringify(combined, null, 2);

  try {
    await navigator.clipboard.writeText(jsonStr);
    status.style.color = 'green';
    status.textContent = `✅ Copied merged JSON with ${newQuotes.length} new quotes to clipboard`;
  } catch (err) {
    status.style.color = 'red';
    status.textContent = '❌ Failed to copy to clipboard: ' + err.message;
  }
});
