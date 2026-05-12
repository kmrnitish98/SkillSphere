async function run() {
  try {
    const email = 'test' + Date.now() + '@example.com';
    // 1. Register user
    let res = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email,
        password: 'password123',
        role: 'student'
      })
    });
    let data = await res.json();
    const token = data.token;
    console.log('Register successful, token:', token);
    if (!token) return console.log('Reg failed:', data);

    // 2. Hit payment intent
    res = await fetch('http://localhost:5000/api/v1/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: '64e8e1234567890123456789' // fake valid-looking id
      })
    });
    data = await res.json();
    console.log('Payment Intent Response:', res.status, data);
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

run();
