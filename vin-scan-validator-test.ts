#!/usr/bin/env ts-node
/**
 * VINScanValidator - Comprehensive VIN Processing and Scanning Workflow Test
 * 
 * This test suite validates:
 * 1. VIN decoding for different vehicle types (car, motorcycle, scooter)
 * 2. License plate to VIN conversion functionality
 * 3. Vehicle make/model identification accuracy
 * 4. VIN validation for different lengths (11-17 characters)
 * 5. Error handling for invalid VINs and plates
 */

import { decodePlateToVIN, validatePlateFormat, getSupportedStates, getStateName } from './utils/vin/fromPlate';
import { VinData, VehicleType } from './types/service';

// Test data sets
const TEST_VINS = {
  // 17-character VINs (Standard cars)
  cars: [
    { vin: '1HGBH41JXMN109186', expected: { make: 'Honda', vehicleType: 'car' as VehicleType } },
    { vin: '1FTFW1ET5DFC10312', expected: { make: 'Ford', vehicleType: 'car' as VehicleType } },
    { vin: 'WVWZZZ3BZWE689725', expected: { make: 'Volkswagen', vehicleType: 'car' as VehicleType } },
    { vin: '1G1ZT53806F109149', expected: { make: 'Chevrolet', vehicleType: 'car' as VehicleType } },
    { vin: 'JTDKN3DU8A0123456', expected: { make: 'Toyota', vehicleType: 'car' as VehicleType } },
  ],
  
  // Motorcycle VINs (17-character)
  motorcycles: [
    { vin: 'JH2RC5006LM200001', expected: { make: 'Honda', vehicleType: 'motorcycle' as VehicleType } },
    { vin: 'JYAVP31E8LA000001', expected: { make: 'Yamaha', vehicleType: 'motorcycle' as VehicleType } },
    { vin: 'JS1GR7JA5L2100001', expected: { make: 'Suzuki', vehicleType: 'motorcycle' as VehicleType } },
    { vin: 'JKA1KFD66A0000001', expected: { make: 'Kawasaki', vehicleType: 'motorcycle' as VehicleType } },
    { vin: '1HD1KEL19LB000001', expected: { make: 'Harley-Davidson', vehicleType: 'motorcycle' as VehicleType } },
  ],
  
  // Scooter VINs (Various lengths)
  scooters: [
    { vin: 'RFBLA4157L0000001', expected: { make: 'Vespa', vehicleType: 'scooter' as VehicleType } },
    { vin: 'L5YCGACB0A0000001', expected: { make: 'TaoTao', vehicleType: 'scooter' as VehicleType } },
    { vin: 'L6TCGACB0A0000001', expected: { make: 'Kymco', vehicleType: 'scooter' as VehicleType } },
    { vin: 'ZAPC31100', expected: { make: 'Piaggio', vehicleType: 'scooter' as VehicleType } }, // 11-character
    { vin: '5J6TC1200A', expected: { make: 'Yamaha', vehicleType: 'scooter' as VehicleType } }, // 10-character
  ],
  
  // Invalid VINs for error testing
  invalid: [
    { vin: 'INVALID', reason: 'Too short' },
    { vin: '1HGBH41JXMN109186TOOLONG', reason: 'Too long' },
    { vin: '1HGBH41JXMN10918O', reason: 'Contains invalid character O' },
    { vin: '1HGBH41JXMN10918I', reason: 'Contains invalid character I' },
    { vin: '1HGBH41JXMN10918Q', reason: 'Contains invalid character Q' },
    { vin: '', reason: 'Empty string' },
    { vin: '123', reason: 'Too short for any vehicle type' },
  ]
};

const TEST_PLATES = {
  // Known plates from mock database
  valid: [
    { plate: 'ABC123', state: 'CA', expected: { make: 'Volkswagen', model: 'Passat', year: 2008 } },
    { plate: 'XYZ789', state: 'NY', expected: { make: 'Honda', model: 'Civic', year: 2021 } },
    { plate: 'DEF456', state: 'TX', expected: { make: 'Ford', model: 'F-150', year: 2013 } },
    { plate: 'GHI012', state: 'FL', expected: { make: 'Chevrolet', model: 'Malibu', year: 2006 } },
    { plate: 'JKL345', state: 'CA', expected: { make: 'Toyota', model: 'Prius', year: 2010 } },
  ],
  
  // Unknown plates (should return partial info)
  unknown: [
    { plate: 'UNKNOWN1', state: 'CA' },
    { plate: 'TEST123', state: 'NY' },
    { plate: 'SAMPLE1', state: 'TX' },
  ],
  
  // Invalid plates
  invalid: [
    { plate: 'X', state: 'CA', reason: 'Too short' },
    { plate: 'TOOLONGPLATE', state: 'CA', reason: 'Too long' },
    { plate: 'ABC@123', state: 'CA', reason: 'Invalid characters' },
    { plate: 'ABC 123', state: 'CA', reason: 'Space not allowed in some states' },
    { plate: '', state: 'CA', reason: 'Empty string' },
  ]
};

// Test results tracking
interface TestResult {
  passed: boolean;
  testName: string;
  expected: any;
  actual: any;
  error?: string;
  duration?: number;
}

let testResults: TestResult[] = [];

// VIN validation function (from VinScanner component)
function validateVin(vin: string, vehicleType: VehicleType): boolean {
  if (vehicleType === 'car') {
    // Standard 17-character VIN for cars
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
  } else {
    // Motorcycles and scooters can have 11-17 character VINs
    const vinRegex = /^[A-HJ-NPR-Z0-9]{11,17}$/;
    return vinRegex.test(vin.toUpperCase());
  }
}

// Mock VIN decoding function (simplified version of VinScanner logic)
function generateFallbackVinData(vin: string, vehicleType: VehicleType): VinData | null {
  try {
    const vinUpper = vin.toUpperCase();
    let year = new Date().getFullYear();
    let make = 'Unknown';
    let model = 'Unknown Model';

    // Try to extract year from VIN (10th character for 17-digit VINs)
    if (vin.length === 17) {
      const yearChar = vinUpper.charAt(9);
      const yearMap: Record<string, number> = {
        'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
        'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
        'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
        '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
        '6': 2006, '7': 2007, '8': 2008, '9': 2009,
      };
      year = yearMap[yearChar] || year;
    }

    // Motorcycle and scooter manufacturer prefix mapping
    if (vehicleType === 'motorcycle' || vehicleType === 'scooter') {
      const motorcycleMap: Record<string, { make: string; type: VehicleType }> = {
        '1HD': { make: 'Harley-Davidson', type: 'motorcycle' },
        'JH2': { make: 'Honda', type: 'motorcycle' },
        'JH3': { make: 'Honda', type: 'motorcycle' },
        'JHM': { make: 'Honda', type: 'motorcycle' },
        'JKA': { make: 'Kawasaki', type: 'motorcycle' },
        'JKB': { make: 'Kawasaki', type: 'motorcycle' },
        'JS1': { make: 'Suzuki', type: 'motorcycle' },
        'JS2': { make: 'Suzuki', type: 'motorcycle' },
        'JYA': { make: 'Yamaha', type: 'motorcycle' },
        'JYB': { make: 'Yamaha', type: 'motorcycle' },
        'L5Y': { make: 'TaoTao', type: 'scooter' },
        'L6T': { make: 'Kymco', type: 'scooter' },
        'LVV': { make: 'Vespa', type: 'scooter' },
        'ME4': { make: 'KTM', type: 'motorcycle' },
        'ZAP': { make: 'Piaggio', type: 'scooter' },
        'VTH': { make: 'Triumph', type: 'motorcycle' },
        'WVB': { make: 'BMW', type: 'motorcycle' },
        '93M': { make: 'Indian', type: 'motorcycle' },
        '5J6': { make: 'Yamaha', type: 'scooter' },
        'RF9': { make: 'Aprilia', type: 'motorcycle' },
        'RFB': { make: 'Vespa', type: 'scooter' },
        'ZDM': { make: 'Ducati', type: 'motorcycle' },
      };

      // Check first 3 characters
      const prefix3 = vinUpper.substring(0, 3);
      if (motorcycleMap[prefix3]) {
        make = motorcycleMap[prefix3].make;
        vehicleType = motorcycleMap[prefix3].type;
      } else {
        // Check first 2 characters
        const prefix2 = vinUpper.substring(0, 2);
        const shortPrefixMap: Record<string, { make: string; type: VehicleType }> = {
          'JH': { make: 'Honda', type: 'motorcycle' },
          'JK': { make: 'Kawasaki', type: 'motorcycle' },
          'JS': { make: 'Suzuki', type: 'motorcycle' },
          'JY': { make: 'Yamaha', type: 'motorcycle' },
          'L5': { make: 'Chinese Manufacturer', type: 'scooter' },
          'L6': { make: 'Chinese Manufacturer', type: 'scooter' },
        };
        
        if (shortPrefixMap[prefix2]) {
          make = shortPrefixMap[prefix2].make;
          vehicleType = shortPrefixMap[prefix2].type;
        }
      }
    } else {
      // Car manufacturer mapping
      const wmi = vinUpper.substring(0, 3);
      const manufacturerMap: Record<string, string> = {
        '1G1': 'Chevrolet', '1G6': 'Cadillac', '1GC': 'Chevrolet',
        '1FA': 'Ford', '1FB': 'Ford', '1FC': 'Ford', '1FD': 'Ford',
        '1FT': 'Ford', '1FU': 'Ford', '1FV': 'Ford',
        '1HG': 'Honda', '1HT': 'Honda',
        '1J4': 'Jeep', '1J8': 'Jeep',
        '1N4': 'Nissan', '1N6': 'Nissan',
        '2C3': 'Chrysler', '2C4': 'Chrysler',
        '2G1': 'Chevrolet', '2G2': 'Pontiac',
        '2T1': 'Toyota', '2T2': 'Toyota',
        '3FA': 'Ford', '3FE': 'Ford',
        '4F2': 'Mazda', '4F4': 'Mazda',
        '4T1': 'Toyota', '4T3': 'Toyota',
        '5NP': 'Hyundai', '5TD': 'Toyota',
        'JH4': 'Acura', 'JHM': 'Honda',
        'JM1': 'Mazda', 'JM3': 'Mazda',
        'JN1': 'Nissan', 'JN8': 'Nissan',
        'JT2': 'Toyota', 'JT3': 'Toyota',
        'JTD': 'Toyota',
        'KM8': 'Hyundai', 'KNA': 'Kia',
        'WBA': 'BMW', 'WBS': 'BMW',
        'WDB': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz',
        'WVW': 'Volkswagen', 'WV1': 'Volkswagen',
      };
      make = manufacturerMap[wmi] || 'Unknown';
    }

    return {
      vin: vinUpper,
      make,
      model,
      year,
      vehicleType,
      trim: undefined,
      engine: undefined,
      transmission: undefined,
      bodyStyle: undefined,
      fuelType: undefined,
      driveType: undefined,
    };
  } catch (error) {
    return null;
  }
}

// Test utility functions
function addTestResult(testName: string, passed: boolean, expected: any, actual: any, error?: string, duration?: number) {
  testResults.push({
    testName,
    passed,
    expected,
    actual,
    error,
    duration
  });
}

function formatTestResult(result: TestResult): string {
  const status = result.passed ? '✅' : '❌';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  let output = `${status} ${result.testName}${duration}`;
  
  if (!result.passed) {
    output += `\n   Expected: ${JSON.stringify(result.expected)}`;
    output += `\n   Actual: ${JSON.stringify(result.actual)}`;
    if (result.error) {
      output += `\n   Error: ${result.error}`;
    }
  }
  
  return output;
}

// Test functions
async function testVinValidation() {
  console.log('\n=== Testing VIN Validation ===');
  
  // Test car VINs
  for (const testCase of TEST_VINS.cars) {
    const startTime = Date.now();
    const isValid = validateVin(testCase.vin, 'car');
    const duration = Date.now() - startTime;
    
    addTestResult(
      `VIN Validation: ${testCase.vin} (car)`,
      isValid,
      true,
      isValid,
      isValid ? undefined : 'VIN validation failed',
      duration
    );
  }
  
  // Test motorcycle VINs
  for (const testCase of TEST_VINS.motorcycles) {
    const startTime = Date.now();
    const isValid = validateVin(testCase.vin, 'motorcycle');
    const duration = Date.now() - startTime;
    
    addTestResult(
      `VIN Validation: ${testCase.vin} (motorcycle)`,
      isValid,
      true,
      isValid,
      isValid ? undefined : 'VIN validation failed',
      duration
    );
  }
  
  // Test scooter VINs
  for (const testCase of TEST_VINS.scooters) {
    const startTime = Date.now();
    const isValid = validateVin(testCase.vin, 'scooter');
    const duration = Date.now() - startTime;
    
    addTestResult(
      `VIN Validation: ${testCase.vin} (scooter)`,
      isValid,
      true,
      isValid,
      isValid ? undefined : 'VIN validation failed',
      duration
    );
  }
  
  // Test invalid VINs
  for (const testCase of TEST_VINS.invalid) {
    const startTime = Date.now();
    const isValid = validateVin(testCase.vin, 'car');
    const duration = Date.now() - startTime;
    
    addTestResult(
      `VIN Validation: ${testCase.vin} (invalid - ${testCase.reason})`,
      !isValid,
      false,
      isValid,
      !isValid ? undefined : 'VIN should be invalid but passed validation',
      duration
    );
  }
}

async function testVinDecoding() {
  console.log('\n=== Testing VIN Decoding ===');
  
  // Test car VINs
  for (const testCase of TEST_VINS.cars) {
    const startTime = Date.now();
    const vinData = generateFallbackVinData(testCase.vin, 'car');
    const duration = Date.now() - startTime;
    
    const passed = vinData !== null && 
                  vinData.make === testCase.expected.make &&
                  vinData.vehicleType === testCase.expected.vehicleType;
    
    addTestResult(
      `VIN Decoding: ${testCase.vin} (${testCase.expected.make})`,
      passed,
      testCase.expected,
      vinData ? { make: vinData.make, vehicleType: vinData.vehicleType } : null,
      vinData ? undefined : 'VIN decoding returned null',
      duration
    );
  }
  
  // Test motorcycle VINs
  for (const testCase of TEST_VINS.motorcycles) {
    const startTime = Date.now();
    const vinData = generateFallbackVinData(testCase.vin, 'motorcycle');
    const duration = Date.now() - startTime;
    
    const passed = vinData !== null && 
                  vinData.make === testCase.expected.make &&
                  vinData.vehicleType === testCase.expected.vehicleType;
    
    addTestResult(
      `VIN Decoding: ${testCase.vin} (${testCase.expected.make})`,
      passed,
      testCase.expected,
      vinData ? { make: vinData.make, vehicleType: vinData.vehicleType } : null,
      vinData ? undefined : 'VIN decoding returned null',
      duration
    );
  }
  
  // Test scooter VINs
  for (const testCase of TEST_VINS.scooters) {
    const startTime = Date.now();
    const vinData = generateFallbackVinData(testCase.vin, 'scooter');
    const duration = Date.now() - startTime;
    
    const passed = vinData !== null && 
                  vinData.make === testCase.expected.make &&
                  vinData.vehicleType === testCase.expected.vehicleType;
    
    addTestResult(
      `VIN Decoding: ${testCase.vin} (${testCase.expected.make})`,
      passed,
      testCase.expected,
      vinData ? { make: vinData.make, vehicleType: vinData.vehicleType } : null,
      vinData ? undefined : 'VIN decoding returned null',
      duration
    );
  }
}

async function testPlateValidation() {
  console.log('\n=== Testing License Plate Validation ===');
  
  // Test valid plates
  for (const testCase of TEST_PLATES.valid) {
    const startTime = Date.now();
    const isValid = validatePlateFormat(testCase.plate, testCase.state);
    const duration = Date.now() - startTime;
    
    addTestResult(
      `Plate Validation: ${testCase.plate} (${testCase.state})`,
      isValid,
      true,
      isValid,
      isValid ? undefined : 'Plate validation failed',
      duration
    );
  }
  
  // Test invalid plates
  for (const testCase of TEST_PLATES.invalid) {
    const startTime = Date.now();
    const isValid = validatePlateFormat(testCase.plate, testCase.state);
    const duration = Date.now() - startTime;
    
    addTestResult(
      `Plate Validation: ${testCase.plate} (invalid - ${testCase.reason})`,
      !isValid,
      false,
      isValid,
      !isValid ? undefined : 'Plate should be invalid but passed validation',
      duration
    );
  }
}

async function testPlateToVinConversion() {
  console.log('\n=== Testing License Plate to VIN Conversion ===');
  
  // Test valid plates (known in database)
  for (const testCase of TEST_PLATES.valid) {
    const startTime = Date.now();
    try {
      const result = await decodePlateToVIN(testCase.plate, testCase.state);
      const duration = Date.now() - startTime;
      
      const passed = result.vin !== undefined && 
                    result.make === testCase.expected.make &&
                    result.model === testCase.expected.model &&
                    result.year === testCase.expected.year;
      
      addTestResult(
        `Plate to VIN: ${testCase.plate} (${testCase.state})`,
        passed,
        testCase.expected,
        { make: result.make, model: result.model, year: result.year, vin: result.vin },
        passed ? undefined : 'Plate to VIN conversion failed',
        duration
      );
    } catch (error) {
      addTestResult(
        `Plate to VIN: ${testCase.plate} (${testCase.state})`,
        false,
        testCase.expected,
        null,
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
      );
    }
  }
  
  // Test unknown plates
  for (const testCase of TEST_PLATES.unknown) {
    const startTime = Date.now();
    try {
      const result = await decodePlateToVIN(testCase.plate, testCase.state);
      const duration = Date.now() - startTime;
      
      const passed = result.vin === undefined && 
                    result.error !== undefined &&
                    result.confidence === 'low';
      
      addTestResult(
        `Plate to VIN: ${testCase.plate} (unknown)`,
        passed,
        { error: 'Vehicle information not found', confidence: 'low' },
        { error: result.error, confidence: result.confidence },
        passed ? undefined : 'Unknown plate should return error',
        duration
      );
    } catch (error) {
      addTestResult(
        `Plate to VIN: ${testCase.plate} (unknown)`,
        false,
        { error: 'Vehicle information not found' },
        null,
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
      );
    }
  }
}

async function testSupportedStates() {
  console.log('\n=== Testing Supported States ===');
  
  const startTime = Date.now();
  const states = getSupportedStates();
  const duration = Date.now() - startTime;
  
  const passed = states.length === 51 && // 50 states + DC
                states.includes('CA') &&
                states.includes('NY') &&
                states.includes('TX') &&
                states.includes('FL') &&
                states.includes('DC');
  
  addTestResult(
    'Supported States Count',
    passed,
    51,
    states.length,
    passed ? undefined : 'Incorrect number of supported states',
    duration
  );
  
  // Test state name conversion
  const testStates = ['CA', 'NY', 'TX', 'FL', 'DC'];
  for (const state of testStates) {
    const startTime = Date.now();
    const name = getStateName(state);
    const duration = Date.now() - startTime;
    
    const passed = name !== state && name.length > 2;
    
    addTestResult(
      `State Name: ${state} -> ${name}`,
      passed,
      'Full state name',
      name,
      passed ? undefined : 'State name conversion failed',
      duration
    );
  }
}

async function testVehicleTypeDetection() {
  console.log('\n=== Testing Vehicle Type Detection ===');
  
  // Test VIN-based vehicle type detection
  const testCases = [
    { vin: '1HGBH41JXMN109186', expected: 'car' },
    { vin: 'JH2RC5006LM200001', expected: 'motorcycle' },
    { vin: 'RFBLA4157L0000001', expected: 'scooter' },
    { vin: 'JS1GR7JA5L2100001', expected: 'motorcycle' },
    { vin: 'L5YCGACB0A0000001', expected: 'scooter' },
  ];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    const vinData = generateFallbackVinData(testCase.vin, testCase.expected as VehicleType);
    const duration = Date.now() - startTime;
    
    const passed = vinData !== null && vinData.vehicleType === testCase.expected;
    
    addTestResult(
      `Vehicle Type Detection: ${testCase.vin} -> ${testCase.expected}`,
      passed,
      testCase.expected,
      vinData?.vehicleType,
      passed ? undefined : 'Vehicle type detection failed',
      duration
    );
  }
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test empty/null inputs
  const errorTestCases = [
    { input: '', description: 'Empty VIN' },
    { input: null, description: 'Null VIN' },
    { input: undefined, description: 'Undefined VIN' },
  ];
  
  for (const testCase of errorTestCases) {
    const startTime = Date.now();
    let errorCaught = false;
    
    try {
      const result = generateFallbackVinData(testCase.input as any, 'car');
      if (result === null) {
        errorCaught = true;
      }
    } catch (error) {
      errorCaught = true;
    }
    
    const duration = Date.now() - startTime;
    
    addTestResult(
      `Error Handling: ${testCase.description}`,
      errorCaught,
      true,
      errorCaught,
      errorCaught ? undefined : 'Error should have been caught',
      duration
    );
  }
  
  // Test invalid plate formats
  const invalidPlateTests = [
    { plate: 'ABC@123', state: 'CA' },
    { plate: 'TOOLONGPLATE', state: 'CA' },
    { plate: '!@#$%^&', state: 'CA' },
  ];
  
  for (const testCase of invalidPlateTests) {
    const startTime = Date.now();
    let errorHandled = false;
    
    try {
      const result = await decodePlateToVIN(testCase.plate, testCase.state);
      if (result.error) {
        errorHandled = true;
      }
    } catch (error) {
      errorHandled = true;
    }
    
    const duration = Date.now() - startTime;
    
    addTestResult(
      `Error Handling: Invalid plate ${testCase.plate}`,
      errorHandled,
      true,
      errorHandled,
      errorHandled ? undefined : 'Invalid plate should trigger error handling',
      duration
    );
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚗 VINScanValidator - VIN Processing and Scanning Workflow Test\n');
  console.log('Testing VIN decoding, license plate conversion, and vehicle identification...\n');
  
  const startTime = Date.now();
  
  // Run all test suites
  await testVinValidation();
  await testVinDecoding();
  await testPlateValidation();
  await testPlateToVinConversion();
  await testSupportedStates();
  await testVehicleTypeDetection();
  await testErrorHandling();
  
  const totalDuration = Date.now() - startTime;
  
  // Print results
  console.log('\n=== Test Results ===');
  testResults.forEach(result => {
    console.log(formatTestResult(result));
  });
  
  // Summary statistics
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const averageDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0) / totalTests;
  
  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Average Test Duration: ${averageDuration.toFixed(1)}ms`);
  
  // Component-specific analysis
  console.log('\n=== Component Analysis ===');
  console.log('VIN Validation:', testResults.filter(r => r.testName.includes('VIN Validation')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('VIN Decoding:', testResults.filter(r => r.testName.includes('VIN Decoding')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('Plate Validation:', testResults.filter(r => r.testName.includes('Plate Validation')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('Plate to VIN:', testResults.filter(r => r.testName.includes('Plate to VIN')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('State Support:', testResults.filter(r => r.testName.includes('State') || r.testName.includes('Supported')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('Vehicle Type Detection:', testResults.filter(r => r.testName.includes('Vehicle Type Detection')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  console.log('Error Handling:', testResults.filter(r => r.testName.includes('Error Handling')).every(r => r.passed) ? '✅ PASS' : '❌ FAIL');
  
  // Vehicle type coverage
  const vinTests = testResults.filter(r => r.testName.includes('VIN Decoding'));
  const carTests = vinTests.filter(r => r.testName.includes('Honda') || r.testName.includes('Ford') || r.testName.includes('Toyota') || r.testName.includes('Chevrolet') || r.testName.includes('Volkswagen'));
  const motorcycleTests = vinTests.filter(r => r.testName.includes('Harley-Davidson') || r.testName.includes('Suzuki') || r.testName.includes('Kawasaki') || r.testName.includes('Yamaha'));
  const scooterTests = vinTests.filter(r => r.testName.includes('Vespa') || r.testName.includes('TaoTao') || r.testName.includes('Kymco') || r.testName.includes('Piaggio'));
  
  console.log('\n=== Vehicle Type Coverage ===');
  console.log(`Cars: ${carTests.filter(r => r.passed).length}/${carTests.length} passed`);
  console.log(`Motorcycles: ${motorcycleTests.filter(r => r.passed).length}/${motorcycleTests.length} passed`);
  console.log(`Scooters: ${scooterTests.filter(r => r.passed).length}/${scooterTests.length} passed`);
  
  if (failedTests > 0) {
    console.log('\n=== Failed Tests Detail ===');
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`❌ ${result.testName}`);
      console.log(`   Expected: ${JSON.stringify(result.expected)}`);
      console.log(`   Actual: ${JSON.stringify(result.actual)}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
  }
  
  console.log('\n=== VIN Processing Workflow Test Complete ===');
  console.log(`Overall Status: ${failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    totalDuration,
    averageDuration,
    componentResults: {
      vinValidation: testResults.filter(r => r.testName.includes('VIN Validation')).every(r => r.passed),
      vinDecoding: testResults.filter(r => r.testName.includes('VIN Decoding')).every(r => r.passed),
      plateValidation: testResults.filter(r => r.testName.includes('Plate Validation')).every(r => r.passed),
      plateToVin: testResults.filter(r => r.testName.includes('Plate to VIN')).every(r => r.passed),
      stateSupport: testResults.filter(r => r.testName.includes('State') || r.testName.includes('Supported')).every(r => r.passed),
      vehicleTypeDetection: testResults.filter(r => r.testName.includes('Vehicle Type Detection')).every(r => r.passed),
      errorHandling: testResults.filter(r => r.testName.includes('Error Handling')).every(r => r.passed),
    }
  };
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };