import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

// Click Ripple Effect
export interface ClickRippleProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export const ClickRipple: React.FC<ClickRippleProps> = ({
  children,
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 0.6,
  className
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
      onClick={handleClick}
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

// Click Scale Effect
export interface ClickScaleProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export const ClickScale: React.FC<ClickScaleProps> = ({
  children,
  scale = 0.95,
  duration = 0.1,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileTap={{ scale }}
      transition={{ duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Click Bounce Effect
export interface ClickBounceProps {
  children: React.ReactNode;
  className?: string;
}

export const ClickBounce: React.FC<ClickBounceProps> = ({
  children,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileTap={{
        scale: [1, 0.9, 1.1, 1],
        transition: {
          duration: 0.3,
          ease: 'easeOut'
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Click Shake Effect
export interface ClickShakeProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

export const ClickShake: React.FC<ClickShakeProps> = ({
  children,
  intensity = 10,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileTap={{
        x: [0, -intensity, intensity, -intensity, intensity, 0],
        transition: {
          duration: 0.5,
          ease: 'easeOut'
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Click Glow Effect
export interface ClickGlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  className?: string;
}

export const ClickGlow: React.FC<ClickGlowProps> = ({
  children,
  color = 'rgba(59, 130, 246, 0.5)',
  intensity = 20,
  duration = 0.3,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileTap={{
        boxShadow: `0 0 ${intensity}px ${color}`,
        transition: { duration }
      }}
    >
      {children}
    </motion.div>
  );
};

// Click Pulse Effect
export interface ClickPulseProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export const ClickPulse: React.FC<ClickPulseProps> = ({
  children,
  scale = 1.1,
  duration = 0.2,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileTap={{
        scale,
        transition: {
          duration,
          ease: 'easeOut'
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Click Magnetic Effect
export interface ClickMagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const ClickMagnetic: React.FC<ClickMagneticProps> = ({
  children,
  strength = 0.3,
  className
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

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

  const handleClick = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

// Click Confirmation Effect
export interface ClickConfirmationProps {
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmationText?: string;
  className?: string;
}

export const ClickConfirmation: React.FC<ClickConfirmationProps> = ({
  children,
  onConfirm,
  confirmationText = '¡Confirmado!',
  className
}) => {
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const handleClick = () => {
    setIsConfirmed(true);
    onConfirm?.();
    
    setTimeout(() => {
      setIsConfirmed(false);
    }, 1000);
  };

  return (
    <motion.div
      className={cn('relative', className)}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {isConfirmed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <motion.span
            className="text-green-600 font-semibold text-sm"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            {confirmationText}
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
};

// Click Loading Effect
export interface ClickLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
}

export const ClickLoading: React.FC<ClickLoadingProps> = ({
  children,
  loading = false,
  loadingText = 'Cargando...',
  className
}) => {
  return (
    <motion.div
      className={cn('relative', className)}
      whileTap={{ scale: loading ? 1 : 0.95 }}
    >
      {children}
      
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-sm text-muted-foreground">{loadingText}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Click Success Effect
export interface ClickSuccessProps {
  children: React.ReactNode;
  onSuccess?: () => void;
  successText?: string;
  className?: string;
}

export const ClickSuccess: React.FC<ClickSuccessProps> = ({
  children,
  onSuccess,
  successText = '¡Éxito!',
  className
}) => {
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleClick = () => {
    setIsSuccess(true);
    onSuccess?.();
    
    setTimeout(() => {
      setIsSuccess(false);
    }, 1500);
  };

  return (
    <motion.div
      className={cn('relative', className)}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {isSuccess && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <motion.svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>
            <span className="text-green-600 font-semibold text-sm">{successText}</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
