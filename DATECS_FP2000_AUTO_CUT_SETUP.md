# Datecs FP-2000 Auto-Cut Configuration

## Overview
The Datecs FP-2000 fiscal printer uses a **fiscal protocol**, not standard ESC/POS commands. For paper cutting, the recommended approach is to use the printer's **auto-cut feature** rather than sending manual cut commands.

## Why Auto-Cut?

### Manual Cut Issues
- **Command 0x2D (45)** is the cut command in the Datecs fiscal protocol
- Requires proper protocol framing: `<01><LEN><SEQ><CMD><DATA><05><BCC><03>`
- Must calculate checksum (BCC) correctly
- Can only be sent when **no receipt is open**
- ESC/POS commands (like `ESC i` or `GS V 0`) **do NOT work** on FP-2000

### Auto-Cut Benefits
- Automatic cutting after each receipt
- No protocol framing needed
- No timing issues
- Reliable and consistent

## DIP Switch Configuration

The FP-2000 has DIP switches on the printer that control various settings:

### Switch 5: Auto-Cut ON/OFF
- **OFF** = Auto-cut disabled (manual cut required)
- **ON** = Auto-cut enabled (automatic cutting after receipt)

### Switch 6: Cut Mode (when Switch 5 is ON)
- **OFF** = Half cut (partial cut, paper still attached)
- **ON** = Full cut (complete cut)

## Recommended Settings

For Pizza Stop kitchen receipts:
- **Switch 5: ON** (enable auto-cut)
- **Switch 6: ON** (full cut)

## Implementation

The current code has been updated to:

1. **Remove manual cut commands** from `escposCommands.ts` and `comPortPrinter.ts`
2. **Add line feeds** at the end of receipts to position paper correctly
3. **Rely on auto-cut** (DIP Switch 5) to handle the actual cutting

### Code Changes

#### `src/utils/escposCommands.ts`
```typescript
static cut(): Uint8Array {
  // Only send line feeds to position paper for auto-cut
  // The FP-2000's auto-cut (DIP Switch 5) will handle the actual cutting
  return new Uint8Array([
    0x0A, // Line feed
    0x0A, // Line feed
    0x0A, // Line feed
    0x0A, // Line feed
    0x0A  // Line feed
  ]);
}
```

#### `src/utils/comPortPrinter.ts`
```typescript
// Add line feeds for paper positioning
// The FP-2000's auto-cut (DIP Switch 5) will handle the actual cutting
// No manual cut command needed - fiscal protocol cut (0x2D) requires special framing
commands += '\n\n\n\n\n';
```

## Testing

1. **Enable auto-cut**: Set DIP Switch 5 to ON
2. **Set full cut**: Set DIP Switch 6 to ON
3. **Print a receipt**: Click Print on any order in the kitchen page
4. **Verify**: Paper should automatically cut after printing

## Troubleshooting

### Paper doesn't cut
- Check DIP Switch 5 is ON
- Check DIP Switch 6 is ON for full cut
- Verify cutter is not jammed
- Test with FP Init utility to confirm cutter works

### Paper cuts too early
- Check that auto-cut is enabled (Switch 5 ON)
- Verify enough line feeds are sent at the end of receipt

### Want manual cut control
- Set DIP Switch 5 to OFF
- Implement Datecs fiscal protocol framing
- Send command 0x2D with proper checksum
- Only send when no receipt is open

## References

- [Datecs FP-2000 User Manual](https://www.datecs.bg/en/downloads/pdf?id=UM_FP-2000.pdf)
- Datecs Fiscal Protocol Documentation
- Command 2DH (45): Paper cut
- Command 4AH (74): Read status bytes

## Notes

- The FP-2000 is a **fiscal printer**, not a regular thermal printer
- Fiscal printers follow country-specific regulations
- Some commands require fiscal mode to be properly configured
- Always check status bytes after commands to diagnose issues

