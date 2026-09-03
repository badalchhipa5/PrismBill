// External dependencies
import dotenv from 'dotenv';

// Internal dependencies
import { getDirectoryDetails } from '../utils/dirname';

const { __dirname, path } = getDirectoryDetails(import.meta.url);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Returns a required environment variable or throws when it is missing.
 */
export default function requireEnvVariable(key: string): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
}
