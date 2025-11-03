import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

/**
 * API endpoint to scan for available COM ports
 * GET /api/debug/scan-com-ports
 */
export async function GET(request: NextRequest) {
  try {
    
    return new Promise<NextResponse>((resolve) => {
      // Use PowerShell to get real COM ports with detailed info
      const powershellScript = `
        $ports = [System.IO.Ports.SerialPort]::getPortNames()
        $result = @()
        
        foreach ($port in $ports) {
          # Get detailed port information from WMI
          $wmiPort = Get-WmiObject -Class Win32_SerialPort | Where-Object { $_.DeviceID -eq $port }
          
          $portInfo = @{
            path = $port
            manufacturer = if ($wmiPort) { $wmiPort.Name } else { "Unknown" }
            serialNumber = $null
            pnpId = if ($wmiPort) { $wmiPort.PNPDeviceID } else { $null }
            locationId = $null
            vendorId = $null
            productId = $null
            status = if ($wmiPort) { $wmiPort.Status } else { "Unknown" }
            description = if ($wmiPort) { $wmiPort.Description } else { "Serial Port" }
          }
          
          $result += $portInfo
        }
        
        $result | ConvertTo-Json -Depth 3
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
        if (code === 0 && output.trim()) {
          try {
            const ports = JSON.parse(output.trim());
            
            resolve(NextResponse.json({
              success: true,
              ports: ports,
              count: ports.length
            }));
          } catch (parseError) {
            console.error('❌ [COM Port Scan] JSON parse error:', parseError);
            resolve(NextResponse.json({
              success: false,
              message: 'Failed to parse port list',
              ports: [],
              count: 0
            }));
          }
        } else {
          console.error('❌ [COM Port Scan] PowerShell error:', errorOutput || output);
          resolve(NextResponse.json({
            success: false,
            message: `PowerShell error: ${errorOutput || output}`,
            ports: [],
            count: 0
          }));
        }
      });
      
      ps.on('error', (err) => {
        console.error('❌ [COM Port Scan] Process error:', err);
        resolve(NextResponse.json({
          success: false,
          message: `Process error: ${err.message}`,
          ports: [],
          count: 0
        }));
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        ps.kill();
        resolve(NextResponse.json({
          success: false,
          message: 'Scan timeout',
          ports: [],
          count: 0
        }));
      }, 5000);
    });
    
  } catch (error) {
    console.error('❌ [COM Port Scan] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        ports: [],
        count: 0
      },
      { status: 500 }
    );
  }
}