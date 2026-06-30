from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import razorpay
import os
from dotenv import load_dotenv

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_user

load_dotenv()

router = APIRouter()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

try:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    client = None
    print("Warning: Razorpay client could not be initialized. Invalid keys.")

class OrderRequest(BaseModel):
    amount: int # in INR, will be multiplied by 100 for paise
    plan_name: str

@router.post("/create-order")
async def create_order(order_req: OrderRequest, user=Depends(get_current_user)):
    amount_paise = order_req.amount * 100
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="Minimum amount must be 100 paise (1 INR).")
        
    if not client:
        # Fallback for dummy mode when no real keys are provided
        return {
            "order_id": "order_dummy_12345",
            "amount": amount_paise,
            "currency": "INR",
            "notes": {"plan": order_req.plan_name}
        }
        
    try:
        data = {
            "amount": amount_paise, # Razorpay expects amount in subunits (paise)
            "currency": "INR",
            "receipt": f"receipt_{order_req.plan_name.replace(' ', '_').lower()}",
            "notes": {
                "plan": order_req.plan_name
            }
        }
        order = client.order.create(data=data)
        return {
            "order_id": order.get("id"),
            "amount": order.get("amount"),
            "currency": order.get("currency"),
            "notes": order.get("notes")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan_name: str

@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Webhook or direct verification endpoint.
    In a real app, you would verify the signature using razorpay.utility.verify_payment_signature().
    Here we verify the payment and upgrade the user's tier.
    """
    if not req.razorpay_payment_id or not req.razorpay_order_id or not req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay payment parameters.")

    if client:
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': req.razorpay_order_id,
                'razorpay_payment_id': req.razorpay_payment_id,
                'razorpay_signature': req.razorpay_signature
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid payment signature.")
            
    # Upgrade user plan
    db_user = crud.get_user_by_id(db, user.id)
    if db_user:
        db_user.plan = req.plan_name
        db.commit()
        db.refresh(db_user)
        
    return {"status": "success", "message": f"Payment verified. Upgraded to {req.plan_name}"}

@router.post("/cancel")
async def cancel_subscription(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel the active subscription and downgrade to Free plan.
    """
    db_user = crud.get_user_by_id(db, user.id)
    if db_user:
        db_user.plan = "Basic"
        db.commit()
        db.refresh(db_user)
        
    return {"status": "success", "message": "Subscription cancelled successfully."}
