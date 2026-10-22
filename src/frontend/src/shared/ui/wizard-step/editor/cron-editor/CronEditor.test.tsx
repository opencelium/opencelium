import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {FormProvider, useForm} from 'react-hook-form';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {CronEditor} from './CronEditor';
vi.mock('@shared/ui/form/FormInput', () => ({
    FormInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
function Harness({initial = '', view = false}: {initial?: string; view?: boolean}) {
    const form = useForm({defaultValues: {cron: initial}});
    return <FormProvider {...form}>
        <CronEditor name="cron" mode={view ? 'view' : 'update'} />
        <button onClick={() => form.reset({cron: '0 0/5 * * * ?'})}>Reset form</button>
    </FormProvider>;
}
describe('CronEditor with the real picker', () => {
    beforeAll(() => vi.stubGlobal('ResizeObserver', class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }));
    afterAll(() => vi.unstubAllGlobals());
    it.each(['0 0/2 * * * ?', '0 0/5 * * * ?', '0 0 7 ? * MON-FRI', '0 0 7 ? * 2-6', ' 0  0/5 * * * ? '])(
        'preserves stored and typed expression %s', async (expression) => {
            const {unmount} = render(<Harness initial={expression} />);
            await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(expression));
            fireEvent.change(screen.getByRole('textbox'), {target: {value: ''}});
            fireEvent.change(screen.getByRole('textbox'), {target: {value: expression}});
            await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(expression));
            unmount();
        },
    );
    it('preserves external resets and allows explicit clearing', async () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Reset form'));
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('0 0/5 * * * ?'));
        fireEvent.click(screen.getByRole('button', {name: 'Clear'}));
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
    });
    it('writes a Quartz-safe expression after an explicit weekday selection', async () => {
        render(<Harness initial="0 0 7 ? * MON" />);
        const selects = screen.getAllByRole('combobox');
        fireEvent.mouseDown(selects[1].closest('.ant-select')!.querySelector('.ant-select-content') ?? selects[1]);
        const option = await screen.findByText('Tuesday', {selector: '.ant-select-item-option-content'});
        fireEvent.click(option);
        await waitFor(() => expect(screen.getByRole('textbox').getAttribute('value')).toContain('MON-TUE'));
    });
    it.each(['not a cron', '0 0 7 L * ?', '0 0 7 ? * MON#2', '0 0 7 ? * MON 2027'])(
        'keeps unsupported input %s for backend validation', (expression) => {
            render(<Harness initial={expression} />);
            expect(screen.getByRole('textbox')).toHaveValue(expression);
        },
    );
    it('hides the generator in view mode', () => {
        render(<Harness initial="0 0/5 * * * ?" view />);
        expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
        expect(screen.queryByRole('button', {name: 'Clear'})).not.toBeInTheDocument();
    });
});
