import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTE DE IMAGEN OPTIMIZADA
// =====================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  blurDataURL?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  priority = false,
  quality = 80,
  sizes = '100vw',
  loading = 'lazy',
  onLoad,
  onError,
  fallback = '/placeholder.svg',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generar URL optimizada con WebP
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // Si es una imagen externa o ya tiene parámetros de optimización
    if (originalSrc.startsWith('http') || originalSrc.includes('?')) {
      return originalSrc;
    }

    // Para imágenes locales, generar URL optimizada
    const url = new URL(originalSrc, window.location.origin);
    
    // Agregar parámetros de optimización
    url.searchParams.set('format', 'webp');
    url.searchParams.set('quality', quality.toString());
    
    if (width) {
      url.searchParams.set('width', width.toString());
    }
    
    if (height) {
      url.searchParams.set('height', height.toString());
    }

    return url.toString();
  }, [quality, width, height]);

  // Generar srcset para responsive images
  const generateSrcSet = useCallback((originalSrc: string) => {
    if (originalSrc.startsWith('http') || originalSrc.includes('?')) {
      return undefined;
    }

    const baseUrl = new URL(originalSrc, window.location.origin);
    const srcSet: string[] = [];

    // Generar diferentes tamaños para responsive
    const sizes = [320, 640, 768, 1024, 1280, 1536];
    
    sizes.forEach(size => {
      const url = new URL(baseUrl);
      url.searchParams.set('format', 'webp');
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('width', size.toString());
      
      srcSet.push(`${url.toString()} ${size}w`);
    });

    return srcSet.join(', ');
  }, [quality]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Manejar carga de imagen
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    setCurrentSrc(fallback);
    onError?.();
  }, [fallback, onError]);

  // Preload de imagen crítica
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedSrc(src);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, getOptimizedSrc]);

  const optimizedSrc = getOptimizedSrc(currentSrc);
  const srcSet = generateSrcSet(currentSrc);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Blur */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        >
          {blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover opacity-50"
              style={{ filter: 'blur(20px)' }}
            />
          )}
        </div>
      )}

      {/* Imagen principal */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          style={{
            objectPosition,
            width,
            height
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Fallback para errores */}
      {hasError && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-400"
          style={{ width, height }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// =====================================================
// HOOK PARA OPTIMIZACIÓN DE IMÁGENES
// =====================================================

export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte de WebP
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    setIsWebPSupported(checkWebPSupport());
  }, []);

  const getOptimizedImageUrl = useCallback((
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ) => {
    const { width, height, quality = 80, format = 'webp' } = options;

    // Si no es una imagen local, devolver original
    if (src.startsWith('http') || src.includes('?')) {
      return src;
    }

    const url = new URL(src, window.location.origin);
    
    if (isWebPSupported && format === 'webp') {
      url.searchParams.set('format', 'webp');
    }
    
    url.searchParams.set('quality', quality.toString());
    
    if (width) {
      url.searchParams.set('width', width.toString());
    }
    
    if (height) {
      url.searchParams.set('height', height.toString());
    }

    return url.toString();
  }, [isWebPSupported]);

  const preloadImage = useCallback((src: string, options?: { width?: number; height?: number; quality?: number }) => {
    const optimizedSrc = getOptimizedImageUrl(src, options);
    
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = optimizedSrc;
    });
  }, [getOptimizedImageUrl]);

  return {
    isWebPSupported,
    getOptimizedImageUrl,
    preloadImage
  };
};

// =====================================================
// COMPONENTE DE GALERÍA OPTIMIZADA
// =====================================================

interface OptimizedGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  columns?: number;
  gap?: number;
  onImageClick?: (index: number) => void;
}

export function OptimizedGallery({
  images,
  className = '',
  columns = 3,
  gap = 16,
  onImageClick
}: OptimizedGalleryProps) {
  const { preloadImage } = useImageOptimization();

  // Preload de imágenes críticas
  useEffect(() => {
    const preloadCriticalImages = async () => {
      const criticalImages = images.slice(0, 6); // Preload primeras 6 imágenes
      
      try {
        await Promise.all(
          criticalImages.map(img => preloadImage(img.src, { width: 400, quality: 75 }))
        );
      } catch (error) {
        console.warn('Error preloading images:', error);
      }
    };

    preloadCriticalImages();
  }, [images, preloadImage]);

  return (
    <div 
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative cursor-pointer group"
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="rounded-lg overflow-hidden"
            loading={index < 6 ? 'eager' : 'lazy'}
            quality={75}
            sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
          />
          
          {/* Overlay en hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// COMPONENTE DE AVATAR OPTIMIZADO
// =====================================================

interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallback?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
  fallback
}: OptimizedAvatarProps) {
  return (
    <OptimizedImage
      src={src || fallback || '/default-avatar.png'}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      quality={90}
      loading="eager"
      objectFit="cover"
      fallback="/default-avatar.png"
    />
  );
}