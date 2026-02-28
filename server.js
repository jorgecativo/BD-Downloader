/**
 * cPanel Entry Point
 * This file allows cPanel's Node.js selector to start the server.ts file
 * using 'tsx' which we already have in our dependencies.
 */

import { register } from 'tsx/register';

// Register tsx to handle .ts files
register();

// Import the actual server logic
import './server.ts';
