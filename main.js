(async function () {
  const list = document.getElementById('post-list');
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
