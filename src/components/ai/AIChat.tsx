import {
   Bot,
   ChefHat,
   Clock,
   Heart,
   Lightbulb,
   Package,
   Send,
   User,
   Utensils,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
   ingredientService,
   recipeService,
   userPreferencesService,
} from "../../lib/database";
import type { Ingredient, Recipe, UserPreferences } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

interface Message {
   id: string;
   type: "user" | "ai";
   content: string;
   timestamp: Date;
   suggestions?: string[];
   recipes?: Recipe[];
}

const QUICK_PROMPTS = [
   {
      icon: ChefHat,
      text: "What can I cook tonight?",
      category: "recipes",
   },
   {
      icon: Package,
      text: "What's expiring soon?",
      category: "pantry",
   },
   {
      icon: Lightbulb,
      text: "Suggest a healthy meal",
      category: "suggestions",
   },
   {
      icon: Clock,
      text: "Quick 15-minute recipes",
      category: "time",
   },
   {
      icon: Heart,
      text: "Comfort food ideas",
      category: "mood",
   },
   {
      icon: Utensils,
      text: "Help me meal prep",
      category: "planning",
   },
];

export function AIChat() {
   const { user } = useAuth();
   const [messages, setMessages] = useState<Message[]>([]);
   const [inputValue, setInputValue] = useState("");
   const [isTyping, setIsTyping] = useState(false);
   const [userIngredients, setUserIngredients] = useState<Ingredient[]>([]);
   const [_availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
   const [userPreferences, setUserPreferences] =
      useState<UserPreferences | null>(null);
   const scrollAreaRef = useRef<HTMLDivElement>(null);
   const textareaRef = useRef<HTMLTextAreaElement>(null);

   const loadUserData = useCallback(async () => {
      if (!user) return;

      try {
         const [ingredients, recipes, preferences] = await Promise.all([
            ingredientService.getAll(user.id),
            recipeService.getAll(),
            userPreferencesService.getPreferences(user.id),
         ]);
         setUserIngredients(ingredients);
         setAvailableRecipes(recipes);
         setUserPreferences(preferences);
      } catch (error) {
         console.error("Error loading user data:", error);
      }
   }, [user]);

   useEffect(() => {
      if (user) {
         loadUserData();
         // Add welcome message
         const welcomeMessage: Message = {
            id: "welcome",
            type: "ai",
            content: `Hello! I'm your AI cooking assistant. I can help you discover recipes based on your pantry, suggest meals, and answer cooking questions. What would you like to cook today?`,
            timestamp: new Date(),
            suggestions: [
               "Show me recipes I can make",
               "What's expiring in my pantry?",
               "Suggest a healthy dinner",
               "Help me plan meals for the week",
            ],
         };
         setMessages([welcomeMessage]);
      }
   }, [user, loadUserData]);

   // Auto-resize textarea based on content
   useEffect(() => {
      if (textareaRef.current) {
         textareaRef.current.style.height = "auto";
         textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
   }, []);

   useEffect(() => {
      // Scroll to bottom when new messages are added
      if (scrollAreaRef.current) {
         const scrollElement = scrollAreaRef.current.querySelector(
            "[data-radix-scroll-area-viewport]",
         );
         if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
         }
      }
   }, []);

   const generateAIResponse = async (userMessage: string): Promise<Message> => {
      try {
         // Prepare the conversation history for the API
         const conversationMessages = messages
            .filter((msg) => msg.type !== "ai" || !msg.suggestions) // Exclude system messages with suggestions
            .map((msg) => ({
               role:
                  msg.type === "user"
                     ? ("user" as const)
                     : ("assistant" as const),
               content: msg.content,
            }));

         // Add the current user message
         conversationMessages.push({
            role: "user" as const,
            content: userMessage,
         });

         // Prepare user context
         const ingredientNames = userIngredients.map((ing) => ing.name);
         const userContext = {
            userIngredients: ingredientNames,
            userPreferences: userPreferences
               ? {
                    dietary_restrictions: userPreferences.dietary_restrictions,
                    allergies: userPreferences.allergies,
                    cooking_skill_level: userPreferences.cooking_skill_level,
                 }
               : undefined,
         };

         // Call the edge function
         const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
            {
               method: "POST",
               headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  messages: conversationMessages,
                  ...userContext,
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

         // Parse the AI response and generate suggestions
         const aiContent = data.message;
         let suggestions: string[] = [];
         let recipes: Recipe[] = [];

         // Generate contextual suggestions based on the response
         if (
            aiContent.toLowerCase().includes("recipe") ||
            aiContent.toLowerCase().includes("cook")
         ) {
            suggestions = [
               "Show me more recipes",
               "What about vegetarian options?",
               "I want something quick",
               "Help me plan meals for the week",
            ];
         } else if (
            aiContent.toLowerCase().includes("ingredient") ||
            aiContent.toLowerCase().includes("pantry")
         ) {
            suggestions = [
               "What can I cook with these ingredients?",
               "How should I store these ingredients?",
               "What's a good substitute for this ingredient?",
               "Help me use up leftovers",
            ];
         } else {
            suggestions = [
               "What can I cook tonight?",
               "Suggest a recipe for dinner",
               "Help me meal prep",
               "What's expiring in my pantry?",
            ];
         }

         // If the response mentions specific recipes or ingredients, try to find matching recipes
         if (
            aiContent.toLowerCase().includes("recipe") &&
            userIngredients.length > 0
         ) {
            const ingredientNames = userIngredients.map((ing) => ing.name);
            const canCookRecipes =
               await recipeService.getCanCook(ingredientNames);
            recipes = canCookRecipes.slice(0, 2); // Show up to 2 recipes
         }

         return {
            id: Date.now().toString(),
            type: "ai",
            content: aiContent,
            timestamp: new Date(),
            suggestions,
            recipes,
         };
      } catch (error) {
         console.error("Error calling AI API:", error);

         // Fallback to simulated response if API fails
         return {
            id: Date.now().toString(),
            type: "ai",
            content:
               "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment, or feel free to browse your recipes and pantry in the meantime!",
            timestamp: new Date(),
            suggestions: [
               "Try asking again",
               "Browse my recipes",
               "Check my pantry",
               "View shopping lists",
            ],
         };
      }
   };

   const handleSendMessage = async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text) return;

      // Add user message
      const userMessage: Message = {
         id: Date.now().toString(),
         type: "user",
         content: text,
         timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);

      // Generate AI response
      try {
         const aiResponse = await generateAIResponse(text);
         setMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
         console.error("Error generating AI response:", error);
         const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content:
               "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
            timestamp: new Date(),
         };
         setMessages((prev) => [...prev, errorMessage]);
      } finally {
         setIsTyping(false);
      }
   };

   const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         handleSendMessage();
      }
      // Allow Shift+Enter for new lines (default textarea behavior)
   };

   const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], {
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   return (
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
         {/* Quick Prompts - Show when no messages or just welcome */}
         {messages.length <= 1 && (
            <div className="p-4 bg-gray-50 rounded-t-lg border-b border-border">
               <p className="mb-3 text-sm text-gray-600">
                  Try asking me about:
               </p>
               <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {QUICK_PROMPTS.map((prompt, index) => (
                     <button
                        key={index}
                        onClick={() => handleSendMessage(prompt.text)}
                        className="flex items-center p-2 space-x-2 text-sm text-left bg-white rounded-lg border border-gray-200 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                     >
                        <prompt.icon className="flex-shrink-0 w-4 h-4 text-emerald-600" />
                        <span className="truncate">{prompt.text}</span>
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* Messages Area */}
         <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
               {messages.map((message) => (
                  <div
                     key={message.id}
                     className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                     <div
                        className={`flex max-w-[80%] ${
                           message.type === "user"
                              ? "flex-row-reverse"
                              : "flex-row"
                        } items-start space-x-2`}
                     >
                        {/* Avatar */}
                        <div
                           className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                              message.type === "user"
                                 ? "bg-blue-500 text-white ml-2"
                                 : "bg-emerald-500 text-white mr-2"
                           }`}
                        >
                           {message.type === "user" ? (
                              <User className="w-4 h-4" />
                           ) : (
                              <Bot className="w-4 h-4" />
                           )}
                        </div>

                        {/* Message Content */}
                        <div
                           className={`rounded-lg px-4 py-2 ${
                              message.type === "user"
                                 ? "bg-blue-500 text-white"
                                 : "bg-white border border-gray-200 text-gray-900"
                           }`}
                        >
                           <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                           </p>

                           {/* Recipe Cards */}
                           {message.recipes && message.recipes.length > 0 && (
                              <div className="mt-3 space-y-2">
                                 {message.recipes.map((recipe) => (
                                    <div
                                       key={recipe.id}
                                       className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                       <div className="flex items-center space-x-3">
                                          <img
                                             src={
                                                recipe.image_url ||
                                                "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                                             }
                                             alt={recipe.title}
                                             className="object-cover flex-shrink-0 w-12 h-12 rounded-lg"
                                          />
                                          <div className="flex-1 min-w-0">
                                             <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {recipe.title}
                                             </h4>
                                             <p className="text-xs text-gray-600 line-clamp-2">
                                                {recipe.description}
                                             </p>
                                             <div className="flex items-center mt-1 space-x-2">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">
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
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           {/* Suggestions */}
                           {message.suggestions &&
                              message.suggestions.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-3">
                                    {message.suggestions.map(
                                       (suggestion, index) => (
                                          <button
                                             key={index}
                                             onClick={() =>
                                                handleSendMessage(suggestion)
                                             }
                                             className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full transition-colors hover:bg-gray-200"
                                          >
                                             {suggestion}
                                          </button>
                                       ),
                                    )}
                                 </div>
                              )}

                           <p className="mt-2 text-xs opacity-70">
                              {formatTime(message.timestamp)}
                           </p>
                        </div>
                     </div>
                  </div>
               ))}

               {/* Typing Indicator */}
               {isTyping && (
                  <div className="flex justify-start">
                     <div className="flex items-start space-x-2">
                        <div className="flex justify-center items-center w-8 h-8 text-white bg-emerald-500 rounded-full">
                           <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-2 bg-white rounded-lg border border-gray-200">
                           <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                 className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                 style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                 className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                 style={{ animationDelay: "0.2s" }}
                              ></div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </ScrollArea>

         {/* Input Area */}
         <div className="p-4 bg-white rounded-b-lg border-t border-border">
            <div className="flex space-x-2">
               <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about recipes, ingredients, or cooking tips..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={1}
                  disabled={isTyping}
               />
               <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4"
               >
                  <Send className="w-4 h-4" />
               </Button>
            </div>
            <p className="mt-2 text-xs text-center text-gray-500">
               Powered by OpenAI GPT-4.1. Press Enter to send, Shift+Enter for
               new line.
            </p>
         </div>
      </div>
   );
}
