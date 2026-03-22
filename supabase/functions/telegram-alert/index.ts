import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_MAX = 10; // max requests per minute per device
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(deviceId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(deviceId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(deviceId, { count: 1, resetAt: now + 60_000 });
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

  // Require device_id header for caller identification
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId || deviceId.length < 10) {
    return new Response(JSON.stringify({ error: 'Missing or invalid x-device-id header' }), { status: 401, headers: resHeaders });
  }

  // Rate limit per device
  if (isRateLimited(deviceId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), { status: 429, headers: resHeaders });
  }

  // Verify device exists in database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: deviceRecord, error: deviceErr } = await supabase
    .from('alerts')
    .select('id')
    .eq('device_id', deviceId)
    .limit(1)
    .maybeSingle();

  // Also check other tables if no alert found
  if (!deviceRecord) {
    const { data: watchRecord } = await supabase
      .from('watchlist')
      .select('id')
      .eq('device_id', deviceId)
      .limit(1)
      .maybeSingle();

    const { data: rewardsRecord } = await supabase
      .from('rewards')
      .select('id')
      .eq('device_id', deviceId)
      .limit(1)
      .maybeSingle();

    if (!watchRecord && !rewardsRecord) {
      return new Response(JSON.stringify({ error: 'Unknown device' }), { status: 403, headers: resHeaders });
    }
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

    // Validate chat_id format (must be a number or string of digits)
    const chatIdStr = String(chat_id);
    if (!/^-?\d+$/.test(chatIdStr)) {
      return new Response(JSON.stringify({ error: 'Invalid chat_id format' }), { status: 400, headers: resHeaders });
    }

    // Limit message length
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), { headers: resHeaders });
  } catch (error: unknown) {
    console.error('Telegram alert error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: resHeaders });
  }
});
