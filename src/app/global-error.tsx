"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            !
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Application Error
          </h1>

          <p className="text-slate-600 text-sm mb-6">
            A critical system exception was encountered. Please try refreshing or reloading the application.
          </p>

          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Reload Operra
          </button>
        </div>
      </body>
    </html>
  );
}
