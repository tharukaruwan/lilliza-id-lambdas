const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require('jsonwebtoken');
const axios = require('axios');

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const KOOMBIYO_API_KEY = process.env.KOOMBIYO_API_KEY.toString();
const KOOMBIYO_PICKUP_POST_API = process.env.KOOMBIYO_PICKUP_POST_API.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {
    const body = JSON.parse(event.body);
    const token = event.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.PRIVATEKEY_ACCESSTOCKEN);

    if (!decoded.role) {
      return {
        statusCode: 500,
        body: JSON.stringify(`tocken role error`),
      };
    }

    if (!((decoded.role == "superAdmin") || (decoded.role == "admin"))) {
      return {
        statusCode: 401,
        body: JSON.stringify(`not authorised`),
      };
    }

    // body validation
    const requiredKeys = ['orderWaybillid', 'orderNo', 'vehicleType', 'pickup_remark', 'pickup_address', 'latitude', 'longitude', 'phone', 'qty'];
    const emptykeys = [];
    for (let key of requiredKeys) {
      if (!body.hasOwnProperty(key)) {
        emptykeys.push(key)
      }
    }

    if (emptykeys.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify(`${emptykeys} required`),
      };
    }

    // check if orderWaybillid and orderNo record exist
    const params = {
      TableName: TABLE_NAME,
      Key: {
        waybill: body.orderWaybillid
      },
    };

    const wayBillRecord = await ddbDocClient.send(new GetCommand(params));
    if (!wayBillRecord) {
      return {
        statusCode: 404,
        body: JSON.stringify('waybill not found'),
      };
    }

    if ((wayBillData.Item.subOrderId != body.orderNo) || (wayBillData.Item.isAssigned != true)) {
      return {
        statusCode: 409,
        body: JSON.stringify("order has to be assign first to request pickup"),
      };
    }

    if (wayBillData.Item.pickUpRequested == true) {
      return {
        statusCode: 409,
        body: JSON.stringify('already pickup requested'),
      };
    }

    if ((wayBillData.Item.orderPlaced != true)) {
      return {
        statusCode: 409,
        body: JSON.stringify('order should be placed before pickup request'),
      };
    }

    // koombiyo order request
    const postData = {
      apikey: KOOMBIYO_API_KEY,
      vehicleType: body.vehicleType,
      pickup_remark: body.pickup_remark,
      pickup_address: body.pickup_address,
      latitude: body.latitude,
      longitude: body.longitude,								
      phone: body.phone,							
      qty: body.qty
    };
    
    const koombiyoRes = await axios.post(KOOMBIYO_PICKUP_POST_API, postData).then(res => res);

    if (koombiyoRes.statusCode != 200) {
      return {
        statusCode: 500,
        body: JSON.stringify(`koombiyo system failour`),
      };
    }

    // if sucess update record as pickup requested
    const updateOrderRequestParams = {
      TableName: TABLE_NAME,
      Item: {
        ...wayBillRecord.Item,
        pickUpRequested: true,
        pickupData: JSON.stringify(postData)
      },
    };

    const updatedrecord = await ddbDocClient.send(new PutCommand(updateOrderRequestParams));
    if (!updatedrecord) {
      return {
        statusCode: 207,
        body: JSON.stringify('koombiyo pickup requested but could not update lilliza system'),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ...wayBillRecord.Item, pickUpRequested: true, pickupData: postData }),
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
