import prisma from '../lib/prisma.js';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionDetail {
  hasActiveSubscription: boolean;
  plan: SubscriptionPlan | null;
  planId: 'basic' | 'pro' | 'premium' | 'premium-lengkap' | null;
  planName: string | null;
  planBadge: string | null;
  status: SubscriptionStatus | 'NONE';
  startDate: Date | null;
  endDate: Date | null;
  daysRemaining: number;
  canAccessDoctorConsultation: boolean;
  canAccessCameraScan: boolean;
}

const PLAN_CONFIG = {
  BASIC: {
    durationDays: 7,
    planId: 'basic' as const,
    planName: 'Paket Basic',
    planBadge: 'Basic',
    allowsDoctor: true,
    allowsCameraScan: false,
  },
  PRO: {
    durationDays: 30,
    planId: 'pro' as const,
    planName: 'Paket Pro',
    planBadge: 'Pro',
    allowsDoctor: true,
    allowsCameraScan: false,
  },
  PREMIUM: {
    durationDays: 90,
    planId: 'premium' as const,
    planName: 'Paket Premium',
    planBadge: 'Premium',
    allowsDoctor: true,
    allowsCameraScan: true,
  },
  PREMIUM_LENGKAP: {
    durationDays: 270,
    planId: 'premium-lengkap' as const,
    planName: 'Paket Premium+',
    planBadge: 'Premium+',
    allowsDoctor: true,
    allowsCameraScan: true,
  },
};

export const normalizePlanId = (input: string): SubscriptionPlan => {
  const clean = input.toLowerCase().trim().replace(/_/g, '-');
  switch (clean) {
    case 'basic':
      return 'BASIC';
    case 'pro':
      return 'PRO';
    case 'premium':
      return 'PREMIUM';
    case 'premium-lengkap':
    case 'premium_lengkap':
    case 'premiumlengkap':
    case 'premium+':
    case 'premium-plus':
    case 'premiumplus':
      return 'PREMIUM_LENGKAP';
    default:
      throw new Error(`Paket "${input}" tidak valid. Pilihan yang tersedia: basic, pro, premium, premium+ (premium-lengkap).`);
  }
};

export const getUserSubscription = async (userId: string): Promise<SubscriptionDetail> => {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    return {
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
  }

  const now = new Date();
  const isPastEndDate = now.getTime() >= sub.endDate.getTime();

  // Jika sudah melewati batas tanggal akhir tetapi status masih ACTIVE, ubah otomatis menjadi EXPIRED
  if (isPastEndDate && sub.status === 'ACTIVE') {
    await prisma.subscription.update({
      where: { userId },
      data: { status: 'EXPIRED' },
    });
    sub.status = 'EXPIRED';
  }

  const isActive = sub.status === 'ACTIVE' && !isPastEndDate;
  const config = PLAN_CONFIG[sub.plan];
  const daysRemaining = isActive 
    ? Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    hasActiveSubscription: isActive,
    plan: sub.plan,
    planId: config.planId,
    planName: config.planName,
    planBadge: config.planBadge,
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    daysRemaining,
    canAccessDoctorConsultation: isActive && config.allowsDoctor,
    canAccessCameraScan: isActive && config.allowsCameraScan,
  };
};

export const activateSubscription = async (userId: string, planInput: string): Promise<SubscriptionDetail> => {
  const plan = normalizePlanId(planInput);
  const config = PLAN_CONFIG[plan];
  
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + config.durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status: 'ACTIVE',
      startDate,
      endDate,
    },
    create: {
      userId,
      plan,
      status: 'ACTIVE',
      startDate,
      endDate,
    },
  });

  return getUserSubscription(userId);
};
