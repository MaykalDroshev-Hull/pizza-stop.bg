import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { emailService } from '@/utils/emailService'
import { ValidationService } from '@/utils/validation'
import { ErrorResponseBuilder } from '@/utils/errorResponses'
import { Logger } from '@/utils/logger'
import { ResourceValidator } from '@/utils/resourceValidator'
import { handleValidationError, handleEmailError, handleDatabaseError } from '@/utils/globalErrorHandler'
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  const endpoint = '/api/auth/register';
  
  try {
    // ✅ RATE LIMITING - prevent spam registrations
    // Fail closed: if rate limiting fails, block the request for security
    try {
      const rateLimit = await withRateLimit(request, 'register')
      if (!rateLimit.allowed) {
        Logger.warn('Registration rate limit exceeded', { 
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown' 
        }, endpoint)
        return createRateLimitResponse(rateLimit.headers)
      }
    } catch (rateLimitError) {
      // Rate limit check failed - block registration for security (fail closed)
      Logger.error('Rate limit check failed - blocking registration', { 
        error: rateLimitError instanceof Error ? rateLimitError.message : rateLimitError 
      }, endpoint)
      return NextResponse.json(
        { 
          error: 'Системата за защита е временно недостъпна. Моля, опитайте отново след няколко минути.',
          code: 'RATE_LIMIT_ERROR'
        },
        { status: 503 }
      )
    }

    Logger.logRequest('POST', endpoint);
    
    const { name, email, phone, password } = await request.json()

    // Validate all fields using centralized validation
    const validationResults = [
      ValidationService.validateName(name),
      ValidationService.validateEmail(email),
      ValidationService.validatePhone(phone),
      ValidationService.validatePassword(password)
    ];

    const allErrors = validationResults.flatMap(result => result.errors);
    
    if (allErrors.length > 0) {
      Logger.logValidationError(endpoint, allErrors, { name, email, phone });
      return handleValidationError(allErrors, endpoint);
    }

    // Check if user already exists (check for real accounts only)
    const normalizedEmail = email.toLowerCase().trim();
    
    // First, check if there's already a real account (hashed password)
    const { data: existingRealUser, error: realUserError } = await supabase
      .from('Login')
      .select('LoginID, Name, email, Password')
      .eq('email', normalizedEmail)
      .neq('Password', 'guest_password') // Exclude guest accounts
      .single();
    
    if (existingRealUser) {
      Logger.warn('Registration attempt with existing real account', { email }, endpoint);
      return ErrorResponseBuilder.conflict('Имейл адресът вече се използва', {
        suggestion: 'Ако вече имате акаунт, моля влезте в системата',
        action: 'login'
      });
    }
    
    // Check if there are guest accounts to convert
    const { data: guestAccounts, error: guestError } = await supabase
      .from('Login')
      .select('LoginID, Name, phone, LocationText, LocationCoordinates, addressInstructions, NumberOfOrders')
      .eq('email', normalizedEmail)
      .eq('Password', 'guest_password')
      .order('created_at', { ascending: false }); // Get most recent guest account first
    
    let userToUpdate: any = null;
    if (guestAccounts && guestAccounts.length > 0) {
      // Use the most recent guest account data
      userToUpdate = guestAccounts[0];
      Logger.info('Found guest account to convert', { email, guestAccountId: userToUpdate.LoginID }, endpoint);
    }

    // Hash password with bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    let newUser;
    let insertError;

    if (userToUpdate) {
      // Convert guest account to real account
      const { data: updatedUser, error: updateError } = await supabase
        .from('Login')
        .update({
          Password: hashedPassword,
          Name: name,
          phone: phone || userToUpdate.phone,
          // Keep existing LocationText, LocationCoordinates, addressInstructions, NumberOfOrders
          LocationText: userToUpdate.LocationText || '',
          LocationCoordinates: userToUpdate.LocationCoordinates || '',
          addressInstructions: userToUpdate.addressInstructions || '',
          NumberOfOrders: userToUpdate.NumberOfOrders || 0
        })
        .eq('LoginID', userToUpdate.LoginID)
        .select('LoginID, Name, email, phone, created_at')
        .single();

      newUser = updatedUser;
      insertError = updateError;
      
      if (!insertError) {
        Logger.info('Guest account converted to real account', { 
          email, 
          userId: userToUpdate.LoginID,
          preservedOrders: userToUpdate.NumberOfOrders 
        }, endpoint);
      }
    } else {
      // Create new user account
      const { data: createdUser, error: createError } = await supabase
        .from('Login')
        .insert([
          {
            email: normalizedEmail,
            Password: hashedPassword,
            Name: name,
            phone,
            NumberOfOrders: 0
          }
        ])
        .select('LoginID, Name, email, phone, created_at')
        .single();

      newUser = createdUser;
      insertError = createError;
      
      if (!insertError) {
        Logger.info('New user account created', { email, userId: newUser.LoginID }, endpoint);
      }
    }

    if (insertError) {
      Logger.logDatabaseError(endpoint, insertError, userToUpdate ? 'convertGuestAccount' : 'createUser');
      return handleDatabaseError(insertError, userToUpdate ? 'convertGuestAccount' : 'createUser', endpoint);
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        to: email,
        name: name
      })
      Logger.info('Welcome email sent successfully', { email }, endpoint);
    } catch (emailError) {
      Logger.logEmailError(endpoint, emailError, 'welcome', newUser.LoginID);
      // Don't fail registration if email fails, just log it
    }

    Logger.info('User registered successfully', { userId: newUser.LoginID, email }, endpoint);

    // Return success response (without password)
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.LoginID,
        name: newUser.Name,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      }
    }, { status: 201 })

  } catch (error) {
    Logger.error('Registration error', { error: error instanceof Error ? error.message : error }, endpoint);
    return ErrorResponseBuilder.internalServerError('Грешка при регистрация');
  }
}
