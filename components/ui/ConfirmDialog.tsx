'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }
    setIsOpen(false);
    setOptions(null);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
    }
    setIsOpen(false);
    setOptions(null);
    setResolver(null);
  };

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
          iconBg: 'bg-red-950/30',
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          iconBg: 'bg-yellow-950/30',
        };
      default:
        return {
          icon: 'ℹ️',
          confirmBtn: 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black hover:opacity-90',
          iconBg: 'bg-purple-950/30',
        };
    }
  };

  const styles = getVariantStyles(options?.variant);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal Overlay - Only render when open */}
      {isOpen && options && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative bg-[#0f0f14] rounded-lg shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border border-purple-900/30">
            <div className="p-6">
              {/* Icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
                <span className="text-2xl">{styles.icon}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {options.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-white/50 mb-6">
                {options.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border border-purple-900/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${styles.confirmBtn}`}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}
