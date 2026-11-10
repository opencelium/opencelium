const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const FIELD_MAXIMA = [59, 59, 23, 31, 12, 7];

function normalizeQuartzRange(item: string, index: number): string {
    const match = /^(\d+|[a-z]{3}|\*)(?:-(\d+|[a-z]{3}))?(?:\/(\d+))?$/i.exec(item);
    if (!match) return item;

    const [, start, end, increment] = match;
    const min = index < 3 ? 0 : 1;
    const max = FIELD_MAXIMA[index];
    const names = index === 4 ? MONTHS : index === 5 ? DAYS : [];
    const named = /^[a-z]/i.test(start);
    const step = named || !increment ? 1 : Number(increment);
    if (step === 0) throw new Error('Invalid Quartz increment');
    if (!end) {
        if (named) return start;
        if (index !== 5 || !increment) return item;
        const first = start === '*' ? min : Number(start);
        return first === max ? start : `${first}-${max}/${increment}`;
    }

    const first = named ? names.indexOf(start.toUpperCase()) + 1 : Number(start);
    const last = named ? names.indexOf(end.toUpperCase()) + 1 : Number(end);
    if (!Number.isInteger(first) || !Number.isInteger(last) ||
        first < min || first > max || last < min || last > max) {
        throw new Error('Invalid Quartz range');
    }
    if (first <= last) return named ? `${start}-${end}` : item;

    const width = max - min + 1;
    const values = [];
    for (let value = first; value <= last + width; value += step) {
        values.push((value - min) % width + min);
    }
    return values.join(',');
}

export function quartzToStandardCron(expression: string): string {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 6) throw new Error('Expected a six-field Quartz expression');
    const dayOfMonth = parts[3];
    const dayOfWeek = parts[5];
    if ((dayOfMonth === '?') === (dayOfWeek === '?') ||
        parts.some((field, index) => field.includes('?') && (field !== '?' || (index !== 3 && index !== 5)))) {
        throw new Error('Specify either the day of month or the day of week');
    }
    if (parts.slice(0, 3).some(field => /h/i.test(field)) || /h/i.test(dayOfMonth)) {
        throw new Error('Quartz does not support hashed time fields');
    }
    const fields = parts.map((part, index) => part.split(',').map(item => normalizeQuartzRange(item, index)).join(','));
    fields[5] = fields[5].replace(/^L$/i, 'SAT').replace(/\d+/g, (number, offset, field) => {
        if (field[offset - 1] === '/' || field[offset - 1] === '#') return number;
        const day = Number(number);
        if (day < 1 || day > 7) throw new Error('Invalid Quartz weekday');
        return DAYS[day - 1];
    });
    return fields.join(' ');
}

export function quartzToPickerCron(expression: string): string {
    if (!expression.trim()) return '';
    const parts = quartzToStandardCron(expression).split(' ').slice(1);
    const maxima = [59, 23, 31, 12, 6];
    return parts.map((part, index) => part.replace(/\?/g, '*').replace(
        /(^|,)(\d+)\/(\d+)/g,
        (_, prefix, start, step) => `${prefix}${start}-${maxima[index]}/${step}`,
    )).join(' ');
}
