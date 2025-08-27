import { atom } from 'jotai'

export type SubscriptionTier = 'free' | 'producer' | 'creator-pro'

export const subscriptionAtom = atom<SubscriptionTier>('free')
