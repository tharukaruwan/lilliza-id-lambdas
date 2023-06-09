* TRIGER : SNS TOPIC
* SNS TOPIC NAME : create-admin-sessions
* SNS TOPIC ARN : arn:aws:sns:ap-southeast-1:701852280701:create-admin-sessions

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

SAMPLE MESSAGE IN SNS
=====================
{
    "tokenId": "9wg-a4w-mbnm",
    "nickName": "widaxif933",
    "email": "widaxif933@tebyy.com",
    "role": "admin",
    "did": "did",
    "updatedAt": "Sun Oct 16 2022 19:12:43 GMT+0000 (Coordinated Universal Time)",
    "createdAt": "Sun Oct 16 2022 19:12:43 GMT+0000 (Coordinated Universal Time)",
    "active": "true"
}

SAMPLE ENV DATA
===============
DYNAMODB_REGION = ap-southeast-1
DYNAMODB_TABLE_NAME = lilliza-koombiyo-waybill
API_KEY = qA1nlxtVE7s4CxOIsoozFcmLIETh3HSHWa9ZGfc1B42J9mJgV1t5GSZ1sCaRAyJ3
KOOMBIYO_API_KEY = apikeyhere
KOOMBIYO_ORDER_POST_API = https://application.koombiyodelivery.lk/api/Addorders/users
KOOMBIYO_PICKUP_POST_API = https://application.koombiyodelivery.lk/api/Pickups/users