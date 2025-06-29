import { supabase } from "./supabase";
import type {
	Ingredient,
	Recipe,
	RecipeIngredient,
	RecipeInstruction,
	ShoppingList,
	ShoppingListItem,
	UserProfile,
	UserPreferences,
	Leftover,
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

	async addOrUpdateFromShopping(
		userId: string,
		itemName: string,
		quantity: number,
		unit: string,
		category: string = "Other"
	): Promise<Ingredient> {
		console.log('addOrUpdateFromShopping called with:', { userId, itemName, quantity, unit, category });
		
		// First, check if an ingredient with similar name already exists
		const { data: existingIngredients, error: searchError } = await supabase
			.from("ingredients")
			.select("*")
			.eq("user_id", userId)
			.ilike("name", `%${itemName}%`);

		if (searchError) throw searchError;
		
		console.log('Existing ingredients found:', existingIngredients?.length || 0);

		// Find exact or close match
		const existingIngredient = existingIngredients?.find(ing => 
			ing.name.toLowerCase() === itemName.toLowerCase() ||
			ing.name.toLowerCase().includes(itemName.toLowerCase()) ||
			itemName.toLowerCase().includes(ing.name.toLowerCase())
		);

		if (existingIngredient) {
			console.log('Found existing ingredient:', existingIngredient.name);
			// Update existing ingredient quantity
			const newQuantity = (existingIngredient.quantity || 0) + quantity;
			console.log('Updating quantity from', existingIngredient.quantity, 'to', newQuantity);
			
			return await this.update(existingIngredient.id, {
				quantity: newQuantity,
				unit: unit || existingIngredient.unit, // Keep existing unit if new one is empty
			});
		} else {
			console.log('Creating new ingredient:', itemName);
			// Create new ingredient
			return await this.create({
				user_id: userId,
				name: itemName,
				quantity: quantity,
				unit: unit,
				category: category,
				notes: "Added from shopping list",
			});
		}
	},

	async getLowStockItems(userId: string): Promise<Ingredient[]> {
		const { data, error } = await supabase
			.rpc('get_low_stock_ingredients', { user_uuid: userId });

		if (error) throw error;
		return data || [];
	},

	async updateStockThreshold(id: string, threshold: number): Promise<Ingredient> {
		const { data, error } = await supabase
			.from("ingredients")
			.update({ low_stock_threshold: threshold })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
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
		try {
			const { data, error } = await supabase
				.from("recipes")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		} catch (error: any) {
			if (error.code === "PGRST116" || error.message?.includes('multiple (or no) rows returned')) {
				return null; // Not found
			}
			throw error;
		}
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
		console.log('Creating items from recipe:', recipeId, 'for list:', listId);
		
		// Get recipe ingredients
		const recipeIngredients = await recipeService.getIngredients(recipeId);
		console.log('Recipe ingredients found:', recipeIngredients.length);
		
		// Filter out ingredients the user already has
		const neededIngredients = recipeIngredients.filter(recipeIng => {
			return !userIngredients.some(userIng => 
				userIng.name.toLowerCase().includes(recipeIng.ingredient_name.toLowerCase()) ||
				recipeIng.ingredient_name.toLowerCase().includes(userIng.name.toLowerCase())
			);
		});
		console.log('Needed ingredients after filtering:', neededIngredients.length);

		// Create shopping list items
		const items = neededIngredients.map(ingredient => ({
			shopping_list_id: listId,
			name: ingredient.ingredient_name,
			quantity: ingredient.quantity,
			unit: ingredient.unit,
			category: "Other",
			is_purchased: false,
			notes: ingredient.notes || "",
			recipe_id: recipeId,
		}));

		if (items.length === 0) {
			console.log('No new ingredients needed - user already has everything!');
			return [];
		}

		console.log('Inserting items:', items);

		const { data, error } = await supabase
			.from("shopping_list_items")
			.insert(items)
			.select();

		if (error) {
			console.error('Database error inserting shopping items:', error);
			throw error;
		}
		
		console.log('Successfully inserted shopping items:', data?.length);
		return data || [];
	},
	async addToPantryFromShopping(
		userId: string,
		itemName: string,
		quantity: number,
		unit: string,
		category: string = "Other"
	): Promise<void> {
		console.log('Adding to pantry from shopping:', { itemName, quantity, unit, category });
		
		try {
			await ingredientService.addOrUpdateFromShopping(
				userId,
				itemName,
				quantity,
				unit,
				category
			);
			console.log('Successfully added to pantry:', itemName);
		} catch (error) {
			console.error('Failed to add to pantry:', error);
			// Don't throw error - shopping list update should still succeed
		}
	},
};

// Leftover operations
export const leftoverService = {
	async getAll(userId: string): Promise<Leftover[]> {
		const { data, error } = await supabase
			.from("leftovers")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async create(
		leftover: Omit<Leftover, "id" | "created_at" | "updated_at">,
	): Promise<Leftover> {
		const { data, error } = await supabase
			.from("leftovers")
			.insert([leftover])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async update(id: string, updates: Partial<Leftover>): Promise<Leftover> {
		const { data, error } = await supabase
			.from("leftovers")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async delete(id: string): Promise<void> {
		const { error } = await supabase.from("leftovers").delete().eq("id", id);

		if (error) throw error;
	},

	async getExpiringSoon(
		userId: string,
		days: number = 3,
	): Promise<Leftover[]> {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + days);

		const { data, error } = await supabase
			.from("leftovers")
			.select("*")
			.eq("user_id", userId)
			.not("expiration_date", "is", null)
			.lte("expiration_date", futureDate.toISOString().split("T")[0])
			.order("expiration_date", { ascending: true });

		if (error) throw error;
		return data || [];
	},

	async createFromRecipe(
		userId: string,
		recipeId: string,
		recipeName: string,
		quantity: number = 1,
		unit: string = "portions",
		notes?: string,
	): Promise<Leftover> {
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + 3); // Default 3 days for leftovers

		return await this.create({
			user_id: userId,
			name: `${recipeName} (Leftovers)`,
			quantity,
			unit,
			expiration_date: expirationDate.toISOString().split("T")[0],
			source_recipe_id: recipeId,
			notes: notes || "Created from recipe",
		});
	},

	async getByRecipe(userId: string, recipeId: string): Promise<Leftover[]> {
		const { data, error } = await supabase
			.from("leftovers")
			.select("*")
			.eq("user_id", userId)
			.eq("source_recipe_id", recipeId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},
};

// User Profile operations
export const userProfileService = {
	async getProfile(userId: string): Promise<UserProfile | null> {
		try {
			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("user_id", userId)
				.maybeSingle();

			if (error) throw error;
			return data;
		} catch (error: any) {
			if (error.code === "PGRST116" || error.message?.includes('multiple (or no) rows returned')) {
				return null; // Not found
			}
			throw error;
		}
	},

	async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
		const { data, error } = await supabase
			.from("user_profiles")
			.update(updates)
			.eq("user_id", userId)
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};

// User Preferences operations
export const userPreferencesService = {
	async getPreferences(userId: string): Promise<UserPreferences | null> {
		try {
			const { data, error } = await supabase
				.from("user_preferences")
				.select("*")
				.eq("user_id", userId)
				.maybeSingle();

			if (error) throw error;
			return data;
		} catch (error: any) {
			if (error.code === "PGRST116" || error.message?.includes('multiple (or no) rows returned')) {
				return null; // Not found
			}
			throw error;
		}
	},

	async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
		// Use upsert to either update existing record or create new one
		const dataToUpsert = {
			...updates,
			user_id: userId, // Ensure user_id is included for upsert
		};

		const { data, error } = await supabase
			.from("user_preferences")
			.upsert(dataToUpsert)
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};