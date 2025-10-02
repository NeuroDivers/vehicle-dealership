/**
 * VIN Decoder Worker
 * Uses NHTSA's free VIN decoder API to get vehicle specifications
 * API: https://vpic.nhtsa.dot.gov/api/
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Decode VIN endpoint
    if (url.pathname === '/api/decode-vin' && request.method === 'POST') {
      try {
        const { vin } = await request.json();
        
        if (!vin || vin.length !== 17) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid VIN. Must be 17 characters.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const decodedData = await this.decodeVIN(vin);
        
        return new Response(JSON.stringify({
          success: true,
          vin: vin,
          data: decodedData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('VIN Decoder API', { headers: corsHeaders });
  },

  async decodeVIN(vin) {
    console.log(`Decoding VIN: ${vin}`);
    
    // Use NHTSA's free VIN decoder API
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to decode VIN');
    }
    
    const data = await response.json();
    
    if (!data.Results) {
      throw new Error('Invalid VIN decoder response');
    }
    
    // Extract useful fields from the response
    const results = data.Results;
    const getValue = (variableId) => {
      const item = results.find(r => r.VariableId === variableId);
      return item?.Value || null;
    };
    
    const decodedData = {
      // Basic info
      make: getValue(26) || getValue(27), // Make
      model: getValue(28) || getValue(29), // Model
      year: parseInt(getValue(29)) || null, // Model Year
      
      // Body & Style
      bodyType: getValue(5), // Body Class
      bodyStyle: getValue(10), // Body Type
      doors: parseInt(getValue(14)) || null, // Doors
      
      // Engine
      engineSize: getValue(11), // Displacement (L)
      engineCylinders: parseInt(getValue(9)) || null, // Engine Number of Cylinders
      engineHP: getValue(127), // Engine Brake (hp)
      engineConfiguration: getValue(10), // Engine Configuration
      
      // Fuel
      fuelType: getValue(24), // Fuel Type - Primary
      fuelType2: getValue(66), // Fuel Type - Secondary
      
      // Transmission
      transmission: getValue(37), // Transmission Style
      transmissionSpeeds: getValue(38), // Transmission Speeds
      
      // Drivetrain
      driveType: getValue(15), // Drive Type (AWD, FWD, RWD, 4WD)
      
      // Dimensions
      gvwr: getValue(25), // Gross Vehicle Weight Rating
      wheelbase: getValue(60), // Wheelbase
      
      // Other
      vehicleType: getValue(39), // Vehicle Type
      trim: getValue(38), // Trim
      manufacturer: getValue(27), // Manufacturer Name
      plantCity: getValue(31), // Plant City
      plantCountry: getValue(32), // Plant Country
    };
    
    // Normalize values
    if (decodedData.fuelType) {
      decodedData.fuelType = this.normalizeFuelType(decodedData.fuelType);
    }
    
    if (decodedData.transmission) {
      decodedData.transmission = this.normalizeTransmission(decodedData.transmission);
    }
    
    if (decodedData.driveType) {
      decodedData.drivetrain = this.normalizeDrivetrain(decodedData.driveType);
    }
    
    if (decodedData.engineSize) {
      // Format as "X.XL"
      const size = parseFloat(decodedData.engineSize);
      if (!isNaN(size)) {
        decodedData.engineSize = `${size}L`;
      }
    }
    
    if (decodedData.bodyType) {
      decodedData.bodyType = this.normalizeBodyType(decodedData.bodyType);
    }
    
    console.log('Decoded VIN data:', JSON.stringify(decodedData, null, 2));
    
    return decodedData;
  },

  normalizeFuelType(fuel) {
    const lower = fuel.toLowerCase();
    if (lower.includes('gasoline') || lower.includes('gas')) return 'Gasoline';
    if (lower.includes('diesel')) return 'Diesel';
    if (lower.includes('electric') || lower.includes('battery')) return 'Electric';
    if (lower.includes('hybrid')) return 'Hybrid';
    if (lower.includes('flex') || lower.includes('e85')) return 'Flex Fuel';
    return fuel;
  },

  normalizeTransmission(trans) {
    const lower = trans.toLowerCase();
    if (lower.includes('auto') || lower.includes('a/t')) return 'Automatic';
    if (lower.includes('manual') || lower.includes('m/t')) return 'Manual';
    if (lower.includes('cvt')) return 'CVT';
    return trans;
  },

  normalizeDrivetrain(drive) {
    const upper = drive.toUpperCase();
    if (upper.includes('AWD') || upper.includes('ALL')) return 'AWD';
    if (upper.includes('FWD') || upper.includes('FRONT')) return 'FWD';
    if (upper.includes('RWD') || upper.includes('REAR')) return 'RWD';
    if (upper.includes('4WD') || upper.includes('4X4')) return '4WD';
    return drive;
  },

  normalizeBodyType(body) {
    const lower = body.toLowerCase();
    if (lower.includes('suv') || lower.includes('sport utility')) return 'SUV';
    if (lower.includes('sedan')) return 'Sedan';
    if (lower.includes('truck') || lower.includes('pickup')) return 'Truck';
    if (lower.includes('van') || lower.includes('minivan')) return 'Van';
    if (lower.includes('coupe')) return 'Coupe';
    if (lower.includes('hatchback')) return 'Hatchback';
    if (lower.includes('wagon')) return 'Wagon';
    if (lower.includes('convertible')) return 'Convertible';
    return body;
  }
};
