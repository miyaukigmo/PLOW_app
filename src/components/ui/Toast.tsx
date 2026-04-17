import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info } from '@phosphor-icons/react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const ICON_MAP = {
    success: <CheckCircle weight="fill" color="#10B981" size={20} />,
    error: <XCircle weight="fill" color="#EF4444" size={20} />,
    info: <Info weight="fill" color="#3B82F6" size={20} />,
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: '#222222',
              border: '1px solid #333333',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#E6E6E6',
              minWidth: '280px',
              animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {ICON_MAP[toast.type]}
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) }
          to { opacity: 1; transform: translateX(0) }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
