import React, {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useState,
} from "react";
import { bookmarkService, recipeService } from "../lib/database";
import type { Recipe, RecipeIngredient, RecipeInstruction } from "../types";
import { useAuth } from "./AuthContext";

interface RecipeContextType {
   recipes: Recipe[];
   loading: boolean;
   bookmarkedRecipes: string[];
   selectedRecipe: Recipe | null;
   recipeIngredients: RecipeIngredient[];
   recipeInstructions: RecipeInstruction[];
   loadRecipes: () => Promise<void>;
   loadRecipeDetails: (recipe: Recipe) => Promise<void>;
   toggleBookmark: (recipeId: string) => Promise<void>;
   setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
   addRecipe: (
      recipe: Omit<Recipe, "id" | "created_at" | "updated_at">,
   ) => Promise<void>;
   updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
   deleteRecipe: (id: string) => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({
   children,
}) => {
   const { user } = useAuth();
   const [recipes, setRecipes] = useState<Recipe[]>([]);
   const [bookmarkedRecipes, setBookmarkedRecipes] = useState<string[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
   const [recipeIngredients, setRecipeIngredients] = useState<
      RecipeIngredient[]
   >([]);
   const [recipeInstructions, setRecipeInstructions] = useState<
      RecipeInstruction[]
   >([]);

   const loadRecipes = useCallback(async () => {
      setLoading(true);
      try {
         const data = await recipeService.getAll();
         setRecipes(data);
         if (user) {
            const bookmarks = await bookmarkService.getUserBookmarks(user.id);
            setBookmarkedRecipes(bookmarks);
         } else {
            setBookmarkedRecipes([]);
         }
      } catch (error) {
         console.error("Error loading recipes:", error);
      } finally {
         setLoading(false);
      }
   }, [user]);

   const loadRecipeDetails = useCallback(async (recipe: Recipe) => {
      setSelectedRecipe(recipe);
      setLoading(true);
      try {
         const [ingredients, instructions] = await Promise.all([
            recipeService.getIngredients(recipe.id),
            recipeService.getInstructions(recipe.id),
         ]);
         setRecipeIngredients(ingredients);
         setRecipeInstructions(instructions);
      } catch (error) {
         console.error("Error loading recipe details:", error);
      } finally {
         setLoading(false);
      }
   }, []);

   const toggleBookmark = useCallback(
      async (recipeId: string) => {
         if (!user) return;
         try {
            if (bookmarkedRecipes.includes(recipeId)) {
               await bookmarkService.removeBookmark(user.id, recipeId);
               setBookmarkedRecipes((prev) =>
                  prev.filter((id) => id !== recipeId),
               );
            } else {
               const wasAdded = await bookmarkService.addBookmark(
                  user.id,
                  recipeId,
               );
               if (wasAdded) {
                  setBookmarkedRecipes((prev) => [...prev, recipeId]);
               } else {
                  setBookmarkedRecipes((prev) =>
                     prev.includes(recipeId) ? prev : [...prev, recipeId],
                  );
               }
            }
         } catch (error) {
            console.error("Error toggling bookmark:", error);
         }
      },
      [user, bookmarkedRecipes],
   );

   const addRecipe = useCallback(
      async (recipe: Omit<Recipe, "id" | "created_at" | "updated_at">) => {
         try {
            await recipeService.create(recipe);
            await loadRecipes();
         } catch (error) {
            console.error("Error adding recipe:", error);
         }
      },
      [loadRecipes],
   );

   const updateRecipe = useCallback(
      async (id: string, updates: Partial<Recipe>) => {
         try {
            await recipeService.update(id, updates);
            await loadRecipes();
         } catch (error) {
            console.error("Error updating recipe:", error);
         }
      },
      [loadRecipes],
   );

   const deleteRecipe = useCallback(
      async (id: string) => {
         try {
            await recipeService.delete(id);
            await loadRecipes();
         } catch (error) {
            console.error("Error deleting recipe:", error);
         }
      },
      [loadRecipes],
   );

   useEffect(() => {
      loadRecipes();
   }, [loadRecipes]);

   return (
      <RecipeContext.Provider
         value={{
            recipes,
            loading,
            bookmarkedRecipes,
            selectedRecipe,
            recipeIngredients,
            recipeInstructions,
            loadRecipes,
            loadRecipeDetails,
            toggleBookmark,
            setSelectedRecipe,
            addRecipe,
            updateRecipe,
            deleteRecipe,
         }}
      >
         {children}
      </RecipeContext.Provider>
   );
};

export function useRecipe() {
   const ctx = useContext(RecipeContext);
   if (!ctx) throw new Error("useRecipe must be used within a RecipeProvider");
   return ctx;
}
