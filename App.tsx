import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import RoomManager from './components/admin/RoomManager';
import BookingManager from './components/admin/BookingManager';
import UserManager from './components/admin/UserManager';
import DocumentManager from './components/admin/DocumentManager';
import { initData, getCurrentUnitId, getUserById, syncDocumentsFromSupabase } from './utils/dataManager';
import { testSupabaseConnection } from './utils/supabaseClient';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('ECABINET_AUTH_USER');
      if (!userStr) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const localSessionId = localStorage.getItem('ECABINET_SESSION_ID');
        
        // Get fresh user data from "DB"
        // Pass user.unitId to ensure we check the correct unit's database
        const dbUser = getUserById(user.id, user.unitId);
        
        // If user NOT found in DB (e.g. data reset), OR session mismatch
        if (!dbUser || (dbUser.currentSessionId && dbUser.currentSessionId !== localSessionId)) {
            console.warn("Session mismatch or user invalid. Logging out.");
            localStorage.removeItem('ECABINET_AUTH_USER');
            localStorage.removeItem('ECABINET_SESSION_ID');
            
            setIsAuthenticated(false);
            window.dispatchEvent(new Event('auth-change'));
            return;
        }
        
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Auth check error", e);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    // Check session every 2 seconds
    const interval = setInterval(checkAuth, 2000);
    
    window.addEventListener('auth-change', checkAuth);
    return () => {
        window.removeEventListener('auth-change', checkAuth);
        clearInterval(interval);
    };
  }, []);

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  // Initialize state with the current unit ID to avoid unnecessary updates on mount
  const [currentUnitId, setCurrentUnitId] = useState<string>(() => getCurrentUnitId());

  useEffect(() => {
    // Test Supabase Connection
    testSupabaseConnection();

    // Initial data seed
    initData();
    
    // Sync documents from Supabase
    syncDocumentsFromSupabase(getCurrentUnitId());
    
    // Ensure state matches current unit (in case initData changed it, though unlikely)
    const initialUnit = getCurrentUnitId();
    if (initialUnit !== currentUnitId) {
        setCurrentUnitId(initialUnit);
    }

    // Listen for unit changes to re-render the app tree
    const handleUnitChange = () => {
        const newUnitId = getCurrentUnitId();
        setCurrentUnitId(prev => (prev !== newUnitId ? newUnitId : prev));
        syncDocumentsFromSupabase(newUnitId);
    };

    window.addEventListener('unit-change', handleUnitChange);
    return () => window.removeEventListener('unit-change', handleUnitChange);
  }, []);

  return (
    <>
      <style>{`
        /* Global Background */
        body {
          background-color: #ffffff;
          background-image: 
              radial-gradient(1200px 700px at 20% -10%, rgba(14,165,164,0.12), transparent 55%),
              radial-gradient(1000px 600px at 90% 10%, rgba(37,99,235,0.10), transparent 60%);
        }

        /* Marquee Animation */
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        /* Hub Pulse Animation */
        @keyframes hubPulse {
          0% { filter: brightness(1); transform: scale(1); }
          50% { filter: brightness(1.08); transform: scale(1.02); }
          100% { filter: brightness(1); transform: scale(1); }
        }
        .hub-pulse {
          animation: hubPulse 520ms ease;
        }

        /* Paper Fly Animation */
        @keyframes paperFly {
          0% {
            opacity: 0;
            transform: translate3d(var(--sx), var(--sy), 0) rotate(var(--sr)) scale(0.98);
          }
          10% { opacity: 0.95; }
          100% {
            opacity: 0;
            transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--tr)) scale(0.4);
          }
        }
        .paper {
          animation: paperFly var(--dur) ease-in forwards;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
        }

        /* Fade/Zoom Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        
        .mask-gradient-to-t {
            mask-image: linear-gradient(to top, transparent, black);
            -webkit-mask-image: linear-gradient(to top, transparent, black);
        }

        /* Table Styles for Document Viewer */
        .prose table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        .prose th, .prose td {
            border: 1px solid #e2e8f0;
            padding: 0.5rem;
            text-align: left;
        }
        .prose th {
            background-color: #f8fafc;
            font-weight: 600;
        }
      `}</style>

      {/* 
        Key prop forces React to remount the entire tree when unit changes. 
        This ensures all child components (UserManagement, Navbar, etc.) 
        re-run their useEffects and fetch fresh data for the new unit.
      */}
      <div 
        key={currentUnitId}
        className="antialiased text-slate-600 bg-white font-sans selection:bg-teal-500/30 selection:text-teal-900" 
        id="top"
      >
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<RoomManager />} />
              <Route path="bookings" element={<BookingManager />} />
              <Route path="users" element={<UserManager />} />
              <Route path="documents" element={<DocumentManager />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

export default App;