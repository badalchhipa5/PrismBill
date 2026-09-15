// External dependencies
import express from 'express';

// Internal dependencies
import { addReceipt, addMembersToBill } from '../controllers/billController';
import { requireAuthentication } from '../controllers/authController';
import uploadMiddleware from '../middleware/upload';

const billRouter = express.Router();

/**
 * Receives an uploaded receipt image and starts the processing pipeline.
 */
billRouter.post(
    '/addReceipt',
    requireAuthentication,
    uploadMiddleware.single('receipt'),
    addReceipt
);
billRouter.post('/addMembers', requireAuthentication, addMembersToBill);

export default billRouter;
