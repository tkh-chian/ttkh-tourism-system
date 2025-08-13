const axios = require('axios');

(async () => {
  const url = 'http://localhost:3001/api/auth/login';
  const payload = { email: 'admin@ttkh.com', password: 'admin123' };
  try {
    const res = await axios.post(url, payload, { timeout: 10000 });
    console.log('---LOGIN_SUCCESS---');
    console.log(JSON.stringify({ status: res.status, data: res.data }, null, 2));
    process.exit(0);
  } catch (err) {
    console.log('---LOGIN_FAIL---');
    if (err.response) {
      console.log('status:', err.response.status);
      try {
        console.log('data:', JSON.stringify(err.response.data, null, 2));
      } catch (e) {
        console.log('data (raw):', err.response.data);
      }
    } else {
      console.log('error:', err.message);
    }
    process.exit(1);
  }
})();