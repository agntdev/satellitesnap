import type { en, TranslationKey } from "./en";

/**
 * Russian locale. Typed as a complete map over the English key set, so a
 * missing or stray key is a compile error.
 */
export const ru: Record<keyof typeof en, string> = {
  "tagline": "свежие спутниковые снимки для любого адреса или координат",

  "lang.label": "язык",
  "lang.en": "EN",
  "lang.ru": "RU",

  "search.label": "цель — адрес или широта,долгота",
  "search.placeholder": "Тверская 1, Москва  ·  55.7558,37.6173",
  "search.locate": "определить моё местоположение",
  "search.submit": "снимок ⮐",
  "search.scanning": "сканирование…",

  "status.acquiring": "получение снимков…",
  "status.target": "цель: {label}",

  "viewport.noTarget": "цель не выбрана",
  "viewport.empty": "// введите адрес или координаты, чтобы загрузить свежий снимок",
  "viewport.acquiring": "получение снимков",
  "viewport.mapEngine": "загрузка движка карты",
  "viewport.tileError": "✗ не удалось загрузить тайлы снимков",
  "viewport.lat": "шир",
  "viewport.lng": "долг",

  "history.title": "история",
  "history.aria": "история поиска",
  "history.clear": "очистить",
  "history.clearAria": "очистить историю",
  "history.empty": "// нет недавних снимков",

  "metadata.toggle": "метаданные",
  "metadata.location": "локация",
  "metadata.latlng": "шир,долг",
  "metadata.source": "источник",
  "metadata.date": "дата",
  "metadata.zoom": "зум",
  "metadata.resolution": "разрешение",
  "metadata.latest": "последние доступные",

  "timetravel.label": "путешествие во времени",
  "timetravel.group": "путешествие во времени",
  "timetravel.loading": "загрузка хронологии снимков",
  "timetravel.latest": " · последний",
  "timetravel.newer": "новее",
  "timetravel.older": "старее",
  "timetravel.release": "выпуск снимков",
  "timetravel.hint": "{count} выпусков · {from} → {to}",

  "share.copy": "поделиться ⎘",
  "share.copied": "ссылка скопирована ✓",
  "share.aria": "скопировать ссылку",

  "footer.imagery": "снимки: Esri World Imagery + Wayback",
  "footer.geocoding": "геокодирование: OpenStreetMap Nominatim",
  "footer.source": "исходный код",

  "error.empty": "введите адрес или координаты",
  "error.noMatch": 'ничего не найдено по запросу «{query}»',
  "error.network": "сетевая ошибка при геокодировании — проверьте соединение",
  "error.http": "геокодер вернул {status}",
  "error.malformed": "геокодер вернул некорректные координаты",
  "error.unexpected": "непредвиденная ошибка при определении местоположения",
  "error.noGeolocation": "геолокация недоступна в этом браузере",
  "error.geoDenied": "доступ к местоположению запрещён",
  "error.geoFailed": "не удалось определить ваше местоположение",
};

// Re-export so consumers can `import { ru, type TranslationKey }`.
export type { TranslationKey };
