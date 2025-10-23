'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on kitchen, delivery, printer and admin pages

  const hideFooterPages = ['/kitchen', '/delivery', '/printer', '/administraciq', '/admin-delivery-login', '/admin-kitchen-login'];

  
  const shouldHideFooter = hideFooterPages.some(page => pathname.startsWith(page));
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}

