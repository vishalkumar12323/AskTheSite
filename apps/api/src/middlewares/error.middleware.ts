import { Response, Request, NextFunction } from "express";
import { logger } from "../logger/logger.js";

export const errorHandler = (
  error: Error,
  _req: Request,
  _res: Response,
  _next: NextFunction
) => {
  logger.error(`Unhandled exception on ${_req.method} ${_req.path}`, error, {
    method: _req.method,
    path:   _req.path,
  });
  return _res.status(500).json({ message: error.message });
};
