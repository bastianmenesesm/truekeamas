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
import PullToRefresh from '@/components/PullToRefresh'
import TruquiTour   from '@/components/TruquiTour';

export default function Home() {
  const { currentUser, authLoading, sidebarPinned, sidebarOpen, setSidebarOpen } = useApp();

  // Mientras Firebase Auth resuelve (~500ms): skeleton neutro para evitar el flash
  // de la landing page en usuarios ya autenticados.
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--ln)', borderTopColor: 'var(--v)',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  // Auth resuelta y sin sesión → LandingPage (también visible para Google/Bing)
  if (!currentUser) {
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
      <TruquiTour />
      <BottomNav />
      <Truki />
      <ChatDock />
      <Modal />
      <Toast />
      <Suspense><AutoOpenProduct /></Suspense>
    </>
  );
}
