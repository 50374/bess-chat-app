// Test script to upload sample datasheets and test recommendations
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testUploadAndRecommendations() {
    const baseUrl = 'http://localhost:5001';
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
        
        // Test 2: Upload a sample datasheet
        console.log('\n2. Testing datasheet upload...');
        const form = new FormData();
        form.append('datasheet', fs.createReadStream('sample-datasheets/Sungrow_ST2236UX-US.txt'));
        form.append('manufacturer', 'Sungrow');
        form.append('model', 'ST2236UX-US');
        
        const uploadResponse = await fetch(`${baseUrl}/api/upload-datasheet`, {
            method: 'POST',
            body: form
        });
        
        const uploadData = await uploadResponse.json();
        console.log('Upload response:', uploadData);
        
        // Test 3: Get datasheets
        console.log('\n3. Testing datasheets endpoint...');
        const datasheetsResponse = await fetch(`${baseUrl}/api/datasheets`);
        const datasheetsData = await datasheetsResponse.json();
        console.log('Datasheets count:', datasheetsData.length);
        
        // Test 4: Test recommendations
        console.log('\n4. Testing recommendations...');
        const testRequirements = {
            nominal_power_mw: 2.0,
            nominal_energy_mwh: 4.0,
            discharge_duration_h: 2.0,
            application: 'Energy arbitrage',
            expected_daily_cycles: 1.5
        };
        
        const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRequirements)
        });
        
        const recommendationsData = await recommendationsResponse.json();
        console.log('Recommendations response:', recommendationsData);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUploadAndRecommendations();