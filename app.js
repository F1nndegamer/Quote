  // Basic data model in localStorage
  const KEY = 'stellar_quotes_v1';
  let quotes = [];
  let showOnlyFav = false;
  let sortNewest = true;

  // UI elements
  const grid = document.getElementById('grid');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteTags = document.getElementById('quoteTags');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const newBtn = document.getElementById('newBtn');
  const searchInput = document.getElementById('searchInput');
  const countStat = document.getElementById('countStat');
  const favStat = document.getElementById('favStat');
  const tagsStat = document.getElementById('tagsStat');
  const visibleCount = document.getElementById('visibleCount');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const sortBtn = document.getElementById('sortBtn');
  const filterFavBtn = document.getElementById('filterFavBtn');

  // Utility
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  function saveToStorage(){ localStorage.setItem(KEY, JSON.stringify(quotes)); }
  function loadFromStorage(){ try{ quotes = JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ quotes=[]; } }

  function updateStats(){
    countStat.textContent = 'Quotes: ' + quotes.length;
    favStat.textContent = 'Favorites: ' + quotes.filter(q=>q.fav).length;
    const tags = Array.from(new Set(quotes.flatMap(q => q.tags || [])));
    tagsStat.textContent = 'Tags: ' + (tags.length? tags.join(', ') : '—');
  }

  // Rendering
  function render(){
    grid.innerHTML = '';
    updateStats();

    let visible = quotes.slice();
    if (sortNewest) visible.sort((a,b)=>b.created - a.created);
    else visible.sort((a,b)=>a.created - b.created);

    const q = searchInput.value.trim().toLowerCase();
    if (q) visible = visible.filter(it => {
      return (it.text + ' ' + (it.author||'') + ' ' + (it.tags||[]).join(' ')).toLowerCase().includes(q);
    });

    if (showOnlyFav) visible = visible.filter(it => it.fav);

    visibleCount.textContent = visible.length;

    for (const it of visible){
      const el = document.createElement('div');
      el.className = 'quote-card';
      el.innerHTML = `
        <div class="quote-text">“${escapeHtml(it.text)}”</div>
        <div class="meta">
          <div>
            <div class="muted" style="font-size:13px">${escapeHtml(it.author || '')}</div>
            <div class="tags" style="margin-top:6px">${(it.tags||[]).slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
          </div>
          <div class="card-actions">
            <button class="icon-btn fav-btn" title="Favorite"> ${it.fav? '★' : '☆'} </button>
            <button class="icon-btn copy-btn" title="Copy quote">⧉</button>
            <button class="icon-btn edit-btn" title="Edit">✎</button>
            <button class="icon-btn del-btn" title="Delete">🗑️</button>
          </div>
        </div>
      `;
      // attach handlers
      el.querySelector('.fav-btn').addEventListener('click', ()=>{
        it.fav = !it.fav; saveToStorage(); render();
      });
      el.querySelector('.copy-btn').addEventListener('click', ()=>{
        navigator.clipboard?.writeText(`"${it.text}" ${it.author? '— ' + it.author : ''}`).then(()=>{/*copied*/});
      });
      el.querySelector('.edit-btn').addEventListener('click', ()=>{
        quoteText.value = it.text;
        quoteAuthor.value = it.author || '';
        quoteTags.value = (it.tags || []).join(', ');
        saveBtn.textContent = 'Update Quote';
        saveBtn.dataset.editId = it.id;
        window.scrollTo({top:0,behavior:'smooth'});
      });
      el.querySelector('.del-btn').addEventListener('click', ()=>{
        if(confirm('Delete this quote?')) {
          quotes = quotes.filter(q => q.id !== it.id);
          saveToStorage(); render();
        }
      });

      grid.appendChild(el);
    }
  }

  // Escape helper
  function escapeHtml(s = ''){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // Save / update
  saveBtn.addEventListener('click', ()=>{
    const text = quoteText.value.trim();
    if(!text){ alert('Quote text is empty'); return; }
    const author = quoteAuthor.value.trim();
    const tags = quoteTags.value.split(',').map(t=>t.trim()).filter(Boolean);
    const now = Date.now();

    if(saveBtn.dataset.editId){
      const id = saveBtn.dataset.editId;
      const idx = quotes.findIndex(q=>q.id===id);
      if(idx>=0){
        quotes[idx].text = text;
        quotes[idx].author = author;
        quotes[idx].tags = tags;
        quotes[idx].updated = now;
      }
      delete saveBtn.dataset.editId;
      saveBtn.textContent = 'Save Quote';
    } else {
      quotes.push({
        id: uid(),
        text,
        author,
        tags,
        fav: false,
        created: now,
        updated: now
      });
    }
    quoteText.value='';quoteAuthor.value='';quoteTags.value='';
    saveToStorage(); render();
  });

  clearBtn.addEventListener('click', ()=>{
    quoteText.value='';quoteAuthor.value='';quoteTags.value='';
    delete saveBtn.dataset.editId;
    saveBtn.textContent = 'Save Quote';
  });

  newBtn.addEventListener('click', ()=>{
    window.scrollTo({top:0,behavior:'smooth'});
    quoteText.focus();
  });

  searchInput.addEventListener('input', render);

  // keyboard shortcut: n to focus new
  window.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase()==='n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){
      quoteText.focus();
      e.preventDefault();
    }
  });

  // export / import
  exportBtn.addEventListener('click', ()=>{
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stellar_quotes.json'; a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      try{
        const parsed = JSON.parse(evt.target.result);
        if(!Array.isArray(parsed)) throw new Error('Invalid format: expected array');
        // basic validation
        if(!confirm('Import will replace your current quotes. Continue?')) return;
        quotes = parsed.map(it => ({
          id: it.id || uid(),
          text: it.text || '',
          author: it.author || '',
          tags: it.tags || [],
          fav: !!it.fav,
          created: it.created || Date.now(),
          updated: it.updated || (it.created || Date.now())
        }));
        saveToStorage(); render();
      }catch(err){
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(f);
    fileInput.value = '';
  });

  // sort/filter
  sortBtn.addEventListener('click', ()=>{
    sortNewest = !sortNewest;
    sortBtn.textContent = 'Sort: ' + (sortNewest? 'Newest' : 'Oldest');
    render();
  });
  filterFavBtn.addEventListener('click', ()=>{
    showOnlyFav = !showOnlyFav;
    filterFavBtn.textContent = showOnlyFav? 'Show All' : 'Show Favorites';
    render();
  });

  // initial load + sample quotes if empty
  loadFromStorage();
  if(!quotes || quotes.length===0){
    quotes = [
      { id: uid(), text: "Design systems are opinions embedded in code.", author: "—", tags:["design","dev"], fav:true, created:Date.now()-1000000, updated:Date.now()-1000000 },
      { id: uid(), text: "Iterate fast. Ship often. Learn faster.", author: "—", tags:["process","dev"], fav:false, created:Date.now()-500000, updated:Date.now()-500000 }
    ];
    saveToStorage();
  }
  render();