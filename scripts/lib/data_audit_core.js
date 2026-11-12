const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const EXPECTED_REGULAR_SEASON_GAMES = 84;
const LEGACY_CA_PATHS = {
  MTL: 'data/mtl.json',
  TOR: 'data/tor.json',
  OTT: 'data/ott.json',
  VAN: 'data/van.json',
  CGY: 'data/cgy.json',
  EDM: 'data/edm.json',
  WPG: 'data/wpg.json'
};
const CA_REGIONAL_FALLBACK_EN = {
  MTL: ['TSN2'],
  TOR: ['TSN4'],
  OTT: ['TSN5'],
  VAN: ['Sportsnet Pacific'],
  CGY: ['Sportsnet West'],
  EDM: ['Sportsnet West'],
  WPG: ['TSN3']
};
const CA_REGIONAL_FALLBACK_FR = {
  MTL: ['RDS'],
  OTT: ['RDS']
};

/**
 * Load canonical broadcast alias tables from data/network_aliases.json.
 */
function loadNetworkAliases(rootDir = ROOT_DIR) {
  const aliasesPath = path.join(rootDir, 'data/network_aliases.json');
  return JSON.parse(fs.readFileSync(aliasesPath, 'utf-8'));
}

/**
 * Normalize an incoming broadcast code by trimming whitespace and coercing non-strings.
 */
function normalizeNetworkCode(rawCode) {
  return typeof rawCode === 'string' ? rawCode.trim() : '';
}

function formatEtDate(dt) {
  return dt
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    })
    .replace(/,/g, '');
}

/**
 * Classify Canadian broadcasts from a raw NHL API game object using caNetworkMap.
 * Unknown network codes are surfaced in `unknownCodes` rather than silently dropped.
 */
function classifyCaGameBroadcasts(rawGame, abbrev, aliases) {
  const caMap = aliases.caNetworkMap || {};
  const unknownCodes = [];
  const mappedNets = (rawGame.tvBroadcasts || [])
    .filter(b => b.countryCode === 'CA')
    .map(b => normalizeNetworkCode(b.network))
    .filter(Boolean)
    .map(raw => {
      if (!Object.prototype.hasOwnProperty.call(caMap, raw)) {
        unknownCodes.push(raw);
        return raw;
      }
      return caMap[raw];
    });

  if (mappedNets.includes('Prime Video')) {
    return {
      netEN: 'Prime Video',
      netFR: 'Prime Video',
      typeEN: 'national',
      typeFR: 'national',
      unknownCodes,
      usedFallbackEN: false,
      usedFallbackFR: false
    };
  }

  let enNets = mappedNets.filter(n => !n.includes('RDS') && !n.includes('TVA'));
  let frNets = mappedNets.filter(n => n.includes('RDS') || n.includes('TVA'));

  const isSaturday = formatEtDate(new Date(rawGame.startTimeUTC)).startsWith('Sat ');
  let hasNationalEN = enNets.some(n =>
    ['Sportsnet', 'Sportsnet One', 'Sportsnet 360', 'CBC', 'CityTV', 'SN+'].includes(n)
  );
  if (isSaturday && enNets.some(n => n.includes('Sportsnet'))) {
    hasNationalEN = true;
  }
  const hasNationalFR = frNets.some(n => n.includes('TVA Sports'));

  let usedFallbackEN = false;
  let usedFallbackFR = false;
  if (enNets.length === 0) {
    if (CA_REGIONAL_FALLBACK_EN[abbrev]) {
      enNets = [...CA_REGIONAL_FALLBACK_EN[abbrev]];
      usedFallbackEN = true;
    } else if (!LEGACY_CA_PATHS[abbrev]) {
      enNets = ['SN+ Premium'];
      usedFallbackEN = true;
    }
  }
  if (frNets.length === 0 && CA_REGIONAL_FALLBACK_FR[abbrev]) {
    frNets = [...CA_REGIONAL_FALLBACK_FR[abbrev]];
    usedFallbackFR = true;
  }

  return {
    netEN: [...new Set(enNets)].join(', '),
    netFR: [...new Set(frNets)].join(', '),
    typeEN: hasNationalEN ? 'national' : 'regional',
    typeFR: hasNationalFR ? 'national' : 'regional',
    unknownCodes,
    usedFallbackEN,
    usedFallbackFR
  };
}

/**
 * Classify US broadcasts from a raw NHL API game object without silent team.rsn fallbacks.
 */
function classifyUsBroadcast(rawGame, team, usTerritoriesMap = {}, aliases = null) {
  const effectiveAliases = aliases || loadNetworkAliases();
  const usNatUpper = new Set(
    (effectiveAliases.usNationalNetworks || []).map(s => String(s).toUpperCase())
  );
  const abbrev = team.abbreviation || team.id;
  const isHome = rawGame.homeTeam.abbrev === abbrev;
  const usBroadcasts = (rawGame.tvBroadcasts || [])
    .filter(b => b.countryCode === 'US')
    .map(b => ({ ...b, network: normalizeNetworkCode(b.network) }))
    .filter(b => b.network);
  const targetMarket = isHome ? 'H' : 'A';

  const nationalNetsUpper = usBroadcasts
    .filter(b => b.market === 'N' || usNatUpper.has(b.network.toUpperCase()))
    .map(b => b.network.toUpperCase());

  const localRsnBroadcasts = usBroadcasts
    .filter(b => b.market === targetMarket && !usNatUpper.has(b.network.toUpperCase()))
    .map(b => b.network);

  const anyLocalUsRsnExists = usBroadcasts.some(
    b => (b.market === 'H' || b.market === 'A') && !usNatUpper.has(b.network.toUpperCase())
  );

  const hasEspnLinear = nationalNetsUpper.includes('ESPN');
  const hasAbc = nationalNetsUpper.includes('ABC');
  const hasTnt = nationalNetsUpper.includes('TNT');
  const hasMax = nationalNetsUpper.includes('HBO MAX') || nationalNetsUpper.includes('MAX');
  const hasNhln = nationalNetsUpper.includes('NHLN');
  const hasHulu = nationalNetsUpper.includes('HULU');
  const hasDisneyPlus = nationalNetsUpper.includes('DISNEY+');
  const hasExplicitEspnPlus = nationalNetsUpper.includes('ESPN+') || hasHulu || hasDisneyPlus;

  // 1. Exclusive US National TV Game (ESPN, ABC, TNT)
  if ((hasEspnLinear || hasAbc || hasTnt) && localRsnBroadcasts.length === 0) {
    let primaryNet = 'ESPN';
    let secondaryNet = '';
    if (hasAbc) {
      primaryNet = 'ABC';
      secondaryNet = 'ESPN+';
    } else if (hasTnt) {
      primaryNet = 'TNT';
      secondaryNet = hasMax ? 'HBO MAX' : '';
    } else if (hasEspnLinear) {
      primaryNet = 'ESPN';
      secondaryNet = hasExplicitEspnPlus ? 'ESPN+' : '';
    }

    const espnPlusSimulcast = Boolean(hasAbc || hasExplicitEspnPlus);
    return {
      rsn: null,
      netUSNat: primaryNet,
      primaryNet,
      secondaryNet,
      espnPlus: espnPlusSimulcast,
      typeUS: 'national',
      coverageLabel: 'US National Exclusive',
      bannerText: espnPlusSimulcast
        ? `National Broadcast on ${primaryNet} / Simulcast on ESPN+`
        : `National TV Exclusive on ${primaryNet} (Blacked out on ESPN+ & local RSN)`
    };
  }

  // 2. Exclusive US National Streaming Game (ESPN+ / Hulu / Disney+ with no local RSN blackout)
  if (hasExplicitEspnPlus && !hasNhln && !anyLocalUsRsnExists) {
    const secondaryParts = [];
    if (hasHulu) secondaryParts.push('Hulu');
    if (hasDisneyPlus) secondaryParts.push('Disney+');
    return {
      rsn: null,
      netUSNat: 'ESPN+',
      primaryNet: 'ESPN+',
      secondaryNet: secondaryParts.join(' / '),
      espnPlus: true,
      typeUS: 'national',
      coverageLabel: 'ESPN+ / Hulu Exclusive',
      bannerText: 'National Streaming Exclusive on ESPN+ / Hulu (No local RSN blackout)'
    };
  }

  // 3. NHL Network Showcase (Local RSN in-market, NHL Network out-of-market, blacked out on ESPN+)
  if (hasNhln) {
    if (team.country === 'CA') {
      const oppAbbrev = isHome ? rawGame.awayTeam.abbrev : rawGame.homeTeam.abbrev;
      const oppInfo = usTerritoriesMap[oppAbbrev];
      const oppHasUsRsn = oppInfo && Array.isArray(oppInfo.zipRanges) && oppInfo.zipRanges.length > 0;
      const oppRsn = oppHasUsRsn ? oppInfo.rsn : null;
      return {
        rsn: oppRsn || 'NHLN',
        netUSNat: 'NHLN',
        primaryNet: 'NHLN',
        secondaryNet: oppRsn || '',
        espnPlus: false,
        typeUS: 'nhl_network',
        coverageLabel: oppRsn ? 'NHL Network / Opponent RSN' : 'NHL Network Exclusive',
        bannerText: oppRsn
          ? `National on NHL Network / Local ${oppInfo.name} market on ${oppRsn} (Blacked out on ESPN+)`
          : 'National TV Exclusive on NHL Network (Blacked out on ESPN+)'
      };
    }
    const rsnFeed = localRsnBroadcasts.length > 0 ? localRsnBroadcasts[0] : null;
    if (!rsnFeed) {
      return {
        rsn: null,
        netUSNat: 'NHLN',
        primaryNet: 'NHLN',
        secondaryNet: '',
        espnPlus: false,
        typeUS: 'nhl_network',
        coverageLabel: 'NHL Network Exclusive',
        bannerText: 'National TV Exclusive on NHL Network (Blacked out on ESPN+)'
      };
    }
    return {
      rsn: rsnFeed,
      netUSNat: 'NHLN',
      primaryNet: rsnFeed,
      secondaryNet: 'NHLN',
      espnPlus: false,
      typeUS: 'nhl_network',
      coverageLabel: 'NHL Network / Local RSN',
      bannerText: `In-market on ${rsnFeed} / Out-of-market on NHL Network (Blacked out on ESPN+)`
    };
  }

  // 4. Standard Regional Game (Local RSN in-market, ESPN+ out-of-market)
  if (team.country === 'CA') {
    const oppAbbrev = isHome ? rawGame.awayTeam.abbrev : rawGame.homeTeam.abbrev;
    const oppInfo = usTerritoriesMap[oppAbbrev];
    const oppHasUsRsn = oppInfo && Array.isArray(oppInfo.zipRanges) && oppInfo.zipRanges.length > 0;
    const oppRsn = oppHasUsRsn ? oppInfo.rsn : null;
    return {
      rsn: oppRsn || 'ESPN+',
      netUSNat: null,
      primaryNet: 'ESPN+',
      secondaryNet: oppRsn || '',
      espnPlus: true,
      typeUS: 'regional',
      coverageLabel: oppRsn ? 'ESPN+ / Opponent RSN' : 'ESPN+ Out-of-Market',
      bannerText: oppRsn
        ? `Available on ESPN+ / Subject to local RSN blackout in ${oppInfo.name} market (${oppRsn})`
        : 'Available nationwide in the US on ESPN+ (No local RSN blackout)'
    };
  }

  const rsnFeed = localRsnBroadcasts.length > 0 ? localRsnBroadcasts[0] : null;
  if (!rsnFeed) {
    return {
      rsn: null,
      netUSNat: null,
      primaryNet: 'UNAVAILABLE',
      secondaryNet: '',
      espnPlus: false,
      typeUS: 'regional',
      coverageLabel: 'Broadcast Unavailable',
      bannerText: 'Upstream US RSN feed unavailable'
    };
  }

  return {
    rsn: rsnFeed,
    netUSNat: null,
    primaryNet: rsnFeed,
    secondaryNet: 'ESPN+',
    espnPlus: true,
    typeUS: 'regional',
    coverageLabel: 'Regional RSN / ESPN+',
    bannerText: `Available on ESPN+ / Subject to local RSN blackout (${rsnFeed})`
  };
}

function auditScheduleStructure(teamLabel, schedule, validAbbrevs, errors) {
  if (!Array.isArray(schedule) || schedule.length !== EXPECTED_REGULAR_SEASON_GAMES) {
    errors.push(
      `${teamLabel}: expected ${EXPECTED_REGULAR_SEASON_GAMES} regular-season games, got ${
        Array.isArray(schedule) ? schedule.length : 'non-array'
      }.`
    );
    return;
  }

  const seenIds = new Set();
  for (const g of schedule) {
    if (!g.id || seenIds.has(g.id)) {
      errors.push(`${teamLabel}: missing or duplicate game.id (${g.id}).`);
    }
    seenIds.add(g.id);
    if (!g.iso || Number.isNaN(Date.parse(g.iso))) {
      errors.push(`${teamLabel}: game ${g.id} has invalid ISO timestamp "${g.iso}".`);
    }
    if (!g.opp || !validAbbrevs.has(g.opp)) {
      errors.push(`${teamLabel}: game ${g.id} has unknown opponent "${g.opp}".`);
    }
  }
}

/**
 * Validate US ZIP prefix ranges across all 32 team configs.
 */
function auditZipRanges(usTeams) {
  const errors = [];
  const warnings = [];
  const prefixOwners = new Map();

  for (const team of usTeams) {
    const abbrev = team.abbreviation;
    const ranges = team.zipRanges;
    if (!Array.isArray(ranges)) {
      errors.push(`US ${abbrev}: zipRanges must be an array.`);
      continue;
    }
    if (team.country === 'CA') {
      if (ranges.length !== 0) {
        errors.push(`US ${abbrev}: Canadian club must have empty zipRanges, found ${ranges.length}.`);
      }
      continue;
    }
    if (ranges.length === 0) {
      errors.push(`US ${abbrev}: US club has empty zipRanges.`);
      continue;
    }

    for (const pair of ranges) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        errors.push(`US ${abbrev}: invalid zipRange tuple ${JSON.stringify(pair)}.`);
        continue;
      }
      const [start, end] = pair;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > 999 || start > end) {
        errors.push(`US ${abbrev}: out-of-bounds zipRange [${start}, ${end}].`);
        continue;
      }
      for (let p = start; p <= end; p++) {
        const owners = prefixOwners.get(p) || [];
        owners.push(abbrev);
        prefixOwners.set(p, owners);
      }
    }
  }

  let sharedPrefixCount = 0;
  for (const owners of prefixOwners.values()) {
    if (owners.length > 1) sharedPrefixCount++;
  }
  if (sharedPrefixCount > 0) {
    warnings.push(`ZIP matrix notes ${sharedPrefixCount} multi-team border prefixes (shared metro/state markets).`);
  }

  return { errors, warnings, totalCoveredPrefixes: prefixOwners.size };
}

/**
 * Audit one team's .com schedule against canonical US RSN aliases and defunct network lists.
 */
function auditUsTeamSchedule(team, schedule, aliases, validAbbrevs, now = new Date()) {
  const abbrev = team.abbreviation;
  const errors = [];
  const warnings = [];
  const netCounts = {};
  let fallbackUpcomingCount = 0;

  auditScheduleStructure(`US ${abbrev}`, schedule, validAbbrevs, errors);

  const defunctSet = new Set((aliases.defunctNetworks || []).map(s => s.toLowerCase()));
  if (defunctSet.has((team.rsn || '').toLowerCase())) {
    errors.push(`US ${abbrev}: us_teams.json references defunct RSN "${team.rsn}".`);
  }

  const allowedAliases = new Set(
    (aliases.usRsnAliases && aliases.usRsnAliases[abbrev]) || []
  );
  const allowedNationalNets = new Set(['ESPN', 'ABC', 'TNT', 'ESPN+']);
  const windowEndMs = now.getTime() + 14 * 24 * 60 * 60 * 1000;

  for (const g of schedule || []) {
    const gMs = Date.parse(g.iso);
    const inUpcomingWindow = !Number.isNaN(gMs) && gMs >= now.getTime() && gMs <= windowEndMs;

    if (g.typeUS === 'national') {
      if (g.rsn !== null && g.rsn !== undefined) {
        errors.push(`US ${abbrev} game ${g.id}: national exclusive must have rsn=null, found "${g.rsn}".`);
      }
      if (!allowedNationalNets.has(g.netUSNat)) {
        errors.push(`US ${abbrev} game ${g.id}: unknown national network "${g.netUSNat}".`);
      } else {
        netCounts[g.netUSNat] = (netCounts[g.netUSNat] || 0) + 1;
      }
      continue;
    }

    if (g.typeUS !== 'regional' && g.typeUS !== 'nhl_network') {
      errors.push(`US ${abbrev} game ${g.id}: unexpected typeUS "${g.typeUS}".`);
      continue;
    }

    const rawRsn = typeof g.rsn === 'string' ? g.rsn : '';
    const trimmed = rawRsn.trim();
    if (rawRsn !== trimmed) {
      errors.push(`US ${abbrev} game ${g.id}: trailing/leading whitespace in rsn "${rawRsn}".`);
    }
    if (!trimmed || trimmed === 'UNAVAILABLE' || g.primaryNet === 'UNAVAILABLE') {
      if (team.country !== 'CA' && g.typeUS === 'regional') {
        errors.push(`US ${abbrev} game ${g.id}: missing/unavailable RSN broadcast.`);
        if (inUpcomingWindow) fallbackUpcomingCount++;
      }
      continue;
    }

    netCounts[trimmed] = (netCounts[trimmed] || 0) + 1;
    if (defunctSet.has(trimmed.toLowerCase())) {
      errors.push(`US ${abbrev} game ${g.id}: defunct network "${trimmed}" leaked into schedule.`);
    }

    if (team.country !== 'CA' && g.typeUS === 'regional') {
      if (!allowedAliases.has(trimmed)) {
        errors.push(`US ${abbrev} game ${g.id}: unmapped/drifted RSN "${trimmed}" not in usRsnAliases.`);
        if (inUpcomingWindow && trimmed === team.rsn) {
          fallbackUpcomingCount++;
        }
      }
    }
  }

  return {
    abbrev,
    slug: team.slug,
    configRsn: team.rsn,
    gameCount: Array.isArray(schedule) ? schedule.length : 0,
    netCounts,
    fallbackUpcomingCount,
    errors,
    warnings
  };
}

/**
 * Audit one team's .ca schedule for unmapped tokens, missing upcoming broadcasts, and copy parity.
 */
function auditCaTeamSchedule(teamMeta, schedule, aliases, validAbbrevs, { now = new Date(), legacyCopySchedule = null } = {}) {
  const abbrev = teamMeta.id;
  const errors = [];
  const warnings = [];
  const netCounts = {};
  let missingUpcomingCount = 0;

  auditScheduleStructure(`CA ${abbrev}`, schedule, validAbbrevs, errors);

  const knownDisplayNets = new Set(Object.values(aliases.caNetworkMap || {}));
  const rawOnlyKeys = new Set(
    Object.keys(aliases.caNetworkMap || {}).filter(k => (aliases.caNetworkMap || {})[k] !== k)
  );
  const approvedFrench = new Set(aliases.caApprovedFrench || []);
  const windowEndMs = now.getTime() + 14 * 24 * 60 * 60 * 1000;

  for (const g of schedule || []) {
    if (g.typeEN && g.typeEN !== 'regional' && g.typeEN !== 'national') {
      errors.push(`CA ${abbrev} game ${g.id}: invalid typeEN "${g.typeEN}".`);
    }
    if (g.typeFR && g.typeFR !== 'regional' && g.typeFR !== 'national') {
      errors.push(`CA ${abbrev} game ${g.id}: invalid typeFR "${g.typeFR}".`);
    }
    const frTokens = (g.netFR || '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);
    for (const ft of frTokens) {
      if (!approvedFrench.has(ft)) {
        errors.push(`CA ${abbrev} game ${g.id}: unapproved French network "${ft}" in netFR.`);
      }
    }
    const tokens = [g.netEN, g.netFR]
      .filter(Boolean)
      .flatMap(s => s.split(',').map(part => part.trim()))
      .filter(Boolean);

    for (const token of tokens) {
      netCounts[token] = (netCounts[token] || 0) + 1;
      if (rawOnlyKeys.has(token) || !knownDisplayNets.has(token)) {
        errors.push(`CA ${abbrev} game ${g.id}: unmapped or raw broadcast code "${token}".`);
      }
    }

    const gMs = Date.parse(g.iso);
    if (!Number.isNaN(gMs) && gMs >= now.getTime() && gMs <= windowEndMs && !g.netEN) {
      missingUpcomingCount++;
      warnings.push(`CA ${abbrev} game ${g.id} (${g.date}): empty netEN inside 14-day window.`);
    }
  }

  if (Array.isArray(legacyCopySchedule)) {
    if (legacyCopySchedule.length !== schedule.length) {
      errors.push(`CA ${abbrev}: legacy copy data/*.json length (${legacyCopySchedule.length}) != data/ca/*.json (${schedule.length}).`);
    } else {
      for (let i = 0; i < schedule.length; i++) {
        const a = schedule[i];
        const b = legacyCopySchedule[i];
        if (!b || a.id !== b.id || a.netEN !== b.netEN || a.netFR !== b.netFR) {
          errors.push(`CA ${abbrev}: data/*.json out of sync with data/ca/*.json at game index ${i} (id ${a.id}).`);
          break;
        }
      }
    }
  }

  return {
    abbrev,
    slug: teamMeta.slug,
    configNetworks: teamMeta.networks
      ? `${teamMeta.networks.regionalEN}${teamMeta.networks.regionalFR ? ' / ' + teamMeta.networks.regionalFR : ''}`
      : 'None',
    gameCount: Array.isArray(schedule) ? schedule.length : 0,
    netCounts,
    missingUpcomingCount,
    errors,
    warnings
  };
}

/**
 * Execute the full empirical audit over production config and cached NHL API schedule files.
 */
function runFullDataAudit({ rootDir = ROOT_DIR, now = new Date() } = {}) {
  const aliases = loadNetworkAliases(rootDir);
  const usTeams = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/us_teams.json'), 'utf-8'));
  const caTeams = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/ca_teams.json'), 'utf-8'));
  const validAbbrevs = new Set(usTeams.map(t => t.abbreviation));

  const zipAudit = auditZipRanges(usTeams);
  const usResults = [];
  const caResults = [];
  const errors = [...zipAudit.errors];
  const warnings = [...zipAudit.warnings];

  for (const team of usTeams) {
    const filePath = path.join(rootDir, `data/us/${team.slug}.json`);
    const schedule = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8')).schedule
      : null;
    const res = auditUsTeamSchedule(team, schedule, aliases, validAbbrevs, now);
    usResults.push(res);
    errors.push(...res.errors);
    warnings.push(...res.warnings);
  }

  for (const teamMeta of caTeams) {
    const caPath = path.join(rootDir, `data/ca/${teamMeta.slug}.json`);
    const schedule = fs.existsSync(caPath)
      ? JSON.parse(fs.readFileSync(caPath, 'utf-8')).schedule
      : null;
    const legacyRel = LEGACY_CA_PATHS[teamMeta.id];
    const legacyCopySchedule =
      legacyRel && fs.existsSync(path.join(rootDir, legacyRel))
        ? JSON.parse(fs.readFileSync(path.join(rootDir, legacyRel), 'utf-8')).schedule
        : null;

    const res = auditCaTeamSchedule(teamMeta, schedule, aliases, validAbbrevs, {
      now,
      legacyCopySchedule
    });
    caResults.push(res);
    errors.push(...res.errors);
    warnings.push(...res.warnings);
  }

  return {
    generatedAt: now.toISOString(),
    zipAudit,
    usResults,
    caResults,
    errors,
    warnings,
    passed: errors.length === 0
  };
}

function summarizeCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v})`)
    .join(', ') || 'None';
}

/**
 * Format audit results as a flat Markdown table (audit_summary.md) for human review.
 */
function formatAuditMarkdown(audit) {
  const lines = [
    '# Incoming Data QA Audit Summary',
    '',
    `- **Generated:** ${audit.generatedAt}`,
    `- **Status:** ${audit.passed ? 'PASS' : `FAIL (${audit.errors.length} error(s))`}`,
    `- **ZIP Matrix:** ${audit.zipAudit.totalCoveredPrefixes} US prefixes covered (${audit.zipAudit.errors.length} errors)`,
    `- **Schedule & Network Source:** \`[EMPIRICAL - https://api-web.nhle.com/v1/club-schedule-season/{TEAM}/now]\``,
    `- **Territory / ZIP Metadata Source:** \`[CURATED - data/us_teams.json & data/ca_teams.json]\``,
    '',
    '## US Site (`hockeyblackouts.com`) — 32 Teams',
    '',
    '| Team | Configured `rsn` `[CURATED]` | Live NHL API Feeds `[EMPIRICAL]` | Games | Errors | Status |',
    '| :--- | :--- | :--- | :---: | :---: | :---: |'
  ];

  for (const r of audit.usResults) {
    lines.push(
      `| ${r.abbrev} | ${r.configRsn} | ${summarizeCounts(r.netCounts)} | ${r.gameCount} | ${r.errors.length} | ${r.errors.length === 0 ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push(
    '',
    '## Canadian Site (`hockeyblackouts.ca`) — 32 Teams',
    '',
    '| Team | Configured Regional `[CURATED]` | Live Schedule Feeds `[EMPIRICAL]` | Games | 14d Gaps | Errors | Status |',
    '| :--- | :--- | :--- | :---: | :---: | :---: | :---: |'
  );

  for (const r of audit.caResults) {
    lines.push(
      `| ${r.abbrev} | ${r.configNetworks} | ${summarizeCounts(r.netCounts)} | ${r.gameCount} | ${r.missingUpcomingCount} | ${r.errors.length} | ${r.errors.length === 0 ? 'PASS' : 'FAIL'} |`
    );
  }

  if (audit.errors.length > 0) {
    lines.push('', '## Blocking Errors', '');
    for (const err of audit.errors) {
      lines.push(`- ${err}`);
    }
  }

  if (audit.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const warn of audit.warnings) {
      lines.push(`- ${warn}`);
    }
  }

  return lines.join('\n') + '\n';
}

module.exports = {
  LEGACY_CA_PATHS,
  EXPECTED_REGULAR_SEASON_GAMES,
  loadNetworkAliases,
  normalizeNetworkCode,
  formatEtDate,
  classifyCaGameBroadcasts,
  classifyUsBroadcast,
  auditZipRanges,
  auditUsTeamSchedule,
  auditCaTeamSchedule,
  runFullDataAudit,
  formatAuditMarkdown
};
