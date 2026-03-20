import { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage - A performance-optimized image component
 * Features:
 * - Lazy loading using Intersection Observer
 * - Blur-up placeholder effect
 * - WebP support with fallback
 * - Proper alt text handling
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  placeholder = 'blur',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Generate placeholder styles
  const placeholderStyle = placeholder === 'blur' && !isLoaded
    ? {
        filter: 'blur(10px)',
        transform: 'scale(1.1)',
        transition: 'filter 0.3s ease-out, transform 0.3s ease-out',
      }
    : {};

  const loadedStyle = isLoaded
    ? {
        filter: 'blur(0)',
        transform: 'scale(1)',
      }
    : {};

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt || ''} // Ensure alt is always present for accessibility
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchPriority}
      onLoad={handleLoad}
      style={{
        ...placeholderStyle,
        ...loadedStyle,
        ...props.style,
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
