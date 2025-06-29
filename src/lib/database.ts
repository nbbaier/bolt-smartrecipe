import { supabase } from "./supabase";
import type {
	Ingredient,
	Recipe,
	RecipeIngredient,
	RecipeInstruction,
	ShoppingList,
	ShoppingListItem,
} from "../types";

// Ingredient operations
export const ingredientService = {
	async getAll(userId: string): Promise<Ingredient[]> {
		const { data, error } = await supabase
			.from("ingredients")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async create(
		ingredient: Omit<Ingredient, "id" | "created_at" | "updated_at">,
	): Promise<Ingredient> {
		const { data, error } = await supabase
			.from("ingredients")
			.insert([ingredient])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async update(id: string, updates: Partial<Ingredient>): Promise<Ingredient> {
		const { data, error } = await supabase
			.from("ingredients")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async delete(id: string): Promise<void> {
		const { error } = await supabase.from("ingredients").delete().eq("id", id);

		if (error) throw error;
	},

	async getExpiringSoon(
		userId: string,
		days: number = 7,
	): Promise<Ingredient[]> {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + days);

		const { data, error } = await supabase
			.from("ingredients")
			.select("*")
			.eq("user_id", userId)
			.not("expiration_date", "is", null)
			.lte("expiration_date", futureDate.toISOString().split("T")[0])
			.order("expiration_date", { ascending: true });

		if (error) throw error;
		return data || [];
	},
};

// Recipe operations
export const recipeService = {
	async getAll(): Promise<Recipe[]> {
		const { data, error } = await supabase
			.from("recipes")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getById(id: string): Promise<Recipe | null> {
		const { data, error } = await supabase
			.from("recipes")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null; // Not found
			throw error;
		}
		return data;
	},

	async getIngredients(recipeId: string): Promise<RecipeIngredient[]> {
		const { data, error } = await supabase
			.from("recipe_ingredients")
			.select("*")
			.eq("recipe_id", recipeId)
			.order("ingredient_name");

		if (error) throw error;
		return data || [];
	},

	async getInstructions(recipeId: string): Promise<RecipeInstruction[]> {
		const { data, error } = await supabase
			.from("recipe_instructions")
			.select("*")
			.eq("recipe_id", recipeId)
			.order("step_number");

		if (error) throw error;
		return data || [];
	},

	async getCanCook(userIngredients: string[]): Promise<Recipe[]> {
		if (userIngredients.length === 0) return [];

		// Get all recipes with their ingredients
		const { data: recipesWithIngredients, error } = await supabase
			.from("recipes")
			.select(`
        *,
        recipe_ingredients (
          ingredient_name,
          quantity,
          unit
        )
      `);

		if (error) throw error;

		// Filter recipes that can be made with available ingredients
		const canCookRecipes =
			recipesWithIngredients?.filter((recipe) => {
				const requiredIngredients =
					recipe.recipe_ingredients?.map((ri) =>
						ri.ingredient_name.toLowerCase(),
					) || [];

				return requiredIngredients.every((required) =>
					userIngredients.some(
						(available) =>
							available.toLowerCase().includes(required) ||
							required.includes(available.toLowerCase()),
					),
				);
			}) || [];

		return canCookRecipes;
	},
};

// Bookmark operations
export const bookmarkService = {
	async getUserBookmarks(userId: string): Promise<string[]> {
		const { data, error } = await supabase
			.from("user_bookmarks")
			.select("recipe_id")
			.eq("user_id", userId);

		if (error) throw error;
		return data?.map((b) => b.recipe_id) || [];
	},

	async addBookmark(userId: string, recipeId: string): Promise<boolean> {
		const { error } = await supabase
			.from("user_bookmarks")
			.insert([{ user_id: userId, recipe_id: recipeId }]);

		if (error) {
			if (error.code === "23505") {
				// Duplicate key error - bookmark already exists
				return false;
			}
			throw error;
		}
		return true;
	},

	async removeBookmark(userId: string, recipeId: string): Promise<void> {
		const { error } = await supabase
			.from("user_bookmarks")
			.delete()
			.eq("user_id", userId)
			.eq("recipe_id", recipeId);

		if (error) throw error;
	},
};

// Shopping List operations
export const shoppingListService = {
	async getAllLists(userId: string): Promise<ShoppingList[]> {
		const { data, error } = await supabase
			.from("shopping_lists")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async createList(
		list: Omit<ShoppingList, "id" | "created_at" | "updated_at">,
	): Promise<ShoppingList> {
		const { data, error } = await supabase
			.from("shopping_lists")
			.insert([list])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
		const { data, error } = await supabase
			.from("shopping_lists")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async deleteList(id: string): Promise<void> {
		const { error } = await supabase.from("shopping_lists").delete().eq("id", id);

		if (error) throw error;
	},

	async getListItems(listId: string): Promise<ShoppingListItem[]> {
		const { data, error } = await supabase
			.from("shopping_list_items")
			.select("*")
			.eq("shopping_list_id", listId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async createItem(
		item: Omit<ShoppingListItem, "id" | "created_at" | "updated_at">,
	): Promise<ShoppingListItem> {
		const { data, error } = await supabase
			.from("shopping_list_items")
			.insert([item])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateItem(id: string, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
		const { data, error } = await supabase
			.from("shopping_list_items")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async deleteItem(id: string): Promise<void> {
		const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);

		if (error) throw error;
	},

	async togglePurchased(id: string, isPurchased: boolean): Promise<ShoppingListItem> {
		const { data, error } = await supabase
			.from("shopping_list_items")
			.update({ is_purchased: isPurchased })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async createFromRecipe(
		listId: string,
		recipeId: string,
		userIngredients: Ingredient[],
	): Promise<ShoppingListItem[]> {
		// Get recipe ingredients
		const recipeIngredients = await recipeService.getIngredients(recipeId);
		
		// Filter out ingredients the user already has
		const neededIngredients = recipeIngredients.filter(recipeIng => {
			return !userIngredients.some(userIng => 
				userIng.name.toLowerCase().includes(recipeIng.ingredient_name.toLowerCase()) ||
				recipeIng.ingredient_name.toLowerCase().includes(userIng.name.toLowerCase())
			);
		});

		// Create shopping list items
		const items = neededIngredients.map(ingredient => ({
			shopping_list_id: listId,
			name: ingredient.ingredient_name,
			quantity: ingredient.quantity,
			unit: ingredient.unit,
			category: "Other", // Could be improved with ingredient categorization
			is_purchased: false,
			notes: ingredient.notes || "",
			recipe_id: recipeId,
		}));

		if (items.length === 0) return [];

		const { data, error } = await supabase
			.from("shopping_list_items")
			.insert(items)
			.select();

		if (error) throw error;
		return data || [];
	},
};