import { Router } from "express";
import * as controller from "../controllers/reviews.controllers";

export const reviewRoutes = Router();

reviewRoutes.get("/company/:companyId", controller.getReviews);
reviewRoutes.post("/", controller.createReview);
