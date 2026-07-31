// scripts/generate-server.cjs
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

// Настройка сохранения картинок
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../src/assets/images/wizard');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });
const app = express();
app.use(cors()); // Чтобы фронтенд на 5173 мог слать запросы на 3001
app.use(express.json());
// scripts/generate-server.cjs

function updateRegistry(entityName) {
    const REGISTRY_PATH = path.join(__dirname, '../src/engine/entity/entityRegistration.ts');
    let content = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    const importName = `${entityName}Definition`;
    const importPath = `@/entities/${entityName}/${entityName}.definition`;

    // 1. Проверяем импорт
    if (!content.includes(importPath)) {
        // Вставляем импорт в самое начало файла
        content = `import { ${importName} } from '${importPath}';\n` + content;
    }

    // 2. Проверяем регистрацию внутри функции
    // Ищем вызов именно этой сущности. Если его нет — добавляем.
    const registerCall = `entityRegistry.register(${importName});`;

    if (!content.includes(registerCall)) {
        // Регулярка ищет тело функции registerEntities() { ... }
        // и вставляет регистрацию ПЕРЕД последней закрывающей скобкой функции
        content = content.replace(
            /(export function registerEntities\(\) \{[\s\S]*?)(\})/,
            `$1    ${registerCall}\n$2`
        );
    }

    fs.writeFileSync(REGISTRY_PATH, content);
}
// scripts/generate-server.cjs

function formatCrossValidations(validations) {
    if (!validations || !Array.isArray(validations)) return 'undefined';

    const items = validations.map(v => {
        let str = JSON.stringify(v, null, 4);

        // Превращаем строку validate в живую функцию
        if (v.validate) {
            str = str.replace(
                /"validate":\s*"(.*)"/,
                `"validate": ${v.validate}`
            );
        }
        return str;
    });

    return `[${items.join(', ')}]`;
}
function formatApi(api) {
    if (!api) return '{}';

    let str = JSON.stringify(api, null, 4);

    // Список полей, которые являются функциями
    const funcFields = ['resolveIdentifier', 'mapToForm', 'mapToApi'];

    funcFields.forEach(field => {
        if (api[field] && api[field].trim() !== '') {
            // Удаляем кавычки вокруг значения функции, чтобы сделать её живым кодом
            // Ищем паттерн "fieldName": "function content"
            const regex = new RegExp(`("${field}":\\s*)"([\\s\\S]*?)"`, 'g');
            str = str.replace(regex, (match, p1, p2) => {
                // p2 может содержать экранированные кавычки \", возвращаем их обратно
                const unescaped = p2.replace(/\\"/g, '"').replace(/\\n/g, '\n');
                return `${p1}${unescaped}`;
            });
        }
    });

    return str;
}
function formatPolicy(access) {
    if (!access) return 'undefined';

    const rules = access.rules.map(rule => {
        let ruleStr = JSON.stringify(rule, null, 4);

        // Если есть condition, превращаем строку в реальную стрелочную функцию в коде
        if (rule.condition && rule.condition.trim() !== '') {
            ruleStr = ruleStr.replace(
                /"condition":\s*"(.*)"/,
                `"condition": ${rule.condition}`
            );
        }
        return ruleStr;
    });

    return `{
        strategy: "${access.strategy || 'hide'}",
        rules: [${rules.join(', ')}]
    }`;
}
function formatWizardModes(modes) {
    if (!modes) return 'undefined';

    const cleanModes = {};

    Object.entries(modes).forEach(([key, config]) => {
        // Если чекбокс enabled был нажат
        if (config.enabled) {
            const { enabled, infoContent, ...rest } = config;

            cleanModes[key] = {
                ...rest,
                // Превращаем плоское поле infoContent в массив PartialStepProps
                info: infoContent ? [{ content: infoContent }] : []
            };
        }
    });

    return JSON.stringify(cleanModes, null, 4);
}
app.post('/api/generate-entity', (req, res) => {
    try {
        const {definition} = req.body;
        const {
            name,
            plural,
            api,
            fields,
            access,
            sections,
            wizard,
            crossValidations,
        } = definition;
        console.log(req.body)
        if (!name) {
            return res.status(400).json({ success: false, error: "Name is required" });
        }
        let imagePath = '';
        if (req.file) {
            // Формируем путь для импорта в TS файле
            imagePath = `@/assets/images/wizard/${req.file.filename}`;
        }
        const entityName = name.toLowerCase();
        const targetDir = path.join(__dirname, `../src/entities/${entityName}`);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 2. Формируем дефолтные значения, если чего-то нет в запросе
        const finalPlural = plural || `${entityName}s`;
        const finalSections = sections || [
            { id: 'main', fields: fields?.map(f => f.name) || [] }
        ];
        const finalWizard = wizard || {
            steps: [{ id: 'step1', header: 'General', sectionIds: ['main'] }]
        };

        // 3. Генерируем файл с реальными данными
        const fileContent = `
import { EntityDefinition } from '@/engine/entity/EntityDefinition';
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands';

export const ${entityName}Definition: EntityDefinition = {
    name: '${name}',
    plural: '${finalPlural}',
    crossValidations: ${formatCrossValidations(crossValidations)}
    api: ${formatApi(api)},
    access: ${formatPolicy(access)},
    fields: ${JSON.stringify(fields, null, 4)},
    sections: ${JSON.stringify(finalSections, null, 4)},
    wizard: {
        image: ${imagePath ? `require('${imagePath}')` : 'undefined'},
        steps: ${JSON.stringify(wizard.steps.map(s => ({
            ...s,
            info: s.infoContent ? [{ content: s.infoContent }] : []
        })), null, 4)},
        modes: ${formatWizardModes(wizard.modes)},
    }
    commands: (def) => createEntityCommands({ def })
};
`.trim();

        fs.writeFileSync(path.join(targetDir, `${entityName}.definition.ts`), fileContent);

        // Обновляем регистратор (функция updateRegistry из предыдущего шага)
        updateRegistry(entityName);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Generator server running at http://localhost:${PORT}`);
});
