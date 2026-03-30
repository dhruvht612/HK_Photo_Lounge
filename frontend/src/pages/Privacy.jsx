import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 md:px-6 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Legal</p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-sand-50 md:text-5xl">Privacy policy</h1>
        <p className="mt-10 text-base leading-relaxed text-sand-300/85">
          HK Photo Lounge respects your privacy. We use the information you share for enquiries and
          project communication only, and we do not sell your data. A full policy will appear here
          as we expand this page.
        </p>
        <p className="mt-6 text-base leading-relaxed text-sand-300/85">
          Questions? Reach us through the{' '}
          <Link to="/contact" className="text-accent underline-offset-4 transition hover:underline">
            Contact
          </Link>{' '}
          page.
        </p>
      </motion.div>
    </div>
  );
}
