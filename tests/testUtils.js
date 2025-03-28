const nock = require('nock');

export default class TestUtils {
    static MockHttpResponse(requestUrl, statusCode, responseBody) {
        nock(requestUrl).post(() => true).reply(statusCode, responseBody, {
            'Access-Control-Allow-Origin': '*'
        });
    }
}