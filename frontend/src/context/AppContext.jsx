import { createContext, useContext, useEffect, useState } from "react";
import api from "../apiIntercepter.js";
import { toast } from "react-toastify";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    async function fetchUser() {
        try {
            setLoading(true);
            const {data} = await api.get(`/api/v1/me`, {
                withCredentials: true
            });
            setUser(data);
            setIsAuth(true);
        } catch (error) {
            console.log(error);
            setUser(null);
            setIsAuth(false);
        } finally {
            setLoading(false);
        }
    }

    async function logoutUser(navigate) {
        try {
            await api.post(`/api/v1/logout`);
            toast.success("Logged out successfully");
            setUser(null);
            setIsAuth(false);
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AppContext.Provider  value={{ user, loading, isAuth, setIsAuth, setUser, logoutUser }}>
            {children}
        </AppContext.Provider>
    )
}

export const AppData = () => {
    const context = useContext(AppContext);
    
    if(!context) {
        throw new Error("AppData must be used within AppProvider");
    }
    return context;
}