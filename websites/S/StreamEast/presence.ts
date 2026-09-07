import {
  formatLeagueStatus,
  getSupportedStreamLeague,
  normalizeString,
  parseStartTime,
  parseStreamStatusFromSE,
  parseSupportedLeague,
} from './utils'

const ActivityType = {
  Watching: 3,
} as const

const presence = new Presence({
  clientId: '1441489442484256961',
})

const assetBase = 'https://raw.githubusercontent.com/hashking710/premid-streameast/main/streameast-activity/assets'
const logoUrl = `${assetBase}/streameast-removebg-preview.png`
const sportAssets: Record<string, string> = {
  MLB: 'streameast_baseball',
  NBA: 'streameast_basketball',
  WNBA: 'streameast_basketball',
  NCAAB: 'streameast_basketball',
  NFL: 'streameast_football',
  'College Football': 'streameast_football',
  NHL: 'streameast_hockey',
  Soccer: 'streameast_soccer',
  UFC: 'streameast_mma',
  Boxing: 'streameast_boxing',
  F1: 'streameast_racing',
}

interface MatchInfo {
  homeTeam: string
  awayTeam: string
  status?: string
  homeScore?: string
  awayScore?: string
  league?: string
  url?: string
  startTimestamp?: number
}

interface Settings {
  privacyMode: boolean
  hideScores: boolean
}

function sportAsset(league?: string): string {
  const asset = league && sportAssets[league]
  return asset ? `${assetBase}/${asset}.png` : logoUrl
}

function textContent(selector: string, root: ParentNode = document): string | null {
  return normalizeString(root.querySelector(selector)?.textContent)
}

function readSE(): any | null {
  const direct = (window as any)._SE
  if (direct?.homeTeam) return direct

  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent
    if (!text?.includes('_SE')) continue
    const match = text.match(/window\._SE\s*=\s*(\{[\s\S]*?\});/)
    if (!match) continue
    try {
      return new Function(`return (${match[1]})`)()
    }
    catch {
      return null
    }
  }
  return null
}

function parseStreamPage(): MatchInfo | null {
  const se = readSE()
  if (!se?.homeTeam) return null

  const homeTeam = normalizeString(se.homeTeam)
  if (!homeTeam) return null
  const league = getSupportedStreamLeague(se) || undefined
  const status = parseStreamStatusFromSE(se)

  if (se.isVsMatch === false) {
    const eventStatus = textContent('.se-board__event-status')
    return {
      homeTeam,
      awayTeam: '',
      status: eventStatus ? formatLeagueStatus(eventStatus, league) : status || undefined,
      league,
      url: location.href,
    }
  }

  const awayTeam = normalizeString(se.awayTeam)
  if (!awayTeam) return null
  const statusText = textContent('.se-board__status-txt')
    || textContent('.se-board__status span')
    || textContent('.se-board__status')
  const score = textContent('.se-board__score')?.split(' - ') ?? []
  const scheduled = typeof se.matchStartTime === 'number' ? se.matchStartTime : undefined

  return {
    homeTeam,
    awayTeam,
    status: statusText ? formatLeagueStatus(statusText, league) : status || undefined,
    homeScore: normalizeString(score[0]) || undefined,
    awayScore: normalizeString(score[1]) || undefined,
    league,
    url: location.href,
    startTimestamp: scheduled && !se.showEndedScreen && se.timeUntilStart <= 0 ? scheduled : undefined,
  }
}

function cardLeague(card: Element): string | null {
  const section = card.closest('.m-section')
  return parseSupportedLeague(section?.getAttribute('data-m-sport-name') || '')
    || parseSupportedLeague(section?.querySelector('.m-section__title')?.textContent || '')
    || parseSupportedLeague(card.getAttribute('data-espn-path') || '')
    || parseSupportedLeague((card.querySelector('.m-card__link') as HTMLAnchorElement | null)?.href || '')
}

function cardStatus(card: Element, league: string | null): string | null {
  const selectors = [
    '.match-live-espn.status-live',
    '.m-card__pill-status',
    '.m-card__pill-end',
    '.m-card__pill-label',
    '.m-card__time-hour',
    '.m-card__time',
  ]
  for (const selector of selectors) {
    const value = normalizeString(card.querySelector(selector)?.textContent)
    if (value) return formatLeagueStatus(value, league)
  }

  const time = card.getAttribute('data-time') || card.querySelector('.m-card__time')?.getAttribute('data-time')
  return time && /^\d+$/.test(time) ? parseStartTime(Number(time)) : null
}

function parseHomeCard(card: Element): MatchInfo | null {
  const teams = normalizeString(card.getAttribute('data-team-names') || '')?.split('|') || []
  const homeTeam = normalizeString(teams[0]) || textContent('.m-card__team--home .m-card__name', card)
  const awayTeam = normalizeString(teams[1]) || textContent('.m-card__team--away .m-card__name', card)
  if (!homeTeam || !awayTeam) return null

  const league = cardLeague(card)
  return {
    homeTeam,
    awayTeam,
    league: league || undefined,
    status: cardStatus(card, league) || undefined,
    homeScore: textContent('.m-card__team--home .m-card__score', card) || undefined,
    awayScore: textContent('.m-card__team--away .m-card__score', card) || undefined,
    url: (card.querySelector('.m-card__link') as HTMLAnchorElement | null)?.href || location.href,
  }
}

function homePageData(): MatchInfo | null {
  const cards = [...document.querySelectorAll('.m-card[data-match-id], .m-card.m-card--event')]
    .filter(card => cardLeague(card))
  const card = cards.find(item => item.classList.contains('m-card--live') || item.classList.contains('live')) || cards[0]
  return card ? parseHomeCard(card) : null
}

async function settings(): Promise<Settings> {
  const [privacyMode, hideScores] = await Promise.all([
    presence.getSetting<boolean>('privacyMode'),
    presence.getSetting<boolean>('hideScores'),
  ])
  return { privacyMode, hideScores }
}

async function update(): Promise<void> {
  const currentSettings = await settings()
  let data: PresenceData

  if (currentSettings.privacyMode) {
    data = {
      type: ActivityType.Watching,
      details: 'Watching StreamEast',
      largeImageKey: logoUrl,
      largeImageText: 'StreamEast',
    }
  }
  else if (location.pathname === '/' || !location.pathname) {
    data = {
      type: ActivityType.Watching,
      details: 'Browsing StreamEast',
      state: 'On the home page',
      largeImageKey: logoUrl,
      largeImageText: 'StreamEast',
    }
  }
  else {
    const match = parseStreamPage() || homePageData()
    if (!match) {
      const league = parseSupportedLeague(location.pathname)
      data = {
        type: ActivityType.Watching,
        details: league ? `Browsing ${league}` : 'Browsing StreamEast',
        state: league ? 'Viewing match listings' : undefined,
        largeImageKey: sportAsset(league || undefined),
        largeImageText: league || 'StreamEast',
      }
    }
    else {
      const title = match.awayTeam ? `${match.homeTeam} vs ${match.awayTeam}` : match.homeTeam
      const state = [
        match.league,
        !currentSettings.hideScores && match.homeScore && match.awayScore
          ? `${match.homeScore} - ${match.awayScore}`
          : undefined,
        match.status,
      ].filter(Boolean).join(' · ')
      data = {
        type: ActivityType.Watching,
        details: title,
        state,
        largeImageKey: sportAsset(match.league),
        largeImageText: title,
        smallImageKey: logoUrl,
        smallImageText: match.league || 'StreamEast',
        startTimestamp: match.startTimestamp,
        buttons: [{ label: 'Watch on StreamEast', url: match.url || location.href }],
      }
    }
  }

  presence.setActivity(data)
}

presence.on('UpdateData', () => update().catch(() => presence.setActivity({
  type: ActivityType.Watching,
  details: 'Browsing StreamEast',
  largeImageKey: logoUrl,
})))

if (document.body) {
  let debounce: number | undefined
  new MutationObserver(() => {
    if (debounce) return
    debounce = window.setTimeout(() => {
      debounce = undefined
      update().catch(() => undefined)
    }, 500)
  }).observe(document.body, { childList: true, subtree: true })
}
