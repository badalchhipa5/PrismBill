// External dependencies
import { type RequestHandler } from 'express';

// Internal dependencies
import AppError from '../utils/appError';

const checkRequestBody: RequestHandler = (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return next(new AppError('Please provide data in the request body', 400));
    }
    next();
};

export default checkRequestBody;
