// Test Supabase database connection
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...')
    const { data, error } = await supabase.from('bess_projects').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful!')
    
    // Test table structure
    console.log('\n2️⃣ Testing table structure...')
    const { data: tableData, error: tableError } = await supabase
      .from('bess_projects')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message)
      console.log('💡 Make sure you ran the database schema SQL in Supabase!')
      return false
    }
    
    console.log('✅ Table structure OK!')
    
    // Test insert capability
    console.log('\n3️⃣ Testing insert capability...')
    const testSession = `test_${Date.now()}`
    
    const { data: insertData, error: insertError } = await supabase
      .from('bess_projects')
      .insert({
        session_id: testSession,
        application: 'Test Connection',
        nominal_power_mw: 10,
        user_ip: 'test'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message)
      return false
    }
    
    console.log('✅ Insert successful!')
    console.log('📊 Test record created:', insertData[0]?.id)
    
    // Clean up test record
    await supabase
      .from('bess_projects')
      .delete()
      .eq('session_id', testSession)
    
    console.log('\n🎉 All tests passed! Database is ready for use.')
    return true
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1)
})