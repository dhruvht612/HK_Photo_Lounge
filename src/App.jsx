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
import { PortalLayout } from './layouts/PortalLayout.jsx';
import { PortalLogin } from './pages/portal/PortalLogin.jsx';
import { PortalRegister } from './pages/portal/PortalRegister.jsx';
import { PortalResetPassword } from './pages/portal/PortalResetPassword.jsx';
import { PortalDashboard } from './pages/portal/PortalDashboard.jsx';
import { PortalPlaceholder } from './pages/portal/PortalPlaceholder.jsx';

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

      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal/register" element={<PortalRegister />} />
      <Route path="/portal/reset-password" element={<PortalResetPassword />} />

      <Route
        path="/portal"
        element={
          <ProtectedRoute role="client">
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PortalDashboard />} />
        <Route
          path="bookings"
          element={<PortalPlaceholder title="My Bookings" phase={3} />}
        />
        <Route
          path="galleries"
          element={<PortalPlaceholder title="Galleries" phase={5} />}
        />
        <Route
          path="messages"
          element={<PortalPlaceholder title="Messages" phase={4} />}
        />
        <Route
          path="documents"
          element={<PortalPlaceholder title="Documents" phase={5} />}
        />
        <Route
          path="inspiration"
          element={<PortalPlaceholder title="Inspiration Board" phase={6} />}
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
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
