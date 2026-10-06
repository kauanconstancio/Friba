import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 4000
) => {
  const toast: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    message,
    type,
    duration,
  };
  listeners.forEach(fn => fn(toast));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast: ToastListener = (toast) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="friba-toast-container" aria-live="polite">
      {toasts.map(toast => {
        let Icon = Info;
        let borderColor = 'rgba(11, 95, 255, 0.4)';
        let glowColor = 'rgba(11, 95, 255, 0.2)';
        let iconColor = '#3B82F6';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'rgba(16, 185, 129, 0.5)';
          glowColor = 'rgba(16, 185, 129, 0.25)';
          iconColor = '#10B981';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'rgba(239, 68, 68, 0.5)';
          glowColor = 'rgba(239, 68, 68, 0.25)';
          iconColor = '#EF4444';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderColor = 'rgba(245, 158, 11, 0.5)';
          glowColor = 'rgba(245, 158, 11, 0.25)';
          iconColor = '#F59E0B';
        }

        return (
          <div
            key={toast.id}
            className={`friba-toast-item friba-toast-${toast.type}`}
            style={{
              borderColor,
              boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px 0 ${glowColor}`,
            }}
          >
            <div className="toast-icon-wrapper" style={{ color: iconColor }}>
              <Icon size={20} />
            </div>

            <div className="toast-message-content">
              {toast.message}
            </div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      <style>{`
        .friba-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 440px;
          width: calc(100vw - 48px);
          pointer-events: none;
        }

        .friba-toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(10, 15, 29, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid;
          color: #F8FAFC;
          font-size: 0.92rem;
          font-weight: 500;
          line-height: 1.4;
          animation: fribaToastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.25s ease;
        }

        .toast-icon-wrapper {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-message-content {
          flex: 1;
          word-break: break-word;
        }

        .toast-close-btn {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .toast-close-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes fribaToastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
