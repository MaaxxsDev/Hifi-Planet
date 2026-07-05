import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const offsetFor = {
  up: { y: 40 },
  left: { x: -56 },
  right: { x: 56 },
};

function buildVariants(direction) {
  const offset = offsetFor[direction] || offsetFor.up;
  return {
    hidden: { opacity: 0, scale: 0.96, filter: 'blur(8px)', ...offset },
    visible: { opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' },
  };
}

const shineVariants = {
  hidden: { x: '-130%' },
  visible: { x: '230%', transition: { duration: 1.1, ease: 'easeInOut', delay: 0.4 } },
};

// Trigger-based reveal: each element fades/slides/un-blurs into place the
// first time it enters the viewport, then stays put. Calm and predictable
// on repeated scrolling in either direction (no re-triggering, no jitter).
export default function Reveal({ children, direction = 'up', className = '', index = 0, shine = false }) {
  const delay = Math.min(index * 0.09, 0.45);

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25, margin: '-100px' }}
      variants={buildVariants(direction)}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
      {shine && (
        <motion.div
          aria-hidden
          variants={shineVariants}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      )}
    </motion.div>
  );
}
