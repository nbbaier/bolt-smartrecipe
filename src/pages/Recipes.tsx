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
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div className="text-center sm:text-left">
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
						Recipe Discovery
					</h1>
					<p className="text-sm sm:text-base text-gray-600">Find delicious recipes to cook</p>
				</div>
				<div className="flex items-center justify-center sm:justify-start space-x-2">
					<span className="text-sm text-gray-600">Can cook:</span>
					<Badge variant="secondary" className="bg-green-100 text-green-800">
						{canCookRecipes.length} recipes
					</Badge>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search recipes..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 text-sm sm:text-base"
					/>
				</div>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
					<div className="flex items-center space-x-2">
						<Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
						<select
							value={selectedDifficulty}
							onChange={(e) => setSelectedDifficulty(e.target.value)}
							className="flex-1 sm:flex-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
						className="flex items-center justify-center space-x-2 text-sm sm:text-base"
					>
						<Sparkles className="h-4 w-4" />
						<span>Can Cook</span>
					</Button>
				</div>
			</div>

			{/* Can Cook Banner */}
			{canCookRecipes.length > 0 && !showCanCookOnly && (
				<Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
					<CardContent className="p-4 sm:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-green-600 rounded-lg flex-shrink-0">
									<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
								</div>
								<div className="min-w-0">
									<h3 className="font-semibold text-green-900 text-sm sm:text-base">
										You can cook {canCookRecipes.length} recipes with your
										current ingredients!
									</h3>
									<p className="text-xs sm:text-sm text-green-700">
										Make the most of what you have in your pantry
									</p>
								</div>
							</div>
							<Button onClick={() => setShowCanCookOnly(true)} className="text-sm sm:text-base">
								View Recipes
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recipes Grid */}
			{filteredRecipes.length === 0 ? (
				<Card>
					<CardContent className="text-center py-8 sm:py-12">
						<BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
							No recipes found
						</h3>
						<p className="text-sm sm:text-base text-gray-600 px-4">
							{showCanCookOnly
								? "Add more ingredients to your pantry to unlock more recipes"
								: "Try adjusting your search or filter criteria"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
									className="w-full h-40 sm:h-48 object-cover"
								/>
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleBookmark(recipe.id);
									}}
									className={`absolute top-2 sm:top-3 right-2 sm:right-3 p-2 rounded-full transition-colors ${
										bookmarkedRecipes.includes(recipe.id)
											? "bg-red-500 text-white"
											: "bg-white/80 text-gray-600 hover:bg-white"
									}`}
								>
									<Heart
										className={`h-3 w-3 sm:h-4 sm:w-4 ${bookmarkedRecipes.includes(recipe.id) ? "fill-current" : ""}`}
									/>
								</button>
								{canCookRecipes.some((r) => r.id === recipe.id) && (
									<Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-green-600 hover:bg-green-700 text-xs">
										<Sparkles className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
										Can Cook
									</Badge>
								)}
							</div>
							<CardHeader className="pb-2">
								<CardTitle className="text-base sm:text-lg line-clamp-1">{recipe.title}</CardTitle>
								<CardDescription className="line-clamp-2 text-sm">
									{recipe.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3">
									<div className="flex items-center space-x-1">
										<Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
										<span>{recipe.prep_time + recipe.cook_time} min</span>
									</div>
									<div className="flex items-center space-x-1">
										<Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
										<span>{recipe.servings}</span>
									</div>
									<Badge variant="outline" className={`${getDifficultyColor(recipe.difficulty)} text-xs`}>
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
						<CardHeader className="relative pb-3 sm:pb-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setSelectedRecipe(null);
									setRecipeIngredients([]);
									setRecipeInstructions([]);
								}}
								className="absolute right-2 sm:right-4 top-2 sm:top-4 z-10"
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
									className="w-full h-48 sm:h-64 object-cover rounded-lg"
								/>
								<div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
									<div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4">
										<div className="flex items-start justify-between">
											<div className="min-w-0 flex-1">
												<h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
													{selectedRecipe.title}
												</h2>
												<p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 line-clamp-2">
													{selectedRecipe.description}
												</p>
												<div className="flex flex-wrap items-center gap-2">
													<Badge variant="outline" className={`${getDifficultyColor(selectedRecipe.difficulty)} text-xs`}>
														{selectedRecipe.difficulty}
													</Badge>
													{selectedRecipe.cuisine_type && (
														<Badge variant="secondary" className="text-xs">
															{selectedRecipe.cuisine_type}
														</Badge>
													)}
													{canCookRecipes.some((r) => r.id === selectedRecipe.id) && (
														<Badge className="bg-green-600 text-xs">
															<Sparkles className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
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
												className={`p-2 rounded-full transition-colors ml-2 flex-shrink-0 ${
													bookmarkedRecipes.includes(selectedRecipe.id)
														? "bg-red-500 text-white"
														: "bg-gray-100 text-gray-600 hover:bg-gray-200"
												}`}
											>
												<Heart
													className={`h-4 w-4 sm:h-5 sm:w-5 ${bookmarkedRecipes.includes(selectedRecipe.id) ? "fill-current" : ""}`}
												/>
											</button>
										</div>
									</div>
								</div>
							</div>
						</CardHeader>

						<ScrollArea className="h-[calc(90vh-300px)]">
							<CardContent className="p-4 sm:p-6">
								{loadingRecipeDetails ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									</div>
								) : (
									<div className="space-y-6">
										{/* Recipe Stats */}
										<div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
											<div className="bg-gray-50 rounded-lg p-3 sm:p-4">
												<div className="flex items-center justify-center mb-1 sm:mb-2">
													<Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
												</div>
												<div className="text-lg sm:text-2xl font-bold text-gray-900">
													{selectedRecipe.prep_time}
												</div>
												<div className="text-xs sm:text-sm text-gray-600">Prep Time</div>
											</div>
											<div className="bg-gray-50 rounded-lg p-3 sm:p-4">
												<div className="flex items-center justify-center mb-1 sm:mb-2">
													<ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
												</div>
												<div className="text-lg sm:text-2xl font-bold text-gray-900">
													{selectedRecipe.cook_time}
												</div>
												<div className="text-xs sm:text-sm text-gray-600">Cook Time</div>
											</div>
											<div className="bg-gray-50 rounded-lg p-3 sm:p-4">
												<div className="flex items-center justify-center mb-1 sm:mb-2">
													<Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
												</div>
												<div className="text-lg sm:text-2xl font-bold text-gray-900">
													{selectedRecipe.servings}
												</div>
												<div className="text-xs sm:text-sm text-gray-600">Servings</div>
											</div>
										</div>

										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
											{/* Ingredients */}
											<div>
												<div className="flex items-center space-x-2 mb-3 sm:mb-4">
													<Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
													<h3 className="text-base sm:text-lg font-semibold text-gray-900">
														Ingredients
													</h3>
												</div>
												{recipeIngredients.length > 0 ? (
													<div className="space-y-2 sm:space-y-3">
														{recipeIngredients.map((ingredient, index) => (
															<div
																key={index}
																className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors ${
																	checkIngredientAvailability(ingredient.ingredient_name)
																		? "bg-green-50 border-green-200 text-green-900"
																		: "bg-gray-50 border-gray-200"
																}`}
															>
																<div className="flex items-center space-x-2 min-w-0 flex-1">
																	<div
																		className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
																			checkIngredientAvailability(ingredient.ingredient_name)
																				? "bg-green-500"
																				: "bg-gray-300"
																		}`}
																	/>
																	<span className="font-medium text-sm sm:text-base truncate">
																		{ingredient.ingredient_name}
																	</span>
																</div>
																<div className="text-xs sm:text-sm flex-shrink-0 ml-2">
																	{ingredient.quantity} {ingredient.unit}
																	{ingredient.notes && (
																		<span className="text-gray-500 ml-1 hidden sm:inline">
																			({ingredient.notes})
																		</span>
																	)}
																</div>
															</div>
														))}
													</div>
												) : (
													<p className="text-sm sm:text-base text-gray-500 italic">No ingredients listed for this recipe.</p>
												)}
											</div>

											{/* Instructions */}
											<div>
												<div className="flex items-center space-x-2 mb-3 sm:mb-4">
													<BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
													<h3 className="text-base sm:text-lg font-semibold text-gray-900">
														Instructions
													</h3>
												</div>
												{recipeInstructions.length > 0 ? (
													<div className="space-y-3 sm:space-y-4">
														{recipeInstructions.map((instruction, index) => (
															<div key={index} className="flex space-x-3 sm:space-x-4">
																<div className="flex-shrink-0">
																	<div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
																		{instruction.step_number}
																	</div>
																</div>
																<div className="flex-1 min-w-0">
																	<p className="text-sm sm:text-base text-gray-700 leading-relaxed">
																		{instruction.instruction}
																	</p>
																</div>
															</div>
														))}
													</div>
												) : (
													<p className="text-sm sm:text-base text-gray-500 italic">No instructions available for this recipe.</p>
												)}
											</div>
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