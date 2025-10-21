'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on kitchen and delivery pages
<<<<<<< HEAD
  const hideFooterPages = ['/kitchen', '/delivery', '/administraciq', '/admin-delivery-login', '/admin-kitchen-login'];
=======
  const hideFooterPages = ['/kitchen', '/delivery', '/admin', '/admin-delivery-login', '/admin-kitchen-login', '/printer'];
>>>>>>> origin/main
  
  const shouldHideFooter = hideFooterPages.some(page => pathname.startsWith(page));
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}

