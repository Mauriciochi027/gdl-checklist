import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or mechanic
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      throw rolesError;
    }

    const hasPermission = userRoles?.some(r => 
      r.role === 'admin' || r.role === 'mecanico'
    );

    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    // Get request body
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error('Missing required fields: userId and newPassword');
    }

    // Validate password length (12+ chars as per NIST recommendations)
    if (newPassword.length < 12) {
      throw new Error('A senha deve ter no mínimo 12 caracteres');
    }

    // Validate password complexity - require uppercase, lowercase, number, and special character
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('A senha deve conter letra maiúscula, minúscula, número e caractere especial');
    }

    // Check for sequential or repeated characters (e.g., 'aaa', '123')
    if (/(.)(\1){2,}/.test(newPassword)) {
      throw new Error('A senha não pode conter caracteres repetidos em sequência');
    }

    // Check for obvious sequential patterns
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890)/i.test(newPassword)) {
      throw new Error('A senha não pode conter sequências óbvias');
    }

    // Expanded weak password patterns
    const weakPasswordPatterns = [
      'password', 'senha', 'admin', 'qwerty', 'welcome', 'letmein',
      'login', 'master', 'access', 'dragon', 'monkey', 'shadow',
      'sunshine', 'princess', 'football', 'baseball', 'iloveyou',
      'trustno1', 'superman', 'batman', 'abcdef', 'abc123'
    ];

    const lowerPassword = newPassword.toLowerCase();
    if (weakPasswordPatterns.some(pattern => lowerPassword.includes(pattern))) {
      throw new Error('A senha contém padrões fracos conhecidos. Escolha uma senha mais forte');
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`Password updated successfully for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while updating the password' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});