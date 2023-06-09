const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand,  } = require("@aws-sdk/lib-dynamodb");
const jwt = require('jsonwebtoken');

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {

    let token = event.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.PRIVATEKEY_ACCESSTOCKEN);

    if (!decoded.nickname) {
      return {
        statusCode: 500,
        body: JSON.stringify(`tocken nickname error`),
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        versionId: "1.0.0",
        regionId: "south_asia",
      },
    };

    const productIdData = await ddbDocClient.send(new GetCommand(params));

    if (!productIdData) {
      return {
        statusCode: 404,
        body: JSON.stringify('product id not found'),
      };
    }

    const idCount = parseInt(productIdData.Item.count ? productIdData.Item.count : 0) + 1;

    const productIdDataUpdate = {
      ...productIdData.Item,
      count: idCount
    };

    const updateParams = {
      TableName: TABLE_NAME,
      Item: productIdDataUpdate,
    };
      
    await ddbDocClient.send(new PutCommand(updateParams));

    const currentDate = new Date();
    // const currentMonth = currentDate.getMonth();
    // const currentDay = currentDate.getDay();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentSecond = currentDate.getSeconds();
    // const currentMilliSecond = currentDate.getMilliseconds();

    return {
      statusCode: 200,
      body: JSON.stringify({ id: `PV1SA${idCount}-${currentHour}${currentMinute}${currentSecond}${decoded.nickname.toString().substring(0, 2).toUpperCase()}` })
    };

  } catch (err) {

    if(err.message == 'jwt expired') {
      return {
        statusCode: 401,
        body: 'TE',
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify(err.message),
      };
    }

  }

};
