import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { ChefHat, LogOut, User, Menu, Sparkles } from "lucide-react";

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const { user, signOut } = useAuth();

	return (
		<header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-14 sm:h-16 items-center justify-between">
					<div className="flex items-center space-x-3">
						{/* Mobile menu button */}
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden"
							onClick={onMenuClick}
						>
							<Menu className="h-5 w-5" />
						</Button>
						
						{/* Enhanced Brand Logo */}
						<div className="flex items-center space-x-2 sm:space-x-3">
							<div className="relative">
								<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
									<ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
									<Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
								</div>
							</div>
							<div className="flex flex-col">
								<div className="flex items-center space-x-1">
									<h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
										SmartRecipe
									</h1>
									<span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
										Beta
									</span>
								</div>
								<p className="hidden sm:block text-xs text-muted-foreground">
									AI-Powered Cooking Assistant
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center space-x-2 sm:space-x-4">
						<div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
							<User className="h-4 w-4" />
							<span className="max-w-32 sm:max-w-none truncate">
								{user?.user_metadata?.full_name || user?.email}
							</span>
						</div>
						<Button 
							variant="ghost" 
							size="icon" 
							onClick={signOut}
							className="hover:bg-red-50 hover:text-red-600 transition-colors"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}