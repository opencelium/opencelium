export const getMarker = (editor: any, value: any, searchString: any) => {
	const matches = [...value?.matchAll(`\\${searchString}`)];
	let result = [];
	for (let i = 0; i < matches.length; i++) {
		if (matches[i]?.index) {
			const start = editor.session.doc.indexToPosition(matches[i].index);
			const end = editor.session.doc.indexToPosition(
				matches[i].index + searchString.length,
			);
			result.push({
				startRow: start.row,
				startCol: start.column,
				endRow: end.row,
				endCol: end.column,
				className: 'error-ace-marker',
				type: 'text',
			});
		}
	}
	return result;
};
