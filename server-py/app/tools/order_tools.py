import json

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.data.mock import orders, logistics


class OrderIdInput(BaseModel):
    orderId: str = Field(description="订单号，格式为 ORD-xxx，例如 ORD-001")


class TrackingNoInput(BaseModel):
    trackingNo: str = Field(description="快递单号，例如 SF1234567890")


class UserIdInput(BaseModel):
    userId: str = Field(description="用户 ID，格式为 U-xxx，例如 U-100")


@tool(
    "getOrderInfo",
    args_schema=OrderIdInput,
    description="根据订单号查询订单详情，包括订单状态、商品列表、金额、快递信息。当用户询问订单状态、订单内容时调用。",
)
def get_order_info_tool(orderId: str) -> str:
    order = orders.get(orderId)
    if not order:
        return json.dumps({"error": f"订单 {orderId} 不存在"}, ensure_ascii=False)
    return json.dumps(order, ensure_ascii=False)


@tool(
    "getLogisticsInfo",
    args_schema=TrackingNoInput,
    description="根据快递单号查询物流轨迹，包括各节点时间、地点、状态。当用户询问快递到哪了、物流状态时调用。",
)
def get_logistics_tool(trackingNo: str) -> str:
    records = logistics.get(trackingNo)
    if not records:
        return json.dumps({"error": f"快递单号 {trackingNo} 暂无物流信息"}, ensure_ascii=False)
    return json.dumps({"trackingNo": trackingNo, "records": records}, ensure_ascii=False)


@tool(
    "getUserOrders",
    args_schema=UserIdInput,
    description='根据用户 ID 查询该用户的所有订单列表摘要。当用户询问"我有哪些订单"、"最近的订单"时调用。',
)
def get_user_orders_tool(userId: str) -> str:
    user_orders = [o for o in orders.values() if o["userId"] == userId]
    if not user_orders:
        return json.dumps({"error": f"用户 {userId} 暂无订单"}, ensure_ascii=False)
    summary = [
        {
            "orderId": o["orderId"],
            "status": o["status"],
            "amount": o["amount"],
            "createTime": o["createTime"],
        }
        for o in user_orders
    ]
    return json.dumps(summary, ensure_ascii=False)


all_tools = [get_order_info_tool, get_logistics_tool, get_user_orders_tool]
