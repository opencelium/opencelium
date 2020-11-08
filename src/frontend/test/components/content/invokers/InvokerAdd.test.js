import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {BrowserRouter as Router} from "react-router-dom";
import renderer from 'react-test-renderer';
import {fromJS} from "immutable";
import InvokerAdd from "@components/content/invokers/add/InvokerAdd_nosub";

//const mockStore = configureStore([]);

describe('Render InvokerAdd Component', () => {
    test('it should show a subscription message', () => {
        const component = renderer.create(
            <InvokerAdd/>
        );
        let tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});