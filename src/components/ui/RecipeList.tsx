import React from "react";
import type { RecipeMatchResult } from "../../lib/database";
import type { Recipe } from "../../types";
import { RecipeCard } from "./RecipeCard";

interface RecipeListProps {
  recipes: (Recipe | RecipeMatchResult)[];
  bookmarkedRecipes: string[];
  onBookmark: (id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  canCookMatches?: RecipeMatchResult[];
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  bookmarkedRecipes,
  onBookmark,
  onSelectRecipe,
  canCookMatches,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
      {recipes.map((recipe) => {
        let matchInfo: RecipeMatchResult | undefined = undefined;
        if (canCookMatches && "recipe_id" in recipe) {
          matchInfo = canCookMatches.find(
            (m) => m.recipe_id === (recipe as RecipeMatchResult).recipe_id,
          );
        }
        const recipeId =
          "id" in recipe ? recipe.id : (recipe as RecipeMatchResult).recipe_id;
        return (
          <RecipeCard
            key={recipeId}
            recipe={recipe}
            isBookmarked={bookmarkedRecipes.includes(recipeId)}
            onBookmark={onBookmark}
            onClick={() => onSelectRecipe(recipe as Recipe)}
            matchPercentage={matchInfo?.match_percentage}
            missingIngredients={matchInfo?.missing_ingredients}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};
