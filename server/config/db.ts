// External dependencies
import mongoose from 'mongoose';

// Internal dependencies
import secrets from './secrets';

/**
 * Connects the server application to MongoDB on startup.
 */
async function connectToDatabase(): Promise<void> {
    try {
        await mongoose.connect(secrets.server.MONGODB_CONNECTION_STRING);
    } catch (error) {
        console.error('\x1b[31mError connecting to MongoDB:', error);
        process.exit(1);
    }
}

export default connectToDatabase();
