const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  userIngredients?: string[];
  userPreferences?: {
    dietary_restrictions?: string[];
    allergies?: string[];
    cooking_skill_level?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const { messages, userIngredients, userPreferences }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create system message with context
    let systemContent = `You are a helpful AI cooking assistant for SmartRecipe, a smart recipe management app. You help users with cooking questions, recipe suggestions, and meal planning.

Key capabilities:
- Suggest recipes based on available ingredients
- Provide cooking tips and techniques
- Help with meal planning and preparation
- Answer questions about food storage and safety
- Adapt recipes for dietary restrictions

Guidelines:
- Be friendly, helpful, and encouraging
- Provide practical, actionable advice
- Consider user's skill level and preferences
- Suggest recipes that match available ingredients when possible
- Keep responses concise but informative`;

    // Add user context if available
    if (userIngredients && userIngredients.length > 0) {
      systemContent += `\n\nUser's current pantry ingredients: ${userIngredients.join(", ")}`;
    }

    if (userPreferences) {
      if (userPreferences.dietary_restrictions && userPreferences.dietary_restrictions.length > 0) {
        systemContent += `\nDietary restrictions: ${userPreferences.dietary_restrictions.join(", ")}`;
      }
      if (userPreferences.allergies && userPreferences.allergies.length > 0) {
        systemContent += `\nAllergies: ${userPreferences.allergies.join(", ")}`;
      }
      if (userPreferences.cooking_skill_level) {
        systemContent += `\nCooking skill level: ${userPreferences.cooking_skill_level}`;
      }
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemContent },
      ...messages
    ];

    // Make request to OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    
    // Extract the assistant's response
    const assistantMessage = openaiData.choices?.[0]?.message?.content;
    
    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: openaiData.usage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});