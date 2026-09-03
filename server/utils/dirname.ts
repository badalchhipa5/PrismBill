// External dependencies
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolves file and directory details from an ES module URL.
 */
export function getDirectoryDetails(metaUrl: string): {
    __filename: string;
    __dirname: string;
    path: typeof path;
} {
    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);

    return { __filename, __dirname, path };
}

export const getDirName = getDirectoryDetails;
