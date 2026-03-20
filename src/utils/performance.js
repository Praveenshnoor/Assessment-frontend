import { useEffect, useCallback } from 'react';

/**
 * Performance monitoring and optimization utilities
 */

/**
 * Hook to report Web Vitals metrics
 * @param {Function} onReport - Callback function to handle metrics
 */
export function useWebVitals(onReport) {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid loading web-vitals in development
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onReport);
      getFID(onReport);
      getFCP(onReport);
      getLCP(onReport);
      getTTFB(onReport);
    }).catch(() => {
      // web-vitals not installed, skip
    });
  }, [onReport]);
}

/**
 * Hook to prefetch components on user interaction hints
 * @param {Function} importFn - Dynamic import function
 */
export function usePrefetch(importFn) {
  const prefetch = useCallback(() => {
    if (typeof importFn === 'function') {
      importFn();
    }
  }, [importFn]);

  return prefetch;
}

/**
 * Utility to preload critical resources
 * @param {string} href - Resource URL
 * @param {string} as - Resource type (script, style, image, font)
 */
export function preloadResource(href, as, crossOrigin = false) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Utility to defer loading of non-critical CSS
 * @param {string} href - CSS URL
 */
export function loadCSS(href) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  
  document.head.appendChild(link);
}

/**
 * Check if the connection is slow (for adaptive loading)
 * @returns {boolean} - True if connection is slow
 */
export function isSlowConnection() {
  if (typeof navigator === 'undefined') return false;
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return false;
  
  // Consider slow if effective type is 2g or slow-2g, or if saveData is enabled
  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  );
}

/**
 * Reduce motion check for accessibility
 * @returns {boolean} - True if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if IndexedDB usage is high (for storage optimization)
 * @returns {Promise<number>} - Estimated storage usage in MB
 */
export async function getStorageUsage() {
  if (!navigator.storage?.estimate) {
    return 0;
  }

  try {
    const { usage, quota } = await navigator.storage.estimate();
    return {
      usedMB: Math.round((usage || 0) / (1024 * 1024)),
      quotaMB: Math.round((quota || 0) / (1024 * 1024)),
      percentUsed: quota ? Math.round(((usage || 0) / quota) * 100) : 0,
    };
  } catch {
    return { usedMB: 0, quotaMB: 0, percentUsed: 0 };
  }
}

/**
 * Clear old or unnecessary cached data
 */
export async function clearOldCache() {
  if (!('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => !name.includes('v1')); // Adjust version as needed
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
  } catch {
    // Silently fail
  }
}

export default {
  useWebVitals,
  usePrefetch,
  preloadResource,
  loadCSS,
  isSlowConnection,
  prefersReducedMotion,
  getStorageUsage,
  clearOldCache,
};
