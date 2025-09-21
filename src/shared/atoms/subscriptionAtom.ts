import { atom } from 'jotai'

export type SubscriptionTier = 'free' | 'producer' | 'production'

export const subscriptionAtom = atom<SubscriptionTier>('free')
