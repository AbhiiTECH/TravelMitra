import { Response } from "express";
import prisma from "../db";
import { GeminiService } from "../services/gemini.service";
import { WeatherService } from "../services/weather.service";

export class TripController {
  /**
   * Generates a new trip itinerary via AI and stores it in the database.
   */
  static async generate(req: any, res: Response): Promise<void> {
    try {
      const {
        destination,
        budgetLimit,
        startDate,
        endDate,
        travelStyle,
        interests,
        foodPreference,
        travelerCount,
      } = req.body;

      if (!destination || !budgetLimit || !startDate || !endDate || !travelStyle) {
        res.status(400).json({ error: "Missing required trip parameter fields." });
        return;
      }

      // Generate trip using Gemini service
      const aiResponse = await GeminiService.generateTrip({
        destination,
        budgetLimit: parseFloat(budgetLimit),
        startDate,
        endDate,
        travelStyle,
        interests: interests || "sightseeing",
        foodPreference: foodPreference || "any",
        travelerCount: parseInt(travelerCount) || 1,
      });

      // Save to database
      const trip = await prisma.trip.create({
        data: {
          title: aiResponse.title,
          destination: aiResponse.destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budgetLimit: parseFloat(budgetLimit),
          travelStyle,
          interests: interests || "sightseeing",
          foodPreference: foodPreference || "any",
          travelerCount: parseInt(travelerCount) || 1,
          organizerId: req.user.id,
          packingItems: {
            create: aiResponse.packingList.map(item => ({
              name: item.name,
              category: item.category,
              isRequired: item.required,
              isChecked: false,
            })),
          },
          itineraryDays: {
            create: aiResponse.days.map(day => ({
              dayNumber: day.dayNumber,
              date: new Date(new Date(startDate).getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000),
              weatherSummary: day.weatherSummary,
              activities: {
                create: day.activities.map(act => ({
                  timeSlot: act.timeSlot,
                  title: act.title,
                  description: act.description,
                  locationName: act.locationName,
                  estimatedCost: act.estimatedCost,
                  durationMin: act.durationMin,
                  isWeatherSensitive: act.isWeatherSensitive,
                  isHiddenGem: act.isHiddenGem,
                })),
              },
              restaurants: {
                create: day.restaurants.map(rest => ({
                  timeSlot: rest.timeSlot,
                  name: rest.name,
                  cuisine: rest.cuisine,
                  description: rest.description,
                  estimatedCost: rest.estimatedCost,
                  isHiddenGem: rest.isHiddenGem,
                })),
              },
            })),
          },
        },
        include: {
          itineraryDays: {
            include: {
              activities: true,
              restaurants: true,
            },
          },
          packingItems: true,
        },
      });

      res.status(201).json({ message: "Trip generated successfully.", trip });
    } catch (error: any) {
      console.error("Trip generation controller error:", error);
      res.status(500).json({ error: "Failed to generate trip itinerary. " + error.message });
    }
  }

  /**
   * Retrieves all trips associated with the authenticated user.
   */
  static async getAll(req: any, res: Response): Promise<void> {
    try {
      const trips = await prisma.trip.findMany({
        where: {
          OR: [
            { organizerId: req.user.id },
            { sharedWith: { some: { userId: req.user.id } } },
          ],
        },
        orderBy: { startDate: "asc" },
      });

      res.json({ trips });
    } catch (error) {
      console.error("Fetch all trips error:", error);
      res.status(500).json({ error: "Failed to retrieve trips." });
    }
  }

  /**
   * Retrieves full details for a single trip.
   */
  static async getById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
          itineraryDays: {
            orderBy: { dayNumber: "asc" },
            include: {
              activities: true,
              restaurants: true,
            },
          },
          packingItems: true,
          expenses: {
            include: {
              payer: { select: { name: true, email: true } },
            },
          },
          sharedWith: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!trip) {
        res.status(404).json({ error: "Trip not found." });
        return;
      }

      // Authorization check
      const isOrganizer = trip.organizerId === req.user.id;
      const isShared = trip.sharedWith.some(shared => shared.userId === req.user.id);

      if (!isOrganizer && !isShared) {
        res.status(403).json({ error: "Access denied to this trip." });
        return;
      }

      res.json({ trip });
    } catch (error) {
      console.error("Fetch trip by id error:", error);
      res.status(500).json({ error: "Failed to retrieve trip details." });
    }
  }

  /**
   * Deletes a trip.
   */
  static async delete(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const trip = await prisma.trip.findUnique({ where: { id } });

      if (!trip) {
        res.status(404).json({ error: "Trip not found." });
        return;
      }

      if (trip.organizerId !== req.user.id) {
        res.status(403).json({ error: "Only the organizer can delete this trip." });
        return;
      }

      await prisma.trip.delete({ where: { id } });
      res.json({ message: "Trip deleted successfully." });
    } catch (error) {
      console.error("Delete trip error:", error);
      res.status(500).json({ error: "Failed to delete trip." });
    }
  }

  /**
   * Adapts outdoor activities for a specific day due to weather shifts.
   */
  static async adaptWeather(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { dayNumber, condition } = req.body; // e.g. dayNumber: 1, condition: "Heavy Rain"

      if (!dayNumber || !condition) {
        res.status(400).json({ error: "dayNumber and condition are required." });
        return;
      }

      const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
          itineraryDays: {
            where: { dayNumber: parseInt(dayNumber) },
            include: { activities: true },
          },
        },
      });

      if (!trip || trip.itineraryDays.length === 0) {
        res.status(404).json({ error: "Trip day not found." });
        return;
      }

      const day = trip.itineraryDays[0];
      const activities = day.activities;

      // Adapt activities via Gemini Service
      const adaptedActivities = await GeminiService.adaptForWeather(
        day.dayNumber,
        activities,
        condition
      );

      // Delete old activities for the day and write the new adapted activities
      await prisma.activity.deleteMany({
        where: { dayId: day.id },
      });

      const updatedDay = await prisma.itineraryDay.update({
        where: { id: day.id },
        data: {
          weatherSummary: `Adapted: ${condition}`,
          activities: {
            create: adaptedActivities.map((act: any) => ({
              timeSlot: act.timeSlot,
              title: act.title,
              description: act.description,
              locationName: act.locationName,
              estimatedCost: act.estimatedCost || 0,
              durationMin: act.durationMin || 60,
              isWeatherSensitive: act.isWeatherSensitive || false,
              isHiddenGem: act.isHiddenGem || false,
              isIndoorBackup: true,
            })),
          },
        },
        include: {
          activities: true,
          restaurants: true,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          tripId: trip.id,
          type: "WeatherAlert",
          message: `Weather change (${condition}) detected for day ${dayNumber}! Activities adjusted to indoor options automatically.`,
        },
      });

      res.json({
        message: `Itinerary adapted for day ${dayNumber} weather: ${condition}.`,
        updatedDay,
      });
    } catch (error) {
      console.error("Adapt weather error:", error);
      res.status(500).json({ error: "Failed to adapt itinerary for weather." });
    }
  }

  /**
   * Fetches destination weather forecast.
   */
  static async getDestinationWeather(req: any, res: Response): Promise<void> {
    try {
      const { destination } = req.params;
      const forecast = await WeatherService.getForecast(destination);
      res.json({ forecast });
    } catch (error) {
      console.error("Weather controller error:", error);
      res.status(500).json({ error: "Failed to fetch weather forecast." });
    }
  }

  /**
   * Share trip with a friend by email.
   */
  static async share(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, role } = req.body; // role: "Viewer" or "Editor"

      if (!email) {
        res.status(400).json({ error: "Email is required to share." });
        return;
      }

      // Check if user exists
      const userToShare = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToShare) {
        res.status(404).json({ error: "User with this email not found." });
        return;
      }

      // Check if already shared
      const existingShare = await prisma.sharedTrip.findFirst({
        where: {
          tripId: id,
          userId: userToShare.id,
        },
      });

      if (existingShare) {
        res.status(400).json({ error: "Trip is already shared with this user." });
        return;
      }

      const sharedTrip = await prisma.sharedTrip.create({
        data: {
          tripId: id,
          userId: userToShare.id,
          role: role || "Viewer",
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      // Create notification for shared user
      await prisma.notification.create({
        data: {
          userId: userToShare.id,
          tripId: id,
          type: "GroupUpdate",
          message: `${req.user.name} shared a trip with you.`,
        },
      });

      res.status(201).json({ message: "Trip shared successfully.", sharedTrip });
    } catch (error) {
      console.error("Share trip error:", error);
      res.status(500).json({ error: "Failed to share trip." });
    }
  }

  /**
   * Vote on a hotel or activity.
   */
  static async vote(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params; // tripId
      const { itemType, itemId, voteValue } = req.body; // itemType: "Hotel" | "Activity", itemId: string, voteValue: 1 | -1

      if (!itemType || !itemId || voteValue === undefined) {
        res.status(400).json({ error: "itemType, itemId, and voteValue are required." });
        return;
      }

      // Check or update vote
      const existingVote = await prisma.vote.findFirst({
        where: {
          tripId: id,
          userId: req.user.id,
          itemType,
          itemId,
        },
      });

      let vote;
      if (existingVote) {
        vote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { voteValue },
        });
      } else {
        vote = await prisma.vote.create({
          data: {
            tripId: id,
            userId: req.user.id,
            itemType,
            itemId,
            voteValue,
          },
        });
      }

      res.json({ message: "Vote registered successfully.", vote });
    } catch (error) {
      console.error("Register vote error:", error);
      res.status(500).json({ error: "Failed to register vote." });
    }
  }
}
