const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function quartzToStandardCron(expression: string): string {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 6) throw new Error('Expected a six-field Quartz expression');
    parts[5] = parts[5].replace(/\d+/g, (number, offset, field) => {
        if (field[offset - 1] === '/') return number;
        const day = Number(number);
        if (day < 1 || day > 7) throw new Error('Invalid Quartz weekday');
        return DAYS[day - 1];
    });
    return parts.join(' ');
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
