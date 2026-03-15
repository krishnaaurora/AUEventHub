'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Maps each role to its home dashboard route
const ROLE_HOME = {
    student: '/student/dashboard',
    organizer: '/organizer/dashboard',
    dean: '/dean/dashboard',
    registrar: '/registrar/dashboard',
    vc: '/vc/dashboard',
};

export default function ProtectedRoute({ children, role }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');

        // Not logged in at all
        if (!token || !userRaw) {
            router.replace('/login');
            return;
        }

        try {
            const user = JSON.parse(userRaw);

            // Role mismatch — redirect to the user's own correct dashboard
            if (role && user.role !== role) {
                const home = ROLE_HOME[user.role] || '/login';
                router.replace(home);
                return;
            }

            setReady(true);
        } catch {
            // Corrupt storage — clear and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.replace('/login');
        }
    }, [role, router]);

    if (!ready) return null;
    return children;
}
