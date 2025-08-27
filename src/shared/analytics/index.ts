type AnalyticsEvent =
	| 'hero_cta_click'
	| 'cta_click'
	| 'portfolio_video_open'
	| 'portfolio_open'
	| 'invite_issued'
	| 'invite_redeemed'
	| 'subscription_selected'
	| 'page_view'

interface AnalyticsPayload {
	[key: string]: string | number | boolean
}

export const track = (event: AnalyticsEvent, payload?: AnalyticsPayload) => {
	if (process.env.NODE_ENV === 'development') {
		console.log(`[ANALYTICS] Event: ${event}`, payload)
	}
	// In a real application, you would send this data to an analytics service
	// e.g., Google Analytics, Mixpanel, Amplitude, etc.
	// Example: window.gtag('event', event, payload);
}

export const trackPageView = (path: string, title?: string) => {
	const payload: AnalyticsPayload = { path }
	if (title) {
		payload.title = title
	}
	track('page_view', payload)
}
