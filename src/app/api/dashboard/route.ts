import { NextRequest, NextResponse } from 'next/server';

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Open Brain — Agent Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: { brain: { 50:'#f0f4ff',100:'#dbe4ff',200:'#bac8ff',300:'#91a7ff',400:'#748ffc',500:'#5c7cfa',600:'#4c6ef5',700:'#4263eb',800:'#3b5bdb',900:'#364fc7' } }
    }
  }
}
</script>
<style>
@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.card { animation:fadeIn 0.3s ease-out; }
.skeleton { background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:0.5rem; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
</style>
</head>
<body class="min-h-screen bg-gray-50">
<div class="max-w-6xl mx-auto p-4 sm:p-6">
  <header class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Open Brain</h1>
      <p class="text-sm text-gray-500" id="statusLine">Agent dashboard</p>
    </div>
    <div class="flex gap-2">
      <a href="/api/agent/status" class="text-sm text-brain-600 hover:underline" target="_blank">API</a>
      <span class="text-gray-300">|</span>
      <button onclick="refreshAll()" class="text-sm text-brain-600 hover:underline">Refresh</button>
    </div>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" id="statCards">
    <div class="skeleton h-24"></div>
    <div class="skeleton h-24"></div>
    <div class="skeleton h-24"></div>
    <div class="skeleton h-24"></div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white rounded-xl shadow-sm border p-4 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Search</h2>
        <form onsubmit="doSearch(event)" class="flex gap-2">
          <input id="searchInput" type="text" placeholder="e.g. VA claim, nexus letter, tax..." class="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brain-500 focus:border-brain-500 text-sm"/>
          <button type="submit" class="px-5 py-2.5 bg-brain-600 text-white rounded-lg hover:bg-brain-700 text-sm font-medium">Search</button>
        </form>
        <div id="searchResults" class="mt-3 space-y-2"></div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-4 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Suggestions</h2>
        <div id="suggestionsList" class="space-y-2"><div class="skeleton h-16"></div><div class="skeleton h-16"></div></div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm border p-4 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Agent Status</h2>
        <div id="agentStatus"><div class="skeleton h-32"></div></div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-4 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Domains</h2>
        <div id="domainsList"><div class="skeleton h-24"></div></div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-4 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Recent Queries</h2>
        <div id="recentQueries"><div class="skeleton h-16"></div></div>
      </div>
    </div>
  </div>
</div>

<script>
const BASE = window.location.origin;

async function api(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function elapsed(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return Math.floor(days/30)+'mo ago';
  if (days > 0) return days+'d ago';
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return hrs+'h ago';
  return 'just now';
}

function renderStats(s) {
  const cards = [
    { label:'Entries', value:s.totalEntries, color:'text-brain-600', bg:'bg-brain-50' },
    { label:'Categories', value:Object.keys(s.categories||{}).length, color:'text-green-600', bg:'bg-green-50' },
    { label:'Stale', value:s.staleEntries||0, color:s.staleEntries>10?'text-red-600':'text-yellow-600', bg:s.staleEntries>10?'bg-red-50':'bg-yellow-50' },
    { label:'Avg Quality', value:s.averageQuality||'\u2014', color:'text-purple-600', bg:'bg-purple-50' },
  ];
  document.getElementById('statCards').innerHTML = cards.map(c => \`
    <div class="\${c.bg} rounded-xl p-4 border">
      <div class="text-sm \${c.color} font-medium">\${c.label}</div>
      <div class="text-2xl font-bold text-gray-900 mt-1">\${c.value}</div>
    </div>\`).join('');
}

function renderAgentStatus(s) {
  const agent = s.agent || {};
  document.getElementById('agentStatus').innerHTML = \`
    <div class="space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-gray-500">Version</span><span class="font-medium">\${s.version||'\u2014'}</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Memory</span><span class="font-medium">\${(s.memory?.totalInteractions||0)} interactions</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Integrations</span><span class="font-medium">\${Object.entries(s.integrations||{}).filter(([,v])=>v).length} active</span></div>
      \${(s.deadlines||[]).map(d => \`<div class="flex justify-between text-red-600 font-medium"><span>\u23f0 \${d.label}</span><span>\${d.daysRemaining}d</span></div>\`).join('')}
    </div>\`;
}

function renderDomains(s) {
  const perms = s.agent?.domainPermissions || [];
  document.getElementById('domainsList').innerHTML = perms.length
    ? \`<div class="space-y-1 text-sm">\${perms.map(d => \`
      <div class="flex justify-between py-1 \${!d.enabled?'opacity-40':''}">
        <span>\${d.domain}</span>
        <span class="text-gray-500">\${d.label}</span>
      </div>\`).join('')}</div>\`
    : '<p class="text-sm text-gray-400">No domain data</p>';
}

function renderRecentQueries(s) {
  const qs = s.memory?.recentQueries || [];
  document.getElementById('recentQueries').innerHTML = qs.length
    ? \`<div class="space-y-1 text-sm">\${qs.map(q => \`
      <div class="truncate"><span class="text-gray-500">\${elapsed(q.timestamp)}</span> \${q.query}</div>\`).join('')}</div>\`
    : '<p class="text-sm text-gray-400">No recent queries</p>';
}

async function renderSuggestions() {
  try {
    const data = await api('/api/agent/suggest');
    const list = document.getElementById('suggestionsList');
    if (!data.suggestions?.length) {
      list.innerHTML = '<p class="text-sm text-gray-400">No suggestions right now</p>';
      return;
    }
    const colors = { high:'text-red-600 bg-red-50 border-red-100', medium:'text-yellow-600 bg-yellow-50 border-yellow-100', low:'text-gray-600 bg-gray-50 border-gray-100' };
    list.innerHTML = data.suggestions.slice(0,5).map(s => \`
      <div class="p-3 rounded-lg border \${colors[s.priority]||colors.low}">
        <div class="text-sm font-medium">\${s.title}</div>
        <div class="text-xs opacity-75 mt-0.5">\${s.description}</div>
      </div>\`).join('');
  } catch(e) {
    document.getElementById('suggestionsList').innerHTML = '<p class="text-sm text-red-500">Failed to load</p>';
  }
}

async function doSearch(e) {
  e.preventDefault();
  const q = document.getElementById('searchInput').value;
  const el = document.getElementById('searchResults');
  if (!q.trim()) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="skeleton h-12"></div>';
  try {
    const data = await api('/api/query?q='+encodeURIComponent(q)+'&topK=5');
    if (!data.results?.length) { el.innerHTML = '<p class="text-sm text-gray-400">No results</p>'; return; }
    el.innerHTML = data.results.map(r => \`
      <div class="p-3 bg-gray-50 rounded-lg border">
        <div class="flex justify-between items-start">
          <div class="font-medium text-sm text-gray-900">\${r.title}</div>
          <span class="text-xs text-gray-400 ml-2">\${(r.score*100).toFixed(0)}%</span>
        </div>
        <div class="text-xs text-gray-500 mt-0.5">\${r.category} \u00b7 \${r.matchField} \u00b7 \${elapsed(r.created_at)}</div>
      </div>\`).join('');
  } catch(e) { el.innerHTML = '<p class="text-sm text-red-500">Error: '+e.message+'</p>'; }
}

async function refreshAll() {
  document.getElementById('statusLine').textContent = 'Loading...';
  try {
    const status = await api('/api/agent/status');
    renderStats(status.stats);
    renderAgentStatus(status);
    renderDomains(status);
    renderRecentQueries(status);
    document.getElementById('statusLine').textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch(e) {
    document.getElementById('statusLine').textContent = 'Error loading status';
  }
  renderSuggestions();
}

refreshAll();
</script>
</body>
</html>`;

export async function GET() {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html' },
  });
}
