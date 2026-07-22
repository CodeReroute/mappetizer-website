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

// Set to true once the app is published on the stores.
const STORE_LINKS_ENABLED = false;
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

    // On mobile, try opening the installed app (including debug builds).
    // Do not auto-redirect to the store while the app is still in development.
    if (currentPlatform === 'web' || !id) return;

    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 300);

    return () => clearTimeout(timer);
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
                Scan the QR code on your phone to open this {label} in the app.
              </p>
              {shareUrl && (
                <div className={styles['qr-container']}>
                  <QRCode value={shareUrl} size={200} />
                  <p className={styles['share-url']}>
                    Scan to open the app
                  </p>
                </div>
              )}
              {STORE_LINKS_ENABLED && (
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
              )}
            </>
          ) : (
            <>
              <h1 className={styles['main-heading']}>Open in Mappetizer</h1>
              <p className={styles['sub-heading']}>
                Tap below to open this {label} in the app. Make sure Mappetizer
                is installed on this phone.
              </p>
              <div className={styles['actions']}>
                <button
                  type="button"
                  className={styles['submit-button']}
                  onClick={openApp}
                >
                  Open in App
                </button>
                {STORE_LINKS_ENABLED && (
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
                )}
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
