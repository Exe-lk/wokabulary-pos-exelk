// Test script to verify portion validation
const testPortionValidation = async () => {
  const baseUrl = 'https://wokabulary.netlify.app/api/admin/portions';
  
  console.log('Testing Portion Validation...\n');

  // Test 1: Create a valid portion
  console.log('Test 1: Creating valid portion "Small"');
  try {
    const response1 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Small', description: 'Small size portion' })
    });
    
    if (response1.ok) {
      console.log('✅ Success: Portion "Small" created successfully');
    } else {
      const error = await response1.json();
      console.log('❌ Error:', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 2: Try to create duplicate portion (should fail)
  console.log('\nTest 2: Creating duplicate portion "Small"');
  try {
    const response2 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Small', description: 'Another small portion' })
    });
    
    if (response2.ok) {
      console.log('❌ Error: Duplicate portion was created (should have failed)');
    } else {
      const error = await response2.json();
      console.log('✅ Success: Duplicate validation working -', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: Try to create portion with case variation (should fail)
  console.log('\nTest 3: Creating portion "SMALL" (case variation)');
  try {
    const response3 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'SMALL', description: 'Uppercase small' })
    });
    
    if (response3.ok) {
      console.log('❌ Error: Case variation was created (should have failed)');
    } else {
      const error = await response3.json();
      console.log('✅ Success: Case-insensitive validation working -', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 4: Try to create portion with empty name (should fail)
  console.log('\nTest 4: Creating portion with empty name');
  try {
    const response4 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', description: 'Empty name' })
    });
    
    if (response4.ok) {
      console.log('❌ Error: Empty name portion was created (should have failed)');
    } else {
      const error = await response4.json();
      console.log('✅ Success: Empty name validation working -', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 5: Try to create portion with single character (should fail)
  console.log('\nTest 5: Creating portion with single character "A"');
  try {
    const response5 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', description: 'Single character' })
    });
    
    if (response5.ok) {
      console.log('❌ Error: Single character portion was created (should have failed)');
    } else {
      const error = await response5.json();
      console.log('✅ Success: Minimum length validation working -', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n🎉 Validation testing completed!');
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testPortionValidation();
}

module.exports = { testPortionValidation };
