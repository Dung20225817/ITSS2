import { Router } from "express";
import * as controller from "../controllers/auth.controllers";
import { authRateLimit } from "../middlewares/auth-rate-limit.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/register", authRateLimit, controller.register);
router.post("/login", authRateLimit, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

export const authRoutes: Router = router;
