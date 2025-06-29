import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ingredientService, recipeService } from "../lib/database";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
	Package,
	BookOpen,
	ShoppingCart,
	Clock,
	Sparkles,
	AlertTriangle,
} from "lucide-react";
import type { Ingredient, Recipe } from "../types";

export function Dashboard() {
	const { user } = useAuth();
	const [stats, setStats] = useState({
		totalIngredients: 0,
		availableRecipes: 0,
		expiringSoon: 0,
		canCookRecipes: 0,
	});
	const [expiringSoonItems, setExpiringSoonItems] = useState<Ingredient[]>([]);
	const [canCookRecipes, setCanCookRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (user) {
			loadDashboardData();
		}
	}, [user]);

	const loadDashboardData = async () => {
		if (!user) return;

		try {
			setLoading(true);

			// Load ingredients and recipes
			const [ingredients, recipes] = await Promise.all([
				ingredientService.getAll(user.id),
				recipeService.getAll(),
			]);

			// Get expiring items
			const expiring = await ingredientService.getExpiringSoon(user.id, 7);

			// Get recipes that can be cooked
			const ingredientNames = ingredients.map((ing) => ing.name);
			const canCook = await recipeService.getCanCook(ingredientNames);

			setStats({
				totalIngredients: ingredients.length,
				availableRecipes: recipes.length,
				expiringSoon: expiring.length,
				canCookRecipes: canCook.length,
			});

			setExpiringSoonItems(expiring.slice(0, 5)); // Show top 5
			setCanCookRecipes(canCook.slice(0, 3)); // Show top 3
		} catch (error) {
			console.error("Error loading dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const getDaysUntilExpiration = (expirationDate: string) => {
		const expDate = new Date(expirationDate);
		const today = new Date();
		const diffTime = expDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="text-center sm:text-left">
				<h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Dashboard</h1>
				<p className="text-sm sm:text-base text-secondary-600">
					Welcome back! Here's what's happening in your kitchen.
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
							</div>
							<div className="ml-3 sm:ml-4 min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
									Pantry Items
								</p>
								<p className="text-lg sm:text-2xl font-bold text-secondary-900">
									{stats.totalIngredients}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
							</div>
							<div className="ml-3 sm:ml-4 min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
									Can Cook
								</p>
								<p className="text-lg sm:text-2xl font-bold text-secondary-900">
									{stats.canCookRecipes}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
							</div>
							<div className="ml-3 sm:ml-4 min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
									Total Recipes
								</p>
								<p className="text-lg sm:text-2xl font-bold text-secondary-900">
									{stats.availableRecipes}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Clock
									className={`h-6 w-6 sm:h-8 sm:w-8 ${stats.expiringSoon > 0 ? "text-orange-600" : "text-primary"}`}
								/>
							</div>
							<div className="ml-3 sm:ml-4 min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
									Expiring Soon
								</p>
								<p className="text-lg sm:text-2xl font-bold text-secondary-900">
									{stats.expiringSoon}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
				{/* What Can I Cook */}
				<Card>
					<CardHeader className="pb-3 sm:pb-6">
						<div className="flex items-center space-x-2">
							<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
							<CardTitle className="text-base sm:text-lg">What Can I Cook?</CardTitle>
						</div>
						<CardDescription className="text-sm">
							Recipes you can make with your current ingredients
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						{canCookRecipes.length > 0 ? (
							<div className="space-y-3">
								{canCookRecipes.map((recipe) => (
									<div
										key={recipe.id}
										className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg"
									>
										<img
											src={
												recipe.image_url ||
												"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
											}
											alt={recipe.title}
											className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
										/>
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-secondary-900 text-sm sm:text-base truncate">
												{recipe.title}
											</h4>
											<p className="text-xs sm:text-sm text-secondary-600">
												{recipe.prep_time + recipe.cook_time} min •{" "}
												{recipe.difficulty}
											</p>
										</div>
									</div>
								))}
								<Link to="/recipes">
									<Button className="w-full text-sm sm:text-base">View All Recipes</Button>
								</Link>
							</div>
						) : (
							<div className="text-center py-6">
								<BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 mx-auto mb-3" />
								<p className="text-sm sm:text-base text-secondary-600 mb-4">
									Add ingredients to your pantry to discover recipes you can
									cook!
								</p>
								<Link to="/pantry">
									<Button className="text-sm sm:text-base">Add Ingredients</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Expiring Soon */}
				<Card>
					<CardHeader className="pb-3 sm:pb-6">
						<div className="flex items-center space-x-2">
							<AlertTriangle
								className={`h-4 w-4 sm:h-5 sm:w-5 ${stats.expiringSoon > 0 ? "text-orange-600" : "text-secondary-400"}`}
							/>
							<CardTitle className="text-base sm:text-lg">Expiring Soon</CardTitle>
						</div>
						<CardDescription className="text-sm">
							Items in your pantry that need attention
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						{expiringSoonItems.length > 0 ? (
							<div className="space-y-3">
								{expiringSoonItems.map((item) => {
									const daysLeft = getDaysUntilExpiration(
										item.expiration_date!,
									);
									return (
										<div
											key={item.id}
											className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
										>
											<div className="min-w-0 flex-1">
												<h4 className="font-medium text-secondary-900 text-sm sm:text-base truncate">
													{item.name}
												</h4>
												<p className="text-xs sm:text-sm text-secondary-600">
													{item.quantity} {item.unit}
												</p>
											</div>
											<div className="text-right flex-shrink-0 ml-2">
												<span
													className={`text-xs sm:text-sm font-medium ${
														daysLeft <= 1
															? "text-red-600"
															: daysLeft <= 3
																? "text-orange-600"
																: "text-orange-600"
													}`}
												>
													{daysLeft <= 0
														? "Expired"
														: `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
												</span>
											</div>
										</div>
									);
								})}
								<Link to="/pantry">
									<Button variant="outline" className="w-full text-sm sm:text-base">
										Manage Pantry
									</Button>
								</Link>
							</div>
						) : (
							<div className="text-center py-6">
								<Clock className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 mx-auto mb-3" />
								<p className="text-sm sm:text-base text-secondary-600 mb-4">
									No items expiring soon. Your pantry is well managed!
								</p>
								<Link to="/pantry">
									<Button variant="outline" className="text-sm sm:text-base">View Pantry</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
				<Link to="/pantry">
					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardContent className="p-4 sm:p-6 text-center">
							<Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
							<h3 className="font-medium text-secondary-900 text-sm sm:text-base">Manage Pantry</h3>
							<p className="text-xs sm:text-sm text-secondary-600">
								Add and track ingredients
							</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/recipes">
					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardContent className="p-4 sm:p-6 text-center">
							<BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
							<h3 className="font-medium text-secondary-900 text-sm sm:text-base">Browse Recipes</h3>
							<p className="text-xs sm:text-sm text-secondary-600">Discover new dishes</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/shopping">
					<Card className="hover:shadow-md transition-shadow cursor-pointer">
						<CardContent className="p-4 sm:p-6 text-center">
							<ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
							<h3 className="font-medium text-secondary-900 text-sm sm:text-base">Shopping List</h3>
							<p className="text-xs sm:text-sm text-secondary-600">
								Plan your grocery trips
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	);
}