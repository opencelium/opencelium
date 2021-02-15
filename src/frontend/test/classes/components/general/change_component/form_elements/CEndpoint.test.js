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
    it('split with one local reference in the beginning and some text after', () => {
        const endpointValue = '{%#010101.(response).success.age%}/test/hello';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']);
        const expected = [{isLocalReference: true, value: '{%#010101.(response).success.age%}'}, {value: '/test/hello'}];
        expect(received).toEqual(expected);
    });
    it('split with wrong local reference format', () => {
        const endpointValue = '{%#2G222.(response).success.result.id%}';
        const received = CEndpoint.divideEndpointValueByReferences(endpointValue, ['url', 'UserLogin', 'Password']);
        const expected = [{value: '{%#2F222.(response).success.result.id%}'}];
        expect(received).toEqual(expected);
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. unusual coming data', () => {
    it('empty endpoint value', () => {
        const received = CEndpoint.isChangingReference(0, '', []);
        expect(received).toBeFalsy();
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. invoker reference is in the beginning', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(0, '{url}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(1, '{url}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(2, '{url}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(3, '{url}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after reference', () => {
        const received = CEndpoint.isChangingReference(4, '{url}/open/test', ['url']);
        expect(received).toBeFalsy();
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. invoker reference is in the middle', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(5, 'open/{url}/test', ['url']);
        expect(received).toBeFalsy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(6, 'open/{url}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(7, 'open/{url}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(8, 'open/{url}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after of reference', () => {
        const received = CEndpoint.isChangingReference(9, 'open/{url}/test', ['url']);
        expect(received).toBeFalsy();
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. invoker reference is in the end', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(10, 'open/test/{url}', ['url']);
        expect(received).toBeFalsy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(11, 'open/test/{url}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(12, 'open/test/{url}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(13, 'open/test/{url}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after of reference', () => {
        const received = CEndpoint.isChangingReference(14, 'open/test/{url}', ['url']);
        expect(received).toBeFalsy();
    });
});


describe('Class Endpoint for FormMethods: isChangingReference. local reference is in the beginning', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(0, '{%#010101.(response).success.age%}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(1, '{%#010101.(response).success.age%}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(2, '{%#010101.(response).success.age%}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(3, '{%#010101.(response).success.age%}/open/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after reference', () => {
        const received = CEndpoint.isChangingReference(4, '{%#010101.(response).success.age%}/open/test', ['url']);
        expect(received).toBeFalsy();
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. local reference is in the middle', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(5, 'open/{%#010101.(response).success.age%}/test', ['url']);
        expect(received).toBeFalsy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(6, 'open/{%#010101.(response).success.age%}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(7, 'open/{%#010101.(response).success.age%}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(8, 'open/{%#010101.(response).success.age%}/test', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after of reference', () => {
        const received = CEndpoint.isChangingReference(9, 'open/{%#010101.(response).success.age%}/test', ['url']);
        expect(received).toBeFalsy();
    });
});

describe('Class Endpoint for FormMethods: isChangingReference. local reference is in the end', () => {
    it('caret position is before reference', () => {
        const received = CEndpoint.isChangingReference(10, 'open/test/{%#010101.(response).success.age%}', ['url']);
        expect(received).toBeFalsy();
    });
    it('caret position is in the beginning of reference', () => {
        const received = CEndpoint.isChangingReference(11, 'open/test/{%#010101.(response).success.age%}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the middle of reference', () => {
        const received = CEndpoint.isChangingReference(12, 'open/test/{%#010101.(response).success.age%}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is in the end of reference', () => {
        const received = CEndpoint.isChangingReference(13, 'open/test/{%#010101.(response).success.age%}', ['url']);
        expect(received).toBeTruthy();
    });
    it('caret position is after of reference', () => {
        const received = CEndpoint.isChangingReference(14, 'open/test/{%#010101.(response).success.age%}', ['url']);
        expect(received).toBeFalsy();
    });
});