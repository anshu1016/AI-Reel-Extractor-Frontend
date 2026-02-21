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
            console.error('Login error:', error);
            toast.error('Access Denied: Invalid Credentials');
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
