export function jsonInputLocation(text: string): { line: number; column: number } {
	let position = 0;
	const whitespace = () => {
		while (/[\t\n\r ]/.test(text[position] ?? '') && position < text.length) position++;
	};
	const fail = (): never => {
		throw position;
	};
	const string = () => {
		if (text[position++] !== '"') fail();
		while (position < text.length) {
			const char = text[position++];
			if (char === '"') return;
			if (char.charCodeAt(0) < 32) {
				position--;
				fail();
			}
			if (char === '\\') {
				const escape = text[position++];
				if (escape === 'u') {
					for (let index = 0; index < 4; index++) {
						if (!/[\da-f]/i.test(text[position] ?? '')) fail();
						position++;
					}
				} else if (!escape || !'"\\/bfnrt'.includes(escape)) {
					position--;
					fail();
				}
			}
		}
		fail();
	};
	const value = (depth: number) => {
		whitespace();
		if (depth > 200) fail();
		const char = text[position];
		if (char === '"') {
			string();
			return;
		}
		if (char === '{' || char === '[') {
			const object = char === '{';
			const close = object ? '}' : ']';
			position++;
			whitespace();
			if (text[position] === close) {
				position++;
				return;
			}
			while (position < text.length) {
				if (object) {
					if (text[position] !== '"') fail();
					string();
					whitespace();
					if (text[position] !== ':') fail();
					position++;
				}
				value(depth + 1);
				whitespace();
				if (text[position] === close) {
					position++;
					return;
				}
				if (text[position] !== ',') fail();
				position++;
				whitespace();
			}
			fail();
		}
		const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
			text.slice(position),
		);
		if (!token) return fail();
		position += token[0].length;
	};
	try {
		value(0);
		whitespace();
		if (position !== text.length) fail();
	} catch (error) {
		if (typeof error === 'number') position = error;
	}
	const lines = text.slice(0, position).split('\n');
	return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}
