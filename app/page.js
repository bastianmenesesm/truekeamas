'use client';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import HeroSection from '@/components/HeroSection';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';
import ProcessSection from '@/components/ProcessSection';
import BottomNav from '@/components/BottomNav';
import Modal from '@/components/Modal';
import TruQuiBot from '@/components/TruQuiBot';
import Toast from '@/components/Toast';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { currentUser, authLoading } = useApp();

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
      <div className="app">
        <Sidebar />
        <main className="main">
          <TopBar />
          <HeroSection />
          <CategoryGrid />
          <ProductGrid />
          <ProcessSection />
        </main>
      </div>
      <BottomNav />
      <TruQuiBot />
      <Modal />
      <Toast />
    </>
  );
}
