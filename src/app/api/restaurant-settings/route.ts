import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch restaurant settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('RestaurantSettings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If no row exists, return default settings
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          WorkingHours: null,
          IsClosed: 0,
          NewOrderSoundDuration: 2,
          MinimumOrderAmount: 15,
          ExtendedMinimumOrderAmount: 30
        });
      }
      
      console.error('Error fetching restaurant settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

    // Ensure settings have default values if null and map DB columns to API shape
    const settings = {
      ...data,
      NewOrderSoundDuration: (data as any).NewOrderSoundDuration ?? 2,
      MinimumOrderAmount:
        (data as any).MinimumOrderAmount ?? (data as any).minimumorderamount ?? 15,
      ExtendedMinimumOrderAmount:
        (data as any).ExtendedMinimumOrderAmount ?? (data as any).extendedminimumorderamount ?? 30
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error in GET restaurant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update restaurant settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { NewOrderSoundDuration, MinimumOrderAmount, ExtendedMinimumOrderAmount } = body;

    // Validate duration (1-30 seconds)
    if (NewOrderSoundDuration !== undefined) {
      if (typeof NewOrderSoundDuration !== 'number' || 
          NewOrderSoundDuration < 1 || 
          NewOrderSoundDuration > 30) {
        return NextResponse.json(
          { error: 'NewOrderSoundDuration must be between 1 and 30 seconds' },
          { status: 400 }
        );
      }
    }

    // Validate minimum order amounts (0.01 - 500 EUR)
    if (MinimumOrderAmount !== undefined) {
      if (typeof MinimumOrderAmount !== 'number' ||
          !Number.isFinite(MinimumOrderAmount) ||
          MinimumOrderAmount < 0.01 ||
          MinimumOrderAmount > 500) {
        return NextResponse.json(
          { error: 'MinimumOrderAmount must be a number between 0.01 and 500 EUR' },
          { status: 400 }
        );
      }
    }

    if (ExtendedMinimumOrderAmount !== undefined) {
      if (typeof ExtendedMinimumOrderAmount !== 'number' ||
          !Number.isFinite(ExtendedMinimumOrderAmount) ||
          ExtendedMinimumOrderAmount < 0.01 ||
          ExtendedMinimumOrderAmount > 500) {
        return NextResponse.json(
          { error: 'ExtendedMinimumOrderAmount must be a number between 0.01 and 500 EUR' },
          { status: 400 }
        );
      }
    }

    // Ensure extended minimum is not lower than main minimum if both are provided
    if (MinimumOrderAmount !== undefined && ExtendedMinimumOrderAmount !== undefined) {
      if (ExtendedMinimumOrderAmount < MinimumOrderAmount) {
        return NextResponse.json(
          { error: 'ExtendedMinimumOrderAmount cannot be lower than MinimumOrderAmount' },
          { status: 400 }
        );
      }
    }

    // Check if a row exists - try to get any row
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('RestaurantSettings')
      .select('*')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing && !fetchError) {
      // Update existing row - use WHERE clause that matches any row
      const updateData: any = {};
      if (NewOrderSoundDuration !== undefined) {
        updateData.NewOrderSoundDuration = NewOrderSoundDuration;
      }
      if (MinimumOrderAmount !== undefined) {
        // DB column is lowercase minimumorderamount
        updateData.minimumorderamount = MinimumOrderAmount;
      }
      if (ExtendedMinimumOrderAmount !== undefined) {
        // DB column is lowercase extendedminimumorderamount
        updateData.extendedminimumorderamount = ExtendedMinimumOrderAmount;
      }

      // Only attempt update if there is something to change
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: true, settings: existing });
      }

      // Use a WHERE clause that matches any row (since there should only be one)
      const { data, error } = await supabaseAdmin
        .from('RestaurantSettings')
        .update(updateData)
        .gte('NewOrderSoundDuration', 0)
        .select()
        .limit(1)
        .single();

      if (error) {
        console.error('Error updating restaurant settings:', error);
        return NextResponse.json(
          { error: 'Failed to update settings', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new row with defaults (map to DB column names)
      const insertData: any = {
        NewOrderSoundDuration: NewOrderSoundDuration ?? 2,
        minimumorderamount: MinimumOrderAmount ?? 15,
        extendedminimumorderamount: ExtendedMinimumOrderAmount ?? 30
      };

      const { data, error } = await supabaseAdmin
        .from('RestaurantSettings')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting restaurant settings:', error);
        return NextResponse.json(
          { error: 'Failed to create settings', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error: any) {
    console.error('Error in POST restaurant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
