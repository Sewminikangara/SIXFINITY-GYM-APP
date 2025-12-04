/**
 * Supabase Edge Function: Create Stripe Payment Intent
 * 
 * Deploy with:
 * supabase functions deploy stripe-create-payment-intent
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
        const { amount, currency, description, metadata } = await req.json()

        // Validate input
        if (!amount || !currency) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: amount, currency' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents
            currency: currency.toLowerCase(),
            description: description || 'SIXFINITY Gym - Training Session',
            metadata: metadata || {},
            automatic_payment_methods: {
                enabled: true,
            },
        })

        // Return client secret
        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error creating payment intent:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Failed to create payment intent',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
