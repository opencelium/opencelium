/**
 * Per-method reference colours. A method's colour is its identity in every
 * stored reference (`#3F8AB4.(response).body.$.id`), so this list is only ever
 * *pruned* — never reordered for aesthetics — and a colour dropped from it stays
 * valid on a workflow that already saved it.
 *
 * Every entry clears 1.5:1 against both the light and the dark canvas surface,
 * which is what kept the near-whites (`#E6E6EA`, `#F9F871`) and the near-blacks
 * (`#112231`, `#003049`) out: assigned to a method, they drew arcs and swatches
 * that were invisible on one theme or the other. Duplicates are gone for the
 * same reason — two methods must not be able to look like each other. Note that
 * one hue cannot reach the 3:1 WCAG graphics ratio against *both* surfaces, so
 * a colour still has to survive being thin (see the arcs) or small (see
 * MethodColorDot, which rings its swatch) on its own.
 */
export const ALL_COLORS = [
	'#C77E7E', '#6477AB', '#98BEC7', '#9EC798',
	'#BFC798', '#F4B6C2', '#E41298', '#FE8A71',
	'#5FC798', '#AF28E4', '#E1C798', '#1FCFB5',
	'#F346C2', '#3477AB', '#44BEC7', '#5EC798',
	'#B12798', '#84B6C2', '#4173AB', '#BE8A71',
	'#DFC798', '#EF3798', '#11C798', '#F12FB5',
	'#C1227E', '#6122AB', '#912EC7', '#912798',
	'#6FC798', '#E123EA', '#277E7E', '#B45DE0',
	'#F456E4', '#328A71', '#F11798', '#A3210A',
	'#E33798', '#1363B0', '#93CDE0', '#456EC7',
	'#578998', '#687698', '#7543EA', '#8234C2',
	'#977DE0', '#5F3798', '#BF2A71', '#C723F6',
	'#D13298', '#B3CDE0', '#F512EA', '#1FCFB1',
	'#177EB1', '#1477B1', '#18BEB1', '#1EC7B1',
	'#1FC7B1', '#16E6B1', '#14B6B1', '#10E4B1',
	'#1E8AB1', '#11C7B1', '#1346B1', '#14BEB1',
	'#1173B1', '#1F37B1', '#112EF1', '#145DB1',
	'#1456B1', '#128AB1', '#5127B1', '#A321B1',
	'#4337B1', '#1363B1', '#13CDB1', '#156EB1',
	'#1789B1', '#1876B1', '#1543B1', '#1234B1',
	'#177DB1', '#1132B1', '#1F34B1', '#00C2A8',
	'#EA5455', '#D7263D', '#3A86FF', '#8338EC',
	'#06D6A0', '#FFBE0B', '#FB5607', '#FF006E',
	'#2EC4B6', '#FF7675', '#74B9FF', '#E84393',
	'#00CEC9', '#6C5CE7', '#00B894', '#E17055',
	'#0984E3', '#B33771', '#33D9B2', '#FFB142',
	'#34ACE0', '#706FD3', '#FF5252', '#48DBFB',
	'#1DD1A1', '#FF9FF3', '#F368E0', '#48C9B0',
	'#5DADE2', '#AF7AC5', '#DC7633', '#A93226',
	'#7D3C98', '#2471A3', '#17A589', '#229954',
	'#D4AC0D', '#CA6F1E', '#A04000', '#0E6251',
	'#196F3D', '#7D6608', '#784212', '#1F618D',
	'#117864', '#145A32', '#7E5109', '#873600',
	'#1B4F72', '#0B5345', '#E63946', '#457B9D',
	'#8AC926', '#1982C4', '#6A4C93', '#FF595E',
	'#FF924C', '#CDB4DB', '#A2D2FF', '#E76F51',
	'#2A9D8F', '#264653', '#F4A261', '#E9C46A',
	'#E5383B', '#BA181B', '#A4161A', '#B1A7A6',
	'#F72585', '#B5179E', '#7209B7', '#3F37C9',
	'#4361EE', '#4895EF', '#4CC9F0', '#52B788',
	'#40916C', '#2D6A4F', '#F77F00', '#FCBF49',
	'#D62828', '#F3722C', '#F8961E', '#F9844A',
	'#F9C74F', '#90BE6D', '#43AA8B', '#577590',
	'#277DA1', '#9B5DE5', '#F15BB5', '#00BBF9',
	'#D65DB1', '#845EC2', '#2C73D2', '#0081CF',
	'#0089BA', '#008E9B', '#4B4453', '#C34A36',
	'#FF8066', '#FF9671', '#008F7A', '#B39CD0',
	'#0F4C5C', '#E36414', '#9A031E', '#2ECF6E',
	'#F72525', '#3C6E71', '#FF9F1C', '#6A994E',
	'#BC4749', '#8D99AE',
];
