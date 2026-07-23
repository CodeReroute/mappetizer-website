'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import styles from './DeepLinkLanding.module.scss';
import { assetUrl } from '../utils';
import SocialMedia from '../SocialMedia';

export type DeepLinkType = 'user' | 'restaurant' | 'teaser';

const TYPE_LABELS: Record<DeepLinkType, string> = {
  user: 'profile',
  restaurant: 'restaurant',
  teaser: 'teaser',
};

const OPEN_APP_TIMEOUT_MS = 2000;

const IOS_STORE_URL = 'https://apps.apple.com/app/id0000000000';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.mappetizer.app';

type Platform = 'ios' | 'android' | 'web';

type DeepLinkLandingProps = {
  type: DeepLinkType;
  id: string;
};

const DeepLinkLanding: React.FC<DeepLinkLandingProps> = ({ type, id }) => {
  const [platform, setPlatform] = useState<Platform>('web');
  const [shareUrl, setShareUrl] = useState('');
  const [appMissing, setAppMissing] = useState(false);

  const label = TYPE_LABELS[type];
  const deepLink = useMemo(
    () => `myapp://${type}/${encodeURIComponent(id)}`,
    [type, id],
  );
  const storeUrl = platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
  const isMobileDevice = platform !== 'web';
  const primaryHref = isMobileDevice && appMissing ? storeUrl : deepLink;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(window.location.href);

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'web');
  }, []);

  useEffect(() => {
    if (platform === 'web' || !id) return;

    let didLeavePage = false;

    const markAppOpened = () => {
      didLeavePage = true;
    };

    const onVisibilityChange = () => {
      if (document.hidden) markAppOpened();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', markAppOpened);
    window.addEventListener('blur', markAppOpened);

    window.location.href = deepLink;

    const fallbackTimer = setTimeout(() => {
      if (didLeavePage || document.hidden) return;
      setAppMissing(true);
    }, OPEN_APP_TIMEOUT_MS);

    return () => {
      clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', markAppOpened);
      window.removeEventListener('blur', markAppOpened);
    };
  }, [deepLink, id, platform]);

  return (
    <div className={styles.hero}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={styles.videoBackground}
      >
        <source src={assetUrl('/video.webm')} type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <SocialMedia />

      <div className={styles.content}>
        <Image
          className={styles.logo}
          src={assetUrl('/images/logo.png')}
          alt="Mappetizer"
          title="Mappetizer"
          width={180}
          height={24}
          priority
        />

        {/* Phone layout */}
        <div className={styles.mobilePanel}>
          <h1 className={styles.heading}>Open in Mappetizer</h1>
          <p className={styles.copy}>
            {appMissing
              ? `The app does not appear to be installed. Tap below to get it from the store and view this ${label}.`
              : `Open this ${label} in the app. If nothing happens, tap below.`}
          </p>
          <a className={styles.cta} href={primaryHref}>
            Open in Mappetizer
          </a>
        </div>

        {/* Desktop layout */}
        <div className={styles.desktopPanel}>
          <h1 className={styles.heading}>Open in the Mappetizer app</h1>
          <p className={styles.copy}>
            Scan the QR code on your phone to open this {label} in the app.
          </p>
          {shareUrl && (
            <div className={styles.qrContainer}>
              <div className={styles.qrCard}>
                <QRCode value={shareUrl} size={180} />
              </div>
              <p className={styles.shareUrl}>Scan to open the app</p>
            </div>
          )}
          <div className={styles.storeLinks}>
            <a
              className={styles.cta}
              href={IOS_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download on the App Store
            </a>
            <a
              className={styles.cta}
              href={ANDROID_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get it on Google Play
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepLinkLanding;
