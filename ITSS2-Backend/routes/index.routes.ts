import { Express } from "express";
import { jobRoutes } from "./jobs.routes";
import { addressRoutes } from "./address.routes";
import { userRoutes } from "./users.routes";
const mainRoutes = (app: Express): void => {
  const version: string = "/api/v1";
  app.use(version + "/jobs", jobRoutes);
  app.use(version + "/address", addressRoutes);
  app.use(version + "/users", userRoutes);
};
export default mainRoutes;