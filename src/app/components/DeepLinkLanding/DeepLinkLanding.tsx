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

// Flip to true after the app is published. Never auto-redirect to the store.
const SHOW_GET_THE_APP = false;
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

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'web');
  }, []);

  useEffect(() => {
    if (platform === 'web' || !id) return;

    // Development behavior: only open the custom scheme. No App Store redirect.
    window.location.href = deepLink;
  }, [deepLink, id, platform]);

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
                  <p className={styles['share-url']}>Scan to open the app</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className={styles['main-heading']}>Open in Mappetizer</h1>
              <p className={styles['sub-heading']}>
                Opening this {label} in the app. If nothing happens, tap the
                button below.
              </p>
              <div className={styles['actions']}>
                <a className={styles['submit-button']} href={deepLink}>
                  Open in Mappetizer
                </a>
                {SHOW_GET_THE_APP && (
                  <a
                    className={`${styles['submit-button']} ${styles['secondary-button']}`}
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get the app
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
