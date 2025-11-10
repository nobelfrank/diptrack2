// Cache management utilities
export class CacheManager {
  private static instance: CacheManager
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  set(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }))
    } catch (error) {
      console.warn('Failed to store in localStorage:', error)
    }
  }

  get(key: string): any | null {
    // Check memory cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Restore to memory cache
          this.cache.set(key, parsed)
          return parsed.data
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }

    return null
  }

  invalidate(key: string): void {
    this.cache.delete(key)
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }

  clear(): void {
    this.cache.clear()
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error)
    }
  }
}

export const cacheManager = CacheManager.getInstance()