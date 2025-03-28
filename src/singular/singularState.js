import DynamicStorage from "../storage/dynamicStorage";
import {Cookies, Params, Storage, SDK} from "../consts/constants";
import Utils from "../utils/utils";
import SingularLog from "./singularLog";

export default class SingularState {
    static _instance;

    static getInstance() {
        if (!this._instance) {
            this._instance = new SingularState();
        }

        return this._instance;
    }

    init(config) {
        this._singularConfig = config;
        this._storage = new DynamicStorage(Storage.Types.Local, this.getStoragePrefix());
        this._singularDeviceIdStorage = new DynamicStorage(Storage.Types.Local, Storage.GlobalStoragePrefix);
        this._isFirstVisit = null;
        this._newSessionIdNeeded = false;

        this.setWebUrl();
        this.loadSingularPersistentData();

        return this;
    }

    loadSingularPersistentData() {
        this._sdidPersistMode = SDK.SdidPersistModeOff;
        this._sdidPersistFailReason = null;
        this._previousSdid = null;
        this._singularDeviceId = null;
        this._instanceId = null;
        this._matchId = null;

        this.getSingularDeviceId();
        this.getCustomUserId();
        this.getSingularInstanceId();
        this._persistSingularDeviceIdIfNeeded();
    }

    setWebUrl() {
        const webUrl = this._storage.getItem(Storage.StorageWebUrlKey);
        const touchpointTimestamp = this._storage.getItem(Storage.StorageTouchpointTimestampKey);

        // Our goal is to save the last click with marketing data, so this is what we do
        // 1. if the web_url is empty, we save it
        // 2. if the new web_url contains marketing parameters we over-ride the current one
        if (!webUrl || (this._isWebUrlContainingMarketingData(window.location.href) && this._didWebUrlChange(window.location.href))) {
            this._webUrl = window.location.href;
            this._touchpointTimestamp = Utils.getCurrentTimestamp();
            this._storage.setItem(Storage.StorageWebUrlKey, this._webUrl);
            this._storage.setItem(Storage.StorageTouchpointTimestampKey, this._touchpointTimestamp);

            // We generate a new session id when opened with new marketing params
            this._newSessionIdNeeded = true;
        } else {
            this._webUrl = webUrl;
            this._touchpointTimestamp = touchpointTimestamp;
        }
    }

    getSingularDeviceId() {
        if (this._singularDeviceId) {
            return this._singularDeviceId;
        }

        const previousSdid = this._singularDeviceIdStorage.getItem(Storage.SingularDeviceIdKey);

        // A persistent singular device id has been set to support cross sub-domain
        if (this._singularConfig._singularDeviceId) {
            this._sdidPersistMode = SDK.SdidPersistModeManual;

            if (Utils.isUUID(this._singularConfig._singularDeviceId)) {
                SingularLog.debug("Persistent Singular Device Id was set manually");
                this._singularDeviceIdStorage.setItem(Storage.SingularDeviceIdKey, this._singularConfig._singularDeviceId);
            } else {
                SingularLog.debug("Persistent Singular Device Id provided was not in uuid format");
                this._sdidPersistFailReason = `invalid udid:${this._singularConfig._singularDeviceId}`;
            }
        } else if (!Utils.isNullOrEmpty(this._singularConfig._autoPersistDomain)) {
            const singularDeviceId = Utils.getCookie(Cookies.SingularDeviceIdKey);
            this._sdidPersistMode = SDK.SdidPersistModeAuto;

            if (singularDeviceId != null) {
                if (singularDeviceId === "") {
                    this._sdidPersistFailReason = `singular sdid cookie was set to an empty string`;
                } else if (!Utils.isUUID(singularDeviceId)) {
                    this._sdidPersistFailReason = `invalid udid:${singularDeviceId}`;
                } else {
                    SingularLog.debug("Persistent Singular Device Id was set automatically from cookies");
                    this._singularDeviceIdStorage.setItem(Storage.SingularDeviceIdKey, singularDeviceId);
                }
            }
        }

        this._singularDeviceId = this._getPersistentUUID(this._singularDeviceIdStorage, Storage.SingularDeviceIdKey);

        if (!Utils.isNullOrEmpty(previousSdid) && this._singularDeviceId !== previousSdid) {
            this._previousSdid = previousSdid;
        }

        return this._singularDeviceId;
    }

    getSdidPersistMode() {
        return this._sdidPersistMode;
    }

    getSdidPersistFailReason() {
        return this._sdidPersistFailReason;
    }

    getPreviousSdid() {
        return this._previousSdid;
    }

    getStoragePrefix() {
        return `${this._singularConfig.apikey}_${this._singularConfig.productId}`;
    }

    getCustomUserId() {
        if (this._customUserId) {
            return this._customUserId;
        }

        this._customUserId = this._storage.getItem(Storage.CustomUserIdKey);

        return this._customUserId;
    }

    getWebUrl() {
        return this._webUrl;
    }

    getTouchpointTimestamp() {
        return this._touchpointTimestamp;
    }

    setCustomUserId(customUserId) {
        this._customUserId = customUserId;
        this._storage.setItem(Storage.CustomUserIdKey, customUserId);
    }

    unsetCustomUserId() {
        this._customUserId = null;
        this._storage.removeItem(Storage.CustomUserIdKey);
    }

    getSingularConfig() {
        return this._singularConfig;
    }

    getSessionId() {
        return this._storage.getItem(Storage.SessionIdKey);
    }

    getSessionIdForPageVisit() {
        if (!this._isNewSessionIdNeeded()) {
            return this.getSessionId();
        }

        const sessionId = this._generateNewSessionId();

        this.setFirstPageVisitOccurred(false);
        this.setFirstPageVisitURL(null)

        // The first time the sdk initializes we don't have a session id. In the case that events are
        // Not being sent from the first tab, meaning we won't save the session id. If the user opens
        // A new tab in this case it will generate a new session id even though no re-eng happened.
        // This is why on the first time the user enters the site we save the first session id before
        // PageVisit has been successfully sent.
        if (!this.getSessionId()) {
            this.saveSessionId(sessionId);
        }

        return sessionId;
    }

    getSingularInstanceId() {
        if (this._instanceId) {
            return this._instanceId;
        }

        this._instanceId = this._getPersistentUUID(this._storage, Storage.SingularInstanceIdKey);

        return this._instanceId;
    }

    saveSessionId(sessionId) {
        this._setSessionId(sessionId);
    }

    isFirstVisit() {
        if (this._isFirstVisit !== null) {
            return this._isFirstVisit;
        }

        this._isFirstVisit = !this._storage.getItem(Storage.DidVisitSiteKey);

        if (this._isFirstVisit) {
            this._storage.setItem(Storage.DidVisitSiteKey, true);
        }

        return this._isFirstVisit;
    }

    getMatchID() {
        if (this._matchId) {
            return this._matchId;
        }
        this._matchId = this._singularDeviceIdStorage.getItem(Storage.MatchIdKey);
        return this._matchId;
    }

    setMatchID(matchId) {
        this._singularDeviceIdStorage.setItem(Storage.MatchIdKey, matchId)
        this._matchId = matchId;
    }

    clearMatchID() {
        this._singularDeviceIdStorage.removeItem(Storage.MatchIdKey)
        this._matchId = null;
    }

    clearGlobalProperties() {
        this._storage.removeItem(Storage.GlobalProperties);
    }

    getGlobalProperties() {
        return JSON.parse(this._storage.getItem(Storage.GlobalProperties));
    }

    setGlobalProperties(key,value){
        if (key) {
            const properties = this.getGlobalProperties() || {};
            properties[key] = value;
            this._storage.setItem(Storage.GlobalProperties, JSON.stringify(properties));
        }
    }

    IsFirstEvent(eventName) {
        const key = `${Storage.DidSendEventKeyBase}.${eventName}`;
        const didSendEvent = !!this._storage.getItem(key);

        if (!didSendEvent) {
            this._storage.setItem(key, true);
        }
        return !didSendEvent;
    }

    updateLastEventTimestamp() {
        this._storage.setItem(Storage.StorageLastEventTimestamp, Utils.getCurrentTimestamp());
    }

    getFirstPageVisitOccurred() {
        return this._storage.getItem(Storage.FirstPageVisitOccurredKey) === "true";
    }

    setFirstPageVisitOccurred(firstPageVisitOccurred) {
        return this._storage.setItem(Storage.FirstPageVisitOccurredKey, firstPageVisitOccurred.toString());
    }

    setFirstPageVisitURL(firstVisitURL) {
        this._storage.setItem(Storage.FirstPageVisitURL, firstVisitURL);
    }

    getFirstPageVisitURL() {
        return this._storage.getItem(Storage.FirstPageVisitURL);
    }

    updateSingularConfig(config) {
        this._singularConfig = config;

        if (config.customUserId) {
            this.setCustomUserId(config.customUserId);
        }

        // Will handle SDID / Cookie logic with the new config here
        this.loadSingularPersistentData();
    }

    _getPersistentUUID(storage, storageKey) {
        let value = storage.getItem(storageKey);

        // If there is no persistent id saved on storage, generate a new one and save it
        if (!value) {
            value = Utils.generateUUID();
            storage.setItem(storageKey, value);
        }

        return value;
    }

    _isWebUrlContainingMarketingData(webUrl) {
        for (let key in Params.WebUrlMarketingParams) {
            for (let param_regex of Params.WebUrlMarketingParams[key]) {
                const regex = RegExp(param_regex);

                if (regex.test(webUrl)) {
                    return true;
                }
            }
        }

        return false;
    }

    _didWebUrlChange(webUrl) {
        const oldWebUrlParams = new URLSearchParams(this._storage.getItem(Storage.StorageWebUrlKey));
        const newWebUrlParams = new URLSearchParams(webUrl);

        if (oldWebUrlParams.size !== newWebUrlParams.size) {
            return true
        }

        for (const [key, val] of Array.from(newWebUrlParams.entries())) {
            if (oldWebUrlParams.get(key) !== val) {
                return true
            }
        }

        return false;
    }

    _setSessionId(sessionId) {
        this._storage.setItem(Storage.SessionIdKey, sessionId);
    }

    _getLastEventTimestamp() {
        return this._storage.getItem(Storage.StorageLastEventTimestamp);
    }

    _isNewSessionIdNeeded() {
        return this._newSessionIdNeeded || !this.getSessionId() || !this._getLastEventTimestamp() ||
            this._isSessionTimeout();
    }

    _isSessionTimeout() {
        return Utils.getCurrentTimestamp() - this._getLastEventTimestamp() > this._singularConfig.sessionTimeOutInSeconds;
    }

    _generateNewSessionId() {
        this._newSessionIdNeeded = false;

        return Utils.generateUUID();
    }

    _persistSingularDeviceIdIfNeeded() {
        if (Utils.isNullOrEmpty(this._singularConfig._autoPersistDomain)) {
            return;
        }

        Utils.setCookie(Cookies.SingularDeviceIdKey, this.getSingularDeviceId(), this._singularConfig._autoPersistDomain)
    }
}
