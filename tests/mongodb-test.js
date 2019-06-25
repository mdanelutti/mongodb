'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const mock = require('mock-require');

mock('mongodb', 'mongo-mock');

const MongoMock = require('mongodb');

MongoMock.max_delay = 0; // Evitar que los tests demoren mas de lo necesario

const { MongoClient } = require('mongodb');

const MongoDB = require('./../index');

const { MongoDBError } = require('./../lib');

class Model {

	static get uniqueIndexes() {
		return [
			'_id'
		];
	}

	static get indexes() {
		return [
			'value'
		];
	}

	getTable() {
		return 'table';
	}
}

const mongodb = new MongoDB({
	host: 'mongodb://localhost:3306/fizzmod',
	user: 'root',
	database: 'myDB'
});

const model = new Model();

describe('MongoDB', () => {

	beforeEach(() => {
		sandbox.restore();
	});

	after(() => {
		mock.stopAll();
	});

	describe('checkConnection()', () => {

		it('should call MongoClient connect when checks the connection', async () => {

			const spy = sandbox.spy(MongoClient, 'connect');

			try {
				await mongodb.checkConnection();
			} catch(err) {
				// nothing...
			}

			sandbox.assert.calledOnce(spy);
		});
	});

	describe('formatIndex()', () => {

		it('should return formatted index object when recieves an array as parameter', () => {
			assert.deepEqual(mongodb.formatIndex(['foo', 'bar']), { foo: 1, bar: 1 });
		});

		it('should return formatted index object when recieves a string as parameter', () => {
			assert.deepEqual(mongodb.formatIndex('foo'), { foo: 1 });
		});

	});

	describe('createIndexes()', () => {

		it('should not reject when create indexes without unique indexes in the model', async () => {

			sandbox.stub(model.constructor, 'uniqueIndexes').get(() => {
				return null;
			});

			await assert.doesNotReject(mongodb.createIndexes(model));
		});

		it('should not reject when create indexes without indexes in the model', async () => {

			sandbox.stub(model.constructor, 'indexes').get(() => {
				return null;
			});

			await assert.doesNotReject(mongodb.createIndexes(model));
		});

		it('should not reject when create indexes with indexes and unique indexes in the model', async () => {
			await assert.doesNotReject(mongodb.createIndexes(model));
		});

		it('should reject when try to create indexes with an invalid model', async () => {
			await assert.rejects(mongodb.createIndexes(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('prepareFields()', () => {

		it('should call mongodb ObjectID when prepare the fields and must change the "fields._id" value', () => {

			const fields = {
				_id: 1,
				value: 'sarasa'
			};

			mongodb.prepareFields(fields);

			assert.notDeepEqual(fields._id, 1); // eslint-disable-line
		});
	});

	describe('getFilter()', () => {

		it('should return non empty filter object when get filters with an array as parameter', () => {

			sandbox.stub(model.constructor, 'indexes').get(() => {
				return [['value']];
			});

			const result = mongodb.getFilter(model, { value: 'sarasa' });

			assert.deepEqual(result.value, 'sarasa');
		});

		it('should return non empty filter object when get filters with an object as parameter', () => {

			const result = mongodb.getFilter(model, { value: 'sarasa' });

			assert.deepEqual(result.value, 'sarasa');
		});

		it('should throw when get filters with a model without indexes', () => {

			assert.throws(() => {
				mongodb.getFilter({});
			}, {
				name: 'MongoDBError',
				code: MongoDBError.codes.MODEL_EMPTY_INDEXES
			});
		});

		it('should throw when get filters if the model indexes not matches with any of the filters', () => {

			assert.throws(() => {
				mongodb.getFilter(model);
			}, {
				name: 'MongoDBError',
				code: MongoDBError.codes.EMPTY_INDEXES
			});

		});

		it('should throw when get filters with an invalid model', () => {
			assert.throws(() => {
				mongodb.getFilter();
			}, {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('insert()', () => {

		it('should return true when the data was successfully inserted into db', async () => {

			const result = await mongodb.insert(model, {	value: 'sarasa' });

			assert.deepEqual(result, true);
		});

		it('should return false when the data insertion was failed', async () => {

			const result = await mongodb.insert({ dbname: 'sarasa' });

			assert.deepEqual(result, false);
		});

		it('should reject when try to insert with an invalid model', async () => {
			await assert.rejects(mongodb.insert(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('get()', () => {

		it('should return data object when get the data from db', async () => {

			await mongodb.insert(model, { value: 'sarasa' });

			const result = await mongodb.get(model, {});

			assert.deepEqual(result[0].value, 'sarasa');
		});

		it('should reject when try to get data with an invalid model', async () => {
			await assert.rejects(mongodb.get(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('save()', () => {

		it('should return true when only one item was sucessfully updated/upserted', async () => {

			const result = await mongodb.save(model, { value: 'sarasa' });

			assert.deepEqual(result, true);
		});

		it('should return false when no items was updated/upserted', async () => {

			await mongodb.checkConnection();

			const collection = mongodb.client.db(mongodb.config.database).collection(model.getTable());

			sandbox.stub(collection, 'updateOne').returns({
				matchedCount: 2
			});

			const result = await mongodb.save(model, { value: 'sarasa' });

			assert.deepEqual(result, false);
		});

		it('should reject when try to save with an invalid model', async () => {
			await assert.rejects(mongodb.save(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('update()', () => {

		it('should return modified count when updates an item', async () => {

			await mongodb.insert(model, { value: 'foobar' });

			const result = await mongodb.update(model, { value: 'sarasa' }, { value: 'foobar' });

			assert.deepEqual(result, 1);
		});

		it('should reject when try to updated with an invalid model', async () => {
			await assert.rejects(mongodb.update(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('multiInsert()', () => {

		it('should return true when the multi insert operation was successful', async () => {

			const items = [
				{ value: 'sarasa1' },
				{ value: 'sarasa2' },
				{ value: 'sarasa3' }
			];

			const result = await mongodb.multiInsert(model, items);

			assert.deepEqual(result, true);
		});

		it('should reject when try to multi insert with an invalid model', async () => {
			await assert.rejects(mongodb.multiInsert(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('multiSave', () => {

		it('should call bulkWrite when multi saving items and must return true if the result was successful', async () => {

			const items = [
				{ value: 'sarasa1' },
				{ value: 'sarasa2' }
			];

			await mongodb.checkConnection();

			const collection = mongodb.client.db(mongodb.config.database).collection(model.getTable());

			sandbox.stub(collection, 'bulkWrite').callsFake(updateItems => {

				const fakeResult = {
					result: {
						ok: false
					}
				};

				if(Array.isArray(updateItems) && typeof updateItems[0] === 'object')
					fakeResult.result.ok = true;

				return fakeResult;
			});

			const result = await mongodb.multiSave(model, items);

			assert.deepEqual(result, true);
		});

		it('should return false when try to multi save without items', async () => {

			const result = await mongodb.multiSave(model, []);

			assert.deepEqual(result, false);
		});

		it('should return false when any of the save stacks rejects', async () => {

			const items = Array(30).fill()
				.map((item, i) => {
					return {
						value: 'sarasa' + i
					};
				});

			await mongodb.checkConnection();

			const collection = mongodb.client.db(mongodb.config.database).collection(model.getTable());

			const stub = sandbox.stub(collection, 'bulkWrite');

			stub.onCall(0).resolves();
			stub.onCall(1).rejects();
			stub.onCall(2).resolves();

			const result = await mongodb.multiSave(model, items, 10);

			assert.deepEqual(result, false);
		});

		it('should reject when try to multi save with an invalid model', async () => {
			await assert.rejects(mongodb.multiSave(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

	describe('remove()', () => {

		it('should return true when successfully removes the item', async () => {

			await mongodb.insert(model, { value: 'foobar' });

			const result = await mongodb.remove(model, { value: 'foobar' });

			assert.deepEqual(result, true);
		});

		it('should return false when can\'t remove the item', async () => {

			const result = await mongodb.remove(model, { value: 'foobar' });

			assert.deepEqual(result, false);
		});

		it('should reject when try to remove an item with an invalid model', async () => {
			await assert.rejects(mongodb.remove(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});
	});

	describe('multiRemove()', () => {

		it('should return deleted count from mongodb when multi remove items', async () => {

			await mongodb.checkConnection();

			const collection = mongodb.client.db(mongodb.config.database).collection(model.getTable());

			sandbox.stub(collection, 'deleteMany').callsFake(async filter => {
				if(filter) {
					const result = await mongodb.get(model, { filters: filter });
					return { deletedCount: result.length };
				}
				return { deletedCount: 0 };
			});

			await mongodb.multiInsert(model, [{ value: 'deleteThis' }, { value: 'deleteThis2' }]);

			const result = await mongodb.multiRemove(model, { value: { $in: ['deleteThis', 'deleteThis2'] } });

			assert.deepEqual(result, 2);
		});

		it('should reject when try to multi remove items with an invalid model', async () => {
			await assert.rejects(mongodb.multiRemove(), {
				name: 'MongoDBError',
				code: MongoDBError.codes.INVALID_MODEL
			});
		});

	});

});
