import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	recipeService,
	ingredientService,
	bookmarkService,
} from "../lib/database";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
	BookOpen,
	Search,
	Clock,
	Users,
	ChefHat,
	Heart,
	Filter,
	Sparkles,
} from "lucide-react";
import type { Recipe, Ingredient } from "../types";

export function Recipes() {
	const { user } = useAuth();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [canCookRecipes, setCanCookRecipes] = useState<Recipe[]>([]);
	const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
	const [bookmarkedRecipes, setBookmarkedRecipes] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
	const [showCanCookOnly, setShowCanCookOnly] = useState(false);
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

	useEffect(() => {
		loadData();
	}, [user]);

	const loadData = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const [recipesData, ingredientsData, bookmarksData] = await Promise.all([
				recipeService.getAll(),
				ingredientService.getAll(user.id),
				bookmarkService.getUserBookmarks(user.id),
			]);

			setRecipes(recipesData);
			setUserIngredients(ingredientsData);
			setBookmarkedRecipes(bookmarksData);

			// Calculate recipes that can be cooked
			const ingredientNames = ingredientsData.map((ing) => ing.name);
			const canCook = await recipeService.getCanCook(ingredientNames);
			setCanCookRecipes(canCook);
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleBookmark = async (recipeId: string) => {
		if (!user) return;

		try {
			if (bookmarkedRecipes.includes(recipeId)) {
				await bookmarkService.removeBookmark(user.id, recipeId);
				setBookmarkedRecipes((prev) => prev.filter((id) => id !== recipeId));
			} else {
				const wasAdded = await bookmarkService.addBookmark(user.id, recipeId);
				if (wasAdded) {
					setBookmarkedRecipes((prev) => [...prev, recipeId]);
				} else {
					// Bookmark already exists, update local state to reflect this
					setBookmarkedRecipes((prev) =>
						prev.includes(recipeId) ? prev : [...prev, recipeId],
					);
				}
			}
		} catch (error) {
			console.error("Error toggling bookmark:", error);
		}
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "Easy":
				return "text-green-600 bg-green-50";
			case "Medium":
				return "text-orange-600 bg-orange-50";
			case "Hard":
				return "text-red-600 bg-red-50";
			default:
				return "text-secondary-600 bg-secondary-50";
		}
	};

	const filteredRecipes = (showCanCookOnly ? canCookRecipes : recipes).filter(
		(recipe) => {
			const matchesSearch =
				recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesDifficulty =
				selectedDifficulty === "All" ||
				recipe.difficulty === selectedDifficulty;
			return matchesSearch && matchesDifficulty;
		},
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-secondary-900">
						Recipe Discovery
					</h1>
					<p className="text-secondary-600">Find delicious recipes to cook</p>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-sm text-secondary-600">Can cook:</span>
					<span className="font-medium text-primary-600">
						{canCookRecipes.length} recipes
					</span>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col lg:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
					<Input
						placeholder="Search recipes..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<Filter className="h-4 w-4 text-secondary-600" />
						<select
							value={selectedDifficulty}
							onChange={(e) => setSelectedDifficulty(e.target.value)}
							className="rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
						>
							<option value="All">All Difficulties</option>
							<option value="Easy">Easy</option>
							<option value="Medium">Medium</option>
							<option value="Hard">Hard</option>
						</select>
					</div>
					<Button
						variant={showCanCookOnly ? "primary" : "outline"}
						onClick={() => setShowCanCookOnly(!showCanCookOnly)}
						className="flex items-center space-x-2"
					>
						<Sparkles className="h-4 w-4" />
						<span>Can Cook</span>
					</Button>
				</div>
			</div>

			{/* Can Cook Banner */}
			{canCookRecipes.length > 0 && !showCanCookOnly && (
				<Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-primary-600 rounded-lg">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div>
									<h3 className="font-medium text-primary-900">
										You can cook {canCookRecipes.length} recipes with your
										current ingredients!
									</h3>
									<p className="text-sm text-primary-700">
										Make the most of what you have in your pantry
									</p>
								</div>
							</div>
							<Button onClick={() => setShowCanCookOnly(true)}>
								View Recipes
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recipes Grid */}
			{filteredRecipes.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<BookOpen className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-secondary-900 mb-2">
							No recipes found
						</h3>
						<p className="text-secondary-600">
							{showCanCookOnly
								? "Add more ingredients to your pantry to unlock more recipes"
								: "Try adjusting your search or filter criteria"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredRecipes.map((recipe) => (
						<Card
							key={recipe.id}
							className="group hover:shadow-lg transition-shadow cursor-pointer"
						>
							<div className="relative">
								<img
									src={
										recipe.image_url ||
										"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
									}
									alt={recipe.title}
									className="w-full h-48 object-cover rounded-t-xl"
								/>
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleBookmark(recipe.id);
									}}
									className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
										bookmarkedRecipes.includes(recipe.id)
											? "bg-red-500 text-white"
											: "bg-white/80 text-secondary-600 hover:bg-white"
									}`}
								>
									<Heart
										className={`h-4 w-4 ${bookmarkedRecipes.includes(recipe.id) ? "fill-current" : ""}`}
									/>
								</button>
								{canCookRecipes.some((r) => r.id === recipe.id) && (
									<div className="absolute top-3 left-3 px-2 py-1 bg-primary-600 text-white text-xs rounded-full flex items-center space-x-1">
										<Sparkles className="h-3 w-3" />
										<span>Can Cook</span>
									</div>
								)}
							</div>
							<CardHeader>
								<CardTitle className="text-lg">{recipe.title}</CardTitle>
								<CardDescription className="line-clamp-2">
									{recipe.description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between text-sm text-secondary-600 mb-3">
									<div className="flex items-center space-x-1">
										<Clock className="h-4 w-4" />
										<span>{recipe.prep_time + recipe.cook_time} min</span>
									</div>
									<div className="flex items-center space-x-1">
										<Users className="h-4 w-4" />
										<span>{recipe.servings} servings</span>
									</div>
									<span
										className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(recipe.difficulty)}`}
									>
										{recipe.difficulty}
									</span>
								</div>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => setSelectedRecipe(recipe)}
								>
									View Recipe
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Recipe Detail Modal (simplified for now) */}
			{selectedRecipe && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-xl">
									{selectedRecipe.title}
								</CardTitle>
								<Button variant="ghost" onClick={() => setSelectedRecipe(null)}>
									×
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<img
								src={
									selectedRecipe.image_url ||
									"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
								}
								alt={selectedRecipe.title}
								className="w-full h-64 object-cover rounded-lg mb-4"
							/>
							<p className="text-secondary-600 mb-4">
								{selectedRecipe.description}
							</p>
							<div className="grid grid-cols-3 gap-4 text-center mb-6">
								<div>
									<div className="text-2xl font-bold text-primary-600">
										{selectedRecipe.prep_time}
									</div>
									<div className="text-sm text-secondary-600">Prep Time</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-primary-600">
										{selectedRecipe.cook_time}
									</div>
									<div className="text-sm text-secondary-600">Cook Time</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-primary-600">
										{selectedRecipe.servings}
									</div>
									<div className="text-sm text-secondary-600">Servings</div>
								</div>
							</div>
							<div className="text-center">
								<p className="text-secondary-600 mb-4">
									Full recipe details with ingredients and instructions coming
									soon!
								</p>
								<Button onClick={() => setSelectedRecipe(null)}>Close</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
