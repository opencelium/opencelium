// Reads "apply transformation for <field> with <description>" requests through a running gateway; reports wrong fields.
// Usage: node scripts/evalTransformation.ts [gatewayUrl]   (needs the gateway and Ollama running)
type Case = { prompt: string; field: string; describes: RegExp; fields?: string[]; isNamed?: boolean }

const FIELDS = [
    'ConfigItem.Number', 'ConfigItem.InciState', 'ConfigItem.DeplState', 'ConfigItem.Class', 'ConfigItem.Name',
    'ConfigItem.CIXMLData.Vendor', 'ConfigItem.CIXMLData.IdoitObjectID', 'ConfigItem.CIXMLData.SerialNumber', 'UserLogin',
]

/** A Microsoft Graph user body: short names, a dotted key, snake case. */
const GRAPH = ['@odata.id', 'role', 'test_prop', 'name', 'id', 'department']

const CASES: Case[] = [
    { prompt: 'apply transformation for vendor property with convert it to upper case', field: 'ConfigItem.CIXMLData.Vendor', describes: /upper/i },
    { prompt: 'apply transformation for ConfigItem.Name property with take only the first 50 characters', field: 'ConfigItem.Name', describes: /50/ },
    { prompt: 'apply a transformation for the serial number: remove all spaces', field: 'ConfigItem.CIXMLData.SerialNumber', describes: /space/i },
    { prompt: 'transform the idoit object id into a number', field: 'ConfigItem.CIXMLData.IdoitObjectID', describes: /number/i },
    { prompt: 'apply transformation for deployment state with map 1 to Production and everything else to Planned', field: 'ConfigItem.DeplState', describes: /production/i },
    { prompt: 'apply transformation for user login with lower case it', field: 'UserLogin', describes: /lower/i },
    { prompt: 'wende eine Transformation auf Vendor an: alles in Großbuchstaben', field: 'ConfigItem.CIXMLData.Vendor', describes: /gro(ß|ss)buchstaben|upper/i },
    { prompt: 'Transformation für ConfigItem.Name anwenden mit nur die ersten 50 Zeichen', field: 'ConfigItem.Name', describes: /50/ },
    { prompt: 'Transformation für die Seriennummer: Leerzeichen entfernen', field: 'ConfigItem.CIXMLData.SerialNumber', describes: /leerzeichen|space/i },
    { prompt: 'apply transformation for the price with round to two decimals', field: '', describes: /round|decimal/i, isNamed: true },
    { prompt: 'apply transformation for this property with convert to upper case', field: '', describes: /upper/i, isNamed: false },
    { prompt: 'apply transformation with convert it to lower case', field: '', describes: /lower/i, isNamed: false },
    { prompt: 'wende auf diese Eigenschaft eine Transformation an: in Kleinbuchstaben', field: '', describes: /klein|lower/i, isNamed: false },
    { prompt: 'apply transformation to convert it to a number', field: '', describes: /number/i, isNamed: false, fields: GRAPH },
    { prompt: 'create script to convert id to a number', field: 'id', describes: /number/i, fields: GRAPH },
    { prompt: 'create a script to uppercase the name', field: 'name', describes: /upper/i, fields: GRAPH },
    { prompt: 'create a transformation to take the first 10 characters', field: '', describes: /10/, isNamed: false, fields: GRAPH },
    { prompt: 'apply script to trim spaces', field: '', describes: /trim|space/i, isNamed: false, fields: GRAPH },
    { prompt: 'erstelle ein Skript, um es in eine Zahl umzuwandeln', field: '', describes: /zahl|number/i, isNamed: false, fields: GRAPH },
    { prompt: 'apply transformation for id property with convert it to a number', field: 'id', describes: /number/i, fields: GRAPH },
    { prompt: 'apply transformation for ID with convert it to a number', field: 'id', describes: /number/i, fields: GRAPH },
    { prompt: 'apply transformation for the odata id with prefix it with users/', field: '@odata.id', describes: /users/i, fields: GRAPH },
    { prompt: 'apply transformation for role property with lower case', field: 'role', describes: /lower/i, fields: GRAPH },
    { prompt: 'apply transformation for test prop with trim it', field: 'test_prop', describes: /trim/i, fields: GRAPH },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
let passed = 0
let totalMs = 0
for (const { prompt, field, describes, fields = FIELDS, isNamed } of CASES) {
    const started = Date.now()
    const response = await fetch(`${gateway}/workflow/transformation/intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, fields }),
    })
    totalMs += Date.now() - started
    const answer = (await response.json()) as { field: string; spokenField: string; description: string }
    if (answer.field === field && describes.test(answer.description) && (isNamed === undefined || Boolean(answer.spokenField) === isNamed)) passed++
    else console.log(`FAIL ${JSON.stringify(prompt)} -> ${JSON.stringify(answer.field)} (said ${JSON.stringify(answer.spokenField)}) ${JSON.stringify(answer.description)}, expected ${JSON.stringify(field)} ${describes}`)
}
console.log(`${passed}/${CASES.length} read correctly, ${(totalMs / CASES.length / 1000).toFixed(1)} s per request`)
process.exitCode = passed === CASES.length ? 0 : 1
