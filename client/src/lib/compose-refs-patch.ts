/**
 * Patched @radix-ui/react-compose-refs — React 19 compatible
 *
 * Implements:
 * 1. React 19 ref cleanup functions support.
 * 2. Node identity deduplication (bails out if the node hasn't changed, preventing infinite setState loops).
 * 3. Stable callback caching via WeakMap for Radix Slot.
 * 4. Safe detachment during fiber deletion without triggering nested setState loops.
 */
import { useRef, useCallback } from "react"

type PossibleRef<T> = React.Ref<T> | undefined

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === "function") {
    return ref(value)
  } else if (ref !== null && ref !== undefined) {
    ;(ref as React.MutableRefObject<T>).current = value
  }
}

interface CacheEntry<T> {
  callback: React.RefCallback<T>
  refs: PossibleRef<T>[]
  cleanups: Array<(() => void) | void>
  lastNode: T | null
}

const composedRefCache = new WeakMap<object, CacheEntry<unknown>>()

function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  const keyRef = refs.find(
    (r) => r !== null && r !== undefined && (typeof r === "object" || typeof r === "function"),
  ) as object | undefined

  if (keyRef) {
    const cached = composedRefCache.get(keyRef) as CacheEntry<T> | undefined
    if (cached) {
      cached.refs = refs
      return cached.callback
    }

    const entry: CacheEntry<T> = {
      refs,
      cleanups: [],
      lastNode: null,
      callback: (node: T) => {
        if (node === entry.lastNode) {
          return
        }

        if (node === null) {
          entry.lastNode = null
          const cleanups = entry.cleanups
          entry.cleanups = []
          for (let i = 0; i < cleanups.length; i++) {
            const cleanup = cleanups[i]
            if (typeof cleanup === "function") {
              cleanup()
            } else {
              setRef(entry.refs[i], null)
            }
          }
          return
        }

        entry.lastNode = node
        let hasCleanup = false
        const cleanups = entry.refs.map((ref) => {
          const cleanup = setRef(ref, node)
          if (!hasCleanup && typeof cleanup === "function") {
            hasCleanup = true
          }
          return cleanup
        })
        entry.cleanups = cleanups

        if (hasCleanup) {
          return () => {
            entry.lastNode = null
            entry.cleanups = []
            for (let i = 0; i < cleanups.length; i++) {
              const cleanup = cleanups[i]
              if (typeof cleanup === "function") {
                cleanup()
              } else {
                setRef(entry.refs[i], null)
              }
            }
          }
        }
      },
    }

    composedRefCache.set(keyRef, entry as CacheEntry<unknown>)
    return entry.callback
  }

  // Fallback if no object key ref exists
  let lastFallbackNode: T | null = null
  let fallbackCleanups: Array<(() => void) | void> = []

  return (node: T) => {
    if (node === lastFallbackNode) return

    if (node === null) {
      lastFallbackNode = null
      const cleanups = fallbackCleanups
      fallbackCleanups = []
      for (let i = 0; i < cleanups.length; i++) {
        const cleanup = cleanups[i]
        if (typeof cleanup === "function") {
          cleanup()
        } else {
          setRef(refs[i], null)
        }
      }
      return
    }

    lastFallbackNode = node
    let hasCleanup = false
    fallbackCleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        lastFallbackNode = null
        fallbackCleanups = []
        for (let i = 0; i < fallbackCleanups.length; i++) {
          const cleanup = fallbackCleanups[i]
          if (typeof cleanup === "function") {
            cleanup()
          } else {
            setRef(refs[i], null)
          }
        }
      }
    }
  }
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  const latestRefs = useRef(refs)
  latestRefs.current = refs
  const lastNodeRef = useRef<T | null>(null)
  const cleanupsRef = useRef<Array<(() => void) | void>>([])

  return useCallback(((node: T) => {
    if (node === lastNodeRef.current) {
      return
    }

    if (node === null) {
      lastNodeRef.current = null
      const cleanups = cleanupsRef.current
      cleanupsRef.current = []

      for (let i = 0; i < cleanups.length; i++) {
        const cleanup = cleanups[i]
        if (typeof cleanup === "function") {
          cleanup()
        } else {
          setRef(latestRefs.current[i], null)
        }
      }
      return
    }

    lastNodeRef.current = node
    let hasCleanup = false
    const cleanups = latestRefs.current.map((ref) => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true
      }
      return cleanup
    })
    cleanupsRef.current = cleanups

    if (hasCleanup) {
      return () => {
        lastNodeRef.current = null
        cleanupsRef.current = []
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === "function") {
            cleanup()
          } else {
            setRef(latestRefs.current[i], null)
          }
        }
      }
    }
  }) as React.RefCallback<T>, [])
}

export { composeRefs, useComposedRefs }
