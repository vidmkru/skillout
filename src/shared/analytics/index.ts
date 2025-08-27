export type AnalyticsPayload = Record<string, unknown>

export function track(eventName: string, payload: AnalyticsPayload = {}) {
	try {
		if (typeof window !== 'undefined') {
			; (window as any).dataLayer = (window as any).dataLayer || []
				; (window as any).dataLayer.push({ event: eventName, ...payload, ts: Date.now() })
		}
		if (process.env.NODE_ENV !== 'production') {
			// eslint-disable-next-line no-console
			console.log('[analytics]', eventName, payload)
		}
	} catch { }
}
