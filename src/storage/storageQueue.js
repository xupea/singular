import {Storage} from "../consts/constants";
import BaseApi from "../api/baseApi";
import Utils from "../utils/utils";
import DynamicStorage from "./dynamicStorage";
import SingularLog from "../singular/singularLog";
import SingularState from "../singular/singularState";

export default class StorageQueue {
    constructor() {
        this._storage = new DynamicStorage(Storage.Types.Session, SingularState.getInstance().getStoragePrefix());
        this._queue = this._loadQueueFromStorage();
    }

    enqueue(api) {
        if (Utils.isNullOrEmpty(api) || !(api instanceof BaseApi) || this._queue.length >= Storage.MaxApisInQueue) {
            return;
        }

        SingularLog.debug(`Enqueued api:${JSON.stringify(api)}`);

        this._queue.push(BaseApi.toJsonString(api));
        this._saveQueueToStorage();
    }

    dequeue() {
        if (this.isQueueEmpty()) {
            return null;
        }

        const api = BaseApi.fromJsonString(this._queue.shift());
        this._saveQueueToStorage();

        SingularLog.debug(`Dequeued api:${JSON.stringify(api)}`);

        return api;
    }

    peek() {
        if (this.isQueueEmpty()) {
            return null;
        }

        return BaseApi.fromJsonString(this._queue[0]);
    }

    isQueueEmpty() {
        return this._queue.length <= 0;
    }

    _saveQueueToStorage() {
        this._storage.setItem(Storage.ApiQueueKey, JSON.stringify(this._queue));
    }

    _loadQueueFromStorage() {
        const queueJson = this._storage.getItem(Storage.ApiQueueKey);

        if (!queueJson) {
            return [];
        }

        SingularLog.info(`Api queue loaded from storage`);

        return JSON.parse(queueJson);
    }
}