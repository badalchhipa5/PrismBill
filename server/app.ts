// Import necessary modules and dependencies for the server application.
import express from 'express';

// Create an instance of the Express application.
const app = express();

// Middleware to parse incoming JSON requests.
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Export the Express application instance for use in other parts of the project.
export default app;
