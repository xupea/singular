import {ClientHints, OS, Params, SDK, Cookies} from "../consts/constants";
import sha1 from "js-sha1";

import getRandomValues from "polyfill-crypto.getrandomvalues"

export default class Utils {

    static generateUUID() {
        // This is for old browsers support
        let cryptoObject = window.crypto ? window.crypto : window.msCrypto;

        if (!cryptoObject || !cryptoObject.getRandomValues || !cryptoObject.getRandomValues(new Uint8Array(1))) {
            cryptoObject = {
                getRandomValues: (item) => {
                    return getRandomValues(item);
                }
            }
        }

        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ cryptoObject.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    static isUUID(uuid) {
        return RegExp(Params.UUID_REGEX).test(uuid);
    }

    static getCurrentTimestamp() {
        return Math.round(new Date().getTime() / 1000);
    }

    static async getOS() {
        try {
            const platform = navigator.platform || "";
            const userAgent = await this._getUserAgentInfo();

            if (OS.MacOsPlatforms.includes(platform)) {
                return OS.MacOs;
            } else if (OS.iOSPlatforms.includes(platform) || /iPad|iPhone|iPod/.test(userAgent)) {
                return OS.iOS;
            } else if (OS.WindowsPlatforms.includes(platform)) {
                return OS.Windows;
            } else if (/Android/.test(userAgent)) {
                return OS.Android;
            } else if (/Linux/.test(platform)) {
                return OS.Linux;
            }
        } catch (e) {
        }

        return OS.Unknown;
    }

    static isNullOrEmpty(value) {
        return value === null || value === undefined || value === '';
    }

    static calculateHash(data, secret) {
        return sha1.hex(secret + data);
    }

    static getTimeZone() {
        return new Date().toString().match(/([A-Z]+[\+-][0-9]+)/)[1];
    }

    static getBrowserAvailableMemory() {
        try {
            if (!window.performance.hasOwnProperty('memory') ||
                !window.performance.memory.hasOwnProperty('jsHeapSizeLimit')) {
                return null;
            }

            return window.performance.memory.jsHeapSizeLimit;
        } catch (e) {
            return null;
        }
    }

    static getBrowserUsedMemory() {
        try {
            if (!window.performance.hasOwnProperty('memory') ||
                !window.performance.memory.hasOwnProperty('usedJSHeapSize')) {
                return null;
            }

            return window.performance.memory.usedJSHeapSize;
        } catch (e) {
            return null;
        }
    }

    static buildWebToAppLink(baseLink, webUrl, deeplink, passthrough, deferredDeeplink) {
        if (!this.isValidUrl(baseLink)) {
            return null;
        }

        const linkParams = this.parseQueryFromUrl(baseLink);

        const webParams = this.extractQueryStringWithFragment(webUrl);

        if (!this.isNullOrEmpty(webParams)) {
            linkParams[Params.WebParams] = webParams;
        }

        if (!this.isNullOrEmpty(deeplink)) {
            linkParams[Params.DeeplinkParam] = deeplink;
        }

        if (!this.isNullOrEmpty(passthrough)) {
            linkParams[Params.PassthroughParam] = passthrough;
        }

        if (!this.isNullOrEmpty(deferredDeeplink)) {
            linkParams[Params.DeferredDeeplinkParam] = deferredDeeplink;
        }

        const encodedQueryParams = Object.keys(linkParams)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(linkParams[key])}`);

        return `${this.extractUrlWithPath(baseLink)}?${encodedQueryParams.join('&')}`;
    }

    static parseQueryFromUrl(url) {
        if (this.isNullOrEmpty(url)) {
            return {};
        }

        const urlSplit = url.split('?');

        if (urlSplit.length <= 1) {
            return {};
        }

        // If the developer enters the base link with a fragment we remove it before invoking
        const queryString = urlSplit[1].split('#')[0];

        const params = {};

        const pairs = queryString.split('&');
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i].split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }

        return params;
    }

    static extractUrlWithPath(url) {
        if (this.isNullOrEmpty(url)) {
            return null;
        }

        return url.split('?')[0];
    }

    static isValidUrl(url) {
        if (this.isNullOrEmpty(url)) {
            return false;
        }

        const pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        return pattern.test(url);
    }

    static extractQueryStringWithFragment(url) {
        if (this.isNullOrEmpty(url)) {
            return null;
        }

        // We extract the query string from the url.
        // If there's a fragment we will also return it as a part of string
        let splitValues = url.split('?');

        if (splitValues.length >= 2 && !this.isNullOrEmpty(splitValues[1])) {
            return splitValues[1];
        }

        // If there's no query string try to extract only the fragment
        splitValues = url.split('#');

        if (splitValues.length >= 2 && !this.isNullOrEmpty(splitValues[1])) {
            return splitValues[1];
        }

        return "";
    }

    static isPageRefreshed() {
        try {
            // when window.performance.navigation.type equals to 1 it means the window was reloaded
            if (!window.performance || window.performance.navigation.type !== 1) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    static getClientHints() {
        return this._getDataFromClientHints(ClientHints.HighEntropyValuesKeys);
    }

    static setSdkWrapper(wrapper) {
        if (Utils.isNullOrEmpty(wrapper)) {
            return;
        }

        this._sdkWrapper = wrapper;
    }

    static getSdkVersion() {
        if (!this._sdkWrapper) {
            return SDK.Version;
        }

        return `${SDK.Version}-${this._sdkWrapper}`;
    }

    static getCookie(key) {
        const cookieString = document.cookie;

        if (Utils.isNullOrEmpty(cookieString)) {
            return null;
        }

        const cookies = document.cookie.split(';');
        const cookieKey = key + '=';
        let cookieValue = null;

        cookies.forEach(function (cookie) {
            cookie = cookie.trim();

            if (cookie.indexOf(cookieKey) === 0) {
                cookieValue = decodeURIComponent(cookie.substring(cookieKey.length, cookie.length));
            }
        });

        return cookieValue;
    }

    static setCookie(key, value, domain) {
        if (Utils.isNullOrEmpty(key) || Utils.isNullOrEmpty(value) || Utils.isNullOrEmpty(domain)) {
            return;
        }

        const expiration = Utils._getCookieExpirationDate();

        document.cookie = `${key}=${encodeURIComponent(value)}; ${Cookies.CookieDomainKey}=${domain}; ${Cookies.CookieExpiresKey}=${expiration.toGMTString()}; path=/`;
    }

    static _getCookieExpirationDate() {
        const date = new Date();
        date.setTime(date.getTime() + Cookies.CookieExpirationInDays);
        return date;
    }

    static async _getUserAgentInfo() {
        // If there are no client hints, we return the user agent
        if (!navigator.userAgentData) {
            return navigator.userAgent || "";
        }

        // We prefer client hints data because user agent can still have a value, but not an updated one.
        return await this._getClientHintsPlatform();
    }

    static async _getClientHintsPlatform() {
        const platformHint = await this._getDataFromClientHints([ClientHints.PlatformKey]);

        if (!platformHint) {
            return "";
        }

        return platformHint[ClientHints.PlatformKey] || "";
    }

    static async _getDataFromClientHints(keys) {
        if (!navigator.userAgentData) {
            return null;
        }

        return await navigator.userAgentData.getHighEntropyValues(keys);
    }

    static extractMarketingData(result) {
        let marketingParams = [];

        for (let objectK of result) {
            for (let key in Params.WebUrlMarketingParams) {
                for (let param_regex of Params.WebUrlMarketingParams[key]) {
                    const regex = RegExp('^' + param_regex);

                    if (regex.test(objectK + "=")) {
                        marketingParams.push(objectK);
                    }
                }
            }
        }
        return marketingParams;
    }

    static appendQueryParamsToUrl(splitChar, queryParam, url) {
        return `${url.split(splitChar)[0]}${"?"}${queryParam}${(splitChar == "?" ? "&" : "#")}${url.split(splitChar)[1]}`;
    }
}

