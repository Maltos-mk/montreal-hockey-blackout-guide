const etDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' });

/**
 * Format an ISO timestamp into its YYYY-MM-DD calendar date in Eastern Time
 * (America/Toronto) so UTC timestamps from US schedules match Canadian game pages.
 */
function formatEtDate(iso, fallback = '') {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? String(iso).split('T')[0] : etDateFormatter.format(parsed);
}

module.exports = { formatEtDate };
