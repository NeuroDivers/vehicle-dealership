// Test Cloudflare Images upload
async function testImageUpload() {
  const accountId = '928f2a6b07f166d57bb4b31b9100d1f4';
  const apiToken = 'hxqfnYpHcT8FrQYyiRiOiOmkPtGkTuhdf6aCfYVT';
  const accountHash = 'fxSXhaLsNKtcGJIGPzWBwA';
  
  // Test with a sample Lambert image URL
  const testImageUrl = 'https://www.lambertbuickgmc.com/wp-content/uploads/2024/01/2024-Buick-Encore-GX-Preferred-AWD-1.jpg';
  
  console.log('Testing Cloudflare Images upload...');
  console.log('Image URL:', testImageUrl);
  
  try {
    // Download the image
    console.log('\n1. Downloading image...');
    const imageResponse = await fetch(testImageUrl);
    
    if (!imageResponse.ok) {
      console.error('Failed to download image:', imageResponse.status);
      return;
    }
    
    console.log('✓ Image downloaded successfully');
    console.log('Content-Type:', imageResponse.headers.get('content-type'));
    console.log('Content-Length:', imageResponse.headers.get('content-length'));
    
    // Get the image blob
    const imageBlob = await imageResponse.blob();
    console.log('✓ Image blob created:', imageBlob.size, 'bytes');
    
    // Create a unique ID for this test
    const imageId = `test-${Date.now()}`;
    console.log('\n2. Uploading to Cloudflare Images...');
    console.log('Image ID:', imageId);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('id', imageId);
    formData.append('metadata', JSON.stringify({
      source: 'test',
      originalUrl: testImageUrl
    }));
    
    // Upload to Cloudflare
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        },
        body: formData
      }
    );
    
    const result = await uploadResponse.json();
    
    if (uploadResponse.ok && result.success) {
      console.log('✓ Upload successful!');
      console.log('\nResult:', JSON.stringify(result, null, 2));
      
      const deliveryUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`;
      console.log('\n✓ Image delivery URL:', deliveryUrl);
      console.log('\nTest the URL in your browser to verify the image loads!');
    } else {
      console.error('✗ Upload failed');
      console.error('Status:', uploadResponse.status);
      console.error('Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
  }
}

testImageUpload();
