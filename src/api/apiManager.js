import BaseApi from "./baseApi";
import StorageQueue from "../storage/storageQueue";
import {BrowserEvents, EventTypes} from "../consts/constants";
import Utils from "../utils/utils";
import ConversionEventApi from "./conversionEventApi";
import PageVisitApi from "./pageVisitApi";
import EventApi from "./eventApi";
import CustomUserIdApi from "./customUserIdApi";

export default class ApiManager {
    constructor() {
        this._setSupportedApis();

        this._skipFailed = false;
        this._isSendingApis = false;
        this._storageQueue = new StorageQueue();
        window.addEventListener(BrowserEvents.TabClosed, this._tabClosed);
        this._startSendingApis();
    }

    sendApi(api) {
        if (Utils.isNullOrEmpty(api) || !(api instanceof BaseApi)) {
            return;
        }

        this._storageQueue.enqueue(api);
        return this._startSendingApis();
    }

    _tabClosed = () => {
        this._skipFailed = true;
        return this._startSendingApis();
    };

    async _startSendingApis() {
        if (this._isSendingApis) {
            return;
        }

        this._isSendingApis = true;

        while (!this._storageQueue.isQueueEmpty()) {
            const api = this._storageQueue.peek();
            const result = await api.sendRequest();

            if (!result && !this._skipFailed) {
                break;
            }

            this._storageQueue.dequeue();
        }

        this._isSendingApis = false;
    }

    _setSupportedApis() {
        BaseApi.apiClasses = {
            [EventTypes.ConversionEventApi]: ConversionEventApi,
            [EventTypes.CustomUserIdEventApi]: CustomUserIdApi,
            [EventTypes.EventApi]: EventApi,
            [EventTypes.PageVisitApi]: PageVisitApi,
        };
    }
}
