'use client';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import HeroSection from '@/components/HeroSection';
import ProductGrid from '@/components/ProductGrid';
import ProcessSection from '@/components/ProcessSection';
import BottomNav from '@/components/BottomNav';
import Modal from '@/components/Modal';
import TruQuiBot from '@/components/TruQuiBot';
import Toast from '@/components/Toast';
import LandingPage from '@/components/LandingPage';
import ChatDock from '@/components/ChatDock';

export default function Home() {
  const { currentUser, authLoading, sidebarPinned, sidebarOpen, setSidebarOpen } = useApp();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sf)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="sp sp2" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--mu)', fontWeight: 600 }}>Cargando Truekeamas...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <>
      {/* Backdrop for drawer mode */}
      {!sidebarPinned && sidebarOpen && (
        <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`app${!sidebarPinned ? ' app--drawer' : ''}`}>
        <Sidebar />
        <main className="main">
          <TopBar />
          <HeroSection />
          <ProductGrid />
          <ProcessSection />
        </main>
      </div>

      <BottomNav />
      <TruQuiBot />
      <ChatDock />
      <Modal />
      <Toast />
    </>
  );
}
