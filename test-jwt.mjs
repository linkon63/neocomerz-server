import jwt from 'jsonwebtoken';

// Get a token from the login endpoint
const testToken = process.argv[2];

if (!testToken) {
  console.log('Usage: node test-jwt.mjs <token>');
  console.log('\nTo get a token, login and copy it from the browser console or network tab');
  process.exit(1);
}

const secret = process.env.JWT_SECRET || 'neocomerz-super-secret-jwt-key-2026';

try {
  const decoded = jwt.verify(testToken, secret);
  console.log('✅ Token is valid!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}
