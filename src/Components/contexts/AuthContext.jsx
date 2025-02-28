/* eslint-disable react/prop-types */
import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeUser = (user) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, initializeUser);
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
