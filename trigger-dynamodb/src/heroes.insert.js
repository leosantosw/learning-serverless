const uuid = require('uuid');

class Handler {
    constructor({ dynamoDb}) {
        this.dynamoDb = dynamoDb;
        this.dynamoDbTable = process.env.DYNAMODB_TABLE;
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
            const data = JSON.parse(event.body);
            const dbParams = await this.prepareData(data);
            await this.insertItem(dbParams);
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

module.exports = handler.main.bind(handler);