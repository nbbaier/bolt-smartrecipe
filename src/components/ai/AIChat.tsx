import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ingredientService, recipeService } from "../../lib/database";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import {
	Send,
	Bot,
	User,
	Sparkles,
	ChefHat,
	Package,
	Clock,
	Lightbulb,
	Heart,
	Utensils,
} from "lucide-react";
import type { Ingredient, Recipe } from "../../types";

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
	const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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
	}, [user]);

	useEffect(() => {
		// Scroll to bottom when new messages are added
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, [messages]);

	const loadUserData = async () => {
		if (!user) return;

		try {
			const [ingredients, recipes] = await Promise.all([
				ingredientService.getAll(user.id),
				recipeService.getAll(),
			]);
			setUserIngredients(ingredients);
			setAvailableRecipes(recipes);
		} catch (error) {
			console.error("Error loading user data:", error);
		}
	};

	const generateAIResponse = async (userMessage: string): Promise<Message> => {
		// Simulate AI processing delay
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

		const lowerMessage = userMessage.toLowerCase();
		let response = "";
		let suggestions: string[] = [];
		let recipes: Recipe[] = [];

		// Recipe suggestions based on pantry
		if (lowerMessage.includes("cook") || lowerMessage.includes("recipe") || lowerMessage.includes("make")) {
			const ingredientNames = userIngredients.map(ing => ing.name);
			const canCookRecipes = await recipeService.getCanCook(ingredientNames);
			
			if (canCookRecipes.length > 0) {
				response = `Great! Based on your current pantry, I found ${canCookRecipes.length} recipes you can make right now. Here are some delicious options:`;
				recipes = canCookRecipes.slice(0, 3);
				suggestions = [
					"Show me more recipes",
					"What about vegetarian options?",
					"I want something quick",
					"Suggest ingredients to buy",
				];
			} else {
				response = `I'd love to help you cook! It looks like you might need to add some ingredients to your pantry first. Would you like me to suggest some essential ingredients to get started?`;
				suggestions = [
					"Suggest essential ingredients",
					"Show me simple recipes",
					"Help me plan a grocery trip",
				];
			}
		}
		// Expiring ingredients
		else if (lowerMessage.includes("expir") || lowerMessage.includes("spoil") || lowerMessage.includes("old")) {
			const expiringItems = await ingredientService.getExpiringSoon(user!.id, 7);
			
			if (expiringItems.length > 0) {
				const itemsList = expiringItems.slice(0, 3).map(item => item.name).join(", ");
				response = `You have ${expiringItems.length} items expiring soon: ${itemsList}${expiringItems.length > 3 ? ", and more" : ""}. Let me suggest some recipes to use them up!`;
				
				// Find recipes that use expiring ingredients
				const ingredientNames = userIngredients.map(ing => ing.name);
				const canCookRecipes = await recipeService.getCanCook(ingredientNames);
				recipes = canCookRecipes.slice(0, 2);
				
				suggestions = [
					"Show recipes using these ingredients",
					"How to store them longer?",
					"What else is expiring?",
				];
			} else {
				response = `Good news! Nothing in your pantry is expiring soon. Your ingredients are fresh and ready to use!`;
				suggestions = [
					"What can I cook tonight?",
					"Suggest new recipes to try",
					"Help me meal prep",
				];
			}
		}
		// Healthy meal suggestions
		else if (lowerMessage.includes("healthy") || lowerMessage.includes("nutrition") || lowerMessage.includes("diet")) {
			const healthyRecipes = availableRecipes.filter(recipe => 
				recipe.description.toLowerCase().includes("healthy") ||
				recipe.description.toLowerCase().includes("fresh") ||
				recipe.title.toLowerCase().includes("salad") ||
				recipe.cuisine_type === "Mediterranean"
			);
			
			response = `Here are some healthy meal ideas that focus on fresh ingredients and balanced nutrition:`;
			recipes = healthyRecipes.slice(0, 3);
			suggestions = [
				"Show vegetarian options",
				"Low-carb meal ideas",
				"High-protein recipes",
				"Mediterranean cuisine",
			];
		}
		// Quick recipes
		else if (lowerMessage.includes("quick") || lowerMessage.includes("fast") || lowerMessage.includes("15") || lowerMessage.includes("30")) {
			const quickRecipes = availableRecipes.filter(recipe => 
				(recipe.prep_time + recipe.cook_time) <= 30
			);
			
			response = `Perfect for a busy day! Here are some quick recipes that take 30 minutes or less:`;
			recipes = quickRecipes.slice(0, 3);
			suggestions = [
				"Even faster options",
				"One-pot meals",
				"No-cook recipes",
				"Meal prep ideas",
			];
		}
		// Comfort food
		else if (lowerMessage.includes("comfort") || lowerMessage.includes("cozy") || lowerMessage.includes("warm")) {
			const comfortRecipes = availableRecipes.filter(recipe => 
				recipe.description.toLowerCase().includes("hearty") ||
				recipe.description.toLowerCase().includes("comfort") ||
				recipe.cuisine_type === "American" ||
				recipe.title.toLowerCase().includes("soup")
			);
			
			response = `Nothing beats comfort food! Here are some cozy, heartwarming recipes to make you feel at home:`;
			recipes = comfortRecipes.slice(0, 3);
			suggestions = [
				"Soup recipes",
				"Pasta dishes",
				"Baked goods",
				"Winter warmers",
			];
		}
		// Meal planning
		else if (lowerMessage.includes("plan") || lowerMessage.includes("prep") || lowerMessage.includes("week")) {
			response = `Meal planning is a great way to save time and reduce food waste! Here's how I can help you plan your week:

• **Monday-Wednesday**: Start with fresh ingredients
• **Thursday-Friday**: Use up items that expire soon  
• **Weekend**: Try new recipes or batch cook

Would you like me to suggest a specific meal plan based on your pantry?`;
			suggestions = [
				"Create a 7-day meal plan",
				"Batch cooking ideas",
				"Shopping list for the week",
				"Prep-ahead recipes",
			];
		}
		// Default response
		else {
			const responses = [
				`I'm here to help with all your cooking needs! I can suggest recipes based on your pantry, help you plan meals, or answer cooking questions.`,
				`Let me help you discover delicious recipes! I can find dishes you can make with your current ingredients or suggest new ones to try.`,
				`Cooking should be fun and stress-free! Tell me what you're in the mood for, and I'll help you find the perfect recipe.`,
			];
			response = responses[Math.floor(Math.random() * responses.length)];
			suggestions = [
				"What can I cook with my ingredients?",
				"Suggest a recipe for dinner",
				"Help me use up leftovers",
				"Plan meals for this week",
			];
		}

		return {
			id: Date.now().toString(),
			type: "ai",
			content: response,
			timestamp: new Date(),
			suggestions,
			recipes,
		};
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

		setMessages(prev => [...prev, userMessage]);
		setInputValue("");
		setIsTyping(true);

		// Generate AI response
		try {
			const aiResponse = await generateAIResponse(text);
			setMessages(prev => [...prev, aiResponse]);
		} catch (error) {
			console.error("Error generating AI response:", error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: "ai",
				content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
				timestamp: new Date(),
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsTyping(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
			{/* Chat Header */}
			<div className="flex items-center space-x-3 p-4 border-b border-border bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-t-lg">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
					<Bot className="h-5 w-5 text-white" />
				</div>
				<div>
					<h2 className="font-semibold text-gray-900">AI Cooking Assistant</h2>
					<p className="text-sm text-gray-600">
						{isTyping ? "Thinking..." : "Ready to help with recipes and cooking tips"}
					</p>
				</div>
				<div className="ml-auto">
					<Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
						<Sparkles className="h-3 w-3 mr-1" />
						AI Powered
					</Badge>
				</div>
			</div>

			{/* Quick Prompts - Show when no messages or just welcome */}
			{messages.length <= 1 && (
				<div className="p-4 border-b border-border bg-gray-50">
					<p className="text-sm text-gray-600 mb-3">Try asking me about:</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{QUICK_PROMPTS.map((prompt, index) => (
							<button
								key={index}
								onClick={() => handleSendMessage(prompt.text)}
								className="flex items-center space-x-2 p-2 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
							>
								<prompt.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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
									message.type === "user" ? "flex-row-reverse" : "flex-row"
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
										<User className="h-4 w-4" />
									) : (
										<Bot className="h-4 w-4" />
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
													className="bg-gray-50 border border-gray-200 rounded-lg p-3"
												>
													<div className="flex items-center space-x-3">
														<img
															src={recipe.image_url || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"}
															alt={recipe.title}
															className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
														/>
														<div className="flex-1 min-w-0">
															<h4 className="font-medium text-gray-900 text-sm truncate">
																{recipe.title}
															</h4>
															<p className="text-xs text-gray-600 line-clamp-2">
																{recipe.description}
															</p>
															<div className="flex items-center space-x-2 mt-1">
																<Clock className="h-3 w-3 text-gray-400" />
																<span className="text-xs text-gray-500">
																	{recipe.prep_time + recipe.cook_time} min
																</span>
																<Badge variant="outline" className="text-xs">
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
									{message.suggestions && message.suggestions.length > 0 && (
										<div className="mt-3 flex flex-wrap gap-1">
											{message.suggestions.map((suggestion, index) => (
												<button
													key={index}
													onClick={() => handleSendMessage(suggestion)}
													className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
												>
													{suggestion}
												</button>
											))}
										</div>
									)}

									<p className="text-xs opacity-70 mt-2">
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
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
									<Bot className="h-4 w-4" />
								</div>
								<div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
									<div className="flex space-x-1">
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
										<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Input Area */}
			<div className="p-4 border-t border-border bg-white rounded-b-lg">
				<div className="flex space-x-2">
					<Input
						ref={inputRef}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Ask me about recipes, ingredients, or cooking tips..."
						className="flex-1"
						disabled={isTyping}
					/>
					<Button
						onClick={() => handleSendMessage()}
						disabled={!inputValue.trim() || isTyping}
						className="px-4"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
				<p className="text-xs text-gray-500 mt-2 text-center">
					AI responses are simulated for demonstration. Ask about recipes, ingredients, or cooking tips!
				</p>
			</div>
		</div>
	);
}