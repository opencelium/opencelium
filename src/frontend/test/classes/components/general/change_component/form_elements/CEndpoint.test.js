import CEndpoint from "@classes/components/general/change_component/form_elements/CEndpoint";

describe('Class Endpoint for FormMethods: split references and text', () => {
    it('split empty string', () => {
        const endpointValue = '';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue).map(item => item.value);
        const expected = [];
        expect(received).toEqual(expected);
    });
    it('split with one local reference', () => {
        const endpointValue = '{%#111111.(response).success.result.id%}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue).map(item => item.value);
        const expected = ['{%#111111.(response).success.result.id%}'];
        expect(received).toEqual(expected);
    });
    it('split with three local references and text in between', () => {
        const endpointValue = '{%#111111.(response).success.result.id%}/ConfigItem/{%#222222.(response).success.result.id%}/Create/{%#333333.(response).success.result.id%}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue).map(item => item.value);
        const expected = ['{%#111111.(response).success.result.id%}', '/ConfigItem/', '{%#222222.(response).success.result.id%}', '/Create/', '{%#333333.(response).success.result.id%}'];
        expect(received).toEqual(expected);
    });
    it('split with three local references and three invoker references', () => {
        const endpointValue = '{%#111111.(response).success.result.id%}/{url}/ConfigItem/{%#222222.(response).success.result.id%}/Create{UserLogin}/{%#333333.(response).success.result.id%}/{Password}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']).map(item => item.value);
        const expected = ['{%#111111.(response).success.result.id%}', '/', '{url}', '/ConfigItem/', '{%#222222.(response).success.result.id%}', '/Create', '{UserLogin}', '/', '{%#333333.(response).success.result.id%}', '/', '{Password}'];
        expect(received).toEqual(expected);
    });
    it('split with three local references and 2 invoker references', () => {
        const endpointValue = '{%#111111.(response).success.result.id%}/{url}/ConfigItem/{%#222222.(response).success.result.id%}/Create{UserLogin}/{%#333333.(response).success.result.id%}/{Password';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']).map(item => item.value);
        const expected = ['{%#111111.(response).success.result.id%}', '/', '{url}', '/ConfigItem/', '{%#222222.(response).success.result.id%}', '/Create', '{UserLogin}', '/', '{%#333333.(response).success.result.id%}', '/{Password'];
        expect(received).toEqual(expected);
    });
    it('split with three local references and 1 invoker reference', () => {
        const endpointValue = '{%#111111.(response).success.result.id%}/{url/ConfigItem/{%#222222.(response).success.result.id%}/Create{UserLogin}/{%#333333.(response).success.result.id%}/{Password';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']);
        const expected = [{isLocalReference: true, value: '{%#111111.(response).success.result.id%}'}, {value: '/{url/ConfigItem/'}, {isLocalReference: true, value: '{%#222222.(response).success.result.id%}'}, {value: '/Create'}, {isInvokerReference: true, value: '{UserLogin}'}, {value: '/'}, {isLocalReference: true, value: '{%#333333.(response).success.result.id%}'}, {value: '/{Password'}];
        expect(received).toEqual(expected);
    });
    it('split with invoker reference in the beginning and in the end', () => {
        const endpointValue = '{url}/ConfigItem//Create//{UserLogin}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']);
        const expected = [{isInvokerReference: true, value: '{url}'}, {value: '/ConfigItem//Create//'}, {isInvokerReference: true, value: '{UserLogin}'}];
        expect(received).toEqual(expected);
    });
    it('split with wrong local reference format', () => {
        const endpointValue = '{%#2G222.(response).success.result.id%}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']);
        const expected = [{value: '{%#2F222.(response).success.result.id%}'}];
        expect(received).toEqual(expected);
    });
});