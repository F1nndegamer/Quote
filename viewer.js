async function loadQuotes() {
  try {
    const res = await fetch('quotes.json');
    const quotes = await res.json();

    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    for (const q of quotes) {
      const el = document.createElement('div');
      el.className = 'quote-card';
      el.innerHTML = `
        <div class="quote-text">“${escapeHtml(q.text)}”</div>
        <div class="meta">
          <div>
            ${escapeHtml(q.author || '')}
            <div class="tags">
              ${(q.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
          ${q.fav ? '<div class="fav" title="Favorite">★</div>' : ''}
        </div>
      `;
      grid.appendChild(el);
    }

  } catch (e) {
    alert('Failed to load quotes.');
  }
}

function escapeHtml(s = '') {
  return s.replaceAll('&','&amp;')
          .replaceAll('<','&lt;')
          .replaceAll('>','&gt;');
}

loadQuotes();
