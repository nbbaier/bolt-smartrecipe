import {
   Check,
   ChefHat,
   Clock,
   Edit3,
   Filter,
   ListPlus,
   Package,
   Plus,
   Search,
   ShoppingCart,
   Trash2,
   X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import {
   ingredientService,
   recipeService,
   shoppingListService,
} from "../lib/database";
import type {
   Ingredient,
   Recipe,
   ShoppingList,
   ShoppingListItem,
} from "../types";

const CATEGORIES = [
   "Produce",
   "Meat & Seafood",
   "Dairy & Eggs",
   "Pantry",
   "Frozen",
   "Bakery",
   "Beverages",
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

export function Shopping() {
   const { user } = useAuth();
   const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
   const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
   const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
   const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
   const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedCategory, setSelectedCategory] = useState<string>("All");
   const [showAddForm, setShowAddForm] = useState(false);
   const [showListForm, setShowListForm] = useState(false);
   const [showRecipeModal, setShowRecipeModal] = useState(false);
   const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(
      null,
   );

   const [listFormData, setListFormData] = useState({
      name: "",
      description: "",
   });

   const [itemFormData, setItemFormData] = useState({
      name: "",
      quantity: "1",
      unit: "pieces",
      category: "Other",
      notes: "",
   });

   const loadData = useCallback(async () => {
      if (!user) return;

      try {
         setLoading(true);
         const [lists, ingredients, recipes] = await Promise.all([
            shoppingListService.getAllLists(user.id),
            ingredientService.getAll(user.id),
            recipeService.getAll(),
         ]);

         setShoppingLists(lists);
         setUserIngredients(ingredients);
         setAvailableRecipes(recipes);

         // Select first list if available
         if (lists.length > 0 && !selectedList) {
            setSelectedList(lists[0]);
         }
      } catch (error) {
         console.error("Error loading shopping data:", error);
      } finally {
         setLoading(false);
      }
   }, [user, selectedList]);

   const loadListItems = useCallback(async () => {
      if (!selectedList) return;

      try {
         const items = await shoppingListService.getListItems(selectedList.id);
         setListItems(items);
      } catch (error) {
         console.error("Error loading list items:", error);
      }
   }, [selectedList]);

   useEffect(() => {
      if (user) {
         loadData();
      }
   }, [user, loadData]);

   useEffect(() => {
      if (selectedList) {
         loadListItems();
      }
   }, [selectedList, loadListItems]);

   const createList = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      try {
         const newList = await shoppingListService.createList({
            user_id: user.id,
            name: listFormData.name,
            description: listFormData.description,
         });

         setShoppingLists([newList, ...shoppingLists]);
         setSelectedList(newList);
         resetListForm();
      } catch (error) {
         console.error("Error creating list:", error);
      }
   };

   const deleteList = async (listId: string) => {
      if (!confirm("Are you sure you want to delete this shopping list?"))
         return;

      try {
         await shoppingListService.deleteList(listId);
         const updatedLists = shoppingLists.filter(
            (list) => list.id !== listId,
         );
         setShoppingLists(updatedLists);

         if (selectedList?.id === listId) {
            setSelectedList(updatedLists[0] || null);
         }
      } catch (error) {
         console.error("Error deleting list:", error);
      }
   };

   const createItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedList) return;

      try {
         const itemData = {
            shopping_list_id: selectedList.id,
            name: itemFormData.name,
            quantity: parseFloat(itemFormData.quantity) || 1,
            unit: itemFormData.unit,
            category: itemFormData.category,
            is_purchased: false,
            notes: itemFormData.notes,
         };

         if (editingItem) {
            await shoppingListService.updateItem(editingItem.id, itemData);
         } else {
            await shoppingListService.createItem(itemData);
         }

         await loadListItems();
         resetItemForm();
      } catch (error) {
         console.error("Error saving item:", error);
      }
   };

   const deleteItem = async (itemId: string) => {
      try {
         await shoppingListService.deleteItem(itemId);
         await loadListItems();
      } catch (error) {
         console.error("Error deleting item:", error);
      }
   };

   const togglePurchased = async (itemId: string, isPurchased: boolean) => {
      try {
         console.log("Toggling purchase status:", {
            itemId,
            isPurchased,
            newStatus: !isPurchased,
         });

         // Find the item being toggled
         const item = listItems.find((item) => item.id === itemId);
         if (!item) {
            console.error("Item not found:", itemId);
            return;
         }

         console.log("Found item:", item);

         const updatedItem = await shoppingListService.togglePurchased(
            itemId,
            !isPurchased,
         );
         console.log("Updated item:", updatedItem);

         // If item was just marked as purchased, add it to pantry
         if (!isPurchased && user) {
            // Item was just marked as purchased
            console.log("Item marked as purchased, adding to pantry...");
            await shoppingListService.addToPantryFromShopping(
               user.id,
               updatedItem.name,
               updatedItem.quantity,
               updatedItem.unit,
               updatedItem.category,
            );
         } else {
            console.log("Item unmarked as purchased or no user");
         }

         await loadListItems();
      } catch (error) {
         console.error("Error toggling purchase status:", error);
         alert("Failed to update item. Please try again.");
      }
   };

   const addFromRecipe = async (recipeId: string) => {
      if (!selectedList) return;

      try {
         console.log(
            "Adding from recipe:",
            recipeId,
            "to list:",
            selectedList.id,
         );
         await shoppingListService.createFromRecipe(
            selectedList.id,
            recipeId,
            userIngredients,
         );
         await loadListItems();
         setShowRecipeModal(false);
      } catch (error) {
         console.error("Error adding from recipe:", error);
         alert("Failed to add recipe ingredients. Please try again.");
      }
   };

   const resetListForm = () => {
      setListFormData({ name: "", description: "" });
      setShowListForm(false);
   };

   const resetItemForm = () => {
      setItemFormData({
         name: "",
         quantity: "1",
         unit: "pieces",
         category: "Other",
         notes: "",
      });
      setShowAddForm(false);
      setEditingItem(null);
   };

   const startEditItem = (item: ShoppingListItem) => {
      setEditingItem(item);
      setItemFormData({
         name: item.name,
         quantity: item.quantity.toString(),
         unit: item.unit,
         category: item.category,
         notes: item.notes || "",
      });
      setShowAddForm(true);
   };

   const filteredItems = listItems.filter((item) => {
      const matchesSearch = item.name
         .toLowerCase()
         .includes(searchTerm.toLowerCase());
      const matchesCategory =
         selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
   });

   const categoryCounts = CATEGORIES.reduce(
      (acc, category) => {
         acc[category] = listItems.filter(
            (item) => item.category === category,
         ).length;
         return acc;
      },
      {} as Record<string, number>,
   );

   const purchasedCount = listItems.filter((item) => item.is_purchased).length;
   const totalCount = listItems.length;

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
                  Shopping Lists
               </h1>
               <p className="text-sm sm:text-base text-secondary-600">
                  Plan your grocery trips and track purchases
               </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
               <Button
                  onClick={() => setShowListForm(true)}
                  variant="outline"
                  className="flex justify-center items-center space-x-2 text-sm sm:text-base"
               >
                  <ListPlus className="w-4 h-4" />
                  <span>New List</span>
               </Button>
               <Button
                  onClick={() => setShowAddForm(true)}
                  disabled={!selectedList}
                  className="flex justify-center items-center space-x-2 text-sm sm:text-base"
               >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
               </Button>
            </div>
         </div>

         {/* Shopping Lists Tabs */}
         {shoppingLists.length > 0 && (
            <div className="flex flex-wrap gap-2">
               {shoppingLists.map((list) => (
                  <button
                     key={list.id}
                     onClick={() => setSelectedList(list)}
                     className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedList?.id === list.id
                           ? "bg-primary text-primary-foreground"
                           : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                     }`}
                  >
                     <ShoppingCart className="w-4 h-4" />
                     <span>{list.name}</span>
                     {selectedList?.id === list.id && (
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              deleteList(list.id);
                           }}
                           className="ml-1 p-0.5 hover:bg-primary-foreground/20 rounded"
                        >
                           <X className="w-3 h-3" />
                        </button>
                     )}
                  </button>
               ))}
            </div>
         )}

         {/* Create List Form */}
         {showListForm && (
            <Card>
               <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">
                     Create New Shopping List
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <form onSubmit={createList} className="space-y-4">
                     <Input
                        label="List Name"
                        value={listFormData.name}
                        onChange={(e) =>
                           setListFormData({
                              ...listFormData,
                              name: e.target.value,
                           })
                        }
                        required
                        placeholder="e.g., Weekly Groceries"
                     />
                     <Input
                        label="Description (Optional)"
                        value={listFormData.description}
                        onChange={(e) =>
                           setListFormData({
                              ...listFormData,
                              description: e.target.value,
                           })
                        }
                        placeholder="e.g., Ingredients for this week's meal prep"
                     />
                     <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button type="submit" className="text-sm sm:text-base">
                           Create List
                        </Button>
                        <Button
                           type="button"
                           variant="outline"
                           onClick={resetListForm}
                           className="text-sm sm:text-base"
                        >
                           Cancel
                        </Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         )}

         {selectedList ? (
            <>
               {/* List Header with Stats */}
               <Card>
                  <CardContent className="p-4 sm:p-6">
                     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                           <h2 className="text-lg font-semibold sm:text-xl text-secondary-900">
                              {selectedList.name}
                           </h2>
                           {selectedList.description && (
                              <p className="text-sm text-secondary-600">
                                 {selectedList.description}
                              </p>
                           )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                           <div className="flex items-center space-x-1">
                              <Package className="w-4 h-4 text-secondary-600" />
                              <span>{totalCount} items</span>
                           </div>
                           <div className="flex items-center space-x-1">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>{purchasedCount} purchased</span>
                           </div>
                           {totalCount > 0 && (
                              <Badge variant="secondary">
                                 {Math.round(
                                    (purchasedCount / totalCount) * 100,
                                 )}
                                 % complete
                              </Badge>
                           )}
                        </div>
                     </div>

                     {/* Quick Actions */}
                     <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                        <Button
                           onClick={() => setShowRecipeModal(true)}
                           variant="outline"
                           className="flex justify-center items-center space-x-2 text-sm"
                        >
                           <ChefHat className="w-4 h-4" />
                           <span>Add from Recipe</span>
                        </Button>
                        <Button
                           onClick={() => setShowAddForm(true)}
                           variant="outline"
                           className="flex justify-center items-center space-x-2 text-sm"
                        >
                           <Plus className="w-4 h-4" />
                           <span>Add Item</span>
                        </Button>
                     </div>
                  </CardContent>
               </Card>

               {/* Search and Filter */}
               <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-secondary-400" />
                     <Input
                        placeholder="Search items..."
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

               {/* Add/Edit Item Form */}
               {showAddForm && (
                  <Card>
                     <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl">
                           {editingItem ? "Edit Item" : "Add New Item"}
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <form onSubmit={createItem} className="space-y-4">
                           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                 <Input
                                    label="Item Name"
                                    value={itemFormData.name}
                                    onChange={(e) =>
                                       setItemFormData({
                                          ...itemFormData,
                                          name: e.target.value,
                                       })
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
                                       value={itemFormData.quantity}
                                       onChange={(e) =>
                                          setItemFormData({
                                             ...itemFormData,
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
                                       value={itemFormData.unit}
                                       onChange={(e) =>
                                          setItemFormData({
                                             ...itemFormData,
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
                                 <label className="block mb-1 text-sm font-medium text-secondary-700">
                                    Category
                                 </label>
                                 <select
                                    value={itemFormData.category}
                                    onChange={(e) =>
                                       setItemFormData({
                                          ...itemFormData,
                                          category: e.target.value,
                                       })
                                    }
                                    className="px-3 w-full h-10 text-sm rounded-lg border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                 >
                                    {CATEGORIES.map((category) => (
                                       <option key={category} value={category}>
                                          {category}
                                       </option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                           <Input
                              label="Notes (Optional)"
                              value={itemFormData.notes}
                              onChange={(e) =>
                                 setItemFormData({
                                    ...itemFormData,
                                    notes: e.target.value,
                                 })
                              }
                              placeholder="Any additional notes..."
                           />
                           <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                              <Button
                                 type="submit"
                                 className="text-sm sm:text-base"
                              >
                                 {editingItem ? "Update Item" : "Add Item"}
                              </Button>
                              <Button
                                 type="button"
                                 variant="outline"
                                 onClick={resetItemForm}
                                 className="text-sm sm:text-base"
                              >
                                 Cancel
                              </Button>
                           </div>
                        </form>
                     </CardContent>
                  </Card>
               )}

               {/* Shopping List Items */}
               {filteredItems.length === 0 ? (
                  <Card>
                     <CardContent className="py-8 text-center sm:py-12">
                        <ShoppingCart className="mx-auto mb-4 w-10 h-10 sm:h-12 sm:w-12 text-secondary-400" />
                        <h3 className="mb-2 text-base font-medium sm:text-lg text-secondary-900">
                           {searchTerm || selectedCategory !== "All"
                              ? "No items found"
                              : "No items in this list"}
                        </h3>
                        <p className="px-4 mb-4 text-sm sm:text-base text-secondary-600">
                           {searchTerm || selectedCategory !== "All"
                              ? "Try adjusting your search or filter criteria"
                              : "Add items to start building your shopping list"}
                        </p>
                        {!searchTerm && selectedCategory === "All" && (
                           <div className="flex flex-col gap-2 justify-center sm:flex-row">
                              <Button
                                 onClick={() => setShowAddForm(true)}
                                 className="text-sm sm:text-base"
                              >
                                 Add Item
                              </Button>
                              <Button
                                 onClick={() => setShowRecipeModal(true)}
                                 variant="outline"
                                 className="text-sm sm:text-base"
                              >
                                 Add from Recipe
                              </Button>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               ) : (
                  <div className="space-y-3">
                     {/* Debug Info */}
                     {process.env.NODE_ENV === "development" && (
                        <Card className="bg-blue-50 border-blue-200">
                           <CardContent className="p-3">
                              <p className="text-xs text-blue-700">
                                 Debug: {listItems.length} total items,{" "}
                                 {
                                    listItems.filter((i) => i.is_purchased)
                                       .length
                                 }{" "}
                                 purchased
                              </p>
                           </CardContent>
                        </Card>
                     )}

                     {/* Unpurchased Items */}
                     <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {filteredItems
                           .filter((item) => !item.is_purchased)
                           .map((item) => (
                              <Card
                                 key={item.id}
                                 className="transition-shadow hover:shadow-md"
                              >
                                 <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-center space-x-3">
                                       <button
                                          onClick={() =>
                                             togglePurchased(
                                                item.id,
                                                item.is_purchased,
                                             )
                                          }
                                          className="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors sm:w-6 sm:h-6 border-secondary-300 hover:border-primary"
                                       />
                                       <div className="flex-1 min-w-0">
                                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                             <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium truncate text-secondary-900 sm:text-base">
                                                   {item.name}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-secondary-600">
                                                   {item.quantity} {item.unit}
                                                   {item.notes &&
                                                      ` • ${item.notes}`}
                                                </p>
                                             </div>
                                             <div className="flex flex-shrink-0 items-center space-x-2">
                                                <Badge
                                                   variant="outline"
                                                   className="text-xs"
                                                >
                                                   {item.category}
                                                </Badge>
                                                <button
                                                   onClick={() =>
                                                      startEditItem(item)
                                                   }
                                                   className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded"
                                                >
                                                   <Edit3 className="w-3 h-3 sm:h-4 sm:w-4" />
                                                </button>
                                                <button
                                                   onClick={() =>
                                                      deleteItem(item.id)
                                                   }
                                                   className="p-1.5 text-secondary-400 hover:text-red-600 rounded"
                                                >
                                                   <Trash2 className="w-3 h-3 sm:h-4 sm:w-4" />
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </CardContent>
                              </Card>
                           ))}
                     </div>

                     {/* Purchased Items */}
                     {filteredItems.some((item) => item.is_purchased) && (
                        <div className="mt-6">
                           <h3 className="flex items-center mb-3 text-sm font-medium text-secondary-600">
                              <Check className="mr-1 w-4 h-4" />
                              Purchased (
                              {
                                 filteredItems.filter(
                                    (item) => item.is_purchased,
                                 ).length
                              }
                              )
                           </h3>
                           <div className="grid grid-cols-1 gap-2 sm:gap-3">
                              {filteredItems
                                 .filter((item) => item.is_purchased)
                                 .map((item) => (
                                    <Card key={item.id} className="opacity-60">
                                       <CardContent className="p-3 sm:p-4">
                                          <div className="flex items-center space-x-3">
                                             <button
                                                onClick={() =>
                                                   togglePurchased(
                                                      item.id,
                                                      item.is_purchased,
                                                   )
                                                }
                                                className="flex flex-shrink-0 justify-center items-center w-5 h-5 bg-green-500 rounded-full border-2 border-green-500 transition-colors sm:w-6 sm:h-6 hover:bg-green-600"
                                             >
                                                <Check className="w-3 h-3 text-white sm:h-4 sm:w-4" />
                                             </button>
                                             <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                                   <div className="flex-1 min-w-0">
                                                      <h4 className="text-sm font-medium line-through truncate text-secondary-900 sm:text-base">
                                                         {item.name}
                                                      </h4>
                                                      <p className="text-xs sm:text-sm text-secondary-500">
                                                         {item.quantity}{" "}
                                                         {item.unit}
                                                         {item.notes &&
                                                            ` • ${item.notes}`}
                                                      </p>
                                                   </div>
                                                   <button
                                                      onClick={() =>
                                                         deleteItem(item.id)
                                                      }
                                                      className="p-1.5 text-secondary-400 hover:text-red-600 rounded flex-shrink-0"
                                                   >
                                                      <Trash2 className="w-3 h-3 sm:h-4 sm:w-4" />
                                                   </button>
                                                </div>
                                             </div>
                                          </div>
                                       </CardContent>
                                    </Card>
                                 ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}
            </>
         ) : (
            <Card>
               <CardContent className="py-8 text-center sm:py-12">
                  <ShoppingCart className="mx-auto mb-4 w-10 h-10 sm:h-12 sm:w-12 text-secondary-400" />
                  <h3 className="mb-2 text-base font-medium sm:text-lg text-secondary-900">
                     No shopping lists yet
                  </h3>
                  <p className="px-4 mb-4 text-sm sm:text-base text-secondary-600">
                     Create your first shopping list to start planning your
                     grocery trips
                  </p>
                  <Button
                     onClick={() => setShowListForm(true)}
                     className="text-sm sm:text-base"
                  >
                     Create Your First List
                  </Button>
               </CardContent>
            </Card>
         )}

         {/* Add from Recipe Modal */}
         {showRecipeModal && (
            <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50">
               <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <CardHeader className="pb-3 sm:pb-6">
                     <div className="flex justify-between items-center">
                        <CardTitle className="text-lg sm:text-xl">
                           Add from Recipe
                        </CardTitle>
                        <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setShowRecipeModal(false)}
                        >
                           <X className="w-4 h-4" />
                        </Button>
                     </div>
                     <CardDescription>
                        Select a recipe to add its ingredients to your shopping
                        list
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-y-auto">
                     <div className="grid grid-cols-1 gap-3">
                        {availableRecipes.map((recipe) => (
                           <Card
                              key={recipe.id}
                              className="transition-shadow cursor-pointer hover:shadow-md"
                           >
                              <CardContent className="p-3 sm:p-4">
                                 <div className="flex items-center space-x-3">
                                    <img
                                       src={
                                          recipe.image_url ||
                                          "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                                       }
                                       alt={recipe.title}
                                       className="object-cover flex-shrink-0 w-12 h-12 rounded-lg sm:w-16 sm:h-16"
                                    />
                                    <div className="flex-1 min-w-0">
                                       <h4 className="text-sm font-medium truncate text-secondary-900 sm:text-base">
                                          {recipe.title}
                                       </h4>
                                       <p className="text-xs sm:text-sm text-secondary-600 line-clamp-2">
                                          {recipe.description}
                                       </p>
                                       <div className="flex items-center mt-1 space-x-2">
                                          <Clock className="w-3 h-3 text-secondary-400" />
                                          <span className="text-xs text-secondary-600">
                                             {recipe.prep_time +
                                                recipe.cook_time}{" "}
                                             min
                                          </span>
                                          <Badge
                                             variant="outline"
                                             className="text-xs"
                                          >
                                             {recipe.difficulty}
                                          </Badge>
                                       </div>
                                    </div>
                                    <Button
                                       onClick={async () => {
                                          console.log(
                                             "Button clicked for recipe:",
                                             recipe.title,
                                          );
                                          await addFromRecipe(recipe.id);
                                       }}
                                       size="sm"
                                       className="flex-shrink-0"
                                    >
                                       Add
                                    </Button>
                                 </div>
                              </CardContent>
                           </Card>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}
      </div>
   );
}
