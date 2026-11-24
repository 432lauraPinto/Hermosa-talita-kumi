import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import RequireRole from './components/RequireRole';

// Públicas
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BranchesPage from './pages/BranchesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Cliente
import BookingPage from './pages/BookingPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import MyHistoryPage from './pages/MyHistoryPage';

// Panel Encargado y Admin
import PanelLayout from './pages/panel/PanelLayout';
import DashboardPage from './pages/panel/DashboardPage';
import AgendaPage from './pages/panel/AgendaPage';
import InventoryPage from './pages/panel/InventoryPage';
import ClientsTreatmentsPage from './pages/panel/ClientsTreatmentsPage';
import CatalogAdminPage from './pages/panel/CatalogAdminPage';
import UsersAdminPage from './pages/panel/UsersAdminPage';
import AuditAdminPage from './pages/panel/AuditAdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BranchProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<HomePage />} />
                <Route path="/servicios" element={<ServicesPage />} />
                <Route path="/sucursales" element={<BranchesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />

                {/* Reserva visible para explorar disponibilidad; confirmación autenticada */}
                <Route path="/reservar" element={<BookingPage />} />

                {/* Rutas exclusivas de cliente autenticado */}
                <Route
                  path="/mis-citas"
                  element={
                    <RequireRole roles={['cliente', 'encargado', 'admin']}>
                      <MyAppointmentsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/mi-historial"
                  element={
                    <RequireRole roles={['cliente', 'encargado', 'admin']}>
                      <MyHistoryPage />
                    </RequireRole>
                  }
                />

                {/* Panel Encargado y Admin */}
                <Route
                  path="/panel"
                  element={
                    <RequireRole roles={['encargado', 'admin']}>
                      <PanelLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="agenda" element={<AgendaPage />} />
                  <Route path="inventario" element={<InventoryPage />} />
                  <Route path="clientes" element={<ClientsTreatmentsPage />} />

                  {/* Solo Admin */}
                  <Route
                    path="catalogo"
                    element={
                      <RequireRole roles={['admin']}>
                        <CatalogAdminPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="usuarios"
                    element={
                      <RequireRole roles={['admin']}>
                        <UsersAdminPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="auditoria"
                    element={
                      <RequireRole roles={['admin']}>
                        <AuditAdminPage />
                      </RequireRole>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <FloatingWhatsApp />
            <Chatbot />
          </div>
        </BranchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
