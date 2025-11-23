import { CognitoUserPool } from 'amazon-cognito-identity-js'

// These values come from your AWS deployment
// Update after running: npm run deploy:backend
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
}

export const userPool = new CognitoUserPool(poolData)

export const cognitoConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: poolData.UserPoolId,
  clientId: poolData.ClientId
}
