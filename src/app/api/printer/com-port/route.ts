import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const runtime = 'nodejs';

/**
 * API endpoint to send print jobs to COM port thermal printer
 * POST /api/printer/com-port
 */
export async function POST(request: NextRequest) {
  try {
    const { comPort, baudRate = 9600, data } = await request.json();
    
    // Validate input
    if (!comPort || !data) {
      return NextResponse.json(
        { success: false, message: 'COM портът и данните са задължителни' },
        { status: 400 }
      );
    }
    
    console.log(`🖨️ [COM Port Print] Printing to ${comPort} at ${baudRate} baud...`);
    
    // Convert data to buffer
    let buffer: Buffer;
    if (Array.isArray(data)) {
      buffer = Buffer.from(data);
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      buffer = Buffer.from(data, 'utf8');
    }
    
    // Create temporary file for data
    const tempFile = join(tmpdir(), `print_${Date.now()}.bin`);
    writeFileSync(tempFile, buffer);
    
    return new Promise<NextResponse>((resolve) => {
      // Use PowerShell to send data to COM port
      const powershellScript = `
        $targetPort = "${comPort}"
        $baudRate = ${baudRate}
        $tempFile = "${tempFile}"
        
        # Get all available COM ports dynamically
        $availablePorts = [System.IO.Ports.SerialPort]::getPortNames()
        
        # Try the specified port first if it exists
        $portsToTry = @()
        if ($availablePorts -contains $targetPort) {
          $portsToTry += $targetPort
        }
        
        # Add other available ports as fallback
        foreach ($port in $availablePorts) {
          if ($port -ne $targetPort) {
            $portsToTry += $port
          }
        }
        
        if ($portsToTry.Count -eq 0) {
          Write-Output "ERROR: No COM ports available on this system"
          exit 1
        }
        
        foreach ($portName in $portsToTry) {
          try {
            $port = New-Object System.IO.Ports.SerialPort($portName, $baudRate)
            $port.DataBits = 8
            $port.Parity = "None"
            $port.StopBits = "One"
            $port.Handshake = "None"
            $port.ReadTimeout = 1000
            $port.WriteTimeout = 1000
            
            $port.Open()
            $data = [System.IO.File]::ReadAllBytes($tempFile)
            $port.Write($data, 0, $data.Length)
            Start-Sleep -Milliseconds 1000
            $port.Close()
            Write-Output "SUCCESS: Data sent to $portName"
            exit 0
          } catch {
            if ($port.IsOpen) { $port.Close() }
            Write-Output "FAILED: $portName - $($_.Exception.Message)"
          }
        }
        Write-Output "ERROR: Could not send data to any available COM port"
      `;
      
      const ps = spawn('powershell', ['-Command', powershellScript]);
      let output = '';
      let errorOutput = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ps.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      ps.on('close', (code) => {
        // Clean up temp file
        try {
          unlinkSync(tempFile);
        } catch (e) {
          console.warn('Could not delete temp file:', e);
        }
        
        if (code === 0 && output.includes('SUCCESS')) {
          console.log(`✅ [COM Port Print] Successfully sent ${buffer.length} bytes to ${comPort}`);
          resolve(NextResponse.json({
            success: true,
            message: `Print job sent successfully to ${comPort}`,
            bytesSent: buffer.length,
            comPort,
            baudRate
          }));
        } else {
          console.error(`❌ [COM Port Print] Failed to send to ${comPort}:`, errorOutput || output);
          resolve(NextResponse.json({
            success: false,
            message: `Failed to send to ${comPort}: ${errorOutput || output}`,
            error: errorOutput || output,
            comPort,
            baudRate
          }));
        }
      });
      
      ps.on('error', (err) => {
        console.error(`❌ [COM Port Print] Process error:`, err);
        resolve(NextResponse.json({
          success: false,
          message: `Process error: ${err.message}`,
          error: err.message,
          comPort,
          baudRate
        }));
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        ps.kill();
        resolve(NextResponse.json({
          success: false,
          message: `Timeout on ${comPort}`,
          error: 'Connection timeout',
          comPort,
          baudRate
        }));
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ [COM Port Print] Fatal error:', error);
    return NextResponse.json(
      { success: false, message: 'Вътрешна грешка на сървъра' },
      { status: 500 }
    );
  }
}