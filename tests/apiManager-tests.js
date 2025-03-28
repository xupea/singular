// Some of these tests will mock requests, but just to be on the safe side we change the base url to a fake one
import ApiManager from '../src/api/apiManager';
import EventApi from '../src/api/eventApi';
import SingularConfig from '../src/singular/singularConfig';
import PageVisitApi from '../src/api/pageVisitApi';
import BaseApi from '../src/api/baseApi';
import {BrowserEvents, LogLevel, Request} from '../src/consts/constants';
import SingularState from "../src/singular/singularState";
import TestUtils from "./testUtils";

const assert = require('assert');
const sinon = require('sinon');

window.crypto = require('@trust/webcrypto');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_productId';

describe('apiManager', () => {
    let apiManager;

    beforeEach(() => {
        const config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
        SingularState.getInstance().init(config);
        sessionStorage.clear();
        apiManager = new ApiManager();
        sinon.restore();
    });

    afterEach(() => {
        window.removeEventListener(BrowserEvents.TabClosed, apiManager._tabClosed);
    });

    it('should add the event to the queue and start the sending process', () => {
        const stub = sinon.stub(apiManager, '_startSendingApis').returns();

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');

        const event = new EventApi('test_event');
        apiManager.sendApi(event);

        assert(!apiManager._storageQueue.isQueueEmpty(), 'Event queue should not be empty');
        assert(stub.called, 'Sending event process has not started');
    });

    it('should not add the null to the event queue and not start the sending process', () => {
        const stub = sinon.stub(apiManager, '_startSendingApis').returns();

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        apiManager.sendApi(null);

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!stub.called, 'Sending event process has started');
    });

    it('should not add the string to the event queue and not start the sending process', () => {
        const stub = sinon.stub(apiManager, '_startSendingApis').returns();

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        apiManager.sendApi('test_string');

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!stub.called, 'Sending event process has started');
    });

    it('should add session to the queue and send the request, emptying the queue', async () => {
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

        const pageVisit = new PageVisitApi();
        await apiManager.sendApi(pageVisit);
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');
    });

    it('should add session to the queue and send the request, it will fail and remain in the queue', async () => {
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');

        const pageVisit = new PageVisitApi();
        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

        await apiManager.sendApi(pageVisit);

        assert(!apiManager._storageQueue.isQueueEmpty(), 'Event queue should contain the session');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');
    });

    it('should fail on the first request, the second event request will restart the queue and both event should pass', async () => {
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

        const pageVisit = new PageVisitApi();
        const stub = sinon.stub(BaseApi.prototype, 'sendRequest');
        stub.onFirstCall().returns(false);
        stub.returns(true);

        await apiManager.sendApi(pageVisit);
        assert(stub.called, 'The request has not been sent');
        assert(!apiManager._storageQueue.isQueueEmpty(), 'Event queue should contain the session');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');

        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

        const event = new EventApi('test_event');
        await apiManager.sendApi(event);
        assert(stub.callCount === 3, 'One or more of the requests were not sent');
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');
    });

    it('should fail on the first request, then tab closed is simulated, causing all of the events to be sent again and the will pass', async () => {
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

        const pageVisit = new PageVisitApi();
        await apiManager.sendApi(pageVisit);

        assert(!apiManager._storageQueue.isQueueEmpty(), 'Event queue should contain the session');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');

        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'ok'});

        // Events should be cleared from the queue
        await apiManager._tabClosed();

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');
    });

    it('should fail on the first request, then tab closed is simulated, causing all of the events to be sent again and they would still fail but the queue will be cleared anyway', async () => {
        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

        const pageVisit = new PageVisitApi();
        await apiManager.sendApi(pageVisit);

        assert(!apiManager._storageQueue.isQueueEmpty(), 'Event queue should contain the session');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');

        TestUtils.MockHttpResponse(Request.BaseUrl, 200, {status: 'error'});

        // Events should be cleared from the queue
        await apiManager._tabClosed();

        assert(apiManager._storageQueue.isQueueEmpty(), 'Event queue should be empty');
        assert(!apiManager._isSendingApis, 'isSendingApis flag should be turned off');
    });
});
