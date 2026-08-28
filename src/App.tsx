import { useEffect } from 'react';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext';
import { ToastProvider } from '@/components/Toast';
import { useScrollReveal, triggerRevealScan } from '@/hooks/useScrollReveal';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import BackToTop from '@/components/BackToTop';
import WhatsAppButton from '@/components/WhatsAppButton';
import CartDrawer from '@/components/CartDrawer';

import Hero from '@/components/sections/Hero';
import WhyChoose from '@/components/sections/WhyChoose';
import About from '@/components/sections/About';
import CourseCatalog from '@/components/sections/CourseCatalog';
import Gallery from '@/components/sections/Gallery';
import Timeline from '@/components/sections/Timeline';
import Testimonials from '@/components/sections/Testimonials';
import News from '@/components/sections/News';
import CTASection from '@/components/sections/CTASection';
import ContactForm from '@/components/sections/ContactForm';

import CourseDetails from '@/components/CourseDetails';
import Checkout from '@/components/Checkout';
import RegisterForm from '@/components/RegisterForm';
import VerifyEmail from '@/components/VerifyEmail';
import UploadDocs from '@/components/UploadDocs';
import DocsSent from '@/components/DocsSent';
import AdminPanel from '@/components/AdminPanel';

function HomePage() {
  useScrollReveal();
  return (
    <>
      <Hero />
      <WhyChoose />
      <About />
      <CourseCatalog />
      <Gallery />
      <Timeline />
      <Testimonials />
      <News />
      <CTASection />
      <ContactForm />
    </>
  );
}

const BARE_ROUTES = new Set([
  'register', 'verify-email', 'upload-docs', 'docs-sent', 'admin', 'admin-user',
]);

function AppContent() {
  const { route } = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('scroll'));
      triggerRevealScan();
    }, 80);
    return () => clearTimeout(timer);
  }, [route]);

  const isBarePage = BARE_ROUTES.has(route.name);

  if (isBarePage) {
    return (
      <div className="min-h-screen bg-noir">
        <ScrollProgress />
        {route.name === 'register' && <RegisterForm />}
        {route.name === 'verify-email' && <VerifyEmail />}
        {route.name === 'upload-docs' && <UploadDocs />}
        {route.name === 'docs-sent' && <DocsSent />}
        {(route.name === 'admin' || route.name === 'admin-user') && <AdminPanel />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <ScrollProgress />
      <Header />
      <CartDrawer />

      <main>
        {route.name === 'home' && <HomePage />}
        {route.name === 'course' && <CourseDetails slug={route.slug} />}
        {route.name === 'contact' && (
          <div className="pt-16 md:pt-20">
            <ContactForm />
          </div>
        )}
        {route.name === 'cart' && <Checkout />}
        {route.name === 'checkout' && <Checkout />}
      </main>

      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  );
}
