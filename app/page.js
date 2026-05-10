'use client';
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

export default function Home() {
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
