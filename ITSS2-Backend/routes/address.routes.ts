import { Router } from "express";
import * as controller from "../controllers/address.controllers";
const router:Router = Router();

//[GET]/api/v1/address
router.get("/", controller.index);




export const addressRoutes:Router = router;