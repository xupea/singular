import Utils from "../src/utils/utils";
import {OS} from "../src/consts/constants.js";

const assert = require('assert');

describe('utils', () => {
    describe('getOS', () => {

        let defaultNavigator;
        let clientHints;

        // We use these method to override the navigator user agent and platform
        before(() => {
            defaultNavigator = navigator;
        });

        after(() => {
            navigator = defaultNavigator;
        });

        beforeEach(() => {
            clientHints = null;

            global.navigator = {
                platform: '',
                userAgent: '',
                userAgentData: {
                    getHighEntropyValues: async (map) => {
                        return clientHints;
                    },
                }
            };
        });

        it('should return MacOS as os on navigator.platform Macintosh', async () => {
            navigator.platform = 'Macintosh';

            assert.equal(await Utils.getOS(), OS.MacOs, 'OS should be MacOS');
        });

        it('should return iOS as os on navigator.platform iPhone', async () => {
            navigator.platform = 'iPhone';

            assert(await Utils.getOS() === OS.iOS, 'OS should be iOS');
        });

        it('should return iOS as os on navigator.userAgent of iPod', async () => {
            navigator.userAgentData = null;
            navigator.userAgent = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

            assert(await Utils.getOS() === OS.iOS, 'OS should be iOS');
        });

        it('should return Windows as os on navigator.platform  Windows', async () => {
            navigator.platform = 'Windows';

            assert(await Utils.getOS() === OS.Windows, 'OS should be Windows');
        });

        it('should return Android as os on navigator.userAgent of Android', async () => {
            navigator.userAgentData = null;
            navigator.userAgent = 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19';

            assert(await Utils.getOS() === OS.Android, 'OS should be Android');
        });

        it('should return Android as os on navigator.platform Linux', async () => {
            navigator.platform = 'Linux armv7l';

            assert(await Utils.getOS() === OS.Linux, 'OS should be Linux');
        });

        it('should return Unknown on random user agent and platform', async () => {
            navigator.platform = 'random';
            navigator.userAgent = 'random';

            assert(await Utils.getOS() === OS.Unknown, 'OS should be Unknown');
        });

        it('should return Unknown on empty user agent and platform', async () => {
            assert(await Utils.getOS() === OS.Unknown, 'OS should be Unknown');
        });

        it('should return Unknown on null user agent and platform', async () => {
            navigator.platform = null;
            navigator.userAgent = null;

            assert(await Utils.getOS() === OS.Unknown, 'OS should be Unknown');
        });

        it('should return Unknown on null user agent and platform', async () => {
            navigator.platform = null;
            navigator.userAgent = null;

            assert(await Utils.getOS() === OS.Unknown, 'OS should be Unknown');
        });

        it('should return iOS on valid userAgentData with null user agent and platform', async () => {
            navigator.platform = null;
            navigator.userAgent = null;
            clientHints = {platform: "iPhone"};

            assert(await Utils.getOS() === OS.iOS, 'OS should be iOS');
        });

        it('should return Android on valid userAgentData with null user agent and platform', async () => {
            navigator.platform = null;
            navigator.userAgent = null;
            clientHints = {platform: "Android"};

            assert(await Utils.getOS() === OS.Android, 'OS should be iOS');
        });

        it('should return Android on valid userAgentData with "Chrome" user agent and null platform', async () => {
            navigator.platform = null;
            navigator.userAgent = "Chrome";
            clientHints = {platform: "Android"};

            assert(await Utils.getOS() === OS.Android, 'OS should be iOS');
        });

        it('should return MacOS as os on navigator.platform Macintosh and invalid client hints', async () => {
            navigator.platform = 'Macintosh';
            clientHints = {platform: "Random"};

            assert.equal(await Utils.getOS(), OS.MacOs, 'OS should be MacOS');
        });
    });

    describe('buildWebToAppLink', () => {
        it('should build web to app link with web params, deeplink, passthrough & ddl', () => {
            const expected = 'https://test.sng.link?_web_params=a%3D1%26b%3D2&_dl=deeplink_value&_p=passthrough_value&_ddl=ddl_value';
            const webUrl = `https://test.test.test?a=1&b=2`;
            const baseLink = `https://test.sng.link`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;
            const ddl = `ddl_value`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, deeplink, passthrough, ddl);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should build web to app link with only web params', () => {
            const expected = 'https://test.sng.link?_web_params=a%3D1%26b%3D2';
            const webUrl = `https://test.test.test?a=1&b=2`;
            const baseLink = `https://test.sng.link`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should build web to app link with deeplink and no web params', () => {
            const expected = 'https://test.sng.link?_dl=deeplink_value';
            const webUrl = `https://test.test.test`;
            const baseLink = `https://test.sng.link`;
            const deeplink = `deeplink_value`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, deeplink);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should build web to app link with passthrough and no web params', () => {
            const expected = 'https://test.sng.link?_p=passthrough_value';
            const webUrl = `https://test.test.test`;
            const baseLink = `https://test.sng.link`;
            const passthrough = `passthrough_value`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, null, passthrough);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should build web to app link with base link containing deeplink, passthrough and ddl ', () => {
            const expected = 'https://test.sng.link?_p=override_value&_dl=override_link&_ddl=override_ddl';
            const webUrl = `https://test.test.test`;
            const baseLink = `https://test.sng.link?_p=passthrough_value&_dl=deep_link&_ddl=deferred_link`;
            const deeplink = `override_link`;
            const passthrough = `override_value`;
            const ddl = `override_ddl`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, deeplink, passthrough, ddl);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should build web to app link with base link containing other params', () => {
            const expected = 'https://test.sng.link?my_param=test&_dl=override_link&_p=override_value';
            const webUrl = `https://test.test.test`;
            const baseLink = `https://test.sng.link?my_param=test`;
            const deeplink = `override_link`;
            const passthrough = `override_value`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, deeplink, passthrough);

            assert(expected === webToAppLink, 'Created link does not match expected one');
        });

        it('should return null when base link is empty', () => {
            const webUrl = `https://test.test.test?a=1&b=2`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;

            const webToAppLink = Utils.buildWebToAppLink('', webUrl, deeplink, passthrough);

            assert(!webToAppLink, 'Web to app link should be null');
        });

        it('should return null when base link is null', () => {
            const webUrl = `https://test.test.test?a=1&b=2`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;

            const webToAppLink = Utils.buildWebToAppLink(null, webUrl, deeplink, passthrough);

            assert(!webToAppLink, 'Web to app link should be null');
        });

        it('should return null when base link is an invalid url', () => {
            const webUrl = `https://test.test.test?a=1&b=2`;
            const deeplink = `deeplink_value`;
            const passthrough = `passthrough_value`;
            const baseLink = `random_string`;

            const webToAppLink = Utils.buildWebToAppLink(baseLink, webUrl, deeplink, passthrough);

            assert(!webToAppLink, 'Web to app link should be null');
        });
    });

    describe('parseQueryFromUrl', () => {
        it('should parse query params from url', () => {
            const expected = {a: '1', b: '2'};
            const url = `https://test.test.test?a=1&b=2`;

            const params = Utils.parseQueryFromUrl(url);

            assert(expected['a'] === params['a'] && expected['b'] === params['b'], 'Query params do not match');
        });

        it('should parse query params from url with fragment', () => {
            const expected = {a: '1', b: '2'};
            const url = `https://test.test.test?a=1&b=2#test_fragment`;

            const params = Utils.parseQueryFromUrl(url);

            assert(expected['a'] === params['a'] && expected['b'] === params['b'], 'Query params do not match');
            assert(Object.keys(params).length === 2, 'Query params do not match');
        });

        it('should return empty map on url with no empty params', () => {
            const url = `https://test.test.test`;

            const params = Utils.parseQueryFromUrl(url);

            assert(Object.keys(params).length === 0, 'Query params do not match');
        });

        it('should return empty map on empty url', () => {
            const params = Utils.parseQueryFromUrl('');

            assert(Object.keys(params).length === 0, 'Query params do not match');
        });

        it('should return empty map on null url', () => {
            const params = Utils.parseQueryFromUrl(null);

            assert(Object.keys(params).length === 0, 'Query params do not match');
        });
    });

    describe('extractQueryString', () => {
        it('should extract query string from url', () => {
            const expected = 'a=1&b=2';
            const url = `https://test.test.test?${expected}`;

            const queryString = Utils.extractQueryStringWithFragment(url);

            assert(expected === queryString, 'Query string was not extracted properly');
        });

        it('should return empty string because there`s not query string', () => {
            const url = `https://test.test.test`;

            const queryString = Utils.extractQueryStringWithFragment(url);

            assert(queryString === "", 'Query string should be empty');
        });

        it('should return null because there`s not query string', () => {
            assert(!Utils.extractQueryStringWithFragment(null), 'Query string should be null');
        });
    });

    describe('extractUrlWithPath', () => {
        it('should return the url with path without query string', () => {
            const expected = `https://test.test.test/a/b`;
            const url = `https://test.test.test/a/b?a=1`;

            const urlWithPath = Utils.extractUrlWithPath(url);

            assert(expected === urlWithPath, 'Urls did not match');
        });

        it('should return the same url with path', () => {
            const url = `https://test.test.test/a/b`;

            const urlWithPath = Utils.extractUrlWithPath(url);

            assert(url === urlWithPath, 'Urls did not match');
        });

        it('should return the null on empty url', () => {
            assert(!Utils.extractUrlWithPath(''), 'Url should be null');
        });

        it('should return the null on null url', () => {
            assert(!Utils.extractUrlWithPath(null), 'Url should be null');
        });
    });

    describe('isValidUrl', () => {
        it('should return true on valid url', () => {
            const url = `https://test.test.test?a=1`;

            assert(Utils.isValidUrl(url), 'Url did not validate properly');
        });

        it('should return true on valid url', () => {
            const url = `not_a_url`;

            assert(!Utils.isValidUrl(url), 'Url did not validate properly');
        });

        it('should return false on empty url', () => {
            assert(!Utils.isValidUrl(''), 'Url did not validate properly');
        });

        it('should return false on null url', () => {
            assert(!Utils.isValidUrl(null), 'Url did not validate properly');
        });
    });
});
