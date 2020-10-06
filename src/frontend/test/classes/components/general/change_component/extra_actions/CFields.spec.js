import CFields from '../../../../../../app/classes/components/general/change_component/extra_actions/CFields';

describe.skip('Get LoopLength for Fields. Three loops', () => {

    it('Middle value', () => {
        const received = CFields.getLoopLength(68, [3, 6, 4]);
        const expected = '3|6|1';
        expect(received).toBe(expected);
    });
    it('Middle value. v2', () => {
        const received = CFields.getLoopLength(69, [3, 6, 4]);
        const expected = '3|6|2';
        expect(received).toBe(expected);
    });
    it('Middle value. v3', () => {
        const received = CFields.getLoopLength(70, [3, 6, 4]);
        const expected = '3|6|3';
        expect(received).toBe(expected);
    });
    it('Middle value. v4', () => {
        const received = CFields.getLoopLength(67, [3, 6, 4]);
        const expected = '3|5|4';
        expect(received).toBe(expected);
    });
    it('Min value', () => {
        const received = CFields.getLoopLength(0, [3, 6, 4]);
        const expected = '1|1|1';
        expect(received).toBe(expected);
    });
    it('Max value', () => {
        const received = CFields.getLoopLength(72, [3, 6, 4]);
        const expected = '3|6|4';
        expect(received).toBe(expected);
    });
});

describe.skip('Get LoopLength for Fields. Two loops', () => {

    it('Middle value', () => {
        const received = CFields.getLoopLength(16, [3, 6]);
        const expected = '3|5';
        expect(received).toBe(expected);
    });
    it('Middle value. v2', () => {
        const received = CFields.getLoopLength(15, [3, 6]);
        const expected = '3|4';
        expect(received).toBe(expected);
    });
    it('Middle value. v3', () => {
        const received = CFields.getLoopLength(14, [3, 6]);
        const expected = '3|3';
        expect(received).toBe(expected);
    });
    it('Middle value. v4', () => {
        const received = CFields.getLoopLength(13, [3, 6]);
        const expected = '3|2';
        expect(received).toBe(expected);
    });
    it('Min value', () => {
        const received = CFields.getLoopLength(0, [3, 6]);
        const expected = '1|1';
        expect(received).toBe(expected);
    });
    it('Max value', () => {
        const received = CFields.getLoopLength(18, [3, 6]);
        const expected = '3|6';
        expect(received).toBe(expected);
    });
});