// Thermal Printer Ticket Template
// Print width: 78mm (approximately 576 pixels for thermal printers)
// This template follows the Citizen ST-S2010 thermal printer specifications

export interface TicketData {
  orderType: 'ДОСТАВКА' | 'ВЗЕМАНЕ';
  customerName: string;
  address: string;
  phone: string;
  specialInstructions?: string;
  items: Array<{
    quantity: number;
    name: string;
    price: number;
    addons?: string[];
    noSalad?: boolean;
    noSauce?: boolean;
    extraCheese?: boolean;
    comment?: string;
  }>;
  subtotal: number;
  serviceCharge: number;
  deliveryCharge: number;
  total: number;
  isPaid: boolean;
  paymentMethod: string;
  placedTime: string;
  deliveryTime: string;
  orderId: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
}

export function generateTicketHTML(data: TicketData): string {
  const itemsHTML = data.items.map(item => {
    let itemHTML = `
      <div class="item">
        <div class="item-line">
          <span class="quantity">${item.quantity}x</span>
          <span class="item-name">${item.name}</span>
          <span class="item-price">${item.price.toFixed(2)} лв</span>
        </div>
    `;
    
    // Add customizations/addons
    const customizations: string[] = [];
    if (item.addons && item.addons.length > 0) {
      customizations.push(...item.addons);
    }
    if (item.noSalad) customizations.push('Без Салата');
    if (item.noSauce) customizations.push('Без Сос');
    if (item.extraCheese) customizations.push('Екстра Сирене');
    
    if (customizations.length > 0) {
      itemHTML += `
        <div class="customizations">
          » ${customizations.join(' » ')}
        </div>
      `;
    }
    
    if (item.comment) {
      itemHTML += `
        <div class="comment">
           ${item.comment}
        </div>
      `;
    }
    
    itemHTML += `</div>`;
    return itemHTML;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Поръчка #${data.orderId} - ${data.restaurantName}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10mm;
      background: white;
      color: black;
      font-size: 12pt;
      line-height: 1.4;
    }
    
    .ticket {
      width: 100%;
    }
    
    .header {
      text-align: center;
      font-weight: bold;
      font-size: 16pt;
      margin-bottom: 8px;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
    }
    
    .customer-info {
      margin: 10px 0;
      font-size: 11pt;
    }
    
    .customer-info div {
      margin: 3px 0;
    }
    
    .customer-name {
      font-weight: bold;
      font-size: 12pt;
    }
    
    .special-instructions {
      margin-top: 5px;
      font-size: 10pt;
      font-style: italic;
      background: #fffacd;
      padding: 4px;
      border-radius: 3px;
    }
    
    .separator {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    
    .items {
      margin: 10px 0;
    }
    
    .item {
      margin: 8px 0;
    }
    
    .item-line {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    
    .quantity {
      flex: 0 0 auto;
      margin-right: 5px;
    }
    
    .item-name {
      flex: 1;
    }
    
    .item-price {
      flex: 0 0 auto;
      margin-left: 10px;
      text-align: right;
    }
    
    .customizations {
      font-size: 10pt;
      margin-left: 15px;
      margin-top: 2px;
      font-weight: normal;
    }
    
    .comment {
      font-size: 10pt;
      margin-left: 15px;
      margin-top: 2px;
      font-weight: normal;
      font-style: italic;
      background: #f0f0f0;
      padding: 3px;
      border-radius: 3px;
    }
    
    .gift-item {
      background: #fffacd;
      padding: 3px;
      border-radius: 3px;
      font-weight: bold;
    }
    
    .totals {
      margin: 10px 0;
      border-top: 1px dashed #000;
      padding-top: 8px;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    
    .total-line.final {
      font-weight: bold;
      font-size: 13pt;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 5px 0;
      margin-top: 8px;
    }
    
    .payment-status {
      text-align: center;
      font-weight: bold;
      font-size: 18pt;
      margin: 10px 0;
      letter-spacing: 2px;
    }
    
    .payment-method {
      text-align: center;
      font-size: 11pt;
      margin: 5px 0;
      font-weight: normal;
    }
    
    .order-times {
      margin: 10px 0;
      font-size: 11pt;
    }
    
    .order-times div {
      margin: 3px 0;
    }
    
    .footer {
      margin-top: 15px;
      border-top: 2px dashed #000;
      padding-top: 8px;
      text-align: center;
      font-size: 9pt;
    }
    
    .restaurant-info {
      margin: 5px 0;
    }
    
    .powered-by {
      margin-top: 10px;
      font-weight: bold;
    }
    
    .order-number {
      text-align: center;
      font-size: 24pt;
      font-weight: bold;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      ${data.orderType}
    </div>
    
    <div class="customer-info">
      <div class="customer-name">${data.customerName}</div>
      <div>${data.address}</div>
      <div>${data.phone}</div>
      ${data.specialInstructions ? `<div class="special-instructions">${data.specialInstructions}</div>` : ''}
    </div>
    
    <div class="separator"></div>
    
    <div class="items">
      ${itemsHTML}
    </div>
    
    <div class="totals">
      <div class="total-line">
        <span>МЕЖДИННА СУМА</span>
        <span>${data.subtotal.toFixed(2)} лв</span>
      </div>
      <div class="total-line">
        <span>ТАКСА ОБСЛУЖВАНЕ</span>
        <span>${data.serviceCharge.toFixed(2)} лв</span>
      </div>
      <div class="total-line">
        <span>ДОСТАВКА</span>
        <span>${data.deliveryCharge.toFixed(2)} лв</span>
      </div>
      <div class="total-line final">
        <span>ОБЩО</span>
        <span>${data.total.toFixed(2)} лв</span>
      </div>
    </div>
    
    <div class="payment-status">
      ${data.isPaid ? 'ПЛАТЕНО' : 'НЕПЛАТЕНО'}
    </div>
    
    <div class="payment-method">
      Метод на плащане: ${data.paymentMethod}
    </div>
    
    <div class="order-times">
      <div>Поръчана: ${data.placedTime}</div>
      <div>Доставка до: ${data.deliveryTime}</div>
      <div>Поръчана чрез: Онлайн - Мобилно приложение</div>
    </div>
    
    <div class="footer">
      <div class="separator"></div>
      <div class="restaurant-info">
        ${data.restaurantName}
      </div>
      <div class="restaurant-info">
        ${data.restaurantAddress}
      </div>
      <div class="restaurant-info">
        ${data.restaurantPhone}
      </div>
      <div class="separator"></div>
      <div class="powered-by">
       Powered by H&M WS Pro
      </div>
      <div class="order-number">
        ${data.orderId}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function downloadTicket(data: TicketData, format: 'html' | 'print' = 'html') {
  const html = generateTicketHTML(data);
  
  if (format === 'print') {
    // Open in new window and trigger print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } else {
    // Download as HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${data.orderId}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Future: Thermal printer integration
// This function will be used when integrating with actual thermal printer
// Printer specs: Citizen ST-S2010, 78mm width, thermal direct printing
// Communication: RS-232C, USB, or LAN
// Supported formats: QR codes, barcodes (ITF, Data Matrix, PDF417, EAN-13, etc.)
export async function sendToThermalPrinter(data: TicketData): Promise<boolean> {
  try {
    // TODO: Implement thermal printer integration
    // 
    // Integration options:
    // 1. Direct connection via USB/Serial (requires backend service)
    //    - Use ESC/POS commands for formatting
    //    - Send raw bytes to printer device
    //    - Example endpoint: POST /api/printer/order with orderData
    //
    // 2. Network printer (LAN)
    //    - Send formatted data to printer IP address
    //    - Use printer's native protocol
    //
    // 3. Print server/cloud service
    //    - Send data to intermediate print server
    //    - Server handles device communication
    //
    // For now, use browser print dialog as fallback
    downloadTicket(data, 'print');
    return true;
  } catch (error) {
    console.error('Error sending to thermal printer:', error);
    return false;
  }
}

