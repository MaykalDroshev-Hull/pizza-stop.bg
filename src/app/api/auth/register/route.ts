import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { emailService } from '@/utils/emailService'
import { ValidationService } from '@/utils/validation'
import { ErrorResponseBuilder } from '@/utils/errorResponses'
import { Logger } from '@/utils/logger'
import { ResourceValidator } from '@/utils/resourceValidator'
import { handleValidationError, handleEmailError, handleDatabaseError } from '@/utils/globalErrorHandler'

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

    // Check if user already exists
    const validator = new ResourceValidator();
    const emailCheck = await validator.validateEmailExists(email);
    
    if (emailCheck.exists) {
      Logger.warn('Registration attempt with existing email', { email }, endpoint);
      return ErrorResponseBuilder.conflict('Имейл адресът вече се използва', {
        suggestion: 'Ако вече имате акаунт, моля влезте в системата',
        action: 'login'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('Login')
      .insert([
        {
          email,
          Password: hashedPassword,
          Name: name,
          phone,
          NumberOfOrders: 0
        }
      ])
      .select('LoginID, Name, email, phone, created_at')
      .single()

    if (insertError) {
      Logger.logDatabaseError(endpoint, insertError, 'createUser');
      
      // Check for duplicate email error
      if (insertError.code === '23505' && insertError.details?.includes('email')) {
        return ErrorResponseBuilder.conflict('Този имейл вече съществува');
      }
      
      return handleDatabaseError(insertError, 'createUser', endpoint);
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
