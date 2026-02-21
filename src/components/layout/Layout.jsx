import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-dark">
                <div className="animate-spin w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-bg-dark text-white font-body selection:bg-neon-pink selection:text-white overflow-x-hidden">
            <Header />
            <main className="pt-24 px-4 pb-12 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
                <Outlet />
            </main>

            {/* Decorative Background Elements */}
            <div className="fixed top-20 left-10 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-neon-pink/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        </div>
    );
};

export default Layout;
