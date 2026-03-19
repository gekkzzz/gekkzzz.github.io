(async function () {
  const list = document.getElementById('post-list');
  const calendar = document.getElementById('github-calendar');
  const myTimeElement = document.getElementById('my-time');
  const yourTimeElement = document.getElementById('your-time');
  const yourTimezoneElement = document.getElementById('your-timezone');
  const yourTimeLabelElement = document.getElementById('your-time-label');
  const pageLoaderElement = document.getElementById('page-loader');
  const loaderElement = pageLoaderElement ? pageLoaderElement.querySelector('.loader') : null;
  const loaderSkipNavigationKey = 'gekkzzz.site-loader.skip-next-nav';
  const cookieConsentKey = 'gekkzzz-cookie-consent';
  const minLoaderDurationMs = 3000;
  const maxLoaderDurationMs = 7000;
  const loaderFadeDurationMs = 420;
  const loaderFullHoldDurationMs = 1000;
  const loaderDoneHoldDurationMs = 2000;
  const loaderFinishTimeoutMs = 900;
  const loaderStartTimestamp = Date.now();
  let hasHiddenLoader = false;
  let hasStartedLoaderFinish = false;
  let hasStartedLoaderCompletion = false;
  let hasShownLoaderDone = false;
  const ukTimezone = 'Europe/London';
  const timeTickIntervalMs = 1000;
  let userTimezone = 'UTC'; // Will be detected later after getCanonicalTimezone is defined
  const activityUsername = 'gekkzzz';
  const activityApiBase = 'https://github-contributions-api.jogruber.de/v4/';
  const activityRefreshIntervalMs = 60 * 60 * 1000;
  let isRefreshingActivity = false;
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC'
  });
  const accessibleDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  const msPerDay = 24 * 60 * 60 * 1000;
  const timezoneAliases = {
    'africa/asmera': 'Africa/Asmara',
    'africa/timbuktu': 'Africa/Bamako',
    'america/atka': 'America/Adak',
    'america/buenos_aires': 'America/Argentina/Buenos_Aires',
    'america/catamarca': 'America/Argentina/Catamarca',
    'america/cordoba': 'America/Argentina/Cordoba',
    'america/fort_wayne': 'America/Indiana/Indianapolis',
    'america/indianapolis': 'America/Indiana/Indianapolis',
    'america/jujuy': 'America/Argentina/Jujuy',
    'america/knox_in': 'America/Indiana/Knox',
    'america/louisville': 'America/Kentucky/Louisville',
    'america/mendoza': 'America/Argentina/Mendoza',
    'america/porto_acre': 'America/Rio_Branco',
    'america/rosario': 'America/Argentina/Cordoba',
    'america/shiprock': 'America/Denver',
    'asia/ashkhabad': 'Asia/Ashgabat',
    'asia/calcutta': 'Asia/Kolkata',
    'asia/chongqing': 'Asia/Shanghai',
    'asia/chungking': 'Asia/Shanghai',
    'asia/dacca': 'Asia/Dhaka',
    'asia/harbin': 'Asia/Shanghai',
    'asia/katmandu': 'Asia/Kathmandu',
    'asia/ujung_pandang': 'Asia/Makassar',
    'asia/macao': 'Asia/Macau',
    'asia/rangoon': 'Asia/Yangon',
    'asia/saigon': 'Asia/Ho_Chi_Minh',
    'asia/tel_aviv': 'Asia/Jerusalem',
    'asia/thimbu': 'Asia/Thimphu',
    'asia/ulan_bator': 'Asia/Ulaanbaatar',
    'asia/kashgar': 'Asia/Urumqi',
    'atlantic/faeroe': 'Atlantic/Faroe',
    'australia/act': 'Australia/Sydney',
    'australia/canberra': 'Australia/Sydney',
    'australia/lhi': 'Australia/Lord_Howe',
    'australia/nsw': 'Australia/Sydney',
    'australia/north': 'Australia/Darwin',
    'australia/queensland': 'Australia/Brisbane',
    'australia/south': 'Australia/Adelaide',
    'australia/tasmania': 'Australia/Hobart',
    'australia/victoria': 'Australia/Melbourne',
    'australia/west': 'Australia/Perth',
    'australia/yancowinna': 'Australia/Broken_Hill',
    'brazil/acre': 'America/Rio_Branco',
    'brazil/denoronha': 'America/Noronha',
    'brazil/east': 'America/Sao_Paulo',
    'brazil/west': 'America/Manaus',
    'canada/atlantic': 'America/Halifax',
    'canada/central': 'America/Winnipeg',
    'canada/eastern': 'America/Toronto',
    'canada/mountain': 'America/Edmonton',
    'canada/newfoundland': 'America/St_Johns',
    'canada/pacific': 'America/Vancouver',
    'europe/belfast': 'Europe/London',
    'europe/kiev': 'Europe/Kyiv',
    'europe/tiraspol': 'Europe/Chisinau',
    'europe/uzhgorod': 'Europe/Kyiv',
    'europe/zaporozhye': 'Europe/Kyiv',
    'mexico/bajanorte': 'America/Tijuana',
    'mexico/bajasur': 'America/Mazatlan',
    'mexico/general': 'America/Mexico_City',
    'pacific/johnston': 'Pacific/Honolulu',
    'pacific/ponape': 'Pacific/Pohnpei',
    'pacific/samoa': 'Pacific/Pago_Pago',
    'pacific/truk': 'Pacific/Chuuk',
    'pacific/yap': 'Pacific/Chuuk',
    'us/alaska': 'America/Anchorage',
    'us/aleutian': 'America/Adak',
    'us/arizona': 'America/Phoenix',
    'us/central': 'America/Chicago',
    'us/east-indiana': 'America/Indiana/Indianapolis',
    'us/eastern': 'America/New_York',
    'us/hawaii': 'Pacific/Honolulu',
    'us/indiana-starke': 'America/Indiana/Knox',
    'us/michigan': 'America/Detroit',
    'us/mountain': 'America/Denver',
    'us/pacific': 'America/Los_Angeles',
    'us/samoa': 'Pacific/Pago_Pago',
    'etc/greenwich': 'Etc/GMT',
    'etc/uct': 'Etc/UTC',
    'etc/universal': 'Etc/UTC',
    'etc/zulu': 'Etc/UTC',
    'gmt0': 'Etc/GMT',
    'greenwich': 'Etc/GMT',
    'hongkong': 'Asia/Hong_Kong',
    'iceland': 'Atlantic/Reykjavik',
    'iran': 'Asia/Tehran',
    'israel': 'Asia/Jerusalem',
    'jamaica': 'America/Jamaica',
    'japan': 'Asia/Tokyo',
    'kwajalein': 'Pacific/Kwajalein',
    'libya': 'Africa/Tripoli',
    'nz': 'Pacific/Auckland',
    'nz-chat': 'Pacific/Chatham',
    'poland': 'Europe/Warsaw',
    'portugal': 'Europe/Lisbon',
    'prc': 'Asia/Shanghai',
    'roc': 'Asia/Taipei',
    'singapore': 'Asia/Singapore',
    'turkey': 'Europe/Istanbul',
    'w-su': 'Europe/Moscow'
  };
  const offsetTimezoneFallbacks = {
    '+0330': 'Asia/Tehran',
    '+0430': 'Asia/Kabul',
    '+0530': 'Asia/Kolkata',
    '+0545': 'Asia/Kathmandu',
    '+0630': 'Asia/Yangon',
    '+0845': 'Australia/Eucla',
    '+0930': 'Australia/Darwin',
    '+1030': 'Australia/Lord_Howe',
    '+1245': 'Pacific/Chatham',
    '-0330': 'America/St_Johns'
  };
  const supportedTimezoneMaps = (() => {
    if (typeof Intl.supportedValuesOf !== 'function') return null;

    try {
      const byLower = new Map();
      const byCompact = new Map();
      const byCityCompact = new Map();
      const supportedZones = Intl.supportedValuesOf('timeZone');

      for (const zone of supportedZones) {
        const lowerZone = zone.toLowerCase();
        const compactZone = lowerZone.replace(/[^a-z0-9]/g, '');
        const zoneParts = lowerZone.split('/');
        const cityPart = zoneParts[zoneParts.length - 1] || '';
        const compactCity = cityPart.replace(/[^a-z0-9]/g, '');

        byLower.set(lowerZone, zone);

        if (!byCompact.has(compactZone)) {
          byCompact.set(compactZone, zone);
        }

        if (compactCity) {
          if (!byCityCompact.has(compactCity)) {
            byCityCompact.set(compactCity, zone);
          } else if (byCityCompact.get(compactCity) !== zone) {
            byCityCompact.set(compactCity, null);
          }
        }
      }

      return { byLower, byCompact, byCityCompact };
    } catch {
      return null;
    }
  })();

  function getCompactTimezoneKey(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function normalizeTimezoneToken(value) {
    return value
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s+/g, '_')
      .trim();
  }

  function parseUtcOffsetTimezone(rawTimezone) {
    if (typeof rawTimezone !== 'string') return null;

    const trimmed = rawTimezone.trim();
    if (!trimmed) return null;

    const utcMatch = trimmed.match(/^(?:UTC|GMT)?\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
    if (!utcMatch) {
      if (/^(?:UTC|GMT|Z)$/i.test(trimmed)) {
        return 'UTC';
      }

      return null;
    }

    const sign = utcMatch[1];
    const hours = Number(utcMatch[2]);
    const minutes = Number(utcMatch[3] || '0');

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 14 || minutes > 59) {
      return null;
    }

    const offsetKey = `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
    if (minutes !== 0) {
      return offsetTimezoneFallbacks[offsetKey] || null;
    }

    if (hours === 0) {
      return 'Etc/GMT';
    }

    const etcSign = sign === '+' ? '-' : '+';
    return `Etc/GMT${etcSign}${hours}`;
  }

  function getTimezoneTokens(timezone) {
    if (typeof timezone !== 'string') return [];

    const strippedTimezone = timezone
      .replace(/\((?:[^)(]|\([^)(]*\))*\)/g, ' ')
      .trim();

    if (!strippedTimezone) return [];

    const parts = strippedTimezone
      .split(/[|,;]/)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts : [strippedTimezone];
  }

  function setLoaderSkipForNextNavigation() {
    try {
      window.sessionStorage.setItem(loaderSkipNavigationKey, '1');
    } catch {
      // Ignore storage failures and keep loader functional.
    }
  }

  function consumeLoaderSkipForNavigation() {
    try {
      const shouldSkip = window.sessionStorage.getItem(loaderSkipNavigationKey) === '1';

      if (shouldSkip) {
        window.sessionStorage.removeItem(loaderSkipNavigationKey);
      }

      return shouldSkip;
    } catch {
      return false;
    }
  }

  function normalizeCookieConsentValue(value) {
    return value === 'accept' || value === 'reject' ? value : null;
  }

  function getCookieValue(name) {
    const encodedName = encodeURIComponent(name);
    const prefix = `${encodedName}=`;
    const cookieParts = document.cookie ? document.cookie.split('; ') : [];

    for (const cookiePart of cookieParts) {
      if (!cookiePart.startsWith(prefix)) continue;
      return decodeURIComponent(cookiePart.slice(prefix.length));
    }

    return null;
  }

  function setCookieValue(name, value, maxAgeSeconds) {
    const encodedName = encodeURIComponent(name);
    const encodedValue = encodeURIComponent(value);
    const maxAge = Number.isFinite(maxAgeSeconds)
      ? Math.max(0, Math.floor(maxAgeSeconds))
      : 0;

    document.cookie = `${encodedName}=${encodedValue}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  function getLocalCookieConsent() {
    try {
      return normalizeCookieConsentValue(window.localStorage.getItem(cookieConsentKey));
    } catch {
      return null;
    }
  }

  function setLocalCookieConsent(value) {
    try {
      window.localStorage.setItem(cookieConsentKey, value);
    } catch {
      // Ignore storage failures; cookie remains source of truth.
    }
  }

  function clearLocalCookieConsent() {
    try {
      window.localStorage.removeItem(cookieConsentKey);
    } catch {
      // Ignore storage failures.
    }
  }

  function getCookieConsent() {
    const consentFromCookie = normalizeCookieConsentValue(getCookieValue(cookieConsentKey));
    const consentFromStorage = getLocalCookieConsent();

    if (!consentFromCookie && consentFromStorage) {
      // If consent cookie is missing, treat consent as reset and clear stale local storage.
      clearLocalCookieConsent();
      return null;
    }

    if (consentFromCookie && consentFromStorage !== consentFromCookie) {
      setLocalCookieConsent(consentFromCookie);
    }

    return consentFromCookie;
  }

  function setCookieConsent(value) {
    const consent = normalizeCookieConsentValue(value);
    const oneYearInSeconds = 60 * 60 * 24 * 365;

    if (!consent) {
      setCookieValue(cookieConsentKey, '', 0);
      clearLocalCookieConsent();
      return;
    }

    setCookieValue(cookieConsentKey, consent, oneYearInSeconds);
    setLocalCookieConsent(consent);
  }

  function markInternalPageNavigations() {
    const anchors = document.querySelectorAll('a[href]');
    if (!anchors.length) return;

    const currentUrl = new URL(window.location.href);

    anchors.forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (anchor.target && anchor.target.toLowerCase() !== '_self') return;
        if (anchor.hasAttribute('download')) return;

        const rawHref = anchor.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#')) return;

        let destination;

        try {
          destination = new URL(anchor.href, window.location.href);
        } catch {
          return;
        }

        if (!/^https?:$/.test(destination.protocol)) return;
        if (destination.origin !== currentUrl.origin) return;

        const isSameDocument = destination.pathname === currentUrl.pathname
          && destination.search === currentUrl.search;

        if (isSameDocument) return;

        setLoaderSkipForNextNavigation();
      });
    });
  }

  function disablePageLoaderImmediately() {
    if (pageLoaderElement && pageLoaderElement.parentElement) {
      pageLoaderElement.parentElement.removeChild(pageLoaderElement);
    }

    document.body.classList.remove('is-site-loading');
  }

  function showLoaderDoneState() {
    if (!pageLoaderElement || hasShownLoaderDone || hasHiddenLoader) return;

    hasShownLoaderDone = true;
    pageLoaderElement.classList.add('is-complete');

    window.setTimeout(hidePageLoader, loaderDoneHoldDurationMs);
  }

  function completePageLoader() {
    if (!pageLoaderElement || hasStartedLoaderCompletion || hasHiddenLoader) return;

    hasStartedLoaderCompletion = true;
    pageLoaderElement.classList.add('is-full');

    window.setTimeout(showLoaderDoneState, loaderFullHoldDurationMs);
  }

  function hidePageLoader() {
    if (!pageLoaderElement || hasHiddenLoader) return;

    hasHiddenLoader = true;
    pageLoaderElement.classList.add('is-hidden');

    window.setTimeout(() => {
      document.body.classList.remove('is-site-loading');

      if (pageLoaderElement.parentElement) {
        pageLoaderElement.parentElement.removeChild(pageLoaderElement);
      }

      // Show cookie banner after loader is hidden if consent not yet given
      const cookieConsent = getCookieConsent();
      if (!cookieConsent && (myTimeElement || yourTimeElement)) {
        showCookieBanner();
      }
    }, loaderFadeDurationMs);
  }

  function createCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <p class="cookie-banner-message">I use some non-essential cookies to power a few extra features and make the site look and feel better. Your call!</p>
      <div class="cookie-banner-buttons">
        <button id="cookie-accept-btn" class="cookie-btn cookie-btn-accept">Accept</button>
        <button id="cookie-reject-btn" class="cookie-btn cookie-btn-reject">Reject</button>
        <a href="/cookies" class="cookie-btn" style="text-decoration: none; line-height: 1;">Cookie Policy</a>
      </div>
    `;
    return banner;
  }

  function showCookieBanner() {
    const existingBanner = document.getElementById('cookie-banner');
    if (existingBanner) return;

    const banner = createCookieBanner();
    document.body.appendChild(banner);

    const acceptBtn = banner.querySelector('#cookie-accept-btn');
    const rejectBtn = banner.querySelector('#cookie-reject-btn');

    acceptBtn.addEventListener('click', () => {
      setCookieConsent('accept');
      banner.classList.add('hidden');
      // Immediately detect location and update time display
      detectUserTimeFromLocation();
    });

    rejectBtn.addEventListener('click', () => {
      setCookieConsent('reject');
      banner.classList.add('hidden');
    });
  }

  function startPageLoaderFinish() {
    if (!pageLoaderElement || hasHiddenLoader || hasStartedLoaderFinish) return;

    hasStartedLoaderFinish = true;
    pageLoaderElement.classList.add('is-finishing');

    if (loaderElement) {
      loaderElement.addEventListener('animationiteration', completePageLoader, { once: true });
    }

    window.setTimeout(() => {
      if (!hasStartedLoaderCompletion && !hasHiddenLoader) {
        completePageLoader();
      }
    }, loaderFinishTimeoutMs);
  }

  function queuePageLoaderFinish() {
    if (!pageLoaderElement || hasHiddenLoader || hasStartedLoaderFinish) return;

    const elapsed = Date.now() - loaderStartTimestamp;
    const remaining = Math.max(0, minLoaderDurationMs - elapsed);
    window.setTimeout(startPageLoaderFinish, remaining);
  }

  markInternalPageNavigations();
  const shouldSkipLoaderForInternalNavigation = consumeLoaderSkipForNavigation();
  const shouldRunPageLoader = Boolean(pageLoaderElement) && !shouldSkipLoaderForInternalNavigation;

  if (shouldRunPageLoader) {

    // Prevent the loader from getting stuck if onload does not fire as expected.
    window.setTimeout(startPageLoaderFinish, maxLoaderDurationMs);

    if (document.readyState === 'complete') {
      queuePageLoaderFinish();
    } else {
      window.addEventListener('load', queuePageLoaderFinish, { once: true });
    }
  } else {
    disablePageLoaderImmediately();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function escapeAttribute(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function toUtcDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  function parseIsoDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return toUtcDate(year, month - 1, day);
  }

  function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addUtcDays(date, amount) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + amount);
    return next;
  }

  function getMondayBasedDayIndex(date) {
    return (date.getUTCDay() + 6) % 7;
  }

  function clampLevel(level) {
    const numericLevel = Number(level);
    if (!Number.isFinite(numericLevel)) return 0;
    return Math.max(0, Math.min(4, numericLevel));
  }

  function recomputeLevels(days) {
    const max = Math.max(0, ...days.map(d => d.count));
    if (max === 0) return days;

    return days.map(d => {
      if (d.count === 0) return { ...d, level: 0 };
      return { ...d, level: Math.ceil((d.count / max) * 4) };
    });
  }

  function getActivityRange(today = new Date()) {
    const end = toUtcDate(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    const start = toUtcDate(today.getUTCFullYear(), 0, 1);
    return { start, end };
  }

  async function fetchActivityDays(username, start, end, hourBucket) {
    const years = Array.from(new Set([
      start.getUTCFullYear(),
      end.getUTCFullYear()
    ]));

    const payloads = await Promise.all(years.map(async (year) => {
      const params = new URLSearchParams({
        y: String(year),
        cb: String(hourBucket)
      });
      const response = await fetch(`${activityApiBase}${encodeURIComponent(username)}?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('activity fetch failed');
      }

      return response.json();
    }));

    const dayMap = new Map();

    payloads.forEach((payload) => {
      if (!Array.isArray(payload.contributions)) return;

      payload.contributions.forEach((entry) => {
        if (!entry || !entry.date) return;

        dayMap.set(entry.date, {
          count: Number(entry.count) || 0,
          level: clampLevel(entry.level)
        });
      });
    });

    const days = [];

    for (let cursor = new Date(start); cursor <= end; cursor = addUtcDays(cursor, 1)) {
      const key = toIsoDate(cursor);
      const entry = dayMap.get(key) || { count: 0, level: 0 };

      days.push({
        date: key,
        count: entry.count,
        level: entry.level
      });
    }

    return recomputeLevels(days);
  }

  function buildActivityMatrix(days, start, end) {
    const renderStart = addUtcDays(start, -getMondayBasedDayIndex(start));
    const renderEnd = addUtcDays(end, 6 - getMondayBasedDayIndex(end));
    const endTime = end.getTime();
    const dayMap = new Map(days.map((entry) => [entry.date, entry]));
    const weeks = [];

    for (let cursor = new Date(renderStart); cursor <= renderEnd;) {
      const week = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
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

      labels.push({
        label: monthFormatter.format(cursor),
        weekIndex: Math.floor(offset / 7) + 1
      });
    }

    return labels;
  }

  function renderActivityCalendar(container, days, start, end) {
    const { weeks, renderStart } = buildActivityMatrix(days, start, end);
    const monthLabels = buildMonthLabels(start, end, renderStart);
    const totalContributions = days.reduce((sum, day) => sum + day.count, 0);
    const visibleRange = `${monthFormatter.format(start)} ${start.getUTCFullYear()} to ${monthFormatter.format(end)} ${end.getUTCFullYear()}`;
    const weekdayLabels = [
      { label: 'Mon', row: 1 },
      { label: 'Tue', row: 2 },
      { label: 'Wed', row: 3 },
      { label: 'Thu', row: 4 },
      { label: 'Fri', row: 5 },
      { label: 'Sat', row: 6 },
      { label: 'Sun', row: 7 }
    ];

    const monthMarkup = monthLabels.map((item) => `
      <span class="activity-month" style="grid-column:${item.weekIndex};">${item.label}</span>
    `).join('');

    const gridMarkup = weeks.map((week) => week.map((day) => {
      if (day.isFuture) {
        return '<span class="activity-cell activity-cell-future" aria-hidden="true"></span>';
      }

      if (day.isPadding) {
        return '<span class="activity-cell activity-level-0 activity-cell-padding" aria-hidden="true"></span>';
      }

      const description = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${accessibleDateFormatter.format(parseIsoDate(day.date))}`;

      return `
        <span
          class="activity-cell activity-level-${day.level}"
          role="gridcell"
          aria-label="${escapeAttribute(description)}"
          title="${escapeAttribute(description)}"
        ></span>
      `;
    }).join('')).join('');

    container.innerHTML = `
      <div class="activity-calendar" style="--weeks:${weeks.length};">
        <div class="activity-month-row">
          <div class="activity-month-spacer" aria-hidden="true"></div>
          <div class="activity-months" aria-hidden="true">${monthMarkup}</div>
        </div>
        <div class="activity-grid-row">
          <div class="activity-weekdays" aria-hidden="true">
            ${weekdayLabels.map((item) => `<span style="grid-row:${item.row};">${item.label}</span>`).join('')}
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

  function formatClockTime(date, timezone) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    }
  }

  function getCanonicalTimezone(timezone) {
    const timezoneTokens = getTimezoneTokens(timezone);

    for (const token of timezoneTokens) {
      const normalizedToken = normalizeTimezoneToken(token);
      if (!normalizedToken) continue;

      const timezoneCandidates = [];
      const addCandidate = (candidate) => {
        if (!candidate) return;
        if (!timezoneCandidates.includes(candidate)) {
          timezoneCandidates.push(candidate);
        }
      };

      addCandidate(normalizedToken);

      const aliasTimezone = timezoneAliases[normalizedToken.toLowerCase()];
      addCandidate(aliasTimezone);

      const offsetTimezone = parseUtcOffsetTimezone(token);
      addCandidate(offsetTimezone);

      if (supportedTimezoneMaps) {
        for (const candidate of timezoneCandidates) {
          const directMatch = supportedTimezoneMaps.byLower.get(candidate.toLowerCase());
          if (directMatch) return directMatch;
        }

        for (const candidate of timezoneCandidates) {
          const compactMatch = supportedTimezoneMaps.byCompact.get(getCompactTimezoneKey(candidate));
          if (compactMatch) return compactMatch;
        }

        if (!normalizedToken.includes('/')) {
          const cityMatch = supportedTimezoneMaps.byCityCompact.get(getCompactTimezoneKey(normalizedToken));
          if (cityMatch) return cityMatch;
        }
      }

      for (const candidate of timezoneCandidates) {
        try {
          const resolvedTimezone = new Intl.DateTimeFormat('en-GB', { timeZone: candidate })
            .resolvedOptions()
            .timeZone;
          return resolvedTimezone || candidate;
        } catch {
          // Try next candidate.
        }
      }
    }

    return null;
  }

  function isValidTimezone(timezone) {
    return Boolean(getCanonicalTimezone(timezone));
  }

  // Initialize user timezone from device now that getCanonicalTimezone is available
  userTimezone = getCanonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';

  function normalizeLocationPayload(payload) {
    if (!payload || payload.success === false) return null;

    const payloadTimezone = payload.timezone || payload.timeZone || payload.time_zone || payload.tz;
    const rawTimezone = payloadTimezone
      ? (typeof payloadTimezone === 'string'
        ? payloadTimezone
        : payloadTimezone.id || payloadTimezone.name || payloadTimezone.timezone || payloadTimezone.value)
      : null;
    const timezone = getCanonicalTimezone(rawTimezone);

    const city = payload.city || null;
    const countryCode = payload.country_code
      || (typeof payload.country === 'string' && payload.country.length === 2 ? payload.country : null)
      || null;
    const country = payload.country_name || payload.country || null;

    return { timezone, city, countryCode, country };
  }

  function renderTimeSection() {
    if (!myTimeElement && !yourTimeElement) return;

    const now = new Date();

    if (myTimeElement) {
      myTimeElement.textContent = formatClockTime(now, ukTimezone);
    }

    if (yourTimeElement) {
      yourTimeElement.textContent = formatClockTime(now, userTimezone);
    }
  }

  async function detectUserTimeFromLocation() {
    // Surface immediate fallback copy while location APIs resolve.
    if (yourTimezoneElement) {
      yourTimezoneElement.textContent = 'Local device';
    }
    renderTimeSection();

    const locationEndpoints = [
      'https://ipwho.is/?fields=success,city,country,country_code,timezone',
      'https://ipinfo.io/json'
    ];

    for (const endpoint of locationEndpoints) {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) continue;

        const payload = await response.json();
        const data = normalizeLocationPayload(payload);
        if (!data) continue;

        const hasValidTimezone = Boolean(data.timezone);

        if (hasValidTimezone) {
          userTimezone = data.timezone;
        }

        const locationBits = [data.city, data.countryCode || data.country].filter(Boolean);
        if (yourTimezoneElement && locationBits.length > 0) {
          yourTimezoneElement.textContent = locationBits.join(', ');
        }

        if (yourTimeLabelElement && locationBits.length > 0) {
          yourTimeLabelElement.textContent = `Your time (${locationBits.join(', ')})`;
        }

        if (hasValidTimezone || locationBits.length > 0) {
          break;
        }
      } catch {
        // Try the next provider if this one fails.
      }
    }

    renderTimeSection();
  }

  if (myTimeElement || yourTimeElement) {
    renderTimeSection();
    window.setInterval(renderTimeSection, timeTickIntervalMs);
    // Only do IP lookup if consent is given
    const cookieConsent = getCookieConsent();
    if (cookieConsent === 'accept') {
      // Defer to next tick so this function returns immediately
      Promise.resolve().then(() => detectUserTimeFromLocation()).catch(() => {});
    }
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
      calendar.textContent = 'Activity unavailable right now.';
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
    // Defer to next tick so this function returns immediately
    Promise.resolve().then(() => refreshActivityCalendar()).catch(() => {});
    scheduleActivityRefreshOnTheHour();
  }

  if (list) {
    // Defer to next tick so this function returns immediately
    Promise.resolve().then(async () => {
      try {
        const rssUrl = 'https://gekkzzz.substack.com/feed';
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rssUrl);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('fetch failed');
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        const items = Array.from(xml.getElementsByTagName('item')).slice(0, 3);

        if (items.length === 0) {
          list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
          return;
        }

        list.innerHTML = items.map(item => {
          const title = item.getElementsByTagName('title')[0]?.textContent || '';
          const link = item.getElementsByTagName('link')[0]?.textContent
            || item.getElementsByTagName('guid')[0]?.textContent || '';
          const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
          return `
          <li>
            <span class="post-date">${escapeHtml(formatDate(pubDate))}</span>
            <a href="${safeUrl(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
          </li>
        `;
        }).join('');
      } catch {
        list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
      }
    }).catch(() => {});
  }
})();
