// Thermal Printer Ticket Template
// Print width: 78mm (approximately 576 pixels for thermal printers)
// This template follows the Citizen ST-S2010 thermal printer specifications

export interface TicketData {
  orderType: 'ДОСТАВКА' | 'ВЗЕМАНЕ';
  customerName: string;
  address: string;
  phone: string;
  specialInstructions?: string;
  addressInstructions?: string;
  comments?: string;
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
      font-size: 18pt;
      border-top: 3px solid #000;
      border-bottom: 3px solid #000;
      padding: 10px 0;
      margin-top: 12px;
      letter-spacing: 1px;
      background: #f0f0f0;
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
      ${data.comments ? `<div class="comments">Коментар: ${data.comments}</div>` : ''}
      <div>${data.phone}</div>
      ${data.addressInstructions ? `<div class="special-instructions">Адрес: ${data.addressInstructions}</div>` : ''}
      ${data.specialInstructions ? `<div class="special-instructions">Инструкции: ${data.specialInstructions}</div>` : ''}
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

/**
 * Send ticket to thermal printer
 * 
 * This function attempts to print using available methods:
 * 1. Network printer (if configured)
 * 2. USB printer via print server (if running)
 * 3. Browser print dialog (fallback)
 * 
 * @param data - Ticket data to print
 * @returns Promise<boolean> - Success status
 */
export async function sendToThermalPrinter(data: TicketData): Promise<boolean> {
  try {
    // Try network printer first (if IP is configured)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PRINTER_IP) {
      try {
        const { printToNetworkPrinter } = await import('./printerService');
        const success = await printToNetworkPrinter(data);
        if (success) {
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Network printer failed, trying USB print server...', error);
      }
    }
    
    // Try USB print server (localhost:3001)
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('http://localhost:3001/print', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticketData: data }),
        });
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn('⚠️ USB print server not available, falling back to browser print...', error);
      }
    }
    
    // Fallback to browser print dialog
    downloadTicket(data, 'print');
    return true;
  } catch (error) {
    // Still try browser print as last resort
    downloadTicket(data, 'print');
    return false;
  }
}

