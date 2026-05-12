import cloudinary from './config/cloudinary.js';

console.log('Testing Cloudinary config...');
console.log('API Key:', cloudinary.config().api_key);
console.log('API Secret:', cloudinary.config().api_secret ? 'PRESENT (len: ' + cloudinary.config().api_secret.length + ')' : 'MISSING');
console.log('Cloud name:', cloudinary.config().cloud_name);
