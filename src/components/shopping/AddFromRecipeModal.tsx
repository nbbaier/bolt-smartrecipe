import React from "react";
import type { Recipe } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface AddFromRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFromRecipe: (recipeId: string) => void;
  availableRecipes: Recipe[];
  loading: boolean;
}

export const AddFromRecipeModal: React.FC<AddFromRecipeModalProps> = ({
  visible,
  onClose,
  onAddFromRecipe,
  availableRecipes,
  loading,
}) => {
  if (!visible) return null;
  return (
    <Card className="mx-auto mt-8 max-w-lg">
      <CardHeader className="flex flex-row justify-between items-center pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">
          Add Ingredients from Recipe
        </CardTitle>
        <Button variant="ghost" onClick={onClose} className="ml-auto">
          Close
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center">Loading recipes...</div>
        ) : (
          <div className="space-y-2">
            {availableRecipes.length === 0 ? (
              <div className="py-8 text-center text-secondary-600">
                No recipes available.
              </div>
            ) : (
              availableRecipes.map((recipe) => (
                <Button
                  key={recipe.id}
                  onClick={() => onAddFromRecipe(recipe.id)}
                  className="justify-start w-full"
                >
                  {recipe.title}
                </Button>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
