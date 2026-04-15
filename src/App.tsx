import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DesignPage } from './pages/DesignPage';
import { RugVisualizerPage } from './pages/RugVisualizerPage';
import { DesignDetailPage } from './pages/DesignDetailPage';
import { SamplePage } from './pages/SamplePage';
import { FeatureTiersPage } from './pages/FeatureTiersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { WishlistPage } from './pages/WishlistPage';
import { CreditsPage } from './pages/CreditsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FirebaseProvider, ErrorBoundary, useFirebase } from './components/FirebaseProvider';
import { Navigate } from 'react-router-dom';

import { storage } from './lib/storage';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, profileLoading } = useFirebase();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  React.useEffect(() => {
    // Global storage cleanup and migration on startup
    const migrateAndCleanup = async () => {
      try {
        // 1. Migrate large items to IndexedDB if they still exist in localStorage
        const largeKeys = ['rug_current_config', 'rug_generated_images', 'rug_selected_image', 'rug_saved_designs'];
        for (const key of largeKeys) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              await storage.setLarge(key, parsed);
              localStorage.removeItem(key);
              console.log(`Migrated ${key} to IndexedDB`);
            } catch (e) {
              // If not JSON, store as is
              await storage.setLarge(key, val);
              localStorage.removeItem(key);
            }
          }
        }

        // 2. Cleanup old generation data
        const lastGenTime = storage.getSmall('rug_last_gen_time');
        if (lastGenTime) {
          const diff = Date.now() - parseInt(lastGenTime);
          if (diff > 3600000) { // 1 hour
            await storage.remove('rug_generated_images');
            await storage.remove('rug_selected_variation');
          }
        }
      } catch (e) {
        console.warn("Storage migration/cleanup failed", e);
      }
    };

    migrateAndCleanup();
  }, []);

  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <div className="bg-white text-black relative min-h-screen">
            {/* Global Blue and White Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/60 blur-[120px] rounded-full" />
              <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-blue-100/20 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10">
              <Layout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/design" element={<AdminRoute><DesignPage /></AdminRoute>} />
                  <Route path="/visualizer" element={<AdminRoute><RugVisualizerPage /></AdminRoute>} />
                  <Route path="/design-detail" element={<AdminRoute><DesignDetailPage /></AdminRoute>} />
                  <Route path="/design-detail/:id" element={<AdminRoute><DesignDetailPage /></AdminRoute>} />
                  <Route path="/samples" element={<SamplePage />} />
                  <Route path="/tiers" element={<FeatureTiersPage />} />
                  <Route path="/pricing" element={<FeatureTiersPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/credits" element={<CreditsPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                </Routes>
              </Layout>
            </div>
          </div>
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
