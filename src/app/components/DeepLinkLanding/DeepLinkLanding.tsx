'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import styles from './DeepLinkLanding.module.scss';
import { assetUrl } from '../utils';
import Footer from '../../newsletter/beta-testers/Footer';

export type DeepLinkType = 'user' | 'restaurant' | 'teaser';

const TYPE_LABELS: Record<DeepLinkType, string> = {
  user: 'profile',
  restaurant: 'restaurant',
  teaser: 'teaser',
};

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
  const [triedOpen, setTriedOpen] = useState(false);

  const label = TYPE_LABELS[type];
  const deepLink = useMemo(
    () => `mappetizer://${type}/${encodeURIComponent(id)}`,
    [type, id],
  );
  const storeUrl = platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    const ua =
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const currentPlatform: Platform = isIOS
      ? 'ios'
      : isAndroid
        ? 'android'
        : 'web';
    setPlatform(currentPlatform);

    if (currentPlatform === 'web' || !id) return;

    // Try opening the app; if it is not installed the store fallback runs shortly after.
    const fallbackTimer = setTimeout(() => {
      setTriedOpen(true);
      window.location.href = currentPlatform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
    }, 1800);

    window.location.href = deepLink;

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(fallbackTimer);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [deepLink, id]);

  const openApp = () => {
    window.location.href = deepLink;
  };

  return (
    <>
      <div className={styles.header}>
        <Image
          className={styles.logo}
          src={assetUrl('/images/logo.png')}
          alt="Mappetizer"
          title="Mappetizer"
          placeholder="blur"
          blurDataURL={assetUrl('/images/logo_optimized.png')}
          width={150}
          height={40}
        />
      </div>
      <div className={styles['main-container']}>
        <div className={styles['form-container']}>
          {platform === 'web' ? (
            <>
              <h1 className={styles['main-heading']}>Open in the Mappetizer app</h1>
              <p className={styles['sub-heading']}>
                Scan the QR code on your phone to view this {label}. If you do
                not have the app yet, you will be asked to install it.
              </p>
              {shareUrl && (
                <div className={styles['qr-container']}>
                  <QRCode value={shareUrl} size={200} />
                  <p className={styles['share-url']}>
                    Scan to open or download the app
                  </p>
                </div>
              )}
              <div className={styles['store-links']}>
                <a
                  className={styles['submit-button']}
                  href={IOS_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download on the App Store
                </a>
                <a
                  className={styles['submit-button']}
                  href={ANDROID_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get it on Google Play
                </a>
              </div>
            </>
          ) : (
            <>
              <h1 className={styles['main-heading']}>
                {triedOpen ? 'Install Mappetizer' : 'Open in Mappetizer'}
              </h1>
              <p className={styles['sub-heading']}>
                {triedOpen
                  ? `It looks like the app is not installed. Download Mappetizer to view this ${label}.`
                  : `Opening this ${label} in the app. If nothing happens, open the app or install it below.`}
              </p>
              <div className={styles['actions']}>
                <button
                  type="button"
                  className={styles['submit-button']}
                  onClick={openApp}
                >
                  Open in App
                </button>
                <a
                  className={`${styles['submit-button']} ${styles['secondary-button']}`}
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {platform === 'ios'
                    ? 'Download on the App Store'
                    : 'Get it on Google Play'}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DeepLinkLanding;
