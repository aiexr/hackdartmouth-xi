import { useEffect } from "react";

export function useInitializeDatabase() {
  useEffect(() => {
    const initializeDb = async () => {
      try {
        const res = await fetch("/api/init");
        if (!res.ok) {
          console.warn("Database initialization returned non-OK status");
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initializeDb();
  }, []);
}
