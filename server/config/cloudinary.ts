// External dependencies
import { v2 as cloudinary } from 'cloudinary';

// Internal dependencies
import secrets from './secrets';

const { CLOUDINARY_NAME, API_KEY, API_SECRET } = secrets.cloudinary;

/**
 * Configures the Cloudinary SDK for receipt image uploads.
 */
cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
});
