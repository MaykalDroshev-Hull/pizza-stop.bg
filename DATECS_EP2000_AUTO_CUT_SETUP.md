DATECS

PROGRAMMER'S

MANUAL

Detailed Description

of the Commands

Firmware Version 1.

```
ESC/POS
Thermal Printer
```
EP-


We wish you a pleasant work

with EP-2000!

The information contained in this document is subject to change without prior notice.
All rights reserved. Any mechanical, electrical or electronic reproduction
or adaptation of the information in this document
without prior written permission from DATECS Ltd. is prohibited

```
1784 Sofia, Bulgaria, 115A Tzarigradsko shosse blvd.
Tel.: +359 2/8165 500, 8165 501, 8165 506, 8165 511; Fax: +359 2/8165 510
Е-mail: sales@datecs.bg
```
```
Version : june 2009 г. / firmware version 1.
```

## C O N T E N T S


Technical Specifications

# 1

### DATECS^ Е P-^2000

```
Parameter Description
```
```
Printing Printing Method Line thermal dot printing method
```
```
Resolution 203 dpi (8 x 8 точки /mm)
```
```
Dot pitch Horizontal – 0.125 mm (8 dot/mm)
Vertical – 0.125 mm (8 dot/mm)
```
```
Max. Print Width 72 mm / 576 dots per line
```
```
Number of characters
per line
```
```
48 – for fonts А and С
64 – for fonts B and D
```
```
Paper Feed System Step
```
```
Printing Speed (Max) 220 mm/s (1760 dots/s)
```
```
Шрифтове Resident Fonts Font А: 12 х 24 dots (48 char./ line);
Font B: 9 х 16 dots (64 char./line);
```
```
Loadable Font C: 12 х 24 dots (48 char./line);
Font D: 9 х 16 dots (64 char./line);
```
```
Paper widith, mm 80 or 58
```
```
Diameter, mm up to 102
Media:
Roll Thermal Paper
Paper thickness, mm 65–
```
```
Resident
Barcodes
```
### 1D

### EAN 13

### EAN 8

### UPC A

### UPC E

```
Codabar
Code 39
```
```
Code 128
```
```
2D PDF417, QR code
```
```
Logo Registration 1 Black & White Size: 576 x 248 dots
```
```
Interfaces
```
```
Serial
USB
LAN
```
```
RS232 C – max. 115200 bps
USB v 1.1, compatible with 2.
100 Mbps (100 BASE-TX)
```

Technical Specifications

```
DATECS EP - 2000
```
Parameter Description

Emulation ESC/POS Continuous paper Mode

Input Buffer 131 072 bytes

Power consumption (^) ∼48 W (in normal printing)
Built-in AC adapter Model:
Input:
Output:
Citizen 35 АD
AC 100 – 240 V, 1,3 A, 50/60 Hz
DC 24 V, 1,9 A
Operation
switches
FEED button
Switch ON/OFF
Paper feed, Self test, Dump Mode
Switch On/Switch OFF
Power Switch ON/OFF
Weight Without paper: ∼2 kg
Dimensions (mm) 147 (W) X 207 (D) Х 147 (H)
Environment
Operating temperature
conditions:
Storage temperature
conditions:
Temperature from 0оС to 40 оС
Humidity from 35% RH to 85% RH
Temperature from -20 оС to 60 оС
Humidity from 10% RH tо 90% RH
Reliability
Printing Head:
Auto cutter life:
150 km paper long
2 million cuts
(at normal temperature/humidity/with recommended paper used)
Cables Power cable
RS-232 interface cable


Diagnostic Information, Dump Mode, Firmware Updating

# 2

### DATECS EP - 2000

Diagnostic Inforamation, Dump Mode, Firmware Updating

Holding LF button while power on
for ~ 0.5 sec and releasing it
after the 1-beep.

```
SHORT SELF TEST print.
```
Holding FEED button while power on
for ~ 2.5 sec and releasing it after the 2-beep.

```
It starts Hex DUMP mode.
All input data are printed hexadecimal
and as text
```
Holding LF button while power on
for ~ 4.5 sec and releasing it after the 3-beep.

```
LONG SELF TEST print
```
Holding FEED button while power on
for ~ 6.5 sec and releasing it after the 4-beep.

```
Entering hardware setup mode
(hardware menu)
```
Holding FEED button while power on
for more than 8.5 sec and releasing it after
the 5-beep 4-tone beep.

```
Program mode –
loading the printer firmware.
```

Protocol Mode

# 3

### DATECS EP - 2000

Protocol mode is active when the memory switch 11 is on. The purpose of this mode is to
give full control over the optional peripherals (MC and smart card reader) and a stronger real
time access to the printer. All input data are sent in packets as described below. The printer
returns an answer to the packet immediately.

```
Output packet
format:
```
```
Channel Command LenHi LenLo Data
```
```
Answer format: Channel Status LenHi LenLo Data
```
```
Channel:
One byte: Bits 0 – 6
Channel number (Device Type)
Bit 7
0: Send data;
1: Response
```
```
Command: One byte with
possible
value:
```
```
0: Open channel
(No action – all channels always open)
1: Close channel
(No action – all channels always open)
2: Send data
3: Request data
> 4: Application specific
```
### 0 1

```
Bit 0 No error Error occured
```
```
Bit 1 ACK
(Packet accepted)
```
```
NACK (Packet
not accepted)
```
```
Bit 2 Channel and
command OK
```
```
Wrong channel
or command
```
```
Bit 3 Battery OK Low battery
```
```
Бит 4 Printing head OK Printing head too hot
```
```
Bit 5 Paper OK Out of paper
```
```
Bit 6 Not defined
```
```
Status: One byte:
```
```
Bit 7 Printer ready Printer busy
```

Protocol Mode

# 3

### DATECS EP - 2000

```
Bit 7 is set, if:
```
- There are unprinted lines in the print buffer.
- There are bytes in the print buffer.
- The printer is executing a macro.
- The printer is executing a selftest.
- The button <LF> is pressed –
    feeding paper.

```
LenHi: Hihg byte of data length of data. From 00h to о 08h.
```
```
LenLo: Lowg byte of data length of data. From 00h t о FFh.
```
```
Data: 256*LenHi +LenLo data bytes.
```
```
The maximum packet length is 2048 bytes.
The answer differs from the command by bit 7 (MSB) in the channel number. If bit
7 is ‘0’, then it is a command, if it is ‘1’ – it is a response. Bit ‘0’in the Status byte shows
if there was an error accepting or processing the data block. If this bit is ‘1’ the other bits
show the type of the error.
The printer never issues a transmission by itself. It always responds as an answer to a
command. The communication goes like this:
Host – command, Printer – answer; Host – command, Printer – answer; etc.
```
```
The defined channel is:
1 Printer.
```
```
Commands for the printer channel 1:
```
```
Command 2 Send data.
The data is copied into the printer's print buffer. If there"s not
enough space into the print buffer, the packet is rejected, and
a status byte with value 3 is returned in the answer.
```
```
Command 3 Receive data
If there is data to be transmitted from the printer to the host, it is
transmitted in the data field of the packet, otherwise an empty
packet is received. The application must take care to get the data fast
enough from the output buffer or the data may be corrupt.
```

Protocol Mode

```
DATECS EP - 2000
```
Command 4 Get printer status.
5 data bytes returned in response:
BufferHi BufferLo PrStatus Volt Temperature

BufferHi^ High byte of the count of free bytes in input
buffer.

BufferLo Low byte of the count of free bytes in input
buffer.

PrStatus Printer status.
The following bits defined:

Bit 0^ Battery low

Bit 1 Too hot

Bit 2 No paper

Volt The battery voltage in units 0.1V

Temperature The head temperature in degrees Celsius.

```
If free bytes in input buffer are more than 65535 (FFFFh), then FFFFh is returned.
Communication example (all bytes hexadecimal):
```
```
Send data: >>> 01 02 00 05 11 22 33 44 55
<<< 81 00 00 00
```
```
Send data with error:
>>> 01 02 00 05 11 22 33 44 55
<<< 81 01 00 00
>>> 01 02 00 05 11 22 33 44 55
<<< 81 01 00 00
>>> 01 02 00 05 11 22 33 44 55
<<< 81 00 00 00
Receive data: >>> 01 03 00 00
<<< 81 00 00 00
>>> 01 03 00 00
<<< 81 00 00 04 11 22 33 44
>>> 01 03 00 00
<<< 81 00 00 00
Get status:
>>> 01 04 00 00
<<< 81 00 00 05 3F F8 01 49 27
```

Serial Interface

# 4

### DATECS EP - 2000

Serial Interface

```
Turn off the printer before attaching the cable. After connecting the connectors
screw the two screws.
```
```
Baud rate 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200 bps
```
```
Serial port parameters 1 start bit, 8 data bits, 1 stop bit, no parity
```
```
Signal characteristics RS232C
Mark – logical 1 (-3V до –12V)
Space – logical 0 (+3V до +12V)
```
Input-output Signals

```
RD Serial input data signal
```
```
Т D Serial output data signal
```
```
DSR Dataflow control signal – INPUT
```
```
DTR Dataflow control signal – OUTPUT
```
```
GND Ground
```
Signal Description

```
Start bit One “Space” level bit. Indicates the beginning of data byte.
```
```
Data bits Eight consequent bits. First is the least significant bit.
```
```
Stop bit One “Mark” level bit. Indicates the end of the byte.
```
Dataflow Control

If a hardware protocol is selected the computer could send data only at “Space” level on the
DTR line. Data reception is disabled when the buffer is close to its upper limit.
Reception is re-enabled when the number of bytes in the buffer is below some limit.


Page mode

# 5

### DATECS EP - 2000

Page mode

DK-2300 supports page mode. For this mode is needed larger RAM, so it is possible, that some
of the older printers will not support it. You can check this using command ESC Z (bit 29.6 will be
set if page mode is supported).

New 13 commands are added in page mode, most of the old command work differently.

In standard mode the device prints the data after receiving new line command (LF or CR
depending on memory switches) or when the line is wider than the defined print area.

In page mode the result of incoming commands is forwarded to a reserved memory area (page).
The page place and size is defined using command ESC W. Command GS T selects the print
direction in this page. At the end the collected information is printed using one of the commands,
provided for this. Commands ESC FF and GS FF print only the currently defined page, but
command ESC Z prints the area between the first and last line containing at least one black
point.

All commands except GS L and GS W work in page mode. The centering and right alignment
(command ESC a ) is working in the currently defined page width.

Ruled lines

New commands are added to make printing tables in standard and page mode easier.

The printer has two line buffers with size the maximum printing width (paper width in standard
mode or the selected page width in page mode). When ruled lines are active, then every
horizontal line of the text line is combined with the selected ruled line buffer. Bit ‘1’ in the ruled
line buffer is a black dot in OR mode and inverts the color of the dot in XOR mode. Two
commands allow the ruled line buffers to be printed without combining with a text line.

When pressing the FEED button, no ruled lines buffer is applied.

All ruled lines commands start with symbol DC3 (ASCII code 13h).
Please see command DC2 = , too.

Warning!

```
The ruled lines print position depends not on GS L and GS W (left margin and line width)
and is always at the beginning of the line (or at the beginning of the printable area in page
mode). The printed text and graphic change their position according these commands.
When printing 180 degrees rotated lines (command ESC {) ruled lines buffers are not
rotated!
```

## List of Commands for ESC/POS Mode

26 ESC % Selecting/Canceling the printing of downloaded


59 ESC ` Reading the Battery Voltage and Thermal head



**No** Command Description page

89 GS X Drawing a rectangular box with selected thickness in page

   - DATECS EP -
- 1. Technical Specifications
- 2. Diagnostic Information, Dump Mode, Firmware Updating
- 3. Protocol Mode
- 4. Serial Interface
- 5. Page Mode
- 6. List of Commands for ESC/POS mode
- 7. Command Details
-
         - DATECS EP -
      - 1 BEL Sounds the buzzer No Command Description page
      - 2 HT Horizontal Tab command
      - 3 LF Printing а line and Paper Feeding command
      - 4 FF Printing and paper feeding to the black mark position
            - of the configuration flags 2, 3 and 5 CR The operation of the command depends on the state
               -
      - 6 DC2 = Image LSB/MSB select
      - 7 DC3 ( DC3 (Ruled line) commands sequence start
      - 8 DC3 + Sets the ruled line ON
      - 9 DC3 - Sets the ruled line off
   - 10 DC3 A Selects ruled line A
   - 11 DC3 B Selects ruled line B
   - 12 DC3 C Clears selected ruled line buffer
   - 13 DC3 D Sets a single dot in selected ruled line buffer
   - 14 DC3 F Ruled line pattern set
   - 15 DC3 L Ruled line line set
   - 16 DC3 M Selects ruled line combine mode
   - 17 DC3 P Ruled line 1 dot line print
   - 18 DC3 p Ruled line n dots line print
   - 19 DC3 v Ruled line image write
   - 20 CAN Canceling print data in page mode
   - 21 ESC FF Printing data in page mode
   - 22 ESC RS Sounds the buzzer
   - 23 ESC SP Setting character spacing
   - 24 ESC # Setting EURO symbol position
   - 25 ESC $ Specifying the absolute horizontal position of printing
               - user character sets
   - 27 ESC & Selecting user character set
   - 28 ESC! Specifying printing mode of text data
   - 29 ESC * Printing graphical data
   - DATECS EP - List of commands for ESC/POS Mode
- 30 ESC - Selecting/Canceling underlining No Command Description page
- 31 ESC Printing self test/diagnostic information
- 32 ESC 2 Specifying 1/6-inch line feed rate
- 33 ESC 3 Specifying line feed rate n/203 inches
- 34 ESC < Changes print direction to opposite
- 35 ESC = Data input control
- 36 ESC > Selecting print direction
- 37 ESC @ Initializing the printer
- 38 ESC D Setting horizontal tab position
- 39 ESC E Specifying/Canceling highlighting
- 40 ESC F Filling or inverting the page area in page mode
- 41 ESC G Specifying/Canceling highlighting
- 42 ESC I Specifying/Canceling Italic print
- 43 ESC J Printing and Paper feed n/203 inches
- 44 ESC L Selecting page mode
- 45 ESC N Reading programmed serial number
- 46 ESC R Selecting country
- 47 ESC S Specifying speed (bps) of the serial port
- 48 ESC T Printing short self test
- 49 ESC U Selecting/Canceling underlined printing
- 50 ESC V Selecting/Canceling printing 90°- right turned characters
- 51 ESC W Defining the print area in page mode
- 52 ESC X Specifying max printing speed
- 53 ESC Y Selecting intensity level
- 54 ESC Z Returning diagnostic information
- 55 ESC \ Specifying relative horizontal position
- 56 ESC ] Loading the default settings stored in Flash memory
- 57 ESC ^ Saving current settings in Flash memory
- 58 ESC _ Loading factory settings
      - temperature
- List of Commands for ESC/POS Mode
      - DATECS EP -
   - 60 ESC a Aligning the characters No Command Description page
   - 61 ESC b Increasing text line height
   - 62 ESC c5 Enabling/Disabling the functioning of the button LF
   - 63 ESC d Printing and feeding paper by n- lines
   - 64 ESC i Feeding paper backwards
   - 65 ESC o Temporarily feeding paper forward
   - 66 ESC p Generating a drawer pulse
   - 67 ESC r Full command for sounding buzzer
   - 68 ESC s Reading printer settings
   - 69 ESC u Selecting code table
   - 70 ESC v Transmitting the printer status
   - 71 ESC { Enabling/Canceling printing of 180° turned characters
   - 72 GS FF Printing in page mode and returning to standard mode
   - 73 GS $ Specifying the absolute vertical position in page mode
   - 74 GS ) Setting printer flags (memory switches)
   - 75 GS * Defining a Downloaded Bit Image (logo)
   - 76 GS / Printing a Downloaded Bit Image
   - 77 GS : Starting/ending macro definitions
   - 78 GS B Enabling/Disabling inverse printing (white on black)
   - 79 GS C Read the Real Time Clock
   - 80 GS H Selecting printing position of HRI Code
   - 81 GS L Setting the left margin
   - 82 GS Q Printing 2-D barcodes
   - 83 GS R Filling or inverting a rectangle in page mode
   - 84 GS S Selecting 2-D barcode cell size
   - 85 GS T Selecting the print direction in page mode
   - 86 GS U Selecting standard mode
   - 87 GS V Paper cutting
   - 88 GS W Setting the print area width
      - DATECS EP - List of commands for ESC/POS Mode
         - mode
   - 90 GS Z Printing the non blank page area only in page mode
   - 91 GS \ Specifying the relative vertical position in page mode
   - 92 GS ^ Executing macro
   - 93 GS c Setting the Real Time Clock
   - 94 GS f Setting the font of HRI characters of the barcode
   - 95 GS h Setting the height of the barcode
   - 96 GS k Printing a barcode
   - 97 GS p Settings for 2D barcode PDF417
   - 98 GS q Selecting the height of the module of 2D barcode PDF417
   - 99 GS w Selecting the horizontal size (Scale factor) of the barcode
- 100 GS x Direct text print in page mode
- 101 GS x Direct text print in page mode Asian Languages Support
- 102 FS & Selecting two-byte text mode (JIS or GB2312)
- 103 FS - Selecting/Canceling underline mode for two-byte text mode
- 104 FS Canceling two-byte text mode
- 105 FS C Selecting Shift-JIS mode (Japanese version only)
- 106 FS S Specifying character spacing for two-byte text mode
- 107 FS W Selecting double size characters for two-byte text mode


# 7

### DATECS EP - 2000

1. (BEL) Sounds the Buzzer

```
Code [07h]
```
```
Description By executing this command the buzzer will beep.
```
2. (HT) Horizontal Tab command

```
Code [09h]
```
```
Description Shifts the printing position to the next horizontal tab position.
The horizontal tab position is set by ESC D. By default the horizontal
tab position is at each 8th character (in 9th, 17th, 25th column) from
FONT A.
```
3. (LF) Printing **а** line and Paper Feeding command

```
Code [0Ah]
```
```
Description Prints data stored in input buffer and feeds paper with one line (the
height of a line that has been set).
```
4. (FF) Printing and paper feeding to the black mark position

```
Code [0Ch]
```
```
Description This command prints the data in the printer buffer and searches for
black mark. It is ignored if black mark mode is not specified.
```
```
Notes for
Black Mark
Function
```
1. Error detection in black mark mode:
Paper end is not checked during printing and also black mark is not
checked.
After receiving FF command, printer checks black mark and paper end.
Once black is detected and white is detected again within 6 mm paper
feed, it is determined as а black mark. If the white is not detected within 6
mm paper feed, it is determined as paper end.
After receiving FF command, if printer cannot detect black mark by
feeding paper for 360 mm , printer recognizes it as black mark detecting
error. And the result is same as detecting paper end.
To release the error, it is necessary to put correct paper and press LF
switch long (for more than 1 sec).


### DATECS EP - 2000

2. LF switch operation in black mark mode:
    Pressing short: Feeds one line.
    Pressing for >1 sec: Feed paper to find next black mark.
    (The same as sending FF command).

```
Remarks for
programming
```
```
Remarks
on handling
```
1. As it is possible to print on black mark, if user does not want to print
    on the black mark, it have to be taken care by user side program

## 

2. If the paper cover is open in black mark mode, there is a possibility to
    recognize it as detecting black mark.
5. (CR) The operation of the command depends on the state
of the configuration flags 2, 3 and 4

```
Code [0Dh]
```
```
Description This command is ignored or its action is the same as LF depending
on the state of memory switches set with last command GS ).
```
6. (DC2 =) Image LSB/MSB select

```
Code [12h] + [3Dh] + n
```
```
Description The command selects whether the left edge of print image is the LSB
or MSB for commands GS *, DC3 F and DC3 v.
```
```
n is from 0 to FFh , but only least significant bit checked:
```
```
0 LSB is the left edge.
```
```
1 MSB is the left edge.
```
```
The default value is 1.
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

7. (DC3 ( ) DC3 (Ruled line) commands sequence start

```
Code [13h] + [28h]
```
```
Description Following this command the printer receives DC3 commands without
DC3 symbol at the beginning.
The symbol ‘)’ ends the sequence.
All commands, which are not DC3 commands, are ignored.
```
```
The command is supported in firmware version 1.51 or higher.
```
8. (DC3 +) Sets the ruled line ON

```
Code [13h] + [2Bh]
```
```
Description After receiving this command every printed line is combined with the
selected ruled line buffer. This happens when commands LF , ESC J ,
ESC d , DC3 P , DC3 p are executed.
Depending on last command DC3 M executed the ruled line buffer is
combined with the text using OR (if there is a bit ‘ 1 ’ in ruled line buffer, a
black dot is printed) or XOR (if there is a bit ‘ 1 ’ in ruled line buffer, then
the corresponding dot is inverted).
All DC3 command except DC3 P and DC3 p are executed when ruled
line mode is off, too. Su the ruled line buffers can be cleared or set
before this command.
The command DC3 – sets ruled lines off.
In page mode nothing is printed outside the selected using ESC W area.
The command does not clear rule line buffers.
By default ruled lines are disabled.
```
```
The command is supported in firmware version 1.51 or higher.
```

### DATECS EP - 2000

9. (DC3 -) Sets the ruled line OFF

```
Code [13h] + [2Dh]
```
```
Description The command disables ruled line mode.
All DC3 command except DC3 P and DC3 p are executed when ruled
line mode is off, too. Su the ruled line buffers can be cleared or set after
this command.
The command DC3 + sets ruled lines on.
The command does not clear rule line buffers.
By default ruled lines are disabled.
```
```
The command is supported in firmware version 1.51 or higher.
```
10. (DC3 A) Selects ruled line buffer A

```
Code [13h] + [41h]
```
```
Description Makes ruled line buffer A active.
All DC3 commands for clearing or setting data use the active ruled line
buffer. When ruled line is enabled, then printing a line and commands
DC3 P and DC3 p use this buffer.
By default buffer А is selected.
```
```
The command is supported in firmware version 2.00 or higher.
```
11. (DC3 B) Selecs ruled line buffer B

```
Code [13h] + [42h]
```
```
Description Makes ruled line buffer B active.
All DC3 commands for clearing or setting data use the active ruled line
buffer. When ruled line is enabled, then printing a line and commands
DC3 P and DC3 p use this buffer.
By default buffer B is selected.
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

12. (DC3 C) Clears selected ruled line buffer

```
Code [13h] + [43h]
```
```
Description Clears selected ruled line buffer (Sets all bits to 0).
After power on or command ESC @ both buffers are clear.
Entering or leaving ruled line mode (DC3 + and DC3 -) does not clear
ruled line buffers.
```
```
The command is supported in firmware version 1.51 or higher.
```
13. (DC3 D) Sets a single dot in selected ruled line buffer

```
Code [13h] + [44h] + nL + nH
```
```
Description Set to ‘ 1 ’ one bit of the active ruled line buffer.
The dot coordinates are nL+256*nH.
Coordinates outside the printable area are ignored.
```
```
The command is supported in firmware version 1.51 or higher.
```
14. (DC3 F) Ruled line pattern set

```
Code [13h] + [46h] + n1 + n
```
```
Description The command fills the selected ruled line buffer with the data sequence
n1 , n.
Permitted values: 0-FFh.
Every byte sets 8 dots , last executed command DC2 = determines
whether the MSB is the left or the right side.
The existing data in the buffer are replaced with the new data.
Dots outside the printable area are ignored.
```
```
The command is supported in firmware version 1.51 or higher.
```

### DATECS EP - 2000

15. (DC3 L) Ruled line line set

```
Code [13h] + [4Ch] + mL + mH + nL + nH
```
```
Description The command sets to ‘ 1 ’ the bits between to specified coordinates in the
selected ruled line buffer.
```
```
The coordinates are mL+256*mH and nL+256*nH.
The part of the line outside the printable area is ignored.
```
```
The command is supported in firmware version 1.51 or higher.
```
16. (DC3 M) Selects ruled line combine mode

```
Code [13h] + [4Dh] + n
```
```
Description The command selects the logical operation between the selected
ruled line buffer and the print buffer when ruled line is enabled.
```
```
n is from 1 to FFh, but only the LSB is used:
```
```
0 OR operation – bit ‘ 1 ’ in ruled line buffer sets a black dot
on paper.
```
```
1 XOR operation – bit ‘ 1 ’ in ruled line buffer inverts the dot.
```
```
For commands DC3 P , DC3 p and when printing an empty line the logical
operation doesn’t matter.
```
```
Logical operation XOR is useful to invert the whole height of a text line
(white letters on black background).
```
```
By default OR mode is selected (value 0 ).
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

17. (DC3 P) Ruled line one dot line print

```
Code [13h] + [50h]
```
```
Description The active ruled line buffer is printed as a single line (0.125 mm high).
If ruled line is off, then the paper is moved one line (0.125 mm ) without
printing.
If there are graphic or text data in the line, they are ignored (erased).
The same effect will have command ESC 3 [01h] without text or graphic
data in the line.
```
```
Warning!
```
```
Because of the characteristics of thermal printing it is possible, that the
quality of single horizontal lines on the paper is not good.
```
```
The command is supported in firmware version 1.51 or higher.
```
18. (DC3 p) Ruled line n dot line print

```
Code [13h] + [70h] + nL + nH
```
```
Description The selected ruled line buffer is repeated on nL+256*nH lines.
If ruled line is off, then the paper is moved nL+256*nH dots without
printing.
If there are graphic or text data in the line, they are ignored (erased).
The same effect will have command ESC 3 n without text or graphic data
in the line (the difference is, that the possible line height is
up to 255 dots )
```
```
Warning!
```
```
Because of the characteristics of thermal printing it is possible, that the
quality of single horizontal lines on the paper is not good.
```
```
The command is supported in firmware version 1.51 or higher.
```

### DATECS EP - 2000

19. (DC3 v) Ruled line image write

```
Code [13h] + [76h] + nL + nH + D 1 + ...
```
```
Description The command fills the selected ruled line buffer with nL+256*nH data
bytes.
Possible values of data bytes: 0 – FFh.
Every byte defines 8 dots , last executed DC2 = determines whether
MSB is left or right side.
Selected ruled line buffer is erased and new data are written.
Dots outside the printable area are ignored.
```
```
The command is supported in firmware version 1.51 or higher.
```
20. (CAN) Canceling print data in page mode

```
Code [18h]
```
```
Description The command clears the currently selected page area and sets current
print position to coordinates (0, 0) in the current page (depending on the
currently selected print direction with command GS T ).
The command is not valid in standard mode.
```
```
The command is supported in firmware version 1.51 or higher.
```
21. (ESC FF) Printing data in page mode

```
Code [1Bh] + [0Ch]
```
```
Description The command executes a batch printout of the data, mapped in the
currently selected page. The printer continues to work in page mode and
data is not destroyed, so the command may be executed many times.
The command is not valid in standard mode.
```
```
The command is supported in firmware version 1.51 or higher.
```
22. (ESC RS) Sounds the buzzer

```
Code [1Bh] + [1Eh]
```
```
Description By executing this command the buzzer will beep.
```

# 7

### DATECS EP - 2000

23. (ESC SP) Setting character spacing

```
Code [1 В h] + [20h] + n
```
```
Description The rightward space amount is set in dot unit (1/203 inch unit). The initial
value is n=0. When the font size is doubled the space between
characters is also doubled.
Possible values: from 0 to 63 dots.
```
```
[0 <= n < 40h]
```
24. (ESC #) Setting EURO symbol position

```
Code [1Bh] + [23h] + n
```
```
Description This command forces the EURO symbol to appear at the selected ASCII
code. So when a code table without EURO symbol is selected, the user
can use this symbol at the desired place. The original character with this
ASCII code becomes inaccessible until redefinition using the same
command.
ASCII codes from 00H to 1FH disable EURO substitution and the selected
code table is printed unchanged.
Default value is 00H
(EURO substitution disabled).
```
```
0 <= n <= FF The ASCII code of EURO symbol.
```
25. (ESC $) Specifying the absolute horizontal position of printing

```
Code [1Bh] + [24h] + n1 + n2
```
```
Description The shifting is n1 + 256*n2 dots.
Specifying beyond the line end is ignored.
```
```
0 <= n1 <= FF
```
```
0 <= n2 <= 02
```
```
Horizontal shifting in dots (least significant byte LSB)
```
```
Horizontal shifting in dots (most significant byte MSB)
```

### DATECS EP - 2000

26. (ESC %) Selecting/Canceling the printing of downloaded user character sets

```
Code [1Bh] + [25h] + n
Description Character set is defined by the command ESC &.
The chosen character set is kept even if printer is switched off.
n can be from 0 to 255 , but only the Least significant bit (LSB)
is important:
0 Canceling selection of user characters
(default characters set is chosen)
1 Loaded user character set is chosen
```
27. (ESC &) Selecting user character set

```
Code [1Bh] + [26h] + а + n + m + D1 1 + ... + D (m-n+1)k
```
```
Description a Number of the sub-command and can be:
0 or ‘ 0 ’: Copies internal character set A
over user character set A.
All parameters after the number
of the command are omitted.
1 or ‘ 1 ’: Copies internal character set B
over user character set B.
All parameters after the number
of the command are omitted.
2 or ‘ 2 ’: Defines a sequence of characters
for Font A (12x24).
3 or ‘ 3 ’: Defines a sequence of characters
for Font B (9x16).
4 or ‘ 4 ’: Defines a sequence of characters
for Font B (9x16).
```
```
20h <= n <= m FFh
```
```
n
m
```
```
The ASCII code of the first of the (m-n+1 ) consecutive characters.
The ASCII the last of the (m-n+1 ) consecutive characters.
When only one symbol is defined m=n.
```

# 7

### DATECS EP - 2000

(^) Dij Data for the characters.
Each character from Font A is defined with 48 bytes.
Each character from Font B is defined with 16 bytes
for subcommand 3 (the 9-th horizontal bit is always white)
and with 32 bytes for subcommand 4
(2 bytes for each horizontal row, only the most significant bit
of the second byte is used).
The data for character set (font) A is composed from left to right
and from top to bottom with two bytes for each horizontal line.
From the second byte only the first nibble
(the most significant 4 bits) is valid. Each bit defines one dot,
1 is for black, starting from the most significant bit.
Downloaded characters are valid even after switching off the
printer

28. (ESC !) Specifying printing mode of text data

```
Code [1 В h] + [21h] + n
```
```
Description Data is given in binary code.
Each n bit indicates the following:
```
```
Bit Function Value 0 Value 1
0 Character Font А (12x24) B (9x16)
1 Undefined
2 Undefined
3 Highlighting Canceled Specified
4 Double Height Canceled Specified
5 Double Width Canceled Specified
6 Undefined
7 Underline Canceled Specified
```
(^) An underline is attached to the full character width, which, however,
is not attached to the part having been skipped by the horizontal tab.
Neither is it attached to 90°-right-turned characters.^
The underline width is as having been specified by ESC -.
The default setting: 1 dot width.


### DATECS EP - 2000

(^) Highlighting is valid for character font A (12x2 4) and font B (9x16).
It is not recommended to be used for font B because text is not
readable. If at same time are given double height and/or double
width and to 90°-right-turning of character, then the sequense of
execution is as follows:

- Characters is doubled in the direction indicated;
- Character is turned at 90°-right-angle.
29. (ESC *) Printing graphical data

```
Code [1Bh] + [2Ah] + m + n1 + n2 + D 1 + ... + D k
```
```
Description m (0,1, 20h or 21h) Graphics mode (see table below).
```
```
0 <= n1 <= FF specifies the number of dots in horizontal line
(LSB).
```
```
0 <= n2 <= 09 specifies the number of dots in horizontal line
(MSB).
```
(^) Di (i from 1 tо k) Bit image data.
The number of dots in horizontal direction is n1+n2*256.
Number of data bytes k is:
n1 + 256*n2 for modes 0 and 1
(n1+256*n2)*3 for modes 20h and 21h
The bits subject to printing are taken as “1” and those not as “0”.
Bit image data is sent starting from the top to bottom and from the left to
right (vertical columns scanning). In modes m=0 and 1 only one byte per
column is sent and in mode m=20h, 21h – 3 bytes for each column are
sent.
Vertical Direction Horizontal Direction
m Mode Dots Dot density
Dot
density
Max.
dots
0
8 dots
single density

### 8 67 DPI 101 DPI 204/288

```
1 8 dots
double density
```
### 8 67 DPI 203 DPI 408/576


# 7

### DATECS EP - 2000

```
20h
24 dots
single density
```
### 24 203 DPI 101 DPI 204/288

```
21h
24 dots
double density
```
### 24 203 DPI 203 DPI 408/576

```
When the values set in m or n2 are out of the above range, the data is
processed as normal printing data.
If some part of the graphic or the entire graphic is outside the printable
area, then graphics data are accepted, but only the needed part of them
are printed.
In page mode and rotated by 90 degrees page the max. dot count is
larger than the numbers in the table above.
```
This command has one more version with 3 new modes:

```
Code [1Bh] + [2Ah] + m + n + { a + [00h] } +D 1 + ... +D k^
```
```
Description Designates a bit image of n*8 dots horizontal and by 24 or a dots vertical.
Depending on m there is compression of data.
All 3 modes are with high dot density (203x203 dpi).
```
```
m can be:
10h
```
```
11h
```
```
12h
```
```
Not compressed data with height 24 lines.
Byte a and byte 00h are not sent.
Compressed data with height 24 lines.
Byte a and byte 00h are not sent.
Compressed data with height a lines.
```
```
0 <= n <= FFh Defines horizontal size.
```
(^) Di The bit image data
Their number is n*24 bytes for mode 10h. The compressed data in mode
11h must give same number of bytes, but after the decompression. The
number of data bytes for mode 12h must be a*n (after decompression).
Decompression in modes 11h and 12h is similar to the one used in PCX
monochrome graphic mode. If the 2 most significant bits of the
consecutive byte are 1, so the next define a counter of iterations from 0
to 63 , and the next byte contains the data that has to be repeated.


### DATECS EP - 2000

```
If at least one of the most significant bytes is 0 , the byte contains data
which is directly used. If the data for the printer contains a byte with two
most significant bits 1 , it has to be sent as 2 bytes with counter 1.
Data for both modes is sent horizontally, from right to left and from top to
bottom. Each byte contains 8 points, the “1”-s are black starting from the
most significant bit.
```
A new mode for printing vertical lines added

```
Code [1Bh] + [2Ah] + [18h] + L + n + R
```
```
L^
```
```
n
```
### R

```
Offset (white dots) before the vertical line.
From 0 to 255.
Vertical line thickness in dots.
From 0 to 255.
Offset (white dots) after the vertical line.
From 0 to 255.
Description The command prints a vertical black line with thickness n and height –
the whole height of the line (including the space between the lines set
with commands ESC 2 , ESC 3 or ESC J ). The printer adds L dots to the
current X coordinate, draws the line and adds R dots to the X coordinate
after the line. The purpose of the command is to draw tables independent
of the type or of the font of the printed symbols between the vertical lines.
```
New modes for printing graphics are added.

```
Code [1Bh] + [2Ah] + [13h] + n1 + n2 + a +D 1 + ... +D k
or [1Bh] + [2Ah] + [14h] + n1 + n2 + a +D 1 + ... +D k
```
```
Description n1
```
```
n2
```
```
a
```
```
Lower part of bytes count in horizontal direction.
From 0 to 255.
Higher part of bytes count in horizontal direction.
From 0 to 1.
Vertical size of the image in dots.
From 1 to 24.
For command ESC * [13h] data for a bit image with size
(n1+256*n2)*8 dots horizontally and a dots vertically are
sent, with data compression (exactly as in command ECS *
[12h]). The graphics mode is single density (203x203
dots/inch).
```

# 7

### DATECS EP - 2000

(^) For command ESC * [13h] data for a bit image with size (n1+256*n2)*8
dots horizontally and a dots vertically are sent, with data compression
(exactly as in command ECS * [12h]). The graphics mode is single
density (203x203 dots/inch).
Data bytes count is a*(n1+256*n2) after decompression.
For command ESC * [14h] data are without compression like ESC *
[10h] command.
The commands are added to make printing of graphics in page mode
easier – in page mode with page height more than 2040 dots and print
direction 90 or 270 degrees it is not possible to fill the whole page height
using only one of the older commands for compressed graphics (ESC *
[11h] and ESC * [12h]).

30. (ESC -) Selecting/Cancelling Underline

```
Code [1Bh] + [2Dh] + n
```
```
Description An underline is attached to the full character width. It is, however, not
attached to the part having been skipped by horizontal tab command.
An underline is not attached to a 90°- right-turned characters.
```
```
The following values of n are possible:
```
```
0 or 30h
1 or 31h
2 or 32h
```
```
Canceling an underline.
Specifying an underline for 1-dot width.
Specifying an underline for 2-dots width.
This command only selects the underline thickness. For
specifying/canceling the Underline mode command ESC! ([1Bh] +
[21h]) must be used.
```
## 31 ESC Printing self test/diagnostic information

```
Code [1 В h] + [2 Е h]
```
```
Description Prints test page and self-diagnostic information. The self-diagnostic
information includes print density, print head temperature, battery
voltage, baud rate in case of work via RS232 and others.
```

### DATECS EP - 2000

## 32 ESC 2 Specifying 1/6-inch line feed rate

```
Code [1B] + [32h]
Description If in the line there are symbols that will not fit in the defined size, the line
automatically is set to be of the necessary height so they fit.
```
## 33 ESC 3 Specifying line feed rate n/203 inches

```
Code [1Bh] + [33h] + n
Description n is from 0 to 255.
Default value is n=22h (1/6 inches).
```
34. (ESC <) Changes print direction t **о** opposite

```
Code [1Bh] + [3Ch]
```
```
Description The command changes current print direction. It is needed when using
Hebrew and Arabic code tables, but is working for all code tables.
Default print direction is from right to left for code tables 19, 21, 22, 23,
24 and from left to right for all others.
```
```
The command is supported in firmware version 1.51 or higher.
```
## 35 ESC = Data input control

```
Code [1Bh] + [3Dh] + n
```
```
Description The command is used for selecting a peripheral device, which will
receiving incoming data.
n can be from 0 to 255 , but only the LSB is of significance.
Value 1 or ‘1’: A printer is selected only.
Value 0, '0', 2 or ‘2’: A customer display is selected only.
Value 3 or ‘3’: A printer and a customer display are selected.
When a customer display is selected only (n=2 ), all data, except this
command and the real-time commands, are ignored..
When turning ON the printer, selected peripheral device is specified by
memory switch 13 , as well if executing a command (ESC @) and n was
3 or ‘3’.
```

# 7

### DATECS EP - 2000

36. (ESC >) Select print direction

```
Code [1Bh] + [3Eh] + n
```
```
Description Possible values for n:
```
```
0 or ‘ 0 ’
```
```
1 or ‘ 1 ’
```
```
2 or ‘ 2 ’
```
```
Default direction for the selected code table.
```
```
Left to right direction forced.
```
```
Right to left direction forced.
```
```
The command sets the print direction. It is needed when using Hebrew
and Arabic code tables, but is working for all code tables.
```
```
Default print direction is from right to left for code tables 19, 21, 22, 23,
24 and from left to right for all others.
Commands ESC < and ESC > work together. The sequence, which
selects the direction, is as follows:
```
- The print direction is set according to the currently selected
    code table.

(^) • If command ESC > with argument > 0 was executed since last
ESC u command, then this is the print direction.

- If command ESC < was executed after this, the print direction is
    changed to the opposite.

```
The command is supported in firmware version 1.51 or higher.
```
## 37 ESC @ Initializing the printer

```
Code [1Bh] + [40h]
```
```
Description Clears data stored in the print buffer and brings various settings to
the initial state (Default state).
```
```
Data (items) in serial buffer are not cleared.
```

### DATECS EP - 2000

## 38 ESC D Setting horizontal tab position

```
Code [1Bh] + [44h] + n 1 + ... + nk + [00h]
```
```
Description ni indicates the number of the column from the beginning to the
horizontal tab position, minus 1. For example, to set the position at 9th
column, n=8 is to be specified.
ni is from 0 to 255
The tab position is set at position where it is “character width multiplied
by ni” from the line beginning. The character width, at this time, includes
the rightward space amount. In double wide characters, it is made double
of the ordinary case.
Tab positions can be specified are maximum 32.
ESC D [00h] clears all the set tab positions.
Following clearing, horizontal tab command is ignored.
```
39. (ESC **Е** ) Specifying / Canceling Highlighting

```
Code [1Bh] + [45h] + n
```
```
Description n can be from 0 to 25 5, but only the least significant bit is of significance.
```
```
Value 0: Canceling highlighting.
Value: Highlighting is specified.
```
(^) This is effective for character font A (12x24) and font B (9x16). It is not
recommended to be used for font B because text is not readable.

## 40 ESC F Filling or inverting the page area in page mode

```
Code [1Bh] + [46h] + n
Description Allowed values for n:
0 or ‘ 0 ’
1 or ‘ 1 ’
2 or ‘ 2 ’
```
```
The area is cleared (white)
The area is filled (black)
The area is inverted.
The command fills the selected with ESC W page with the desired
color or inverts it. The command is not valid in standard mode.
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

41. (ESC G) Specifying / Canceling highlighting

```
Code [1Bh] + [47h] + n
```
```
Description The same as command ESC E.
```
42. (ESC I) Specifying / Canceling Italic Print

```
Code [1Bh] + [49h] + n
```
```
Description n can be from 0 to 25 5, but only the least significant bit is of significance.
Value 0: Normal Print
Value 1: Italic Print
```
## 43 ESC J Printing and Paper feed n/203 inches

```
Code [1Bh] + [4 А h] + n
```
```
Description Prints data in the print buffer and feeds paper by n/ 203 inch.
n can be from 0 to 255.
This function is temporary and does not affect the feed operation
thereafter.
When n=0 the paper is fed by 1/203 inch.
```
## 44 ESC L Selecting page mode

```
Code [1Bh] + [4Ch]
```
```
Description The command switches from standard mode to page mode. In this mode
the printing is not immediately, but is accumulated in a reserved for this
purpose memory area. The resulting image is printed using one of the
commands ESC FF , GS FF or GS Z.
The page area is the maximum (576 x 2432 dots for wide paper or 408x
2432 dots for narrow paper) or the result of the last executed command
ESC W.
The print direction is the default (left to right) or the result of the last
executed command GS T.
The current print position is (0, 0) depending on the selected print
direction.
The command is not valid in page mode.
```
```
The command is supported in firmware version 1.51 or higher.
```

### DATECS EP - 2000

## 45 ESC N Reading programmed serial number

```
Code [1Bh] + [4Eh]
Description The command returns the programmed serial number of the printer as an
ASCIIZ string. Number length is 13 characters. If no serial number is
programmed, then only one symbol is returned – 00h.
The command is supported in firmware version 1.51 or higher.
```
46. (ESC R) Selecting Country

```
Code [1Bh] + [52h] + n
Description n can be from 0 to 13 and has the following meaning:
```
```
N о Character Set Changed Characters
23h 24h 40h 5Bh 5Ch 5Dh 5Eh 60h 7Bh 7Ch 7Dh 7Eh
0 U.S.A. # $ @ [ \ ] ^ ` { | } ~
1 France # $ à º ¢ § ^ ` é ù è ̈
2 Germany # $ § Ä Ö Ü ^ ` ä ö ü ß
3 U.K. £ $ @ [ \ ] ^ ` { | } ~
4 Denmark I # $ @ Æ Ø Å ^ ` æ ø å ~
5 Sweden # $ É Ä Ö Å Ü é ä ö å ü
6 Italy # $ @ º \ é ^ ù à ò è ì
7 Spain I Pt $ @ ¡ Ñ ¿ ^ ` ̈ ñ } ~
8 Japan # $ @ [ ¥ ] ^ ` { | } ~
9 Norway # ¤ É Æ Ø Å Ü é æ ø å ü
10 Denmark II # $ É Æ Ø Å Ü é æ ø å ü
11 Spain II # $ á ¡ Ñ ¿ é ` í ñ ó ú
12 Latin America # $ á ¡ Ñ ¿ é ü í ñ ó ú
13 Korea # $ @ [ w ] ^ ` { | } ~
```
## 47 ESC S Specifying speed (bps) of the serial port

```
Code [1Bh] + [53h] + n
```
```
Description Sets new communication speed for the serial interface.
```
```
Possible values of parameter n:
0 or ‘0’ 1200 bps
1 or ‘1’ 2400 bps
2 or ‘2’ 4800 bps
```

# 7

### DATECS EP - 2000

(^3) or ‘3’ 9600 bps
4 or ‘4’ 19200 bps
5 or ‘5’ 57600 bps
6 or ‘6’ 115200 bps
7 or ‘7’ 38400 bps
(^) The command is valid only when the printer is connected through
a serial cable. The last setting is valid after switching OFF and ON
the printer.
Default value is 6 (115200 bps).

## 48 ESC T Printing short self test

```
Code [1Bh] + [54h]
```
```
Description Prints current printer parameters, including intensity, temperature of the
print head, battery voltage, speed in case of serial connection, etc.
```
49. (ESC U) Selecting / Canceling underlined printing

```
Code [1Bh] + [55h] + n
Description Possible values for n:
```
```
0 or ‘0’ Canceling underlined characters.
1 or ‘1’ Specifying underlined characters.
```
(^) No underlines are attached to 90°-right- turned characters.

50. (ESC V) Selecting / Canceling printing 90°- right turned characters

```
Code [1Bh] + [56h] + n
```
```
Description n can be from 0 to 255 , but only the least significant bit is of significance:
Value 0: Canceling 90°-right- turned Characters.
Value 1: Specifying 90°-right- turned Characters.
```
## 51 ESC W Defining the print area in page mode

```
Code [1Bh] + [57h] + xL + xH + yL + yH + dxL + dxH + dyL + dyH
```

### DATECS EP - 2000

(^) xL and xH
yL and yH
dxL and dxH
dyL and dyH
Low and high byte of the horizontal offset of the
relative top left corner of the page.
Low and high byte of the vertical offset of the
relative top left corner of the page.
Low and high byte of the width of the page.
Low and high byte of the height of the page.
Description The command defines the relative position and size of the page. In page
mode the new values are active immediately, in standard mode they are
memorized and used after entering page mode. The print position has
coordinates ( 0 , 0 ) depending on the currently selected print direction
(command GS T ). If the relative position is invalid, the command is not
accepted. If only a part of the selected page is in the printable area
(current paper width and maximal height of 2432 dots ), this area is used
as page area.
The default page size is 576 x 2432 dots in wide paper mode or
408 x 2432 dots in narrow paper mode.
The command is supported in firmware version 1.51 or higher.

## 52 ESC X Specifying max printing speed

```
Code [1Bh] + [58h] + n
```
```
Description n is between 0 and 3 or between ‘0’ and ‘3’:
```
```
0 or ‘0’ 220 mm/s (8.8 inch/s)
1 or ‘1’ 150 mm/s (6.0 inch/s)
2 or ‘2’ 100 mm/s (4.0 inch/s)
3 or ‘3’ 50 mm /s (2.0 inch/s)
Default value is 0 (60 mm/s).
```
(^) The defined speed is recommended and can be achieved with not very
cold printing head and comparatively little data to print in the line (less
black).

## 53 ESC Y Selecting intensity level

```
Code [1Bh] + [59h] + n
```

# 7

### DATECS EP - 2000

```
Description n is between 0 and 6 or between ‘0’ and ‘6’:
```
```
0 or ‘0’ Intensity 60 %
1 or ‘1’ Intensity 75 %
2 or ‘2’ Intensity 90 %
3 or ‘3’ Intensity 100 %
4 or ‘4’ Intensity 120 %
5 or ‘5’ Intensity 140 %
6 or ‘6’ Intensity 160 %
Default value is 3 (100%).
```
(^) Higher intensity can cause decrease in printing speed.

## 54 ESC Z Returning diagnostic information

```
Code [1Bh] + [5Ah]
```
```
Description The printer will return 32 bytes of information with the following
structure:
```
1-22 (^) Printer name
up to 22 charachters.
23-25 Firmware version – 3 digits.
26-27 Language version, described by two characters.
28-32 5 bytes with flags. When the corresponding bit is 1 , the function
is supported and when 0 , the function is not supported.
(^) Bits are listed below:
Bit Meaning
28.0 Supports IrDA mode.
28.1 Mag-stripe reader support.
28.2 Supports reading of all 3 tracks on magnetic card.
28.3 Katakana support, ASCII codes above 127 contain Katakana
characters.
28.4 JIS and Shift-JIS support.
28.5 Prints in commands ESC. and ESC T and in command ESC `^
returns temperature in º Fahrenheit.


### DATECS EP - 2000

28.6 Bluetooth support.

28.7 Reserved – always is 1.

29.0 Update via firmware interface.

29.1 Korean characters support.

29.2 BLACK MARK mode support.

29.3 Barcode reader support.

29.4 USB support.

29.5 Not in use.

29.6 Page mode support

29.7 Reserved – always is 1.

30.0 GB2312 (Simplified Chinese) support

30.1 BIG5 (Traditional Chinese) support

30.2 Not in use

30.3 Not in use

30.4 Not in use

30.5 Not in use

30.6 Not in use

30.7 Reserved – always is 1

31.0 State of flag 1 – determined in command GS )^

31.1 State of flag 2 – determined in command GS )^

31.2 State of flag 3 – determined in command GS )^

31.3 State of flag 4 – determined in command GS )^

31.4 State of flag 5 – determined in command GS )^

31.5 State of flag 6 – determined in command GS )^

31.6 Not in use

31.7 Reserved – always is 1

32.0 State of flag 8 – determined in command GS )^

32.1 State of flag 9 – determined in command GS )^

32.2 State of flag 10 – determined in command GS )^

32.3 State of flag 11 – determined in command GS )^

32.4 State of flag 12 – determined in command GS )^


# 7

### DATECS EP - 2000

```
32.5 State of flag 13 – determined in command GS )^
32.6 Not in use
32.7 Reserved – always is 1
```
## 55 ESC \ Specifying relative horizontal position

```
Code [1Bh] + [5 С h] + n1 + n2
Description 0 <= n1 <= FFh Specifying number of dots from current position in
horizontal (LSB).
0 <= n2 <= FFh Specifying number of dots from current position in
horizontal (MSB).
```
```
The printing start position is specified with n1 + 256*n2 dots. Specifying
exceeding the top of line or the end of line is ignored. Specifying dots in
minus (left) direction from the current one, is the complement of N with
65536 (N-=65536 - N).
```
## 56 ESC ] Loading the default settings stored in Flash memory

```
Code [1Bh] + [5Dh]
```
```
Description The following parameters are read from flash memory
and become active:
Speed of communication in serial port.
Configuration “switches”.
Max printing speed.
Print density.
Height of printing line.
Country.
Code table.
Height of barcode.
```
(^) Width of barcode single line.
Font of the text (HRI characters) corresponding to the barcode.
Position of the HRI characters.

## 57 ESC ^ Saving current settings in Flash memory

```
Code [1Bh] + [5Eh]
```

### DATE CS EP - 2000

```
Description The values of the following settings are stored in flash memory:
```
(^) Speed of communication in serial port.
Configuration “switches”.
Max printing speed.
Print density.
Height of printing line.
Country.
Code table.
Height of barcode.
Width of barcode single line.
Font of the text (HRI characters) corresponding to the barcode.
Position of the HRI characters.
These setting become default settings.

## 58 ESC _ Loading factory settings

```
Code [1Bh] + [5Fh]
```
```
Description This command sets the printer in default state with the following
settings:
```
(^) All printing attributes like underline, rotating etc. are cleared.
(^) Internal font A (12 x 24) is selected.
(^) Pitch between lines is 1/6 inch.
(^) Barcode height is 80 dots, and barcode width is 3.
(^) All downloaded fonts and bit images are cleared.
Printing speed is set to 60 mm/s.
Print density is 100%.
Communication speed is set to 115200 bps.
Code table becomes 437 (US), and country 0 (US). For Japanese
version default values are: Code table Katakana and country Japan.


# 7

### DATECS EP - 2000

59. (ESC `) Returning voltage and printer head temperature

```
Code [1Bh] + [60h]
```
```
Description Returns 2 bytes of information – the first one is voltage returned in the
format: voltage x 10 + 20H and second is head temperature returned in
the format: head temperature + 20H.
```
60. (ESC a) Aligning the characters

```
Code [1Bh] + [61h] + n
Description n 0 and 2 , or between ‘ 0 ’ and ‘ 2 :
```
```
0 or ‘0’ Left end alignment.
1 or ‘1’ Centering
2 or ‘2’ Right end alignment
The default value is 0.
After printing of the line the alignment becomes automatically
left-justified.
```
61. (ESC b) Increasing text line height

```
Code [1Bh] + [62h] + n
```
```
Description The command adds n dots to current text line height.
n is from 0 to 255.
After receiving the every symbol for printing, the printer checks its size
(depending on double height attributes, rotation e.c.t.) and sets current
line height so, that the whole letter is printed. The command adds
additional dots to so calculated line height.
```
(^) The maximum line height is 48 dots above base line (the line, at which
the bottom of most latin letters is, for example the letter ‘A’). If adding n to
the current height is larger than maximum height (48), then 48 is set as
height.
If no text or graphic data in line, the command is not executed.
The difference between line height in commands LF , ESC 2 , ESC 3 and
ESC J is that the height is increased above the letters. The command is
useful when inverting a text line in XOR ruled lines mode.
The command is supported in firmware version 1.51 or higher.


### DATECS EP - 2000

62. (ESC c5) Enabling/Disabling the functioning of the button LF

```
Code [1Bh] + [63h] + [35h] + n
```
```
Description n can be from 0 to о 255 , but only the least significant bit is of
significance.
Value 0 : Button LF is valid.
Value 1: Button LF is invalid.
Default value is 0.
```
63. (ESC d) Printing and feeding paper by n-lines

```
Code [1Bh] + [64h] + n
```
```
Description n can be from 0 tо 255.
Prints data inside the buffer and feeds paper by n lines.
The beginning of the line is to be considered as the next printing start
position.
When n=0 paper is fed with 1 line.
```
64. (ESC i) Feeding paper backwards

```
Code [1Bh] + [69h]
```
```
Description If the paper has been fed forward with command ESC o , then it returns
backwards.
The feed is exactly the same as it was defined in command ESC o , but in
reverse direction.
If paper has not been fed forward then this command is ignored.
```
65. (ESC o) Temporarily feeding paper forward

```
Code [1Bh] + [6Fh] + n
```
```
Description n can be from 0 to 255.
This command temporarily feeds paper forward with the defined number
of steps n (1/8 mm).
At command ESC i or at first command for printing the paper feeds
backwards.
```

# 7

### DATECS EP - 2000

66. (ESC p) Generating a drawer pulse

```
Code [1Bh] + [70h] + m + t1 + t2
```
```
Description m one byte and its value is not significant
```
(^) t1 one byte pulse ON time [t1 x 2ms]
(^) t 2 one byte pulse OFF time [t2 x 2ms]
OFF time (t2) must be 4 time longer, than ON time (t1) – ((t1 x 4) <= t2).

67. (ESC r) Full command for sounding buzzer

```
Code [1Bh] + [72h] + Data
```
```
Description This command is used for making (beeping) a sequence of sounds
with a certain frequency and duration.
```
```
The data is in format, similar to the one used for writing notes and can be
of any length. The first invalid character cancels the command.
```
```
Data format:
```
(^) Notes: a Latin letter of value from ‘A’ to‘G’.
(^) ‘C’ Dо
(^) '‘D’ Rе
(^) ‘E’ Mi
(^) ‘F’ Fa
(^) ‘G’ Sol
(^) ‘A’ La
(^) ‘B’ Si
(^) If immediately after the note comes character ‘#’, then the note is higher
in pitch by a semitone (sharp).
If immediately after the note comes character ‘&’, then the note is lower
in pitch by a semitone (flat).
(^) Pause: Character space (ASCII 20h).
After a note or pause there can be one or a few bytes, which specify the
duration. Valid are characters from ‘0’ to ‘ 5 ’, they have the following
meaning:


### DATECS EP - 2000

(^) ‘0’ Basic duration of a note/pause.
(^) ‘1’ Basic duration * 2.
(^) ‘2’ Basic duration * 4.
(^) ‘3’ Basic duration * 8.
(^) ‘4’ Basic duration * 16.
(^) ‘5’ Basic duration * 32.
(^) If there are a few durations one after another they are summed up.
(^) Going to higher scale: character ‘+’
(^) Going to lower scale: character ‘-’
(^) Specifying tempo: character ‘^’
The character ‘^’ must be followed by a number.
The number specifies the percentage: duration of notes and intervals
to basic duration. Values:
(^) ‘1’ 200 %
(^) ‘2’ 175 %
(^) ‘3’ 140 %
(^) ‘4’ 120 %
(^) ‘5’ 100 %
(^) ‘6’ 80 %
(^) ‘7’ 60 %
(^) ‘8’ 50 %
(^) ‘9’ 40 %
(^) Return to scale 1
(it is default).
Character ‘@’
(^) Tone ‘La’ in it is 440 Hz.
It is recommended that the data ends with ASCII code 03h, although any
other non-printing character will also stop the command.


# 7

### DATECS EP - 2000

68. (ESC s) Reading current printer settings

```
Code [1Bh] + [73h] + n
```
```
Description This command returns current settings or loaded data in printer.
Possible values for n:
```
```
0 or ‘ 0 ’ Current settings from flash memory are returned in
following order:
```
- Memory switches – 13 digits 0 or 1.
- Serial port speed (bauds) – an integer.
- Country number (from command ESC R ) –
    an integer.
- Current character table (from command ESC u ) –
    an integer.

(^) • Print density (from command ESC Y ) –
an integer.

- Print speed (from command ESC X ) – an integer.
- EURO symbol position (from command ESC # ) –
an integer from 0 to 255.
Field separator is ‘,’.

```
1 or ‘ 1 ’ Current settings from printer RAM are returned.
The format of data is the same as for subcommand 0.
```
```
2 or ‘ 2 ’ The currently loade graphic logo is returned in
format: w h D i , where:
w Graphics width in bytes (pixels*8 ).
h Graphics height in pixels.
Di Graphics data – 2*w*h bytes in the sequence as
in command GS *. Data are in hexadecimal
format (each byte sent as two hexadecimal
symbols).
Data are in hexadecimal format (each byte sent
as two hexadecimal symbols).
```
```
The command is supported in firmware version 1.51 or higher.
```

### DATECS EP - 2000

69. (ESC u) Selecting Code table

```
Code [1Bh] + [75h] + n
```
```
Description Values for n:
```
```
0 ENGLISH (437)
```
```
1 LATIN 1 (850)
```
```
2 PORTUGUESE (860)
```
```
3 LITHUANIAN
```
```
4 LATIN 2 (852)
```
```
5 POLISH
```
```
6 TURKISH (857)
```
```
7 BALTIC (775)
```
```
8 BULGARIAN (856)
```
```
9 RUSSIAN (866)
```
```
10 LATVIAN
```
```
11 GREEK (737)
```
```
12 HEBREW (862)
```
```
13 WESTERN (1252)
```
```
14 CE (1250)
```
```
15 TURKISH (1254)
```
```
16 BALTIC (1257)
```
```
17 CYRILLIC (1251)
```
```
18 GREEK (1253)
```
```
19 HEBREW (1255)
```
```
20 KATAKANA
```
```
21 ARABIC
```

# 7

### DATECS EP - 2000

### 22 ARABIC (1256)

```
23 ARABIC (1256 with Arabic digits and punctuation)
```
```
24 ARABIC
(1256 with Farsi Arabic digits and punctuation)
```
```
When the printer is switched ON it is loaded the default code table which
is stored in flash-memory.
```
Addition information about Arabic code tables:

```
When selected, the default print direction is from right to left (the same for code table 19 –
Hebrew ). The print direction can be changed using commands ESC > and ESC <.
```
```
Arabic symbols are larger than the symbols in from the other code tables (16 dots for font
A and 12 dots for font B). Depending on the position of the letter in a word, Arabic letters
may have up to 4 different forms – single letter, right form, middle form and left form.
```
```
Code table 21 includes all forms of every letter, so the application program has to select
the correct ASCII code. When using code tables 22, 23 and 24 , the printer automatically
selects the correct letter form dependant on its neighbours. If it is needed to print directly a
form of the letter when one of the pages 22, 23 or 24 is selected, the ASCII code 7Fh is
sent to the printer – the first symbol after it is taken directly from code table 21.
```
```
Code table 2 3 differs from 22 by that the digits and some of the punctuation marks are
changed with Arabic. Table 24 differs from 23 by that the Arabic digits are Farsi variant
(3 of them are different).
```
For Japanese and Chinese versions of the printer only:

When one of the Arabic code tables is selected, then two-byte Asian letters are not accessible –
a non-Arabic code page must be selected to print them.


### DATECS EP - 2000

70. (ESC v) Transmitting the printer status

```
Code [1Bh] + [76h]
```
```
Description The printer returns one byte whose bits have the following meaning :
```
```
Bit Value 0 Value 2
```
(^0) Not in use
(^1) Not in use
(^2) There is paper and paper
cover is closed
There is no paper or paper cover
is opened
(^3) Printing head is with normal
temperature
The printing head is overheated
(^4) Not in use
(^5) No auto cutter error Auto cutter is blocked
6 There is no paper near end Paper near end
(^7) Not in use

71. (ESC {) Enabling/Canceling printing of 180° turned characters

```
Code [1Bh] + [7Bh] + n
```
```
Description n can be from 0 to 255 , but only the least significant bit is of significance.
Value 0: Cancel printing of 180° turned characters.
Value 1: Enable printing of 180° turned characters.
```
```
Default value is 0.
The whole line is turned.
```
72. (GS FF) Printing in page mode and returning to standard mode

```
Code [1Dh] + [0Ch]
```
```
Description The command prints the image in the currently defined page and leaves
page mode.
All the page memory is erased.
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

73. (GS $) Specifying the absolute vertical position in page mode

```
Code [1Dh] + [24h] + nL + nH
```
```
Description nL Lower byte of the new vertical position
```
```
nH Higher byte of the new vertical position
```
```
The command sets new vertical print position. If the position is outside
the currently active page, the command is not accepted. The real new
coordinates depend on the print direction (selected using GS T ).
The command is invalid in standard mode.
The horizontal position is changed with commands ESC $ and ESC \ –
they work both in page and standard mode.
```
```
The command is supported in firmware version 1.51 or higher.
```
74. (GS )) Setting printer flags (memory switches)

```
Code [1Dh] + [29h] + f1 + f2 + ... + f13
```
```
Description This model has 13 memory switches and selecting, releasing, and
changing a function is available with this command. With this command
can be set 13 flags (memory switches), they are switched ON or OFF.
Memory switch setting is retained even after printer power off. These
flags are like virtual switches defining the state of the printer.
```
(^) fi is the flag that we want to switch ON or OFF.
All flags must be set.
Possible values are:
‘0’ Flag is OFF.
‘1’ Flag is ON.
‘.’ Flag stays unchanged.
(^) Meaning of different flags:
Flag OFF ON
1 Power on/off sound disabled Power on/off sound enabled
2 CR (ASCII code 13) is not
executed
CR is executed as LF (ASCII
code 10)
3 LF (ASCII code 10) is
executed
LF (ASCII code 10) is not
executed


### DATECS EP - 2000

```
4 LF immediately after CR as
selected by flag 3
```
```
LF immediately after CR
is not executed
5 Default is font A (12x24) Default is font B (9x16)
6 78 mm paper roll 58 mm paper roll
7 Reserved
8 Hardware flow control Xon/Xoff flow control
9 USB interface disabled USB interface enabled
10 USB is ALWAYS in mode DEVICE
11 USB е в режим HOST USB е в режим DEVICE
12 Cutter enabled Cutter disabled
13 Default select printer Default select customer display
```
75. (GS *) Defining a Downloaded Bit Image (logo)

```
Code [1Dh] + [2Ah] + n1 + n2 + D 1 + ... + D n
```
```
Description n1 Between 1 and 127.
It defines the horizontal size of the downloaded image.
```
```
n2 Between 1 and 248.
It defines the vertical size of the downloaded image.
```
(^) Di The data for the bit image. This data consists of n1*n2 bytes, from
left to right and from top to bottom, but n1 bytes in each horizontal
line (n1*8 dots) and n2 lines. Each bit defines a dot, 1 corresponds
to black. Total number of bytes cannot be bigger than 16 kB.
(^) The command defines a bit image that contains number of dots, defined
by n1 and n2. Image is stored and after the printers is switched off.
The so defined bit image is printed with command GS /

76. (GS /) Printing a Downloaded Bit Image (logo)

```
Code [1Dh] + [2Fh] + m
```
```
Description m defines the printing mode and can be :
```
```
m Mode
Vertical
dots
```
```
Horizontal
dots
```

# 7

### DATECS EP - 2000

```
0 Normal 203 DPI 203 DPI
```
```
1 Double width 203 DPI 101 DPI
```
```
2 Double height 101 DPI 203 DPI
```
```
3 Double height and double width 101 DPI 101 DPI
```
```
When a download bit image has not been defined, this command
is ignored.
Command ESC @ (initialization of the printer) does not clear downloaded
bit image.
A portion of a download bit image exceeding one line length
is not printed.
```
77. (GS :) Starting/Ending macro definitions

```
Code [1Dh] + [3Ah]
```
```
Description Specifies starting/ending macro definition. Maximum content available for
macro definition is 4094 bytes. After the last byte of data, the
command is sent once again to define the end.
Even with ESC @ (initialization of the printer) having been executed,
defined content is not cleared. Therefore, it is possible to include ESC
@ into the content of macro definition.
Normal printing operation is carried out even while in macro definition.
```
78. (GS B) Enable / Disable inverse printing (white on black)

```
Code [1Dh] + [42h] + n
```
```
Description n is from 0 to 25 5, but only LSB is checked.
Value 0 : Disable inverse printing.
Value 1: Enable inverse printing.
Default value: 0.
```
79. (GS C) Read the Real Time Clock

```
Code [1Dh] + [43h]
```

### DATECS EP - 2000

```
Description The command returns the current value of the RTC as string.
```
```
Returned data format (21 bytes):
```
```
YY MM DD WW hh mm ss[00h]
```
```
YY Year without the century (00-99)
```
```
MM Month (01-12)
```
```
DD Day (01-31)
```
```
WW Day of the week (01-07)
```
```
hh Hour (00-23)
```
```
mm Minutes (00-59)
```
```
ss Seconds (00-59)
```
```
Field separator is space symbol (ASCII 32h).
Data are terminated with ASCII 00h.
The command exists in printer versions 1.51 or newer.
```
80. (GS H) Selecting Printing position of HRI Code

```
Code [1Dh] + [48h] + n
```
```
Description Selecting printing position of HRI code when printing barcodes.
n is between 0 and 3 or between ‘0’ and ‘3’:
```
```
Value: Printing position:
```
(^0) No printing
(^1) Above the barcode
(^2) Below the barcode
(^3) Both above and below the barcode


# 7

### DATECS EP - 2000

81. (GS L) Setting the left margin

```
Code [1Dh] + [4Ch] + n1 + n2
```
```
Description This command sets the position in dots (1/203 inches), from which
begins printing of each line. This command only works when it is entered
at the beginning of a line. The value of the left margin is n1+256*n2 dots.
Default value is 0.
```
```
The command is valid in standard mode only.
```
82. (GS Q) Printing 2-D (two dimensional) barcodes

```
Code [1Dh] + [51h] + n + ...
```
```
Description n selects the type of barcode:
```
```
2 or ‘ 2 ’: PDF417 6 or ‘ 6 ’: QR Code
```
### PDF417

```
Code [1Dh] + [51h] + n + Type + EncMode + ECCL+Size +nl + nh +Data i
```
```
Description Type PDF417 type
```
```
0 : Standard 1 : Truncated
```
```
EncMode Encoding mode
```
### 0 :

```
Automatic most
suitable encoding
1 : Binary encoding
```
### ECCL

```
Error correction control level.
Possible values 0 to 9.
ECCL =9 automatically selects correction level
dependent on data length.
```
```
Size
```
```
Specify one from the bellow table:
(X: bar width,
Y: row height).
```
```
0 X=2, Y=4 8 X=12, Y=4
```

### DATECS EP - 2000

### 1 X=2, Y=9 9 X=12, Y=9

### 2 X=2, Y=15 10 X=12, Y=15

### 3 X=2, Y=20 11 X=12, Y=20

### 4 X=7, Y=4 12 X=20, Y=4

### 5 X=7, Y=9 13 X=20, Y=9

### 6 X=7, Y=15 14 X=20, Y=15

### 7 X=7, Y=20 15 X=20, Y=20

nl, nh
Specify lower byte and upper byte of data size
(1 to 384).

(^) Data i Data bytes
QR Code
Code [1Dh] + [51h] + n + Size + ECCL + nl + nh + Data i
Description Size
Size of symbol.
Possible values: 1, 4, 6, 8, 10, 12, 14
ECCL Error correction control level:
1 : L (7%)
2 : M (15%)
3: Q (25%)
4 : H (30%)
nl, nh Specify lower byte and upper byte of data size
(1 to 448).
(^) Data i Data bytes


# 7

### DATECS EP - 2000

83. (GS R) Filling or inverting a rectangle in page mode

```
Code [1Dh] + [52h] + xL + xH + yL + yH + dxL + dxH + dyL + dyH + n
```
```
xL and xH Low and high byte of the horizontal position of
the top left corner of the rectangle in the active
page.
```
```
yL and yH Low and high byte of the vertical position of the
top left corner of the rectangle in the active
page.
```
```
dxL and dxH Low and high byte of the width of the rectangle.
```
```
dyL and dyH Low and high byte of the height of the rectangle.
```
```
n Filling mode:
0 or ‘0’ Rectangle area is cleared (white).
```
```
1 or ‘1’ Rectangle area is filled (black).^
2 or ‘2’ Rectangle area is inverted.
Description The coordinates are relative to the left corner of the page, defined using
ESC W (The print direction doesn’t matter).
If some part of the rectangle is outside the page, only the part inside the
page is filled.
The command is invalid in standard mode.
The command is supported in firmware version 1.51 or higher.
```
84. (GS S) Selecting 2-D barcode cell size

```
Code [1Dh] + [53h] + n
```
```
Description This command sets the cell size for two dimensional barcode QR Code.
Possible values for n:
```
```
0 or ‘0’ Cell size 3.
1 or ‘1’ Cell size 4.
```

### DATECS EP - 2000

85. (GS T) Selecting the print direction in page mode

```
Code [1Dh] + [54h] + n
```
```
Description The command selects the current print direction and set starting point to
(0, 0) according to this direction.
Accepted values of n:
0 or ‘0’ Printing from left to right, feed to bottom.
Starting point in left top corner of the page.
1 or ‘1’ Printing from bottom to top, feed to right.
Starting point in left bottom corner of the page.
2 or ‘2’ Printing from right to left, feed to top.
Starting point in right bottom corner of the page.
3 or ‘3’ Printing from top to bottom, feed to left.
Starting point in right top corner of the page.
```
(^) In page mode this command changes immediately the print direction.
In standard mode the new value is memorized and used after
entering page mode.
The command is supported in firmware version 1.51 or higher.

86. (GS U) Selecting standard mode

```
Code [1Dh] + [55h]
Description The command switches from page mode to standard mode.
The whole memory area of page mode is cleared.
The command is invalid in standard mode.
The command is supported in firmware version 1.51 or higher.
```
87. (GS V) Paper cutting

```
Code [1Dh] + [56h] + m + n
```
```
Description n is one byte and it uses depend of m.
m is one byte specifies cut mode.
Possible values of m:
1 or ‘1’ Feeds receipt paper to cutting position and cuts receipt
n – not significant
```

# 7

### DATECS EP - 2000

```
66 Feeds receipt paper to cutting position and feeds paper n more
steps (n x 0.125 mm), then cuts receipt.
```
```
104 Feeds receipt paper to cutting position and feeds paper n more
steps (n x 0.125 mm), then cuts receipt and feeds receipt paper
back to the printing position.
```
```
This option is to reduce top margin of the next receipt after cutting.
```
88. (GS W) Setting the print area width

```
Code [1Dh] + [57h] + n1 + n2
Description This command sets the print area width in dots (1/203 inches). This
command only works when it is entered at the beginning of a line.
The defined value of print area width is n1+256*n2 dots.
The default value depends on the mode 58 mm / 78 mm paper roll and is
408 or 576 dots.
```
```
The command is valid in standard mode only.
```
89. (GS X) Drawing a rectangular box with selected thickness in page mode

```
Code [1Dh] + [58h] + xL + xH + yL + yH + dxL + dxH + dyL + dyH + n + d
```
```
xL and xH Low and high byte of the horizontal position of the
top left corner of the box in the active page.
```
```
yL and yH Low and high byte of the vertical position of the
top left corner of the box in the active page.
```
```
dxL and dxH Low and high byte of the width of the box.
```
```
dyL and dyH Low and high byte of the height of the box.
```
(^) n Filling mode:
0 or ‘0’ Area under the box is cleared
(white).
1 or ‘1’ Area under the box is filled (black).
2 or‘ 2’ Area under the box is inverted.
(^) d Box thickness (from 1 to 64).


### DATECS EP - 2000

```
Description The coordinates are relative to the left corner of the page, defined using
ESC W (The print direction doesn’t matter).
If some part of the rectangle is outside the page, only the part inside the
page is filled.
The box thickness is always to the inner side of the rectangle.
The command is invalid in standard mode.
```
```
The command is supported in firmware version 1.51 or higher.
```
90. (GS Z) Printing the non blank page area only in page mode

```
Code [1Dh] + [5Ah]
```
```
Description The command checks the whole memory of the page mode. The area
from the first horizontal line wit at least 1 black dot to the last such line is
printed. The printer does not leave page mode, current page start
position and sizes are not changed. The printed width is 576 or 408 dots
depending on the selected paper width.
```
(^) The command is invalid in standard mode.
The command is supported in firmware version 1.51 or higher.

91. (GS \) Specifying the relative vertical position in page mode

```
Code [1Dh] + [5Ch] + nL + nH
```
```
nL Lower byte of the new vertical position
```
```
nH Higher byte of the new vertical position
```
```
Description The command sets new vertical print position relative to the current one.
If the position is outside the currently active page, the command is not
accepted. The real new coordinates depend on the print direction
(selected using GS T ). The command is invalid in standard mode.
The horizontal position is changed with commands ESC $ and ESC \ –
they work both in page and standard mode.
The relative vertical offset is nL + 256*nH dots. Offsets in negative
direction are given as complement of 65536 (n-=65536 - n ).
```
```
The command is supported in firmware version 1.51 or higher.
```

# 7

### DATECS EP - 2000

92. (GS ^) Executing macro

```
Code [1Dh] + [5 Е h] + n1 + n2 + n3
```
```
Description n1 The number of times of macro execution.
```
```
Between 1 and 255.
```
(^) n2 Waiting time on macro execution. Waiting time of n2 x 100 msec is
given for every execution.
Between 1 and 255.
(^) n3 Macro execution mode.
Possible values are:
(^0) Continuous execution: The Macro is executed n1 times
continuously at the time intervals specified by n2.
(^1) Execution by LF switch: When LF switch is pressed,
the macro is executed once.

93. (GS c) Setting the Real Time Clock

```
Code [1Dh] + [63h] + YY MM DD WW hh mm[00h]
```
```
Description YY Year without the century (00-99)
```
```
MM Month (01-12)
```
```
DD Day (01-31)
```
```
WW Day of the week (01-07)
```
```
hh Hour (00-23)
```
```
mm Minutes (00-59)
```
```
Field separator is space symbol (ASCII 32h).
Data are terminated with ASCII 00h.
```
(^) The command exists in printer versions 1.51 or newer.
The command clears the seconds!


### DATECS EP - 2000

94. (GS f) Setting the font of HRI characters of the barcode

```
Code [1Dh] + [66h] + n
```
```
Description n can be the following values:
```
```
0 Font A.
```
```
1 Font B
```
95. (GS h) Setting the height of the barcode

```
Code [1Dh] + [68h] + n
```
```
Description n is between 1 and FFh and it defines the heights of barcode in dots
(1/203 inches).
```
```
Default value: n=162.
```
96. (GS k) Printing the barcode

```
Code (1) [1Dh] + [6Bh] + m + D i + [00h] or
(2) [1Dh] + [6Bh] + m + n + D i or
```
```
(3) [1Dh] + [6Bh] + m + c + n1 + n2 + D i
```
```
Description Di The data for the barcode.
The number and possible characters depend on the type of
barcode and are defined underneath.
```
(^) n It defines the length of the data when 65 <= m <= 73..
For 2-D barcode PDF417:
(^) n1 and
n2
They define the length of the data:
N=n1+256*n2.
Max value is 1000.
(^) c It defines whether the barcode data is compressed.
Possible values are 0 or 1.


# 7

### DATECS EP - 2000

```
m It defines the type of barcode and may be:
m (1) Тип на
баркода
```
```
Дължина Допустими символи
```
```
0 UPC-A 11 48 <= Di <= 57
```
```
1 UPC-E 11 48 <= Di <= 57
```
```
2 EAN13
(JAN13)
```
```
12 48 <= Di <= 57
```
```
3 EAN 8 (JAN8) 7 48 <= Di <= 57
```
```
4 CODE 39 – 48 <= Di <= 57, 65 <= D i <= 90,
32, 36, 37, 43, 45, 46, 47
```
```
5 ITF – 48 <= Di <= 57
```
```
6 CODABAR
(NW-7)
```
- 48 <= Di <= 57, 65 <= D i <= 68,
    36, 43, 45, 46, 47, 58

```
m (2) Type of
barcode
```
```
Length Possible
characters
65 UPC-A 11 48 <= Di <= 57
66 UPC-E 11 48 <= Di <= 57
67 EAN13
(JAN13)
```
```
12 48 <= Di <= 57
```
```
68 EAN 8 (JAN8) 7 48 <= Di <= 57
69 CODE 39 – 48 <= Di <= 57, 65 <= D i <= 90,
32, 36, 37, 43, 45, 46, 47
70 ITF – 48 <= Di <= 57
71 CODABAR
(NW-7)
```
- 48 <= Di <= 57, 65 <= D i <= 68,
    36, 43, 45, 46, 47, 58
72 CODE 93 – 0 <= Di <= 127
73 CODE 128 – 0 <= Di <= 127
75 CODE 128
Auto
- 0 <= Di <= 127

```
76 EAN 128 – 0 <= Di <= 127
```

### DATECS EP - 2000

```
m (3) Type of
barcode
```
```
Length Possible
characters
```
```
74 PDF417 – 0 <= Di <= 255
```
(^) If the barcode is wider than the print area for one line, the barcode is not
printed.
Additional information for Code 128:
Code 128 covers the range of ASCII codes from 0 to 127 with the help of 3 code sets A, B and
C, which can be used in one and the same barcode.
Code set A:
Consists of characters with ASCII codes from 0 to 95 and function characters FNC1,
FNC2, FNC3, FNC4, SHIFT, CODEB, CODEC.
Code set B:
Consists of characters with ASCII codes from 32 to 127 and function characters FNC1,
FNC2, FNC3, FNC4, SHIFT, CODE А, CODEC.
Code set C:
It is used for coding sections of the barcode which consist only of digits. Each character
defines 2 digits, that are coded with ASCII code from 0 to 99. Also possible are function
characters FNC1, CODEA, CODEB.
The barcode always begins with one of the characters CODEA, CODEB or CODEC , which
defines the code set that will be used. If necessary the code set can be changed by inserting one
of these characters in the barcode. The character following SHIFT is treated as a character of
code set B if the current code set is A, and as a character of code set A if the current code set is
B. If a character unacceptable for the current code set is given then barcode is not printed.


# 7

### DATECS EP - 2000

Function characters are defined with 2 bytes as follows:

```
Character Coding
```
```
Decimal Hexadecimal Text
```
### FNC1 123, 49 7B, 31 {1

### FNC2 123, 50 7B, 32 {2

### FNC3 123, 51 7B, 33 {3

### FNC4 123, 52 7B, 34 {4

### CODEA 123, 65 7B, 41 {A

### CODEB 123, 66 7B, 42 {B

### CODEC 123, 67 7B, 43 {C

### SHIFT 123, 83 7B, 53 {S

### { 123, 123 7B, 7B {{

Code 128 Auto uses the same code sets, but the printer test the data and automatically
switches between the code sets, trying to print a minimum width barcode. Di contains only the
real data to be printed.

EAN 128 uses Code 128 code sets, but puts an FNC1 code in the beginning, and if human
readable text is enabled, the text is separated in fields (Application identifiers). If any of the fields
contains invalid data, the barcode is not printed. Code sets are switched automatically like Code
128 Auto.


### DATECS EP - 2000

97. (GS p) Setting for 2D barcode PDF417

```
Code [1Dh] + [70h] + e + c + r
```
```
Description e It is an error correction level for barcode PDF417. At value bigger
than 8 the printer chooses automatically the appropriate level
depending on the quantity of the coded data, else the defined value
is being used.
```
```
с It is the max number of columns, which the printer uses for printing
the barcode.
r It is max number of rows, which the printer uses for printing the
barcode.
```
98. (GS q) Selecting the height of the module of 2D barcode PDF417

```
Code [1Dh] + [71h] + n
```
```
Description n is between 4 and 32 including and is the height of one line from the
barcode.
By default n=18.
```
99. (GS w) Selecting the horizontal size (Scale factor) of the barcode

```
Code [1Dh] + [77h] + n
```
```
Description n is between 2 and 4 including and is the number of dots in barcode’s
fine element width.
By default n=3.
```
## 100 GS x Direct text print in page mode

```
Code [1Dh] + [78h] + xL + xH + yL + yH + sX + sY + Attr + D i + [00h]
```
```
Description The command prints a text string in page mode. It allows larger
multiplication of the symbols in comparison with the normal text printing
(more than 2).
```
```
xL and xH X coordinate of upper left corner of first letter.
```
```
yL and yH Y coordinate of upper left corner of first letter.
```
```
sX Size (multiplication) in horizontal direction.
From 1 to 16.
```

# 7

### DATECS EP - 2000

```
sY Size (multiplication) in vertical direction.
From 1 to 16.
```
```
Attr Print attributes. One byte from 0 to 255.
Each bit of Attr indicates the following:
```
```
Bit Function Value 0 Value 1
0 Font size А (12x24 or
24x24)
```
```
B (9x16 or
16x16)
1 Not used
2 Not used
3 Bold Enabled Disabled
4 Not used
5 Not used
6 Not used
7 Not used
```
```
Di Data.
Bytes with ASCII codes below 20h are ignored.
```
```
X and Y coordinates are xL+256*xH and yL+256*yH.
```
(^) The currently active page direction, country and code table are used.
From all print attributes only BOLD is used.
After every printed symbol X coordinate is automatically increased by
symbol width + character space, multiplied by sX.
If some part of the symbol is not in the selected page area, the symbol is
not printed.
The command is executed in page mode only.
The command is supported in firmware version 1.51 or higher.


### DATECS EP - 2000

Option – Asian Languages Support

101. (FS !) Specifying printing mode of two-byte text data

```
Code [1Ch] + [21h] + n
```
```
Description Data is given in binary code.
Each n bit indicates the following:
```
```
Bit Function Value 0 Value 1
0 Font size 24 x 24 16 x16
```
```
1 Undefined
2 Undefined
3 Double Height Canceled Specified
4 Double Width Canceled Specified
5 Undefined
6 Undefined
7 Undrline Canceled Specified
```
```
An underline is attached to the full character width, which, however,
is not attached to the part having been skipped by the horizontal tab.
Neither is it attached to 90°-right-turned characters.
The underline width is as having been specified by (FS -).
The default setting is 1 dot width.
If at the same time are given double height and/or double width and
90°-right-turning of character, then the sequence of execution is as
follows:
character is doubled in the direction indicated;
character is turned at 90°-right-angle
```
102. (FS &) Selecting the two-byte text mode – JIS or GB2312

```
Code [1Ch] + [26h]
```
```
Description The command selects two-byte characters mode. Depending on the
version of the printer, this may be:Each n bit indicates the following:
Japanese version: JIS character table.
First byte is between 20h and 7Fh , second byte between 00h and 7Fh.
If outside this range, one-byte ASCII characters are printed.
```

# 7

### DATECS EP - 2000

```
Chinese version: GB2312 (Simplified Chinese).
First and second bytes are between A0h and FFh.
If outside this range, one-byte ASCII characters are printed.
```
## 103 FS - Selecting/Canceling underline mode for two-byte text mode

```
Code [1Ch] + [2Dh] + n
```
```
Description An underline is attached to the full character width. It is, however, not
attached to the part having been skipped by horizontal tab command.
An underline is not attached to 90°- right-turned characters.
The following values of n are possible:
0 or 30h Canceling an underline.
1 or 31h Specifying an underline of 1-dot width.
2 or 32h Specifying an underline of 2-dots width.
```
104. (FS .) Cancelling the two-byte text mode

```
Code [1Ch] + [2Eh]
```
```
Description The command cancels two-byte characters mode
(JIS or GB2312 depending on the version).
For Japanese version only:
If Shift-JIS character mode was selected before using FS C command,
then the printer returns to Shift-JIS mode instead to one byte ASCII text
mode.
```
## 105 FS C Selecting Shift-JIS mode (Japanese version only)

```
Code [1Ch] + [43h] + n
```
```
Description The command selects/cancels two-byte characters mode Shift-JIS.^
It is supported only in Japanese version of the printer. First byte is
between 80h and 9Fh or between E0h and FFh , second byte between
40h and FFh. If outside this range, one-byte ASCII characters are
printed.
If both JIS and Shift-JIS modes are selected, the Shift-JIS mode is
active.
The following values of n are possible:
0 or 30h Canceling two-byte Shift-JIS mode.
1 or 31h Specifying two-byte Shift-JIS mode.
```

### DATECS EP - 2000

## 106 FS S Specifying character spacing for two-byte text mode

```
Code [1Ch] + [53h] + n1 +n2
```
```
Description The command sets the leftward and rightward space amount for two-byte
character mode.
```
```
n1 It specifies leftward space.
n2 It specifies rightward space.
```
(^) The space amount is set in dot unit (1/203 inch unit).
The initial values are n1 =0 and n2 =0.
When the font size is doubled the space between characters is also
doubled. Possible values are from 0 to 63 dots.

## 107 FS W Selecting double size characters for two-byte text mode

```
Code [1Ch] + [57h] + n
```
```
Description The following values of n are possible:
```
(^0) or 30h Canceling double size characters.
(^1) or 31h Specifying double size characters.
Double size characters may be selected using command FS.


