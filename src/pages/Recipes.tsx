import { BookOpen, Plus, Sparkles, Utensils, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RecipeDetailModal } from "../components/recipes/RecipeDetailModal";
import { RecipeFilters } from "../components/recipes/RecipeFilters";
import { RecipeList } from "../components/recipes/RecipeList";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { useRecipe } from "../contexts/RecipeContext";
import type { RecipeMatchResult } from "../lib/database";
import {
  ingredientService,
  leftoverService,
  recipeService,
  shoppingListService,
} from "../lib/database";
import type { Ingredient, Recipe, ShoppingList } from "../types";

export function Recipes() {
  const { user } = useAuth();
  const {
    recipes,
    loading,
    bookmarkedRecipes,
    selectedRecipe,
    recipeIngredients,
    recipeInstructions,
    loadRecipeDetails,
    toggleBookmark,
    setSelectedRecipe,
    addRecipe,
    updateRecipe,
  } = useRecipe();
  const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
  const [userShoppingLists, setUserShoppingLists] = useState<ShoppingList[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [showCanCookOnly, setShowCanCookOnly] = useState(false);
  const [showAddToShoppingModal, setShowAddToShoppingModal] = useState(false);
  const [selectedShoppingListId, setSelectedShoppingListId] =
    useState<string>("");
  const [addingToShopping, setAddingToShopping] = useState(false);
  const [showCreateLeftoverModal, setShowCreateLeftoverModal] = useState(false);
  const [creatingLeftover, setCreatingLeftover] = useState(false);
  const [sortKey, setSortKey] = useState("recent");
  const [itemsToShow, setItemsToShow] = useState(12);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formState, setFormState] = useState<
    Omit<Recipe, "id" | "created_at" | "updated_at">
  >({
    user_id: user?.id || "",
    title: "",
    description: "",
    image_url: "",
    prep_time: 0,
    cook_time: 0,
    servings: 1,
    difficulty: "Easy",
    cuisine_type: "",
  });
  const [canCookMatches, setCanCookMatches] = useState<RecipeMatchResult[]>([]);
  const [minMatch, setMinMatch] = useState(70); // Default: show recipes with at least 70% match
  const [maxMissing, setMaxMissing] = useState(3); // Default: show recipes with at most 3 missing ingredients
  const [canCookSortKey, setCanCookSortKey] = useState<
    | "match"
    | "missing"
    | "cook_time_asc"
    | "cook_time_desc"
    | "difficulty_asc"
    | "difficulty_desc"
  >("match");

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [ingredientsData, shoppingListsData] = await Promise.all([
        ingredientService.getAll(user.id),
        shoppingListService.getAllLists(user.id),
      ]);

      setUserIngredients(ingredientsData);
      setUserShoppingLists(shoppingListsData);

      // Fetch can cook matches with server-side filtering and pagination
      const matches = await recipeService.getRecipeMatchesForPantry(user.id, {
        minMatchPercentage: minMatch,
        maxMissingIngredients: maxMissing,
        limit: itemsToShow,
        offset: 0,
      });
      setCanCookMatches(matches);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [user, minMatch, maxMissing, itemsToShow]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkIngredientAvailability = (ingredientName: string) => {
    return userIngredients.some(
      (userIng) =>
        userIng.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(userIng.name.toLowerCase()),
    );
  };

  const getMissingIngredients = () => {
    if (!recipeIngredients.length) return [];

    return recipeIngredients.filter(
      (recipeIng) => !checkIngredientAvailability(recipeIng.ingredient_name),
    );
  };

  const addMissingToShoppingList = async () => {
    if (!selectedRecipe || !selectedShoppingListId) return;

    try {
      setAddingToShopping(true);
      console.log(
        "Adding missing ingredients to shopping list:",
        selectedShoppingListId,
      );

      await shoppingListService.createFromRecipe(
        selectedShoppingListId,
        selectedRecipe.id,
        userIngredients,
      );

      setShowAddToShoppingModal(false);
      setSelectedShoppingListId("");

      toast.success(
        `Added missing ingredients from "${selectedRecipe.title}" to your shopping list!`,
      );
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast.error(
        "Failed to add ingredients to shopping list. Please try again.",
      );
    } finally {
      setAddingToShopping(false);
    }
  };

  const createLeftoverFromRecipe = async () => {
    if (!selectedRecipe || !user) return;

    try {
      setCreatingLeftover(true);
      await leftoverService.createFromRecipe(
        user.id,
        selectedRecipe.id,
        selectedRecipe.title,
        2, // Default 2 portions
        "portions",
        "Created from recipe",
      );

      setShowCreateLeftoverModal(false);

      toast.success(`Created leftover entry for "${selectedRecipe.title}"!`);
    } catch (error) {
      console.error("Error creating leftover:", error);
      toast.error("Failed to create leftover. Please try again.");
    } finally {
      setCreatingLeftover(false);
    }
  };

  const openAddRecipe = () => {
    setEditingRecipe(null);
    setFormState({
      user_id: user?.id || "",
      title: "",
      description: "",
      image_url: "",
      prep_time: 0,
      cook_time: 0,
      servings: 1,
      difficulty: "Easy",
      cuisine_type: "",
    });
    setShowRecipeForm(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]:
        name === "prep_time" || name === "cook_time" || name === "servings"
          ? Number(value)
          : value,
    }));
  };

  const handleRecipeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, formState);
    } else {
      await addRecipe(formState);
    }
    setShowRecipeForm(false);
    setEditingRecipe(null);
  };

  let filteredRecipes: (Recipe | RecipeMatchResult)[];
  if (showCanCookOnly) {
    filteredRecipes = canCookMatches.filter((match) => {
      const matchesSearch = match.recipe_title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Difficulty filter is not available directly, so skip for now or join with recipes if needed
      return matchesSearch;
    });
  } else {
    filteredRecipes = recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        recipe.difficulty === selectedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (showCanCookOnly) {
      const aMatch = a as RecipeMatchResult;
      const bMatch = b as RecipeMatchResult;
      switch (canCookSortKey) {
        case "match":
          return bMatch.match_percentage - aMatch.match_percentage;
        case "missing":
          return (
            (aMatch.missing_ingredients?.length ?? 0) -
            (bMatch.missing_ingredients?.length ?? 0)
          );
        case "cook_time_asc":
          // No cook_time in RecipeMatchResult, so skip or use 0
          return 0;
        case "cook_time_desc":
          return 0;
        case "difficulty_asc":
          return 0;
        case "difficulty_desc":
          return 0;
        default:
          return 0;
      }
    }
    // Type guard for Recipe
    const aRecipe = a as Recipe;
    const bRecipe = b as Recipe;
    switch (sortKey) {
      case "cook_time_asc":
        return (
          aRecipe.prep_time +
          aRecipe.cook_time -
          (bRecipe.prep_time + bRecipe.cook_time)
        );
      case "cook_time_desc":
        return (
          bRecipe.prep_time +
          bRecipe.cook_time -
          (aRecipe.prep_time + aRecipe.cook_time)
        );
      case "difficulty_asc": {
        const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
        return (
          (diffOrder[aRecipe.difficulty as keyof typeof diffOrder] || 0) -
          (diffOrder[bRecipe.difficulty as keyof typeof diffOrder] || 0)
        );
      }
      case "difficulty_desc": {
        const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
        return (
          (diffOrder[bRecipe.difficulty as keyof typeof diffOrder] || 0) -
          (diffOrder[aRecipe.difficulty as keyof typeof diffOrder] || 0)
        );
      }
      case "recent":
      default:
        return (
          new Date(bRecipe.created_at).getTime() -
          new Date(aRecipe.created_at).getTime()
        );
    }
  });

  const visibleRecipes = sortedRecipes.slice(0, itemsToShow);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
            Recipe Discovery
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Find delicious recipes to cook
          </p>
        </div>
        <div className="flex justify-center items-center space-x-2 sm:justify-start">
          <span className="text-sm text-gray-600">Can cook:</span>
          <Badge variant="secondary" className="text-green-800 bg-green-100">
            {canCookMatches.length} recipes
          </Badge>
          <Button onClick={openAddRecipe} className="ml-4" variant="default">
            <Plus className="mr-1 w-4 h-4" /> Add Recipe
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <RecipeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        showCanCookOnly={showCanCookOnly}
        onToggleCanCook={() => setShowCanCookOnly((v) => !v)}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
      />

      {/* Advanced Filters for Can Cook */}
      {showCanCookOnly && (
        <div className="flex flex-col p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 sm:flex-row sm:items-center sm:space-x-6">
          <div className="flex items-center mb-2 space-x-2 sm:mb-0">
            <label
              htmlFor="min-match"
              className="text-sm font-medium text-gray-700"
            >
              Min Match %:
            </label>
            <input
              id="min-match"
              type="number"
              min={0}
              max={100}
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="px-2 py-1 w-16 text-sm rounded border"
            />
          </div>
          <div className="flex items-center mb-2 space-x-2 sm:mb-0">
            <label
              htmlFor="max-missing"
              className="text-sm font-medium text-gray-700"
            >
              Max Missing:
            </label>
            <input
              id="max-missing"
              type="number"
              min={0}
              max={20}
              value={maxMissing}
              onChange={(e) => setMaxMissing(Number(e.target.value))}
              className="px-2 py-1 w-16 text-sm rounded border"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="can-cook-sort"
              className="text-sm font-medium text-gray-700"
            >
              Sort by:
            </label>
            <select
              id="can-cook-sort"
              value={canCookSortKey}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCanCookSortKey(e.target.value as typeof canCookSortKey)
              }
              className="px-2 py-1 text-sm rounded border"
            >
              <option value="match">Match % (high → low)</option>
              <option value="missing">Fewest Missing</option>
              {/* Optionally add more when RecipeMatchResult includes cook_time/difficulty */}
            </select>
          </div>
        </div>
      )}

      {/* Can Cook Banner */}
      {canCookMatches.length > 0 && !showCanCookOnly && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 p-2 bg-green-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-green-900 sm:text-base">
                    You can cook {canCookMatches.length} recipes with your
                    current ingredients!
                  </h3>
                  <p className="text-xs text-green-700 sm:text-sm">
                    Make the most of what you have in your pantry
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowCanCookOnly(true)}
                className="text-sm sm:text-base"
              >
                View Recipes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center sm:py-12">
            <BookOpen className="mx-auto mb-4 w-10 h-10 text-gray-400 sm:h-12 sm:w-12" />
            <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
              No recipes found
            </h3>
            <p className="px-4 text-sm text-gray-600 sm:text-base">
              {showCanCookOnly
                ? "Add more ingredients to your pantry to unlock more recipes"
                : "Try adjusting your search or filter criteria"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <RecipeList
          recipes={visibleRecipes}
          bookmarkedRecipes={bookmarkedRecipes}
          onBookmark={toggleBookmark}
          onSelectRecipe={loadRecipeDetails}
          canCookMatches={
            showCanCookOnly ? (visibleRecipes as RecipeMatchResult[]) : []
          }
        />
      )}

      {itemsToShow < sortedRecipes.length && (
        <div className="flex justify-center mt-6">
          <Button onClick={() => setItemsToShow(itemsToShow + 12)}>
            Load More
          </Button>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          open={!!selectedRecipe}
          recipe={selectedRecipe}
          ingredients={recipeIngredients}
          instructions={recipeInstructions}
          loading={loading}
          onClose={() => {
            setSelectedRecipe(null);
            setShowAddToShoppingModal(false);
            setShowCreateLeftoverModal(false);
            setSelectedShoppingListId("");
          }}
          isBookmarked={
            selectedRecipe
              ? bookmarkedRecipes.includes(selectedRecipe.id)
              : false
          }
          onBookmark={toggleBookmark}
          canCook={
            selectedRecipe && showCanCookOnly
              ? canCookMatches.some(
                  (r) =>
                    r.recipe_id === selectedRecipe.id &&
                    r.match_percentage >= minMatch,
                )
              : false
          }
          userShoppingLists={userShoppingLists}
          showAddToShoppingModal={showAddToShoppingModal}
          setShowAddToShoppingModal={setShowAddToShoppingModal}
          selectedShoppingListId={selectedShoppingListId}
          setSelectedShoppingListId={setSelectedShoppingListId}
          addMissingToShoppingList={addMissingToShoppingList}
          addingToShopping={addingToShopping}
          showCreateLeftoverModal={showCreateLeftoverModal}
          setShowCreateLeftoverModal={setShowCreateLeftoverModal}
          createLeftoverFromRecipe={createLeftoverFromRecipe}
          creatingLeftover={creatingLeftover}
          getMissingIngredients={getMissingIngredients}
        />
      )}

      {/* Add to Shopping List Modal */}
      {showAddToShoppingModal && selectedRecipe && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg sm:text-xl">
                  Add to Shopping List
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddToShoppingModal(false);
                    setSelectedShoppingListId("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Add missing ingredients from "{selectedRecipe.title}" to your
                shopping list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Missing Ingredients Preview */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="mb-2 text-sm font-medium text-orange-900">
                  Missing Ingredients ({getMissingIngredients().length}
                  ):
                </h4>
                <div className="space-y-1">
                  {getMissingIngredients()
                    .slice(0, 5)
                    .map((ingredient, index) => (
                      <div key={index} className="text-xs text-orange-800">
                        • {ingredient.ingredient_name} ({ingredient.quantity}{" "}
                        {ingredient.unit})
                      </div>
                    ))}
                  {getMissingIngredients().length > 5 && (
                    <div className="text-xs italic text-orange-600">
                      ...and {getMissingIngredients().length - 5} more
                    </div>
                  )}
                </div>
              </div>

              {/* Shopping List Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Select Shopping List:
                </label>
                <select
                  value={selectedShoppingListId}
                  onChange={(e) => setSelectedShoppingListId(e.target.value)}
                  className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose a list...</option>
                  {userShoppingLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={addMissingToShoppingList}
                  disabled={!selectedShoppingListId || addingToShopping}
                  className="flex justify-center items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingToShopping ? "Adding..." : "Add to List"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddToShoppingModal(false);
                    setSelectedShoppingListId("");
                  }}
                  disabled={addingToShopping}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Leftover Modal */}
      {showCreateLeftoverModal && selectedRecipe && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg sm:text-xl">
                  Create Leftover
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCreateLeftoverModal(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Create a leftover entry for "{selectedRecipe.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipe Preview */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      selectedRecipe.image_url ||
                      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                    }
                    alt={selectedRecipe.title}
                    className="object-cover w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {selectedRecipe.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Serves {selectedRecipe.servings} •{" "}
                      {selectedRecipe.difficulty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="mb-2 text-sm font-medium text-blue-900">
                  Default Leftover Details:
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• Name: {selectedRecipe.title} (Leftovers)</div>
                  <div>• Quantity: 2 portions</div>
                  <div>• Expires: 3 days from now</div>
                  <div>• Linked to this recipe</div>
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  You can edit these details after creation in the Leftovers
                  page.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={createLeftoverFromRecipe}
                  disabled={creatingLeftover}
                  className="flex justify-center items-center space-x-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>
                    {creatingLeftover ? "Creating..." : "Create Leftover"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateLeftoverModal(false);
                  }}
                  disabled={creatingLeftover}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recipe Add/Edit Modal */}
      {showRecipeForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/40">
          <form
            className="p-6 space-y-4 w-full max-w-md bg-white rounded-lg shadow-lg"
            onSubmit={handleRecipeFormSubmit}
          >
            <h2 className="mb-2 text-lg font-bold">
              {editingRecipe ? "Edit Recipe" : "Add Recipe"}
            </h2>
            <input
              name="title"
              value={formState.title}
              onChange={handleFormChange}
              placeholder="Title"
              className="p-2 w-full rounded border"
              required
            />
            <textarea
              name="description"
              value={formState.description}
              onChange={handleFormChange}
              placeholder="Description"
              className="p-2 w-full rounded border"
              required
            />
            <input
              name="image_url"
              value={formState.image_url}
              onChange={handleFormChange}
              placeholder="Image URL"
              className="p-2 w-full rounded border"
            />
            <div className="flex space-x-2">
              <input
                name="prep_time"
                type="number"
                value={formState.prep_time}
                onChange={handleFormChange}
                placeholder="Prep Time (min)"
                className="p-2 w-1/3 rounded border"
                min={0}
                required
              />
              <input
                name="cook_time"
                type="number"
                value={formState.cook_time}
                onChange={handleFormChange}
                placeholder="Cook Time (min)"
                className="p-2 w-1/3 rounded border"
                min={0}
                required
              />
              <input
                name="servings"
                type="number"
                value={formState.servings}
                onChange={handleFormChange}
                placeholder="Servings"
                className="p-2 w-1/3 rounded border"
                min={1}
                required
              />
            </div>
            <select
              name="difficulty"
              value={formState.difficulty}
              onChange={handleFormChange}
              className="p-2 w-full rounded border"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <input
              name="cuisine_type"
              value={formState.cuisine_type}
              onChange={handleFormChange}
              placeholder="Cuisine Type"
              className="p-2 w-full rounded border"
            />
            <div className="flex justify-end mt-4 space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRecipeForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                {editingRecipe ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
