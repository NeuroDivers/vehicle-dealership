// Real inventory search function for D1 database
async function searchInventoryReal(params: any, env: any): Promise<any[]> {
  try {
    // Build the WHERE clause dynamically
    const conditions = [];
    const bindValues = [];

    if (params.make) {
      conditions.push('make LIKE ?');
      bindValues.push(`%${params.make}%`);
    }

    if (params.model) {
      conditions.push('model LIKE ?');
      bindValues.push(`%${params.model}%`);
    }

    if (params.minPrice) {
      conditions.push('price >= ?');
      bindValues.push(params.minPrice);
    }

    if (params.maxPrice) {
      conditions.push('price <= ?');
      bindValues.push(params.maxPrice);
    }

    if (params.maxMileage) {
      conditions.push('odometer <= ?');
      bindValues.push(params.maxMileage);
    }

    if (params.bodyType) {
      conditions.push('bodyType = ?');
      bindValues.push(params.bodyType);
    }

    if (params.yearMin) {
      conditions.push('year >= ?');
      bindValues.push(params.yearMin);
    }

    if (params.yearMax) {
      conditions.push('year <= ?');
      bindValues.push(params.yearMax);
    }

    if (params.color) {
      conditions.push('color LIKE ?');
      bindValues.push(`%${params.color}%`);
    }

    // Always filter for active vehicles
    conditions.push('isSold = 0');

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, make, model, year, price, odometer, bodyType, color, stockNumber, images
      FROM vehicles
      ${whereClause}
      ORDER BY price ASC
      LIMIT 10
    `;

    console.log('Executing inventory search:', query, bindValues);

    const result = await env.DB.prepare(query).bind(...bindValues).all();

    return result.results || [];
  } catch (error) {
    console.error('Inventory search error:', error);
    return [];
  }
}
