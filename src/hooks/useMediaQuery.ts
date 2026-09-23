import { useSyncExternalStore } from 'react'

/** Live boolean for a CSS media query (false during SSR / unsupported). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false
  )
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
