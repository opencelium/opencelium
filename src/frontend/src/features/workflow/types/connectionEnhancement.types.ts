export interface FieldBinding {
	// Backend id; a method request refers to the binding's result as `#{%id%}`.
	id?: string;
	enhancement: Enhancement;
}

export interface Enhancement {
	enhanceId: string;
	description?: string;
	language: Language;
	script: string;
	args: Record<string, string>;
	/** Global variables the script sees under their own name; saved as enhancement args. */
	imports?: string[];
}

export const Language = {
	JavaScript: 'js',
	Python3: 'python3',
	Ruby: 'ruby',
} as const;

export type Language = (typeof Language)[keyof typeof Language];
