import type { Meta, StoryObj } from '@storybook/react';
import { AnimationProvider, useAnimation } from './AnimationProvider';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Demo component that uses animations
const AnimatedDemo = () => {
  const { reducedMotion, setReducedMotion } = useAnimation();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Animation Demo</h2>
        <Button
          onClick={() => setReducedMotion(!reducedMotion)}
          variant="outline"
        >
          {reducedMotion ? 'Enable Animations' : 'Disable Animations'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Card {item}</h3>
              <p className="text-muted-foreground">
                This card has hover and tap animations. When reduced motion is enabled,
                these animations will be disabled.
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="bg-primary/10 p-4 rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
      >
        <h3 className="font-semibold mb-2">Animated Info Box</h3>
        <p className="text-sm text-muted-foreground">
          This box animates in with a spring effect. The animation respects the user's
          motion preferences.
        </p>
      </motion.div>
    </div>
  );
};

const meta: Meta<typeof AnimationProvider> = {
  title: 'Animations/AnimationProvider',
  component: AnimationProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AnimationProvider>
      <AnimatedDemo />
    </AnimationProvider>
  ),
};

export const WithReducedMotion: Story = {
  render: () => (
    <AnimationProvider reducedMotion={true}>
      <AnimatedDemo />
    </AnimationProvider>
  ),
};

export const Interactive: Story = {
  render: () => (
    <AnimationProvider>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Interactive Animation Demo</h2>
        <p className="text-muted-foreground mb-6">
          Toggle the reduced motion setting to see how animations adapt to user preferences.
        </p>
        <AnimatedDemo />
      </div>
    </AnimationProvider>
  ),
};
