// Create: app/api/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { paymentReference, amount } = await request.json()
  
  const response = await fetch(
    `https://api.paystack.co/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: paymentReference,
        amount: amount * 100, // in kobo
      }),
    }
  )
  
  const data = await response.json()
  return NextResponse.json(data)
}
