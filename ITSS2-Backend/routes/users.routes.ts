import { Router } from "express";
import * as controller from "../controllers/users.controllers";
const router: Router = Router();
//[GET]/api/v1/users/:id/get-category-list
router.get("/:id/get-category-list", controller.getCategoryList);
//[GET]/api/v1/users
router.get("/:id", controller.getUserInfo);
//[POST]/api/v1/users
router.post("/:id", controller.updateUserInfo);
//[GET]/api/v1/users/:id/suggested-jobs
router.get("/:id/suggested-jobs", controller.suggestJobs);
export const userRoutes: Router = router;
