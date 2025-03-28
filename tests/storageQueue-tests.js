import StorageQueue from '../src/storage/storageQueue';
import PageVisitApi from '../src/api/pageVisitApi';
import EventApi from '../src/api/eventApi';
import SingularConfig from '../src/singular/singularConfig';
import SingularState from "../src/singular/singularState";
import {LogLevel, Storage} from "../src/consts/constants";

const assert = require('assert');
window.crypto = require('@trust/webcrypto');

const apiKey = 'random_key';
const secret = 'random_secret';
const productId = 'random_productId';

describe('storageQueue', () => {
    describe('storageQueue without sessionStorage', () => {
        beforeEach(() => {
            const config = new SingularConfig(apiKey, secret, productId).withLogLevel(LogLevel.Debug);
            SingularState.getInstance().init(config);
            sessionStorage.clear();
        });

        it('should enqueue one event', () => {
            const storage = new StorageQueue();
            const event = new PageVisitApi();

            storage.enqueue(event);

            assert(storage._queue.length === 1, 'Enqueuing event has failed');
        });

        it('should enqueue 2 events', () => {
            const storage = new StorageQueue();
            const eventOne = new PageVisitApi();
            const eventTwo = new EventApi('test_event');

            storage.enqueue(eventOne);

            assert(storage._queue.length === 1, 'Enqueue 1 event has failed');

            storage.enqueue(eventTwo);

            assert(storage._queue.length === 2, 'Enqueue 2 events has failed');
        });

        it('should enqueue 2 events and peek on the first one', () => {
            const storage = new StorageQueue();
            const eventOne = new PageVisitApi();
            const eventTwo = new EventApi('test_event');

            storage.enqueue(eventOne);
            storage.enqueue(eventTwo);

            assert(storage._queue.length === 2, 'Enqueue event has failed');
            assert(storage.peek().eventId === eventOne.eventId, 'Peeking at the head of the queue has failed');
        });

        it('should enqueue 2 events and dequeue the first one', () => {
            const storage = new StorageQueue();
            const eventOne = new PageVisitApi();
            const eventTwo = new EventApi('test_event');

            storage.enqueue(eventOne);
            storage.enqueue(eventTwo);

            assert(storage._queue.length === 2, 'Enqueue events has failed');

            const event = storage.dequeue();

            assert(event.eventId === eventOne.eventId, 'Dequeue has failed to persist event id');
            assert(storage._queue.length === 1, 'Failed to delete event after dequeue');
            assert(storage.peek().eventId === eventTwo.eventId, 'Dequeue has failed');
        });

        it('should enqueue 2 events and dequeue the both of them', () => {
            const storage = new StorageQueue();
            const eventOne = new PageVisitApi();
            const eventTwo = new EventApi('test_event');

            storage.enqueue(eventOne);
            storage.enqueue(eventTwo);

            assert(storage._queue.length === 2, 'Enqueue events has failed');

            let event = storage.dequeue();

            assert(event.eventId === eventOne.eventId, 'Dequeue has failed to persist first event id');
            assert(storage._queue.length === 1, 'Failed to delete event after dequeue');

            event = storage.dequeue();

            assert(event.eventId === eventTwo.eventId, 'Dequeue has failed to persist second event id');
            assert(storage.isQueueEmpty(), 'Queue is not empty');
        });

        it('should not enqueue null', () => {
            const storage = new StorageQueue();

            storage.enqueue(null);

            assert(storage.isQueueEmpty(), 'Null was enqueued');
        });

        it('should not enqueue string', () => {
            const storage = new StorageQueue();

            storage.enqueue('test_string');

            assert(storage.isQueueEmpty(), 'String was enqueued');
        });
    });

    describe('storageQueue with sessionStorage', () => {
        let setupStorage;
        beforeEach(() => {
            const config = new SingularConfig(apiKey, secret, productId);
            SingularState.getInstance().init(config);
            sessionStorage.clear();
            setupStorage = new StorageQueue();
        });

        it('should load one event from the sessionStorage', () => {
            const event = new EventApi('test_event');
            setupStorage.enqueue(event);

            const storage = new StorageQueue();

            assert(!storage.isQueueEmpty(), 'Did not load queue from storage');
            assert(storage.peek().eventId === event.eventId, 'Did not persist event id when loading from storage');
        });

        it('should load two events from the sessionStorage and maintain their order', () => {
            const eventOne = new EventApi('test_event');
            const eventTwo = new EventApi('test_event');
            setupStorage.enqueue(eventOne);
            setupStorage.enqueue(eventTwo);

            let storage = new StorageQueue();

            assert(storage._queue.length === 2, 'Did not load the queue correctly from storage');
            assert(!storage.isQueueEmpty(), 'Did not load queue from storage');

            let event = storage.dequeue();

            assert(event.eventId === eventOne.eventId, 'Did not persist event id when loading from storage');

            storage = new StorageQueue();

            assert(storage._queue.length === 1, 'Did not load the queue correctly from storage');
            assert(!storage.isQueueEmpty(), 'Did not load queue from storage');
            event = storage.dequeue();

            assert(event.eventId === eventTwo.eventId, 'Did not persist event id when loading from storage');

            storage = new StorageQueue();

            assert(storage.isQueueEmpty(), 'Queue was not saved correctly to storage');
        });
    });
});
