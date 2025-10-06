/**
 * Test Cloudflare Pages deployment
 */

async function testCloudflarePages() {
  console.log('🔍 Testing Cloudflare Pages Deployment\n');
  
  // Common Cloudflare Pages URL patterns
  const possibleUrls = [
    'https://vehicle-dealership.pages.dev',
    'https://auto-dealership.pages.dev', 
    'https://neurodiverse-vehicle-dealership.pages.dev',
    // Custom domain possibilities
    'https://auto-dealership.vercel.app', // From previous test
  ];
  
  let productionUrl = null;
  
  console.log('1️⃣ Searching for Cloudflare Pages deployment...\n');
  
  for (const url of possibleUrls) {
    try {
      console.log(`   Testing: ${url}`);
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const cfRay = response.headers.get('cf-ray');
        if (cfRay) {
          console.log(`   ✅ Cloudflare Pages found! ${url}`);
          console.log(`   CF-Ray: ${cfRay}\n`);
          productionUrl = url;
          break;
        } else {
          console.log(`   ⚠️  Found but not Cloudflare: ${url}\n`);
          productionUrl = url; // Use it anyway
          break;
        }
      }
    } catch (error) {
      console.log(`   ❌ Not accessible`);
    }
  }
  
  if (!productionUrl) {
    console.log('\n❌ Could not find deployed site\n');
    console.log('📋 What\'s your production URL?');
    console.log('Check: https://dash.cloudflare.com → Pages → Your Project\n');
    return;
  }
  
  console.log(`\n2️⃣ Testing sync endpoints on ${productionUrl}...\n`);
  
  const endpoints = [
    '/api/admin/lambert/sync-vehicles',
    '/api/admin/vehicles/sync'
  ];
  
  let endpointsExist = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${productionUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles: [] })
      });
      
      if (response.status === 400) {
        console.log(`   ✅ ${endpoint} - DEPLOYED`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${endpoint} - NOT DEPLOYED YET`);
        endpointsExist = false;
      } else {
        console.log(`   ⚠️  ${endpoint} - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
      endpointsExist = false;
    }
  }
  
  if (!endpointsExist) {
    console.log('\n📋 Endpoints not deployed yet. To deploy:\n');
    console.log('1. Cloudflare Pages auto-deploys from Git on push');
    console.log('2. Check deployment status:');
    console.log('   https://dash.cloudflare.com → Pages → vehicle-dealership → Deployments');
    console.log('3. If needed, trigger manual deployment:');
    console.log('   - Click "Create deployment" button');
    console.log('   - Select branch "main"');
    console.log('   - Click "Save and Deploy"\n');
    console.log('4. Wait 2-3 minutes for build to complete\n');
  } else {
    console.log('\n✅ All endpoints deployed! Ready to test image processing.\n');
    console.log(`Production URL: ${productionUrl}`);
  }
  
  return productionUrl;
}

testCloudflarePages();
