(async function () {
  const list = document.getElementById('post-list');
  const calendar = document.getElementById('github-calendar');
  const myTimeElement = document.getElementById('my-time');
  const yourTimeElement = document.getElementById('your-time');
  const yourTimezoneElement = document.getElementById('your-timezone');
  const yourTimeLabelElement = document.getElementById('your-time-label');
  const ukTimezone = 'Europe/London';
  const timeTickIntervalMs = 1000;
  let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
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

  function getActivityRange(today = new Date()) {
    const end = toUtcDate(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    const start = toUtcDate(end.getUTCFullYear() - 1, end.getUTCMonth(), 1);
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

    return days;
  }

  function buildActivityMatrix(days, start, end) {
    const renderStart = addUtcDays(start, -getMondayBasedDayIndex(start));
    const renderEnd = addUtcDays(end, 6 - getMondayBasedDayIndex(end));
    const dayMap = new Map(days.map((entry) => [entry.date, entry]));
    const weeks = [];

    for (let cursor = new Date(renderStart); cursor <= renderEnd;) {
      const week = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const key = toIsoDate(cursor);
        const entry = dayMap.get(key);

        if (entry) {
          week.push({ ...entry, isPadding: false });
        } else {
          week.push({
            date: key,
            count: 0,
            level: 0,
            isPadding: true
          });
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
      { label: 'Wed', row: 3 },
      { label: 'Fri', row: 5 }
    ];

    const monthMarkup = monthLabels.map((item) => `
      <span class="activity-month" style="grid-column:${item.weekIndex};">${item.label}</span>
    `).join('');

    const gridMarkup = weeks.map((week) => week.map((day) => {
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    if (!yourTimezoneElement && !yourTimeLabelElement) return;

    try {
      const response = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('location fetch failed');
      }

      const data = await response.json();
      if (data.success && data.timezone && data.timezone.id) {
        userTimezone = data.timezone.id;

        const locationBits = [data.city, data.country].filter(Boolean);
        if (yourTimeLabelElement && locationBits.length > 0) {
          yourTimeLabelElement.textContent = `Your time (${locationBits.join(', ')})`;
        }
      }
    } catch {
      // Keep browser timezone fallback if location lookup fails.
    } finally {
      if (yourTimezoneElement) {
        yourTimezoneElement.textContent = userTimezone;
      }
      renderTimeSection();
    }
  }

  if (myTimeElement || yourTimeElement) {
    renderTimeSection();
    window.setInterval(renderTimeSection, timeTickIntervalMs);
    await detectUserTimeFromLocation();
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
    await refreshActivityCalendar();
    scheduleActivityRefreshOnTheHour();
  }

  if (!list) return;

  try {
    const rssUrl = 'https://gekkzzz.substack.com/feed';
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
      list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
      return;
    }

    list.innerHTML = data.items.slice(0, 5).map(post => `
      <li>
        <span class="post-date">${escapeHtml(formatDate(post.pubDate))}</span>
        <a href="${safeUrl(post.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.title)}</a>
      </li>
    `).join('');
  } catch {
    list.innerHTML = '<li class="post-empty">Nothing to see yet&hellip;</li>';
  }
})();
