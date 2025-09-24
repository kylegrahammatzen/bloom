import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🌸' },
    { id: 'auth', label: 'Authentication', icon: '🔐' },
    { id: 'icebox', label: 'The Icebox', icon: '🧪' },
    { id: 'scenarios', label: 'Scenarios', icon: '🏦' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌸</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bloom</h1>
                <p className="text-sm text-gray-500">Authentication Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Development
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Bloom
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Learn how authentication really works through hands-on experimentation and real-time visualization.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">What You'll Learn</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Password hashing with Argon2id and salt generation</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Cryptographically secure token generation</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Session management and security attributes</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>CSRF protection and attack prevention</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Rate limiting and security best practices</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🧪</span>
                      <div>
                        <h4 className="font-medium">The Icebox Laboratory</h4>
                        <p className="text-sm text-gray-600">Safe environment for testing authentication methods</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h4 className="font-medium">Real-time Visualization</h4>
                        <p className="text-sm text-gray-600">See authentication processes step by step</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <h4 className="font-medium">Security Scenarios</h4>
                        <p className="text-sm text-gray-600">Banking, social media, and payment processing examples</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Based on The Copenhagen Book
                </h3>
                <p className="text-blue-800">
                  This platform implements security practices from The Copenhagen Book,
                  a comprehensive guide for authentication and security in web applications.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Demo</h2>
              <p className="text-gray-600 mb-8">
                Experience secure authentication with real-time process visualization.
              </p>

              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🚧 Coming Soon</h3>
                  <p className="text-gray-600">
                    Interactive authentication forms with live demonstrations of:
                  </p>
                  <ul className="mt-2 text-sm text-gray-500 space-y-1">
                    <li>• Password hashing with Argon2id</li>
                    <li>• Session creation and management</li>
                    <li>• Token generation and validation</li>
                    <li>• Security headers and CSRF protection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'icebox' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🧪 The Icebox Laboratory
              </h2>
              <p className="text-gray-600 mb-8">
                Experiment with authentication methods in a safe, controlled environment.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">🔐 Password Labs</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Compare storage methods from plaintext to Argon2id
                  </p>
                  <button className="text-blue-600 text-sm font-medium hover:underline">
                    Explore →
                  </button>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">🎲 Token Inspector</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Analyze entropy and generation methods
                  </p>
                  <button className="text-blue-600 text-sm font-medium hover:underline">
                    Analyze →
                  </button>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">🍪 Session Viewer</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitor session lifecycle and storage
                  </p>
                  <button className="text-blue-600 text-sm font-medium hover:underline">
                    Monitor →
                  </button>
                </div>
              </div>

              <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Safe Learning Environment</h3>
                <p className="text-yellow-800">
                  All experiments are conducted in a controlled environment.
                  Attack simulations are for educational purposes only.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🏦 Security Scenarios
              </h2>
              <p className="text-gray-600 mb-8">
                Explore how different industries implement authentication with varying security requirements.
              </p>

              <div className="space-y-6">
                <div className="p-6 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🏦</span>
                    <h3 className="text-xl font-semibold">Banking Scenario</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    High-security implementation with multi-factor authentication,
                    strict session management, and comprehensive audit logging.
                  </p>
                  <div className="flex space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      High Security
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      MFA Required
                    </span>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">📱</span>
                    <h3 className="text-xl font-semibold">Social Media Scenario</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Balanced security with OAuth integration, social login options,
                    and user-friendly session management.
                  </p>
                  <div className="flex space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Balanced Security
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      OAuth Enabled
                    </span>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">💳</span>
                    <h3 className="text-xl font-semibold">Payment Processing Scenario</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    PCI-compliant authentication with tokenization,
                    secure payment flows, and regulatory compliance.
                  </p>
                  <div className="flex space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      PCI Compliant
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Tokenization
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Bloom Authentication Learning Platform - Educational Tool
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Powered by Express.js & React</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
