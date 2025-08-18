import { useCallback, useRef, useEffect, useState } from 'react';

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(
  func: T
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Lazy loading hook
export const useLazyLoad = <T>(
  data: T[],
  pageSize: number = 20
) => {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const currentIndex = useRef(0);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // Simulate async loading
    setTimeout(() => {
      const nextItems = data.slice(currentIndex.current, currentIndex.current + pageSize);
      setItems(prev => [...prev, ...nextItems]);
      currentIndex.current += pageSize;
      setHasMore(currentIndex.current < data.length);
      setLoading(false);
    }, 100);
  }, [data, pageSize, loading, hasMore]);

  useEffect(() => {
    setItems([]);
    currentIndex.current = 0;
    setHasMore(data.length > 0);
    loadMore();
  }, [data]);

  return { items, hasMore, loading, loadMore };
};

// Image caching utility
export class ImageCache {
  private static cache = new Map<string, string>();
  private static maxSize = 100;

  static set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  static get(key: string): string | undefined {
    return this.cache.get(key);
  }

  static has(key: string): boolean {
    return this.cache.has(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}

// Memory management utility
export class MemoryManager {
  private static listeners: (() => void)[] = [];
  private static isLowMemory = false;

  static addLowMemoryListener(callback: () => void): void {
    this.listeners.push(callback);
  }

  static removeLowMemoryListener(callback: () => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  static notifyLowMemory(): void {
    this.isLowMemory = true;
    this.listeners.forEach(listener => listener());
  }

  static isInLowMemoryState(): boolean {
    return this.isLowMemory;
  }

  static clearLowMemoryState(): void {
    this.isLowMemory = false;
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
    };
  }

  static getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.metrics.forEach((times, name) => {
      result[name] = this.getAverageTime(name);
    });
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Virtual scrolling utilities
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
  } = {}
) => {
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options.threshold, options.rootMargin]);

  return targetRef;
};
