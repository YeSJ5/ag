const { fetch } = globalThis;

async function testAll() {
  console.log('Testing Authentication & Endpoints...');
  const params = new URLSearchParams();
  params.append('username', 'tester@airguard.local');
  params.append('password', 'Password@123');
  
  const loginRes = await fetch('http://127.0.0.1:8001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }
  const { access_token } = await loginRes.json();
  const headers = { 'Authorization': 'Bearer ' + access_token };
  console.log('✅ Authenticated successfully.');

  const endpoints = [
    '/api/v1/watchlist',
    '/api/v1/sources/health',
    '/api/v1/data-quality',
    '/api/v1/models/metadata',
    '/api/v1/models/ablation',
    '/api/v1/system/latency',
    '/api/v1/aircraft?limit=5',
  ];

  for (const ep of endpoints) {
    const res = await fetch('http://127.0.0.1:8001' + ep, { headers });
    console.log(`${ep} -> HTTP ${res.status}`);
    if (!res.ok) {
      console.error('  ERROR:', await res.text());
    } else {
      const data = await res.json();
      console.log('  Payload items/keys:', Array.isArray(data) ? `Array(${data.length})` : Object.keys(data));
    }
  }

  // Get flights
  const acRes = await fetch('http://127.0.0.1:8001/api/v1/aircraft?limit=2', { headers });
  const flights = await acRes.json();
  if (flights.length > 0) {
    const icaoA = flights[0].icao24 || flights[0].id;
    console.log(`\nTesting single-aircraft endpoints on ICAO: ${icaoA}`);
    const acEndpoints = [
      `/api/v1/aircraft/${icaoA}/detail`,
      `/api/v1/aircraft/${icaoA}/narrative`,
      `/api/v1/aircraft/${icaoA}/delta`,
      `/api/v1/airspace/correlation/${icaoA}`,
    ];
    for (const ep of acEndpoints) {
      const res = await fetch('http://127.0.0.1:8001' + ep, { headers });
      console.log(`${ep} -> HTTP ${res.status}`);
      if (!res.ok) console.error('  ERROR:', await res.text());
      else {
        const data = await res.json();
        console.log('  Keys:', Object.keys(data));
      }
    }

    if (flights.length > 1) {
      const icaoB = flights[1].icao24 || flights[1].id;
      const compUrl = `/api/v1/aircraft/compare?icao_a=${icaoA}&icao_b=${icaoB}`;
      const res = await fetch('http://127.0.0.1:8001' + compUrl, { headers });
      console.log(`${compUrl} -> HTTP ${res.status}`);
      if (!res.ok) console.error('  ERROR:', await res.text());
      else {
        const data = await res.json();
        console.log('  Comparison Keys:', Object.keys(data));
      }
    }
  }
}

testAll().catch(console.error);
