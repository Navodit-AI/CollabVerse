"use client";
import { useState } from "react";

export default function TestConnection() {
  const [status, setStatus] = useState("Not tested");
  const [details, setDetails] = useState("");

  const testConnection = async () => {
    setStatus("Testing...");
    setDetails("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    try {
      console.log("Testing connection to:", apiUrl);
      
      // Test root endpoint
      const startTime = Date.now();
      const res = await fetch(`${apiUrl}/`, {
        method: "GET",
        mode: "cors",
        signal: AbortSignal.timeout(60000),
      });
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      const text = await res.text();
      
      setStatus(`✅ Connected! (${duration}s)`);
      setDetails(`Status: ${res.status}\nResponse: ${text}\nTime: ${duration} seconds`);
      
      console.log("✅ Connection successful:", {
        status: res.status,
        response: text,
        duration: `${duration}s`
      });
    } catch (err) {
      setStatus(`❌ Failed`);
      setDetails(`Error: ${err.message}\n\nThis usually means:\n- Backend is sleeping (wait 30-60s)\n- Network issue\n- CORS problem\n\nCheck console (F12) for details.`);
      
      console.error("❌ Connection failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f172a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-8">
        <h1 className="text-2xl font-semibold text-[#1a1d29] dark:text-white mb-4">
          Backend Connection Test
        </h1>
        
        <div className="mb-4">
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-2">
            API URL: <code className="bg-[#f1f5f9] dark:bg-[#0f172a] px-2 py-1 rounded text-xs">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}
            </code>
          </p>
        </div>

        <button
          onClick={testConnection}
          className="w-full px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium mb-4"
        >
          Test Connection
        </button>

        <div className="mt-4">
          <p className="text-sm font-medium text-[#1a1d29] dark:text-white mb-2">
            Status: {status}
          </p>
          {details && (
            <pre className="text-xs bg-[#f1f5f9] dark:bg-[#0f172a] p-3 rounded border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] whitespace-pre-wrap">
              {details}
            </pre>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[#e2e8f0] dark:border-[#334155]">
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
            💡 Tip: If connection fails, wait 30-60 seconds and try again. 
            Render free tier services sleep after inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}

