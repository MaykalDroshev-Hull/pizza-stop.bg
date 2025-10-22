// Quick environment variable checker
const fs = require('fs')
const path = require('path')

console.log('\n🔍 Environment Variable Check\n')
console.log('═'.repeat(50))

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local')
const envLocalExists = fs.existsSync(envLocalPath)

console.log(`\n📁 .env.local file: ${envLocalExists ? '✅ EXISTS' : '❌ NOT FOUND'}`)

let envVars = {}

if (envLocalExists) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  console.log(`📝 Lines in file: ${lines.length}`)
  console.log('\nVariables in file:')
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key) {
      const cleanKey = key.trim()
      const value = valueParts.join('=').trim()
      envVars[cleanKey] = value
      console.log(`   - ${cleanKey}`)
    }
  })
}

console.log('\n' + '═'.repeat(50))
console.log('\n📧 Email Configuration from .env.local:\n')

const checks = {
  EMAIL: envVars.EMAIL,
  EMAIL_USER: envVars.EMAIL_USER,
  EMAIL_PASS: envVars.EMAIL_PASS
}

Object.entries(checks).forEach(([key, value]) => {
  if (value) {
    if (key === 'EMAIL_PASS') {
      console.log(`✅ ${key}: ${'*'.repeat(value.length)} (${value.length} characters)`)
    } else {
      const masked = value.substring(0, 3) + '***@' + value.split('@')[1]
      console.log(`✅ ${key}: ${masked}`)
    }
  } else {
    console.log(`❌ ${key}: NOT SET`)
  }
})

console.log('\n' + '═'.repeat(50))
console.log('\n🔍 Validation:\n')

const allSet = checks.EMAIL && checks.EMAIL_USER && checks.EMAIL_PASS
const emailMatch = checks.EMAIL === checks.EMAIL_USER
const passLength = checks.EMAIL_PASS?.length || 0

console.log(`All variables set: ${allSet ? '✅ YES' : '❌ NO'}`)
console.log(`EMAIL = EMAIL_USER: ${emailMatch ? '✅ YES' : '❌ NO (they should match!)'}`)
console.log(`EMAIL_PASS length: ${passLength} ${passLength === 16 ? '✅ (correct for Gmail App Password)' : passLength === 0 ? '❌ (not set)' : '⚠️  (unusual length)'}`)

console.log('\n' + '═'.repeat(50))

if (!allSet) {
  console.log('\n❌ CONFIGURATION ISSUES FOUND!\n')
  console.log('Fix by editing .env.local file:')
  console.log('   EMAIL=your-email@gmail.com')
  console.log('   EMAIL_USER=your-email@gmail.com')
  console.log('   EMAIL_PASS=your-16-char-app-password')
  console.log('\nThen restart your dev server!\n')
} else if (!emailMatch) {
  console.log('\n⚠️  EMAIL and EMAIL_USER should be the same!\n')
  console.log('Update .env.local:')
  console.log(`   EMAIL_USER=${checks.EMAIL}\n`)
} else {
  console.log('\n✅ ALL CHECKS PASSED!\n')
  console.log('Your environment variables are correctly configured.')
  console.log('If emails still fail, the issue is with Gmail (rate limits/restrictions).\n')
}

console.log('═'.repeat(50) + '\n')

