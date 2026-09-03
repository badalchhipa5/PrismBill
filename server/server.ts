// Internal dependencies
import app from './app';
import './config/cloudinary';
import './config/db';

import secrets from './config/secrets';

/**
 * Starts the HTTP server and listens for incoming requests.
 */
app.listen(secrets.server.PORT, () => {
    console.log(`\x1b[32mServer is running on port ${secrets.server.PORT} \x1b[0m`); // eslint-disable-line no-console
});
