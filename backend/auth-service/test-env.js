require('dotenv').config({ path: '../../.env' });

console.log('=== Auth Service Environment Test ===');
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('INTER_SERVICE_SECRET:', process.env.INTER_SERVICE_SECRET ? 'SET' : 'NOT SET');
