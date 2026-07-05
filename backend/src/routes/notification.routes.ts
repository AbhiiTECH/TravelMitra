import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", NotificationController.getAll);
router.put("/:id/read", NotificationController.markAsRead);

export default router;
