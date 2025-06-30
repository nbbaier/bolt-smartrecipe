import { ChefHat, Sparkles } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const features = [
  {
    title: "Smart Recipe Suggestions",
    description:
      "Get personalized recipe ideas based on your pantry and preferences.",
  },
  {
    title: "Pantry Management",
    description: "Track what you have, what's expiring, and reduce food waste.",
  },
  {
    title: "Shopping Lists",
    description: "Easily create, manage, and share shopping lists.",
  },
  {
    title: "AI Chat Assistant",
    description: "Ask anything about recipes, ingredients, or meal planning.",
  },
  {
    title: "Food Waste Reduction",
    description: "Use leftovers and optimize your grocery spending.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex flex-col items-center py-8 w-full bg-gradient-to-b from-green-100 to-white">
        <div className="flex relative justify-center items-center mb-4 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
          <ChefHat className="w-8 h-8 text-white" />
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-pulse" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-green-800">
          Appetite: Smarter Cooking, Less Waste
        </h1>
        <p className="mb-6 max-w-xl text-lg text-center text-gray-700">
          Discover delicious recipes, manage your pantry, and reduce food waste
          with AI-powered assistance.
        </p>
        <Button className="px-8 py-3 text-lg" asChild>
          <a href="/signup">Get Started</a>
        </Button>
        <a
          href="/signin"
          className="mt-2 text-sm text-emerald-700 hover:underline"
        >
          Already have an account? Sign in
        </a>
      </header>

      <main className="flex flex-col flex-1 items-center px-4">
        <section className="mt-12 mb-8 w-full max-w-4xl">
          <h2 className="mb-6 text-2xl font-semibold text-center">Features</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="flex flex-col items-start p-6"
              >
                <Badge className="mb-2">{feature.title}</Badge>
                <div className="text-base text-gray-800">
                  {feature.description}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center py-6 mt-auto w-full bg-gray-100">
        <div className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Appetite. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
