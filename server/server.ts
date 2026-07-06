// Import necessary modules.
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import instance of express application from app.ts
import app from './app';

// Load environment variables from .env file
dotenv.config({ path: './../.env' });

// Define the port on which the server will listen for incoming requests
const PORT = process.env.PORT || 3000;
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || '';

// Connect to MongoDB using Mongoose.
mongoose
    .connect(MONGODB_CONNECTION_STRING)
    .then(() => {
        console.log('\x1b[32m Connected to MongoDB');
    })
    .catch((error) => {
        console.error('\x1b[31m Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with an error code
    });

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`\x1b[32m Server is running on port ${PORT}`);
});
