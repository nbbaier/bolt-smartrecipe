import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
	Package,
	BookOpen,
	ShoppingCart,
	MessageCircle,
	Settings,
	Home,
} from "lucide-react";

const navigation = [
	{ name: "Dashboard", href: "/", icon: Home },
	{ name: "Pantry", href: "/pantry", icon: Package },
	{ name: "Recipes", href: "/recipes", icon: BookOpen },
	{ name: "Shopping List", href: "/shopping", icon: ShoppingCart },
	{ name: "AI Assistant", href: "/assistant", icon: MessageCircle },
	{ name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
	return (
		<div className="flex h-full w-64 flex-col bg-background border-r border-border">
			<nav className="flex-1 space-y-1 p-4">
				{navigation.map((item) => (
					<NavLink
						key={item.name}
						to={item.href}
						className={({ isActive }) =>
							cn(
								"group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)
						}
					>
						<item.icon
							className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors")}
						/>
						{item.name}
					</NavLink>
				))}
			</nav>
		</div>
	);
}
