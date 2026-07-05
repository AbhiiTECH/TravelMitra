import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Route Imports
import authRoutes from "./routes/auth.routes";
import tripRoutes from "./routes/trip.routes";
import chatRoutes from "./routes/chat.routes";
import expenseRoutes from "./routes/expense.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "*" })); // Allow all origins for easier frontend connection
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// 404 Error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected error occurred on the server.",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Travel Planner API running on http://localhost:${PORT}`);
});
