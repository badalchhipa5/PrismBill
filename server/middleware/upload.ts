// External dependencies
import multer from 'multer';

// Internal dependencies
import { getDirectoryDetails } from '../utils/dirname';

const { __dirname, path } = getDirectoryDetails(import.meta.url);
const uploadDirectory = path.join(__dirname, '..', 'tmp', 'uploads');

/**
 * Stores uploaded receipt files on disk with a unique file name.
 */
const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
        callback(null, uploadDirectory);
    },
    filename: (_request, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileExtension = path.extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
    },
});

export default multer({ storage });
