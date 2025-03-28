import SingularState from '../src/singular/singularState';
import SingularConfig from "../src/singular/singularConfig";
import {Cookies, LogLevel, Storage} from "../src/consts/constants";
import Singular from "../src/singular/singular";
import Utils from "../src/utils/utils";

window.crypto = require('@trust/webcrypto');

const assert = require('assert');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_productId';
const domain = 'test.com';

describe('singularState', () => {
    describe('singularId', () => {
        let config;

        beforeEach(() => {
            config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
            SingularState._instance = null;
            Singular._isInitialized = false;
            sessionStorage.clear();
            localStorage.clear();
            document.cookie = '';
        });

        it('should generate Singular Id and persist', () => {
            SingularState.getInstance().init(config);

            const expected = SingularState.getInstance().getSingularDeviceId();
            const result = SingularState.getInstance().getSingularDeviceId();

            assert(expected === result, 'Singular Id does not persist');
        });

        it('should set the Singular Id as the id provided', () => {
            const uuid = Utils.generateUUID();
            config.withPersistentSingularDeviceId(uuid);
            SingularState.getInstance().init(config);

            const result = SingularState.getInstance().getSingularDeviceId();

            assert(uuid === result, 'Singular Id does not use persisted one');
        });

        it('should set the Singular Id as the id provided in the cookie', () => {
            const uuid = Utils.generateUUID();
            document.cookie = `${Cookies.SingularDeviceIdKey}=${encodeURIComponent(uuid)}`;
            config.withAutoPersistentSingularDeviceId(domain);
            SingularState.getInstance().init(config);

            const result = SingularState.getInstance().getSingularDeviceId();

            assert(uuid === result, 'Singular Id does not use persisted one');
        });

        it('should set the Singular Id as the manual uuid and not the one in the cookies', () => {
            const uuidCookie = Utils.generateUUID();
            const uuidManual = Utils.generateUUID();
            document.cookie = `${Cookies.SingularDeviceIdKey}=${encodeURIComponent(uuidCookie)}`;
            config.withAutoPersistentSingularDeviceId(domain).withPersistentSingularDeviceId(uuidManual);
            SingularState.getInstance().init(config);

            const result = SingularState.getInstance().getSingularDeviceId();

            assert(uuidManual === result, 'Singular Id does not use persisted one');
        });

        it('should set the Singular Id a new generated UUID when cookies are empty', () => {
            config.withAutoPersistentSingularDeviceId(domain);
            SingularState.getInstance().init(config);

            const result = SingularState.getInstance().getSingularDeviceId();

            assert(!Utils.isNullOrEmpty(result), 'Singular Id was not generated');
        });
    });

    describe('customUserId', () => {
        it('should set the customUserId', () => {
            const expected = '1xx2xx3';
            SingularState.getInstance().setCustomUserId(expected);
            const result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to save custom user id');
        });

        it('should change the custom user id to the second value', () => {
            let expected = '1xx2xx3';
            SingularState.getInstance().setCustomUserId(expected);
            let result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to save custom user id');

            expected = '3xx2xx1';
            SingularState.getInstance().setCustomUserId(expected);
            result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to change custom user id');
        });

        it('should remove the custom user id', () => {
            let expected = '1xx2xx3';
            SingularState.getInstance().setCustomUserId(expected);
            let result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to save custom user id');

            expected = null;
            SingularState.getInstance().unsetCustomUserId(expected);
            result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to delete custom user id');
        });
    });

    describe('webUrl', () => {
        let defaultWindow;

        // We use these method to override the window location
        before(() => {
            defaultWindow = window;
        });

        after(() => {
            window = defaultWindow;
        });

        beforeEach(() => {
            localStorage.clear();
            global.window = {location: {href: ''}};
        });

        it("should confirm that the url has ad data", () => {
            assert(SingularState.getInstance()._isWebUrlContainingMarketingData("https://test.tests?utm_content=da12312"),
                "Failed to recognize ad data");
        });

        it("should confirm that the url has no ad data", () => {
            assert(!SingularState.getInstance()._isWebUrlContainingMarketingData("https://test.tests?data=da12312"),
                "Url approved although it's not containing ad data");
        });

        it("should set the web url with marketing data", () => {
            const url = "https://test.tests?utm_content=da12312";
            window.location.href = url;

            SingularState.getInstance().setWebUrl();

            assert(url === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");
        });

        it("should set the web url without marketing data", () => {
            const url = "https://test.tests?utm_content";
            window.location.href = url;

            SingularState.getInstance().setWebUrl();

            assert(url === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");
        });

        it("should set the web url without marketing data and then override it with marketing data", () => {
            const url = "https://test.tests?utm_content";
            window.location.href = url;

            SingularState.getInstance().setWebUrl();

            assert(url === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");

            const marketingUrl = "https://test.tests?utm_content=da12312";
            window.location.href = marketingUrl;

            SingularState.getInstance().setWebUrl();

            assert(marketingUrl === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");
        });

        it("should set the web url with marketing data and then don't override it without marketing data", () => {
            const marketingUrl = "https://test.tests?utm_content=da12312";
            window.location.href = marketingUrl;

            SingularState.getInstance().setWebUrl();

            assert(marketingUrl === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");

            window.location.href = "https://test.tests?";

            SingularState.getInstance().setWebUrl();

            assert(marketingUrl === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");
        });

        it("should set the web url with marketing data and then override it with new marketing data", () => {
            const marketingUrl = "https://test.tests?utm_content=da12312";
            window.location.href = marketingUrl;

            SingularState.getInstance().setWebUrl();

            assert(marketingUrl === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");

            const newMarketingUrl = "https://test.tests?utm_content=new_url";
            window.location.href = newMarketingUrl;

            SingularState.getInstance().setWebUrl();

            assert(newMarketingUrl === SingularState.getInstance().getWebUrl(), "Web url was not saved correctly");
            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "New session id flag was not set correctly");
        });
    });

    describe('generateNewSessionId', () => {

        beforeEach(() => {
            localStorage.clear();
        });

        it("should generate a new session id and update the last event time", () => {

            const sessionId = SingularState.getInstance()._generateNewSessionId();

            assert(sessionId, "Session id should not be null");
            assert(!SingularState.getInstance()._newSessionIdNeeded, "New session id flag should be false");
        });
    });

    describe('isNewSessionIdNeeded', () => {

        let defaultWindow;

        // We use these method to override the window location
        before(() => {
            defaultWindow = window;
        });

        after(() => {
            window = defaultWindow;
        });

        beforeEach(() => {
            localStorage.clear();
            global.window = {location: {href: ''}};
        });

        it("should return true when there is no session id saved on storage", () => {
            SingularState.getInstance()._newSessionIdNeeded = false;
            SingularState.getInstance().updateLastEventTimestamp();

            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "Should return true");
            assert(!SingularState.getInstance()._newSessionIdNeeded, "New session id flag should be false");
            assert(SingularState.getInstance()._getLastEventTimestamp(), "Last event timestamp should not be null");
        });

        it("should return true when there is no last event timestamp saved on storage", () => {
            SingularState.getInstance()._newSessionIdNeeded = false;
            SingularState.getInstance()._setSessionId("dummy session id");

            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "Should return true");
            assert(!SingularState.getInstance()._newSessionIdNeeded, "New session id flag should be false");
            assert(SingularState.getInstance().getSessionId(), "Session id should not be null");
        });

        it("should return true when new session id flag is true", () => {
            SingularState.getInstance()._newSessionIdNeeded = true;
            SingularState.getInstance().saveSessionId("dummy session id");

            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "Should return true");
            assert(SingularState.getInstance().getSessionId(), "Session id should not be null");
        });

        it("should return false when session timeout has not passed", () => {
            SingularState.getInstance()._newSessionIdNeeded = false;
            SingularState.getInstance().saveSessionId("dummy session id");

            // Normally base api would call this method, we imitate it by calling it directly
            SingularState.getInstance().updateLastEventTimestamp();

            assert(!SingularState.getInstance()._isNewSessionIdNeeded(), "Should return false");
            assert(SingularState.getInstance().getSessionId(), "Session id should not be null");
        });

        it("should return true when session timeout has passed", () => {
            SingularState.getInstance().saveSessionId("dummy session id");

            SingularState.getInstance()._storage.setItem(Storage.StorageLastEventTimestamp,
                Utils.getCurrentTimestamp() - 40 * 60);

            assert(SingularState.getInstance()._isNewSessionIdNeeded(), "Should return true");
            assert(SingularState.getInstance()._getLastEventTimestamp(), "Last event timestamp should not be null");
            assert(SingularState.getInstance().getSessionId(), "Session id should not be null");
        });
    });

    describe('getSessionIdForPageVisit', () => {

        beforeEach(() => {
            localStorage.clear();
        });

        it("should generate a new session id and save it to local storage because it's empty", () => {
            const sessionId = SingularState.getInstance().getSessionIdForPageVisit();
            assert(sessionId, "Session Id should not be null");
            assert(SingularState.getInstance().getSessionId() === sessionId, "Session id was not saved to storage");
        });

        it("should generate a new session id and save it to local storage because it's empty, the next session id should not change", () => {
            const sessionId = SingularState.getInstance().getSessionIdForPageVisit();

            assert(sessionId, "Session Id should not be null");

            // Normally base api would call this method, we imitate it by calling it directly
            SingularState.getInstance().updateLastEventTimestamp();

            assert(SingularState.getInstance().getSessionId() === sessionId, "Session id was not saved to storage");
            assert(SingularState.getInstance().getSessionIdForPageVisit() === sessionId, "Session id should not have changed");
        });

        it("should generate a new session id and save it to local storage because it's empty, then generate a new session id", () => {
            const firstSessionId = SingularState.getInstance().getSessionIdForPageVisit();
            assert(firstSessionId, "Session Id should not be null");

            // Normally base api would call this method, we imitate it by calling it directly
            SingularState.getInstance().updateLastEventTimestamp();

            assert(SingularState.getInstance().getSessionId() === firstSessionId, "Session id was not saved to storage");
            assert(SingularState.getInstance().getSessionIdForPageVisit() === firstSessionId, "Session id should not have changed");

            SingularState.getInstance()._newSessionIdNeeded = true;
            const secondSessionId = SingularState.getInstance().getSessionIdForPageVisit();
            assert(secondSessionId, "Session Id should not be null");
            assert(firstSessionId !== secondSessionId, "Session id was not saved to storage");
            assert(SingularState.getInstance().getSessionId() === firstSessionId, "Session id was should not save to storage");
        });
    });

    describe('updateSingularConfig', () => {
        let config;

        beforeEach(() => {
            config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
            SingularState._instance = null;
            Singular._isInitialized = false;
            sessionStorage.clear();
            localStorage.clear();
            document.cookie = '';
            SingularState.getInstance().init(config);
        });

        it('should set the customUserId with the one in the new config', () => {
            const expected = "my_user_id";
            SingularState.getInstance().setCustomUserId('1xx2xx3');
            config = new SingularConfig(apiKey, secret, "random").withLogLevel(LogLevel.Debug).withCustomUserId(expected);
            config.withCustomUserId(expected);
            SingularState.getInstance().updateSingularConfig(config);

            const result = SingularState.getInstance().getCustomUserId();

            assert(expected === result, 'Unable to update custom user id with config');
        });

        it('should change storage prefix when updating the config with a new product id', () => {
            config = new SingularConfig(apiKey, secret, "random").withLogLevel(LogLevel.Debug);
            SingularState.getInstance().updateSingularConfig(config);

            const result = SingularState.getInstance().getStoragePrefix();

            assert('random_key_random' === result, 'Storage prefix was not updated properly');
        });
    });
});
