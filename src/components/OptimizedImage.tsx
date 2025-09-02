import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLazyLoading, useLazyImage } from '@/hooks/useLazyLoading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallback?: string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  blurDataURL?: string;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  fallback = '/images/placeholder.jpg',
  quality = 80,
  format = 'auto',
  sizes,
  loading = 'lazy',
  onLoad,
  onError,
  blurDataURL,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading
  const { elementRef, isVisible } = useLazyLoading<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

  // Lazy image loading
  const { imageSrc, isLoaded: imageLoaded, isError } = useLazyImage(
    isInView ? src : '',
    placeholder || blurDataURL
  );

  // Generar URL optimizada
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return fallback;
    
    // Si es una URL externa, devolver tal como está
    if (originalSrc.startsWith('http') || originalSrc.startsWith('//')) {
      return originalSrc;
    }

    // Para imágenes locales, podrías implementar optimización aquí
    // Por ejemplo, usando un servicio como Cloudinary o ImageKit
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(imageSrc);

  // Manejar carga de imagen
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  // Actualizar estado cuando la imagen esté en vista
  useEffect(() => {
    if (isVisible && !isInView) {
      setIsInView(true);
    }
  }, [isVisible, isInView]);

  // Actualizar estado cuando la imagen se cargue
  useEffect(() => {
    if (imageLoaded) {
      setIsLoaded(true);
    }
  }, [imageLoaded]);

  // Actualizar estado cuando haya error
  useEffect(() => {
    if (isError) {
      setHasError(true);
    }
  }, [isError]);

  const imageStyle = {
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
    objectFit: 'cover' as const
  };

  return (
    <div
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder/Blur */}
      {!isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center"
        >
          {blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-slate-300/50"></div>
        </motion.div>
      )}

      {/* Imagen principal */}
      <AnimatePresence>
        {isInView && (
          <motion.img
            ref={imgRef}
            src={hasError ? fallback : optimizedSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            sizes={sizes}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Error state */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-100 flex items-center justify-center"
        >
          <div className="text-center text-slate-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Error al cargar imagen</p>
          </div>
        </motion.div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-slate-100"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600">Cargando...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente para galería de imágenes optimizada
interface OptimizedImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  className?: string;
  thumbnailSize?: number;
  onImageClick?: (index: number) => void;
}

export function OptimizedImageGallery({
  images,
  className = '',
  thumbnailSize = 150,
  onImageClick
}: OptimizedImageGalleryProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative aspect-square cursor-pointer group"
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            width={thumbnailSize}
            height={thumbnailSize}
            className="rounded-lg group-hover:scale-105 transition-transform duration-300"
            placeholder="/images/placeholder-thumb.jpg"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg"></div>
        </motion.div>
      ))}
    </div>
  );
}

// Hook para preload de imágenes
export function useImagePreload(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadImage = (url: string) => {
      if (loadedImages.has(url) || loadingImages.has(url)) return;

      setLoadingImages(prev => new Set(prev).add(url));

      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      };
      img.src = url;
    };

    urls.forEach(loadImage);
  }, [urls, loadedImages, loadingImages]);

  return {
    loadedImages: Array.from(loadedImages),
    loadingImages: Array.from(loadingImages),
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url)
  };
}
