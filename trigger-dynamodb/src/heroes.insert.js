const decoratorValidator = require('./util/decoratorValidator')
const globalEnum = require('./util/globalEnum');
const uuid = require('uuid');
const Joi = require('joi');

class Handler {
    constructor({ dynamoDb}) {
        this.dynamoDb = dynamoDb;
        this.dynamoDbTable = process.env.DYNAMODB_TABLE;
    }

    static validator(data){
        return Joi.object().keys({
            name: Joi.string().max(100).min(2).required(),
            power: Joi.number().required(),
        }).validate(data);
    }

    prepareData(data) {
        const params = {
            TableName: this.dynamoDbTable,
            Item: {
                id: uuid.v4(),
                createdAt: new Date().toISOString(),
                ...data,
            }
        }

        return params;
    }

    insertItem(params) {
        return this.dynamoDb.put(params).promise();
    }

    handleSuccess(data) {
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    }

    handleError(data) {
        return {
            statusCode: data.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Couldn\'t create the item.',
        }
    }

    async main(event) {
        try {
            const data = event.body
            const dbParams = await this.prepareData(data);
            // await this.insertItem(dbParams);
            return this.handleSuccess(dbParams.Item);

        } catch (error) {
            console.error('Error:', error.stack);
            return this.handleError({ statusCode: 500 });
        }
    }
}

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const handler = new Handler({
    dynamoDb
});

module.exports = decoratorValidator(
    handler.main.bind(handler), 
    Handler.validator, 
    globalEnum.ARG_TYPE.BODY
);