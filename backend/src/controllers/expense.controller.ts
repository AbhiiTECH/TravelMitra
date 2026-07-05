import { Response } from "express";
import prisma from "../db";

export class ExpenseController {
  /**
   * Adds a new expense to a trip.
   */
  static async create(req: any, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const { amount, category, description, currency } = req.body;

      if (!amount || !category || !description) {
        res.status(400).json({ error: "Amount, category, and description are required." });
        return;
      }

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { expenses: true },
      });

      if (!trip) {
        res.status(404).json({ error: "Trip not found." });
        return;
      }

      const expense = await prisma.expense.create({
        data: {
          tripId,
          payerId: req.user.id,
          amount: parseFloat(amount),
          category,
          description,
          currency: currency || "USD",
        },
        include: {
          payer: { select: { name: true, email: true } },
        },
      });

      // Calculate total spending so far
      const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0) + parseFloat(amount);

      // Create budget alert notification if total spending exceeds limit
      if (totalSpent > trip.budgetLimit) {
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            tripId: trip.id,
            type: "BudgetAlert",
            message: `Budget warning! Total spending ($${totalSpent.toFixed(2)}) has exceeded your trip budget limit ($${trip.budgetLimit.toFixed(2)}).`,
          },
        });
      }

      res.status(201).json({ message: "Expense added successfully.", expense });
    } catch (error) {
      console.error("Create expense error:", error);
      res.status(500).json({ error: "Failed to add expense." });
    }
  }

  /**
   * Retrieves all expenses for a specific trip.
   */
  static async getByTrip(req: any, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;

      const expenses = await prisma.expense.findMany({
        where: { tripId },
        include: {
          payer: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
      });

      res.json({ expenses });
    } catch (error) {
      console.error("Get expenses error:", error);
      res.status(500).json({ error: "Failed to retrieve expenses." });
    }
  }

  /**
   * Generates summary statistics and charts data for dashboard presentation.
   */
  static async getSummary(req: any, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          expenses: true,
        },
      });

      if (!trip) {
        res.status(404).json({ error: "Trip not found." });
        return;
      }

      const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Category breakdown
      const categories = [
        "Accommodation",
        "Food",
        "Transport",
        "Shopping",
        "Activities",
        "Emergency",
      ];
      const breakdown = categories.map(cat => {
        const spent = trip.expenses
          .filter(exp => exp.category.toLowerCase() === cat.toLowerCase())
          .reduce((sum, exp) => sum + exp.amount, 0);
        return { category: cat, spent };
      });

      // Split summary (bill splitting among travelers)
      const travelerCount = trip.travelerCount || 1;
      const costPerPerson = totalSpent / travelerCount;

      res.json({
        totalSpent,
        budgetLimit: trip.budgetLimit,
        remainingBudget: Math.max(0, trip.budgetLimit - totalSpent),
        costPerPerson,
        categoryBreakdown: breakdown,
      });
    } catch (error) {
      console.error("Get expense summary error:", error);
      res.status(500).json({ error: "Failed to generate expense summary." });
    }
  }
}
