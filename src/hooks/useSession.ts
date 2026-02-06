import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSession, saveSession, clearSession, SessionData } from "../lib/session";
import { Id } from "../../convex/_generated/dataModel";

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const upsertUser = useMutation(api.users.upsertUserFromSession);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    setIsLoading(true);
    const stored = await getSession();
    if (stored) {
      setSession(stored);
    }
    setIsLoading(false);
  };

  const createSession = useCallback(
    async (data: { username: string; email: string; phone: string }) => {
      // Upsert user in Convex
      const userId = await upsertUser({
        username: data.username,
        email: data.email,
        phone: data.phone,
      });

      const sessionData: SessionData = {
        ...data,
        userId: userId as string,
      };

      await saveSession(sessionData);
      setSession(sessionData);
      return userId;
    },
    [upsertUser]
  );

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    createSession,
    logout,
    userId: session?.userId as Id<"users"> | undefined,
    isAdmin:
      session?.username === "@cicc" &&
      session?.email === "cicc-csti@ce.pucmm.edu.do" &&
      session?.phone === "000-000-0000",
  };
}
