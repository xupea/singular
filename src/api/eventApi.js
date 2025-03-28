import {EventTypes, Params, Request} from '../consts/constants';
import BaseApi from './baseApi';
import Utils from '../utils/utils';
import SingularState from "../singular/singularState";

export default class EventApi extends BaseApi {
    constructor(eventName) {
        if (Utils.isNullOrEmpty(eventName)) {
            throw new Error('eventName must not be null or empty');
        }

        super();
        this._apiType = EventTypes.EventApi;
        this._endpoint = Request.Endpoints.Event;

        this._params = {
            ...this._params,
            [Params.EventProductName]: SingularState.getInstance().getSingularConfig().productName,
            [Params.EventName]: eventName,
            [Params.IsRevenueEvent]: false,
            [Params.IsFirstEvent]: SingularState.getInstance().IsFirstEvent(eventName),
        };
    }

    withRevenue(currency, amount) {
        if (Utils.isNullOrEmpty(currency)) {
            throw new Error('Currency must not be null or empty');
        } else if (Utils.isNullOrEmpty(amount)) {
            throw new Error('Amount must not be null or empty');
        }

        this._extra[Params.RevenueCurrency] = currency;
        this._extra[Params.RevenueAmount] = amount;
        this._params[Params.IsRevenueEvent] = true;
        return this;
    }

    withArgs(args) {
        if (!args || Object.keys(args).length === 0) {
            return this;
        }

        this._extra = {...this._extra, ...args};
        return this;
    }

    withParams(params) {
        if (!params || Object.keys(params).length === 0) {
            return this;
        }

        this._params = { ...this._params, ...params };
        return this;
    }
}
