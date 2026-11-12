const etDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' });

const CANADIAN_TEAM_IDS = ['MTL', 'TOR', 'OTT', 'VAN', 'CGY', 'EDM', 'WPG'];

// All 32 NHL Teams Timezone Metadata
const TEAM_TIMEZONES = {
  // Canadian Teams
  VAN: { timeZone: 'America/Vancouver', abbr: 'PT', abbrFr: 'HP' },
  CGY: { timeZone: 'America/Edmonton', abbr: 'MT', abbrFr: 'HR' },
  EDM: { timeZone: 'America/Edmonton', abbr: 'MT', abbrFr: 'HR' },
  WPG: { timeZone: 'America/Winnipeg', abbr: 'CT', abbrFr: 'HC' },
  TOR: { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  OTT: { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  MTL: { timeZone: 'America/Toronto', abbr: 'ET', abbrFr: 'HE' },
  // US Eastern Teams
  BOS: { timeZone: 'America/New_York', abbr: 'ET' },
  BUF: { timeZone: 'America/New_York', abbr: 'ET' },
  DET: { timeZone: 'America/New_York', abbr: 'ET' },
  FLA: { timeZone: 'America/New_York', abbr: 'ET' },
  TBL: { timeZone: 'America/New_York', abbr: 'ET' },
  CAR: { timeZone: 'America/New_York', abbr: 'ET' },
  NJD: { timeZone: 'America/New_York', abbr: 'ET' },
  NYI: { timeZone: 'America/New_York', abbr: 'ET' },
  NYR: { timeZone: 'America/New_York', abbr: 'ET' },
  PHI: { timeZone: 'America/New_York', abbr: 'ET' },
  PIT: { timeZone: 'America/New_York', abbr: 'ET' },
  WSH: { timeZone: 'America/New_York', abbr: 'ET' },
  CBJ: { timeZone: 'America/New_York', abbr: 'ET' },
  // US Central Teams
  CHI: { timeZone: 'America/Chicago', abbr: 'CT' },
  DAL: { timeZone: 'America/Chicago', abbr: 'CT' },
  MIN: { timeZone: 'America/Chicago', abbr: 'CT' },
  NSH: { timeZone: 'America/Chicago', abbr: 'CT' },
  STL: { timeZone: 'America/Chicago', abbr: 'CT' },
  // US Mountain Teams
  COL: { timeZone: 'America/Denver', abbr: 'MT' },
  UTA: { timeZone: 'America/Denver', abbr: 'MT' },
  // US Pacific Teams
  ANA: { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  LAK: { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  SJS: { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  SEA: { timeZone: 'America/Los_Angeles', abbr: 'PT' },
  VGK: { timeZone: 'America/Los_Angeles', abbr: 'PT' }
};

/**
 * Format an ISO timestamp into its YYYY-MM-DD calendar date in Eastern Time
 * (America/Toronto) so UTC timestamps from US schedules match Canadian game pages.
 */
function formatEtDate(iso, fallback = '') {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? String(iso).split('T')[0] : etDateFormatter.format(parsed);
}

/**
 * Pick the primary Canadian team for a matchup (home Canadian team first,
 * otherwise away Canadian team) so card times match copy priority.
 */
function getPrimaryCanadianTeamId(homeId, awayId, fallback = 'TOR') {
  if (CANADIAN_TEAM_IDS.includes(homeId)) return homeId;
  if (CANADIAN_TEAM_IDS.includes(awayId)) return awayId;
  return fallback;
}

/**
 * Format a game's ISO timestamp into 12-hour local time + timezone abbreviation
 * (e.g. "7:00 PM MT") for the given NHL team ID.
 */
function formatTeamGameTime(iso, teamId) {
  const tzConfig = TEAM_TIMEZONES[teamId] || { timeZone: 'America/Toronto', abbr: 'ET' };
  if (iso) {
    const dt = new Date(iso);
    if (!Number.isNaN(dt.getTime())) {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tzConfig.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(dt);
      return `${formatted} ${tzConfig.abbr}`;
    }
  }
  return `7:00 PM ${tzConfig.abbr}`;
}

/**
 * Format a game's ISO timestamp into display date (e.g. "Tue Sep 29 2026")
 * in the given NHL team ID's timezone, falling back to precomputed date strings.
 */
function formatTeamGameDate(iso, teamId, fallback = '') {
  const tzConfig = TEAM_TIMEZONES[teamId] || { timeZone: 'America/Toronto' };
  if (iso) {
    const dt = new Date(iso);
    if (!Number.isNaN(dt.getTime())) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tzConfig.timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).formatToParts(dt);
      const getPart = type => parts.find(p => p.type === type)?.value || '';
      return `${getPart('weekday')} ${getPart('month')} ${getPart('day')} ${getPart('year')}`;
    }
  }
  return fallback;
}

module.exports = {
  TEAM_TIMEZONES,
  formatEtDate,
  getPrimaryCanadianTeamId,
  formatTeamGameTime,
  formatTeamGameDate
};
