import {Storage} from "../consts/constants";
import Utils from "../utils/utils";
import SingularLog from "../singular/singularLog";

export default class DynamicStorage {

    static _availableStorageType;
    _isInitialized = false;

    constructor(memoryType, storagePrefix) {
        // On the first storage allocation, we check what's the max level of storage accessible
        DynamicStorage.getAvailableStorageType();

        this._storagePrefix = storagePrefix;
        this._isInitialized = true;

        if (memoryType === Storage.Types.Local && DynamicStorage._isLocalStorageAvailable()) {
            this._storage = localStorage;
            return;
        }

        if ((memoryType === Storage.Types.Local || memoryType === Storage.Types.Session) &&
            DynamicStorage._isSessionStorageAvailable()) {
            this._storage = sessionStorage;
            return;
        }

        this._buildMemoryStorage();
    }

    static getAvailableStorageType() {
        // Once the available storage type is found, there is no need to check again
        if (this._availableStorageType) {
            return this._availableStorageType;
        }

        if (this._isLocalStorageAvailable()) {
            this._availableStorageType = Storage.Types.Local;
        } else if (this._isSessionStorageAvailable()) {
            this._availableStorageType = Storage.Types.Session;
        } else {
            this._availableStorageType = Storage.Types.Memory;
        }

        return this._availableStorageType;
    }

    getItem(key) {
        if (Utils.isNullOrEmpty(key) || !this._isInitialized) {
            return null;
        }

        return this._storage.getItem(`${this._storagePrefix}_${key}`);
    }

    setItem(key, value) {
        if (Utils.isNullOrEmpty(key) || !value || !this._isInitialized) {
            return;
        }

        this._storage.setItem(`${this._storagePrefix}_${key}`, value);
    }

    removeItem(key) {
        if (Utils.isNullOrEmpty(key) || !this._isInitialized) {
            return;
        }

        this._storage.removeItem(`${this._storagePrefix}_${key}`);
    }

    static _isLocalStorageAvailable() {
        // If the storage availability is already found, no need to check again
        if (this._availableStorageType === Storage.Types.Local) {
            return true;
        }

        try {
            localStorage.setItem(Storage.StorageEnabledTestKey, Storage.StorageEnabledTestValue);
            const result = localStorage.getItem(Storage.StorageEnabledTestKey) === Storage.StorageEnabledTestValue;
            localStorage.removeItem(Storage.StorageEnabledTestKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    static _isSessionStorageAvailable() {
        // If the storage availability is already found, no need to check again
        if (this._availableStorageType === Storage.Types.Local ||
            this._availableStorageType === Storage.Types.Session) {
            return true;
        }

        try {
            sessionStorage.setItem(Storage.StorageEnabledTestKey, Storage.StorageEnabledTestValue);
            const result = sessionStorage.getItem(Storage.StorageEnabledTestKey) === Storage.StorageEnabledTestValue;
            sessionStorage.removeItem(Storage.StorageEnabledTestKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    _buildMemoryStorage() {
        SingularLog.warn("Using memory storage");
        this._storage = {
            _data: {},
            setItem: (key, value) => {
                this._storage._data[key] = value;
            },
            getItem: (key) => {
                return this._storage._data[key];
            },
            removeItem: (key) => {
                delete this._storage._data[key];
            },
        };
    }
}
