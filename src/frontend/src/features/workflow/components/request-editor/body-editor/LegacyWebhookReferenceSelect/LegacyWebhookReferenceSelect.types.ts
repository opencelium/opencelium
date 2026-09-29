export type LegacyWebhookReferenceSelectProps = {
	value?: string;
	/** Stacking, for a host that is itself a dialog stacked above the default
	 *  antd z-index — same pattern as LegacyResponseFieldSelect.popupZIndex. */
	popupZIndex?: number;
	onChange: (value?: string) => void;
};
