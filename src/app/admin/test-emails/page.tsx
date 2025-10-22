'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle, XCircle, Loader2, Users } from 'lucide-react'

export default function TestEmailsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [emails, setEmails] = useState('hm.websiteprovisioning@gmail.com')
  const [name, setName] = useState('Pizza Stop Test User')
  
  // Email type selection - none selected by default
  const [selectedTypes, setSelectedTypes] = useState({
    registration: false,
    orderConfirmation: false,
    orderReadyTime: false
  })

  const toggleEmailType = (type: keyof typeof selectedTypes) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  async function handleTestEmails() {
    // Validate emails
    if (!emails.trim()) {
      setResults({
        success: false,
        error: 'Please enter at least one email address',
        message: 'Email address is required'
      })
      return
    }

    // Check if at least one email type is selected
    const hasSelection = Object.values(selectedTypes).some(val => val)
    if (!hasSelection) {
      setResults({
        success: false,
        error: 'Please select at least one email type to send',
        message: 'No email types selected'
      })
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/admin/test-all-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: emails,
          name: name,
          selectedTypes: selectedTypes
        })
      })
      
      const data = await response.json()
      setResults(data)
    } catch (error: any) {
      setResults({
        success: false,
        error: error.message,
        message: 'Failed to connect to email testing endpoint'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-white/12 rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-orange/10 rounded-xl">
              <Mail className="w-8 h-8 text-orange" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text">Email Testing System</h1>
              <p className="text-muted">Test all Pizza Stop email templates</p>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-4 mb-8">
            <div>
              <label htmlFor="emails" className="block text-sm font-semibold text-text mb-2">
                📧 Email Address(es)
              </label>
              <input
                id="emails"
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email@example.com, another@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-text placeholder-muted focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
              />
              <p className="text-xs text-muted mt-2">
                💡 Separate multiple emails with commas (e.g., email1@test.com, email2@test.com)
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text mb-2">
                👤 Recipient Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-text placeholder-muted focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-all"
              />
            </div>
          </div>

          {/* Email Type Selection */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-blue-400 font-semibold mb-4">📧 Select Email Types to Send:</h3>
            <p className="text-xs text-muted mb-4">💡 Tip: Select one at a time to avoid rate limiting</p>
            
            <div className="space-y-3">
              {/* Registration Email */}
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTypes.registration}
                  onChange={() => toggleEmailType('registration')}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-orange focus:ring-2 focus:ring-orange/50 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text group-hover:text-orange transition-colors">
                    Registration Email
                  </div>
                  <div className="text-sm text-muted">
                    Welcome message for new users
                  </div>
                </div>
              </label>

              {/* Order Confirmation Email */}
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTypes.orderConfirmation}
                  onChange={() => toggleEmailType('orderConfirmation')}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-orange focus:ring-2 focus:ring-orange/50 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text group-hover:text-orange transition-colors">
                    Order Confirmation & Password Reset
                  </div>
                  <div className="text-sm text-muted">
                    Receipt with order details + Password reset email
                  </div>
                </div>
              </label>

              {/* Order Ready Time Email */}
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTypes.orderReadyTime}
                  onChange={() => toggleEmailType('orderReadyTime')}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-orange focus:ring-2 focus:ring-orange/50 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text group-hover:text-orange transition-colors">
                    Order Ready Time
                  </div>
                  <div className="text-sm text-muted">
                    Estimated preparation time notification
                  </div>
                </div>
              </label>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedTypes({ registration: true, orderConfirmation: true, orderReadyTime: true })}
                className="text-xs px-3 py-1 bg-orange/20 text-orange rounded hover:bg-orange/30 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedTypes({ registration: false, orderConfirmation: false, orderReadyTime: false })}
                className="text-xs px-3 py-1 bg-white/10 text-muted rounded hover:bg-white/20 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestEmails}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange to-red hover:from-orange/90 hover:to-red/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Emails...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send All Test Emails</span>
              </>
            )}
          </button>

          {/* Results */}
          {results && (
            <div className={`mt-8 p-6 rounded-xl border ${
              results.success 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {results.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <h3 className={`text-lg font-bold ${
                  results.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {results.message}
                </h3>
              </div>

              {results.emailsSentTo && results.emailsSentTo.length > 0 && (
                <div className="text-sm text-muted mb-4">
                  <p className="font-semibold mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Emails sent to:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.emailsSentTo.map((email: string, index: number) => (
                      <span key={index} className="text-orange font-mono bg-orange/10 px-2 py-1 rounded">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {results.results && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-muted font-semibold mb-2">Detailed Results:</p>
                  {results.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <span className="text-sm text-text">{result.type}</span>
                      <span className={`text-xs font-bold ${
                        result.status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.status === 'success' ? '✅ Sent' : `❌ Failed (${result.statusCode})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results.error && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">Error: {results.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-sm font-semibold text-text mb-2">💡 Developer Tips:</h4>
            <ul className="text-xs text-muted space-y-1">
              <li>• You can also test emails from terminal: <code className="text-orange">npm run test:emails</code></li>
              <li>• Quick single test: <code className="text-orange">npm run test:email:quick</code></li>
              <li>• Make sure your dev server is running before testing</li>
              <li>• Edit <code className="text-orange">test-all-emails.js</code> to change test email address</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

