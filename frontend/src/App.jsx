import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { Home } from './pages/Home.jsx';
import { Portfolio } from './pages/Portfolio.jsx';
import { PortfolioDetail } from './pages/PortfolioDetail.jsx';
import { Services } from './pages/Services.jsx';
import { ServiceDetail } from './pages/ServiceDetail.jsx';
import { About } from './pages/About.jsx';
import { Contact } from './pages/Contact.jsx';
import { Privacy } from './pages/Privacy.jsx';
import { Terms } from './pages/Terms.jsx';
import { AdminLogin } from './pages/admin/AdminLogin.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminPortfolio } from './pages/admin/AdminPortfolio.jsx';
import { AdminPortfolioEdit } from './pages/admin/AdminPortfolioEdit.jsx';
import { AdminCategories } from './pages/admin/AdminCategories.jsx';
import { AdminServices } from './pages/admin/AdminServices.jsx';
import { AdminTestimonials } from './pages/admin/AdminTestimonials.jsx';
import { AdminInquiries } from './pages/admin/AdminInquiries.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:slug" element={<PortfolioDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="portfolio" element={<AdminPortfolio />} />
        <Route path="portfolio/new" element={<AdminPortfolioEdit />} />
        <Route path="portfolio/:id" element={<AdminPortfolioEdit />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
