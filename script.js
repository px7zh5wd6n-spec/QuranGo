// Render bundled JSON data, search filter, and theme toggle
function getChaptersFromData(){
  const data = window.QuranData || {};
  if (data.quran && Array.isArray(data.quran.chapters)){
    return data.quran.chapters.map(c => ({number: c.surah_number, name: c.name_en || c.name_ar || String(c.surah_number)}));
  }
  // fallback: collect numeric keys
  const keys = Object.keys(data).filter(k => /^\d{1,3}$/.test(k) || /^\d{3}$/.test(k)).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
  const chapters = keys.map(k => {
    const d = data[k];
    if (!d) return {number: k, name: k};
    return {number: d.surah_number || (d.chapters && d.chapters[0] && d.chapters[0].surah_number) || Number(k), name: d.name_en || d.name_ar || String(k)};
  });
  return chapters;
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const themeToggle = document.getElementById('themeToggle');
  const listEl = document.getElementById('items');
  const placeholder = document.getElementById('placeholder');

  function renderList(chapters){
    listEl.innerHTML = '';
    if (!chapters || chapters.length === 0){
      placeholder.style.display = '';
      return;
    }
    placeholder.style.display = 'none';
    chapters.forEach(ch => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      li.dataset.surah = String(ch.number);
      li.innerHTML = `<strong>${ch.number}.</strong> <span class="surah-name">${escapeHtml(ch.name)}</span>`;
      listEl.appendChild(li);
    });
  }

  // initial render from bundled data
  try{
    const chapters = getChaptersFromData();
    renderList(chapters);
  }catch(e){
    console.error('Failed to render bundled data', e);
    placeholder.textContent = 'Failed to load data.';
    placeholder.style.display = '';
  }

  // helper to escape any HTML in names
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

  // viewer elements
  const viewer = document.getElementById('viewer');
  const versesList = document.getElementById('versesList');
  const surahTitle = document.getElementById('surahTitle');
  const closeViewer = document.getElementById('closeViewer');
  const nextAya = document.getElementById('nextAya');
  const prevAya = document.getElementById('prevAya');
  let currentVerseIndex = 0;

  function openViewer(){ viewer.setAttribute('aria-hidden','false'); viewer.scrollIntoView({behavior:'smooth'}); }
  function closeViewerNow(){ viewer.setAttribute('aria-hidden','true'); versesList.innerHTML = ''; }

  function renderVersesFromSurahNum(num){
    const key = String(num).padStart(3,'0');
    const data = (window.QuranData && window.QuranData[key]) || null;
    versesList.innerHTML = '';
    currentVerseIndex = 0;
    if (!data || !Array.isArray(data.verses)){
      versesList.innerHTML = '<li>No verses found for this surah.</li>';
      openViewer();
      return;
    }
    surahTitle.textContent = `${num}. ${data.name_en || data.name_ar || ''}`;
    data.verses.forEach(v => {
      const li = document.createElement('li');
      const a = document.createElement('p'); a.className='arabic'; a.textContent = v.text_ar || '';
      const t = document.createElement('p'); t.className='trans'; t.textContent = v.text_en_pickthall || v.text_en || '';
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `(${v.verse_key || (num+":"+v.ayah)})`;
      li.appendChild(meta);
      li.appendChild(a);
      li.appendChild(t);
      versesList.appendChild(li);
    });
    openViewer();
  }

  // delegation: open on click of list items
  listEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || !listEl.contains(li)) return;
    const surah = li.dataset.surah;
    if (!surah) return;
    renderVersesFromSurahNum(Number(surah));
  });

  // keyboard support
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      const li = e.target.closest('li');
      if (!li) return;
      e.preventDefault();
      renderVersesFromSurahNum(Number(li.dataset.surah));
    }
  });

  closeViewer.addEventListener('click', closeViewerNow);
  nextAya.addEventListener('click', () => {
    const items = versesList.querySelectorAll('li');
    if (items.length===0) return;
    currentVerseIndex = Math.min(items.length-1, currentVerseIndex+1);
    items[currentVerseIndex].scrollIntoView({behavior:'smooth', block:'center'});
  });
  prevAya.addEventListener('click', () => {
    const items = versesList.querySelectorAll('li');
    if (items.length===0) return;
    currentVerseIndex = Math.max(0, currentVerseIndex-1);
    items[currentVerseIndex].scrollIntoView({behavior:'smooth', block:'center'});
  });

  function filter(q){
    q = q.trim().toLowerCase();
    Array.from(listEl.querySelectorAll('li')).forEach(li => {
      const match = li.textContent.toLowerCase().includes(q);
      li.style.display = match ? '' : 'none';
    });
  }

  search.addEventListener('input', (e) => filter(e.target.value));

  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const pressed = document.documentElement.classList.contains('dark');
    themeToggle.setAttribute('aria-pressed', pressed);
  });
});