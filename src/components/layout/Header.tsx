import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { ChefHat, LogOut, User, Menu } from "lucide-react";

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const { user, signOut } = useAuth();

	return (
		<header className="border-b border-border bg-background">
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
						
						<div className="flex items-center space-x-2 sm:space-x-3">
							<div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary">
								<ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
							</div>
							<h1 className="text-lg sm:text-xl font-bold text-foreground">SmartRecipe</h1>
						</div>
					</div>

					<div className="flex items-center space-x-2 sm:space-x-4">
						<div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
							<User className="h-4 w-4" />
							<span className="max-w-32 sm:max-w-none truncate">
								{user?.user_metadata?.full_name || user?.email}
							</span>
						</div>
						<Button variant="ghost" size="icon" onClick={signOut}>
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}