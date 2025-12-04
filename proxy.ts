import { NextRequest, NextResponse } from 'next/server';

export default function proxy(req: NextRequest) {
  // Passthrough proxy
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
