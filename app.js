(function () {
  const tg = window.Telegram?.WebApp;
  try { tg?.ready(); } catch {}

  // Views
  const viewDicts = document.getElementById("viewDicts");
  const viewSections = document.getElementById("viewSections");
  const viewSets = document.getElementById("viewSets");
  const viewSetMenu = document.getElementById("viewSetMenu");
  const viewGlobalTestMenu = document.getElementById("viewGlobalTestMenu");
  const viewTest = document.getElementById("viewTest");
  const viewStudy = document.getElementById("viewStudy");

  // Dicts
  const dictsList = document.getElementById("dictsList");
  const btnGlobalTest = document.getElementById("btnGlobalTest");

  // Sections
  const sectionsTitle = document.getElementById("sectionsTitle");
  const sectionsList = document.getElementById("sectionsList");
  const btnBackToDicts = document.getElementById("btnBackToDicts");

  // Sets
  const setsTitle = document.getElementById("setsTitle");
  const setsList = document.getElementById("setsList");
  const btnBackToSections = document.getElementById("btnBackToSections");

  // Set menu
  const setMenuTitle = document.getElementById("setMenuTitle");
  const setMenuInfo = document.getElementById("setMenuInfo");
  const btnModeKb = document.getElementById("btnModeKb");
  const btnModeRu = document.getElementById("btnModeRu");
  const setSearchInput = document.getElementById("setSearchInput");
  const btnSetShowAll = document.getElementById("btnSetShowAll");
  const btnSetHideAll = document.getElementById("btnSetHideAll");
  const setWordsList = document.getElementById("setWordsList");
  const btnBackToSets2 = document.getElementById("btnBackToSets2");

  // Study
  const card = document.getElementById("card");
  const wordEl = document.getElementById("word");
  const transEl = document.getElementById("trans");
  const btnExample = document.getElementById("btnExample");
  const exampleBox = document.getElementById("exampleBox");
  const btnYes = document.getElementById("btnYes");
  const btnNo = document.getElementById("btnNo");
  const btnBackToSetMenu = document.getElementById("btnBackToSetMenu");

  // Top meta
  const counter = document.getElementById("counter");
  const modeEl = document.getElementById("mode");

  // Global test menu
  const globalTestInfo = document.getElementById("globalTestInfo");
  const globalDictSelect = document.getElementById("globalDictSelect");
  const btnGlobalModeKb = document.getElementById("btnGlobalModeKb");
  const btnGlobalModeRu = document.getElementById("btnGlobalModeRu");
  const btnGlobalTestBack = document.getElementById("btnGlobalTestBack");

  // Test view
  const testTitle = document.getElementById("testTitle");
  const testProgress = document.getElementById("testProgress");
  const testQuestion = document.getElementById("testQuestion");
  const testOptions = document.getElementById("testOptions");
  const btnTestExit = document.getElementById("btnTestExit");
  const btnTestNext = document.getElementById("btnTestNext");

  // ---------- Storage: hidden words (affects ONLY STUDY sessions)
  const HIDDEN_KEY = "fc_hidden_by_set_v7";
  function loadHiddenMap() { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}"); } catch { return {}; } }
  function saveHiddenMap(map) { localStorage.setItem(HIDDEN_KEY, JSON.stringify(map)); }
  function keyOf(d, s, setNo) { return `${d}:${s}:${setNo}`; }
  function getHiddenSet(d, s, setNo) {
    const map = loadHiddenMap();
    const arr = Array.isArray(map[keyOf(d, s, setNo)]) ? map[keyOf(d, s, setNo)] : [];
    return new Set(arr.map(Number));
  }
  function setHiddenSet(d, s, setNo, setOfIds) {
    const map = loadHiddenMap();
    map[keyOf(d, s, setNo)] = Array.from(setOfIds);
    saveHiddenMap(map);
  }

  // ---------- Cache
  const CACHE_KEY = window.WORDS_CACHE_KEY || "fc_words_cache_v3";
  function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; } }
  function saveCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {} }

  // ---------- Sheets URL -> CSV
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

  // Expected headers: id, dict, section, set, word, trans, example
  // Backward compatible: folder -> section, dict defaults to "Словарь"
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

    const idI = idx("id");
    const dictI = idx("dict");
    const sectionI = idx("section");
    const folderI = idx("folder");
    const setI = idx("set");
    const wordI = idx("word");
    const transI = idx("trans");
    const exI = idx("example");

    if (idI === -1 || setI === -1 || wordI === -1 || transI === -1) return [];

    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols || cols.every(c => !String(c||"").trim())) continue;

      const dict = dictI !== -1 ? String(cols[dictI] || "").trim() : "Словарь";
      const section = sectionI !== -1 ? String(cols[sectionI] || "").trim()
                    : (folderI !== -1 ? String(cols[folderI] || "").trim() : "Раздел");

      const obj = {
        id: Number(cols[idI] || 0),
        dict: dict || "Словарь",
        section: section || "Раздел",
        set: Number(cols[setI] || 0),
        word: String(cols[wordI] || "").trim(),
        trans: String(cols[transI] || "").trim(),
        example: exI !== -1 ? String(cols[exI] || "").trim() : "",
      };
      if (!obj.id || !obj.set || !obj.word || !obj.trans) continue;
      out.push(obj);
    }
    return out;
  }

  // ---------- Helpers
  function showView(which) {
    [viewDicts, viewSections, viewSets, viewSetMenu, viewGlobalTestMenu, viewTest, viewStudy].forEach(v => v.classList.add("hidden"));
    which.classList.remove("hidden");
  }
  function uniq(arr) { return Array.from(new Set(arr)); }
  function sortNatural(a, b) { return String(a).localeCompare(String(b), "ru", { numeric: true, sensitivity: "base" }); }
  function escapeHtml(s) {
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  // Split "a, b; c, d" into blocks and pills
  // Major separator: semicolon (;). Inside each block: comma (,). Also supports slash (/) as an optional separator.
  function parseMulti(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];
    // Major blocks by semicolon or newline
    const blocks = raw
      .split(/\s*[;；]\s*|\n+/g)
      .map(s => s.trim())
      .filter(Boolean);

    const splitPills = (s) => {
      // First split by commas
      let parts = s.split(/\s*,\s*/g);

      // Then (optionally) split parts by slashes if it looks like alternatives
      const out = [];
      for (const p of parts) {
        const pp = String(p || "").trim();
        if (!pp) continue;
        // if there is a slash, split, but keep very short combos like "и/или" together
        if (pp.includes("/") && !/^[^\s]{1,4}\/[^\s]{1,4}$/.test(pp)) {
          const bySlash = pp.split(/\s*\/\s*/g).map(x => x.trim()).filter(Boolean);
          out.push(...bySlash);
        } else {
          out.push(pp);
        }
      }
      return out;
    };

    return blocks.map(b => splitPills(b)).filter(arr => arr.length);
  }

  function renderMultiHtml(text) {
    const groups = parseMulti(text);
    if (!groups.length) return "";
    // If only one group with one pill — render as simple text (keeps current look)
    if (groups.length === 1 && groups[0].length <= 1) return escapeHtml(groups[0][0] || "");
    return `
      <div class="multi">
        ${groups.map((pills, i) => `
          <div class="multiRow">
            <span class="multiNum">${i + 1}</span>
            <div class="multiPills">
              ${pills.map(p => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function setRichOrText(el, text) {
    const html = renderMultiHtml(text);
    if (html) el.innerHTML = html;
    else el.textContent = "";
  }
  function dictTitle(code) { return (window.DICT_TITLES || {})[code] || code; }
  function sectionTitle(code) { return (window.SECTION_TITLES || {})[code] || code; }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Data helpers
  function dictsFrom(words) { return uniq(words.map(w => w.dict)).sort(sortNatural); }
  function sectionsFrom(words, dict) { return uniq(words.filter(w => w.dict === dict).map(w => w.section)).sort(sortNatural); }
  function setsFrom(words, dict, section) {
    return uniq(words.filter(w => w.dict === dict && w.section === section).map(w => Number(w.set))).sort((a,b)=>a-b);
  }
  function wordsForSet(words, dict, section, setNo) {
    return words.filter(w => w.dict === dict && w.section === section && Number(w.set) === Number(setNo));
  }

  // ---------- App state
  let DATA = [];
  let currentDict = "";
  let currentSection = "";
  let currentSet = 1;

  // Study mode: kb => front word, ru => front trans
  let currentStudyMode = "kb";

  // Study queues
  let mainQueue = [];
  let repeatQueue = [];
  let round = "main";
  let totalPlanned = 0;

  function setRoundIfNeeded() { if (round === "main" && mainQueue.length === 0) round = "repeat"; }
  function currentQueue() { return round === "main" ? mainQueue : repeatQueue; }

  // ---------- Render dicts / sections / sets
  function renderDicts() {
    const dicts = dictsFrom(DATA);
    dictsList.innerHTML = dicts.map(d => `<button class="btn" data-dict="${escapeHtml(d)}">${escapeHtml(dictTitle(d))}</button>`).join("");
    dictsList.querySelectorAll("button[data-dict]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentDict = btn.getAttribute("data-dict");
        renderSections(currentDict);
        showView(viewSections);
      });
    });
    counter.textContent = "—";
    modeEl.textContent = "—";
    showView(viewDicts);
  }

  function renderSections(dict) {
    sectionsTitle.textContent = `Разделы: ${dictTitle(dict)}`;
    const sections = sectionsFrom(DATA, dict);
    sectionsList.innerHTML = sections.map(s => `<button class="btn" data-section="${escapeHtml(s)}">${escapeHtml(sectionTitle(s))}</button>`).join("");
    sectionsList.querySelectorAll("button[data-section]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSection = btn.getAttribute("data-section");
        renderSets(currentDict, currentSection);
        showView(viewSets);
      });
    });
  }

  function renderSets(dict, section) {
    setsTitle.textContent = `Сеты: ${sectionTitle(section)}`;
    const sets = setsFrom(DATA, dict, section);
    setsList.innerHTML = sets.map(s => {
      const all = wordsForSet(DATA, dict, section, s);
      const hidden = getHiddenSet(dict, section, s);
      const active = all.filter(w => !hidden.has(w.id));
      return `
        <button class="btn" data-set="${s}">
          Сет ${s}
          <div class="smallNote" style="margin-top:6px;">${active.length}/${all.length} слов в сессии</div>
        </button>
      `;
    }).join("");

    setsList.querySelectorAll("button[data-set]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSet = Number(btn.getAttribute("data-set"));
        openSetMenu();
      });
    });
  }

  btnBackToDicts.addEventListener("click", () => showView(viewDicts));
  btnBackToSections.addEventListener("click", () => showView(viewSections));

  // ---------- Set menu / hiding words
  let menuHidden = new Set();

  function openSetMenu() {
    menuHidden = getHiddenSet(currentDict, currentSection, currentSet);

    const all = wordsForSet(DATA, currentDict, currentSection, currentSet);
    const active = all.filter(w => !menuHidden.has(w.id));
    setMenuTitle.textContent = `${dictTitle(currentDict)} • ${sectionTitle(currentSection)} • Сет ${currentSet}`;
    setMenuInfo.textContent = `Слов в сете: ${all.length} • В сессии: ${active.length}`;

    setSearchInput.value = "";
    renderSetWordsList();
    showView(viewSetMenu);
  }

  function renderSetWordsList() {
    const q = (setSearchInput.value || "").trim().toLowerCase();
    const all = wordsForSet(DATA, currentDict, currentSection, currentSet);
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
        setHiddenSet(currentDict, currentSection, currentSet, menuHidden);

        const all2 = wordsForSet(DATA, currentDict, currentSection, currentSet);
        const active2 = all2.filter(w => !menuHidden.has(w.id));
        setMenuInfo.textContent = `Слов в сете: ${all2.length} • В сессии: ${active2.length}`;
      });
    });
  }

  setSearchInput.addEventListener("input", renderSetWordsList);

  btnSetShowAll.addEventListener("click", () => {
    menuHidden = new Set();
    setHiddenSet(currentDict, currentSection, currentSet, menuHidden);
    renderSetWordsList();
    const all = wordsForSet(DATA, currentDict, currentSection, currentSet);
    setMenuInfo.textContent = `Слов в сете: ${all.length} • В сессии: ${all.length}`;
  });

  btnSetHideAll.addEventListener("click", () => {
    const all = wordsForSet(DATA, currentDict, currentSection, currentSet);
    menuHidden = new Set(all.map(w => w.id));
    setHiddenSet(currentDict, currentSection, currentSet, menuHidden);
    renderSetWordsList();
    setMenuInfo.textContent = `Слов в сете: ${all.length} • В сессии: 0`;
  });

  btnBackToSets2.addEventListener("click", () => {
    renderSets(currentDict, currentSection);
    showView(viewSets);
  });

  btnModeKb.addEventListener("click", () => { currentStudyMode = "kb"; startStudySession(); });
  btnModeRu.addEventListener("click", () => { currentStudyMode = "ru"; startStudySession(); });

  // ---------- Study session
  function startStudySession() {
    const all = wordsForSet(DATA, currentDict, currentSection, currentSet);
    const hidden = getHiddenSet(currentDict, currentSection, currentSet);
    const active = all.filter(w => !hidden.has(w.id));

    mainQueue = shuffle(active.slice());
    repeatQueue = [];
    round = "main";
    totalPlanned = active.length;

    transEl.classList.add("hidden");
    exampleBox.classList.add("hidden");
    showView(viewStudy);
    renderStudyCard();
  }

  function renderStudyCard() {
    setRoundIfNeeded();
    const q = currentQueue();

    // reset front state
    transEl.classList.add("hidden");
    exampleBox.classList.add("hidden");

    if (totalPlanned === 0) {
      wordEl.textContent = "Пусто 🤷‍♂️";
      transEl.textContent = "В этом сете все слова скрыты. Верни их в меню сета.";
      transEl.classList.remove("hidden");
      btnExample.classList.add("hidden");
      counter.textContent = "0/0";
      modeEl.textContent = "—";
      return;
    } else {
      btnExample.classList.remove("hidden");
    }

    if (q.length === 0) {
      wordEl.textContent = "Готово ✅";
      transEl.textContent = "Сессия завершена.";
      transEl.classList.remove("hidden");
      exampleBox.classList.add("hidden");
      btnExample.classList.add("hidden");
      counter.textContent = `${totalPlanned}/${totalPlanned}`;
      modeEl.textContent = "завершено";
      return;
    }

    const item = q[0];
    const front = currentStudyMode === "kb" ? item.word : item.trans;
    const back = currentStudyMode === "kb" ? item.trans : item.word;

    setRichOrText(wordEl, front);
    setRichOrText(transEl, back);

    const done = totalPlanned - q.length - (round === "repeat" ? 0 : 0);
    counter.textContent = `${Math.max(0, totalPlanned - (mainQueue.length + (round === "repeat" ? repeatQueue.length : 0)))}/${totalPlanned}`;
    modeEl.textContent = (round === "main" ? "основной круг" : "повтор") + " • " + (currentStudyMode === "kb" ? "КБ → RU" : "RU → КБ");
  }

  // Tap: flip (show/hide translation)
  card.addEventListener("click", (e) => {
    // don't treat clicking example button as flip
    if (e.target && (e.target.id === "btnExample")) return;
    transEl.classList.toggle("hidden");
  });

  // Example button
  btnExample.addEventListener("click", () => {
    const item = currentQueue()[0];
    if (!item) return;
    const ex = (item.example || "").trim();
    if (!ex) {
      exampleBox.textContent = "Пример пока не добавлен.";
    } else {
      setRichOrText(exampleBox, ex);
    }
    exampleBox.classList.toggle("hidden");
  });

  function swipeDecision(known) {
    setRoundIfNeeded();
    const q = currentQueue();
    if (!q.length) return;

    // close back & example
    transEl.classList.add("hidden");
    exampleBox.classList.add("hidden");

    const item = q.shift();
    if (!known) repeatQueue.push(item);

    // When main is empty, switch to repeat
    if (round === "main" && mainQueue.length === 0) round = "repeat";

    renderStudyCard();
  }

  btnYes.addEventListener("click", () => swipeDecision(true));
  btnNo.addEventListener("click", () => swipeDecision(false));

  // Swipe gestures
  let startX = 0, startY = 0, dragging = false;

  card.addEventListener("touchstart", (e) => {
    if (!e.touches?.[0]) return;
    dragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  card.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches?.[0]) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
  }, { passive: true });

  card.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    const endX = (e.changedTouches?.[0]?.clientX ?? startX);
    const dx = endX - startX;
    const threshold = 70;

    if (dx > threshold) swipeDecision(true);
    else if (dx < -threshold) swipeDecision(false);
  });

  btnBackToSetMenu.addEventListener("click", openSetMenu);

  // ---------- Global test (only global, with dict filter)
  let testMode = "kb"; // kb: Q=word, A=trans; ru: Q=trans, A=word
  let testItems = [];
  let testIndex = 0;
  let testCorrect = 0;
  let testLocked = false;

  function openGlobalTestMenu() {
    const dicts = dictsFrom(DATA);
    globalDictSelect.innerHTML = [
      `<option value="__all__">Все словари</option>`,
      ...dicts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(dictTitle(d))}</option>`)
    ].join("");
    globalDictSelect.value = "__all__";
    updateGlobalTestInfo();
    globalDictSelect.onchange = updateGlobalTestInfo;

    showView(viewGlobalTestMenu);
  }

  function updateGlobalTestInfo() {
    const val = globalDictSelect.value || "__all__";
    const pool = (val === "__all__") ? DATA : DATA.filter(w => w.dict === val);
    const scopeName = (val === "__all__") ? "Все словари" : dictTitle(val);
    globalTestInfo.textContent = `Источник: ${scopeName} • Слов: ${pool.length}`;
  }

  btnGlobalTest.addEventListener("click", openGlobalTestMenu);
  btnGlobalTestBack.addEventListener("click", () => showView(viewDicts));
  btnGlobalModeKb.addEventListener("click", () => { testMode = "kb"; startTest(); });
  btnGlobalModeRu.addEventListener("click", () => { testMode = "ru"; startTest(); });

  function startTest() {
    const val = globalDictSelect.value || "__all__";
    const pool = (val === "__all__") ? DATA : DATA.filter(w => w.dict === val);

    testItems = shuffle(pool.slice().slice(0,50); // include hidden always
    testIndex = 0;
    testCorrect = 0;
    testLocked = false;
    btnTestNext.classList.add("hidden");
    showView(viewTest);
    renderTestQuestion();
  }

  function pickOptions(correctItem) {
    const correct = testMode === "kb" ? correctItem.trans : correctItem.word;
    const basePool = testItems.length ? testItems : DATA;
    const pool = basePool.filter(w => w.id !== correctItem.id);

    const opts = [correct];
    let guard = 0;
    while (opts.length < 4 && guard < 2000) {
      guard++;
      const cand = pool[Math.floor(Math.random() * pool.length)];
      if (!cand) break;
      const text = testMode === "kb" ? cand.trans : cand.word;
      if (!text) continue;
      if (opts.includes(text)) continue;
      opts.push(text);
    }
    return shuffle(opts);
  }

  function renderTestQuestion() {
    testLocked = false;
    btnTestNext.classList.add("hidden");

    if (testIndex >= testItems.length) {
      testTitle.textContent = "Тест завершён ✅";
      const pct = Math.round((testCorrect / Math.max(1, testItems.length)) * 100);
      testProgress.textContent = `Результат: ${testCorrect}/${testItems.length} (${pct}%)`;
      testQuestion.textContent = "Готово";
      testOptions.innerHTML = `<button class="optionBtn" id="btnTestAgain">Пройти ещё раз</button>`;
      document.getElementById("btnTestAgain").addEventListener("click", startTest);
      return;
    }

    const item = testItems[testIndex];
    const question = testMode === "kb" ? item.word : item.trans;
    const correctAnswer = testMode === "kb" ? item.trans : item.word;

    testTitle.textContent = "Тест: выбрать перевод";
    testProgress.textContent = `Вопрос ${testIndex + 1} из ${testItems.length} • Правильно: ${testCorrect}`;
    testQuestion.textContent = question;

    const options = pickOptions(item);
    testOptions.innerHTML = options.map(opt => `
      <button class="optionBtn" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
    `).join("");

    testOptions.querySelectorAll("button.optionBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (testLocked) return;
        testLocked = true;

        const chosen = btn.getAttribute("data-opt");
        const buttons = Array.from(testOptions.querySelectorAll("button.optionBtn"));

        buttons.forEach(b => {
          const val = b.getAttribute("data-opt");
          if (val === correctAnswer) b.classList.add("correct");
        });

        if (chosen === correctAnswer) {
          testCorrect++;
          btn.classList.add("correct");
        } else {
          btn.classList.add("wrong");
        }

        btnTestNext.classList.remove("hidden");
      });
    });
  }

  btnTestNext.addEventListener("click", () => {
    testIndex++;
    renderTestQuestion();
  });

  btnTestExit.addEventListener("click", () => showView(viewDicts));

  // ---------- Init
  (async () => {
    DATA = await loadWords();

    if (!Array.isArray(DATA) || !DATA.length) {
      dictsList.innerHTML = "<div class='smallNote'>Нет данных. Проверь таблицу и заголовки: id, dict, section, set, word, trans, example</div>";
      showView(viewDicts);
      return;
    }

    // normalize
    DATA = DATA.map(w => ({
      ...w,
      dict: (w.dict || "Словарь").trim() || "Словарь",
      section: (w.section || "Раздел").trim() || "Раздел",
    }));

    renderDicts();
  })();
})();
