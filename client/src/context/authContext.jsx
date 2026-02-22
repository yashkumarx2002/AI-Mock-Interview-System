import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

export const AuthContext = createContext();

const getStoredAuth = () => {
  const storedAuth = localStorage.getItem("auth");
  return storedAuth ? JSON.parse(storedAuth) : { user: null, token: null };
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getStoredAuth);

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  const login = (user, token) => {
    setAuth({ user, token });
    localStorage.setItem("auth", JSON.stringify({ user, token }));
  };

  const logout = () => {
    setAuth({ user: null, token: null });
    localStorage.removeItem("auth");
    toast.success("Logged out successfully")
  };

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
