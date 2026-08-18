import {
  OperatorType,
  type Connection,
  type LoopOperatorWithId,
  type MethodWithId,
  type OperatorWithId,
} from '../../../types/connection';

export const ITERATOR_NAMES = [
  'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'ii', 'ij', 'ik', 'il', 'im', 'in', 'io', 'ip', 'iq', 'ir', 'is', 'it', 'iu', 'iv', 'iw', 'ix', 'iy', 'iz',
];

const parseIndexPath = (value: unknown) => String(value ?? '').split('_')
  .map((part) => Number(part))
  .map((part) => (Number.isFinite(part) ? part : 0));

const compareIndex = (left?: unknown, right?: unknown) => {
  const leftPath = parseIndexPath(left);
  const rightPath = parseIndexPath(right);
  const length = Math.max(leftPath.length, rightPath.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftPath[index] ?? -1;
    const rightPart = rightPath[index] ?? -1;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }
  return leftPath.length - rightPath.length;
};

const isLoopOperator = (operator: OperatorWithId | undefined): operator is LoopOperatorWithId =>
  operator?.type === OperatorType.Loop;

export const getIteratorsForIndex = (connection: Connection, targetIndex?: string): string[] => {
  if (!targetIndex) return [];
  const splitMethodIndex = targetIndex.split('_');
  const previousOperatorIndex = splitMethodIndex.length === 1
    ? '-1'
    : splitMethodIndex.slice(0, -1).join('_');
  const operators = [...connection.fromConnector.operator]
    .sort((left, right) => compareIndex(left.index, right.index));
  let operatorIndex = operators.findIndex((operator) => operator.index === previousOperatorIndex);
  if (operatorIndex === -1) return [];
  while (operators[operatorIndex]?.type !== 'loop' && operatorIndex > 0) operatorIndex -= 1;
  const operator = operators[operatorIndex];
  const iteratorName = isLoopOperator(operator) ? operator.iterator : undefined;
  if (!iteratorName || !ITERATOR_NAMES.includes(iteratorName)) return [];
  return ITERATOR_NAMES.slice(0, ITERATOR_NAMES.indexOf(iteratorName) + 1);
};

export const getIteratorsForMethod = (
  connection: Connection,
  method: MethodWithId | undefined,
): string[] => getIteratorsForIndex(connection, method?.index);
