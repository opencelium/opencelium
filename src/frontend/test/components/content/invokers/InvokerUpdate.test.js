import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {BrowserRouter as Router} from "react-router-dom";
import renderer from 'react-test-renderer';
import {fromJS} from "immutable";
import InvokerUpdate from "../../../../app/components/content/invokers/update/InvokerUpdate";

//const mockStore = configureStore([]);

describe('Render InvokerUpdate Component', () => {
    test('it should show a subscription message', () => {
        const component = renderer.create(
            <InvokerUpdate/>
        );
        let tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});