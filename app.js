/* ============================================================
   WEATHER APP — app.js
   API: Open-Meteo (бесплатно, без ключа)
   ============================================================ */

// ── WMO WEATHER CODES ────────────────────────────────────────
const WMO = {
  0:  { ru: 'Ясно',                    icon: '☀️',  type: 'sunny'   },
  1:  { ru: 'Почти ясно',              icon: '🌤️',  type: 'sunny'   },
  2:  { ru: 'Переменная облачность',   icon: '⛅',  type: 'cloudy'  },
  3:  { ru: 'Пасмурно',                icon: '☁️',  type: 'cloudy'  },
  45: { ru: 'Туман',                   icon: '🌫️',  type: 'foggy'   },
  48: { ru: 'Изморозный туман',        icon: '🌫️',  type: 'foggy'   },
  51: { ru: 'Слабая морось',           icon: '🌦️',  type: 'drizzle' },
  53: { ru: 'Умеренная морось',        icon: '🌦️',  type: 'drizzle' },
  55: { ru: 'Сильная морось',          icon: '🌧️',  type: 'drizzle' },
  61: { ru: 'Слабый дождь',            icon: '🌧️',  type: 'rainy'   },
  63: { ru: 'Умеренный дождь',         icon: '🌧️',  type: 'rainy'   },
  65: { ru: 'Сильный дождь',           icon: '🌧️',  type: 'rainy'   },
  71: { ru: 'Слабый снегопад',         icon: '🌨️',  type: 'snowy'   },
  73: { ru: 'Умеренный снегопад',      icon: '❄️',  type: 'snowy'   },
  75: { ru: 'Сильный снегопад',        icon: '❄️',  type: 'snowy'   },
  77: { ru: 'Снежная крупа',           icon: '🌨️',  type: 'snowy'   },
  80: { ru: 'Слабый ливень',           icon: '🌦️',  type: 'rainy'   },
  81: { ru: 'Умеренный ливень',        icon: '🌧️',  type: 'rainy'   },
  82: { ru: 'Сильный ливень',          icon: '⛈️',  type: 'stormy'  },
  85: { ru: 'Снеговой ливень',         icon: '🌨️',  type: 'snowy'   },
  86: { ru: 'Сильный снеговой ливень', icon: '❄️',  type: 'snowy'   },
  95: { ru: 'Гроза',                   icon: '⛈️',  type: 'stormy'  },
  96: { ru: 'Гроза с градом',          icon: '⛈️',  type: 'stormy'  },
  99: { ru: 'Гроза с крупным градом',  icon: '⛈️',  type: 'stormy'  },
};

const COUNTRY_NAMES = {
  VN: 'Вьетнам',    RU: 'Россия',       GE: 'Грузия',
  EE: 'Эстония',    MA: 'Марокко',      RS: 'Сербия',
  TR: 'Турция',     AE: 'ОАЭ',          TH: 'Таиланд',
  KZ: 'Казахстан',  KR: 'Южная Корея',  KG: 'Киргизия',
};

// ── HELPERS ───────────────────────────────────────────────────

function wmo(code)  { return WMO[code] || { ru: 'Нет данных', icon: '🌡️', type: 'unknown' }; }

function uvInfo(uv) {
  if (uv == null) return { label: '—', color: 'rgba(255,255,255,0.5)' };
  if (uv <= 2)  return { label: 'Низкий',        color: '#69f0ae' };
  if (uv <= 5)  return { label: 'Умеренный',     color: '#ffee58' };
  if (uv <= 7)  return { label: 'Высокий',       color: '#ffa726' };
  if (uv <= 10) return { label: 'Очень высокий', color: '#ef5350' };
  return           { label: 'Экстремальный',  color: '#ce93d8' };
}

function getFlag(cc) {
  if (!cc || cc.length !== 2) return '';
  const code = cc.toLowerCase();
  return `<img class="country-flag" src="https://flagcdn.com/20x15/${code}.png" alt="${cc.toUpperCase()}" onerror="this.style.display='none'">`;
}

const RU_DAYS   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const RU_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function parseDateLocal(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Use UTC noon to get reliable day-of-week regardless of timezone
function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0=Sun … 6=Sat
}

function dayLabel(dateStr) {
  const d   = parseDateLocal(dateStr);
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime())     return 'Сегодня';
  if (d.getTime() === yesterday.getTime()) return 'Вчера';
  const dow = getDayOfWeek(dateStr);
  return `${RU_DAYS[dow]} ${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
}

function isToday(dateStr) {
  const d = parseDateLocal(dateStr), n = new Date();
  return d.getFullYear() === n.getFullYear() &&
         d.getMonth()    === n.getMonth()    &&
         d.getDate()     === n.getDate();
}

function isYesterday(dateStr) {
  const d = parseDateLocal(dateStr), y = new Date();
  y.setDate(y.getDate() - 1);
  return d.getFullYear() === y.getFullYear() &&
         d.getMonth()    === y.getMonth()    &&
         d.getDate()     === y.getDate();
}

function localTime(timezone) {
  try { return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: timezone }); }
  catch { return ''; }
}

// "2024-01-20T07:23"  →  "07:23"
function sunTime(isoStr) {
  return isoStr?.split('T')[1]?.slice(0, 5) ?? '—';
}

// ── PHOTOGRAPHY RATING ────────────────────────────────────────
function photoRating(i, daily) {
  const code       = daily.weather_code[i];
  const precipProb = daily.precipitation_probability_max?.[i] ?? 0;
  const windMax    = daily.wind_speed_10m_max?.[i]            ?? 0;
  const windGust   = daily.wind_gusts_10m_max?.[i]            ?? 0;
  const sunshine   = daily.sunshine_duration?.[i]             ?? 0;
  const daylight   = daily.daylight_duration?.[i]             ?? 1;
  const w          = wmo(code);

  let score = 100;
  const bad = [], good = [];

  switch (w.type) {
    case 'stormy':  score -= 60; bad.push('⛈️ Гроза');              break;
    case 'rainy':   score -= 35; bad.push('🌧️ Дождь');              break;
    case 'drizzle': score -= 20; bad.push('🌦️ Морось');             break;
    case 'foggy':   score -= 10; bad.push('🌫️ Туман');              break;
    case 'snowy':                good.push('❄️ Снег — красивый пейзаж'); break;
    case 'cloudy':  score -=  5; bad.push('☁️ Пасмурно — мягкий свет'); break;
    case 'sunny':                good.push('☀️ Ясное небо');         break;
  }

  if      (precipProb > 70) { score -= 20; bad.push(`💧 Дождь ${precipProb}%`); }
  else if (precipProb > 40) { score -= 10; bad.push(`💧 Дождь ${precipProb}%`); }
  else if (precipProb < 15)               { good.push('✅ Осадков маловероятны'); }

  if      (windMax > 15) { score -= 25; bad.push(`💨 Ветер ${windMax.toFixed(1)} м/с`); }
  else if (windMax >  8) { score -= 10; bad.push(`💨 Ветер ${windMax.toFixed(1)} м/с`); }
  else if (windMax <  3)               { good.push(`💨 Штиль ${windMax.toFixed(1)} м/с`); }
  else                                  { good.push(`💨 Слабый ветер ${windMax.toFixed(1)} м/с`); }

  if (windGust > 20) { score -= 10; bad.push(`🌀 Порывы до ${windGust.toFixed(1)} м/с`); }

  const sunRatio = sunshine / daylight;
  if      (sunRatio > 0.7) good.push('☀️ Много солнца');
  else if (sunRatio > 0.3) good.push('⛅ Переменная облачность — драм. свет');

  score = Math.max(0, Math.min(100, score));

  let emoji, label, color;
  if      (score >= 80) { emoji = '🌟'; label = 'Отличный день';      color = '#69f0ae'; }
  else if (score >= 60) { emoji = '✅'; label = 'Хороший день';        color = '#b5e853'; }
  else if (score >= 40) { emoji = '🟡'; label = 'Неплохо';             color = '#ffee58'; }
  else if (score >= 20) { emoji = '⚠️'; label = 'Сложные условия';    color = '#ffa726'; }
  else                  { emoji = '❌'; label = 'Плохо для съёмки';   color = '#ef5350'; }

  return { score, emoji, label, color, bad, good, windMax, windGust };
}

// Среднее облачности за ±1 ч вокруг sunStr из почасовых данных
function goldenHourCloud(hourly, dateStr, sunStr) {
  if (!hourly?.time || !sunStr) return null;
  const sunH = parseInt(sunStr.split('T')[1]?.split(':')[0] ?? '0');
  const vals = [];
  hourly.time.forEach((t, i) => {
    if (!t.startsWith(dateStr)) return;
    const h = parseInt(t.split('T')[1].split(':')[0]);
    if (h >= sunH - 1 && h <= sunH + 1 && hourly.cloud_cover?.[i] != null)
      vals.push(hourly.cloud_cover[i]);
  });
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

// Видимость (км) в районе золотого часа
function goldenHourVis(hourly, dateStr, sunStr) {
  if (!hourly?.time || !sunStr) return null;
  const sunH = parseInt(sunStr.split('T')[1]?.split(':')[0] ?? '0');
  const vals = [];
  hourly.time.forEach((t, i) => {
    if (!t.startsWith(dateStr)) return;
    const h = parseInt(t.split('T')[1].split(':')[0]);
    if (h >= sunH - 1 && h <= sunH + 1 && hourly.visibility?.[i] != null)
      vals.push(hourly.visibility[i]);
  });
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length / 100) / 10; // km
}

function cloudLabel(c) {
  if (c == null) return '';
  if (c < 20) return '☀️ Чисто';
  if (c < 50) return '⛅ Частичная';
  if (c < 80) return '🌥️ Облачно';
  return '☁️ Пасмурно';
}

// ── API ───────────────────────────────────────────────────────
// Если в конфиге указаны lat/lon — геокодинг пропускается
async function geocode(name, country, lat, lon) {
  if (lat != null && lon != null) {
    return { latitude: lat, longitude: lon, name, country: country || '' };
  }
  const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=ru&format=json`);
  const data = await res.json();
  if (!data.results?.length) throw new Error(`Город не найден: ${name}`);
  if (country) {
    const m = data.results.find(r => r.country_code === country.toUpperCase());
    if (m) return m;
  }
  return data.results[0];
}

async function fetchWeather(lat, lon, isHome = false) {
  const dailyBase = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'snowfall_sum', 'uv_index_max',
    'wind_speed_10m_max', 'precipitation_probability_max',
    'sunrise', 'sunset',
  ];
  const dailyHome = ['sunshine_duration', 'daylight_duration', 'wind_gusts_10m_max'];

  const params = new URLSearchParams({
    latitude:        lat,
    longitude:       lon,
    current:         'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,uv_index,is_day',
    daily:           (isHome ? [...dailyBase, ...dailyHome] : dailyBase).join(','),
    wind_speed_unit: 'ms',
    timezone:        'auto',
    past_days:       1,
    forecast_days:   isHome ? 8 : 4,   // home: вчера+сегодня+7; остальные: вчера+сегодня+3
  });

  if (isHome) params.append('hourly', 'cloud_cover,visibility');

  const res  = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'Ошибка API погоды');
  return data;
}

// ── RENDER — ОБЩИЕ ЧАСТИ ──────────────────────────────────────
function precipText(c) {
  const parts = [];
  if (c.snowfall   > 0) parts.push(`❄️ Снег: ${c.snowfall} см/ч`);
  if (c.rain       > 0) parts.push(`🌧️ Дождь: ${c.rain} мм`);
  if (c.showers    > 0) parts.push(`🌦️ Ливень: ${c.showers} мм`);
  if (!parts.length)    return c.precipitation > 0
    ? `💧 Осадки: ${c.precipitation} мм`
    : '<span class="no-precip">Осадков нет</span>';
  return parts.join(' · ');
}

// Одна ячейка прогноза
function renderForecastDay(daily, i, withSun = false) {
  const w         = wmo(daily.weather_code[i]);
  const maxT      = Math.round(daily.temperature_2m_max[i]);
  const minT      = Math.round(daily.temperature_2m_min[i]);
  const precip    = daily.precipitation_sum[i]               || 0;
  const snow      = daily.snowfall_sum[i]                    || 0;
  const uvMax     = daily.uv_index_max[i]                    || 0;
  const precipPct = daily.precipitation_probability_max?.[i];
  const uv        = uvInfo(uvMax);
  const label     = dayLabel(daily.time[i]);
  const todayCls  = isToday(daily.time[i])     ? 'forecast-day--today'     : '';
  const yestCls   = isYesterday(daily.time[i]) ? 'forecast-day--yesterday' : '';
  const sunrise   = daily.sunrise?.[i];
  const sunset    = daily.sunset?.[i];

  return `
    <div class="forecast-day ${todayCls} ${yestCls}">
      <div class="forecast-label">${label}</div>
      <div class="forecast-icon">${w.icon}</div>
      <div class="forecast-temps">
        <span class="temp-max">${maxT}°</span>
        <span class="temp-min">${minT}°</span>
      </div>
      ${precip > 0 ? `<div class="forecast-precip">💧 ${precip.toFixed(1)}мм${precipPct != null ? ` (${precipPct}%)` : ''}</div>` : ''}
      ${snow  > 0 ? `<div class="forecast-precip">❄️ ${snow.toFixed(1)}см</div>` : ''}
      <div class="forecast-uv" style="color:${uv.color}">UV ${Math.round(uvMax)}</div>
      ${withSun && sunrise ? `<div class="forecast-sun">🌅 ${sunTime(sunrise)}</div>` : ''}
      ${withSun && sunset  ? `<div class="forecast-sun">🌇 ${sunTime(sunset)}</div>`  : ''}
    </div>`;
}

// ── RENDER — БЛОК СЪЁМКИ ─────────────────────────────────────
function renderPhotoBlock(daily, hourly) {
  // Находим ближайшие Сб и Вс в пределах данных
  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const weekendIdx = [];
  for (let i = 0; i < daily.time.length; i++) {
    const dow = getDayOfWeek(daily.time[i]);
    if (dow === 6 || dow === 0) {
      const d = parseDateLocal(daily.time[i]);
      if (d >= todayD) weekendIdx.push(i);
    }
  }
  const toShow = weekendIdx.slice(0, 2);
  if (!toShow.length) return '';

  const dayCards = toShow.map(i => {
    const dateStr  = daily.time[i];
    const dow      = getDayOfWeek(dateStr);
    const dayName  = dow === 6 ? 'Суббота' : 'Воскресенье';
    const d        = parseDateLocal(dateStr);
    const dateLbl  = `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
    const sunrise  = daily.sunrise?.[i];
    const sunset   = daily.sunset?.[i];
    const rating   = photoRating(i, daily);

    const mCloud   = goldenHourCloud(hourly, dateStr, sunrise);
    const eCloud   = goldenHourCloud(hourly, dateStr, sunset);
    const mVis     = goldenHourVis(hourly, dateStr, sunrise);
    const eVis     = goldenHourVis(hourly, dateStr, sunset);

    const badHTML  = rating.bad.map( n => `<span class="photo-note photo-note--warn">${n}</span>`).join('');
    const goodHTML = rating.good.map(n => `<span class="photo-note photo-note--good">${n}</span>`).join('');

    return `
      <div class="photo-day">
        <div class="photo-day-header">
          <span class="photo-day-name">${dayName}, ${dateLbl}</span>
          <span class="photo-rating-badge" style="color:${rating.color}">${rating.emoji} ${rating.label}</span>
        </div>

        <div class="photo-golden">
          <div class="golden-block">
            <div class="golden-title">🌅 Рассвет · ${sunTime(sunrise)}</div>
            <div class="golden-stats">
              ${mCloud != null ? `<span>${mCloud}% · ${cloudLabel(mCloud)}</span>` : ''}
              ${mVis   != null ? `<span>👁 ${mVis} км</span>` : ''}
            </div>
          </div>
          <div class="golden-block">
            <div class="golden-title">🌇 Закат · ${sunTime(sunset)}</div>
            <div class="golden-stats">
              ${eCloud != null ? `<span>${eCloud}% · ${cloudLabel(eCloud)}</span>` : ''}
              ${eVis   != null ? `<span>👁 ${eVis} км</span>` : ''}
            </div>
          </div>
        </div>

        <div class="photo-wind">
          💨 ${rating.windMax.toFixed(1)} м/с${rating.windGust > rating.windMax ? ` · порывы ${rating.windGust.toFixed(1)} м/с` : ''}
        </div>
        <div class="photo-notes">${goodHTML}${badHTML}</div>
      </div>`;
  }).join('');

  return `
    <div class="photo-block">
      <div class="photo-block-title">📸 Прогноз для съёмки · Ближайшие выходные</div>
      <div class="photo-days">${dayCards}</div>
    </div>`;
}

// ── RENDER — ДОМАШНЯЯ КАРТОЧКА ────────────────────────────────
function renderHomeCard(label, geo, weather) {
  const c     = weather.current;
  const w     = wmo(c.weather_code);
  const uv    = uvInfo(c.uv_index);
  const time  = localTime(weather.timezone);
  const night = c.is_day === 0 ? ' night' : '';

  // Сегодняшние рассвет/закат — ищем по дате
  const todayI   = Math.max(1, weather.daily.time.findIndex(d => isToday(d)));
  const srToday  = sunTime(weather.daily.sunrise?.[todayI]);
  const ssToday  = sunTime(weather.daily.sunset?.[todayI]);

  const forecastHTML = weather.daily.time.map((_, i) =>
    renderForecastDay(weather.daily, i, true)
  ).join('');

  const photoHTML = renderPhotoBlock(weather.daily, weather.hourly);

  return `
    <div class="city-card home-card weather-${w.type}${night}">

      <div class="card-top">
        <div class="city-info">
          <div class="city-name">${label || geo.name}</div>
          <div class="city-country">${geo.country || ''} · Моё местоположение</div>
          ${time ? `<div class="local-time">🕐 ${time} местного</div>` : ''}
        </div>
        <div class="weather-icon-main">${w.icon}</div>
      </div>

      <div class="home-main-row">
        <div>
          <div class="temp-main">${Math.round(c.temperature_2m)}°C</div>
          <div class="feels-like">Ощущается как ${Math.round(c.apparent_temperature)}°C</div>
          <div class="condition-label">${w.ru}</div>
        </div>
        <div class="home-sun-today">
          <div class="sun-item">🌅 ${srToday}</div>
          <div class="sun-item">🌇 ${ssToday}</div>
        </div>
      </div>

      <div class="metrics-grid metrics-grid--4">
        <div class="metric">
          <span class="metric-icon">💧</span>
          <span class="metric-value">${c.relative_humidity_2m}%</span>
          <span class="metric-label">Влажность</span>
        </div>
        <div class="metric">
          <span class="metric-icon">🌞</span>
          <span class="metric-value" style="color:${uv.color}">${Math.round(c.uv_index ?? 0)}</span>
          <span class="metric-label">УФ · ${uv.label}</span>
        </div>
        <div class="metric">
          <span class="metric-icon">💨</span>
          <span class="metric-value">${c.wind_speed_10m?.toFixed(1) ?? '—'}</span>
          <span class="metric-label">м/с · ветер</span>
        </div>
        <div class="metric">
          <span class="metric-icon">🌀</span>
          <span class="metric-value">${c.wind_gusts_10m?.toFixed(1) ?? '—'}</span>
          <span class="metric-label">м/с · порывы</span>
        </div>
      </div>

      <div class="precip-info">${precipText(c)}</div>

      <div class="forecast-strip forecast-strip--extended">
        ${forecastHTML}
      </div>

      ${photoHTML}
    </div>`;
}

// ── RENDER — ОБЫЧНАЯ КАРТОЧКА ─────────────────────────────────
function renderCard(label, geo, weather) {
  const c     = weather.current;
  const w     = wmo(c.weather_code);
  const uv    = uvInfo(c.uv_index);
  const time  = localTime(weather.timezone);
  const night = c.is_day === 0 ? ' night' : '';

  return `
    <div class="city-card weather-${w.type}${night}">
      <div class="card-top">
        <div class="city-info">
          <div class="city-name">${label || geo.name}</div>
          <div class="city-country">${geo.country || ''}</div>
          ${time ? `<div class="local-time">${time} местного</div>` : ''}
        </div>
        <div class="weather-icon-main">${w.icon}</div>
      </div>

      <div class="temp-main">${Math.round(c.temperature_2m)}°C</div>
      <div class="feels-like">Ощущается как ${Math.round(c.apparent_temperature)}°C</div>
      <div class="condition-label">${w.ru}</div>

      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-icon">💧</span>
          <span class="metric-value">${c.relative_humidity_2m}%</span>
          <span class="metric-label">Влажность</span>
        </div>
        <div class="metric">
          <span class="metric-icon">🌞</span>
          <span class="metric-value" style="color:${uv.color}">${Math.round(c.uv_index ?? 0)}</span>
          <span class="metric-label">УФ · ${uv.label}</span>
        </div>
        <div class="metric">
          <span class="metric-icon">💨</span>
          <span class="metric-value">${c.wind_speed_10m?.toFixed(1) ?? '—'}</span>
          <span class="metric-label">м/с · ветер</span>
        </div>
      </div>

      <div class="precip-info">${precipText(c)}</div>

      <div class="forecast-strip">
        ${weather.daily.time.map((_, i) => renderForecastDay(weather.daily, i, false)).join('')}
      </div>
    </div>`;
}

// ── ЗАГРУЗКА ОДНОГО ГОРОДА ────────────────────────────────────
async function loadCitySlot({ placeholder, city, isHome }) {
  try {
    const geo     = await geocode(city.name, city.country, city.lat, city.lon);
    const weather = await fetchWeather(geo.latitude, geo.longitude, isHome);
    const html    = isHome
      ? renderHomeCard(city.label || null, geo, weather)
      : renderCard(city.label || null, geo, weather);
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();
    placeholder.replaceWith(tmp.firstElementChild);
  } catch (err) {
    placeholder.className = `city-card error-card${isHome ? ' home-card' : ''}`;
    placeholder.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="city-name">${city.label || city.name}</div>
        <div class="error-msg">${err.message}</div>
      </div>`;
  }
}

// ── ГРУППИРОВКА ───────────────────────────────────────────────
function groupByCountry(cities) {
  const order = [], map = new Map();
  for (const city of cities) {
    const cc = city.country || 'XX';
    if (!map.has(cc)) { map.set(cc, []); order.push(cc); }
    map.get(cc).push(city);
  }
  return order.map(cc => ({ cc, cities: map.get(cc) }));
}

// ── MAIN ──────────────────────────────────────────────────────
async function init() {
  const grid       = document.getElementById('cities-grid');
  const lastUpd    = document.getElementById('last-updated');
  const refreshBtn = document.getElementById('refresh-btn');

  grid.innerHTML = '';
  refreshBtn.classList.remove('spinning');
  void refreshBtn.offsetWidth;
  refreshBtn.classList.add('spinning');

  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('Не найден config.json');
    const config = await res.json();

    if (!config.cities?.length) {
      grid.innerHTML = '<div class="error-global">В config.json нет городов.</div>';
      return;
    }

    const homeCity = config.cities.find(c => c.home) || config.cities[0];
    const groups   = groupByCountry(config.cities);
    const slots    = [];

    for (const { cc, cities } of groups) {
      const hdr = document.createElement('div');
      hdr.className = 'country-header';
      hdr.textContent = `${getFlag(cc)} ${COUNTRY_NAMES[cc] || cc}`;
      grid.appendChild(hdr);

      for (const city of cities) {
        const isHome = city === homeCity;
        const ph = document.createElement('div');
        ph.className = `city-card loading-card${isHome ? ' home-card' : ''}`;
        ph.innerHTML = `
          <div class="loading-pulse">
            <div class="city-name" style="color:rgba(255,255,255,0.7)">${city.label || city.name}</div>
            <div class="loading-text">Загрузка…</div>
          </div>`;
        grid.appendChild(ph);
        slots.push({ placeholder: ph, city, isHome });
      }
    }

    await Promise.all(slots.map(s => loadCitySlot(s)));

    const now = new Date();
    lastUpd.textContent = `Обновлено в ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  } catch (err) {
    grid.innerHTML = `<div class="error-global">Ошибка: ${err.message}</div>`;
  }
}

document.getElementById('refresh-btn').addEventListener('click', init);
setInterval(init, 30 * 60 * 1000);
init();
