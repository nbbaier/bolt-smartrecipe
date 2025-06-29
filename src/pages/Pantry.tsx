import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ingredientService } from "../lib/database";
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
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
		null,
	);
	const [formData, setFormData] = useState({
		name: "",
		quantity: "",
		unit: "g",
		category: "Other",
		expiration_date: "",
		notes: "",
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
			const ingredientData = {
				user_id: user.id,
				name: formData.name,
				quantity: parseFloat(formData.quantity) || 0,
				unit: formData.unit,
				category: formData.category,
				expiration_date: formData.expiration_date || null,
				notes: formData.notes,
			};

			if (editingIngredient) {
				await ingredientService.update(editingIngredient.id, ingredientData);
			} else {
				await ingredientService.create(ingredientData);
			}

			await loadIngredients();
			resetForm();
		} catch (error) {
			console.error("Error saving ingredient:", error);
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
		});
		setShowAddForm(false);
		setEditingIngredient(null);
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
		});
		setShowAddForm(true);
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
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-secondary-900">My Pantry</h1>
					<p className="text-secondary-600">
						Track your ingredients and expiration dates
					</p>
				</div>
				<Button
					onClick={() => setShowAddForm(true)}
					className="flex items-center space-x-2"
				>
					<Plus className="h-4 w-4" />
					<span>Add Ingredient</span>
				</Button>
			</div>

			{/* Search and Filter */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
					<Input
						placeholder="Search ingredients..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Filter className="h-4 w-4 text-secondary-600" />
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
					<CardHeader>
						<CardTitle>
							{editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									label="Ingredient Name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
								/>
								<div className="flex space-x-2">
									<Input
										label="Quantity"
										type="number"
										step="0.1"
										value={formData.quantity}
										onChange={(e) =>
											setFormData({ ...formData, quantity: e.target.value })
										}
										className="flex-1"
									/>
									<div className="space-y-1">
										<label className="block text-sm font-medium text-secondary-700">
											Unit
										</label>
										<select
											value={formData.unit}
											onChange={(e) =>
												setFormData({ ...formData, unit: e.target.value })
											}
											className="h-10 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
										>
											{UNITS.map((unit) => (
												<option key={unit} value={unit}>
													{unit}
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-medium text-secondary-700">
										Category
									</label>
									<select
										value={formData.category}
										onChange={(e) =>
											setFormData({ ...formData, category: e.target.value })
										}
										className="w-full h-10 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
							</div>
							<Input
								label="Notes (Optional)"
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								placeholder="Any additional notes..."
							/>
							<div className="flex space-x-2">
								<Button type="submit">
									{editingIngredient ? "Update Ingredient" : "Add Ingredient"}
								</Button>
								<Button type="button" variant="outline" onClick={resetForm}>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Ingredients Grid */}
			{filteredIngredients.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<Package className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-secondary-900 mb-2">
							No ingredients found
						</h3>
						<p className="text-secondary-600 mb-4">
							{searchTerm || selectedCategory !== "All"
								? "Try adjusting your search or filter criteria"
								: "Start building your pantry by adding your first ingredient"}
						</p>
						{!searchTerm && selectedCategory === "All" && (
							<Button onClick={() => setShowAddForm(true)}>
								Add Your First Ingredient
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
							<CardContent className="p-4">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<h3 className="font-medium text-secondary-900">
											{ingredient.name}
										</h3>
										<p className="text-sm text-secondary-600">
											{ingredient.quantity} {ingredient.unit}
										</p>
										<span className="inline-block px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded-full mt-1">
											{ingredient.category}
										</span>
									</div>
									<div className="flex space-x-1">
										<button
											onClick={() => startEdit(ingredient)}
											className="p-1 text-secondary-400 hover:text-secondary-600"
										>
											<Edit3 className="h-4 w-4" />
										</button>
										<button
											onClick={() => handleDelete(ingredient.id)}
											className="p-1 text-secondary-400 hover:text-red-600"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>

								{ingredient.expiration_date && (
									<div
										className={`flex items-center space-x-1 text-sm ${
											isExpired(ingredient.expiration_date)
												? "text-red-600"
												: isExpiringSoon(ingredient.expiration_date)
													? "text-orange-600"
													: "text-secondary-600"
										}`}
									>
										{(isExpired(ingredient.expiration_date) ||
											isExpiringSoon(ingredient.expiration_date)) && (
											<AlertTriangle className="h-3 w-3" />
										)}
										<Calendar className="h-3 w-3" />
										<span>
											Expires:{" "}
											{new Date(
												ingredient.expiration_date,
											).toLocaleDateString()}
										</span>
									</div>
								)}

								{ingredient.notes && (
									<p className="text-xs text-secondary-500 mt-2">
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
