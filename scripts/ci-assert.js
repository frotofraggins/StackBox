const required = ['AWS_REGION'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing env:', missing.join(', '));
  process.exit(1);
}
console.log('✅ CI environment OK');
