// Direct test of SLT Autos HTML extraction
async function testSLTExtraction() {
  const url = 'https://sltautos.com/fr/details/p/1743707407/2014-acura-rdx-automatique/';
  
  console.log('Fetching:', url);
  const response = await fetch(url);
  const html = await response.text();
  
  console.log('\n=== Testing Patterns ===\n');
  
  // Test Model pattern (with HTML entities)
  const modelPattern = /<div class="row">[\s\S]*?<h4[^>]*>(Model|Mod&egrave;le)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i;
  const modelMatch = html.match(modelPattern);
  console.log('Model Match:', modelMatch ? modelMatch[2] : 'NOT FOUND');
  
  // Test Odometer pattern (with HTML entities)
  const kmPattern = /<div class="row">[\s\S]*?<h4[^>]*>(Kilometres|Odom&egrave;tre)<\/h4>[\s\S]*?<p[^>]*>([0-9,\s]+)[\s\S]*?<\/div>/i;
  const kmMatch = html.match(kmPattern);
  console.log('Odometer Match:', kmMatch ? kmMatch[2] : 'NOT FOUND');
  
  // Test Color pattern (with HTML entities)
  const colorPattern = /<div class="row">[\s\S]*?<h4[^>]*>(Exterior Color|Couleur ext&eacute;rieure)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i;
  const colorMatch = html.match(colorPattern);
  console.log('Color Match:', colorMatch ? colorMatch[2] : 'NOT FOUND');
  
  // Test VIN pattern (with HTML entities)
  const vinPattern = /<div class="row">[\s\S]*?<h4[^>]*>(Vin|Num&eacute;ro d'identification)<\/h4>[\s\S]*?<p[^>]*>([A-Z0-9]{17})<\/p>[\s\S]*?<\/div>/i;
  const vinMatch = html.match(vinPattern);
  console.log('VIN Match:', vinMatch ? vinMatch[2] : 'NOT FOUND');
  
  // Show a snippet of HTML around "Modèle"
  const modeleIndex = html.indexOf('Modèle');
  if (modeleIndex !== -1) {
    const snippet = html.substring(modeleIndex - 100, modeleIndex + 400);
    console.log('\n=== HTML around "Modèle" ===');
    console.log(snippet);
  } else {
    console.log('\n⚠️  "Modèle" not found in HTML at all!');
  }
  
  // Show a snippet around "Odomètre"
  const odoIndex = html.indexOf('Odomètre');
  if (odoIndex !== -1) {
    const snippet = html.substring(odoIndex - 100, odoIndex + 400);
    console.log('\n=== HTML around "Odomètre" ===');
    console.log(snippet);
  } else {
    console.log('\n⚠️  "Odomètre" not found in HTML at all!');
  }
  
  // Check if "RDX" (the model) appears anywhere
  const rdxIndex = html.indexOf('RDX');
  if (rdxIndex !== -1) {
    const snippet = html.substring(rdxIndex - 200, rdxIndex + 200);
    console.log('\n=== HTML around "RDX" ===');
    console.log(snippet);
  }
  
  // Check for VIN
  const vinIndex = html.indexOf('5J8TB4H51EL802112');
  if (vinIndex !== -1) {
    const snippet = html.substring(vinIndex - 200, vinIndex + 100);
    console.log('\n=== HTML around VIN ===');
    console.log(snippet);
  }
}

testSLTExtraction().catch(console.error);
