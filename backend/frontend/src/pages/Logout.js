import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.clear();
        navigate('/');
    }, [navigate]);

    return null;
};

export default Logout;