import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// Hover Scale Effect
export interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  duration = 0.2,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      transition={{ duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Hover Lift Effect
export interface HoverLiftProps {
  children: React.ReactNode;
  lift?: number;
  shadow?: boolean;
  className?: string;
}

export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  lift = 4,
  shadow = true,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        y: -lift,
        boxShadow: shadow ? '0 10px 25px rgba(0,0,0,0.15)' : undefined
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Hover Glow Effect
export interface HoverGlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  className?: string;
}

export const HoverGlow: React.FC<HoverGlowProps> = ({
  children,
  color = 'rgba(59, 130, 246, 0.5)',
  intensity = 20,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        boxShadow: `0 0 ${intensity}px ${color}`
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Hover Tilt Effect
export interface HoverTiltProps {
  children: React.ReactNode;
  maxTilt?: number;
  perspective?: number;
  className?: string;
}

export const HoverTilt: React.FC<HoverTiltProps> = ({
  children,
  maxTilt = 10,
  perspective = 1000,
  className
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [maxTilt, -maxTilt]));
  const rotateY = useSpring(useTransform(x, [-100, 100], [-maxTilt, maxTilt]));

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{
        perspective,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};

// Hover Color Transition
export interface HoverColorProps {
  children: React.ReactNode;
  fromColor?: string;
  toColor?: string;
  duration?: number;
  className?: string;
}

export const HoverColor: React.FC<HoverColorProps> = ({
  children,
  fromColor = 'transparent',
  toColor = 'rgba(59, 130, 246, 0.1)',
  duration = 0.3,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        backgroundColor: toColor
      }}
      initial={{ backgroundColor: fromColor }}
      transition={{ duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Hover Border Effect
export interface HoverBorderProps {
  children: React.ReactNode;
  borderColor?: string;
  borderWidth?: number;
  className?: string;
}

export const HoverBorder: React.FC<HoverBorderProps> = ({
  children,
  borderColor = '#3b82f6',
  borderWidth = 2,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        borderColor,
        borderWidth
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Magnetic Hover Effect
export interface MagneticHoverProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const MagneticHover: React.FC<MagneticHoverProps> = ({
  children,
  strength = 0.3,
  className
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = (event.clientX - centerX) * strength;
    const distanceY = (event.clientY - centerY) * strength;
    
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

// Hover Reveal Effect
export interface HoverRevealProps {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const HoverReveal: React.FC<HoverRevealProps> = ({
  children,
  revealContent,
  direction = 'up',
  className
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20, opacity: 0 };
      case 'down': return { y: -20, opacity: 0 };
      case 'left': return { x: 20, opacity: 0 };
      case 'right': return { x: -20, opacity: 0 };
      default: return { y: 20, opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up': return { y: 0, opacity: 1 };
      case 'down': return { y: 0, opacity: 1 };
      case 'left': return { x: 0, opacity: 1 };
      case 'right': return { x: 0, opacity: 1 };
      default: return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      whileHover="hover"
      initial="initial"
    >
      <motion.div
        variants={{
          initial: { opacity: 1 },
          hover: { opacity: 0 }
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        variants={{
          initial: getInitialPosition(),
          hover: getAnimatePosition()
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {revealContent}
      </motion.div>
    </motion.div>
  );
};

// Hover Ripple Effect
export interface HoverRippleProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export const HoverRipple: React.FC<HoverRippleProps> = ({
  children,
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 0.6,
  className
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration * 1000);
  };

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      onMouseDown={handleMouseDown}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
            width: 0,
            height: 0
          }}
          animate={{
            width: 100,
            height: 100,
            x: -50,
            y: -50,
            opacity: [1, 0]
          }}
          transition={{
            duration,
            ease: 'easeOut'
          }}
        />
      ))}
    </motion.div>
  );
};
