import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "openhouse_session";

export interface SessionData {
  username: string;
  email: string;
  phone: string;
  userId?: string;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function saveSession(data: SessionData): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
