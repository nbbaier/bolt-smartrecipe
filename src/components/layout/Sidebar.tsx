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
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

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
    <div className="flex flex-col w-64 h-full border-r bg-background border-border">
      {/* Enhanced Sidebar Header with Branding */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 border-b border-border to-emerald-100/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
              <ChefHat className="w-4 h-4 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
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
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
                "flex-shrink-0 mr-3 w-5 h-5 transition-all duration-200",
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
          <p className="mb-1 text-xs text-muted-foreground">
            Powered by AI • Made with ❤️
          </p>
          <div className="flex justify-center items-center space-x-1 text-xs text-muted-foreground">
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
