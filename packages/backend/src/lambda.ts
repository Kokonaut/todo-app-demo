import serverless from 'serverless-http'
import { app } from './index.js'

// Wrap Express app for Lambda
export const handler = serverless(app)
