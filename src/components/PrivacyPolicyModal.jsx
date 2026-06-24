import { useState } from "react";
import { Shield, Check, X, AlertTriangle } from "lucide-react";

export default function PrivacyPolicyModal({ onAccept, onSkip }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!agreed) {
      setError("Please check the agreement checkbox before continuing.");
      return;
    }
    if (!onAccept) return;
    setLoading(true);
    setError("");
    try {
      await onAccept();
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl overflow-hidden" role="dialog" aria-label="Privacy policy acceptance">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-700">
              <Shield size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">HIPAA & NDHM Compliance Notice</h2>
              <p className="text-sm text-gray-500">Privacy Policy & Terms of Use</p>
            </div>
          </div>
          {onSkip && (
            <button onClick={onSkip} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5 max-h-72 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>HIPAA Compliance:</strong> This system contains Protected Health Information (PHI)
            governed by the Health Insurance Portability and Accountability Act. Access is restricted
            to authorized personnel only. Any unauthorized access, use, or disclosure of PHI is
            strictly prohibited and may result in civil and criminal penalties.
          </p>
          <p>
            <strong>NDHM (ABDM) Compliance:</strong> This system adheres to the National Digital
            Health Mission / Ayushman Bharat Digital Mission guidelines for the secure handling of
            digital health records. Patient consent is obtained prior to data sharing, and all
            records are maintained in accordance with the Health Data Management Policy.
          </p>
          <p>
            <strong>Data Privacy:</strong> Your account credentials are confidential. Do not share
            your password. All activities performed under your account are your responsibility.
            Session timeouts and audit trails are enforced for security.
          </p>
          <p>
            <strong>Acceptable Use:</strong> This system is intended for hospital operations and
            patient care purposes only. Unauthorized access, data extraction, or modification of
            records is forbidden and will be logged.
          </p>
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              I have read and understand the HIPAA and NDHM compliance policies. I agree to abide
              by all data privacy and security obligations.
            </span>
          </label>
        </div>

        {error && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          {onSkip && (
            <button
              onClick={onSkip}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Later
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check size={16} />
            )}
            {loading ? "Processing..." : "Accept & Continue"}
          </button>
        </div>
      </div>
    </>
  );
}
