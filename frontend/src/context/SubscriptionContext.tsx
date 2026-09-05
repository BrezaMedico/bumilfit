import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export interface SubscriptionData {
  hasActiveSubscription: boolean;
  plan: 'BASIC' | 'PRO' | 'PREMIUM' | 'PREMIUM_LENGKAP' | null;
  planId: 'basic' | 'pro' | 'premium' | 'premium-lengkap' | null;
  planName: string | null;
  planBadge: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  canAccessDoctorConsultation: boolean;
  canAccessCameraScan: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionData;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  canAccessDoctorConsultation: boolean;
  canAccessCameraScan: boolean;
  activePlanId: 'basic' | 'pro' | 'premium' | 'premium-lengkap' | null;
  activePlanName: string | null;
  planBadge: string | null;
  daysRemaining: number;
  endDateFormatted: string | null;
  refreshSubscription: () => Promise<SubscriptionData | null>;
  activatePlan: (planId: string) => Promise<{ success: boolean; message: string }>;
}

const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  hasActiveSubscription: false,
  plan: null,
  planId: null,
  planName: null,
  planBadge: null,
  status: 'NONE',
  startDate: null,
  endDate: null,
  daysRemaining: 0,
  canAccessDoctorConsultation: false,
  canAccessCameraScan: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async (): Promise<SubscriptionData | null> => {
    try {
      const response = await apiClient.get('/subscription/current');
      const data: SubscriptionData = response.data;
      setSubscription(data);
      return data;
    } catch (error) {
      // Jika belum login atau error, set ke default
      setSubscription(DEFAULT_SUBSCRIPTION);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const activatePlan = async (planId: string) => {
    try {
      const response = await apiClient.post('/subscription/activate', { planId });
      const updatedSub: SubscriptionData = response.data.subscription;
      setSubscription(updatedSub);
      return {
        success: true,
        message: response.data.message || 'Langganan berhasil diaktifkan.',
      };
    } catch (error: any) {
      console.error('Gagal aktivasi langganan:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengaktifkan langganan.',
      };
    }
  };

  const endDateFormatted = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        hasActiveSubscription: subscription.hasActiveSubscription,
        canAccessDoctorConsultation: subscription.canAccessDoctorConsultation,
        canAccessCameraScan: subscription.canAccessCameraScan,
        activePlanId: subscription.planId,
        activePlanName: subscription.planName,
        planBadge: subscription.planBadge,
        daysRemaining: subscription.daysRemaining,
        endDateFormatted,
        refreshSubscription: fetchSubscription,
        activatePlan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription harus digunakan di dalam SubscriptionProvider');
  }
  return context;
};
