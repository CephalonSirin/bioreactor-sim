import { useSyncExternalStore } from 'react'

export interface ToastItem {
  id: number
  title: string
  detail?: string
  tone: 'ok' | 'error'
  leaving: boolean
}

const VISIBLE_MS = 3200
const LEAVE_MS = 260

let items: ToastItem[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismiss(id: number) {
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t))
  emit()
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, LEAVE_MS)
}

/** Shows a short confirmation; errors stay until dismissed. */
export function toast(title: string, detail?: string, tone: 'ok' | 'error' = 'ok') {
  const id = ++seq
  items = [...items.slice(-2), { id, title, detail, tone, leaving: false }]
  emit()
  if (tone === 'ok') window.setTimeout(() => dismiss(id), VISIBLE_MS)
}

export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => items
  )
}
