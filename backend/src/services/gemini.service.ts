import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
let genAI: any = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("WARNING: GEMINI_API_KEY is not set. Using local mock generator for AI responses.");
}

export interface GeneratedItinerary {
  title: string;
  destination: string;
  totalBudgetEstimate: number;
  budgetBreakdown: {
    accommodation: number;
    food: number;
    transport: number;
    shopping: number;
    activities: number;
    emergency: number;
  };
  hotels: Array<{
    name: string;
    rating: number;
    pricePerNight: number;
    address: string;
  }>;
  packingList: Array<{
    name: string;
    category: string; // Clothing, Gear, Medical, Toiletries, Documents
    required: boolean;
  }>;
  days: Array<{
    dayNumber: number;
    weatherSummary: string;
    activities: Array<{
      timeSlot: string; // Morning, Afternoon, Evening, Night
      title: string;
      description: string;
      locationName: string;
      estimatedCost: number;
      durationMin: number;
      isWeatherSensitive: boolean;
      isHiddenGem: boolean;
    }>;
    restaurants: Array<{
      timeSlot: string;
      name: string;
      cuisine: string;
      description: string;
      estimatedCost: number;
      isHiddenGem: boolean;
    }>;
  }>;
}

export class GeminiService {
  /**
   * Generates a complete trip itinerary based on user preferences.
   */
  static async generateTrip(params: {
    destination: string;
    budgetLimit: number;
    startDate: string;
    endDate: string;
    travelStyle: string;
    interests: string;
    foodPreference: string;
    travelerCount: number;
  }): Promise<GeneratedItinerary> {
    const prompt = `
      You are an expert travel planner. Create a highly optimized, detailed travel itinerary for:
      Destination: ${params.destination}
      Budget Limit: $${params.budgetLimit} USD
      Start Date: ${params.startDate}
      End Date: ${params.endDate}
      Travel Style: ${params.travelStyle} (e.g. Solo, Couple, Family, Backpacker, Nomad, Business, Adventure, Luxury)
      Interests: ${params.interests} (e.g. historical, nature, nightlife, photography)
      Food Preferences: ${params.foodPreference}
      Number of Travelers: ${params.travelerCount}

      Generate the response STRICTLY as a JSON object matching this structure:
      {
        "title": "Short catchy title for the trip",
        "destination": "${params.destination}",
        "totalBudgetEstimate": 1200,
        "budgetBreakdown": {
          "accommodation": 400,
          "food": 300,
          "transport": 200,
          "shopping": 100,
          "activities": 100,
          "emergency": 100
        },
        "hotels": [
          { "name": "Hotel Name", "rating": 4.5, "pricePerNight": 100, "address": "Address info" }
        ],
        "packingList": [
          { "name": "Passport", "category": "Documents", "required": true },
          { "name": "Rain jacket", "category": "Clothing", "required": true }
        ],
        "days": [
          {
            "dayNumber": 1,
            "weatherSummary": "Sunny and clear",
            "activities": [
              {
                "timeSlot": "Morning",
                "title": "Visit Landmark",
                "description": "Short description of the activity...",
                "locationName": "Landmark Name",
                "estimatedCost": 15.0,
                "durationMin": 120,
                "isWeatherSensitive": true,
                "isHiddenGem": false
              }
            ],
            "restaurants": [
              {
                "timeSlot": "Afternoon",
                "name": "Local Cafe",
                "cuisine": "Traditional",
                "description": "Sells local foods and street style delicacies...",
                "estimatedCost": 20.0,
                "isHiddenGem": true
              }
            ]
          }
        ]
      }

      Provide exactly one activity and one restaurant suggestion per day-level timeSlot (Morning, Afternoon, Evening, Night).
      Make sure to flag some unique local cafes, street food, viewpoints, or less crowded attractions as "isHiddenGem": true.
      All costs must be in USD. Keep total budget estimate within the $${params.budgetLimit} budget limit.
    `;

    if (!genAI) {
      return this.generateMockTrip(params);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const responseText = result.response.text();
      return JSON.parse(responseText) as GeneratedItinerary;
    } catch (error) {
      console.error("Gemini API Error, falling back to mock:", error);
      return this.generateMockTrip(params);
    }
  }

  /**
   * Adapts an itinerary due to weather shifts. Replaces outdoor weather-sensitive activities with indoor backups.
   */
  static async adaptForWeather(
    dayNumber: number,
    currentActivities: any[],
    weatherCondition: string
  ): Promise<any[]> {
    const prompt = `
      The travel itinerary day ${dayNumber} is experiencing bad weather: "${weatherCondition}".
      Here are the current activities planned for the day:
      ${JSON.stringify(currentActivities)}

      Please modify this activity list. For any activity where "isWeatherSensitive" is true, replace it with a suitable indoor alternative. 
      Keep the timeSlot, estimatedCost, durationMin, and locations equivalent but suited for indoor/rainy/sheltered experiences (e.g. museums, indoor markets, cooking classes, underground tours).
      Set "isWeatherSensitive" to false on the replacements and explain the replacement reason in the description.

      Return the complete updated array of activities in the EXACT same JSON structure.
    `;

    if (!genAI) {
      return currentActivities.map(act => {
        if (act.isWeatherSensitive) {
          return {
            ...act,
            title: `[Indoor Backup] ${act.title} Alternative`,
            description: `Weather adapted due to ${weatherCondition}. Enjoy a warm indoor cultural experience instead.`,
            isWeatherSensitive: false,
          };
        }
        return act;
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });

      return JSON.parse(result.response.text());
    } catch (e) {
      console.error("Gemini weather adaptation failed, using mock rules:", e);
      return currentActivities.map(act => {
        if (act.isWeatherSensitive) {
          return {
            ...act,
            title: `[Indoor Backup] ${act.title} Alternative`,
            description: `Weather adapted due to ${weatherCondition}. Enjoy a warm indoor cultural experience instead.`,
            isWeatherSensitive: false,
          };
        }
        return act;
      });
    }
  }

  /**
   * Chat Assistant response based on active itinerary.
   */
  static async getChatResponse(
    userId: string,
    message: string,
    tripContext?: any,
    chatHistory: any[] = []
  ): Promise<string> {
    const formattedHistory = chatHistory
      .slice(-6)
      .map(ch => `User: ${ch.message}\nAssistant: ${ch.response}`)
      .join("\n");

    const tripContextStr = tripContext
      ? `Active Trip Context: Destination ${tripContext.destination}, Budget Limit: $${tripContext.budgetLimit}, Style: ${tripContext.travelStyle}.`
      : "No active trip selected.";

    const prompt = `
      You are an expert travel assistant. You help travelers plan, navigate, and discover secret spots, restaurants, emergency support, and avoid scams.
      ${tripContextStr}
      
      Chat History:
      ${formattedHistory}
      
      User's message: "${message}"
      
      Respond concisely and styled nicely. If the user asks about activities under ₹1000 or $12, or local scams, or hidden gems, provide highly authentic and detailed localized recommendations.
    `;

    if (!genAI) {
      return `[AI Demo Response] Based on your trip to ${tripContext?.destination || "your destination"}, I suggest visiting a local food market for street food. They offer authentic dishes for under $10, which is perfect for your budget! Feel free to ask more.`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini chat error:", error);
      return "I'm having a little trouble connecting to my AI brain, but I'd suggest checking out local downtown areas for hidden cafes and street food!";
    }
  }

  private static generateMockTrip(params: any): GeneratedItinerary {
    const duration = Math.max(1, Math.floor((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const mockDays: any[] = [];

    const mockActivities = [
      {
        Morning: { title: "Explore Historic Old Town", desc: "Walk through ancient stone streets and explore heritage structures.", loc: "Old Quarter", cost: 0, sens: true, gem: false },
        Afternoon: { title: "Local Museum Tour", desc: "Browse exhibits showcasing local craftsmanship and evolution.", loc: "National Museum", cost: 10, sens: false, gem: false },
        Evening: { title: "Secret Panoramic Sunset Viewpoint", desc: "A lesser-known rooftop/hilltop offering views of the city skyline.", loc: "Skyview Point", cost: 5, sens: true, gem: true },
        Night: { title: "Hidden Jazz Club", desc: "Relax with local music in a basement lounge tucked behind an unmarked door.", loc: "The Cellar Lounge", cost: 20, sens: false, gem: true }
      },
      {
        Morning: { title: "Botanical Gardens Walk", desc: "Enjoy a peaceful stroll around exotic greenhouse collections.", loc: "Green Oasis Gardens", cost: 5, sens: true, gem: false },
        Afternoon: { title: "Street Food Cooking Workshop", desc: "Learn to cook authentic traditional meals with a resident chef.", loc: "Chef's Kitchen Studio", cost: 30, sens: false, gem: true },
        Evening: { title: "Riverside Sunset Cruise", desc: "A cozy boat cruise during golden hour along the city river.", loc: "River Harbor Marina", cost: 25, sens: true, gem: false },
        Night: { title: "Night Market Crawl", desc: "Experience the sights and sounds of the bustling local street market.", loc: "Central Night Market", cost: 15, sens: true, gem: false }
      }
    ];

    const mockCuisines = ["Traditional Grill", "Street Food Stall", "Vegan Fusion", "Artisan Bakery", "Local Seafood"];

    for (let i = 1; i <= duration; i++) {
      const actPool = mockActivities[(i - 1) % mockActivities.length];
      mockDays.push({
        dayNumber: i,
        weatherSummary: i % 3 === 0 ? "Partly Cloudy" : "Sunny & Warm",
        activities: Object.entries(actPool).map(([slot, details]) => ({
          timeSlot: slot,
          title: details.title,
          description: details.desc,
          locationName: details.loc,
          estimatedCost: details.cost,
          durationMin: slot === "Morning" || slot === "Afternoon" ? 120 : 90,
          isWeatherSensitive: details.sens,
          isHiddenGem: details.gem
        })),
        restaurants: [
          {
            timeSlot: "Afternoon",
            name: `La ${params.destination} Table`,
            cuisine: mockCuisines[i % mockCuisines.length],
            description: "Cozy local eatery serving fresh farm-to-table dishes.",
            estimatedCost: 15,
            isHiddenGem: i % 2 === 0
          },
          {
            timeSlot: "Evening",
            name: "The Lantern Terrace",
            cuisine: "Modern Fusion",
            description: "Rooftop dining experience overlooking the historic district.",
            estimatedCost: 25,
            isHiddenGem: i % 3 === 0
          }
        ]
      });
    }

    return {
      title: `Charming Escape to ${params.destination}`,
      destination: params.destination,
      totalBudgetEstimate: Math.round(params.budgetLimit * 0.85),
      budgetBreakdown: {
        accommodation: Math.round(params.budgetLimit * 0.35),
        food: Math.round(params.budgetLimit * 0.25),
        transport: Math.round(params.budgetLimit * 0.15),
        shopping: Math.round(params.budgetLimit * 0.05),
        activities: Math.round(params.budgetLimit * 0.10),
        emergency: Math.round(params.budgetLimit * 0.10)
      },
      hotels: [
        { name: "Urban Oasis Boutique Hotel", rating: 4.7, pricePerNight: 85, address: "12 Greenway Blvd, Downtown" },
        { name: "The Heritage Inn & Suites", rating: 4.5, pricePerNight: 120, address: "78 Cobblestone St" }
      ],
      packingList: [
        { name: "Universal Travel Adapter", category: "Gear", required: true },
        { name: "Comfortable Walking Shoes", category: "Clothing", required: true },
        { name: "Local Currency / Cards", category: "Documents", required: true },
        { name: "Basic First-Aid Kit & Prescriptions", category: "Medical", required: true },
        { name: "Reusable Water Bottle", category: "Gear", required: false }
      ],
      days: mockDays
    };
  }
}
