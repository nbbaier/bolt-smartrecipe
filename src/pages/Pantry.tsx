import {
   AlertTriangle,
   Calendar,
   Edit3,
   Filter,
   MessageCircle,
   Package,
   Plus,
   Search,
   Trash2,
   Wand2,
   X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { AutocompleteInput } from "../components/ui/AutocompleteInput";
import { Button } from "../components/ui/Button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "../components/ui/Card";
import { ExpirationMonitor } from "../components/ui/ExpirationMonitor";
import { Input } from "../components/ui/Input";
import { SmartCategorySelector } from "../components/ui/SmartCategorySelector";
import { useAuth } from "../contexts/AuthContext";
import { useIngredientHistory } from "../hooks/useIngredientHistory";
import { ingredientService } from "../lib/database";
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
   const [editingIngredient, setEditingIngredient] =
      useState<Ingredient | null>(null);
   const [showNaturalLanguageInput, setShowNaturalLanguageInput] =
      useState(false);
   const [naturalLanguageText, setNaturalLanguageText] = useState("");
   const [parsedIngredients, setParsedIngredients] = useState<
      Array<{
         name: string;
         quantity: number;
         unit: string;
         category: string;
      }>
   >([]);
   const [isParsingText, setIsParsingText] = useState(false);
   const [isAddingToPantry, setIsAddingToPantry] = useState(false);
   const [showExpirationMonitor, setShowExpirationMonitor] = useState(false);
   const [formData, setFormData] = useState({
      name: "",
      quantity: "",
      unit: "g",
      category: "Other",
      expiration_date: "",
      notes: "",
      low_stock_threshold: "",
   });

   const loadIngredients = useCallback(async () => {
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
   }, [user, refreshHistory]);

   useEffect(() => {
      if (user) {
         loadIngredients();
      }
   }, [user, loadIngredients]);

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
            expiration_date: formData.expiration_date || undefined,
            notes: formData.notes,
            low_stock_threshold: threshold,
         };

         if (editingIngredient) {
            await ingredientService.update(
               editingIngredient.id,
               ingredientData,
            );
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
         case "kg":
         case "l":
            return 0.5;
         case "g":
         case "ml":
            return 100;
         case "cups":
            return 0.5;
         case "tbsp":
         case "tsp":
            return 2;
         case "pieces":
         case "cans":
         case "bottles":
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
         const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-ingredients`,
            {
               method: "POST",
               headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  text: naturalLanguageText.trim(),
               }),
            },
         );

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
         alert(
            "Failed to parse ingredients. Please try again or add ingredients manually.",
         );
         setParsedIngredients([]);
      } finally {
         setIsParsingText(false);
      }
   };

   const updateParsedIngredient = (
      index: number,
      field: string,
      value: string | number,
   ) => {
      setParsedIngredients((prev) =>
         prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item,
         ),
      );
   };

   const removeParsedIngredient = (index: number) => {
      setParsedIngredients((prev) => prev.filter((_, i) => i !== index));
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
               expiration_date: undefined,
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
         low_stock_threshold: (
            ingredient.low_stock_threshold ||
            getDefaultThreshold(ingredient.unit)
         ).toString(),
      });
      setShowAddForm(true);
      setShowNaturalLanguageInput(false);
   };

   const isExpiringSoon = (expirationDate: string | undefined) => {
      if (!expirationDate) return false;
      const expDate = new Date(expirationDate);
      const today = new Date();
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
   };

   const isExpired = (expirationDate: string | undefined) => {
      if (!expirationDate) return false;
      const expDate = new Date(expirationDate);
      const today = new Date();
      return expDate < today;
   };

   const isLowStock = (ingredient: Ingredient) => {
      const threshold =
         ingredient.low_stock_threshold || getDefaultThreshold(ingredient.unit);
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

   // Get ingredients with expiration dates for monitoring
   const ingredientsWithExpiration = ingredients.filter(
      (ing) => ing.expiration_date,
   );

   if (loading) {
      return (
         <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
         </div>
      );
   }

   return (
      <div className="space-y-4 sm:space-y-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
               <h1 className="text-xl font-bold sm:text-2xl text-secondary-900">
                  My Pantry
               </h1>
               <p className="text-sm sm:text-base text-secondary-600">
                  Track your ingredients and expiration dates
               </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
               <Button
                  onClick={() => {
                     setShowAddForm(true);
                     setShowNaturalLanguageInput(false);
                  }}
                  variant={showAddForm ? "default" : "outline"}
                  className="flex justify-center items-center space-x-2 text-sm sm:text-base"
               >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
               </Button>
               <Button
                  onClick={() => {
                     setShowNaturalLanguageInput(true);
                     setShowAddForm(false);
                     setShowExpirationMonitor(false);
                  }}
                  variant={showNaturalLanguageInput ? "default" : "outline"}
                  className="flex justify-center items-center space-x-2 text-sm sm:text-base"
               >
                  <MessageCircle className="w-4 h-4" />
                  <span>Add from Text</span>
               </Button>
               {ingredientsWithExpiration.length > 0 && (
                  <Button
                     onClick={() => {
                        setShowExpirationMonitor(!showExpirationMonitor);
                        setShowAddForm(false);
                        setShowNaturalLanguageInput(false);
                     }}
                     variant={showExpirationMonitor ? "default" : "outline"}
                     className="flex justify-center items-center space-x-2 text-sm sm:text-base"
                  >
                     <Calendar className="w-4 h-4" />
                     <span>Monitor Expiration</span>
                  </Button>
               )}
            </div>
         </div>

         {/* Search and Filter */}
         <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-secondary-400" />
               <Input
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
               />
            </div>
            <div className="flex items-center space-x-2">
               <Filter className="flex-shrink-0 w-4 h-4 text-secondary-600" />
               <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border sm:flex-none border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                     {editingIngredient
                        ? "Edit Ingredient"
                        : "Add New Ingredient"}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                           <div>
                              <label className="block mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 Ingredient Name
                              </label>
                              <AutocompleteInput
                                 value={formData.name}
                                 onChange={(value) =>
                                    setFormData({ ...formData, name: value })
                                 }
                                 onSelect={(suggestion) => {
                                    setFormData({
                                       ...formData,
                                       name: suggestion.name,
                                       category:
                                          suggestion.category ||
                                          formData.category,
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
                                    setFormData({
                                       ...formData,
                                       quantity: e.target.value,
                                    })
                                 }
                              />
                           </div>
                           <div className="w-20 sm:w-24">
                              <label className="block mb-1 text-sm font-medium text-secondary-700">
                                 Unit
                              </label>
                              <select
                                 value={formData.unit}
                                 onChange={(e) =>
                                    setFormData({
                                       ...formData,
                                       unit: e.target.value,
                                    })
                                 }
                                 className="px-2 w-full h-10 text-sm rounded-lg border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                           <SmartCategorySelector
                              ingredientName={formData.name}
                              currentCategory={formData.category}
                              onCategoryChange={(category) =>
                                 setFormData({ ...formData, category })
                              }
                              userHistory={ingredients.map((ing) => ({
                                 name: ing.name,
                                 category: ing.category,
                              }))}
                           />
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
                                 setFormData({
                                    ...formData,
                                    low_stock_threshold: e.target.value,
                                 })
                              }
                              placeholder={`Default: ${getDefaultThreshold(formData.unit)} ${formData.unit}`}
                           />
                           <p className="mt-1 text-xs text-secondary-600">
                              Alert when quantity falls below this amount. Leave
                              empty for default.
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
                     <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button type="submit" className="text-sm sm:text-base">
                           {editingIngredient
                              ? "Update Ingredient"
                              : "Add Ingredient"}
                        </Button>
                        <Button
                           type="button"
                           variant="outline"
                           onClick={resetForm}
                           className="text-sm sm:text-base"
                        >
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
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                     <MessageCircle className="w-5 h-5" />
                     <span>Add Ingredients from Text</span>
                  </CardTitle>
                  <CardDescription>
                     Describe your ingredients in natural language (e.g., "3
                     apples, 1kg flour, 2 cans of tuna")
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div>
                     <label className="block mb-2 text-sm font-medium text-secondary-700">
                        Describe your ingredients:
                     </label>
                     <textarea
                        value={naturalLanguageText}
                        onChange={(e) => setNaturalLanguageText(e.target.value)}
                        placeholder="Example: 3 apples, 1kg flour, 2 cans of tuna, 500ml olive oil, 1 liter milk"
                        className="px-3 py-2 w-full h-24 text-sm rounded-lg border resize-none border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                     />
                  </div>

                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                     <Button
                        onClick={parseNaturalLanguageText}
                        disabled={!naturalLanguageText.trim() || isParsingText}
                        className="flex justify-center items-center space-x-2"
                     >
                        <Wand2 className="w-4 h-4" />
                        <span>
                           {isParsingText ? "Parsing..." : "Parse Text"}
                        </span>
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
                        <div className="flex justify-between items-center">
                           <h3 className="text-lg font-medium text-secondary-900">
                              Parsed Ingredients ({parsedIngredients.length})
                           </h3>
                           <Button
                              onClick={addParsedIngredientsToPantry}
                              disabled={isAddingToPantry}
                              className="flex items-center space-x-2"
                           >
                              <Plus className="w-4 h-4" />
                              <span>
                                 {isAddingToPantry
                                    ? "Adding..."
                                    : "Add All to Pantry"}
                              </span>
                           </Button>
                        </div>

                        <div className="space-y-3">
                           {parsedIngredients.map((ingredient, index) => (
                              <div
                                 key={index}
                                 className="p-4 rounded-lg border bg-secondary-50 border-secondary-200"
                              >
                                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                    <div>
                                       <label className="block mb-1 text-xs font-medium text-secondary-700">
                                          Name
                                       </label>
                                       <input
                                          type="text"
                                          value={ingredient.name}
                                          onChange={(e) =>
                                             updateParsedIngredient(
                                                index,
                                                "name",
                                                e.target.value,
                                             )
                                          }
                                          className="px-2 py-1 w-full text-sm rounded-md border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                       />
                                    </div>
                                    <div>
                                       <label className="block mb-1 text-xs font-medium text-secondary-700">
                                          Quantity
                                       </label>
                                       <input
                                          type="number"
                                          step="0.1"
                                          value={ingredient.quantity}
                                          onChange={(e) =>
                                             updateParsedIngredient(
                                                index,
                                                "quantity",
                                                parseFloat(e.target.value) || 0,
                                             )
                                          }
                                          className="px-2 py-1 w-full text-sm rounded-md border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                       />
                                    </div>
                                    <div>
                                       <label className="block mb-1 text-xs font-medium text-secondary-700">
                                          Unit
                                       </label>
                                       <select
                                          value={ingredient.unit}
                                          onChange={(e) =>
                                             updateParsedIngredient(
                                                index,
                                                "unit",
                                                e.target.value,
                                             )
                                          }
                                          className="px-2 py-1 w-full text-sm rounded-md border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                       >
                                          {UNITS.map((unit) => (
                                             <option key={unit} value={unit}>
                                                {unit}
                                             </option>
                                          ))}
                                       </select>
                                    </div>
                                    <div>
                                       <label className="block mb-1 text-xs font-medium text-secondary-700">
                                          Category
                                       </label>
                                       <div className="flex items-center space-x-2">
                                          <select
                                             value={ingredient.category}
                                             onChange={(e) =>
                                                updateParsedIngredient(
                                                   index,
                                                   "category",
                                                   e.target.value,
                                                )
                                             }
                                             className="flex-1 px-2 py-1 text-sm rounded-md border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                          >
                                             {CATEGORIES.map((category) => (
                                                <option
                                                   key={category}
                                                   value={category}
                                                >
                                                   {category}
                                                </option>
                                             ))}
                                          </select>
                                          <button
                                             onClick={() =>
                                                removeParsedIngredient(index)
                                             }
                                             className="p-1 rounded text-secondary-400 hover:text-red-600"
                                          >
                                             <X className="w-4 h-4" />
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

         {/* Expiration Monitor */}
         {showExpirationMonitor && ingredientsWithExpiration.length > 0 && (
            <ExpirationMonitor
               ingredients={ingredientsWithExpiration}
               onUpdateSettings={(settings) => {
                  console.log("Expiration settings updated:", settings);
                  // Could save to user preferences in the future
               }}
            />
         )}

         {/* Ingredients Grid */}
         {filteredIngredients.length === 0 ? (
            <Card>
               <CardContent className="py-8 text-center sm:py-12">
                  <Package className="mx-auto mb-4 w-10 h-10 sm:h-12 sm:w-12 text-secondary-400" />
                  <h3 className="mb-2 text-base font-medium sm:text-lg text-secondary-900">
                     No ingredients found
                  </h3>
                  <p className="px-4 mb-4 text-sm sm:text-base text-secondary-600">
                     {searchTerm || selectedCategory !== "All"
                        ? "Try adjusting your search or filter criteria"
                        : "Start building your pantry by adding your first ingredient"}
                  </p>
                  {!searchTerm && selectedCategory === "All" && (
                     <Button
                        onClick={() => setShowAddForm(true)}
                        className="text-sm sm:text-base"
                     >
                        Add Your First Ingredient
                     </Button>
                  )}
               </CardContent>
            </Card>
         ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
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
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium truncate text-secondary-900 sm:text-base">
                                 {ingredient.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-secondary-600">
                                 {ingredient.quantity} {ingredient.unit}
                              </p>
                              {isOutOfStock(ingredient) && (
                                 <span className="inline-block px-2 py-1 text-xs text-red-700 bg-red-100 rounded-full">
                                    Out of Stock
                                 </span>
                              )}
                              {isLowStock(ingredient) &&
                                 !isOutOfStock(ingredient) && (
                                    <span className="inline-block px-2 py-1 text-xs text-orange-700 bg-orange-100 rounded-full">
                                       Low Stock
                                    </span>
                                 )}
                              <span className="inline-block px-2 py-1 mt-1 text-xs rounded-full bg-secondary-100 text-secondary-700">
                                 {ingredient.category}
                              </span>
                           </div>
                           <div className="flex flex-shrink-0 ml-2 space-x-1">
                              <button
                                 onClick={() => startEdit(ingredient)}
                                 className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded"
                              >
                                 <Edit3 className="w-3 h-3 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                 onClick={() => handleDelete(ingredient.id)}
                                 className="p-1.5 text-secondary-400 hover:text-red-600 rounded"
                              >
                                 <Trash2 className="w-3 h-3 sm:h-4 sm:w-4" />
                              </button>
                           </div>
                        </div>

                        {/* Stock Level Alerts */}
                        {(isOutOfStock(ingredient) ||
                           isLowStock(ingredient)) && (
                           <div
                              className={`flex items-center space-x-1 text-xs sm:text-sm mb-2 ${
                                 isOutOfStock(ingredient)
                                    ? "text-red-600"
                                    : "text-orange-600"
                              }`}
                           >
                              <AlertTriangle className="flex-shrink-0 w-3 h-3" />
                              <span className="truncate">
                                 {isOutOfStock(ingredient)
                                    ? "Out of stock - reorder needed"
                                    : `Low stock - below ${ingredient.low_stock_threshold || 1} ${ingredient.unit}`}
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
                                 isExpiringSoon(
                                    ingredient.expiration_date,
                                 )) && (
                                 <AlertTriangle className="flex-shrink-0 w-3 h-3" />
                              )}
                              <Calendar className="flex-shrink-0 w-3 h-3" />
                              <span className="truncate">
                                 Expires:{" "}
                                 {new Date(
                                    ingredient.expiration_date,
                                 ).toLocaleDateString()}
                              </span>
                           </div>
                        )}

                        {ingredient.notes && (
                           <p className="mt-2 text-xs text-secondary-500 line-clamp-2">
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
