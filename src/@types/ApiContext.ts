import { Request, Response } from "express";
import { Admin } from "../entity/Admin";

export interface ApiContext {
  req: Request;
  res: Response;
  user?: Admin;
}
