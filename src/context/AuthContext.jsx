import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await client.get('/users/me');
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user', error);
                localStorage.removeItem('access_token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            console.log('[Auth] Attempting login to:', client.defaults.baseURL);

            const response = await client.post('/auth/login/access-token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);
            setToken(access_token);

            // Fetch user right away to prevent routing race conditions
            const userResponse = await client.get('/users/me');
            setUser(userResponse.data);

            toast.success('Access Granted');
            return true;
        } catch (error) {
            console.error('[Auth] Login error:', error);

            // Network / CORS error (no response from server)
            if (!error.response) {
                toast.error(`Cannot reach server. Check network or backend URL.\n${client.defaults.baseURL}`, { duration: 6000 });
                return false;
            }

            // Server returned an error response
            const status = error.response?.status;
            const detail = error.response?.data?.detail;

            if (status === 400 || status === 401 || status === 422) {
                // Show backend's exact error message if available
                const msg = detail || 'Incorrect email or password';
                toast.error(`Access Denied: ${msg}`, { duration: 5000 });
            } else if (status === 429) {
                toast.error('Too many login attempts. Try again in 15 minutes.', { duration: 6000 });
            } else {
                toast.error(`Login failed (${status}): ${detail || 'Unknown error'}`, { duration: 5000 });
            }

            return false;
        }
    };

    const signup = async (userData) => {
        try {
            await client.post('/auth/signup', userData);
            toast.success('Account Created. Please Login.');
            return true;
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Registration Failed.');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
        toast('Session Terminated', { icon: '🔒' });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
