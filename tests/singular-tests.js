import Singular from '../src/singular/singular';
import SingularConfig from '../src/singular/singularConfig';
import {LogLevel, Storage} from '../src/consts/constants';
import SingularInstance from "../src/singular/singularInstance";
import SingularState from "../src/singular/singularState";
import Utils from "../src/utils/utils";

const assert = require('assert');
const sinon = require('sinon');

window.crypto = require('@trust/webcrypto');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_productId';

describe('singular', () => {
    let config;

    beforeEach(() => {
        config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
        SingularState._instance = null;
        Singular._isInitialized = false;
        sessionStorage.clear();
        localStorage.clear();
        sinon.restore();
    });

    describe('init and custom user id', () => {
        it('should fail initializing Singular with null config', () => {
            let error = false;

            try {
                Singular.init(null);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should initialize Singular and send page visit', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.called, 'Page visit was not sent');
        });

        it('should initialize Singular, set customUserId and send page visit', () => {
            const customUserId = '1xx2xx3';
            config.withCustomUserId(customUserId);
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(stub.called, 'Page visit was not sent');
        });


        it('should initialize Singular, set customUserId with login', () => {
            const customUserId = '1xx2xx3';
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === null, 'CustomUserId should be empty');
            assert(stub.called, 'Page visit was not sent');

            Singular.login(customUserId);
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
        });

        it('should initialize Singular, set customUserId with the config and then override it with login', () => {
            const customUserId = '1xx2xx3';
            config.withCustomUserId(customUserId);
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(stub.called, 'Page visit was not sent');

            Singular.login("3xx2xx1");
            assert(SingularState.getInstance().getCustomUserId() === "3xx2xx1", 'CustomUserId was not set properly');
        });

        it('should initialize Singular, set customUserId with the config and then override it using login with empty string', () => {
            const customUserId = '1xx2xx3';
            config.withCustomUserId(customUserId);
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(stub.called, 'Page visit was not sent');

            Singular.login("");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
        });

        it('should initialize Singular, set customUserId with the config and then override it using login with null string', () => {
            const customUserId = '1xx2xx3';
            config.withCustomUserId(customUserId);
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(stub.called, 'Page visit was not sent');

            Singular.login(null);
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
        });

        it('should initialize Singular, send Page visit and then use a different config that will not send a page visit', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.called, 'Page visit was not sent');

            config = new SingularConfig(apiKey, "new secret", productId).withLogLevel(LogLevel.Debug);

            Singular.init(config);
            assert(stub.callCount === 1, 'Page visit was sent more than expected');
        });
    });

    describe('init and events', () => {
        it('should initialize Singular, send page visit and then an event', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);
            Singular.event('test_event');

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.callCount === 2, 'One or more of the apis was not sent');
        });

        it('should initialize Singular, send page visit, conversion event and a custom event', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);
            Singular.conversionEvent('conversion_test');
            Singular.event('test_event');

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.callCount === 3, 'One or more of the apis was not sent');
        });

        it('should initialize Singular, send page visit, conversion event, custom event and a revenue event', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);
            Singular.conversionEvent('conversion_test');
            Singular.event('test_event');
            Singular.revenue('test_event', 'USD', 4.20);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.callCount === 4, 'One or more of the apis was not sent');
        });

        it('should initialize Singular, set the customUserId and then logout, deleting the customUserId', () => {
            const customUserId = '1xx2xx3';
            config.withCustomUserId(customUserId);
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);
            const storagePrefix = SingularState.getInstance().getStoragePrefix();

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(localStorage.getItem(`${storagePrefix}_${Storage.CustomUserIdKey}`) === customUserId, 'CustomUserId was not saved to local storage');
            assert(stub.called, 'Page visit was not sent');

            Singular.logout();

            assert(SingularState.getInstance().getCustomUserId() === null, 'CustomUserId was removed');
            assert(localStorage.getItem(`${storagePrefix}_${Storage.CustomUserIdKey}`) === null, 'CustomUserId was not deleted from local storage');
        });

        it('should initialize Singular, send page visit and then a custom user id event', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            const customUserId = '1xx2xx3';

            Singular.init(config);
            Singular.setDeviceCustomUserId(customUserId);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === customUserId, 'CustomUserId was not set properly');
            assert(stub.callCount === 2, 'One or more of the apis was not sent');
        });

        it('should initialize Singular, send page visit and then a not send custom user id event with an invalid custom user id', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();

            Singular.init(config);
            Singular.setDeviceCustomUserId('');

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(SingularState.getInstance().getCustomUserId() === null, 'CustomUserId was not set properly');
            assert(stub.callCount === 1, 'One or more of the apis was not sent');
        });

        it('should initialize Singular, and call the openApp method', () => {
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            const openApp = sinon.stub(SingularInstance.prototype, 'openApp').returns();

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.called, 'Page visit was not sent');

            Singular.openApp("https://test.sng.link/Ab123/GHtd");
            assert(openApp.called, 'Open app was not called');
        });

        it('should not initialize Singular, and not call the openApp method', () => {
            const openApp = sinon.stub(SingularInstance.prototype, 'openApp').returns();

            Singular.openApp("https://test.sng.link/Ab123/GHtd");

            assert(!openApp.called, 'Open app was called');
        });
    });

    describe('buildWebToAppLink', () => {
        it('should return null when singular is not initialized', () => {
            const baseLink = `https://test.sng.link`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;

            assert(!Singular.buildWebToAppLink(baseLink, deeplink, passthrough), 'link should be null');
        });

        it('should return expected link when singular is initialized', () => {
            const expected = 'https://test.sng.link?_dl=deeplink_value';
            const baseLink = `https://test.sng.link`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;
            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            const buildLink = sinon.stub(SingularInstance.prototype, 'buildWebToAppLink').returns(expected);

            Singular.init(config);

            assert(SingularState.getInstance().getSingularConfig() === config, "Singular Configs don't match");
            assert(stub.called, 'Page visit was not sent');

            assert(Singular.buildWebToAppLink(baseLink, deeplink, passthrough) === expected, 'web to app links should be equal');
            assert(buildLink.called, 'buildWebToAppLink was not called');
        });
    });

    describe('enrichUrlWithMarketingData', () => {

        let defaultWindow;

        // We use these method to override the window location
        beforeEach(() => {
            defaultWindow = window;
        });

        afterEach(() => {
            window = defaultWindow;
        });

        it('should return expected link when utm params appended', () => {
            const expected = 'https://atest.sng.link?utm_source=google&testParam=a';
            const baseLink = `https://atest.sng.link?testParam=a`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match after appending utm params');
        });

        it('should return expected link when utm params added', () => {
            const expected = 'https://atest.sng.link?utm_source=google';
            const baseLink = `https://atest.sng.link`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match after adding utm params');
        });

        it('should return expected link when no utm params added', () => {
            const expected = 'https://atest.sng.link';
            const baseLink = `https://atest.sng.link`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when no params added');
        });

        it('should return expected link when url is null', () => {
            const expected = null;
            const baseLink = null;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when url is null');
        });

        it('should return expected link when url is empty', () => {
            const expected = '';
            const baseLink = '';

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when url is empty');
        });

        it('should return expected link when url is invalid', () => {
            const expected = 'test://test.com';
            const baseLink = `test://test.com`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when url is invalid');
        });

        it('should return expected link when url has other query parameters', () => {
            const expected = 'https://test.com?utm_source=google&test=testing';
            const baseLink = `https://test.com?test=testing`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when url has other query parameters');
        });

        it('should return expected link when current page url has other query parameters than utm parameters', () => {
            const expected = 'https://test.com?utm_source=google';
            const baseLink = `https://test.com`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.link?utm_source=google&test=testing'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when current page url has other query parameters than utm parameters');
        });

        it('should return expected link when current page url has #', () => {
            const expected = 'https://test.sng.com?utm_source=google';
            const baseLink = `https://test.sng.com`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com/?utm_source=google#test'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when current page url has #');
        });

        it('should return expected link when url has #', () => {
            const expected = 'https://test.sng.com/?utm_source=google&test=abc#testing';
            const baseLink = `https://test.sng.com/?test=abc#testing`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com?utm_source=google'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when url has #');
        });

        it('should return expected link when both url and current page url has #', () => {
            const expected = 'https://test.sng.com/?utm_source=google&test=abc#testing';
            const baseLink = `https://test.sng.com/?test=abc#testing`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com/?utm_source=google#test'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when both url and current page url has #');
        });

        it('should return expected link when both url and current page url share same marketing params', () => {
            const expected = 'https://test.sng.com?utm_medium=test&utm_source=google';
            const baseLink = `https://test.sng.com?utm_source=google`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com?utm_source=facebook&utm_medium=test'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls should match when both url and current page url share same marketing params');
        });

        it('should return expected link with encoded query params', () => {
            const expected = 'https://test.sng.com?wpsrc=Organic%20Search';
            const baseLink = `https://test.sng.com`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com?wpsrc=Organic%20Search'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls query params should be encoded after enrichment');
        });

        it('should return expected link with encoded params', () => {
            const expected = 'https://test.sng.com?wpcn=tn-sports-betting&wpkw=https%3A%2F%2Ftest.encoding.com%2Ftn-sports-betting&wpsrc=Organic%20Search';
            const baseLink = `https://test.sng.com`;

            const stub = sinon.stub(SingularInstance.prototype, 'sendApi').returns();
            Singular.init(config);

            global.window = {
                location: {href: 'https://test.sng.com?wpsrc=Organic%20Search&wpkw=https%3A%2F%2Ftest.encoding.com%2Ftn-sports-betting&wpcn=tn-sports-betting'},
            };
            assert(Singular.enrichUrlWithMarketingData(baseLink) === expected,'urls query params should be encoded after enrichment');
        });

    });
});
