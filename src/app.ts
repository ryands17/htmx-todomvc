import serverless from 'serverless-http';
import { app } from './index.jsx';

export const handler = serverless(app);
