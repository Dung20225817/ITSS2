import { Router } from "express";
import * as controller from "../controllers/jobs.controllers";
const router:Router = Router();

//[GET]/api/v1/jobs
router.get("/", controller.index);
//[GET]/api/v1/jobs/detail/:id
router.get("/detail/:id",controller.detail);



export const jobRoutes:Router = router;