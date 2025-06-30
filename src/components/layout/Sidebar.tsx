import {
  BookOpen,
  ChefHat,
  Home,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Pantry", href: "/pantry", icon: Package },
  { name: "Recipes", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping", icon: ShoppingCart },
  { name: "Leftovers", href: "/leftovers", icon: Utensils },
  { name: "AI Assistant", href: "/assistant", icon: MessageCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border">
      {/* Enhanced Sidebar Header with Branding */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-50 to-emerald-100/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <ChefHat className="h-4 w-4 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
              SmartRecipe
            </h2>
            <p className="text-xs text-muted-foreground">Smart Cooking</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose} // Close sidebar on mobile when clicking nav item
            className={({ isActive }) =>
              cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
              )
            }
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200",
                "group-hover:scale-110",
              )}
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Powered by AI • Made with ❤️
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <span>Version 1.0</span>
            <span>•</span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              Beta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
