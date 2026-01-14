import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Checking Backend...')

  useEffect(() => {
    //  Test connection to NestJS
    fetch('/api') 
      .then(res => res.ok ? setStatus('Connected to Backend A (NestJS) ✅') : setStatus('Backend A Error ❌'))
      .catch(() => setStatus('Backend A Disconnected ❌'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Project Initialized! 🚀
        </h1>
        <p className="text-gray-600 mb-6">
          Frontend (React + Tailwind) is running successfully.
        </p>
        
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm font-mono text-gray-500">System Status:</p>
          <p className="font-semibold text-green-600 mt-1">{status}</p>
        </div>
      </div>
    </div>
  )
}

export default App