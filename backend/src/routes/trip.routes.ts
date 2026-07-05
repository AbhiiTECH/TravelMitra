import { Router } from "express";
import { TripController } from "../controllers/trip.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/generate", TripController.generate);
router.get("/", TripController.getAll);
router.get("/:id", TripController.getById);
router.delete("/:id", TripController.delete);
router.post("/:id/weather-adapt", TripController.adaptWeather);
router.get("/weather/:destination", TripController.getDestinationWeather);
router.post("/:id/share", TripController.share);
router.post("/:id/vote", TripController.vote);

export default router;
