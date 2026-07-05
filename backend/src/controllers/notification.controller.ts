import { Response } from "express";
import prisma from "../db";

export class NotificationController {
  /**
   * Retrieves all notifications for the user.
   */
  static async getAll(req: any, res: Response): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
      });
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to retrieve notifications." });
    }
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        res.status(404).json({ error: "Notification not found." });
        return;
      }

      if (notification.userId !== req.user.id) {
        res.status(403).json({ error: "Access denied." });
        return;
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.json({ message: "Notification marked as read.", notification: updated });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to update notification status." });
    }
  }
}
