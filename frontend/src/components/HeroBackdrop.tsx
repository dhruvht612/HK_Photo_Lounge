import { motion } from 'framer-motion';
import { GodRays } from '@paper-design/shaders-react';

type HeroBackdropProps = {
  /** Editorial photography behind light rays */
  backgroundImageUrl?: string;
};

/**
 * Full-bleed hero background (image, vignettes, GodRays).
 * Place inside a `relative` container with a viewport-tall clipping region, e.g.
 * `absolute inset-x-0 top-0 h-[100svh] overflow-hidden`.
 */
export function HeroBackdrop({ backgroundImageUrl }: HeroBackdropProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      {backgroundImageUrl ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 22, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        >
          <img
            src={backgroundImageUrl}
            alt=""
            className="h-full w-full object-cover object-center opacity-[0.42]"
          />
        </motion.div>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/25 via-ink-950/88 to-black"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_60%_at_50%_20%,rgba(201,169,98,0.09),transparent_55%)]"
      />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <GodRays
          colorBack="#00000000"
          colors={['#a1a1aa45', '#e4e4e738', '#c9a96242', '#71717a38']}
          colorBloom="#c9a962"
          offsetX={0.85}
          offsetY={-1}
          intensity={0.52}
          spotty={0.45}
          midSize={0.1}
          midIntensity={0}
          density={0.38}
          bloom={0.35}
          speed={0.72}
          scale={1.55}
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-b from-black/15 via-transparent to-black/55"
      />
    </div>
  );
}
