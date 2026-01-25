// Можно вставлять ЛЮБУЮ ссылку на Google Sheets (даже /edit) — приложение само превратит её в CSV.
window.WORDS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1X2tc9THUxj0bZOQDdycEFGl7xJMqjUBYe7MsESWIUXI/edit?usp=sharing";

// Ключ кеша (быстрый старт)
window.WORDS_CACHE_KEY = "fc_words_cache_v4";

// (Необязательно) Человеческие названия папок.
window.FOLDER_TITLES = {
  "easy": "Простой",
  "mid": "Средний",
  "hard": "Сложный",
};

// Тестовые данные (если таблица недоступна)
window.WORDS_FALLBACK = [
  { id: 1, folder: "easy", set: 1, word: "салам", trans: "привет", example: "Салам! Къалайса?" },
  { id: 2, folder: "easy", set: 1, word: "сау бол", trans: "пока", example: "Сау бол, кёрюшюрбюз!" },
  { id: 3, folder: "verbs", set: 1, word: "барыргъа", trans: "идти/ехать", example: "" },
];
