import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { recipeService } from "../../lib/database";
import { Button } from "./Button";
import { Input } from "./Input";
import { ChefHat, X } from "lucide-react";
import type { Leftover, Recipe } from "../../types";

interface LeftoverFormProps {
  leftover?: Leftover;
  onSubmit: (data: Omit<Leftover, "id" | "created_at" | "updated_at">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const UNITS = [
  "portions",
  "servings",
  "cups",
  "g",
  "kg",
  "ml",
  "l",
  "pieces",
  "slices",
];

export function LeftoverForm({ leftover, onSubmit, onCancel, loading = false }: LeftoverFormProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: leftover?.name || "",
    quantity: leftover?.quantity?.toString() || "1",
    unit: leftover?.unit || "portions",
    expiration_date: leftover?.expiration_date || "",
    source_recipe_id: leftover?.source_recipe_id || "",
    notes: leftover?.notes || "",
  });

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await recipeService.getAll();
      setRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await onSubmit({
      user_id: user.id,
      name: formData.name,
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      expiration_date: formData.expiration_date || undefined,
      source_recipe_id: formData.source_recipe_id || undefined,
      notes: formData.notes,
    });
  };

  const selectRecipe = (recipe: Recipe) => {
    setFormData({
      ...formData,
      name: `${recipe.title} (Leftovers)`,
      source_recipe_id: recipe.id,
    });
    setShowRecipeSelector(false);
  };

  const clearRecipe = () => {
    setFormData({
      ...formData,
      source_recipe_id: "",
    });
  };

  const selectedRecipe = recipes.find(r => r.id === formData.source_recipe_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Recipe Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Source Recipe (Optional)
          </label>
          {selectedRecipe ? (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <ChefHat className="h-4 w-4 text-blue-600" />
              <span className="flex-1 text-sm font-medium text-blue-900">
                {selectedRecipe.title}
              </span>
              <button
                type="button"
                onClick={clearRecipe}
                className="p-1 text-blue-600 hover:text-blue-800 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRecipeSelector(true)}
              className="w-full justify-start"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Select Recipe
            </Button>
          )}
        </div>

        {/* Recipe Selector Modal */}
        {showRecipeSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Select Recipe</h3>
                <button
                  onClick={() => setShowRecipeSelector(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[50vh] p-4">
                <div className="space-y-2">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => selectRecipe(recipe)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={recipe.image_url || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"}
                          alt={recipe.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {recipe.title}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {recipe.cuisine_type} • {recipe.difficulty}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leftover Name */}
        <Input
          label="Leftover Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Spaghetti Carbonara (Leftovers)"
        />

        {/* Quantity and Unit */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              label="Quantity"
              type="number"
              step="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full h-10 rounded-lg border border-secondary-300 px-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiration Date */}
        <Input
          label="Expiration Date (Optional)"
          type="date"
          value={formData.expiration_date}
          onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes about the leftovers..."
            className="w-full h-20 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button type="submit" disabled={loading} className="text-sm sm:text-base">
          {loading ? "Saving..." : leftover ? "Update Leftover" : "Add Leftover"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="text-sm sm:text-base">
          Cancel
        </Button>
      </div>
    </form>
  );
}