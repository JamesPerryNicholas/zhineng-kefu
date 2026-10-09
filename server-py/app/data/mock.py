orders = {
    "ORD-001": {
        "orderId": "ORD-001",
        "userId": "U-100",
        "status": "已发货",
        "createTime": "2025-03-20 10:30:00",
        "amount": 299.00,
        "items": [
            {"name": "iPhone 手机壳", "qty": 2, "price": 49.5},
            {"name": "钢化膜", "qty": 1, "price": 200},
        ],
        "carrier": "顺丰速运",
        "trackingNo": "SF1234567890",
    },
    "ORD-002": {
        "orderId": "ORD-002",
        "userId": "U-100",
        "status": "待付款",
        "createTime": "2025-03-22 15:00:00",
        "amount": 899.00,
        "items": [{"name": "蓝牙耳机", "qty": 1, "price": 899}],
        "carrier": None,
        "trackingNo": None,
    },
    "ORD-003": {
        "orderId": "ORD-003",
        "userId": "U-101",
        "status": "已完成",
        "createTime": "2025-03-18 09:00:00",
        "amount": 1299.00,
        "items": [{"name": "机械键盘", "qty": 1, "price": 1299}],
        "carrier": "京东物流",
        "trackingNo": "JD9876543210",
    },
}

logistics = {
    "SF1234567890": [
        {"time": "2025-03-21 08:00", "location": "上海转运中心", "desc": "快件已发出"},
        {"time": "2025-03-21 18:30", "location": "杭州分拨中心", "desc": "快件到达"},
        {"time": "2025-03-22 09:00", "location": "杭州西湖营业点", "desc": "派件中，预计今日送达"},
    ],
    "JD9876543210": [
        {"time": "2025-03-18 14:00", "location": "北京仓库", "desc": "已揽收"},
        {"time": "2025-03-19 10:00", "location": "北京转运中心", "desc": "运输中"},
        {"time": "2025-03-20 08:00", "location": "用户门口", "desc": "已签收"},
    ],
}
