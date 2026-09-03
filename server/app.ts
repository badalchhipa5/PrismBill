// External dependencies
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Internal dependencies
import globalError from './controllers/errorController';
import AppError from './utils/appError';

import billsRouter from './routes/billRouter';
import usersRouter from './routes/userRouter';

/**
 * Creates and configures the Express application instance.
 */
const app = express();

app.use(express.json());
app.use('/api/v1/bill', billsRouter);
app.use('/api/v1/user', usersRouter);

app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`This route doesn't exist: ${req.originalUrl}`, 404));
});

app.use(globalError);

export default app;
