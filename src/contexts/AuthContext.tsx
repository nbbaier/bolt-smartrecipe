import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signUp: (
		email: string,
		password: string,
		fullName: string,
	) => Promise<{ error: any }>;
	signIn: (email: string, password: string) => Promise<{ error: any }>;
	signOut: () => Promise<void>;
	isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	// Check if Supabase is properly configured
	const isSupabaseConnected = !!(
		import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
	);

	useEffect(() => {
		let mounted = true;

		const initAuth = async () => {
			try {
				// Get initial session
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (mounted) {
					if (error) {
						console.warn("Supabase session error:", error);
					}
					setSession(session);
					setUser(session?.user ?? null);
					setLoading(false);
				}
			} catch (error) {
				if (mounted) {
					console.warn("Supabase connection error:", error);
					setLoading(false);
				}
			}
		};

		initAuth();

		// Listen for auth changes
		let subscription: any;
		try {
			const {
				data: { subscription: authSubscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				if (mounted) {
					setSession(session);
					setUser(session?.user ?? null);
					setLoading(false);
				}
			});
			subscription = authSubscription;
		} catch (error) {
			console.warn("Auth state change listener error:", error);
			if (mounted) {
				setLoading(false);
			}
		}

		return () => {
			mounted = false;
			if (subscription) {
				subscription.unsubscribe();
			}
		};
	}, []);

	const signUp = async (email: string, password: string, fullName: string) => {
		if (!isSupabaseConnected) {
			return {
				error: { message: "Please connect to Supabase to create an account" },
			};
		}

		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
					},
				},
			});
			return { error };
		} catch (error) {
			return { error };
		}
	};

	const signIn = async (email: string, password: string) => {
		if (!isSupabaseConnected) {
			return { error: { message: "Please connect to Supabase to sign in" } };
		}

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			return { error };
		} catch (error) {
			return { error };
		}
	};

	const signOut = async () => {
		if (isSupabaseConnected) {
			try {
				await supabase.auth.signOut();
			} catch (error) {
				console.warn("Sign out error:", error);
			}
		}
	};

	const value = {
		user,
		session,
		loading,
		signUp,
		signIn,
		signOut,
		isSupabaseConnected,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
