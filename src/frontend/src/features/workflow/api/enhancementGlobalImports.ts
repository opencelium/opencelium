// The backend takes an imported global variable as one more enhancement arg whose whole value is
// the reference: `//var normalizeDate = {{global.normalizeDate}};`. A script variable becomes a
// function of that name, any other variable its value.
const IMPORT_LINE = /^\s*\/\/\s*var\s+([A-Za-z_$][\w$]*)\s*=\s*\{\{global\.([A-Za-z][A-Za-z0-9_]*)\}\}\s*;?\s*$/;

export const toImportArgLines = (imports: string[]) =>
	imports.map((name) => `//var ${name} = {{global.${name}}};`);

export const parseImportArgs = (expertVar: unknown): string[] =>
	typeof expertVar === 'string'
		? expertVar.split('\n').flatMap((line) => {
			const match = line.match(IMPORT_LINE);
			return match ? [match[2]] : [];
		})
		: [];
