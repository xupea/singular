import SingularConfig from '../src/singular/singularConfig';
import Utils from "../src/utils/utils";
import {SdkVersion} from "../src/consts/params";
import {SDK} from "../src/consts/constants";
import {DefaultSessionTimeoutMinutes} from "../src/consts/sdk";
import SingularInitParams from "../src/singular/singularInitParams";

const assert = require('assert');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_id';

describe('singularConfig', () => {
    describe('constructor', () => {
        it('should fail creating a singular config without an apikey', () => {
            let error = false;

            try {
                new SingularConfig(null, secret, productId);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should fail creating a singular config without a secret', () => {
            let error = false;

            try {
                new SingularConfig(apiKey, null, productId);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should fail creating a singular config without a product id', () => {
            let error = false;

            try {
                new SingularConfig(apiKey, secret, null);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should create a valid singular config', () => {
            const config = new SingularConfig(apiKey, secret, productId);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
        });

        it('should create a valid singular config with customUserId', () => {
            const customUserId = '1xx2xx3';
            const config = new SingularConfig(apiKey, secret, productId).withCustomUserId(customUserId);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config.customUserId === customUserId, "Custom User Ids don't match");
        });

        it('should create a valid singular config with product name', () => {
            const productName = 'Test App';
            const config = new SingularConfig(apiKey, secret, productId).withProductName(productName);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config.productName === productName, "Product names don't match");
        });

        it('should create a valid singular config with sdk wrapper', () => {
            const wrapper = 'TestWrapper';
            const config = new SingularConfig(apiKey, secret, productId).withWrapperVersion(wrapper);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(Utils.getSdkVersion() === `${SDK.Version}-${wrapper}`, "SDK versions don't match");
        });

        it('should create a valid singular config with default session timeout', () => {
            const config = new SingularConfig(apiKey, secret, productId);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config.sessionTimeOutInSeconds === DefaultSessionTimeoutMinutes * 60, "Session timeouts don't match");
        });

        it('should create a valid singular config with 60 mins session timeout', () => {
            const sessionTimeout = 60;
            const config = new SingularConfig(apiKey, secret, productId).withSessionTimeoutInMinutes(sessionTimeout);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config.sessionTimeOutInSeconds === sessionTimeout * 60, "Session timeouts don't match");
        });

        it('should create a valid singular config with a singular device id', () => {
            const uuid = Utils.generateUUID();
            const config = new SingularConfig(apiKey, secret, productId).withPersistentSingularDeviceId(uuid);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config._singularDeviceId === uuid, "Singular device ids don't match");
        });

        it('should create a valid singular config with a null singular device id', () => {
            const config = new SingularConfig(apiKey, secret, productId).withPersistentSingularDeviceId(null);

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config._singularDeviceId === null, "Singular device id should be empty");
        });

        it('should create a valid singular config with an empty singular device id', () => {
            const config = new SingularConfig(apiKey, secret, productId).withPersistentSingularDeviceId("");

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
            assert(config._singularDeviceId === null, "Singular device id should be empty");
        });
    });

    describe('initCallback', () => {
        it('should create a valid singular config with a singular init callback', () => {
            const uuid = Utils.generateUUID();
            const config = new SingularConfig(apiKey, secret, productId).withInitFinishedCallback(initParams => {
                assert(initParams.singularDeviceId === uuid, "Singular device ids don't match");
            });

            config._initFinished(new SingularInitParams(uuid));

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
        });

        it('should create a valid singular config with a null singular init callback', () => {
            const uuid = Utils.generateUUID();
            const config = new SingularConfig(apiKey, secret, productId).withInitFinishedCallback(null);

            config._initFinished(new SingularInitParams(uuid));

            assert(config.apikey === apiKey, "Apikeys don't match");
            assert(config.secret === secret, "Secrets don't match");
            assert(config.productId === productId, "Product ids don't match");
        });
    });

    describe('isSameApp', () => {
        it('should create valid singular configs with the same params', () => {
            const first = new SingularConfig(apiKey, secret, productId);
            const second = new SingularConfig(apiKey, secret, productId);

            assert(first.isSameApp(second), "Failed to compare configs");
        });

        it('should create valid singular configs with different params', () => {
            const first = new SingularConfig(apiKey, secret, productId);
            const second = new SingularConfig(apiKey, secret, "random");

            assert(!first.isSameApp(second), "Failed to compare configs");
        });

        it('should create a valid singular configs and compare it with null', () => {
            const first = new SingularConfig(apiKey, secret, productId);

            assert(!first.isSameApp(null), "Failed to compare configs");
        });
    });
});
