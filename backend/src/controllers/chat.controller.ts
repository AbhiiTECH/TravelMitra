import { Response } from "express";
import prisma from "../db";
import { GeminiService } from "../services/gemini.service";

export class ChatController {
  /**
   * Handles user chat messages, retrieves context from active trips and chat history, and asks Gemini.
   */
  static async sendMessage(req: any, res: Response): Promise<void> {
    try {
      const { message, tripId } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required." });
        return;
      }

      // Fetch user's previous 6 chat logs for memory context
      const chatHistory = await prisma.chatHistory.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

      // Reverse history to keep chronological order
      chatHistory.reverse();

      // Fetch active trip context if tripId is provided
      let tripContext: any = null;
      if (tripId) {
        tripContext = await prisma.trip.findUnique({
          where: { id: tripId },
          select: {
            destination: true,
            budgetLimit: true,
            travelStyle: true,
            startDate: true,
            endDate: true,
          },
        });
      }

      // Query Gemini
      const responseText = await GeminiService.getChatResponse(
        req.user.id,
        message,
        tripContext,
        chatHistory
      );

      // Save to chat history database
      const chatLog = await prisma.chatHistory.create({
        data: {
          userId: req.user.id,
          message,
          response: responseText,
        },
      });

      res.status(201).json({ chatLog });
    } catch (error: any) {
      console.error("Chat controller error:", error);
      res.status(500).json({ error: "Failed to process chat message. " + error.message });
    }
  }

  /**
   * Retrieves full chat history for the user.
   */
  static async getHistory(req: any, res: Response): Promise<void> {
    try {
      const history = await prisma.chatHistory.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "asc" },
      });

      res.json({ history });
    } catch (error) {
      console.error("Fetch chat history error:", error);
      res.status(500).json({ error: "Failed to retrieve chat history." });
    }
  }
}
