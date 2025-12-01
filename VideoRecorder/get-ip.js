// Quick script to get your local IP address
const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIPAddress();
console.log('\n📱 Your Local IP Address:');
console.log(`   ${ip}\n`);
console.log('📝 Add this to your .env.local file:');
console.log(`   NEXT_PUBLIC_API_URL=http://${ip}:5000\n`);
console.log('🌐 Frontend URL for mobile:');
console.log(`   http://${ip}:3000\n`);

