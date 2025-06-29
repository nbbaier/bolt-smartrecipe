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
	Camera,
	Upload,
	Sparkles,
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
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const [showAddForm, setShowAddForm] = useState(false);
	const [showPhotoUpload, setShowPhotoUpload] = useState(false);
	const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
		null,
	);
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
	const [mockRecognizedIngredients, setMockRecognizedIngredients] = useState("");
	const [processingImage, setProcessingImage] = useState(false);
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

	const resetPhotoUpload = () => {
		setSelectedImageFile(null);
		setImagePreviewUrl(null);
		setMockRecognizedIngredients("");
		setShowPhotoUpload(false);
		setProcessingImage(false);
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedImageFile(file);
			const previewUrl = URL.createObjectURL(file);
			setImagePreviewUrl(previewUrl);
			setMockRecognizedIngredients(""); // Reset recognized ingredients
		}
	};

	const simulateAIRecognition = () => {
		setProcessingImage(true);
		
		// Simulate AI processing delay
		setTimeout(() => {
			const mockIngredients = [
				"Apples",
				"Bananas", 
				"Milk",
				"Bread",
				"Eggs",
				"Tomatoes",
				"Cheese",
				"Chicken Breast"
			];
			
			// Randomly select 3-6 ingredients to simulate realistic recognition
			const numIngredients = Math.floor(Math.random() * 4) + 3;
			const selectedIngredients = mockIngredients
				.sort(() => 0.5 - Math.random())
				.slice(0, numIngredients);
			
			setMockRecognizedIngredients(selectedIngredients.join(", "));
			setProcessingImage(false);
		}, 2000);
	};

	const addIngredientsFromPhoto = async () => {
		if (!user || !mockRecognizedIngredients.trim()) return;

		try {
			const ingredientNames = mockRecognizedIngredients
				.split(",")
				.map(name => name.trim())
				.filter(name => name.length > 0);

			for (const name of ingredientNames) {
				const ingredientData = {
					user_id: user.id,
					name: name,
					quantity: 1,
					unit: "pieces",
					category: "Other",
					expiration_date: null,
					notes: "Added from photo",
				};

				await ingredientService.create(ingredientData);
			}

			await loadIngredients();
			resetPhotoUpload();
			
			// Show success message
			alert(`Successfully added ${ingredientNames.length} ingredients from photo!`);
		} catch (error) {
			console.error("Error adding ingredients from photo:", error);
			alert("Failed to add ingredients. Please try again.");
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
		});
		setShowAddForm(true);
		setShowPhotoUpload(false); // Hide photo upload when editing
	};

	const handleShowAddForm = () => {
		setShowAddForm(true);
		setShowPhotoUpload(false);
	};

	const handleShowPhotoUpload = () => {
		setShowPhotoUpload(true);
		setShowAddForm(false);
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
						onClick={handleShowPhotoUpload}
						variant="outline"
						className="flex items-center justify-center space-x-2 text-sm sm:text-base"
					>
						<Camera className="h-4 w-4" />
						<span>Add from Photo</span>
					</Button>
					<Button
						onClick={handleShowAddForm}
						className="flex items-center justify-center space-x-2 text-sm sm:text-base"
					>
						<Plus className="h-4 w-4" />
						<span>Add Ingredient</span>
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

			{/* Photo Upload Form */}
			{showPhotoUpload && (
				<Card>
					<CardHeader className="pb-3 sm:pb-6">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
									<Camera className="h-5 w-5" />
									<span>Add Ingredients from Photo</span>
								</CardTitle>
								<CardDescription>
									Upload a photo of your ingredients and let AI identify them
								</CardDescription>
							</div>
							<Button variant="ghost" size="icon" onClick={resetPhotoUpload}>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* File Upload */}
						<div className="space-y-4">
							<div className="flex items-center justify-center w-full">
								<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer bg-secondary-50 hover:bg-secondary-100 transition-colors">
									<div className="flex flex-col items-center justify-center pt-5 pb-6">
										<Upload className="w-8 h-8 mb-2 text-secondary-500" />
										<p className="mb-2 text-sm text-secondary-500">
											<span className="font-semibold">Click to upload</span> or drag and drop
										</p>
										<p className="text-xs text-secondary-500">PNG, JPG, JPEG (MAX. 10MB)</p>
									</div>
									<input
										type="file"
										className="hidden"
										accept="image/*"
										onChange={handleImageUpload}
									/>
								</label>
							</div>
						</div>

						{/* Image Preview */}
						{imagePreviewUrl && (
							<div className="space-y-4">
								<div className="relative">
									<img
										src={imagePreviewUrl}
										alt="Uploaded ingredient photo"
										className="w-full max-h-64 object-contain rounded-lg border border-secondary-200"
									/>
								</div>
								
								{/* AI Recognition Button */}
								{!mockRecognizedIngredients && (
									<Button
										onClick={simulateAIRecognition}
										disabled={processingImage}
										className="w-full flex items-center justify-center space-x-2"
									>
										<Sparkles className="h-4 w-4" />
										<span>{processingImage ? "Analyzing Image..." : "Simulate AI Recognition"}</span>
									</Button>
								)}

								{/* Processing Indicator */}
								{processingImage && (
									<div className="flex items-center justify-center space-x-2 text-sm text-secondary-600">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
										<span>AI is analyzing your photo...</span>
									</div>
								)}
							</div>
						)}

						{/* Recognized Ingredients */}
						{mockRecognizedIngredients && (
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-secondary-700 mb-2">
										Recognized Ingredients (editable)
									</label>
									<textarea
										value={mockRecognizedIngredients}
										onChange={(e) => setMockRecognizedIngredients(e.target.value)}
										placeholder="Edit the recognized ingredients..."
										className="w-full h-24 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
									/>
									<p className="text-xs text-secondary-500 mt-1">
										Separate ingredients with commas. You can edit, add, or remove items.
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
									<Button
										onClick={addIngredientsFromPhoto}
										className="flex items-center justify-center space-x-2"
									>
										<Plus className="h-4 w-4" />
										<span>Add to Pantry</span>
									</Button>
									<Button
										variant="outline"
										onClick={resetPhotoUpload}
									>
										Cancel
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

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
									<Input
										label="Ingredient Name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
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
							<div className="flex flex-col sm:flex-row gap-2 justify-center">
								<Button onClick={handleShowPhotoUpload} variant="outline" className="text-sm sm:text-base">
									<Camera className="h-4 w-4 mr-2" />
									Add from Photo
								</Button>
								<Button onClick={handleShowAddForm} className="text-sm sm:text-base">
									Add Your First Ingredient
								</Button>
							</div>
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