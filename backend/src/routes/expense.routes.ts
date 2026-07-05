import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/:tripId", ExpenseController.create);
router.get("/:tripId", ExpenseController.getByTrip);
router.get("/:tripId/summary", ExpenseController.getSummary);

export default router;
