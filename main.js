(async function () {
  const list = document.getElementById('post-list');
  const calendar = document.getElementById('github-calendar');

  function cleanupCalendar(container) {
    const removableTexts = new Set([
      'Skip to contributions year list',
      'Contribution Graph'
    ]);

    container.querySelectorAll('*').forEach((element) => {
      const text = element.textContent ? element.textContent.trim() : '';
      if (!text) return;

      if (removableTexts.has(text)) {
        element.remove();
        return;
      }

      const children = Array.from(element.children);
      if (!children.length) return;

      const isYearOnlyGroup = children.every((child) => /^\d{4}$/.test(child.textContent.trim()));
      if (isYearOnlyGroup) {
        element.remove();
      }
    });
  }

  if (calendar && typeof window.GitHubCalendar === 'function') {
    window.GitHubCalendar(calendar, 'gekkzzz', {
      responsive: true,
      global_stats: false,
      tooltips: false,
      summary_text: ''
    }).then(() => {
      cleanupCalendar(calendar);
      window.requestAnimationFrame(() => cleanupCalendar(calendar));
    }).catch(() => {
      calendar.textContent = 'Activity unavailable right now.';
    });
  } else if (calendar) {
    calendar.textContent = 'Activity unavailable right now.';
  }

  if (!list) return;

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
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

  try {
    const rssUrl = 'https://gekkzzz.substack.com/feed';
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
      list.innerHTML = '<li class="post-empty">Nothing to see yet!</li>';
      return;
    }

    list.innerHTML = data.items.slice(0, 5).map(post => `
      <li>
        <span class="post-date">${escapeHtml(formatDate(post.pubDate))}</span>
        <a href="${safeUrl(post.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.title)}</a>
      </li>
    `).join('');
  } catch {
    list.innerHTML = '<li class="post-empty">Nothing to see yet!</li>';
  }
})();
