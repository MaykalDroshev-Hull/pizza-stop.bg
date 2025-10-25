/**
 * Datecs Fiscal Protocol implementation for FP-2000
 * Format: <01><LEN><SEQ><CMD><DATA><05><BCC><03>
 */

const PREAMBLE = 0x01;
const POSTAMBLE = 0x05;
const TERMINATOR = 0x03;
const LEN_OFFSET = 0x20;

// Track sequence numbers
let sequenceNumber = 0x20;

/**
 * Calculate BCC checksum (sum of bytes between preamble and postamble, encoded as 4 ASCII hex digits)
 */
function calculateBCC(bytes: number[]): number[] {
  // Calculate sum from PREAMBLE to POSTAMBLE (inclusive)
  const sum = bytes.reduce((a, b) => a + b, 0) & 0xFFFF;
  
  // Convert to 4 ASCII hex digits by adding 0x30 to each hex digit
  const hexStr = sum.toString(16).padStart(4, '0').toUpperCase();
  return hexStr.split('').map(char => {
    const val = parseInt(char, 16);
    return val + 0x30; // Convert to ASCII
  });
}

/**
 * Convert byte array to hex string for debugging
 */
export function toHex(buf: Uint8Array | number[]): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

/**
 * Build a Datecs protocol frame
 * Format: <01><LEN><SEQ><CMD><DATA><05><BCC><03>
 * @param cmd Command byte (e.g., 0x2D for cut, 0x4A for status)
 * @param payload Optional payload bytes
 * @returns Framed command with BCC
 */
export function buildDatecsFrame(cmd: number, payload: number[] = []): Uint8Array {
  // Increment sequence number (rollover at 0xFF)
  sequenceNumber = (sequenceNumber >= 0xFF) ? 0x20 : sequenceNumber + 1;
  
  // Calculate LEN: Number of bytes from PREAMBLE (excluded) to POSTAMBLE (included) + 0x20
  // Count: SEQ + CMD + payload + POSTAMBLE = 1 + 1 + payload.length + 1
  const len = LEN_OFFSET + 1 + 1 + payload.length + 1;
  
  // Build message for BCC calculation: from LEN to POSTAMBLE (inclusive)
  const messageForBCC = [len, sequenceNumber, cmd, ...payload, POSTAMBLE];
  
  // Calculate BCC
  const bcc = calculateBCC(messageForBCC);
  
  // Build complete frame: <01><LEN><SEQ><CMD><DATA><05><BCC><03>
  const frame = [PREAMBLE, len, sequenceNumber, cmd, ...payload, POSTAMBLE, ...bcc, TERMINATOR];
  
  return new Uint8Array(frame);
}

/**
 * Parse Datecs protocol response
 * Format: <01><LEN><SEQ><CMD><DATA><04><STATUS><05><BCC><03>
 */
export function parseDatecsResponse(data: Uint8Array): {
  valid: boolean;
  payload: Uint8Array;
  status?: Uint8Array;
  error?: string;
} {
  if (data.length < 10) {
    return { valid: false, payload: new Uint8Array(), error: 'Response too short' };
  }

  if (data[0] !== PREAMBLE) {
    return { valid: false, payload: new Uint8Array(), error: 'Missing preamble 0x01' };
  }

  const postambleIndex = data.indexOf(POSTAMBLE);
  if (postambleIndex === -1) {
    return { valid: false, payload: new Uint8Array(), error: 'Missing postamble 0x05' };
  }

  const statusSeparator = 0x04;
  const statusIndex = data.indexOf(statusSeparator);
  
  if (statusIndex === -1) {
    // No status bytes (might be normal for some commands)
    return { valid: true, payload: new Uint8Array() };
  }

  // Extract status bytes (6 bytes after <04>)
  const status = data.slice(statusIndex + 1, statusIndex + 7);
  
  return { valid: true, payload: new Uint8Array(), status };
}

/**
 * Datecs FP-2000 Commands
 */
export const DatecsCommands = {
  // Paper cut - Command 0x2D (45)
  CUT: 0x2D,
  
  // Read status - Command 0x4A (74)
  STATUS: 0x4A,
  
  // Advance paper - Command 0x2C (44)
  ADVANCE_PAPER: 0x2C,
};

/**
 * Parse status bytes from FP-2000
 */
export function parseStatusBytes(status: Uint8Array): {
  error: boolean;
  paperOut: boolean;
  fiscalReceiptOpen: boolean;
  nonFiscalReceiptOpen: boolean;
  coverOpen: boolean;
  cutterBlocked: boolean;
  description: string[];
} {
  if (status.length < 6) {
    return {
      error: true,
      paperOut: false,
      fiscalReceiptOpen: false,
      nonFiscalReceiptOpen: false,
      coverOpen: false,
      cutterBlocked: false,
      description: ['Invalid status length']
    };
  }

  const byte0 = status[0];
  const byte1 = status[1];
  const byte2 = status[2];

  const description: string[] = [];

  // Byte 0
  const generalError = (byte0 & 0x20) !== 0;
  const syntaxError = (byte0 & 0x01) !== 0;
  const invalidCommand = (byte0 & 0x02) !== 0;
  
  // Byte 1
  const coverOpen = (byte1 & 0x20) !== 0;
  
  // Byte 2
  const paperOut = (byte2 & 0x01) !== 0;
  const fiscalReceiptOpen = (byte2 & 0x08) !== 0;
  const nonFiscalReceiptOpen = (byte2 & 0x20) !== 0;

  if (generalError) description.push('General error');
  if (syntaxError) description.push('Syntax error');
  if (invalidCommand) description.push('Invalid command');
  if (coverOpen) description.push('Cover open');
  if (paperOut) description.push('Paper out');
  if (fiscalReceiptOpen) description.push('Fiscal receipt open');
  if (nonFiscalReceiptOpen) description.push('Non-fiscal receipt open');

  return {
    error: generalError || syntaxError || invalidCommand,
    paperOut,
    fiscalReceiptOpen,
    nonFiscalReceiptOpen,
    coverOpen,
    cutterBlocked: false, // Would need specific bit from documentation
    description: description.length > 0 ? description : ['OK']
  };
}
