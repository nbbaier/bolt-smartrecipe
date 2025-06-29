export interface User {
	id: string;
	email: string;
	full_name?: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
}

export interface Ingredient {
	id: string;
	user_id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
	expiration_date?: string;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface Recipe {
	id: string;
	title: string;
	description: string;
	image_url: string;
	prep_time: number;
	cook_time: number;
	servings: number;
	difficulty: "Easy" | "Medium" | "Hard";
	cuisine_type?: string;
	created_at: string;
	updated_at: string;
}

export interface RecipeIngredient {
	id: string;
	recipe_id: string;
	ingredient_name: string;
	quantity: number;
	unit: string;
	notes?: string;
}

export interface RecipeInstruction {
	id: string;
	recipe_id: string;
	step_number: number;
	instruction: string;
}

export interface ShoppingListItem {
	id: string;
	shopping_list_id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
	is_purchased: boolean;
	notes?: string;
	recipe_id?: string;
	created_at: string;
	updated_at: string;
}

export interface ShoppingList {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
}
