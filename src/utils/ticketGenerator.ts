// Helper functions to convert kitchen order data to ticket format
import { TicketData, downloadTicket, sendToThermalPrinter } from './ticketTemplate';

interface KitchenOrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations: string[];
  comment?: string;
}

interface KitchenOrder {
  id: number;
  customerName: string;
  customerEmail: string;
  address: string;
  phone: string;
  items: KitchenOrderItem[];
  totalPrice: number;
  deliveryPrice: number;
  status: string;
  orderTime: Date;
  expectedTime: Date | null;
  readyTime: Date | null;
  workingStartTime: Date | null;
  completedTime: Date | null;
  estimatedTime: number;
  specialInstructions: string;
  comments: string | null;
  addressInstructions?: string | null;
  isPaid: boolean;
  orderStatusId: number;
  orderType: number; // 1 = Restaurant collection, 2 = Delivery
}

export function convertOrderToTicketData(order: KitchenOrder): TicketData {
  // Determine if it's delivery or pickup
  const orderType = order.orderType === 2 ? 'ДОСТАВКА' : 'ВЗЕМАНЕ';
  
  // Convert items
  const ticketItems = order.items.map(item => {
    // Parse customizations to extract specific flags
    const addons: string[] = [];
    let noSalad = false;
    let noSauce = false;
    let extraCheese = false;
    
    item.customizations.forEach(custom => {
      const lowerCustom = custom.toLowerCase();
      if (lowerCustom.includes('no salad') || lowerCustom.includes('без салата')) {
        noSalad = true;
      } else if (lowerCustom.includes('no sauce') || lowerCustom.includes('без сос')) {
        noSauce = true;
      } else if (lowerCustom.includes('extra cheese') || lowerCustom.includes('екстра сирене')) {
        extraCheese = true;
      } else {
        addons.push(custom);
      }
    });
    
    return {
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      addons: addons.length > 0 ? addons : undefined,
      noSalad,
      noSauce,
      extraCheese,
      comment: item.comment
    };
  });
  
  // Calculate charges
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = 0.00; // Service charge if applicable
  const deliveryCharge = order.deliveryPrice || 0; // Use actual delivery price from order
  const subtotal = itemsTotal;
  // Calculate total: subtotal + service charge + delivery charge
  const total = subtotal + serviceCharge + deliveryCharge;
  
  // Format times
  const placedTime = formatDateTime(order.orderTime);
  const deliveryTime = order.expectedTime 
    ? formatDateTime(order.expectedTime)
    : formatDateTime(new Date(order.orderTime.getTime() + 60 * 60 * 1000)); // Default: 1 hour from order time
  
  // Determine payment method based on order data
  // Note: You may need to adjust this based on your actual payment method structure
  const paymentMethod = order.isPaid ? 'Онлайн' : 'В брой/Карта при доставка';
  
  return {
    orderType,
    customerName: order.customerName,
    address: order.address,
    phone: order.phone,
    specialInstructions: order.comments || undefined, // Use Comments field for order-specific instructions
    addressInstructions: order.specialInstructions || undefined, // Use specialInstructions field for address-specific instructions (contains user's addressInstructions)
    items: ticketItems,
    subtotal,
    serviceCharge,
    deliveryCharge,
    total,
    isPaid: order.isPaid,
    paymentMethod,
    placedTime,
    deliveryTime,
    orderId: order.id,
    restaurantName: 'Pizza Stop',
    restaurantAddress: 'гр. Ловеч, ул. Ангел Кънчев 10',
    restaurantPhone: '068 670 070'
  };
}

function formatDateTime(date: Date): string {
  // Format: DD.MM.YYYY HH:MM (Bulgarian format)
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function printOrderTicket(order: KitchenOrder, usePrinter: boolean = false) {
  const ticketData = convertOrderToTicketData(order);
  
  if (usePrinter) {
    // Use thermal printer (for future integration)
    sendToThermalPrinter(ticketData);
  } else {
    // Download/print as HTML (current implementation)
    downloadTicket(ticketData, 'print');
  }
}

export function downloadOrderTicket(order: KitchenOrder) {
  const ticketData = convertOrderToTicketData(order);
  downloadTicket(ticketData, 'html');
}

