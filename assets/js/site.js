(function () {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const THEME_KEY = 'gekkzzz-theme';

  function applyTheme(preference) {
    const root = document.documentElement;
    if (preference === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (preference === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }

  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; }
  }

  function saveTheme(preference) {
    try { localStorage.setItem(THEME_KEY, preference); } catch {}
  }

  function updateThemeButtons(active) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === active);
    });
  }

  // Apply before paint to avoid flash
  applyTheme(getSavedTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const saved = getSavedTheme();
    updateThemeButtons(saved);

    document.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const preference = btn.dataset.theme;
        saveTheme(preference);
        applyTheme(preference);
        updateThemeButtons(preference);
      });
    });

    // Listen for system preference changes when set to "system"
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (getSavedTheme() === 'system') applyTheme('system');
    });
  });
})();

(async function () {
  // ── DOM refs ───────────────────────────────────────────────────────────────
  const list = document.getElementById('post-list');
  const calendar = document.getElementById('github-calendar');
  const myTimeElement = document.getElementById('my-time');
  const myTimezoneElement = document.getElementById('my-timezone');
  const yourTimeElement = document.getElementById('your-time');
  const yourTimezoneElement = document.getElementById('your-timezone');
  const yourTimeLabelElement = document.getElementById('your-time-label');

  // ── Constants ──────────────────────────────────────────────────────────────
  const ukTimezone = 'Europe/London';
  const timeTickIntervalMs = 1000;
  const activityUsername = 'gekkzzz';
  const activityApiBase = 'https://github-contributions-api.jogruber.de/v4/';
  const activityRefreshIntervalMs = 60 * 60 * 1000;
  const msPerDay = 24 * 60 * 60 * 1000;
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  const accessibleDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });

  let userTimezone = 'UTC';
  let userLocation = null;
  let isRefreshingActivity = false;

  // ── Timezone aliases ───────────────────────────────────────────────────────
  const timezoneAliases = {
    'africa/asmera': 'Africa/Asmara', 'africa/timbuktu': 'Africa/Bamako',
    'america/atka': 'America/Adak', 'america/buenos_aires': 'America/Argentina/Buenos_Aires',
    'america/catamarca': 'America/Argentina/Catamarca', 'america/cordoba': 'America/Argentina/Cordoba',
    'america/fort_wayne': 'America/Indiana/Indianapolis', 'america/indianapolis': 'America/Indiana/Indianapolis',
    'america/jujuy': 'America/Argentina/Jujuy', 'america/knox_in': 'America/Indiana/Knox',
    'america/louisville': 'America/Kentucky/Louisville', 'america/mendoza': 'America/Argentina/Mendoza',
    'america/porto_acre': 'America/Rio_Branco', 'america/rosario': 'America/Argentina/Cordoba',
    'america/shiprock': 'America/Denver', 'asia/ashkhabad': 'Asia/Ashgabat',
    'asia/calcutta': 'Asia/Kolkata', 'asia/chongqing': 'Asia/Shanghai',
    'asia/chungking': 'Asia/Shanghai', 'asia/dacca': 'Asia/Dhaka',
    'asia/harbin': 'Asia/Shanghai', 'asia/katmandu': 'Asia/Kathmandu',
    'asia/ujung_pandang': 'Asia/Makassar', 'asia/macao': 'Asia/Macau',
    'asia/rangoon': 'Asia/Yangon', 'asia/saigon': 'Asia/Ho_Chi_Minh',
    'asia/tel_aviv': 'Asia/Jerusalem', 'asia/thimbu': 'Asia/Thimphu',
    'asia/ulan_bator': 'Asia/Ulaanbaatar', 'asia/kashgar': 'Asia/Urumqi',
    'atlantic/faeroe': 'Atlantic/Faroe', 'australia/act': 'Australia/Sydney',
    'australia/canberra': 'Australia/Sydney', 'australia/lhi': 'Australia/Lord_Howe',
    'australia/nsw': 'Australia/Sydney', 'australia/north': 'Australia/Darwin',
    'australia/queensland': 'Australia/Brisbane', 'australia/south': 'Australia/Adelaide',
    'australia/tasmania': 'Australia/Hobart', 'australia/victoria': 'Australia/Melbourne',
    'australia/west': 'Australia/Perth', 'australia/yancowinna': 'Australia/Broken_Hill',
    'brazil/acre': 'America/Rio_Branco', 'brazil/denoronha': 'America/Noronha',
    'brazil/east': 'America/Sao_Paulo', 'brazil/west': 'America/Manaus',
    'canada/atlantic': 'America/Halifax', 'canada/central': 'America/Winnipeg',
    'canada/eastern': 'America/Toronto', 'canada/mountain': 'America/Edmonton',
    'canada/newfoundland': 'America/St_Johns', 'canada/pacific': 'America/Vancouver',
    'europe/belfast': 'Europe/London', 'europe/kiev': 'Europe/Kyiv',
    'europe/tiraspol': 'Europe/Chisinau', 'europe/uzhgorod': 'Europe/Kyiv',
    'europe/zaporozhye': 'Europe/Kyiv', 'mexico/bajanorte': 'America/Tijuana',
    'mexico/bajasur': 'America/Mazatlan', 'mexico/general': 'America/Mexico_City',
    'pacific/johnston': 'Pacific/Honolulu', 'pacific/ponape': 'Pacific/Pohnpei',
    'pacific/samoa': 'Pacific/Pago_Pago', 'pacific/truk': 'Pacific/Chuuk',
    'pacific/yap': 'Pacific/Chuuk', 'us/alaska': 'America/Anchorage',
    'us/aleutian': 'America/Adak', 'us/arizona': 'America/Phoenix',
    'us/central': 'America/Chicago', 'us/east-indiana': 'America/Indiana/Indianapolis',
    'us/eastern': 'America/New_York', 'us/hawaii': 'Pacific/Honolulu',
    'us/indiana-starke': 'America/Indiana/Knox', 'us/michigan': 'America/Detroit',
    'us/mountain': 'America/Denver', 'us/pacific': 'America/Los_Angeles',
    'us/samoa': 'Pacific/Pago_Pago', 'etc/greenwich': 'Etc/GMT',
    'etc/uct': 'Etc/UTC', 'etc/universal': 'Etc/UTC', 'etc/zulu': 'Etc/UTC',
    'gmt0': 'Etc/GMT', 'greenwich': 'Etc/GMT', 'hongkong': 'Asia/Hong_Kong',
    'iceland': 'Atlantic/Reykjavik', 'iran': 'Asia/Tehran', 'israel': 'Asia/Jerusalem',
    'jamaica': 'America/Jamaica', 'japan': 'Asia/Tokyo', 'kwajalein': 'Pacific/Kwajalein',
    'libya': 'Africa/Tripoli', 'nz': 'Pacific/Auckland', 'nz-chat': 'Pacific/Chatham',
    'poland': 'Europe/Warsaw', 'portugal': 'Europe/Lisbon', 'prc': 'Asia/Shanghai',
    'roc': 'Asia/Taipei', 'singapore': 'Asia/Singapore', 'turkey': 'Europe/Istanbul',
    'w-su': 'Europe/Moscow'
  };

  const offsetTimezoneFallbacks = {
    '+0330': 'Asia/Tehran', '+0430': 'Asia/Kabul', '+0530': 'Asia/Kolkata',
    '+0545': 'Asia/Kathmandu', '+0630': 'Asia/Yangon', '+0845': 'Australia/Eucla',
    '+0930': 'Australia/Adelaide', '+1030': 'Australia/Lord_Howe',
    '+1245': 'Pacific/Chatham', '-0930': 'Pacific/Marquesas'
  };

  // ── Timezone helpers ───────────────────────────────────────────────────────
  let supportedTimezoneMaps = null;

  function buildSupportedTimezoneMaps() {
    if (typeof Intl.supportedValuesOf !== 'function') return null;
    try {
      const supportedZones = Intl.supportedValuesOf('timeZone');
      const byLower = new Map();
      const byCompact = new Map();
      const byCityCompact = new Map();
      for (const tz of supportedZones) {
        byLower.set(tz.toLowerCase(), tz);
        byCompact.set(tz.toLowerCase().replace(/[^a-z0-9]/g, ''), tz);
        const parts = tz.split('/');
        const city = parts[parts.length - 1];
        if (city) byCityCompact.set(city.toLowerCase().replace(/[^a-z0-9]/g, ''), tz);
      }
      return { byLower, byCompact, byCityCompact };
    } catch { return null; }
  }

  supportedTimezoneMaps = buildSupportedTimezoneMaps();

  function getCompactTimezoneKey(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function normalizeTimezoneToken(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.replace(/\s+/g, '_');
  }

  function parseUtcOffsetTimezone(rawTimezone) {
    if (typeof rawTimezone !== 'string') return null;
    const match = rawTimezone.match(/^(?:UTC|GMT)?([+-])(\d{1,2}):?(\d{2})?$/i);
    if (!match) return null;
    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const minutes = (match[3] || '00').padStart(2, '0');
    const key = `${sign}${hours}${minutes}`;
    return offsetTimezoneFallbacks[key] || null;
  }

  function getTimezoneTokens(timezone) {
    if (typeof timezone !== 'string') return [];
    const stripped = timezone
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\b(?:standard|daylight|summer|winter|time)\b/gi, ' ')
      .trim();
    return stripped.split(/[,;|/\s]+/).filter(Boolean);
  }

  function getCanonicalTimezone(timezone) {
    const tokens = getTimezoneTokens(timezone);
    for (const token of tokens) {
      const normalized = normalizeTimezoneToken(token);
      if (!normalized) continue;
      const candidates = [normalized];
      const alias = timezoneAliases[normalized.toLowerCase()];
      if (alias) candidates.push(alias);
      const offset = parseUtcOffsetTimezone(token);
      if (offset) candidates.push(offset);
      if (supportedTimezoneMaps) {
        for (const c of candidates) {
          const direct = supportedTimezoneMaps.byLower.get(c.toLowerCase());
          if (direct) return direct;
        }
        for (const c of candidates) {
          const compact = supportedTimezoneMaps.byCompact.get(getCompactTimezoneKey(c));
          if (compact) return compact;
        }
        if (!normalized.includes('/')) {
          const city = supportedTimezoneMaps.byCityCompact.get(getCompactTimezoneKey(normalized));
          if (city) return city;
        }
      }
      for (const c of candidates) {
        try {
          const resolved = new Intl.DateTimeFormat('en-GB', { timeZone: c }).resolvedOptions().timeZone;
          return resolved || c;
        } catch {}
      }
    }
    return null;
  }

  userTimezone = getCanonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';

  // ── Time display ───────────────────────────────────────────────────────────
  function formatClockTime(date, timezone) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: timezone
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(date);
    }
  }

  function getTimezoneOffsetMinutes(date, timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone, hour12: false, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(date);
      const v = {};
      for (const p of parts) if (p.type !== 'literal') v[p.type] = p.value;
      const zonedTimestamp = Date.UTC(
        Number(v.year), Number(v.month) - 1, Number(v.day),
        Number(v.hour), Number(v.minute), Number(v.second)
      );
      return Math.round((zonedTimestamp - date.getTime()) / 60000);
    } catch { return 0; }
  }

  function formatTimeDifference(date, ref, comp) {
    const diff = getTimezoneOffsetMinutes(date, comp) - getTimezoneOffsetMinutes(date, ref);
    if (!Number.isFinite(diff) || diff === 0) return 'Same as Liverpool';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    const sign = diff > 0 ? '+' : '-';
    const dir = diff > 0 ? 'ahead of Liverpool' : 'behind Liverpool';
    return `${sign}${parts.join(' ')} ${dir}`;
  }

  function getFallbackLocationLabel(timezone) {
    const canonical = getCanonicalTimezone(timezone);
    if (!canonical) return 'Local device';
    const parts = canonical.split('/');
    return (parts[parts.length - 1] || canonical).replace(/_/g, ' ');
  }

  function updateTimeMetadata() {
    const now = new Date();
    const locationBits = [userLocation?.city, userLocation?.countryCode || userLocation?.country].filter(Boolean);
    const locationLabel = locationBits.length > 0
      ? locationBits.join(', ')
      : getFallbackLocationLabel(userTimezone);
    const differenceLabel = formatTimeDifference(now, ukTimezone, userTimezone);

    if (myTimezoneElement) myTimezoneElement.textContent = `${ukTimezone} · local time`;
    if (yourTimeLabelElement) yourTimeLabelElement.textContent = locationLabel ? `Your time (${locationLabel})` : 'Your time';
    if (yourTimezoneElement) yourTimezoneElement.textContent = [userTimezone, differenceLabel].filter(Boolean).join(' · ');
  }

  function renderTimeSection() {
    if (!myTimeElement && !yourTimeElement) return;
    const now = new Date();
    if (myTimeElement) myTimeElement.textContent = formatClockTime(now, ukTimezone);
    if (yourTimeElement) yourTimeElement.textContent = formatClockTime(now, userTimezone);
    updateTimeMetadata();
  }

  async function detectUserTimeFromLocation() {
    const endpoints = [
      'https://ipwho.is/?fields=success,city,country,country_code,timezone',
      'https://ipinfo.io/json'
    ];
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) continue;
        const payload = await res.json();
        if (!payload || payload.success === false) continue;
        const rawTz = payload.timezone || payload.timeZone || null;
        const tz = rawTz ? getCanonicalTimezone(typeof rawTz === 'string' ? rawTz : rawTz.name || '') : null;
        const city = payload.city || null;
        const countryCode = payload.country_code || (typeof payload.country === 'string' && payload.country.length === 2 ? payload.country : null);
        const country = payload.country_name || payload.country || null;
        if (tz) userTimezone = tz;
        if (city || countryCode) userLocation = { city, countryCode, country };
        if (tz || city || countryCode) { renderTimeSection(); break; }
      } catch {}
    }
    renderTimeSection();
  }

  if (myTimeElement || yourTimeElement) {
    renderTimeSection();
    window.setInterval(renderTimeSection, timeTickIntervalMs);
    Promise.resolve().then(() => detectUserTimeFromLocation()).catch(() => {});
  }

  // ── Activity calendar ──────────────────────────────────────────────────────
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function escapeAttribute(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function toUtcDate(year, month, day) { return new Date(Date.UTC(year, month, day)); }

  function parseIsoDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return toUtcDate(y, m - 1, d);
  }

  function toIsoDate(date) { return date.toISOString().slice(0, 10); }

  function addUtcDays(date, amount) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + amount);
    return next;
  }

  function getMondayBasedDayIndex(date) { return (date.getUTCDay() + 6) % 7; }

  function clampLevel(level) {
    const n = Number(level);
    return Number.isFinite(n) ? Math.max(0, Math.min(4, n)) : 0;
  }

  function recomputeLevels(days) {
    const max = Math.max(0, ...days.map(d => d.count));
    if (max === 0) return days;
    return days.map(d => d.count === 0 ? { ...d, level: 0 } : { ...d, level: Math.ceil((d.count / max) * 4) });
  }

  function getActivityRange(today = new Date()) {
    const end = toUtcDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const start = toUtcDate(today.getUTCFullYear(), 0, 1);
    return { start, end };
  }

  async function fetchActivityDays(username, start, end, hourBucket) {
    const years = Array.from(new Set([start.getUTCFullYear(), end.getUTCFullYear()]));
    const payloads = await Promise.all(years.map(async (year) => {
      const params = new URLSearchParams({ y: String(year), cb: String(hourBucket) });
      const response = await fetch(`${activityApiBase}${encodeURIComponent(username)}?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('activity fetch failed');
      return response.json();
    }));

    const dayMap = new Map();
    payloads.forEach(payload => {
      if (!Array.isArray(payload.contributions)) return;
      payload.contributions.forEach(entry => {
        if (!entry || !entry.date) return;
        dayMap.set(entry.date, { count: Number(entry.count) || 0, level: clampLevel(entry.level) });
      });
    });

    const days = [];
    for (let cursor = new Date(start); cursor <= end; cursor = addUtcDays(cursor, 1)) {
      const key = toIsoDate(cursor);
      const entry = dayMap.get(key) || { count: 0, level: 0 };
      days.push({ date: key, count: entry.count, level: entry.level });
    }
    return recomputeLevels(days);
  }

  function buildActivityMatrix(days, start, end) {
    const renderStart = addUtcDays(start, -getMondayBasedDayIndex(start));
    const renderEnd = addUtcDays(end, 6 - getMondayBasedDayIndex(end));
    const endTime = end.getTime();
    const dayMap = new Map(days.map(entry => [entry.date, entry]));
    const weeks = [];

    for (let cursor = new Date(renderStart); cursor <= renderEnd;) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const key = toIsoDate(cursor);
        const isFuture = cursor.getTime() > endTime;
        const entry = dayMap.get(key);
        if (isFuture) {
          week.push({ date: key, count: 0, level: 0, isPadding: false, isFuture: true });
        } else if (entry) {
          week.push({ ...entry, isPadding: false, isFuture: false });
        } else {
          week.push({ date: key, count: 0, level: 0, isPadding: true, isFuture: false });
        }
        cursor = addUtcDays(cursor, 1);
      }
      weeks.push(week);
    }
    return { weeks, renderStart };
  }

  function buildMonthLabels(start, end, renderStart) {
    const labels = [];
    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor = toUtcDate(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)
    ) {
      const offset = Math.round((cursor - renderStart) / msPerDay);
      labels.push({ label: monthFormatter.format(cursor), weekIndex: Math.floor(offset / 7) + 1 });
    }
    return labels;
  }

  function renderActivityCalendar(container, days, start, end) {
    const { weeks, renderStart } = buildActivityMatrix(days, start, end);
    const monthLabels = buildMonthLabels(start, end, renderStart);
    const totalContributions = days.reduce((sum, d) => sum + d.count, 0);
    const visibleRange = `${monthFormatter.format(start)} ${start.getUTCFullYear()} to ${monthFormatter.format(end)} ${end.getUTCFullYear()}`;

    const weekdayLabels = [
      { label: 'Mon', row: 1 }, { label: 'Tue', row: 2 }, { label: 'Wed', row: 3 },
      { label: 'Thu', row: 4 }, { label: 'Fri', row: 5 }, { label: 'Sat', row: 6 }, { label: 'Sun', row: 7 }
    ];

    const monthMarkup = monthLabels.map(item =>
      `<span class="activity-month" style="grid-column:${item.weekIndex};">${item.label}</span>`
    ).join('');

    const gridMarkup = weeks.map(week => week.map(day => {
      if (day.isFuture) return '<span class="activity-cell activity-cell-future" aria-hidden="true"></span>';
      if (day.isPadding) return '<span class="activity-cell activity-level-0 activity-cell-padding" aria-hidden="true"></span>';
      const desc = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${accessibleDateFormatter.format(parseIsoDate(day.date))}`;
      return `<span class="activity-cell activity-level-${day.level}" role="gridcell" aria-label="${escapeAttribute(desc)}" title="${escapeAttribute(desc)}"></span>`;
    }).join('')).join('');

    container.innerHTML = `
      <div class="activity-calendar" style="--weeks:${weeks.length};">
        <div class="activity-month-row">
          <div class="activity-month-spacer" aria-hidden="true"></div>
          <div class="activity-months" aria-hidden="true">${monthMarkup}</div>
        </div>
        <div class="activity-grid-row">
          <div class="activity-weekdays" aria-hidden="true">
            ${weekdayLabels.map(item => `<span style="grid-row:${item.row};">${item.label}</span>`).join('')}
          </div>
          <div class="activity-grid" role="grid" aria-label="GitHub activity from ${escapeAttribute(visibleRange)}">
            ${gridMarkup}
          </div>
        </div>
        <div class="activity-footer-row">
          <div class="activity-month-spacer" aria-hidden="true"></div>
          <div class="activity-footer">
            <p class="activity-meta">${totalContributions} contribution${totalContributions === 1 ? '' : 's'} from ${escapeHtml(visibleRange)}</p>
            <div class="activity-legend" aria-label="Contribution level legend">
              <span class="activity-legend-label">Less</span>
              <span class="activity-legend-cell activity-level-0" aria-hidden="true"></span>
              <span class="activity-legend-cell activity-level-1" aria-hidden="true"></span>
              <span class="activity-legend-cell activity-level-2" aria-hidden="true"></span>
              <span class="activity-legend-cell activity-level-3" aria-hidden="true"></span>
              <span class="activity-legend-cell activity-level-4" aria-hidden="true"></span>
              <span class="activity-legend-label">More</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function refreshActivityCalendar() {
    if (!calendar || isRefreshingActivity) return;
    isRefreshingActivity = true;
    try {
      const { start, end } = getActivityRange();
      const hourBucket = Math.floor(Date.now() / activityRefreshIntervalMs);
      const activityDays = await fetchActivityDays(activityUsername, start, end, hourBucket);
      renderActivityCalendar(calendar, activityDays, start, end);
    } catch {
      if (calendar) calendar.textContent = 'Activity unavailable right now.';
    } finally {
      isRefreshingActivity = false;
    }
  }

  function scheduleActivityRefreshOnTheHour() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);
    const delay = Math.max(1000, nextHour.getTime() - now.getTime());
    window.setTimeout(async () => {
      await refreshActivityCalendar();
      scheduleActivityRefreshOnTheHour();
    }, delay);
  }

  if (calendar) {
    Promise.resolve().then(() => refreshActivityCalendar()).catch(() => {});
    scheduleActivityRefreshOnTheHour();
  }

  // ── Blog posts ─────────────────────────────────────────────────────────────
  function safeUrl(url) {
    try {
      const u = new URL(url);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch { return '#'; }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getItemTitle(item) {
    const el = item.getElementsByTagName('title')[0];
    if (!el) return '';
    // textContent handles CDATA sections in most browsers; fall back to innerHTML stripped
    const t = el.textContent || el.innerHTML || '';
    return t.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  }

  async function fetchFeedItems() {
    const rssUrl = 'https://gekkzzz.substack.com/feed';
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
      `https://thingproxy.freeboard.io/fetch/${rssUrl}`
    ];
    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const tid = window.setTimeout(() => controller.abort(), 8000);
        const res = await fetch(proxyUrl, { signal: controller.signal });
        window.clearTimeout(tid);
        if (!res.ok) continue;
        const text = await res.text();
        if (!text || text.length < 50) continue;
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        if (xml.querySelector('parsererror')) continue;
        const items = Array.from(xml.getElementsByTagName('item')).slice(0, 3);
        if (items.length === 0) continue;
        // Only return if at least one item has a title
        if (items.some(i => getItemTitle(i))) return items;
      } catch {}
    }
    return null;
  }

  if (list) {
    (async () => {
      try {
        const items = await fetchFeedItems();
        if (!items) {
          list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
          return;
        }
        list.innerHTML = items.map(item => {
          const title = getItemTitle(item);
          const link = item.getElementsByTagName('link')[0]?.textContent?.trim()
            || item.getElementsByTagName('guid')[0]?.textContent?.trim() || '';
          const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
          return `<li>
            <span class="post-date">${escapeHtml(formatDate(pubDate))}</span>
            <a href="${safeUrl(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
          </li>`;
        }).join('');
      } catch {
        list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
      }
    })();
  }
})();

// Live GitHub language percentages
(function () {
  const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    CSS: '#563d7c', HTML: '#e34c26', SCSS: '#c6538c', Shell: '#89e051',
    Vue: '#41b883', Svelte: '#ff3e00', Ruby: '#701516', Go: '#00ADD8',
    Rust: '#dea584', PHP: '#4F5D95', Kotlin: '#A97BFF', Swift: '#F05138',
    Dockerfile: '#384d54', MDX: '#fcb32c', Markdown: '#083fa1'
  };

  function langColor(name) {
    return LANG_COLORS[name] || '#888888';
  }

  function renderLangBar(card, langs) {
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const entries = Object.entries(langs)
      .map(([name, bytes]) => ({ name, pct: (bytes / total * 100) }))
      .sort((a, b) => b.pct - a.pct);

    const bar = card.querySelector('.lang-bar');
    const list = card.querySelector('.lang-list');
    if (!bar || !list) return;

    bar.innerHTML = entries.map(e =>
      `<div class="lang-bar-seg" style="width:${e.pct.toFixed(1)}%;background:${langColor(e.name)};"></div>`
    ).join('');

    list.innerHTML = entries.map(e =>
      `<li class="lang-item"><span class="lang-dot" style="background:${langColor(e.name)};"></span><span class="lang-name">${e.name}</span><span class="lang-pct">${e.pct.toFixed(1)}%</span></li>`
    ).join('');
  }

  document.querySelectorAll('.project-card[data-github-repo]').forEach(function (card) {
    const repo = card.dataset.githubRepo;
    fetch(`https://api.github.com/repos/${repo}/languages`, { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) renderLangBar(card, data); })
      .catch(function () {});
  });
})();
