import { Response, Request, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  _req: Request,
  _res: Response,
  _next: NextFunction
) => {
  console.log(error);
  return _res.status(500).json({ message: error.message });
};
