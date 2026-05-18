'use client';
import { Suspense } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import HeroSection from '@/components/HeroSection';
import ProductGrid from '@/components/ProductGrid';
import ProcessSection from '@/components/ProcessSection';
import BottomNav from '@/components/BottomNav';
import Modal from '@/components/Modal';
import Truki from '@/components/Truki';
import Toast from '@/components/Toast';
import LandingPage from '@/components/LandingPage';
import ChatDock from '@/components/ChatDock';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';
import AutoOpenProduct from '@/components/AutoOpenProduct';
import PullToRefresh from '@/components/PullToRefresh';

export default function Home() {
  const { currentUser, authLoading, sidebarPinned, sidebarOpen, setSidebarOpen } = useApp();

  // Mientras carga auth o no hay sesión → LandingPage
  // Esto garantiza que Google/Bing ven contenido real (H1, descripción, productos)
  // en el HTML inicial, en lugar de un spinner vacío.
  if (authLoading || !currentUser) {
    return (
      <>
        <LandingPage />
        <Modal />
        <Toast />
      </>
    );
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
          <VerifyEmailBanner />
          <HeroSection />
          <ProductGrid />
          <ProcessSection />
        </main>
      </div>

      <PullToRefresh />
      <BottomNav />
      <Truki />
      <ChatDock />
      <Modal />
      <Toast />
      <Suspense><AutoOpenProduct /></Suspense>
    </>
  );
}
