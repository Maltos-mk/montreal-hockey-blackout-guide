const g = { vs: "vs Toronto Maple Leafs" };
const t = (str) => "Maple Leafs de Toronto";
const out = `${t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) ? (g.vs.startsWith('vs ') ? 'vs ' : '@ ') + t(g.vs.replace('vs ', '').replace('@ ', '').replace(' (Split Squad)', '')) + (g.vs.includes('Split Squad') ? ' (' + t('Split Squad') + ')' : '') : g.vs}`;
console.log(out);
