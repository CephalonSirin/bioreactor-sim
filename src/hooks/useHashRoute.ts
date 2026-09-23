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

export function navigate(route: Route, section?: string) {
  window.location.hash = hrefFor(route, section)
}
