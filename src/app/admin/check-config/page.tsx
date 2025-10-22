'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function CheckConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkConfig() {
      try {
        const response = await fetch('/api/check-email-config')
        const data = await response.json()
        setConfig(data)
      } catch (error) {
        setConfig({ error: 'Failed to check configuration' })
      } finally {
        setLoading(false)
      }
    }
    checkConfig()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-white/12 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-text mb-6">Email Configuration Check</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange animate-spin" />
            </div>
          ) : config?.error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-red-400" />
                <p className="text-red-400 font-semibold">{config.error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className={`rounded-xl p-6 mb-8 border ${
                config.configured 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  {config.configured ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <h2 className={`text-xl font-bold ${
                      config.configured ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {config.message}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-text">Environment Variables:</h3>
                
                <div className="space-y-3">
                  {/* EMAIL */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {config.config.EMAIL ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-mono text-text">EMAIL</span>
                    </div>
                    <span className="text-muted">{config.config.EMAIL_value}</span>
                  </div>

                  {/* EMAIL_USER */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {config.config.EMAIL_USER ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-mono text-text">EMAIL_USER</span>
                    </div>
                    <span className="text-muted">{config.config.EMAIL_USER_value}</span>
                  </div>

                  {/* EMAIL_PASS */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {config.config.EMAIL_PASS ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-mono text-text">EMAIL_PASS</span>
                    </div>
                    <span className="text-muted">
                      {config.config.EMAIL_PASS_length > 0 
                        ? `${'*'.repeat(config.config.EMAIL_PASS_length)} characters` 
                        : 'NOT SET'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {!config.configured && config.instructions && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-blue-400 font-semibold mb-3">Setup Instructions:</h3>
                      <div className="space-y-2">
                        {config.instructions.map((instruction: string, index: number) => (
                          <p key={index} className={`text-sm ${
                            instruction.startsWith('EMAIL') 
                              ? 'font-mono text-orange bg-orange/10 px-3 py-2 rounded' 
                              : 'text-muted'
                          }`}>
                            {instruction}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm font-semibold text-text mb-3">Next Steps:</h4>
                {config.configured ? (
                  <div className="space-y-2 text-sm text-muted">
                    <p>✅ Your email configuration is complete!</p>
                    <p>You can now test sending emails:</p>
                    <a 
                      href="/admin/test-emails" 
                      className="inline-block mt-3 bg-orange text-white px-6 py-2 rounded-xl hover:bg-orange/90 transition-all"
                    >
                      Go to Email Testing →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-muted">
                    <p>1. Create or edit <code className="text-orange">.env.local</code> file in your project root</p>
                    <p>2. Add the email configuration variables</p>
                    <p>3. Restart your dev server: <code className="text-orange">npm run dev</code></p>
                    <p>4. Refresh this page to check again</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

