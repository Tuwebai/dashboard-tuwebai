import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation Context
interface AnimationContextType {
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
}

const AnimationContext = React.createContext<AnimationContextType | undefined>(undefined);

// Animation Provider Component
export interface AnimationProviderProps {
  children: React.ReactNode;
  reducedMotion?: boolean;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  reducedMotion: initialReducedMotion = false
}) => {
  const [reducedMotion, setReducedMotion] = React.useState(initialReducedMotion);

  // Check for user's motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    reducedMotion,
    setReducedMotion
  };

  return (
    <AnimationContext.Provider value={value}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </AnimationContext.Provider>
  );
};

// Hook to use animation context
export const useAnimation = () => {
  const context = React.useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// Reduced Motion Wrapper
export interface ReducedMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ReducedMotion: React.FC<ReducedMotionProps> = ({
  children,
  fallback
}) => {
  const { reducedMotion } = useAnimation();

  if (reducedMotion) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
};

// Animation Variants for Common Use Cases
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

export const slideInUp = {
  hidden: { opacity: 0, y: 100 },
  visible: { opacity: 1, y: 0 }
};

export const slideInDown = {
  hidden: { opacity: 0, y: -100 },
  visible: { opacity: 1, y: 0 }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 }
};

// Common Transition Configurations
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

export const smoothTransition = {
  duration: 0.3,
  ease: 'easeOut'
};

export const bouncyTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 10
};

export const gentleTransition = {
  duration: 0.5,
  ease: 'easeInOut'
};

// Stagger Animation Configuration
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Animation Utilities
export const getReducedMotionVariants = (variants: any) => {
  const { reducedMotion } = useAnimation();
  
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    };
  }
  
  return variants;
};

export const getReducedMotionTransition = (transition: any) => {
  const { reducedMotion } = useAnimation();
  
  if (reducedMotion) {
    return { duration: 0.1 };
  }
  
  return transition;
};
