import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ingredientService } from "../lib/database";
import { useIngredientHistory } from "../hooks/useIngredientHistory";
import { AutocompleteInput } from "../components/ui/AutocompleteInput";
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
	Package,
	Plus,
	Search,
	Calendar,
	Edit3,
	Trash2,
	AlertTriangle,
	Filter,
	MessageCircle,
	Wand2,
	X,
} from "lucide-react";
import type { Ingredient } from "../types";

const CATEGORIES = [
	"Vegetables",
	"Fruits",
	"Meat",
	"Dairy",
	"Grains",
	"Spices",
	"Condiments",
	"Other",
];

const UNITS = [
	"g",
	"kg",
	"ml",
	"l",
	"cups",
	"tbsp",
	"tsp",
	"pieces",
	"cans",
	"bottles",
];

export function Pantry() {
	const { user } = useAuth();
	const { getAllIngredientNames, refreshHistory } = useIngredientHistory();
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
		null,
	);
	const [showNaturalLanguageInput, setShowNaturalLanguageInput] = useState(false);
	const [naturalLanguageText, setNaturalLanguageText] = useState("");
	const [parsedIngredients, setParsedIngredients] = useState<Array<{
		name: string;
		quantity: number;
		unit: string;
		category: string;
	}>>([]);
	const [isParsingText, setIsParsingText] = useState(false);
	const [isAddingToPantry, setIsAddingToPantry] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		quantity: "",
		unit: "g",
		category: "Other",
		expiration_date: "",
		notes: "",
		low_stock_threshold: "",
	});

	useEffect(() => {
		if (user) {
			loadIngredients();
		}
	}, [user]);

	const loadIngredients = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const data = await ingredientService.getAll(user.id);
			setIngredients(data);
			// Refresh history when ingredients are loaded
			refreshHistory();
		} catch (error) {
			console.error("Error loading ingredients:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		try {
			// Set default threshold based on unit if not provided
			let threshold = parseFloat(formData.low_stock_threshold);
			if (!threshold || threshold <= 0) {
				threshold = getDefaultThreshold(formData.unit);
			}

			const ingredientData = {
				user_id: user.id,
				name: formData.name,
				quantity: parseFloat(formData.quantity) || 0,
				unit: formData.unit,
				category: formData.category,
				expiration_date: formData.expiration_date || null,
				notes: formData.notes,
				low_stock_threshold: threshold,
			};

			if (editingIngredient) {
				await ingredientService.update(editingIngredient.id, ingredientData);
			} else {
				await ingredientService.create(ingredientData);
			}

			await loadIngredients();
			refreshHistory(); // Update history after adding ingredients
			resetForm();
		} catch (error) {
			console.error("Error saving ingredient:", error);
		}
	};

	const getDefaultThreshold = (unit: string): number => {
		switch (unit) {
			case 'kg':
			case 'l':
				return 0.5;
			case 'g':
			case 'ml':
				return 100;
			case 'cups':
				return 0.5;
			case 'tbsp':
			case 'tsp':
				return 2;
			case 'pieces':
			case 'cans':
			case 'bottles':
			default:
				return 1;
		}
	};
	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this ingredient?")) return;

		try {
			await ingredientService.delete(id);
			await loadIngredients();
		} catch (error) {
			console.error("Error deleting ingredient:", error);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			quantity: "",
			unit: "g",
			category: "Other",
			expiration_date: "",
			notes: "",
			low_stock_threshold: "",
		});
		setShowAddForm(false);
		setEditingIngredient(null);
	};

	const resetNaturalLanguageForm = () => {
		setNaturalLanguageText("");
		setParsedIngredients([]);
		setShowNaturalLanguageInput(false);
	};

	const parseNaturalLanguageText = async () => {
		if (!naturalLanguageText.trim()) return;

		setIsParsingText(true);
		
		try {
			// Call the Supabase Edge Function for parsing
			const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-ingredients`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: naturalLanguageText.trim(),
				}),
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data = await response.json();
			
			if (data.error) {
				throw new Error(data.error);
			}

			// Set the parsed ingredients from the API response
			setParsedIngredients(data.ingredients || []);
		} catch (error) {
			console.error("Error parsing ingredients:", error);
			
			// Fallback: show error message to user
			alert("Failed to parse ingredients. Please try again or add ingredients manually.");
			setParsedIngredients([]);
		} finally {
			setIsParsingText(false);
		}
	};

	const updateParsedIngredient = (index: number, field: string, value: string | number) => {
		setParsedIngredients(prev => 
			prev.map((item, i) => 
				i === index ? { ...item, [field]: value } : item
			)
		);
	};

	const removeParsedIngredient = (index: number) => {
		setParsedIngredients(prev => prev.filter((_, i) => i !== index));
	};

	const addParsedIngredientsToPantry = async () => {
		if (!user || parsedIngredients.length === 0) return;

		setIsAddingToPantry(true);
		
		try {
			for (const ingredient of parsedIngredients) {
				await ingredientService.create({
					user_id: user.id,
					name: ingredient.name,
					quantity: ingredient.quantity,
					unit: ingredient.unit,
					category: ingredient.category,
					notes: "Added via natural language input",
					low_stock_threshold: getDefaultThreshold(ingredient.unit),
				});
			}
			
			await loadIngredients();
			refreshHistory(); // Update history after adding parsed ingredients
			resetNaturalLanguageForm();
		} catch (error) {
			console.error("Error adding parsed ingredients:", error);
		} finally {
			setIsAddingToPantry(false);
		}
	};

	const startEdit = (ingredient: Ingredient) => {
		setEditingIngredient(ingredient);
		setFormData({
			name: ingredient.name,
			quantity: ingredient.quantity.toString(),
			unit: ingredient.unit,
			category: ingredient.category,
			expiration_date: ingredient.expiration_date || "",
			notes: ingredient.notes || "",
			low_stock_threshold: (ingredient.low_stock_threshold || getDefaultThreshold(ingredient.unit)).toString(),
		});
		setShowAddForm(true);
		setShowNaturalLanguageInput(false);
	};

	const isExpiringSoon = (expirationDate: string | null) => {
		if (!expirationDate) return false;
		const expDate = new Date(expirationDate);
		const today = new Date();
		const diffTime = expDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays <= 7 && diffDays >= 0;
	};

	const isExpired = (expirationDate: string | null) => {
		if (!expirationDate) return false;
		const expDate = new Date(expirationDate);
		const today = new Date();
		return expDate < today;
	};

	const isLowStock = (ingredient: Ingredient) => {
		const threshold = ingredient.low_stock_threshold || getDefaultThreshold(ingredient.unit);
		return ingredient.quantity > 0 && ingredient.quantity <= threshold;
	};

	const isOutOfStock = (ingredient: Ingredient) => {
		return ingredient.quantity <= 0;
	};
	const filteredIngredients = ingredients.filter((ingredient) => {
		const matchesSearch = ingredient.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesCategory =
			selectedCategory === "All" || ingredient.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const categoryCounts = CATEGORIES.reduce(
		(acc, category) => {
			acc[category] = ingredients.filter(
				(ing) => ing.category === category,
			).length;
			return acc;
		},
		{} as Record<string, number>,
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
					<h1 className="text-xl sm:text-2xl font-bold text-secondary-900">My Pantry</h1>
					<p className="text-sm sm:text-base text-secondary-600">
						Track your ingredients and expiration dates
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-2">
					<Button
						onClick={() => {
							setShowAddForm(true);
							setShowNaturalLanguageInput(false);
						}}
						variant={showAddForm ? "default" : "outline"}
						className="flex items-center justify-center space-x-2 text-sm sm:text-base"
					>
						<Plus className="h-4 w-4" />
						<span>Add Ingredient</span>
					</Button>
					<Button
						onClick={() => {
							setShowNaturalLanguageInput(true);
							setShowAddForm(false);
						}}
						variant={showNaturalLanguageInput ? "default" : "outline"}
						className="flex items-center justify-center space-x-2 text-sm sm:text-base"
					>
						<MessageCircle className="h-4 w-4" />
						<span>Add from Text</span>
					</Button>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
					<Input
						placeholder="Search ingredients..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 text-sm sm:text-base"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4 text-secondary-600 flex-shrink-0" />
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="flex-1 sm:flex-none rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
					>
						<option value="All">All Categories</option>
						{CATEGORIES.map((category) => (
							<option key={category} value={category}>
								{category} ({categoryCounts[category] || 0})
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Add/Edit Form */}
			{showAddForm && (
				<Card>
					<CardHeader className="pb-3 sm:pb-6">
						<CardTitle className="text-lg sm:text-xl">
							{editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="sm:col-span-2">
									<div>
										<label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
											Ingredient Name
										</label>
										<AutocompleteInput
											value={formData.name}
											onChange={(value) => setFormData({ ...formData, name: value })}
											onSelect={(suggestion) => {
												setFormData({ 
													...formData, 
													name: suggestion.name,
													category: suggestion.category || formData.category
												});
											}}
											userHistory={getAllIngredientNames()}
											placeholder="Start typing ingredient name..."
										/>
									</div>
								</div>
								<div className="flex space-x-2">
									<div className="flex-1">
										<Input
											label="Quantity"
											type="number"
											step="0.1"
											value={formData.quantity}
											onChange={(e) =>
												setFormData({ ...formData, quantity: e.target.value })
											}
										/>
									</div>
									<div className="w-20 sm:w-24">
										<label className="block text-sm font-medium text-secondary-700 mb-1">
											Unit
										</label>
										<select
											value={formData.unit}
											onChange={(e) =>
												setFormData({ ...formData, unit: e.target.value })
											}
											className="w-full h-10 rounded-lg border border-secondary-300 px-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
										>
											{UNITS.map((unit) => (
												<option key={unit} value={unit}>
													{unit}
												</option>
											))}
										</select>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-secondary-700 mb-1">
										Category
									</label>
									<select
										value={formData.category}
										onChange={(e) =>
											setFormData({ ...formData, category: e.target.value })
										}
										className="w-full h-10 rounded-lg border border-secondary-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
									>
										{CATEGORIES.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</div>
								<Input
									label="Expiration Date (Optional)"
									type="date"
									value={formData.expiration_date}
									onChange={(e) =>
										setFormData({
											...formData,
											expiration_date: e.target.value,
										})
									}
								/>
								<div className="sm:col-span-2">
									<Input
										label="Low Stock Threshold (Optional)"
										type="number"
										step="0.1"
										value={formData.low_stock_threshold}
										onChange={(e) =>
											setFormData({ ...formData, low_stock_threshold: e.target.value })
										}
										placeholder={`Default: ${getDefaultThreshold(formData.unit)} ${formData.unit}`}
									/>
									<p className="text-xs text-secondary-600 mt-1">
										Alert when quantity falls below this amount. Leave empty for default.
									</p>
								</div>
							</div>
							<Input
								label="Notes (Optional)"
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								placeholder="Any additional notes..."
							/>
							<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
								<Button type="submit" className="text-sm sm:text-base">
									{editingIngredient ? "Update Ingredient" : "Add Ingredient"}
								</Button>
								<Button type="button" variant="outline" onClick={resetForm} className="text-sm sm:text-base">
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Natural Language Input Form */}
			{showNaturalLanguageInput && (
				<Card>
					<CardHeader className="pb-3 sm:pb-6">
						<CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
							<MessageCircle className="h-5 w-5" />
							<span>Add Ingredients from Text</span>
						</CardTitle>
						<CardDescription>
							Describe your ingredients in natural language (e.g., "3 apples, 1kg flour, 2 cans of tuna")
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-secondary-700 mb-2">
								Describe your ingredients:
							</label>
							<textarea
								value={naturalLanguageText}
								onChange={(e) => setNaturalLanguageText(e.target.value)}
								placeholder="Example: 3 apples, 1kg flour, 2 cans of tuna, 500ml olive oil, 1 liter milk"
								className="w-full h-24 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
							/>
						</div>

						<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
							<Button
								onClick={parseNaturalLanguageText}
								disabled={!naturalLanguageText.trim() || isParsingText}
								className="flex items-center justify-center space-x-2"
							>
								<Wand2 className="h-4 w-4" />
								<span>{isParsingText ? "Parsing..." : "Parse Text"}</span>
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={resetNaturalLanguageForm}
								disabled={isParsingText || isAddingToPantry}
							>
								Cancel
							</Button>
						</div>

						{/* Parsed Ingredients Display */}
						{parsedIngredients.length > 0 && (
							<div className="mt-6 space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium text-secondary-900">
										Parsed Ingredients ({parsedIngredients.length})
									</h3>
									<Button
										onClick={addParsedIngredientsToPantry}
										disabled={isAddingToPantry}
										className="flex items-center space-x-2"
									>
										<Plus className="h-4 w-4" />
										<span>{isAddingToPantry ? "Adding..." : "Add All to Pantry"}</span>
									</Button>
								</div>
								
								<div className="space-y-3">
									{parsedIngredients.map((ingredient, index) => (
										<div key={index} className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
											<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
												<div>
													<label className="block text-xs font-medium text-secondary-700 mb-1">
														Name
													</label>
													<input
														type="text"
														value={ingredient.name}
														onChange={(e) => updateParsedIngredient(index, 'name', e.target.value)}
														className="w-full rounded-md border border-secondary-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
													/>
												</div>
												<div>
													<label className="block text-xs font-medium text-secondary-700 mb-1">
														Quantity
													</label>
													<input
														type="number"
														step="0.1"
														value={ingredient.quantity}
														onChange={(e) => updateParsedIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
														className="w-full rounded-md border border-secondary-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
													/>
												</div>
												<div>
													<label className="block text-xs font-medium text-secondary-700 mb-1">
														Unit
													</label>
													<select
														value={ingredient.unit}
														onChange={(e) => updateParsedIngredient(index, 'unit', e.target.value)}
														className="w-full rounded-md border border-secondary-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
													>
														{UNITS.map((unit) => (
															<option key={unit} value={unit}>
																{unit}
															</option>
														))}
													</select>
												</div>
												<div>
													<label className="block text-xs font-medium text-secondary-700 mb-1">
														Category
													</label>
													<div className="flex items-center space-x-2">
														<select
															value={ingredient.category}
															onChange={(e) => updateParsedIngredient(index, 'category', e.target.value)}
															className="flex-1 rounded-md border border-secondary-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
														>
															{CATEGORIES.map((category) => (
																<option key={category} value={category}>
																	{category}
																</option>
															))}
														</select>
														<button
															onClick={() => removeParsedIngredient(index)}
															className="p-1 text-secondary-400 hover:text-red-600 rounded"
														>
															<X className="h-4 w-4" />
														</button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Ingredients Grid */}
			{filteredIngredients.length === 0 ? (
				<Card>
					<CardContent className="text-center py-8 sm:py-12">
						<Package className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 mx-auto mb-4" />
						<h3 className="text-base sm:text-lg font-medium text-secondary-900 mb-2">
							No ingredients found
						</h3>
						<p className="text-sm sm:text-base text-secondary-600 mb-4 px-4">
							{searchTerm || selectedCategory !== "All"
								? "Try adjusting your search or filter criteria"
								: "Start building your pantry by adding your first ingredient"}
						</p>
						{!searchTerm && selectedCategory === "All" && (
							<Button onClick={() => setShowAddForm(true)} className="text-sm sm:text-base">
								Add Your First Ingredient
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{filteredIngredients.map((ingredient) => (
						<Card
							key={ingredient.id}
							className={`relative ${
								isExpired(ingredient.expiration_date)
									? "border-red-200 bg-red-50"
									: isExpiringSoon(ingredient.expiration_date)
										? "border-orange-200 bg-orange-50"
										: ""
							}`}
						>
							<CardContent className="p-3 sm:p-4">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1 min-w-0">
										<h3 className="font-medium text-secondary-900 text-sm sm:text-base truncate">
											{ingredient.name}
										</h3>
										<p className="text-xs sm:text-sm text-secondary-600">
											{ingredient.quantity} {ingredient.unit}
										</p>
											{isOutOfStock(ingredient) && (
												<span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
													Out of Stock
												</span>
											)}
											{isLowStock(ingredient) && !isOutOfStock(ingredient) && (
												<span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
													Low Stock
												</span>
											)}
										<span className="inline-block px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded-full mt-1">
											{ingredient.category}
										</span>
									</div>
									<div className="flex space-x-1 flex-shrink-0 ml-2">
										<button
											onClick={() => startEdit(ingredient)}
											className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded"
										>
											<Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
										</button>
										<button
											onClick={() => handleDelete(ingredient.id)}
											className="p-1.5 text-secondary-400 hover:text-red-600 rounded"
										>
											<Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
										</button>
									</div>
								</div>

								{/* Stock Level Alerts */}
								{(isOutOfStock(ingredient) || isLowStock(ingredient)) && (
									<div
										className={`flex items-center space-x-1 text-xs sm:text-sm mb-2 ${
											isOutOfStock(ingredient) ? "text-red-600" : "text-orange-600"
										}`}
									>
										<AlertTriangle className="h-3 w-3 flex-shrink-0" />
										<span className="truncate">
											{isOutOfStock(ingredient) 
												? "Out of stock - reorder needed"
												: `Low stock - below ${ingredient.low_stock_threshold || 1} ${ingredient.unit}`
											}
										</span>
									</div>
								)}
								{ingredient.expiration_date && (
									<div
										className={`flex items-center space-x-1 text-xs sm:text-sm ${
											isExpired(ingredient.expiration_date)
												? "text-red-600"
												: isExpiringSoon(ingredient.expiration_date)
													? "text-orange-600"
													: "text-secondary-600"
										}`}
									>
										{(isExpired(ingredient.expiration_date) ||
											isExpiringSoon(ingredient.expiration_date)) && (
											<AlertTriangle className="h-3 w-3 flex-shrink-0" />
										)}
										<Calendar className="h-3 w-3 flex-shrink-0" />
										<span className="truncate">
											Expires:{" "}
											{new Date(
												ingredient.expiration_date,
											).toLocaleDateString()}
										</span>
									</div>
								)}

								{ingredient.notes && (
									<p className="text-xs text-secondary-500 mt-2 line-clamp-2">
										{ingredient.notes}
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}