'use client';

interface PaymentAuthModalProps {
  isOpen: boolean;
  amount: number;
  vendorId: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function PaymentAuthModal({
  isOpen,
  amount,
  vendorId,
  onApprove,
  onReject
}: PaymentAuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Payment Authorization
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review payment details
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ${amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vendor ID</span>
            <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
              {vendorId}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          The purchasing agent is requesting permission to make a payment on your behalf. Do you authorize this transaction?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
