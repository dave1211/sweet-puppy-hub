import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const resHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Verify JWT authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: resHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (claimsError || !data?.claims) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: resHeaders });
  }

  const userId = data.claims.sub as string;

  // Rate limit per authenticated user
  if (isRateLimited(userId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), { status: 429, headers: resHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: resHeaders });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500, headers: resHeaders });
  }

  try {
    const { chat_id, message, parse_mode } = await req.json();

    if (!chat_id || !message) {
      return new Response(JSON.stringify({ error: 'chat_id and message required' }), { status: 400, headers: resHeaders });
    }

    const chatIdStr = String(chat_id);
    if (!/^-?\d+$/.test(chatIdStr)) {
      return new Response(JSON.stringify({ error: 'Invalid chat_id format' }), { status: 400, headers: resHeaders });
    }

    if (typeof message !== 'string' || message.length > 4096) {
      return new Response(JSON.stringify({ error: 'Message too long (max 4096 chars)' }), { status: 400, headers: resHeaders });
    }

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: parse_mode || 'HTML',
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify({ success: true, message_id: responseData.result?.message_id }), { headers: resHeaders });
  } catch (error: unknown) {
    console.error('Telegram alert error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: resHeaders });
  }
});
