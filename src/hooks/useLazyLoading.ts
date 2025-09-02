import { useState, useEffect, useRef, useCallback } from 'react';

// =====================================================
// HOOK PARA LAZY LOADING OPTIMIZADO
// =====================================================

interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  fallback?: React.ReactNode;
}

interface UseLazyLoadingReturn {
  isVisible: boolean;
  isLoaded: boolean;
  ref: React.RefObject<HTMLElement>;
  load: () => void;
}

export const useLazyLoading = (options: LazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    fallback = null
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const load = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Crear observer si no existe
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              load();
              
              // Desconectar si solo debe activarse una vez
              if (triggerOnce) {
                observerRef.current?.unobserve(entry.target);
              }
            } else if (!triggerOnce) {
              setIsVisible(false);
            }
          });
        },
        {
          threshold,
          rootMargin,
        }
      );
    }

    // Observar el elemento
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, load]);

  // Cleanup del observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isVisible,
    isLoaded,
    ref,
    load,
  };
};

// Hook para lazy loading de imágenes
export const useLazyImage = (src: string, options: LazyLoadingOptions = {}) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !imageSrc && !isLoading) {
      setIsLoading(true);
      setHasError(false);

      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      img.src = src;
    }
  }, [isVisible, src, imageSrc, isLoading]);

  return {
    isVisible,
    isLoaded,
    ref,
    imageSrc,
    isLoading,
    hasError,
  };
};

// Hook para lazy loading de componentes
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadingOptions = {}
) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !Component && !isLoading) {
      setIsLoading(true);
      setHasError(false);

      importFunc()
        .then((module) => {
          setComponent(() => module.default);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading component:', error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isVisible, Component, isLoading, importFunc]);

  return {
    isVisible,
    isLoaded,
    ref,
    Component,
    isLoading,
    hasError,
  };
};

// Hook para lazy loading de datos
export const useLazyData = <T>(
  fetchFunc: () => Promise<T>,
  options: LazyLoadingOptions = {}
) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !data && !isLoading) {
      setIsLoading(true);
      setHasError(false);

      fetchFunc()
        .then((result) => {
          setData(result);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isVisible, data, isLoading, fetchFunc]);

  return {
    isVisible,
    isLoaded,
    ref,
    data,
    isLoading,
    hasError,
  };
};

// Hook para lazy loading de scripts
export const useLazyScript = (src: string, options: LazyLoadingOptions = {}) => {
  const { isVisible, isLoaded, ref } = useLazyLoading(options);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !isScriptLoaded && !isLoading) {
      setIsLoading(true);
      setHasError(false);

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };

      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [isVisible, src, isScriptLoaded, isLoading]);

  return {
    isVisible,
    isLoaded,
    ref,
    isScriptLoaded,
    isLoading,
    hasError,
  };
};