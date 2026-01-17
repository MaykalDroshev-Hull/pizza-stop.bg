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
          NewOrderSoundDuration: 2
        });
      }
      
      console.error('Error fetching restaurant settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

    // Ensure NewOrderSoundDuration has a default value if null
    const settings = {
      ...data,
      NewOrderSoundDuration: data.NewOrderSoundDuration ?? 2
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
    const { NewOrderSoundDuration } = body;

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

    // Check if a row exists - try to get any row
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('RestaurantSettings')
      .select('*')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing && !fetchError) {
      // Update existing row - use WHERE clause that matches any row
      // Since NewOrderSoundDuration should always have a value, we can match on it
      const updateData: any = {};
      if (NewOrderSoundDuration !== undefined) {
        updateData.NewOrderSoundDuration = NewOrderSoundDuration;
      }

      // Use a WHERE clause that matches any row (since there should only be one)
      // Match on NewOrderSoundDuration being greater than or equal to 0 (always true)
      const { data, error } = await supabaseAdmin
        .from('RestaurantSettings')
        .update(updateData)
        .gte('NewOrderSoundDuration', 0) // This will match any row where NewOrderSoundDuration >= 0
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
      console.log('Updated restaurant settings:', result);
    } else {
      // Insert new row
      const insertData: any = {
        NewOrderSoundDuration: NewOrderSoundDuration ?? 2
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
