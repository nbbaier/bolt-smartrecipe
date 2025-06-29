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
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import {
	BookOpen,
	Search,
	Clock,
	Users,
	ChefHat,
	Heart,
	Filter,
	Sparkles,
	X,
	Utensils,
	Timer,
} from "lucide-react";
import type { Recipe, Ingredient, RecipeIngredient, RecipeInstruction } from "../types";

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
	const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
	const [recipeInstructions, setRecipeInstructions] = useState<RecipeInstruction[]>([]);
	const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);

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

	const loadRecipeDetails = async (recipe: Recipe) => {
		setSelectedRecipe(recipe);
		setLoadingRecipeDetails(true);
		
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
			setLoadingRecipeDetails(false);
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
				return "bg-green-100 text-green-800 border-green-200";
			case "Medium":
				return "bg-orange-100 text-orange-800 border-orange-200";
			case "Hard":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const checkIngredientAvailability = (ingredientName: string) => {
		return userIngredients.some(
			(userIng) =>
				userIng.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
				ingredientName.toLowerCase().includes(userIng.name.toLowerCase()),
		);
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
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						Recipe Discovery
					</h1>
					<p className="text-gray-600">Find delicious recipes to cook</p>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-sm text-gray-600">Can cook:</span>
					<Badge variant="secondary" className="bg-green-100 text-green-800">
						{canCookRecipes.length} recipes
					</Badge>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col lg:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search recipes..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<Filter className="h-4 w-4 text-gray-600" />
						<select
							value={selectedDifficulty}
							onChange={(e) => setSelectedDifficulty(e.target.value)}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						>
							<option value="All">All Difficulties</option>
							<option value="Easy">Easy</option>
							<option value="Medium">Medium</option>
							<option value="Hard">Hard</option>
						</select>
					</div>
					<Button
						variant={showCanCookOnly ? "default" : "outline"}
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
				<Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-green-600 rounded-lg">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div>
									<h3 className="font-semibold text-green-900">
										You can cook {canCookRecipes.length} recipes with your
										current ingredients!
									</h3>
									<p className="text-sm text-green-700">
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
						<BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No recipes found
						</h3>
						<p className="text-gray-600">
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
							className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
							onClick={() => loadRecipeDetails(recipe)}
						>
							<div className="relative">
								<img
									src={
										recipe.image_url ||
										"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
									}
									alt={recipe.title}
									className="w-full h-48 object-cover"
								/>
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleBookmark(recipe.id);
									}}
									className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
										bookmarkedRecipes.includes(recipe.id)
											? "bg-red-500 text-white"
											: "bg-white/80 text-gray-600 hover:bg-white"
									}`}
								>
									<Heart
										className={`h-4 w-4 ${bookmarkedRecipes.includes(recipe.id) ? "fill-current" : ""}`}
									/>
								</button>
								{canCookRecipes.some((r) => r.id === recipe.id) && (
									<Badge className="absolute top-3 left-3 bg-green-600 hover:bg-green-700">
										<Sparkles className="h-3 w-3 mr-1" />
										Can Cook
									</Badge>
								)}
							</div>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg line-clamp-1">{recipe.title}</CardTitle>
								<CardDescription className="line-clamp-2">
									{recipe.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center justify-between text-sm text-gray-600 mb-3">
									<div className="flex items-center space-x-1">
										<Clock className="h-4 w-4" />
										<span>{recipe.prep_time + recipe.cook_time} min</span>
									</div>
									<div className="flex items-center space-x-1">
										<Users className="h-4 w-4" />
										<span>{recipe.servings} servings</span>
									</div>
									<Badge variant="outline" className={getDifficultyColor(recipe.difficulty)}>
										{recipe.difficulty}
									</Badge>
								</div>
								{recipe.cuisine_type && (
									<Badge variant="secondary" className="text-xs">
										{recipe.cuisine_type}
									</Badge>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Recipe Detail Modal */}
			{selectedRecipe && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
						<CardHeader className="relative pb-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setSelectedRecipe(null);
									setRecipeIngredients([]);
									setRecipeInstructions([]);
								}}
								className="absolute right-4 top-4 z-10"
							>
								<X className="h-4 w-4" />
							</Button>
							
							<div className="relative">
								<img
									src={
										selectedRecipe.image_url ||
										"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
									}
									alt={selectedRecipe.title}
									className="w-full h-64 object-cover rounded-lg"
								/>
								<div className="absolute bottom-4 left-4 right-4">
									<div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
										<div className="flex items-start justify-between">
											<div>
												<h2 className="text-2xl font-bold text-gray-900 mb-2">
													{selectedRecipe.title}
												</h2>
												<p className="text-gray-600 mb-3">
													{selectedRecipe.description}
												</p>
												<div className="flex items-center space-x-4">
													<Badge variant="outline" className={getDifficultyColor(selectedRecipe.difficulty)}>
														{selectedRecipe.difficulty}
													</Badge>
													{selectedRecipe.cuisine_type && (
														<Badge variant="secondary">
															{selectedRecipe.cuisine_type}
														</Badge>
													)}
													{canCookRecipes.some((r) => r.id === selectedRecipe.id) && (
														<Badge className="bg-green-600">
															<Sparkles className="h-3 w-3 mr-1" />
															Can Cook
														</Badge>
													)}
												</div>
											</div>
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleBookmark(selectedRecipe.id);
												}}
												className={`p-2 rounded-full transition-colors ${
													bookmarkedRecipes.includes(selectedRecipe.id)
														? "bg-red-500 text-white"
														: "bg-gray-100 text-gray-600 hover:bg-gray-200"
												}`}
											>
												<Heart
													className={`h-5 w-5 ${bookmarkedRecipes.includes(selectedRecipe.id) ? "fill-current" : ""}`}
												/>
											</button>
										</div>
									</div>
								</div>
							</div>
						</CardHeader>

						<ScrollArea className="h-[calc(90vh-300px)]">
							<CardContent className="p-6">
								{loadingRecipeDetails ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									</div>
								) : (
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
										{/* Recipe Stats */}
										<div className="lg:col-span-2">
											<div className="grid grid-cols-3 gap-4 text-center mb-6">
												<div className="bg-gray-50 rounded-lg p-4">
													<div className="flex items-center justify-center mb-2">
														<Timer className="h-5 w-5 text-blue-600" />
													</div>
													<div className="text-2xl font-bold text-gray-900">
														{selectedRecipe.prep_time}
													</div>
													<div className="text-sm text-gray-600">Prep Time</div>
												</div>
												<div className="bg-gray-50 rounded-lg p-4">
													<div className="flex items-center justify-center mb-2">
														<ChefHat className="h-5 w-5 text-orange-600" />
													</div>
													<div className="text-2xl font-bold text-gray-900">
														{selectedRecipe.cook_time}
													</div>
													<div className="text-sm text-gray-600">Cook Time</div>
												</div>
												<div className="bg-gray-50 rounded-lg p-4">
													<div className="flex items-center justify-center mb-2">
														<Users className="h-5 w-5 text-green-600" />
													</div>
													<div className="text-2xl font-bold text-gray-900">
														{selectedRecipe.servings}
													</div>
													<div className="text-sm text-gray-600">Servings</div>
												</div>
											</div>
										</div>

										{/* Ingredients */}
										<div>
											<div className="flex items-center space-x-2 mb-4">
												<Utensils className="h-5 w-5 text-gray-600" />
												<h3 className="text-lg font-semibold text-gray-900">
													Ingredients
												</h3>
											</div>
											{recipeIngredients.length > 0 ? (
												<div className="space-y-3">
													{recipeIngredients.map((ingredient, index) => (
														<div
															key={index}
															className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
																checkIngredientAvailability(ingredient.ingredient_name)
																	? "bg-green-50 border-green-200 text-green-900"
																	: "bg-gray-50 border-gray-200"
															}`}
														>
															<div className="flex items-center space-x-2">
																<div
																	className={`w-3 h-3 rounded-full ${
																		checkIngredientAvailability(ingredient.ingredient_name)
																			? "bg-green-500"
																			: "bg-gray-300"
																	}`}
																/>
																<span className="font-medium">
																	{ingredient.ingredient_name}
																</span>
															</div>
															<div className="text-sm">
																{ingredient.quantity} {ingredient.unit}
																{ingredient.notes && (
																	<span className="text-gray-500 ml-2">
																		({ingredient.notes})
																	</span>
																)}
															</div>
														</div>
													))}
												</div>
											) : (
												<p className="text-gray-500 italic">No ingredients listed for this recipe.</p>
											)}
										</div>

										{/* Instructions */}
										<div>
											<div className="flex items-center space-x-2 mb-4">
												<BookOpen className="h-5 w-5 text-gray-600" />
												<h3 className="text-lg font-semibold text-gray-900">
													Instructions
												</h3>
											</div>
											{recipeInstructions.length > 0 ? (
												<div className="space-y-4">
													{recipeInstructions.map((instruction, index) => (
														<div key={index} className="flex space-x-4">
															<div className="flex-shrink-0">
																<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
																	{instruction.step_number}
																</div>
															</div>
															<div className="flex-1">
																<p className="text-gray-700 leading-relaxed">
																	{instruction.instruction}
																</p>
															</div>
														</div>
													))}
												</div>
											) : (
												<p className="text-gray-500 italic">No instructions available for this recipe.</p>
											)}
										</div>
									</div>
								)}
							</CardContent>
						</ScrollArea>
					</Card>
				</div>
			)}
		</div>
	);
}