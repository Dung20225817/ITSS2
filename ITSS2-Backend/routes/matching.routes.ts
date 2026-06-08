import { Router } from "express";
import * as controller from "../controllers/matching.controllers";

export const matchingRoutes = Router();

matchingRoutes.post("/run/:userId", controller.runMatching);
matchingRoutes.get("/results/:userId", controller.getMatches);
matchingRoutes.patch("/results/:id/respond", controller.respondMatch);
