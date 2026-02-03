// UPDATED app.js (excerpt-replaced build)
// Changes:
// 1) Test options are generated from full selected scope (testOptionPool)
// 2) Options are filtered by part of speech (pos) when available, with fallback

let testOptionPool = [];

function startTest() {
  const pool = getSelectedScopePool();
  const testLimit = getSelectedTestLimit();

  testOptionPool = pool.slice();

  testItems = shuffle(pool.slice());
  if (testItems.length > testLimit) {
    testItems = testItems.slice(0, testLimit);
  }

  testIndex = 0;
  testCorrect = 0;
  testSelected = null;
  testResults = [];

  btnTestNext.classList.remove("hidden");
  btnTestNext.textContent = "Дальше";
  btnTestNext.disabled = true;

  goView(viewTest);
  renderTestQuestion();
}

function pickOptions(correctItem) {
  const correct =
    testMode === "kb" ? correctItem.trans : correctItem.word;

  const targetPOS = (correctItem.pos || "").trim();

  let pool = testOptionPool.filter(w =>
    w.id !== correctItem.id &&
    (!targetPOS || (w.pos && String(w.pos).trim() === targetPOS))
  );

  if (pool.length < 3) {
    pool = testOptionPool.filter(w => w.id !== correctItem.id);
  }

  const opts = [correct];
  let guard = 0;

  while (opts.length < 4 && guard < 2000) {
    guard++;
    const cand = pool[Math.floor(Math.random() * pool.length)];
    if (!cand) break;

    const text =
      testMode === "kb" ? cand.trans : cand.word;

    if (!text) continue;
    if (opts.includes(text)) continue;

    opts.push(text);
  }

  return shuffle(opts);
}
