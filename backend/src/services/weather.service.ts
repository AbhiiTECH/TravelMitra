import axios from "axios";

export interface WeatherForecast {
  tempCelsius: number;
  condition: string; // Sunny, Rainy, Stormy, Cloudy, etc.
  description: string;
  humidity: number;
  windSpeed: number;
}

export class WeatherService {
  private static apiKey = process.env.OPENWEATHER_API_KEY || "";

  /**
   * Fetches weather forecast for a destination.
   */
  static async getForecast(destination: string): Promise<WeatherForecast> {
    if (!this.apiKey) {
      return this.generateSimulatedWeather(destination);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        destination
      )}&appid=${this.apiKey}&units=metric`;
      const response = await axios.get(url);
      const data = response.data;

      return {
        tempCelsius: Math.round(data.main.temp),
        condition: data.weather[0].main, // E.g., Rain, Clear, Clouds, Thunderstorm
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    } catch (error) {
      console.error("OpenWeather API error, falling back to simulation:", error);
      return this.generateSimulatedWeather(destination);
    }
  }

  /**
   * Generates realistic simulated weather based on destination name.
   */
  private static generateSimulatedWeather(destination: string): WeatherForecast {
    const dest = destination.toLowerCase();
    
    if (dest.includes("london") || dest.includes("seattle") || dest.includes("rain")) {
      return {
        tempCelsius: 14,
        condition: "Rain",
        description: "moderate rain showers",
        humidity: 85,
        windSpeed: 5.2,
      };
    } else if (dest.includes("tokyo") || dest.includes("paris") || dest.includes("ny") || dest.includes("york")) {
      return {
        tempCelsius: 19,
        condition: "Clouds",
        description: "broken clouds",
        humidity: 60,
        windSpeed: 3.1,
      };
    } else if (dest.includes("bali") || dest.includes("maldives") || dest.includes("goa") || dest.includes("miami")) {
      return {
        tempCelsius: 30,
        condition: "Clear",
        description: "bright sunny skies",
        humidity: 70,
        windSpeed: 2.5,
      };
    } else {
      // Default nice weather
      return {
        tempCelsius: 22,
        condition: "Clear",
        description: "clear sky",
        humidity: 50,
        windSpeed: 1.8,
      };
    }
  }
}
