import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

// Scroll Reveal Hook
export const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold, once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

// Scroll Reveal Animation Variants
export const scrollRevealVariants = {
  hidden: {
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

// Scroll Reveal Component
export interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className
}) => {
  const { ref, controls } = useScrollReveal(threshold);

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 50 };
      case 'down': return { opacity: 0, y: -50 };
      case 'left': return { opacity: 0, x: 50 };
      case 'right': return { opacity: 0, x: -50 };
      default: return { opacity: 0, y: 50 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up': return { opacity: 1, y: 0 };
      case 'down': return { opacity: 1, y: 0 };
      case 'left': return { opacity: 1, x: 0 };
      case 'right': return { opacity: 1, x: 0 };
      default: return { opacity: 1, y: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      animate={controls}
      variants={{
        hidden: getInitialPosition(),
        visible: {
          ...getAnimatePosition(),
          transition: {
            duration,
            delay,
            ease: 'easeOut'
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Parallax Scroll Component
export interface ParallaxScrollProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  children,
  speed = 0.5,
  className
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        ref.current.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// Scroll Progress Component
export interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  color = '#3b82f6',
  height = 4
}) => {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={cn('fixed top-0 left-0 z-50', className)}
      style={{
        width: `${scrollProgress}%`,
        height: `${height}px`,
        backgroundColor: color
      }}
      initial={{ width: 0 }}
      animate={{ width: `${scrollProgress}%` }}
      transition={{ duration: 0.1 }}
    />
  );
};

// Scroll Trigger Animation
export interface ScrollTriggerProps {
  children: React.ReactNode;
  trigger?: 'top' | 'center' | 'bottom';
  threshold?: number;
  className?: string;
}

export const ScrollTrigger: React.FC<ScrollTriggerProps> = ({
  children,
  trigger = 'center',
  threshold = 0.5,
  className
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold });

  const getTriggerPosition = () => {
    switch (trigger) {
      case 'top': return 0;
      case 'center': return 0.5;
      case 'bottom': return 1;
      default: return 0.5;
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Infinite Scroll Animation
export interface InfiniteScrollProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  speed = 1,
  direction = 'left',
  className
}) => {
  const getAnimationProps = () => {
    switch (direction) {
      case 'left':
        return {
          x: ['0%', '-100%'],
          transition: { duration: 20 / speed, repeat: Infinity, ease: 'linear' }
        };
      case 'right':
        return {
          x: ['-100%', '0%'],
          transition: { duration: 20 / speed, repeat: Infinity, ease: 'linear' }
        };
      case 'up':
        return {
          y: ['0%', '-100%'],
          transition: { duration: 20 / speed, repeat: Infinity, ease: 'linear' }
        };
      case 'down':
        return {
          y: ['-100%', '0%'],
          transition: { duration: 20 / speed, repeat: Infinity, ease: 'linear' }
        };
      default:
        return {
          x: ['0%', '-100%'],
          transition: { duration: 20 / speed, repeat: Infinity, ease: 'linear' }
        };
    }
  };

  return (
    <motion.div
      className={cn('flex', className)}
      animate={getAnimationProps()}
    >
      {children}
      {children} {/* Duplicate for seamless loop */}
    </motion.div>
  );
};

// Sticky Scroll Animation
export interface StickyScrollProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export const StickyScroll: React.FC<StickyScrollProps> = ({
  children,
  offset = 0,
  className
}) => {
  const [isSticky, setIsSticky] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setIsSticky(rect.top <= offset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      animate={{
        position: isSticky ? 'fixed' : 'relative',
        top: isSticky ? offset : 'auto',
        zIndex: isSticky ? 10 : 'auto'
      }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

// Scroll Counter Animation
export interface ScrollCounterProps {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const ScrollCounter: React.FC<ScrollCounterProps> = ({
  end,
  duration = 2,
  className,
  prefix = '',
  suffix = ''
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.5, once: true });
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
};
