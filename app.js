// v5.1 CSV import foundation
(function () {
  const USER_DICTS_KEY = "fc_user_dicts_v5";

  function loadUserDicts() {
    try {
      return JSON.parse(localStorage.getItem(USER_DICTS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveUserDicts(arr) {
    localStorage.setItem(USER_DICTS_KEY, JSON.stringify(arr));
  }

  function mergeUserDicts(base, userDicts) {
    const out = base.slice();
    userDicts.forEach(d => d.words.forEach(w => out.push(w)));
    return out;
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines.shift().split(",").map(h => h.trim().toLowerCase());
    const res = [];
    lines.forEach(line => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = (cols[i] || "").trim());
      res.push(obj);
    });
    return res;
  }

  function parseUserCsv(text) {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error("CSV пустой");

    const grouped = {};
    rows.forEach(r => {
      const dict = r.dictionary;
      if (!dict) return;
      if (!grouped[dict]) grouped[dict] = [];
      grouped[dict].push({
        id: Date.now() + Math.random(),
        dict: dict,
        section: r.section || "Раздел",
        set: Number(r.set) || 1,
        word: r.word,
        trans: r.translation,
        example: r.example || "",
        source: "user"
      });
    });

    return Object.keys(grouped).map(name => ({
      id: "user-" + name,
      title: name,
      words: grouped[name]
    }));
  }

  const btnImportCsv = document.getElementById("btnImportCsv");
  const csvInput = document.getElementById("csvInput");
  const dictsList = document.getElementById("dictsList");

  let DATA = [];

  function renderDicts() {
    const dicts = [...new Set(DATA.map(w => w.dict))];
    dictsList.innerHTML = dicts.map(d => `<button class="btn">${d}</button>`).join("");
  }

  btnImportCsv.addEventListener("click", () => {
    csvInput.value = "";
    csvInput.click();
  });

  csvInput.addEventListener("change", async () => {
    const file = csvInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseUserCsv(text);
      const existing = loadUserDicts();
      saveUserDicts(existing.concat(imported));
      DATA = mergeUserDicts(DATA, imported);
      renderDicts();
      alert("Словарь загружен");
    } catch (e) {
      alert("Ошибка CSV: " + e.message);
    }
  });

  (function init() {
    const builtin = Array.isArray(window.WORDS_FALLBACK)
      ? window.WORDS_FALLBACK.map(w => ({ ...w, source: "builtin" }))
      : [];
    const userDicts = loadUserDicts();
    DATA = mergeUserDicts(builtin, userDicts);
    renderDicts();
  })();
})();