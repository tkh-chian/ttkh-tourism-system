const axios = require('axios');

(async () => {
  try {
    const res = await axios.get('http://localhost:3001/health', { timeout: 5000 });
    console.log('---HEALTH_OK---');
    console.log('status:', res.status);
    console.log('data:', JSON.stringify(res.data));
  } catch (err) {
    console.log('---HEALTH_FAIL---');
    if (err.code) console.log('code:', err.code);
    if (err.response) {
      console.log('status:', err.response.status);
      try { console.log('data:', JSON.stringify(err.response.data)); } catch(e) { console.log('data raw:', err.response.data); }
    } else {
      console.log('error:', err.message);
    }
  }
})();