/**
 * x403 Authentication Hook
 * Based on SnekFi's clean implementation
 * 
 * Handles automatic x403 verification after wallet connection
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { signChallenge, encodeAuthHeader, type AuthChallenge, type AuthRequiredResponse } from '@/lib/x403/client';

const X403_SESSION_TOKEN_KEY = 'x403SessionToken';
const X403_SESSION_EXPIRY_KEY = 'x403SessionExpiry';
const X403_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export function useX403Auth() {
  const wallet = useWallet();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChallenge, setAuthChallenge] = useState<AuthChallenge | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAuthCallback, setPendingAuthCallback] = useState<(() => void) | null>(null);

  // Load session token from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedToken = localStorage.getItem(X403_SESSION_TOKEN_KEY);
    if (storedToken) {
      setSessionToken(storedToken);
      console.log('✅ x403: Session token loaded from localStorage');
    }
  }, []);

  // Clear session when wallet disconnects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!wallet.connected) {
      setSessionToken(null);
      localStorage.removeItem(X403_SESSION_TOKEN_KEY);
      localStorage.removeItem(X403_SESSION_EXPIRY_KEY);
      console.log('🧹 x403: Session cleared (wallet disconnected)');
    }
  }, [wallet.connected]);

  // Main authentication function
  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!wallet.connected || !wallet.publicKey) {
      console.log('⚠️ x403: Wallet not connected');
      return null;
    }

    if (typeof window === 'undefined') {
      console.log('⚠️ x403: Not in browser environment');
      return null;
    }

    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    // Check if we have a valid session token
    const storedToken = localStorage.getItem(X403_SESSION_TOKEN_KEY);
    const storedExpiry = localStorage.getItem(X403_SESSION_EXPIRY_KEY);

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      
      if (Date.now() < expiryTime) {
        console.log('✅ x403: Using existing session token');
        setSessionToken(storedToken);
        return storedToken;
      } else {
        console.log('⏰ x403: Session expired, need new signature');
        localStorage.removeItem(X403_SESSION_TOKEN_KEY);
        localStorage.removeItem(X403_SESSION_EXPIRY_KEY);
      }
    }

    // Need new authentication - request challenge
    try {
      console.log('📋 x403: Requesting authentication challenge...');
      
      const challengeResponse = await fetch(`${serverUrl}/api/auth/x403/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.publicKey.toBase58() })
      });

      // Check for existing session
      if (challengeResponse.ok) {
        const data = await challengeResponse.json();
        
        if (data.existingSession) {
          console.log('✅ x403: Server found existing session');
          setSessionToken(data.sessionToken);
          localStorage.setItem(X403_SESSION_TOKEN_KEY, data.sessionToken);
          localStorage.setItem(X403_SESSION_EXPIRY_KEY, new Date(data.expiresAt).getTime().toString());
          return data.sessionToken;
        }
      }

      // Get challenge (403 response expected)
      if (challengeResponse.status !== 403) {
        throw new Error('Expected 403 Forbidden with challenge');
      }

      const authRequired: AuthRequiredResponse = await challengeResponse.json();
      
      console.log('✅ x403: Challenge received');
      setAuthChallenge(authRequired.challenge);
      setAuthError(null);

      // Show modal and wait for user to sign
      return new Promise((resolve) => {
        setShowAuthModal(true);
        
        // Store callback to resume after signing
        setPendingAuthCallback(() => async () => {
          try {
            setIsAuthenticating(true);
            setAuthError(null);

            // Sign challenge
            const signResult = await signChallenge(authRequired.challenge, wallet);

            if (!signResult.success) {
              setAuthError(signResult.error || 'Signing failed');
              setIsAuthenticating(false);
              resolve(null);
              return;
            }

            // Send signed challenge to server
            console.log('📨 x403: Sending signed challenge to server...');
            
            const authHeader = encodeAuthHeader(signResult.signedChallenge!);

            const verifyResponse = await fetch(`${serverUrl}/api/auth/x403/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify({ walletAddress: wallet.publicKey!.toBase58() })
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              setAuthError(errorData.error || 'Verification failed');
              setIsAuthenticating(false);
              resolve(null);
              return;
            }

            const verifyData = await verifyResponse.json();

            if (!verifyData.authenticated || !verifyData.sessionToken) {
              setAuthError('Authentication failed');
              setIsAuthenticating(false);
              resolve(null);
              return;
            }

            console.log('✅ x403: Authentication successful!');
            
            // Store session token
            setSessionToken(verifyData.sessionToken);
            const expiryTime = Date.now() + X403_SESSION_DURATION;
            localStorage.setItem(X403_SESSION_TOKEN_KEY, verifyData.sessionToken);
            localStorage.setItem(X403_SESSION_EXPIRY_KEY, expiryTime.toString());

            setShowAuthModal(false);
            setIsAuthenticating(false);
            setAuthChallenge(null);
            
            resolve(verifyData.sessionToken);
          } catch (error: any) {
            console.error('❌ x403 authentication error:', error);
            setAuthError(error.message || 'Authentication failed');
            setIsAuthenticating(false);
            resolve(null);
          }
        });
      });
    } catch (error: any) {
      console.error('❌ x403 challenge request failed:', error);
      setAuthError(error.message || 'Authentication failed');
      return null;
    }
  }, [wallet]);

  // Handle sign button click in modal
  const handleAuthSign = useCallback(async () => {
    if (pendingAuthCallback) {
      pendingAuthCallback();
    }
  }, [pendingAuthCallback]);

  // Handle cancel button click in modal
  const handleAuthCancel = useCallback(() => {
    setShowAuthModal(false);
    setAuthChallenge(null);
    setAuthError(null);
    setIsAuthenticating(false);
    setPendingAuthCallback(null);
    
    // Disconnect wallet since auth was cancelled
    if (wallet.disconnect) {
      wallet.disconnect();
    }
  }, [wallet]);

  // Check if session is valid
  const isSessionValid = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    const storedToken = localStorage.getItem(X403_SESSION_TOKEN_KEY);
    const storedExpiry = localStorage.getItem(X403_SESSION_EXPIRY_KEY);

    if (!storedToken || !storedExpiry) {
      return false;
    }

    return Date.now() < parseInt(storedExpiry);
  }, []);

  return {
    authenticate,
    sessionToken,
    isSessionValid: isSessionValid(),
    showAuthModal,
    authChallenge,
    isAuthenticating,
    authError,
    handleAuthSign,
    handleAuthCancel,
  };
}

