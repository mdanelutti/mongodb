# MongoDB

[![Build Status](https://travis-ci.org/janis-commerce/mongodb.svg?branch=master)](https://travis-ci.org/janis-commerce/mongodb)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/mongodb/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/mongodb?branch=master)

## Installation

```sh
npm install --save @janiscommerce/mongodb
```

## API

### `new MongoDB({config})`
Constructs the MongoDB driver instance, connected with the `config [Object]`.

**Config validations:**  

- host `[String]` (optional): MongoDB host, default: `localhost`  
- protocol `[String]` (optional): host protocol, default: `mongodb://`  
- port `[Number]` (optional): host port, default: `27017`  
- user `[String]` (optional): host username, default none  
- password `[String]` (optional): host user password, default none  
- database `[String]` **(required)**: MongoDB database
- limit `[Number]` (optional): Limit for `get`/`getTotals` operations, default: `500`  

**Config usage:**
```js
{
   protocol: 'mongodb://',
   host: 'localhost',
   port: 27017,
   limit: 500,
   user: 'fizzmod',
   password: 'sarasa',
   database: 'myDB'
}
```

### ***async*** `createIndexes(model)`
Creates indexes and unique indexes from the model to the MongoDB database.  
Requires a `model [Model]`  
**Important:** This method must be executed before any operation with new databases. If not, the unique indexes will not have any effect in your database.  

**Indexes and unique indexes in Model:**  
In order to avoid errors you must to specify your indexes and unique indexes in the Model:  
- indexes `[Array]`: The indexes of your model, also you can add an `[Array]` for combine indexes. See example below.  
- uniqueIndexes `[Array]`: The unique indexes of your model, also you can add an `[Array]` for combine unique indexes. See example below.  

**Combined indexes are used for getting filters with multiple indexes due they are combined as one**

**Model example**  
```js
class MyModel extends Model {

   static get uniqueIndexes() {
      return [
         'myUniqueIndex',
         ['my', 'combined','unique','indexes']
      ];
   }

   static get indexes() {
      return [
         'myIndex',
         ['my', 'combined', 'indexes']
      ];
   }

}
```

### ***async*** `insert(model, {item})`
Insert a item into the database.
Requires a `model [Model]` and `item [Object]`.
Returns `String` *ID* of the item inserted or rejects if cannot.

### ***async*** `multiInsert(model, [{items}])`
Inserts multiple items into the database.
Requires a `model [Model]` and `item [Object array]`.
Returns `true` if the operation was successfull or `false` if not.

### ***async*** `update(model, {values}, {filter})`
Updates one or multiple items from the database.
Requires a `model [Model]`, `values [Object]` and `filter [Object]` (MongoDB filter).
Returns the modified/updated elements count.

### ***async*** `get(model, {parameters})`
Search elements from the database then returns an `[Array]` with the results `[Object]`.
Requires a `model [Model]`, `parameters [Object]` are optional.

Parameters (all are optional):
- order `[Object]`: Order params for getted items, Example: `{ myField: 'asc', myOtherField: 'desc' }`
- limit `[Number]`: Max amount of items per page to get. Default: 500 or setted on config when constructs.
- page `[Number]`: Items of the specified page
- filters `[Object]`: MongoDB filters, leave empty for all items.

Parameters example:
```js
{
   limit: 1000, // Default 500 from config
   page: 2,
   order: {
      itemField: 'asc'
   },
   filters: {
      itemField: 'foobar',
      otherItemField: {
         'value': ['foo', 'bar'],
         'type' : 'in'
      }
   }
}
```
#### Filters

The filters has a structure to apply, by default uses `equal`.
For example:
```js
{
   filters: {
    'aField': 'valueToFilter'
   }
}
```
Transforms to:
```js
{
   <aField>: { $eq: <valueToFilter> }
}
```
If you want to apply different filters it should be as follows:
```js
{
    filters: {
        'aField': { 
            value: 'valueToFilter', // required(string or array)
            type: 'aTypeChoosen' //optional
        }
   }
}
```

#### Nested filters
Also you can use nested filters, for example:
```js
{
   filters: {
      'aField.property':{
         value: 'valueToFilter', // required(string or array)
         type: 'aTypeChoosen' //optional
      }
   }
}
```

The possible types to use are:

| Filter        | Mongo filter          |
|---------------|-----------------------|
| equal         | $eq                   |
| notEqual      | $ne                   |
| greater       | $gt                   |
| greaterOrEqual| $gte                  |
| lesser        | $lt                   |
| lesserOrEqual | $lte                  |
| in            | $in                   |
| notIn         | $nin                  |
| search        | $regex                |
| all           | $all                  |


You can also add filters in the model defining the `fields` function as follow:
```js
static get fields() {
    return {
        'aFieldWithName': {
            type: 'aTypeDefined',
            field: 'fieldInMongoDB'
        },
        'anotherFieldName': {
            type: 'aTypeDefined',
            field: 'fieldInMongoDB'
        },
        {
            ...
        }
    }
}
```
In which we have:

`afieldWithName` and `anotherFieldName` as name default in Model <br/>
`aTypeDefined` as a possible type to use as filter<br/>
`fieldInMongoDB` as the field in MongoDB to compare<br/>

For example:

```js
static get fields() {
    return {
        date_from: {
            type: 'greaterOrEqual',
            field: 'date'
        },
        date_from_g: {
            type: 'greater',
            field: 'date'
        }
    }
}
```


### ***async*** `getTotals(model)`
Get the totals of the items from the latest get operation with pagination.
Requires a `model [Model]`
Returns an `[Object]` with the total count, page size, pages and selected page.

getTotals return example:
```js
{
   total: 1000,
   pageSize: 1000, // Limit from latest get operation or 500 by default
   pages: 2,
   page: 1
}
```

### ***async*** `save(model, {item})`
Insert/update a item into the database.
Requires a `model [Model]` and `item [Object]`.
Returns `String` **ID** of the item *inserted* or **Unique Index** used as filter if it was *updated* or rejects if cannot.

### ***async*** `multiSave(model, [{items}], limit)`
Insert/update multiple items into the database.
Requires a `model [Model]` and `items [Object array]`.
`limit [Number]` (optional, default 1000): Specifies the max amount of items that can be written at same time.
Returns `true/false` if the result was successfully or not.

### ***async*** `remove(model, {item})`
Removes the specified item from the database.
Requires a `model [Model]` and `item [Object]`.
Returns `true/false` if the result was successfully or not.

### ***async*** `multiRemove(model, {filter})`
Removes multiple items from the database.
Requires a `model [Model]` and `filter [Object]` (MongoDB filter).
Returns `deletedCount [Number]`.

## Errors

The errors are informed with a `MongoDBError`.
This object has a code that can be useful for a correct error handling.  
The codes are the following:

| Code | Description                    |
|------|--------------------------------|
| 1    | Model with empty unique indexes|
| 2    | Empty unique indexes           |
| 3    | Invalid or empty model         |
| 4    | Internal mongodb error         |
| 5    | Invalid item                   |

The config validation errors are informed with a `MongoDBConfigError`
This object has a code that can be useful for a correct error handling.  
The codes are the following:

| Code | Description                    |
|------|--------------------------------|
| 1    | Invalid config                 |
| 2    | Invalid setting                |
| 3    | Required setting               |

## Usage

```js
const MongoDB = require('@janiscommerce/mongodb');
const Model = require('myModel');

const mongo = new MongoDB({
   protocol: 'mongodb://',
   host: 'localhost', 
   port: 27017
   user: 'fizzmod',
   password: 'sarasa',
   database: 'myDB'
});

const model = new Model();

mongo.createIndexes(model);

(async function() {

   let result;

   // Insert
   result = await mongo.insert(model, {
      id: 1,
      value: 'sarasa'
   }); // expected return: '000000054361564751d8516f'

   // multiInsert
   result = await mongo.multiInsert(model, [
      { id: 1, value: 'sarasa 1' },
      { id: 2, value: 'sarasa 2' },
      { id: 3, value: 'sarasa 3' }
   ]); // expected return: true

   // update
   result = await mongo.update(model,
      { value: 'foobar' },
      { id: 1 }
   ); // expected return: 1 (row with id == 1 will change his "value" from "sarasa" to "foobar")

   // get
   result = await mongo.get(model, {}) // expected return: all entries
   result = await mongo.get(model, { filters: { id: 1 } }) // expected return: row with id == 1
   result = await mongo.get(model, { limit: 10, page: 2 filters: { value: 'foo' } }) // expected return: page 2 of elements with value "foo" with a page size of 10 elements.
   result = await mongo.get(model, { order: { id: 'desc' } }); // expected return: all entries ordered descendently by id

   // getTotals
   result = await mongo.getTotals(model);

   /* Example return
      {
         page: 2,
         limit: 10,
         pages: 5,
         total: 50
      }
   */

   // save
   result = await mongo.save(model, {
      id: 1,
      value: 'sarasa'
   }); // expected return: '00000058faf66849077316ba'

   // multiSave
   result = await mongo.multiSave(model, [
      { id: 1, value: 'sarasa 1' },
      { id: 2, value: 'sarasa 2' },
      { id: 3, value: 'sarasa 3' }
   ]); // expected return: true

   // remove
   result = await mongo.remove(model, { id: '0000000055f2255a1a8e0c54' }); // expected return: true

   // multiRemove
   result = await mongo.multiRemove(model, { value: /sarasa/ });
   // expected return: 3 (should delete all items that contains "sarasa" on "value" field).
});
```
