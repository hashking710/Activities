export const leagueNameMap: Record<string, string> = {
  mlb: 'MLB',
  baseball: 'MLB',
  nba: 'NBA',
  wnba: 'WNBA',
  nhl: 'NHL',
  hockey: 'NHL',
  nfl: 'NFL',
  cfb: 'College Football',
  collegefootball: 'College Football',
  ncaab: 'NCAAB',
  soccer: 'Soccer',
  futbol: 'Soccer',
  ufc: 'UFC',
  boxing: 'Boxing',
  f1: 'F1',
  wwe: 'WWE',
  'other-events': 'Other events',
}

export function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function parseSupportedLeague(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const path = value.trim().replace(/\\+/g, '/').replace(/^\/+|\/+$/g, '')
  if (!path) return null

  for (const rawPart of path.split('/').filter(Boolean)) {
    const normalized = normalizeString(rawPart)
    if (!normalized) continue
    const key = normalized.toLowerCase().replace(/[-_ ]+/g, '-')
    if (leagueNameMap[key]) return leagueNameMap[key]

    const cleaned = normalized.toLowerCase().replace(/[-_ ]+/g, '')
    if (leagueNameMap[cleaned]) return leagueNameMap[cleaned]

    for (const subPart of normalized.toLowerCase().split(/[-_ ]+/)) {
      if (leagueNameMap[subPart]) return leagueNameMap[subPart]
    }
  }

  return null
}

export function formatUnixTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function parseStartTime(timestamp: number): string {
  const diffMinutes = Math.round((timestamp * 1000 - Date.now()) / 60000)
  if (diffMinutes <= 0) return 'Starts soon'
  if (diffMinutes < 60) {
    return diffMinutes < 1
      ? 'Starts in a moment'
      : `Starts in ${diffMinutes} min`
  }

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  if (hours <= 4) return minutes ? `Starts in ${hours}h ${minutes}m` : `Starts in ${hours}h`
  return `Starts at ${formatUnixTimestamp(timestamp)}`
}

export function parseStreamStatusFromSE(se: any): string | null {
  if (!se || typeof se !== 'object') return null
  if (se.showEndedScreen) return 'Final'

  if (typeof se.timeUntilStart === 'number') {
    if (se.timeUntilStart > 0) {
      return parseStartTime(Math.round(Date.now() / 1000 + se.timeUntilStart))
    }
    if (se.showCountdown) return 'Starts soon'
  }

  if (typeof se.matchStartTime === 'number' && se.matchStartTime > Math.round(Date.now() / 1000)) {
    return parseStartTime(se.matchStartTime)
  }
  return null
}

export function getSupportedStreamLeague(se: any): string | null {
  return parseSupportedLeague(se?.sportName)
    || parseSupportedLeague(se?.sport)
    || parseSupportedLeague(se?.league)
    || parseSupportedLeague(se?.espnPath)
    || parseSupportedLeague(se?.path)
    || parseSupportedLeague(typeof location !== 'undefined' ? location.pathname : '')
}

export function formatLeagueStatus(rawStatus: string, league?: string | null): string {
  const status = normalizeString(rawStatus)
  if (!status) return ''

  const normalized = status.toLowerCase()
  const leagueKey = league?.toLowerCase() || ''
  if (/^(live|live now)$/.test(normalized)) return 'Live now'
  if (/^(final|ft|full[- ]time|ended|end)$/.test(normalized)) return 'Final'
  if (/^(ht|half[- ]time)$/.test(normalized)) return 'Half time'
  if (/^(et|extra time)$/.test(normalized)) return 'Extra time'
  if (/^(postponed|cancelled|canceled|delayed|suspended)$/.test(normalized)) {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`
  }
  if (/^(\d+(\+\d+)?)'$/.test(status)) return `${status} minute`
  if (/^(\d{1,2}m)$/.test(status)) return `${status} minute`
  if (/^(top|bot|mid)\s+\d+(st|nd|rd|th)?$/.test(normalized)) return `${status} inning`

  const quarterMatch = status.match(/^q([1-4])$/i)
  if (quarterMatch) {
    const quarter = Number(quarterMatch[1])
    return `${quarter}${['st', 'nd', 'rd', 'th'][quarter - 1]} quarter`
  }
  if (/^(1st|2nd|3rd|4th)\s+quarter$/.test(normalized)) return status

  const halfMatch = status.match(/^([12])h$/i)
  if (halfMatch) return `${halfMatch[1]}${halfMatch[1] === '1' ? 'st' : 'nd'} half`
  if (/^(1st|2nd|3rd|4th)$/.test(normalized)) {
    if (/(nba|wnba|ncaab|basketball|nfl|cfb|college football|football)/.test(leagueKey)) return `${status} quarter`
    if (/(nhl|hockey)/.test(leagueKey)) return `${status} period`
    if (/(soccer|football|futbol)/.test(leagueKey)) return `${status} half`
  }
  if (/^(1st|2nd)\s+half$/.test(normalized)) return status
  if (/^(ot|aot)$/.test(normalized)) return 'Overtime'
  if (/^so$/.test(normalized)) return 'Shootout'
  return status
}
