(function () {
  const tg = window.Telegram?.WebApp;
  try { tg?.ready(); } catch {}

  const viewFolders = document.getElementById("viewFolders");
  const viewSets = document.getElementById("viewSets");
  const viewSetMenu = document.getElementById("viewSetMenu");
  const viewStudy = document.getElementById("viewStudy");

  const foldersList = document.getElementById("foldersList");
  const setsTitle = document.getElementById("setsTitle");
  const setsList = document.getElementById("setsList");
  const btnBackToFolders = document.getElementById("btnBackToFolders");

  const setMenuTitle = document.getElementById("setMenuTitle");
  const setMenuInfo = document.getElementById("setMenuInfo");
  const setSearchInput = document.getElementById("setSearchInput");
  const setWordsList = document.getElementById("setWordsList");
  const btnSetShowAll = document.getElementById("btnSetShowAll");
  const btnSetHideAll = document.getElementById("btnSetHideAll");
  const btnModeKb = document.getElementById("btnModeKb");
  const btnModeRu = document.getElementById("btnModeRu");
  const btnBackToSets2 = document.getElementById("btnBackToSets2");

  const elCard = document.getElementById("card");
  const elWord = document.getElementById("word");
  const elTrans = document.getElementById("trans");
  const elCounter = document.getElementById("counter");
  const elMode = document.getElementById("mode");
  const btnExample = document.getElementById("btnExample");
  const exampleBox = document.getElementById("exampleBox");
  const btnYes = document.getElementById("btnYes");
  const btnNo = document.getElementById("btnNo");
  const btnBackToSetMenu = document.getElementById("btnBackToSetMenu");

  // -------------------- persistent hidden words per set --------------------
  const HIDDEN_KEY = "fc_hidden_by_set_v4";
  function loadHiddenMap() { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}"); } catch { return {}; } }
  function saveHiddenMap(map) { localStorage.setItem(HIDDEN_KEY, JSON.stringify(map)); }
  function keyOf(folder, setNo) { return `${folder}:${setNo}`; }
  function getHiddenSet(folder, setNo) {
    const map = loadHiddenMap();
    const arr = Array.isArray(map[keyOf(folder, setNo)]) ? map[keyOf(folder, setNo)] : [];
    return new Set(arr.map(Number));
  }
  function setHiddenSet(folder, setNo, setOfIds) {
    const map = loadHiddenMap();
    map[keyOf(folder, setNo)] = Array.from(setOfIds);
    saveHiddenMap(map);
  }

  // -------------------- loading words --------------------
  const CACHE_KEY = window.WORDS_CACHE_KEY || "fc_words_cache_v4";
  function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; } }
  function saveCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} }

  function normalizeToCsvUrl(url) {
    const u = (url || "").trim();
    if (!u) return "";
    if (u.includes("output=csv") || u.includes("out:csv") || u.includes("format=csv")) return u;
    const m = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) return u;
    const id = m[1];
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
  }

  async function loadWords() {
    const cached = loadCache();
    if (Array.isArray(cached) && cached.length) return cached;

    const sheetUrl = (window.WORDS_SHEET_URL || "").trim();
    const csvUrl = normalizeToCsvUrl(sheetUrl);

    if (csvUrl && csvUrl.startsWith("http")) {
      try {
        const words = await loadWordsFromCsv(csvUrl);
        if (Array.isArray(words) && words.length) { saveCache(words); return words; }
      } catch (e) {}
    }
    return Array.isArray(window.WORDS_FALLBACK) ? window.WORDS_FALLBACK : [];
  }

  async function loadWordsFromCsv(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("CSV load failed: " + res.status);
    const text = await res.text();
    return parseCsv(text);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { row.push(cur); cur = ""; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (ch === '\r') {}
        else cur += ch;
      }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    if (!rows.length) return [];

    const headers = rows[0].map(h => (h || "").trim().toLowerCase());
    const idx = (name) => headers.findIndex(h => h === name);

    const need = ["id","folder","set","word","trans","example"];
    if (need.some(n => idx(n) === -1)) return [];

    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols || cols.every(c => !String(c||"").trim())) continue;

      const obj = {
        id: Number(cols[idx("id")] || 0),
        folder: String(cols[idx("folder")] || "").trim(),
        set: Number(cols[idx("set")] || 0),
        word: String(cols[idx("word")] || "").trim(),   // КБ
        trans: String(cols[idx("trans")] || "").trim(), // RU
        example: String(cols[idx("example")] || "").trim(),
      };
      if (!obj.id || !obj.folder || !obj.set || !obj.word || !obj.trans) continue;
      out.push(obj);
    }
    return out;
  }

  // -------------------- helpers --------------------
  function showView(which) {
    [viewFolders, viewSets, viewSetMenu, viewStudy].forEach(v => v.classList.add("hidden"));
    which.classList.remove("hidden");
  }
  function uniq(arr) { return Array.from(new Set(arr)); }
  function sortNatural(a, b) { return String(a).localeCompare(String(b), "ru", { numeric: true, sensitivity: "base" }); }
  function foldersFrom(words) { return uniq(words.map(w => w.folder)).sort(sortNatural); }
  function setsFrom(words, folder) { return uniq(words.filter(w => w.folder === folder).map(w => Number(w.set))).sort((a,b)=>a-b); }
  function wordsFor(words, folder, setNo) { return words.filter(w => w.folder === folder && Number(w.set) === Number(setNo)); }
  function escapeHtml(s) {
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function folderTitle(code) {
    const map = window.FOLDER_TITLES || {};
    return map[code] || code;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // -------------------- state --------------------
  let DATA = [];
  let currentFolder = "";
  let currentSet = 1;

  // режим: KB_FRONT = учим КБ (на лицевой КБ), RU_FRONT = учим RU (на лицевой RU)
  let studyMode = "KB_FRONT";

  // queues
  let mainQueue = [];
  let repeatQueue = [];
  let round = "main";
  let totalPlanned = 0;

  // flip
  let flipped = false;

  function setRoundIfNeeded() { if (round === "main" && mainQueue.length === 0) round = "repeat"; }
  function currentQueue() { return round === "main" ? mainQueue : repeatQueue; }

  // -------------------- folders / sets --------------------
  function renderFolders() {
    const folders = foldersFrom(DATA);
    foldersList.innerHTML = folders
      .map(f => `<button class="btn" data-folder="${escapeHtml(f)}">${escapeHtml(folderTitle(f))}</button>`)
      .join("");

    foldersList.querySelectorAll("button[data-folder]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentFolder = btn.getAttribute("data-folder");
        renderSets(currentFolder);
        showView(viewSets);
      });
    });

    showView(viewFolders);
  }

  function renderSets(folder) {
    setsTitle.textContent = `Сеты: ${folderTitle(folder)}`;
    const sets = setsFrom(DATA, folder);

    setsList.innerHTML = sets.map(s => {
      const all = wordsFor(DATA, folder, s);
      const hidden = getHiddenSet(folder, s);
      const active = all.filter(w => !hidden.has(w.id));
      return `
        <button class="btn" data-open-set="${s}">
          Сет ${s}<br/>
          <span style="opacity:.75;font-weight:800;font-size:12px;">${active.length}/${all.length} в сессии</span>
        </button>
      `;
    }).join("");

    setsList.querySelectorAll("button[data-open-set]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSet = Number(btn.getAttribute("data-open-set"));
        openSetMenu();
      });
    });
  }

  btnBackToFolders.addEventListener("click", () => showView(viewFolders));
  btnBackToSets2.addEventListener("click", () => {
    renderSets(currentFolder);
    showView(viewSets);
    elCounter.textContent = "—";
    elMode.textContent = "—";
  });

  // -------------------- set menu (modes + list with hide) --------------------
  let menuHidden = new Set();

  function openSetMenu() {
    menuHidden = getHiddenSet(currentFolder, currentSet);

    const all = wordsFor(DATA, currentFolder, currentSet);
    const active = all.filter(w => !menuHidden.has(w.id));

    setMenuTitle.textContent = `${folderTitle(currentFolder)} • Сет ${currentSet}`;
    setMenuInfo.textContent = `Слов в сете: ${all.length}. В сессии: ${active.length}. (Скрытые можно вернуть галочками ниже)`;

    setSearchInput.value = "";
    renderSetWordsList();
    showView(viewSetMenu);
  }

  function renderSetWordsList() {
    const q = (setSearchInput.value || "").trim().toLowerCase();
    const all = wordsFor(DATA, currentFolder, currentSet);
    const filtered = q ? all.filter(w => (w.word + " " + w.trans).toLowerCase().includes(q)) : all;

    setWordsList.innerHTML = filtered.map(w => {
      const checked = !menuHidden.has(w.id);
      return `
        <div class="item" data-id="${w.id}">
          <input class="checkbox" type="checkbox" ${checked ? "checked" : ""} />
          <div>
            <div class="w">${escapeHtml(w.word)}</div>
            <div class="t">${escapeHtml(w.trans)}</div>
          </div>
        </div>
      `;
    }).join("");

    setWordsList.querySelectorAll(".item").forEach(row => {
      const id = Number(row.getAttribute("data-id"));
      const cb = row.querySelector("input[type=checkbox]");
      cb.addEventListener("change", () => {
        if (cb.checked) menuHidden.delete(id);
        else menuHidden.add(id);
        // persist immediately
        setHiddenSet(currentFolder, currentSet, menuHidden);
        // update info
        const all2 = wordsFor(DATA, currentFolder, currentSet);
        const active2 = all2.filter(w => !menuHidden.has(w.id));
        setMenuInfo.textContent = `Слов в сете: ${all2.length}. В сессии: ${active2.length}. (Скрытые можно вернуть галочками ниже)`;
      });
    });
  }

  setSearchInput.addEventListener("input", renderSetWordsList);
  btnSetShowAll.addEventListener("click", () => {
    menuHidden = new Set();
    setHiddenSet(currentFolder, currentSet, menuHidden);
    renderSetWordsList();
    const all = wordsFor(DATA, currentFolder, currentSet);
    setMenuInfo.textContent = `Слов в сете: ${all.length}. В сессии: ${all.length}. (Скрытые можно вернуть галочками ниже)`;
  });
  btnSetHideAll.addEventListener("click", () => {
    menuHidden = new Set(wordsFor(DATA, currentFolder, currentSet).map(w => w.id));
    setHiddenSet(currentFolder, currentSet, menuHidden);
    renderSetWordsList();
    const all = wordsFor(DATA, currentFolder, currentSet);
    setMenuInfo.textContent = `Слов в сете: ${all.length}. В сессии: 0. (Скрытые можно вернуть галочками ниже)`;
  });

  btnModeKb.addEventListener("click", () => { studyMode = "KB_FRONT"; startSession(); });
  btnModeRu.addEventListener("click", () => { studyMode = "RU_FRONT"; startSession(); });

  // -------------------- study session --------------------
  function startSession() {
    const all = wordsFor(DATA, currentFolder, currentSet);
    const hidden = getHiddenSet(currentFolder, currentSet);
    const active = all.filter(w => !hidden.has(w.id));

    mainQueue = shuffle(active.slice()); // ВСЕГДА перемешиваем
    repeatQueue = [];
    round = "main";
    totalPlanned = active.length;
    flipped = false;

    showView(viewStudy);
    renderCard();
  }

  function setFace(item) {
    // Лицевая: один язык. Оборот: второй язык.
    const front = (studyMode === "KB_FRONT") ? item.word : item.trans;
    const back  = (studyMode === "KB_FRONT") ? item.trans : item.word;

    elWord.textContent = front;

    if (flipped) {
      elTrans.textContent = back;
      elTrans.classList.remove("hidden");
    } else {
      elTrans.textContent = "";
      elTrans.classList.add("hidden");
    }
  }

  function renderCard() {
    setRoundIfNeeded();
    const q = currentQueue();

    // reset example UI
    exampleBox.classList.add("hidden");
    btnExample.textContent = "Показать пример";

    if (totalPlanned === 0) {
      elWord.textContent = "Пусто 🤷‍♂️";
      elTrans.classList.remove("hidden");
      elTrans.textContent = "В этом сете все слова скрыты. Верни нужные в меню сета.";
      elCounter.textContent = "0/0";
      elMode.textContent = "—";
      btnExample.classList.add("hidden");
      return;
    }
    btnExample.classList.remove("hidden");

    if (q.length === 0) {
      elWord.textContent = "Готово ✅";
      elTrans.classList.remove("hidden");
      elTrans.textContent = "Сессия завершена. Можно вернуться к меню сета или выбрать другой сет.";
      elCounter.textContent = `${totalPlanned}/${totalPlanned}`;
      elMode.textContent = "завершено";
      btnExample.classList.add("hidden");
      return;
    }

    const item = q[0];
    setFace(item);

    const done = totalPlanned - (mainQueue.length + (round === "repeat" ? repeatQueue.length : 0));
    elCounter.textContent = `${done}/${totalPlanned}`;
    elMode.textContent = `${round === "main" ? "основной круг" : "повтор"} • ${studyMode === "KB_FRONT" ? "лицевая: КБ" : "лицевая: RU"}`;

    const ex = (item.example || "").trim();
    if (ex) { btnExample.disabled = false; exampleBox.textContent = ex; }
    else { btnExample.disabled = true; exampleBox.textContent = "Примера нет для этого слова."; }
  }

  // flip by tap
  elCard.addEventListener("click", (e) => {
    // чтобы клик по кнопке примера не переворачивал карточку
    const t = e.target;
    if (t && (t.id === "btnExample")) return;
    if (t && t.closest && t.closest("#btnExample")) return;

    setRoundIfNeeded();
    const q = currentQueue();
    if (!q.length) return;

    flipped = !flipped;
    // просто обновим отображение текущего слова
    setFace(q[0]);
  });

  btnExample.addEventListener("click", () => {
    const isHidden = exampleBox.classList.contains("hidden");
    if (isHidden) { exampleBox.classList.remove("hidden"); btnExample.textContent = "Скрыть пример"; }
    else { exampleBox.classList.add("hidden"); btnExample.textContent = "Показать пример"; }
  });

  function animateSwipe(dir) {
    elCard.style.transition = "transform 0.18s ease, opacity 0.18s ease";
    elCard.style.transform = `translateX(${dir * 180}px) rotate(${dir * 6}deg)`;
    elCard.style.opacity = "0.2";
    setTimeout(() => {
      elCard.style.transition = "none";
      elCard.style.transform = "translateX(0) rotate(0)";
      elCard.style.opacity = "1";
      renderCard();
    }, 190);
  }

  function swipeDecision(known) {
    setRoundIfNeeded();
    const q = currentQueue();
    if (!q.length) return;

    // свайп можно делать БЕЗ переворота — просто фиксируем решение
    const item = q.shift();
    if (!known) repeatQueue.push(item);

    // после свайпа всегда возвращаем карточку на лицевую сторону
    flipped = false;
    elTrans.classList.add("hidden");
    elTrans.textContent = "";

    animateSwipe(known ? 1 : -1);
  }

  btnYes.addEventListener("click", () => swipeDecision(true));
  btnNo.addEventListener("click", () => swipeDecision(false));

  // swipe gestures
  let startX = 0, startY = 0, dragging = false;

  elCard.addEventListener("touchstart", (e) => {
    if (!e.touches?.[0]) return;
    dragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    elCard.style.transition = "none";
  }, { passive: true });

  elCard.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches?.[0]) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    const rot = Math.max(-10, Math.min(10, dx / 18));
    elCard.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
  }, { passive: true });

  elCard.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    const endX = (e.changedTouches?.[0]?.clientX ?? startX);
    const dx = endX - startX;
    const threshold = 70;
    if (dx > threshold) swipeDecision(true);
    else if (dx < -threshold) swipeDecision(false);
    else {
      elCard.style.transition = "transform 0.18s ease";
      elCard.style.transform = "translateX(0) rotate(0)";
    }
  });

  // navigation
  btnBackToSetMenu.addEventListener("click", () => {
    openSetMenu();
    elCounter.textContent = "—";
    elMode.textContent = "—";
    flipped = false;
  });

  // -------------------- init --------------------
  (async () => {
    DATA = await loadWords();
    if (!Array.isArray(DATA) || !DATA.length) {
      foldersList.innerHTML = "<div style='opacity:.8'>Нет данных. Проверь доступ к таблице и заголовки: id, folder, set, word, trans, example</div>";
      showView(viewFolders);
      return;
    }
    renderFolders();
  })();
})();
