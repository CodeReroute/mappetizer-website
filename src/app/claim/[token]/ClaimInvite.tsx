'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { assetUrl } from '../../components/utils';
import styles from './ClaimInvite.module.scss';
import {
  ANDROID_STORE_URL,
  IOS_STORE_URL,
  bindInvitePhone,
  createAccount,
  generateLoginCode,
  getInvitePreview,
  messageFromBody,
  redeemInvite,
  toE164,
  verifyLoginCode,
  type InvitePreview,
} from '../../components/utils/restaurantInviteApi';

type Platform = 'ios' | 'android' | 'web';
type Step = 'loading' | 'welcome' | 'phone' | 'code' | 'profile' | 'success' | 'unavailable';
type PhoneIntent = 'auth' | 'bind';

const COUNTRY_CODES = [
  { label: 'United States +1', dial: '1' },
  { label: 'Canada +1', dial: '1' },
  { label: 'United Kingdom +44', dial: '44' },
  { label: 'Pakistan +92', dial: '92' },
  { label: 'India +91', dial: '91' },
  { label: 'UAE +971', dial: '971' },
  { label: 'Australia +61', dial: '61' },
];

const ClaimInvite: React.FC<{ token: string }> = ({ token }) => {
  const [platform, setPlatform] = useState<Platform>('web');
  const [shareUrl, setShareUrl] = useState('');
  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [dialCode, setDialCode] = useState('1');
  const [nationalNumber, setNationalNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneIntent, setPhoneIntent] = useState<PhoneIntent>('auth');
  const [sessionToken, setSessionToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [addedName, setAddedName] = useState('');
  const [phoneBound, setPhoneBound] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else if (/Android/i.test(ua)) setPlatform('android');
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getInvitePreview(token)
      .then(result => {
        if (cancelled) return;
        if (result.status === 404) {
          setError(messageFromBody(result.data) || 'This invite could not be found.');
          setStep('unavailable');
          return;
        }
        if (result.status !== 200 || !result.data.restaurantName) {
          setError(messageFromBody(result.data) || 'Unable to load this invite.');
          setStep('unavailable');
          return;
        }
        setPreview(result.data);
        setStep('welcome');
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load this invite.');
        setStep('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openStore = (target: Platform) => {
    const url = target === 'android' ? ANDROID_STORE_URL : IOS_STORE_URL;
    window.location.href = url;
  };

  const startDownload = (target: Platform) => {
    if (sessionToken || step === 'success') {
      openStore(target);
      return;
    }
    setPhoneIntent('bind');
    setError('');
    setStep('phone');
  };

  const startAuth = () => {
    if (preview?.expired || preview?.used) return;
    setPhoneIntent('auth');
    setError('');
    setStep('phone');
  };

  const submitPhone = async () => {
    const nextPhone = toE164(dialCode, nationalNumber);
    if (!nextPhone) {
      setError('Enter a valid phone number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (phoneIntent === 'bind') {
        const result = await bindInvitePhone(token, nextPhone);
        if (result.status >= 400) {
          setError(messageFromBody(result.data) || 'Unable to save this phone number.');
          return;
        }
        setPhone(nextPhone);
        setPhoneBound(true);
        if (platform === 'web') {
          setStep('welcome');
          return;
        }
        openStore(platform);
        return;
      }

      const result = await generateLoginCode(nextPhone);
      if (result.status >= 400) {
        setError(messageFromBody(result.data) || 'Unable to send a code.');
        return;
      }
      setPhone(nextPhone);
      setStep('code');
    } catch {
      setError('Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const finishRedeem = async (authToken: string, fallbackName: string) => {
    const result = await redeemInvite(token, authToken);
    if (result.status >= 400) {
      setError(
        messageFromBody(result.data) ||
          (result.status === 410
            ? 'This invite has expired.'
            : result.status === 409
              ? 'This invite can no longer be used.'
              : 'Unable to add this restaurant.'),
      );
      return;
    }
    setAddedName(result.data.restaurantName || fallbackName);
    setStep('success');
  };

  const submitCode = async () => {
    const otp = code.replace(/\D/g, '');
    if (otp.length < 4) {
      setError('Enter the code from the text message.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await verifyLoginCode(phone, otp);
      if (result.status === 422) {
        setStep('profile');
        return;
      }
      if (result.status >= 400 || !result.data.token) {
        setError(messageFromBody(result.data) || 'That code could not be verified.');
        return;
      }
      setSessionToken(result.data.token);
      await finishRedeem(result.data.token, preview?.restaurantName || 'This restaurant');
    } catch {
      setError('Unable to verify the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async () => {
    if (firstName.trim().length < 3 || lastName.trim().length < 3 || !dateOfBirth) {
      setError('Enter your first name, last name, and date of birth.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await createAccount({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone,
        dateOfBirth,
        profilePicture,
      });
      if (result.status >= 400 || !result.data.token) {
        setError(messageFromBody(result.data) || 'Unable to create the account.');
        return;
      }
      setSessionToken(result.data.token);
      await finishRedeem(result.data.token, preview?.restaurantName || 'This restaurant');
    } catch {
      setError('Unable to create the account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const restaurantName = addedName || preview?.restaurantName || 'This restaurant';
  const blocked = Boolean(preview?.expired || preview?.used);

  return (
    <div className={styles.page}>
      <video autoPlay loop muted playsInline className={styles.videoBackground}>
        <source src={assetUrl('/video.webm')} type="video/webm" />
      </video>

      <header className={styles.topBar}>
        <p>Download the app</p>
        <div className={styles.storeRow}>
          {platform !== 'android' && (
            <button type="button" onClick={() => startDownload('ios')}>
              App Store
            </button>
          )}
          {platform !== 'ios' && (
            <button type="button" onClick={() => startDownload('android')}>
              Google Play
            </button>
          )}
        </div>
      </header>

      <main className={styles.card}>
        <Image
          className={styles.logo}
          src={assetUrl('/images/logo.png')}
          alt="Mappetizer"
          width={160}
          height={22}
          priority
        />

        {step === 'loading' && <p className={styles.copy}>Loading the restaurant…</p>}

        {step === 'unavailable' && (
          <>
            <h1 className={styles.heading}>Invite unavailable</h1>
            <p className={styles.copy}>{error}</p>
          </>
        )}

        {preview && step !== 'unavailable' && step !== 'success' && (
          <div className={styles.restaurant}>
            {preview.profileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.profileUrl} alt="" className={styles.photo} />
            ) : null}
            <h1 className={styles.heading}>{preview.restaurantName}</h1>
          </div>
        )}

        {step === 'welcome' && preview && (
          <>
            {phoneBound ? (
              <p className={styles.copy}>
                This number is saved. Download the app and log in with it.
              </p>
            ) : null}
            {blocked ? (
              <p className={styles.copy}>
                {preview.expired
                  ? 'This invite has expired.'
                  : 'This invite has already been used.'}
              </p>
            ) : (
              <>
                <p className={styles.copy}>
                  Sign up or log in with the phone number you will use in the app.
                </p>
                <button type="button" className={styles.primary} onClick={startAuth}>
                  Sign up
                </button>
                <button type="button" className={styles.secondary} onClick={startAuth}>
                  Login
                </button>
              </>
            )}
          </>
        )}

        {step === 'phone' && (
          <>
            <h2 className={styles.subheading}>
              {phoneIntent === 'bind'
                ? 'Enter the phone number you will use in the app'
                : 'Enter your phone number'}
            </h2>
            <label className={styles.field}>
              Country
              <select value={dialCode} onChange={event => setDialCode(event.target.value)}>
                {COUNTRY_CODES.map(country => (
                  <option key={country.label} value={country.dial}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Phone number
              <input
                inputMode="tel"
                autoComplete="tel"
                value={nationalNumber}
                onChange={event => setNationalNumber(event.target.value)}
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.primary} disabled={busy} onClick={submitPhone}>
              {phoneIntent === 'bind' ? 'Continue to download' : 'Send code'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className={styles.subheading}>Enter the code</h2>
            <p className={styles.copy}>We sent a code to {phone}.</p>
            <label className={styles.field}>
              Code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => setCode(event.target.value)}
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.primary} disabled={busy} onClick={submitCode}>
              Verify
            </button>
          </>
        )}

        {step === 'profile' && (
          <>
            <h2 className={styles.subheading}>Enter your details</h2>
            <label className={styles.field}>
              First name
              <input value={firstName} onChange={event => setFirstName(event.target.value)} />
            </label>
            <label className={styles.field}>
              Last name
              <input value={lastName} onChange={event => setLastName(event.target.value)} />
            </label>
            <label className={styles.field}>
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={event => setDateOfBirth(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              Profile photo
              <input
                type="file"
                accept="image/*"
                onChange={event => setProfilePicture(event.target.files?.[0] || null)}
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.primary} disabled={busy} onClick={submitProfile}>
              Create account
            </button>
          </>
        )}

        {step === 'success' && (
          <>
            <h1 className={styles.heading}>{restaurantName} is added to your account.</h1>
            <p className={styles.copy}>Log in with this number in the app.</p>
            <a className={styles.primary} href={IOS_STORE_URL}>
              Download on the App Store
            </a>
            <a className={styles.secondary} href={ANDROID_STORE_URL}>
              Get it on Google Play
            </a>
          </>
        )}

        {platform === 'web' && shareUrl && step !== 'loading' && (
          <div className={styles.qr}>
            <div className={styles.qrCard}>
              <QRCode value={shareUrl} size={148} />
            </div>
            <p className={styles.copy}>Scan to open this invite on your phone.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClaimInvite;
