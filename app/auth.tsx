import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const router = useRouter();
    const { googleLogin, appleLogin } = useFinanceStore();
    const [loading, setLoading] = useState<string | null>(null);

    // Google Hook - Forcing the Redirect to use the Proxy
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: '964143418139-hkcngqfdi3maik3dg703taqlrk2uc8vd.apps.googleusercontent.com',
        webClientId: '964143418139-98dilfqi1vimsdqul8q01abgauaja441.apps.googleusercontent.com',
        // FORCE THE REDIRECT URI STRING
        redirectUri: AuthSession.makeRedirectUri({
            native: 'https://auth.expo.io/@anonymous/finance-manager',
        }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSuccess(id_token);
        }
    }, [response]);

    const handleGoogleAuth = async () => {
        if (!request) return;
        setLoading('google');
        try {
            // Force proxy again here for safety
            await promptAsync({ useProxy: true });
        } catch (err: any) {
            Alert.alert('Auth Error', err.message);
            setLoading(null);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setLoading('google');
        try {
            await googleLogin(idToken);
            router.replace('/(tabs)/settings');
        } catch (err: any) {
            Alert.alert('Google Auth Failed', err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleAppleAuth = async () => {
        setLoading('apple');
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            await appleLogin({
                identityToken: credential.identityToken,
                userIdentifier: credential.user,
                fullName: credential.fullName,
                email: credential.email
            });

            router.replace('/(tabs)/settings');
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Auth Failed', e.message);
            }
        } finally {
            setLoading(null);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#0F172A', '#020617']} style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <IconSymbol name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.hero}>
                    <View style={styles.logoContainer}>
                        <LinearGradient colors={[Colors.dashboard.cyan, '#3B82F6']} style={styles.logoGradient}>
                            <IconSymbol name="wallet" size={40} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>Finance</Text>
                    <Text style={styles.subtitle}>Smart wealth management</Text>
                </View>

                <View style={styles.authGroup}>
                    <Text style={styles.authTitle}>Secure Connection</Text>
                    <Text style={styles.authDesc}>Choose a provider to sync your data across all devices.</Text>

                    <TouchableOpacity
                        style={[styles.socialButton, styles.googleButton]}
                        onPress={handleGoogleAuth}
                        disabled={!!loading || !request}
                    >
                        {loading === 'google' ? <ActivityIndicator color="#000" /> : (
                            <>
                                <FontAwesome name="google" size={20} color="#000" style={styles.socialIcon} />
                                <Text style={styles.googleText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={handleAppleAuth} disabled={!!loading}>
                            {loading === 'apple' ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <FontAwesome name="apple" size={22} color="#fff" style={styles.socialIcon} />
                                    <Text style={styles.appleText}>Continue with Apple</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.footerText}>By continuing, you agree to our Terms and Privacy Policy.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { flex: 1, padding: 24, justifyContent: 'space-between' },
    backButton: { marginTop: 60, width: 40, height: 40 },
    hero: { alignItems: 'center', marginTop: -40 },
    logoContainer: {
        width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 20,
        shadowColor: Colors.dashboard.cyan, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 16,
    },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
    authGroup: { width: '100%', gap: 16, paddingBottom: 40 },
    authTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    authDesc: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
    socialButton: {
        height: 58, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    },
    socialIcon: { marginRight: 12 },
    googleButton: { backgroundColor: '#fff' },
    googleText: { color: '#000', fontSize: 17, fontWeight: '600' },
    appleButton: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    appleText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    footerText: { color: '#475569', fontSize: 12, textAlign: 'center', marginBottom: 10, lineHeight: 18 }
});
