import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";


export function initEntityI18n() {
    const entities = entityRegistry.getAll();

    entities.forEach(entity => {
        if (!entity.i18n) return;

        Object.entries(entity.i18n).forEach(([lang, translations]) => {
            i18n.addResourceBundle(
                lang,
                'entities',
                {
                    [entity.name]: translations
                },
                true,
                true
            );
        });
    });
}
