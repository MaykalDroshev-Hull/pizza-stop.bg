'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function ConditionalNavBar() {
  const pathname = usePathname();
  
  // Don't show navbar on admin pages
  const hideNavbarPages = ['/kitchen', '/delivery', '/admin', '/admin-delivery-login', '/admin-kitchen-login', '/printer'];
  
  const shouldHideNavbar = hideNavbarPages.some(page => pathname.startsWith(page));
  
  if (shouldHideNavbar) {
    return null;
  }
  
  return <NavBar />;
}
