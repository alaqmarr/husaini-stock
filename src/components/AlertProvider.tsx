"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
}

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = useCallback((type: AlertType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Overwrite previous alerts so we only show one modal at a time, or keep them stacked. 
    // Usually modals are one at a time.
    setAlerts([{ id, type, title, message }]);
  }, []);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alerts.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="relative flex flex-col items-center p-8 text-center">
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  alert.type === 'success' ? 'bg-green-100 text-green-600' :
                  alert.type === 'error' ? 'bg-red-100 text-red-600' :
                  alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {alert.type === 'success' && <CheckCircle className="h-8 w-8" />}
                  {alert.type === 'error' && <XCircle className="h-8 w-8" />}
                  {alert.type === 'warning' && <AlertCircle className="h-8 w-8" />}
                  {alert.type === 'info' && <Info className="h-8 w-8" />}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{alert.title}</h3>
                {alert.message && <p className="text-slate-500 mb-6">{alert.message}</p>}

                <button
                  onClick={() => removeAlert(alert.id)}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                    alert.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    alert.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    alert.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Okay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
