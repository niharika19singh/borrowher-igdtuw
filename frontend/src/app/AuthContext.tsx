import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User, type IdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, callFunction } from "../firebase/client";
import type { UserProfile, EnsureUserProfileResponse } from "../types/backend";
import { hasStudentAccess, readableError } from "../utils/identity";

type Session = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  isStudent: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
};
const Context = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<IdTokenResult | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!auth || !db) return;
    let unsubscribeProfile = () => {};
    let generation = 0;
    const unsubscribeAuth = onIdTokenChanged(auth, async (current) => {
      const version = ++generation;
      unsubscribeProfile();
      setLoading(true);
      setProfile(null);
      setToken(null);
      setError("");
      setUser(current);
      if (!current) {
        setLoading(false);
        return;
      }
      try {
        const result = await current.getIdTokenResult();
        if (version !== generation) return;
        setToken(result);
        unsubscribeProfile = onSnapshot(
          doc(db!, "users", current.uid),
          (snapshot) => {
            if (version !== generation) return;
            setProfile(
              snapshot.exists() ? (snapshot.data() as UserProfile) : null,
            );
            setLoading(false);
          },
          (err) => {
            if (version === generation) {
              setError(readableError(err));
              setLoading(false);
            }
          },
        );
      } catch (err) {
        if (version === generation) {
          setError(readableError(err));
          setLoading(false);
        }
      }
    });
    return () => {
      ++generation;
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);
  async function refresh() {
    if (!auth?.currentUser) return;
    setError("");
    try {
      await auth.currentUser.reload();
      await callFunction<Record<string, never>, EnsureUserProfileResponse>(
        "ensureUserProfile",
        {},
      );
      const nextToken = await auth.currentUser.getIdTokenResult(true);
      setToken(nextToken);
      setUser(auth.currentUser);
    } catch (err) {
      setError(readableError(err));
      throw err;
    }
  }
  const isStudent = hasStudentAccess({
    email: user?.email ?? null,
    emailVerified: !!user?.emailVerified,
    verifiedStudent: token?.claims.verifiedStudent === true,
    verificationStatus: profile?.verificationStatus,
    accountStatus: profile?.accountStatus,
  });
  const isAdmin =
    token?.claims.admin === true &&
    !!user?.emailVerified &&
    profile?.accountStatus === "active";
  return (
    <Context.Provider
      value={{ user, profile, loading, error, isStudent, isAdmin, refresh }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
