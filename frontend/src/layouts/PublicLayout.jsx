import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Footer } from '../components/Footer.jsx';
import { PublicHeader } from '../components/PublicNavBar.jsx';

export function PublicLayout() {
  const { pathname } = useLocation();
  const showHeader = pathname !== '/';

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      {showHeader ? <PublicHeader /> : null}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1"
      >
        <Outlet />
      </motion.main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
