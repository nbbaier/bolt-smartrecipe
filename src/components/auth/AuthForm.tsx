import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/Card";
import { ChefHat, AlertCircle, Sparkles } from "lucide-react";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema
	.extend({
		fullName: z.string().min(2, "Full name must be at least 2 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthForm() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { signIn, signUp, isSupabaseConnected } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<SignUpFormData>({
		resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
	});

	const onSubmit = async (data: SignUpFormData) => {
		setLoading(true);
		setError(null);

		try {
			if (isSignUp) {
				const { error } = await signUp(
					data.email,
					data.password,
					data.fullName,
				);
				if (error) throw error;
			} else {
				const { error } = await signIn(data.email, data.password);
				if (error) throw error;
			}
		} catch (err: any) {
			setError(err.message || "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => {
		setIsSignUp(!isSignUp);
		setError(null);
		reset();
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-2xl border-emerald-100">
				<CardHeader className="text-center pb-8">
					<div className="mx-auto mb-6 relative">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl">
							<ChefHat className="h-8 w-8 text-white" />
							<Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-300 animate-pulse" />
						</div>
					</div>
					<div className="space-y-2">
						<CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
							{isSignUp ? "Join SmartRecipe" : "Welcome Back"}
						</CardTitle>
						<CardDescription className="text-base">
							{isSignUp
								? "Start your AI-powered cooking journey today"
								: "Your intelligent cooking companion awaits"}
						</CardDescription>
						<div className="flex items-center justify-center space-x-2 pt-2">
							<span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
								Beta
							</span>
							<span className="text-xs text-muted-foreground">•</span>
							<span className="text-xs text-muted-foreground">AI-Powered</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{!isSupabaseConnected && (
						<div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950 dark:border-amber-800">
							<div className="flex items-start space-x-3">
								<AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
								<div>
									<h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
										Setup Required
									</h4>
									<p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
										Click "Connect to Supabase" in the top right to set up
										authentication and database.
									</p>
								</div>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{isSignUp && (
							<Input
								label="Full Name"
								{...register("fullName")}
								error={errors.fullName?.message}
								disabled={loading || !isSupabaseConnected}
							/>
						)}
						<Input
							label="Email"
							type="email"
							{...register("email")}
							error={errors.email?.message}
							disabled={loading || !isSupabaseConnected}
						/>
						<Input
							label="Password"
							type="password"
							{...register("password")}
							error={errors.password?.message}
							disabled={loading || !isSupabaseConnected}
						/>
						{isSignUp && (
							<Input
								label="Confirm Password"
								type="password"
								{...register("confirmPassword")}
								error={errors.confirmPassword?.message}
								disabled={loading || !isSupabaseConnected}
							/>
						)}

						{error && (
							<div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
							disabled={loading || !isSupabaseConnected}
						>
							{loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={toggleMode}
							className="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50 font-medium"
							disabled={loading}
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</div>

					{!isSupabaseConnected && (
						<div className="mt-6 text-center">
							<p className="text-xs text-muted-foreground">
								Demo mode - Connect Supabase for full functionality
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}