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
import { ChefHat, AlertCircle } from "lucide-react";

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
		<div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
						<ChefHat className="h-6 w-6 text-primary-foreground" />
					</div>
					<CardTitle className="text-2xl">
						{isSignUp ? "Create your account" : "Welcome to SmartRecipe"}
					</CardTitle>
					<CardDescription>
						{isSignUp
							? "Start your smart cooking journey"
							: "Your intelligent cooking companion"}
					</CardDescription>
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
							className="w-full"
							disabled={loading || !isSupabaseConnected}
						>
							{loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={toggleMode}
							className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
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
