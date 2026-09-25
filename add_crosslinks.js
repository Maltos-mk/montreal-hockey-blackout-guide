const fs = require('fs');

function insertCrosslink(filePath, linkHtml) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const target = '<!-- Statutory Amazon Associate Disclosure -->';
  const replacement = linkHtml + '\n\n      ' + target;
  if (!html.includes(target)) {
    console.error("Could not find target in " + filePath);
  }
  html = html.replace(target, replacement);
  fs.writeFileSync(filePath, html);
}

const mtlLink = `<!-- Other Teams -->
      <div class="py-2 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span class="font-semibold text-slate-600 dark:text-slate-400"><i class="fa-solid fa-map-location-dot mr-1"></i> More Regional Guides:</span>
        <a href="https://maltos-mk.github.io/toronto-hockey-blackout-guide/" data-umami-event="crosslink-tor" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 transition font-bold">Toronto Maple Leafs</a>
      </div>`;

const torLink = `<!-- Other Teams -->
      <div class="py-2 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span class="font-semibold text-slate-600 dark:text-slate-400"><i class="fa-solid fa-map-location-dot mr-1"></i> More Regional Guides:</span>
        <a href="https://maltos-mk.github.io/montreal-hockey-blackout-guide/" data-umami-event="crosslink-mtl" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 transition font-bold">Montreal Canadiens</a>
      </div>`;

insertCrosslink('teams/montreal/index.html', mtlLink);
insertCrosslink('teams/toronto/index.html', torLink);
