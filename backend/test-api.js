async function runTests() {
  console.log('🧪 Starting API Verification Tests...');
  try {
    const homeRes = await fetch('http://localhost:5000/');
    const homeText = await homeRes.text();
    console.log('✅ Home Route Response:', homeText);

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'buyer@quickkart.com',
        password: 'buyer123'
      })
    });
    
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) {
      throw new Error(loginData.message || 'Login failed');
    }
    console.log('✅ Buyer Login Success! Token:', loginData.token ? 'Present' : 'Missing');
    console.log('👤 Logged In User:', loginData.user.name, `[Role: ${loginData.user.role}]`);

    const productsRes = await fetch('http://localhost:5000/api/products');
    const productsData = await productsRes.json();
    console.log(`✅ Fetch Products Success! Found ${productsData.length} seeded products.`);

    console.log('🎉 API and Database Verification Test PASSED!');
  } catch (err) {
    console.error('❌ API Verification Test FAILED:', err.message);
  }
}

runTests();
