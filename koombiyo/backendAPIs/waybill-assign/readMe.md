* TRIGER : ROUT HTTP API GATEWAY
* API METHOD : PUT
* API ROUT : https://api.lilliza.com/id/waybill-assign

DYNAMODB TABLE STRUCTURE
========================
{
	waybill: string,        // partition key, koombiyo waybill id
	subOrderId: string,		// sub order id
	isAssigned: bool,       // is lilliza sub order assigned for waybill
	isReturn: bool,			// is it return or first time order delivery
	isCOD: bool,			// is cashon delivery
	isError: bool,			// if error occured when calling koombiyo order or pickup apis
	orderPlaced: bool,		// is koombiyo order placed
	pickUpRequested: bool,	// is koombiyo pickup requested
	orderData: string,		// order place koombiyo api body
	pickupData: string		// order pickup koombiyo api body
}

SAMPLE BODY
===========
{
	"api_key": "api_key",
	"subOrderId": "subOrderId",
	"isReturn": false,
	"isCOD": true
}

SAMPLE RESPONSE
===============
{
	"subOrderId": "subOrderId",
	"waybill": "waybill"
}

SAMPLE ENV DATA
===============
DYNAMODB_REGION = ap-southeast-1
DYNAMODB_TABLE_NAME = lilliza-koombiyo-waybill
API_KEY = qA1nlxtVE7s4CxOIsoozFcmLIETh3HSHWa9ZGfc1B42J9mJgV1t5GSZ1sCaRAyJ3
