import Utils from "../utils/utils";
import SingularLog from "./singularLog";
import BannersOptions from "./bannersOptions";
import { DefaultSessionTimeoutMinutes } from "../consts/sdk";

export default class SingularConfig {
  constructor(apikey, secret, productId) {
    if (Utils.isNullOrEmpty(apikey)) {
      throw new Error("apikey must not be null or empty");
    } else if (Utils.isNullOrEmpty(secret)) {
      throw new Error("secret must not be null or empty");
    } else if (Utils.isNullOrEmpty(productId)) {
      throw new Error("productId must not be null or empty");
    }

    this._apikey = apikey;
    this._secret = secret;
    this._productId = productId;
    this._sessionTimeout = DefaultSessionTimeoutMinutes;
    this._productName = null;
    this._initCallback = null;
    this._singularDeviceId = null;
    this._autoPersistDomain = null;
    this._bannersSupport = false;
    this._bannersOptions = null;
  }

  get apikey() {
    return this._apikey;
  }

  get secret() {
    return this._secret;
  }

  get productId() {
    return this._productId;
  }

  get productName() {
    return this._productName;
  }

  get customUserId() {
    return this._customUserId;
  }

  get sessionTimeOut() {
    return this._sessionTimeout;
  }

  get sessionTimeOutInSeconds() {
    return this._sessionTimeout * 60;
  }

  get isBannersSupported() {
    return this._bannersSupport;
  }

  get bannersOptions() {
    return this._bannersOptions;
  }

  withCustomUserId(customUserId) {
    this._customUserId = customUserId;
    return this;
  }

  withProductName(productName) {
    this._productName = productName;
    return this;
  }

  withLogLevel(logLevel) {
    SingularLog.setLogLevel(logLevel);
    return this;
  }

  withSessionTimeoutInMinutes(sessionTimeout) {
    this._sessionTimeout = sessionTimeout;
    return this;
  }

  withWrapperVersion(wrapper) {
    Utils.setSdkWrapper(wrapper);
    return this;
  }

  withInitFinishedCallback(callback) {
    this._initCallback = callback;
    return this;
  }

  withPersistentSingularDeviceId(singularDeviceId) {
    if (Utils.isNullOrEmpty(singularDeviceId)) {
      SingularLog.debug("Persistent Singular Device Id provided was empty");
      return this;
    }

    this._singularDeviceId = singularDeviceId;

    return this;
  }

  withAutoPersistentSingularDeviceId(domain) {
    if (!Utils.isNullOrEmpty(domain)) {
      this._autoPersistDomain = domain;
    }

    return this;
  }

  withBannersSupport(bannersOptions) {
    this._bannersSupport = true;

    if (bannersOptions && bannersOptions instanceof BannersOptions) {
      this._bannersOptions = bannersOptions;
    }

    return this;
  }

  isSameApp(config) {
    return (
      config &&
      config.apikey === this.apikey &&
      config.productId === this.productId
    );
  }

  _initFinished(singularInitParams) {
    if (!this._initCallback) {
      return;
    }

    this._initCallback(singularInitParams);
  }
}
