import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { queryClient } from './lib/queryClient';
import { getGuestId } from './lib/identity';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import NamePicker from './pages/NamePicker';
import RegisterForm from './pages/RegisterForm';
import AttendancePage from './pages/AttendancePage';
import CarsPage from './pages/CarsPage';
import GroupsPage from './pages/GroupsPage';
import RoomsPage from './pages/RoomsPage';
import AdminPanel from './pages/AdminPanel';
import type { Guest } from './lib/types';

function AppContent() {
  const [guestId, setGuestIdState] = useState(getGuestId);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleGuestPicked = useCallback((guest: Guest) => {
    setGuestIdState(guest.id);
    if (!guest.isRegistered) {
      setSelectedGuest(guest);
    } else {
      setSelectedGuest(null);
    }
  }, []);

  const handleRegistered = useCallback(() => {
    setSelectedGuest(null);
  }, []);

  // Onboarding: no guest selected yet
  if (!guestId) {
    return <NamePicker onPicked={handleGuestPicked} />;
  }

  // Registration form
  if (selectedGuest) {
    return <RegisterForm guest={selectedGuest} onDone={handleRegistered} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-surface-0">
        <Header onAdminClick={() => setShowAdmin(true)} />
        <main className="pt-16 pb-20 px-4 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<AttendancePage />} />
              <Route path="/cars" element={<CarsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <BottomNav />
        <AdminPanel open={showAdmin} onClose={() => setShowAdmin(false)} />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
