# Server Enhancement Plan

This document summarizes the improvements that are most relevant to the server work already implemented for PrismBill.

## Improvements to implement soon

### 1. Authentication and user identity

- Replace the placeholder `userId` value with the authenticated user id from the request context.
- Add middleware for JWT or session-based identity once the user side is ready.

### 2. Image upload flow

- Save the Cloudinary image URL instead of the temporary placeholder string.
- Return the uploaded image URL in the response payload for easier debugging and UI integration.
- Consider storing uploaded files in object storage directly rather than relying on local temp files.

### 3. Receipt processing reliability

- Add retry logic for OCR or Gemini failures when the first attempt fails.
- Add a fallback parser for cases where the AI response is malformed or empty.
- Validate and normalize parsed values before saving them to MongoDB.

### 4. Data validation and schemas

- Add request-level validation for uploaded files, especially file type and size.
- Introduce stronger Mongoose validation for required fields and numeric formats.
- Standardize the bill and item schema structure with shared types from the shared package.

### 5. Error handling and logging

- Replace console logging with a structured logger.
- Return more specific error responses for OCR, upload, and extraction failures.
- Add request IDs for easier tracing across the pipeline.

### 6. Code structure and maintainability

- Move the hard-coded business values, such as upload folder names and processing status, into configuration constants.
- Split the controller logic into smaller helper functions for OCR, upload, persistence, and response creation.
- Rename remaining ambiguous variables and improve inline comments where behavior is non-obvious.

## Improvements to prioritize later

### 7. Background processing

- Move receipt processing to a background job queue so uploads do not block the API response.
- Add a status endpoint to track processing progress.

### 8. Audit and history

- Track processing attempts, error history, and timestamps for each bill.
- Add support for reprocessing receipts if OCR or AI extraction needs correction.

### 9. API design

- Introduce dedicated routes for bill retrieval, update, and deletion.
- Add pagination and filtering for bills and participants.

## Notes

These recommendations are intentionally focused on the server functionality that already exists and should be implemented before the user-facing part is expanded.
