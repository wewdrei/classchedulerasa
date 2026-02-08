import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api'; // Use the configured axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in (e.g., from a previous session)
        const fetchUser = async () => {
            try {
                const { data } = await axios.get('/api/user');
                setUser(data);
            } catch (error) {
                console.log('Not authenticated');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (credentials) => {
        await axios.get('/sanctum/csrf-cookie');
        await axios.post('/api/login', credentials);
        const { data } = await axios.get('/api/user');
        setUser(data);
    };

    const logout = async () => {
        await axios.post('/api/logout');
        setUser(null);
    };

    const hasRole = (roleName) => {
        return user?.role?.name.toLowerCase() === roleName.toLowerCase();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, hasRole, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};