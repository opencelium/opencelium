import type {I18nNamespace} from "@shared/i18n/types/namespaces.ts";
import type {LeafKeys} from "@shared/i18n/types/types.ts";
import type {I18nSchema} from "@shared/i18n/types/schemes/schemes.ts";
import type {TypographyProps} from "@shared/ui/primitives/Typography/Typography.types.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {Typography} from "@shared/ui/primitives/Typography";

interface CreateTextProps {
    i18nKey: K;
    values?: unknown;
    typoProps?: Omit<TypographyProps, 'children'>,
}

export function createText<N extends I18nNamespace>(ns: N) {
    return function Text<
        K extends LeafKeys<I18nSchema[N]>
    >({
        i18nKey,
        values,
        typoProps,
      }: CreateTextProps) {
        const { t } = useI18n(ns);
        return (
            <Typography
                {...typoProps}
            >
                {t(i18nKey as string, values)}
            </Typography>
        );
    };
}
