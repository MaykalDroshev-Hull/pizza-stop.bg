'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function EmailDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function testEmail() {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-error-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'hm.websiteprovisioning@gmail.com' })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-white/12 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-text mb-6">Email Debug Console</h1>
          
          <button
            onClick={testEmail}
            disabled={loading}
            className="bg-orange text-white px-6 py-3 rounded-xl hover:bg-orange/90 transition-all disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Test Email Send'}
          </button>

          {result && (
            <div className="space-y-4">
              {/* Success/Error Status */}
              <div className={`p-4 rounded-xl border ${
                result.success 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <span className={`font-semibold ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.message || 'Failed'}
                  </span>
                </div>
              </div>

              {/* Configuration Check */}
              {result.config && (
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="text-text font-semibold mb-3">Environment Variables:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">EMAIL:</span>
                      <span className={result.config.EMAIL ? 'text-green-400' : 'text-red-400'}>
                        {result.config.EMAIL_value || (result.config.EMAIL ? '✅ Set' : '❌ Not Set')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">EMAIL_USER:</span>
                      <span className={result.config.EMAIL_USER ? 'text-green-400' : 'text-red-400'}>
                        {result.config.EMAIL_USER_value || (result.config.EMAIL_USER ? '✅ Set' : '❌ Not Set')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">EMAIL_PASS:</span>
                      <span className={result.config.EMAIL_PASS ? 'text-green-400' : 'text-red-400'}>
                        {result.config.EMAIL_PASS ? '✅ Set' : '❌ Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {result.error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-red-400 font-semibold mb-2">Error Message:</h3>
                      <p className="text-sm text-muted font-mono bg-black/30 p-3 rounded">
                        {result.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {result.stack && (
                <div className="bg-white/5 p-4 rounded-xl">
                  <h3 className="text-text font-semibold mb-2">Stack Trace:</h3>
                  <pre className="text-xs text-muted bg-black/30 p-3 rounded overflow-auto max-h-64">
                    {result.stack}
                  </pre>
                </div>
              )}

              {/* Full Response */}
              <details className="bg-white/5 p-4 rounded-xl">
                <summary className="text-text font-semibold cursor-pointer">Full Response (JSON)</summary>
                <pre className="text-xs text-muted bg-black/30 p-3 rounded overflow-auto mt-3">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

