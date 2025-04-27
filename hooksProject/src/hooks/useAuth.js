// src/hooks/useAuth.js
import { useState, useEffect } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      const storedUser = localStorage.getItem(`user_${userId}`);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  return { user };
};
