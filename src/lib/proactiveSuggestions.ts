import type { Ingredient, Recipe, UserPreferences } from "../types";

interface ProactiveSuggestion {
  id: string;
  recipe: Recipe;
  priority: number;
  reason: string;
  expiringIngredients: string[];
  estimatedPrepTime: number;
  difficulty: string;
  matchScore: number;
}

interface SuggestionCriteria {
  ingredients: Ingredient[];
  recipes: Recipe[];
  userPreferences?: UserPreferences;
  daysAhead?: number;
}

export class ProactiveMealSuggestionEngine {
  private static readonly EXPIRATION_THRESHOLDS = {
    CRITICAL: 1, // 1 day
    WARNING: 3,  // 3 days
    UPCOMING: 7  // 7 days
  };

  /**
   * Generate proactive meal suggestions based on expiring ingredients
   */
  static generateSuggestions({
    ingredients,
    recipes,
    userPreferences,
    daysAhead = 3
  }: SuggestionCriteria): ProactiveSuggestion[] {
    const expiringIngredients = this.getExpiringIngredients(ingredients, daysAhead);
    
    if (expiringIngredients.length === 0) {
      return [];
    }

    const suggestions = recipes
      .map(recipe => this.evaluateRecipe(recipe, expiringIngredients, ingredients, userPreferences))
      .filter(suggestion => suggestion.matchScore > 0.3) // Only suggest recipes with decent match
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5); // Top 5 suggestions

    return suggestions;
  }

  /**
   * Get ingredients that are expiring within the specified days
   */
  private static getExpiringIngredients(ingredients: Ingredient[], daysAhead: number): Ingredient[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);

    return ingredients.filter(ingredient => {
      if (!ingredient.expiration_date) return false;
      
      const expDate = new Date(ingredient.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      
      return expDate <= futureDate && expDate >= today;
    });
  }

  /**
   * Evaluate how well a recipe matches expiring ingredients and user preferences
   */
  private static evaluateRecipe(
    recipe: Recipe,
    expiringIngredients: Ingredient[],
    allIngredients: Ingredient[],
    userPreferences?: UserPreferences
  ): ProactiveSuggestion {
    let matchScore = 0;
    let priority = 0;
    const matchedExpiringIngredients: string[] = [];
    let reason = "";

    // Check if recipe uses expiring ingredients
    const recipeIngredientNames = this.getRecipeIngredientNames(recipe);
    
    expiringIngredients.forEach(ingredient => {
      const isUsed = recipeIngredientNames.some(recipeName => 
        this.ingredientMatches(ingredient.name, recipeName)
      );
      
      if (isUsed) {
        matchedExpiringIngredients.push(ingredient.name);
        const daysUntilExpiration = this.getDaysUntilExpiration(ingredient.expiration_date!);
        
        // Higher score for more critical expiration dates
        if (daysUntilExpiration <= this.EXPIRATION_THRESHOLDS.CRITICAL) {
          matchScore += 0.4;
          priority += 100;
        } else if (daysUntilExpiration <= this.EXPIRATION_THRESHOLDS.WARNING) {
          matchScore += 0.3;
          priority += 75;
        } else {
          matchScore += 0.2;
          priority += 50;
        }
      }
    });

    // Check dietary preferences compliance
    if (userPreferences) {
      const isCompliant = this.checkDietaryCompliance(recipe, userPreferences);
      if (!isCompliant) {
        matchScore *= 0.3; // Heavily penalize non-compliant recipes
        priority -= 50;
      } else {
        matchScore += 0.1; // Bonus for compliance
        priority += 10;
      }

      // Adjust for cooking skill level
      const skillBonus = this.getSkillLevelBonus(recipe.difficulty, userPreferences.cooking_skill_level);
      matchScore += skillBonus;
      priority += skillBonus * 20;
    }

    // Check ingredient availability
    const availabilityScore = this.checkIngredientAvailability(recipe, allIngredients);
    matchScore += availabilityScore * 0.2;
    priority += availabilityScore * 30;

    // Generate reason text
    if (matchedExpiringIngredients.length > 0) {
      const urgentIngredients = matchedExpiringIngredients.slice(0, 2);
      reason = `Uses ${urgentIngredients.join(", ")} which expire${urgentIngredients.length === 1 ? 's' : ''} soon`;
    } else {
      reason = "Good match for your preferences";
    }

    return {
      id: `suggestion-${recipe.id}`,
      recipe,
      priority,
      reason,
      expiringIngredients: matchedExpiringIngredients,
      estimatedPrepTime: recipe.prep_time + recipe.cook_time,
      difficulty: recipe.difficulty,
      matchScore
    };
  }

  /**
   * Get ingredient names for a recipe (simplified - in real app would query recipe_ingredients)
   */
  private static getRecipeIngredientNames(recipe: Recipe): string[] {
    // This is a simplified version - in the real implementation,
    // you would query the recipe_ingredients table
    const commonIngredients: Record<string, string[]> = {
      "Classic Spaghetti Carbonara": ["spaghetti", "pancetta", "eggs", "parmesan cheese", "black pepper"],
      "Chicken Stir Fry": ["chicken breast", "bell peppers", "broccoli", "soy sauce", "garlic", "vegetable oil"],
      "Beef Tacos": ["ground beef", "taco shells", "lettuce", "tomatoes", "cheese", "onion"],
      "Margherita Pizza": ["pizza dough", "tomato sauce", "mozzarella cheese", "basil", "olive oil"],
      "Chicken Caesar Salad": ["chicken breast", "romaine lettuce", "caesar dressing", "parmesan cheese", "croutons"],
      "Pancakes": ["flour", "milk", "eggs", "sugar", "butter", "baking powder"],
      "Salmon Teriyaki": ["salmon fillets", "soy sauce", "brown sugar", "rice vinegar", "garlic", "ginger"]
    };

    return commonIngredients[recipe.title] || [];
  }

  /**
   * Check if an ingredient name matches a recipe ingredient
   */
  private static ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
    const userLower = userIngredient.toLowerCase();
    const recipeLower = recipeIngredient.toLowerCase();
    
    return userLower.includes(recipeLower) || recipeLower.includes(userLower);
  }

  /**
   * Get days until expiration
   */
  private static getDaysUntilExpiration(expirationDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if recipe complies with dietary restrictions
   */
  private static checkDietaryCompliance(recipe: Recipe, preferences: UserPreferences): boolean {
    const restrictions = preferences.dietary_restrictions || [];
    const allergies = preferences.allergies || [];
    
    // Simple compliance check based on recipe title and description
    const recipeText = `${recipe.title} ${recipe.description}`.toLowerCase();
    
    // Check dietary restrictions
    for (const restriction of restrictions) {
      switch (restriction.toLowerCase()) {
        case 'vegetarian':
          if (recipeText.includes('meat') || recipeText.includes('chicken') || 
              recipeText.includes('beef') || recipeText.includes('pork') ||
              recipeText.includes('fish') || recipeText.includes('salmon')) {
            return false;
          }
          break;
        case 'vegan':
          if (recipeText.includes('meat') || recipeText.includes('chicken') || 
              recipeText.includes('beef') || recipeText.includes('dairy') ||
              recipeText.includes('cheese') || recipeText.includes('egg') ||
              recipeText.includes('milk') || recipeText.includes('butter')) {
            return false;
          }
          break;
        case 'gluten-free':
          if (recipeText.includes('wheat') || recipeText.includes('flour') ||
              recipeText.includes('pasta') || recipeText.includes('bread')) {
            return false;
          }
          break;
      }
    }

    // Check allergies
    for (const allergy of allergies) {
      if (recipeText.includes(allergy.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get skill level bonus/penalty
   */
  private static getSkillLevelBonus(recipeDifficulty: string, userSkillLevel: string): number {
    const difficultyScore = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const skillScore = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
    
    const recipeDiff = difficultyScore[recipeDifficulty as keyof typeof difficultyScore] || 2;
    const userSkill = skillScore[userSkillLevel as keyof typeof skillScore] || 1;
    
    if (recipeDiff <= userSkill) {
      return 0.1; // Bonus for appropriate difficulty
    } else if (recipeDiff > userSkill + 1) {
      return -0.2; // Penalty for too difficult
    }
    
    return 0; // Neutral
  }

  /**
   * Check ingredient availability score
   */
  private static checkIngredientAvailability(recipe: Recipe, userIngredients: Ingredient[]): number {
    const recipeIngredients = this.getRecipeIngredientNames(recipe);
    const userIngredientNames = userIngredients.map(ing => ing.name.toLowerCase());
    
    if (recipeIngredients.length === 0) return 0.5; // Neutral if no ingredients known
    
    const availableCount = recipeIngredients.filter(recipeIng =>
      userIngredientNames.some(userIng => 
        userIng.includes(recipeIng.toLowerCase()) || recipeIng.toLowerCase().includes(userIng)
      )
    ).length;
    
    return availableCount / recipeIngredients.length;
  }

  /**
   * Generate notification text for push notifications
   */
  static generateNotificationText(suggestion: ProactiveSuggestion): string {
    const { recipe, expiringIngredients, estimatedPrepTime } = suggestion;
    
    if (expiringIngredients.length > 0) {
      const ingredients = expiringIngredients.slice(0, 2).join(", ");
      return `🍳 Cook "${recipe.title}" today! Your ${ingredients} expire${expiringIngredients.length === 1 ? 's' : ''} soon. Ready in ${estimatedPrepTime} min.`;
    }
    
    return `🍳 Try "${recipe.title}" - perfect for your pantry! Ready in ${estimatedPrepTime} min.`;
  }

  /**
   * Schedule notifications for suggestions (would integrate with push notification service)
   */
  static scheduleNotifications(suggestions: ProactiveSuggestion[]): void {
    // In a real implementation, this would integrate with a push notification service
    // For now, we'll just log the notifications that would be sent
    
    suggestions.forEach(suggestion => {
      const notificationText = this.generateNotificationText(suggestion);
      console.log(`[Scheduled Notification] ${notificationText}`);
      
      // Here you would typically:
      // 1. Schedule with a push notification service
      // 2. Store in a notifications table
      // 3. Set up background job to send at appropriate time
    });
  }
}