// External dependencies
import type { RequestHandler } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

// Internal dependencies
import billModel from '../model/billModel';
import performOcrOnReceipt from '../services/ocr';
import { extractReceiptData } from '../services/gemini/gemini';
import uploadImageToCloudinary from '../services/cloudinary';

import AppError from '../utils/appError';
import { AUTH_ERROR_MESSAGES } from '../utils/errorMessages';

/**
 * Handles receipt upload, OCR, AI extraction, persistence, and response to the client.
 */
export const processReceipt: RequestHandler = async (req, res, next) => {
    // Access the uploaded file from the request object.
    const uploadedFile = req.file as Express.Multer.File | undefined;

    // Validate that a file was uploaded.
    if (!uploadedFile?.filename) {
        res.status(400).json({ status: 'fail', message: AUTH_ERROR_MESSAGES.noReceiptImage });
        return;
    }

    try {
        // Perform OCR on the uploaded receipt image.
        const extractedText = await performOcrOnReceipt(uploadedFile.filename);

        // Upload the image to Cloudinary and get the URL.
        const imageUrl = await uploadImageToCloudinary(uploadedFile);

        const extractedReceiptData = await extractReceiptData(
            {
                models: ['gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
                maxAttemptsPerModel: 2,
                cooldownTimeMs: 120_000,
            },
            extractedText
        );

        if (!extractedReceiptData) throw new Error('Extracted data is undefined');

        await billModel.create({
            id: uuid(),
            merchantName: extractedReceiptData.merchantName || 'Not mentioned',
            date: extractedReceiptData.date || 'Not mentioned',
            imageUrl,
            subtotal: Number(extractedReceiptData.subtotal ?? 0),
            tax: Number(extractedReceiptData.tax ?? 0),
            tip: Number(extractedReceiptData.tip ?? 0),
            total: Number(extractedReceiptData.total ?? 0),
            items: extractedReceiptData.items.map((item) => ({
                ...item,
                assignedTo: [],
            })),
            participants: [],
            status: 'processing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({
            message: 'Receipt processed successfully',
            data: extractedReceiptData,
        });
    } catch (error: unknown) {
        const errorName = error instanceof Error ? error.name : '';
        const errorMessage = error instanceof Error ? error.message : 'Failed to process receipt';

        if (
            errorName.includes('GEMINI') ||
            errorName.includes('CLOUDINARY') ||
            errorName.includes('OCR')
        ) {
            return next(error);
        }
        return next(new AppError(errorMessage, 500, 'RECEIPT_PROCESSING_ERROR'));
    } finally {
        if (uploadedFile?.path) {
            fs.unlink(uploadedFile.path, (unlinkError) => {
                if (unlinkError) {
                    console.error('Failed to delete temp file:', unlinkError);
                }
            });
        }
    }
};
