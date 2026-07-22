'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DeepLinkLanding, {
  type DeepLinkType,
} from './components/DeepLinkLanding/DeepLinkLanding';

const ALLOWED_TYPES = new Set<DeepLinkType>(['user', 'restaurant', 'teaser']);

type DeepLinkMatch = {
  type: DeepLinkType;
  id: string;
};

function parseDeepLinkPath(pathname: string): DeepLinkMatch | null {
  const match = pathname.match(/^\/(user|restaurant|teaser)\/([^/]+)\/?$/);
  if (!match) return null;

  const type = match[1] as DeepLinkType;
  const id = decodeURIComponent(match[2] || '').trim();
  if (!ALLOWED_TYPES.has(type) || !id) return null;

  return { type, id };
}

export default function NotFound() {
  const [deepLink, setDeepLink] = useState<DeepLinkMatch | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDeepLink(parseDeepLinkPath(window.location.pathname));
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (deepLink) {
    return <DeepLinkLanding type={deepLink.type} id={deepLink.id} />;
  }

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Go home</Link>
    </main>
  );
}
