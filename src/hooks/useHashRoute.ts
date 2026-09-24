import { useSyncExternalStore } from 'react'

export type Route = 'home' | 'lab' | 'learn' | 'experiments' | 'methodology'

export const ROUTES: { id: Route; path: string; label: string }[] = [
  { id: 'home', path: '/', label: 'Home' },
  { id: 'lab', path: '/lab', label: 'Bioreactor Lab' },
  { id: 'learn', path: '/learn', label: 'Learn' },
  { id: 'experiments', path: '/experiments', label: 'Experiments' },
  { id: 'methodology', path: '/methodology', label: 'Methodology' },
]

export interface Location {
  route: Route
  /** Optional in-page anchor, e.g. #/learn/monod -> "monod" */
  section: string | null
}

function parse(hash: string): Location {
  const [, first = '', second = ''] = hash.replace(/^#/, '').split('/')
  const match = ROUTES.find((r) => r.path === `/${first}`)
  return { route: match ? match.id : 'home', section: second || null }
}

let cached: { hash: string; loc: Location } | null = null
function snapshot(): Location {
  const hash = window.location.hash
  if (!cached || cached.hash !== hash) cached = { hash, loc: parse(hash) }
  return cached.loc
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useLocation(): Location {
  return useSyncExternalStore(subscribe, snapshot, () => ({ route: 'home', section: null }))
}

export function hrefFor(route: Route, section?: string): string {
  const base = ROUTES.find((r) => r.id === route)!.path
  return `#${base}${section ? `/${section}` : ''}`
}

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } }

/**
 * Resolves once the hash change has been handled and React has committed
 * the new page. Animation frames do not run while a View Transition holds
 * rendering, so this waits on the event and a macrotask instead.
 */
const committed = () =>
  new Promise<void>((resolve) => {
    const done = () => window.setTimeout(resolve, 0)
    window.addEventListener('hashchange', done, { once: true })
    window.setTimeout(resolve, 600) // never hold the transition longer than this
  })

/**
 * Changes the hash inside a View Transition where the browser supports it,
 * so the old page morphs into the new one while the nav bar, which has its
 * own transition name, stays put. Falls back to a plain hash change.
 */
function go(hash: string) {
  const doc = document as VTDocument
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce || window.location.hash === hash) {
    window.location.hash = hash
    return
  }
  doc.startViewTransition(async () => {
    const wait = committed()
    window.location.hash = hash
    await wait
  })
}

export function navigate(route: Route, section?: string) {
  go(hrefFor(route, section))
}

/** Routes in-app links (href="#/...") to other pages through the View Transition path. */
export function installViewTransitions() {
  if (!(document as VTDocument).startViewTransition) return
  document.documentElement.classList.add('vt')
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a[href^="#/"]') as HTMLAnchorElement | null
    if (!a || a.target) return
    const hash = a.getAttribute('href')!
    const page = (h: string) => h.replace(/^#\/?/, '').split('/')[0]
    // Anchors within the current page scroll rather than transition.
    if (page(hash) === page(window.location.hash)) return
    e.preventDefault()
    go(hash)
  }
  document.addEventListener('click', onClick)
  return () => {
    document.documentElement.classList.remove('vt')
    document.removeEventListener('click', onClick)
  }
}
