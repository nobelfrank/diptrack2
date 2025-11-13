// Network status detection and management
class NetworkStatus {
  private listeners: ((isOnline: boolean) => void)[] = []
  private _isOnline: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this._isOnline = navigator.onLine
      
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
      
      // Additional check with actual network request
      this.checkNetworkStatus()
    }
  }

  private handleOnline = () => {
    console.log('🌐 Network: Back online')
    this._isOnline = true
    this.notifyListeners(true)
  }

  private handleOffline = () => {
    console.log('📱 Network: Gone offline')
    this._isOnline = false
    this.notifyListeners(false)
  }

  private async checkNetworkStatus() {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      const isOnline = response.ok
      
      if (isOnline !== this._isOnline) {
        this._isOnline = isOnline
        this.notifyListeners(isOnline)
      }
    } catch {
      if (this._isOnline) {
        this._isOnline = false
        this.notifyListeners(false)
      }
    }
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline))
  }

  get isOnline(): boolean {
    return this._isOnline
  }

  addListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Periodic network check
  startPeriodicCheck(intervalMs: number = 30000) {
    setInterval(() => {
      this.checkNetworkStatus()
    }, intervalMs)
  }
}

export const networkStatus = new NetworkStatus()