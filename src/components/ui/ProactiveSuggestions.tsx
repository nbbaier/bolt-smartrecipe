import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ingredientService, recipeService, userPreferencesService } from "../../lib/database";
import { ProactiveMealSuggestionEngine } from "../../lib/proactiveSuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import { Badge } from "./badge";
import {
  Lightbulb,
  Clock,
  ChefHat,
  AlertTriangle,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { Ingredient, Recipe, UserPreferences } from "../../types";

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

interface ProactiveSuggestionsProps {
  className?: string;
  maxSuggestions?: number;
  showDismissed?: boolean;
}

export function ProactiveSuggestions({ 
  className = "", 
  maxSuggestions = 3,
  showDismissed = false 
}: ProactiveSuggestionsProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (user) {
      loadSuggestions();
      // Load dismissed suggestions from localStorage
      const dismissed = localStorage.getItem(`dismissed-suggestions-${user.id}`);
      if (dismissed) {
        setDismissedSuggestions(new Set(JSON.parse(dismissed)));
      }
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [ingredientsData, recipesData, preferencesData] = await Promise.all([
        ingredientService.getAll(user.id),
        recipeService.getAll(),
        userPreferencesService.getPreferences(user.id),
      ]);

      setIngredients(ingredientsData);
      setRecipes(recipesData);
      setUserPreferences(preferencesData);

      // Generate proactive suggestions
      const generatedSuggestions = ProactiveMealSuggestionEngine.generateSuggestions({
        ingredients: ingredientsData,
        recipes: recipesData,
        userPreferences: preferencesData || undefined,
        daysAhead: 3,
      });

      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error("Error loading proactive suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    const newDismissed = new Set(dismissedSuggestions);
    newDismissed.add(suggestionId);
    setDismissedSuggestions(newDismissed);
    
    // Save to localStorage
    localStorage.setItem(
      `dismissed-suggestions-${user?.id}`,
      JSON.stringify(Array.from(newDismissed))
    );
  };

  const undismissSuggestion = (suggestionId: string) => {
    const newDismissed = new Set(dismissedSuggestions);
    newDismissed.delete(suggestionId);
    setDismissedSuggestions(newDismissed);
    
    // Save to localStorage
    localStorage.setItem(
      `dismissed-suggestions-${user?.id}`,
      JSON.stringify(Array.from(newDismissed))
    );
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 100) return "text-red-600";
    if (priority >= 75) return "text-orange-600";
    return "text-blue-600";
  };

  const filteredSuggestions = showDismissed 
    ? suggestions.filter(s => dismissedSuggestions.has(s.id))
    : suggestions.filter(s => !dismissedSuggestions.has(s.id));

  const displaySuggestions = filteredSuggestions.slice(0, maxSuggestions);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displaySuggestions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span>Smart Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {showDismissed 
                ? "No dismissed suggestions"
                : "No urgent suggestions right now. Your pantry is well managed!"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          <span>{showDismissed ? "Dismissed Suggestions" : "Smart Suggestions"}</span>
          {!showDismissed && displaySuggestions.length > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              {displaySuggestions.length} suggestion{displaySuggestions.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {displaySuggestions.map((suggestion) => (
          <Card key={suggestion.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <img
                  src={
                    suggestion.recipe.image_url ||
                    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                  }
                  alt={suggestion.recipe.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {suggestion.recipe.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {suggestion.recipe.description}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => 
                        showDismissed 
                          ? undismissSuggestion(suggestion.id)
                          : dismissSuggestion(suggestion.id)
                      }
                      className="ml-2 p-1 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Reason and expiring ingredients */}
                  <div className="mt-2 flex items-center space-x-1">
                    <AlertTriangle className={`h-3 w-3 ${getPriorityColor(suggestion.priority)}`} />
                    <span className={`text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.reason}
                    </span>
                  </div>

                  {/* Recipe details */}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{suggestion.estimatedPrepTime} min</span>
                    </div>
                    <Badge variant="outline" className={`${getDifficultyColor(suggestion.difficulty)} text-xs`}>
                      {suggestion.difficulty}
                    </Badge>
                    {suggestion.recipe.cuisine_type && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.recipe.cuisine_type}
                      </Badge>
                    )}
                  </div>

                  {/* Expiring ingredients highlight */}
                  {suggestion.expiringIngredients.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {suggestion.expiringIngredients.slice(0, 3).map((ingredient, index) => (
                        <span
                          key={index}
                          className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                      {suggestion.expiringIngredients.length > 3 && (
                        <span className="text-xs text-orange-600">
                          +{suggestion.expiringIngredients.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="mt-3">
                    <Button size="sm" className="text-xs">
                      <ChefHat className="h-3 w-3 mr-1" />
                      View Recipe
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show more button if there are more suggestions */}
        {filteredSuggestions.length > maxSuggestions && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/recipes'}>
              View All Suggestions ({filteredSuggestions.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}