import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import FloatingWhatsApp from './components/FloatingWhatsApp';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ProductsPage from './pages/ProductsPage';
import BranchesPage from './pages/BranchesPage';
import PromotionsPage from './pages/PromotionsPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientProfilePage from './pages/ClientProfilePage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBranchesPage from './pages/admin/AdminBranchesPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminTreatmentsPage from './pages/admin/AdminTreatmentsPage';
import AdminRulesPage from './pages/admin/AdminRulesPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';

function MainApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [navParams, setNavParams] = useState({});
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    setNavParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectServiceForBooking = (serviceId) => {
    setSelectedServiceForBooking(serviceId);
  };

  const renderContent = () => {
    // Protección de rutas administrativas
    if (currentPage.startsWith('admin-')) {
      if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'ADMIN_GENERAL' && user.role !== 'ENCARGADO')) {
        return <LoginPage onNavigate={navigateTo} />;
      }
      switch (currentPage) {
        case 'admin-dashboard':
          return <AdminDashboardPage onNavigate={navigateTo} />;
        case 'admin-branches':
          return <AdminBranchesPage onNavigate={navigateTo} />;
        case 'admin-appointments':
          return <AdminAppointmentsPage onNavigate={navigateTo} />;
        case 'admin-services':
          return <AdminServicesPage onNavigate={navigateTo} />;
        case 'admin-treatments':
          return <AdminTreatmentsPage onNavigate={navigateTo} />;
        case 'admin-rules':
          return <AdminRulesPage onNavigate={navigateTo} />;
        case 'admin-products':
          return <AdminProductsPage onNavigate={navigateTo} />;
        case 'admin-payments':
          return <AdminPaymentsPage onNavigate={navigateTo} />;
        case 'admin-clients':
          return <AdminClientsPage onNavigate={navigateTo} />;
        default:
          return <AdminDashboardPage onNavigate={navigateTo} />;
      }
    }

    // Rutas públicas y de cliente
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'services':
        return (
          <ServicesPage
            onNavigate={navigateTo}
            onSelectServiceForBooking={handleSelectServiceForBooking}
            initialCategoryCode={navParams.categoryCode}
          />
        );
      case 'products':
        return <ProductsPage onNavigate={navigateTo} />;
      case 'branches':
        return <BranchesPage onNavigate={navigateTo} />;
      case 'promotions':
        return <PromotionsPage onNavigate={navigateTo} />;
      case 'booking':
        return (
          <BookingPage
            initialBranchId={navParams.branchId}
            initialServiceId={navParams.serviceId || selectedServiceForBooking}
            initialPromoId={navParams.promoId}
            onNavigate={navigateTo}
          />
        );
      case 'login':
        return <LoginPage onNavigate={navigateTo} navParams={navParams} />;
      case 'register':
        return <RegisterPage onNavigate={navigateTo} />;
      case 'profile':
        if (!user) {
          return <LoginPage onNavigate={navigateTo} />;
        }
        return <ClientProfilePage onNavigate={navigateTo} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF8F0' }}>
      <Navbar onNavigate={navigateTo} currentPage={currentPage} />
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>
      <Footer onNavigate={navigateTo} />
      <FloatingWhatsApp />
      <Chatbot onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <MainApp />
      </BranchProvider>
    </AuthProvider>
  );
}
