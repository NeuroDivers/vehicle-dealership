// Test scraper patterns
const html = `
<div class="row">
  <div class="col-xs-6">
    <h4 class="b-detail__main-aside-desc-title">Modèle</h4>
  </div>
  <div class="col-xs-6">
    <p class="b-detail__main-aside-desc-value">RDX</p>
  </div>
</div>
<div class="row">
  <div class="col-xs-6">
    <h4 class="b-detail__main-aside-desc-title">Odomètre</h4>
  </div>
  <div class="col-xs-6">
    <p class="b-detail__main-aside-desc-value">119,500 KM</p>
  </div>
</div>
<div class="row">
  <div class="col-xs-6">
    <h4 class="b-detail__main-aside-desc-title">Couleur extérieure</h4>
  </div>
  <div class="col-xs-6">
    <p class="b-detail__main-aside-desc-value">Silver</p>
  </div>
</div>
<div class="row">
  <div class="col-xs-6">
    <h4 class="b-detail__main-aside-desc-title">Numéro d'identification</h4>
  </div>
  <div class="col-xs-6">
    <p class="b-detail__main-aside-desc-value">5J8TB4H51EL802112</p>
  </div>
</div>
`;

// Test patterns
const modelMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Model|Modèle)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
console.log('Model match:', modelMatch ? modelMatch[2] : 'NOT FOUND');

const kmMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Kilometres|Odomètre)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([0-9,\s]+)/i);
console.log('Odometer match:', kmMatch ? kmMatch[2] : 'NOT FOUND');

const colorMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Exterior Color|Couleur extérieure)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
console.log('Color match:', colorMatch ? colorMatch[2] : 'NOT FOUND');

const vinMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Vin|Numéro d'identification)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([A-Z0-9]{17})<\/p>/i);
console.log('VIN match:', vinMatch ? vinMatch[2] : 'NOT FOUND');
