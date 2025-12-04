/**
 * Supabase Edge Function: Create Stripe Refund
 * 
 * Deploy with:
 * supabase functions deploy stripe-create-refund
 * 
 * Environment Variables Required:
 * STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get Stripe secret key from environment
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not set')
        }

        // Initialize Stripe
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // Parse request body
        const { paymentIntentId, amount, reason } = await req.json()

        // Validate input
        if (!paymentIntentId) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: paymentIntentId' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Create refund
        const refundParams: any = {
            payment_intent: paymentIntentId,
        }

        // Add optional parameters
        if (amount) {
            refundParams.amount = Math.round(amount) // Amount in cents
        }
        if (reason) {
            refundParams.reason = reason
        }

        const refund = await stripe.refunds.create(refundParams)

        // Return refund details
        return new Response(
            JSON.stringify({
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
                currency: refund.currency,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error creating refund:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Failed to create refund',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
