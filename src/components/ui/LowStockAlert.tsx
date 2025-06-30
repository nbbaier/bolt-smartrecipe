import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import React from "react";
import type { Ingredient } from "../../types";
import { Badge } from "./badge";
import { Card, CardContent } from "./Card";

interface LowStockAlertProps {
  ingredients: Ingredient[];
  onViewPantry?: () => void;
  className?: string;
}

export function LowStockAlert({
  ingredients,
  onViewPantry,
  className,
}: LowStockAlertProps) {
  if (ingredients.length === 0) return null;

  const outOfStock = ingredients.filter((item) => item.quantity <= 0);
  const lowStock = ingredients.filter(
    (item) =>
      item.quantity > 0 && item.quantity <= (item.low_stock_threshold || 1),
  );

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-orange-900">Low Stock Alert</h3>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-300"
              >
                {ingredients.length} item
                {ingredients.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="space-y-2">
              {outOfStock.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800 font-medium">
                    {outOfStock.length} out of stock
                  </span>
                </div>
              )}

              {lowStock.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-orange-800">
                    {lowStock.length} running low
                  </span>
                </div>
              )}
            </div>

            {/* Show first few items */}
            <div className="mt-3 space-y-1">
              {ingredients.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-orange-900 font-medium truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.quantity <= 0
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {item.quantity <= 0
                        ? "Out"
                        : `${item.quantity} ${item.unit}`}
                    </span>
                  </div>
                </div>
              ))}

              {ingredients.length > 3 && (
                <div className="text-xs text-orange-700 italic">
                  ...and {ingredients.length - 3} more
                </div>
              )}
            </div>

            {onViewPantry && (
              <button
                onClick={onViewPantry}
                className="mt-3 text-sm text-orange-700 hover:text-orange-800 font-medium underline"
              >
                View Pantry →
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
