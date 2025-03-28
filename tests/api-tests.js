import Utils from '../src/utils/utils';
import BaseApi from '../src/api/baseApi';
import {Request, Params, LogLevel, EventTypes} from '../src/consts/constants';
import SingularConfig from '../src/singular/singularConfig';
import EventApi from '../src/api/eventApi';
import ConversionEventApi from '../src/api/conversionEventApi';
import PageVisitApi from '../src/api/pageVisitApi';
import SingularState from "../src/singular/singularState";
import TestUtils from "./testUtils";
import CustomUserIdApi from "../src/api/customUserIdApi";

const assert = require('assert');
const sinon = require('sinon');

window.crypto = require('@trust/webcrypto');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_productId';

describe('api', () => {
    beforeEach(() => {
        const config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
        SingularState.getInstance().init(config);
        sinon.restore();
    });

    describe('baseApi', () => {
        it('should create two apis with different event ids', () => {
            const firstApi = new BaseApi();
            const secondApi = new BaseApi();

            const firstEventId = firstApi.eventId;
            const secondEventId = secondApi.eventId;

            assert(!Utils.isNullOrEmpty(firstEventId), 'Unable to generate event id');
            assert(!Utils.isNullOrEmpty(secondEventId), 'Unable to generate event id');
            assert(firstEventId !== secondEventId, 'Could not generate 2 unique event ids');
        });

        it('should create two apis with the same singular ids', () => {
            const firstApi = new BaseApi();
            const secondApi = new BaseApi();

            const firstSingularId = firstApi._params[Params.SingularDeviceId.toLowerCase()];
            const secondSingularId = secondApi._params[Params.SingularDeviceId.toLowerCase()];

            assert(!Utils.isNullOrEmpty(firstSingularId), 'Unable to generate singular id');
            assert(!Utils.isNullOrEmpty(secondSingularId), 'Unable to generate singular id');
            assert(firstSingularId === secondSingularId, 'Could not persist singular id');
        });

        it('should return a empty request body', () => {
            const api = new BaseApi();
            api._params[Params.UserAgent] = null;

            const body = api._buildRequestBody(api._params);

            assert(Object.keys(body).length === 0, 'request body should be empty');
        });

        it('should return a request body with all relevant params', () => {
            const api = new BaseApi();
            const extra = JSON.stringify({
                key1: 'value1',
                key2: 'value2',
            });

            const {userAgent} = navigator;
            const url = 'https://tests-are-love.com';
            api._params[Params.Extra] = extra;
            api._params[Params.WebUrl] = url;

            const body = api._buildRequestBody(api._params);

            assert(Object.keys(body).length !== 0, 'request body should be empty');

            const bodyValues = body;
            const payload = JSON.parse(bodyValues.payload);

            assert(!Utils.isNullOrEmpty(payload), 'Payload should not be empty');
            assert(payload[Params.WebUrl] === url, 'Web urls are not equal');
            assert(payload[Params.Extra] === extra, 'Extra args are not equal');
            assert(payload[Params.UserAgent] === userAgent, 'User agents are not equal');
        });

        it('should build the url with the relevant data', () => {
            const api = new BaseApi();
            const urlString = api._buildRequestUrl(api._params);
            const url = new URL(urlString);

            assert(url.searchParams.get('h'), 'request does not contain hash');
            for (const key in api._params) {
                if (!Utils.isNullOrEmpty(api._params[key]) && !Request.PostParams.includes(key)) {
                    assert(String(api._params[key]) === url.searchParams.get(key), `value in api does not match value in url:${key}`);
                }
            }
        });
    });

    describe('pageVisitApi', () => {
        it('should create and send page visit and handle a valid response', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

            const pageVisit = new PageVisitApi();

            assert(pageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "First PageVisit Session id should be the first session id value");

            const result = await pageVisit.sendRequest();

            assert(result, 'Failed to handle a valid response');
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");
        });

        it('should create and send page visit and handle an error in the response', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

            const pageVisit = new PageVisitApi();

            assert(pageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "First PageVisit Session id should be the first session id value");

            const result = await pageVisit.sendRequest();

            assert(!result, 'Failed to handle an invalid response');
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");
        });

        it('should create and send page visit and handle an invalid status code', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 400, {status: 'ok'});

            const pageVisit = new PageVisitApi();

            assert(pageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "First PageVisit Session id should be the first session id value");

            const result = await pageVisit.sendRequest();

            assert(!result, 'Failed to handle an invalid response');
            assert(pageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");
        });

        it('should create and send page visit and handle a valid response, and change global session id on second page visit', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

            const firstPageVisit = new PageVisitApi();

            assert(firstPageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(firstPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "First PageVisit Session id should be the first session id value");

            let result = await firstPageVisit.sendRequest();

            assert(result, 'Failed to handle a valid response');
            assert(firstPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");

            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});
            SingularState.getInstance()._newSessionIdNeeded = true;

            const secondPageVisit = new PageVisitApi();

            assert(secondPageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(secondPageVisit._params[Params.SessionId] !== SingularState.getInstance().getSessionId(),
                "Second PageVisit Session id should be a new session id value");

            result = await secondPageVisit.sendRequest();

            assert(result, 'Failed to handle a valid response');
            assert(secondPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should change");
        });

        it('should create and send page visit and handle a valid response, and not change global session id on second page visit fail', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

            const firstPageVisit = new PageVisitApi();

            assert(firstPageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(firstPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "First PageVisit Session id should be the first session id value");

            let result = await firstPageVisit.sendRequest();

            assert(result, 'Failed to handle a valid response');
            assert(firstPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");

            TestUtils.MockHttpResponse(Request.BaseUrl, 400, {status: 'ok'});
            SingularState.getInstance()._newSessionIdNeeded = true;

            const secondPageVisit = new PageVisitApi();

            assert(secondPageVisit._params[Params.SessionId], "Page visit does not contain session id");
            assert(secondPageVisit._params[Params.SessionId] !== SingularState.getInstance().getSessionId(),
                "Second PageVisit Session id should be a new session id value");

            result = await secondPageVisit.sendRequest();

            assert(!result, 'Failed to handle an invalid response');
            assert(secondPageVisit._params[Params.SessionId] !== SingularState.getInstance().getSessionId(),
                "Global session id should not change");
            assert(firstPageVisit._params[Params.SessionId] === SingularState.getInstance().getSessionId(),
                "Global session id should not change");
        });
    });

    describe('eventApi', () => {
        it('should fail creating an event without name', () => {
            let error = false;

            try {
                new EventApi();
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should create an event without extra args', () => {
            new EventApi('event_test');
        });

        it('should create an event with extra args', () => {
            const extra = {
                key1: 'value1',
                key2: 'value2',
            };

            const event = new EventApi('event_test').withArgs(extra);

            assert(Object.keys(event._extra).length > 0, 'Event extra args are empty');
            assert(JSON.stringify(extra) === JSON.stringify(event._extra), 'Event extra args are empty');
        });

        it('should create an event and ignore the empty args passed', () => {
            const event = new EventApi('event_test').withArgs({});
            assert(Object.keys(event._extra).length === 0, 'Event extra args are not empty');
        });

        it('should create an event and ignore the null args passed', () => {
            const event = new EventApi('event_test').withArgs(null);
            assert(Object.keys(event._extra).length === 0, 'Event extra args are not empty');
        });

        it('should create an event without extra args and convert it to json', () => {
            BaseApi.apiClasses = {
                [EventTypes.ConversionEventApi]: ConversionEventApi,
                [EventTypes.CustomUserIdEventApi]: CustomUserIdApi,
                [EventTypes.EventApi]: EventApi,
                [EventTypes.PageVisitApi]: PageVisitApi,
            };

            const event = new EventApi('event_test');
            const parsedEvent = EventApi.fromJsonString(EventApi.toJsonString(event));

            for (const key in event._params) {
                if (!Utils.isNullOrEmpty(event._params[key])) {
                    assert(event._params[key] === parsedEvent._params[key], `value in original event does not match value in parsed event:${key}`);
                }
            }
        });

        it('should create an event with extra args and convert it to json', () => {
            BaseApi.apiClasses = {
                [EventTypes.ConversionEventApi]: ConversionEventApi,
                [EventTypes.CustomUserIdEventApi]: CustomUserIdApi,
                [EventTypes.EventApi]: EventApi,
                [EventTypes.PageVisitApi]: PageVisitApi,
            };

            const extra = {
                key1: 'value1',
                key2: 'value2',
            };

            const event = new EventApi('event_test').withArgs(extra);
            const parsedEvent = EventApi.fromJsonString(EventApi.toJsonString(event));

            for (const paramsKey in event._params) {
                if (!Utils.isNullOrEmpty(event._params[paramsKey])) {
                    assert(event._params[paramsKey] === parsedEvent._params[paramsKey], `value in original event does not match value in parsed event:${paramsKey}`);
                }
            }

            for (const extraKey in event._extra) {
                if (!Utils.isNullOrEmpty(event._extra[extraKey])) {
                    assert(event._extra[extraKey] === parsedEvent._extra[extraKey], `value in original event extra does not match value in parsed event:${extraKey}`);
                }
            }
        });

        it('should create a conversion event', () => {
            const event = new ConversionEventApi('event_test');
            assert(event._params[Params.IsConversion], 'Event was not marked as a conversion event');
        });

        it('should fail creating a revenue event no currency', () => {
            let error = false;

            try {
                new EventApi('event_test').withRevenue(null, 4.20);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should fail creating a revenue event no amount', () => {
            let error = false;

            try {
                new EventApi('event_test').withRevenue('USD', null);
            } catch (e) {
                error = true;
            }

            assert(error, 'Exception should have been raised');
        });

        it('should create a revenue event with valid values', () => {
            const event = new EventApi('event_test').withRevenue('USD', 4.20);

            assert(event._extra[Params.RevenueCurrency] === 'USD', 'Currency was not set properly');
            assert(event._extra[Params.RevenueAmount] === 4.20, 'Revenue amount was not set properly');
            assert(event._params[Params.IsRevenueEvent] === true, 'Event was not flagged as revenue');
        });

        it('should create a revenue event with args', () => {
            const extra = {
                key1: 'value1',
                key2: 'value2',
            };

            const event = new EventApi('event_test').withRevenue('USD', 4.20).withArgs(extra);

            assert(event._params[Params.IsRevenueEvent] === true, 'Event was not flagged as revenue');
            assert(event._extra[Params.RevenueCurrency] === 'USD', 'Currency was not set properly');
            assert(event._extra[Params.RevenueAmount] === 4.20, 'Revenue amount was not set properly');
            assert(event._extra.key1 === 'value1', 'Extra values were not merged correctly');
            assert(event._extra.key2 === 'value2', 'Extra values were not merged correctly');
        });

        it('should create and send an event and handle a valid response', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

            const event = new EventApi('event_test');
            const result = await event.sendRequest();

            assert(result, 'Failed to handle a valid response');
        });

        it('should create and send an event and handle an error in the response', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

            const event = new EventApi('event_test');
            const result = await event.sendRequest();

            assert(!result, 'Failed to handle an invalid response');
        });

        it('should create and send an event and handle an invalid status code', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 400, {status: 'ok'});

            const event = new EventApi('event_test');
            const result = await event.sendRequest();

            assert(!result, 'Failed to handle an invalid response');
        });
    });

    describe('customUserIdApi', () => {
        it('should create and send a custom user id event and handle a valid response', async () => {
            TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

            const event = new CustomUserIdApi();
            event._params[Params.CustomUserId] = "testing";
            const result = await event.sendRequest();

            assert(result, 'Failed to handle a valid response');
        });
    });
});
