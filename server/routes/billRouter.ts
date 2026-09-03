// External dependencies
import express from 'express';

// Internal dependencies
import { processReceipt } from '../controllers/billController';
import { requireAuthentication } from '../controllers/authController';
import uploadMiddleware from '../middleware/upload';

const billRouter = express.Router();

/**
 * Receives an uploaded receipt image and starts the processing pipeline.
 */
billRouter.post(
    '/processReceipt',
    requireAuthentication,
    uploadMiddleware.single('receipt'),
    processReceipt
);

export default billRouter;
