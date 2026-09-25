export interface FieldBinding {
	enhancement: Enhancement;
}

export interface Enhancement {
	enhanceId: string;
	description?: string;
	language: Language;
	script: string;
	args: Record<string, string>;
}

export const Language = {
	JavaScript: 'js',
	Python3: 'python3',
	Ruby: 'ruby',
} as const;

export type Language = (typeof Language)[keyof typeof Language];
