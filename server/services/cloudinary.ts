// External dependencies
import { v2 as cloudinary } from 'cloudinary';

// Internal dependencies
import mapCloudinaryError from '../utils/serviceErrors/mapCloudinaryError';

const uploadImageToCloudinary = async (fileDetails: Express.Multer.File): Promise<string> => {
    try {
        const cloudinaryResult = await cloudinary.uploader.upload(fileDetails.path, {
            public_id: fileDetails.filename.split('.')[0],
            folder: 'prism-bill-app',
        });
        return cloudinaryResult.secure_url;
    } catch (error) {
        const cloudinaryError = mapCloudinaryError(error);
        throw cloudinaryError;
    }
};

export default uploadImageToCloudinary;
