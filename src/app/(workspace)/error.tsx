"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error tracking service
    console.error("Workspace Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          System Notice
        </span>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          An unexpected error occurred while rendering this module. Your tenant data remains securely isolated and unaffected.
        </p>

        {error.message && (
          <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 text-xs text-gray-700 font-mono overflow-auto max-h-32">
            <span className="font-semibold text-gray-500 block mb-1">Details:</span>
            {error.message}
            {error.digest && (
              <span className="block mt-1 text-gray-400">Digest: {error.digest}</span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
