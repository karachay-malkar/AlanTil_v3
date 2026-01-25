// Можно вставлять ЛЮБУЮ ссылку на Google Sheets (даже /edit) — приложение само превратит её в CSV.
window.WORDS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Wzm-uUGm8zvKCAl5V0aaIcT9RwwTxJiRzj5rAA9M08M/edit?usp=drivesdk";

// Ключ кеша (быстрый старт)
window.WORDS_CACHE_KEY = "fc_words_cache_v3";

// (Необязательно) Человеческие названия папок.
window.FOLDER_TITLES = {
  "easy": "Простой",
  "mid": "Средний",
  "hard": "Сложный",
  "mega": "Супер-сложный",
};

// Тестовые данные (если таблица недоступна)
window.WORDS_FALLBACK = [
  { id: 1, folder: "easy", set: 1, word: "салам", trans: "привет", example: "Салам! Къалайса?" },
  { id: 2, folder: "easy", set: 1, word: "сау бол", trans: "спасибо", example: "Сау бол, кёрюшюрбюз!" },
  { id: 3, folder: "verbs", set: 1, word: "барыргъа", trans: "идти/ехать", example: "Мен барыргъа керекме" },
];
