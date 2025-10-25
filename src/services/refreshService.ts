// Refresh configuration - sync with API cache timeout (30s) + buffer
export interface RefreshConfig {
  autoRefreshInterval: number; // in milliseconds
  enableAutoRefresh: boolean;
  onlyRefreshWhenVisible: boolean;
}

export interface RefreshState {
  isRefreshing: boolean;
  lastRefreshTime: number | null;
  nextAutoRefreshTime: number | null;
  refreshError: string | null;
  autoRefreshEnabled: boolean;
}

class RefreshService {
  private config: RefreshConfig;
  private state: RefreshState;
  private intervalId: NodeJS.Timeout | null = null;
  private visibilityHandler: () => void;
  private listeners: Set<() => void> = new Set();

  constructor(config: Partial<RefreshConfig> = {}) {
    this.config = {
      autoRefreshInterval: 35 * 1000, // Sync with API cache timeout (30s) + 5s buffer
      enableAutoRefresh: true,
      onlyRefreshWhenVisible: true,
      ...config,
    };

    this.state = {
      isRefreshing: false,
      lastRefreshTime: null,
      nextAutoRefreshTime: null,
      refreshError: null,
      autoRefreshEnabled: this.config.enableAutoRefresh,
    };

    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.setupVisibilityListener();
  }

  // Get current refresh state
  getState(): RefreshState {
    return { ...this.state };
  }

  // Update configuration
  updateConfig(newConfig: Partial<RefreshConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.state.autoRefreshEnabled = this.config.enableAutoRefresh;

    // Restart auto-refresh if enabled
    if (this.config.enableAutoRefresh) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }

    this.notifyListeners();
  }

  // Add state change listener
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  // Manual refresh request
  async requestManualRefresh(
    refreshFunction: () => Promise<void>,
  ): Promise<void> {
    if (this.state.isRefreshing) {
      console.log("Refresh already in progress, skipping");
      return;
    }

    try {
      this.setRefreshing(true);
      this.state.refreshError = null;

      await refreshFunction();

      this.state.lastRefreshTime = Date.now();
      this.state.refreshError = null;

      // Schedule next auto-refresh
      if (this.state.autoRefreshEnabled) {
        this.scheduleNextAutoRefresh();
      }
    } catch (error) {
      console.error("Manual refresh failed:", error);
      this.state.refreshError =
        error instanceof Error ? error.message : "Refresh failed";
    } finally {
      this.setRefreshing(false);
    }

    this.notifyListeners();
  }

  // Start auto-refresh
  startAutoRefresh(): void {
    if (!this.config.enableAutoRefresh || this.intervalId) {
      return;
    }

    this.stopAutoRefresh(); // Clear any existing interval

    const scheduleNext = () => {
      if (this.config.onlyRefreshWhenVisible && !this.isPageVisible()) {
        // Page not visible, check again in 30 seconds
        this.intervalId = setTimeout(scheduleNext, 30000);
        return;
      }

      // Schedule next refresh based on config interval
      this.intervalId = setTimeout(async () => {
        if (this.state.autoRefreshEnabled) {
          // This will be handled by the App component's refresh logic
          this.notifyListeners(); // Trigger state update
          scheduleNext(); // Schedule next refresh
        }
      }, this.config.autoRefreshInterval);
    };

    scheduleNext();
  }

  // Stop auto-refresh
  stopAutoRefresh(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.state.nextAutoRefreshTime = null;
  }

  // Set refreshing state
  private setRefreshing(isRefreshing: boolean): void {
    this.state.isRefreshing = isRefreshing;
    if (isRefreshing) {
      this.state.nextAutoRefreshTime = null;
    } else if (this.state.autoRefreshEnabled) {
      this.scheduleNextAutoRefresh();
    }
  }

  // Schedule next auto-refresh time
  private scheduleNextAutoRefresh(): void {
    if (this.state.autoRefreshEnabled) {
      this.state.nextAutoRefreshTime =
        Date.now() + this.config.autoRefreshInterval;
    } else {
      this.state.nextAutoRefreshTime = null;
    }
  }

  // Check if page is visible
  private isPageVisible(): boolean {
    return !document.hidden;
  }

  // Handle visibility change
  private handleVisibilityChange(): void {
    if (this.config.onlyRefreshWhenVisible) {
      if (this.isPageVisible()) {
        // Page became visible, check if we need to refresh
        const now = Date.now();
        const timeSinceLastRefresh = this.state.lastRefreshTime
          ? now - this.state.lastRefreshTime
          : Infinity;

        // If it's been longer than the interval, refresh now
        if (timeSinceLastRefresh >= this.config.autoRefreshInterval) {
          this.notifyListeners(); // Trigger immediate refresh
          this.startAutoRefresh(); // Restart auto-refresh schedule
        }
      } else {
        // Page hidden, pause auto-refresh
        this.stopAutoRefresh();
      }
    }

    this.notifyListeners();
  }

  // Setup visibility listener
  private setupVisibilityListener(): void {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoRefresh();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    this.listeners.clear();
  }

  // Format time until next refresh
  getTimeUntilNextRefresh(): string {
    if (!this.state.nextAutoRefreshTime || !this.state.autoRefreshEnabled) {
      return "Auto-refresh disabled";
    }

    const now = Date.now();
    const timeUntil = this.state.nextAutoRefreshTime - now;

    if (timeUntil <= 0) {
      return "Refreshing...";
    }

    const minutes = Math.floor(timeUntil / 60000);
    const seconds = Math.floor((timeUntil % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Check if auto-refresh should be active
  shouldAutoRefresh(): boolean {
    return (
      this.config.enableAutoRefresh &&
      (!this.config.onlyRefreshWhenVisible || this.isPageVisible()) &&
      !this.state.isRefreshing
    );
  }
}

// Create singleton instance
export const refreshService = new RefreshService();

// Export types for external use
export type { RefreshService as RefreshServiceType };
