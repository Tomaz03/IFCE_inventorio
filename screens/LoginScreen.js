import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        if (!email.endsWith('@ifce.edu.br')) {
            Alert.alert('E-mail inválido', 'Por favor, use seu e-mail institucional do IFCE.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Login error:', error);
            Alert.alert('Erro ao entrar', error.message || 'Verifique seu e-mail e senha.');
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            <View style={styles.topDecoration}>
                <View style={styles.glow} />
            </View>

            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <ShieldCheck size={48} color={Theme.colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={styles.title}>IFCE Audit</Text>
                <Text style={styles.subtitle}>Sistema de Inventário e Auditoria</Text>
            </View>

            <View style={styles.formCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Login Institucional</Text>
                    <Text style={styles.cardSubtitle}>Use suas credenciais do IFCE</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>E-mail</Text>
                    <View style={styles.inputWrapper}>
                        <Mail size={18} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="seu.nome@ifce.edu.br"
                            placeholderTextColor="rgba(148, 163, 184, 0.4)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Senha</Text>
                    <View style={styles.inputWrapper}>
                        <Lock size={18} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Matrícula SUAP"
                            placeholderTextColor="rgba(148, 163, 184, 0.4)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Entrar no Sistema</Text>
                            <ChevronRight size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        Acesso exclusivo para servidores do IFCE.
                    </Text>
                </View>
            </View>

            <View style={styles.bottomVersion}>
                <Text style={styles.versionText}>v2.0 Premium Emerald & Slate</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    topDecoration: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        zIndex: -1,
    },
    glow: {
        position: 'absolute',
        top: 50,
        left: 50,
        width: 100,
        height: 100,
        backgroundColor: Theme.colors.primary,
        borderRadius: 50,
        opacity: 0.1,
        transform: [{ scale: 3 }],
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Theme.colors.textPrimary,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        marginTop: 8,
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 10,
    },
    cardHeader: {
        marginBottom: 28,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Theme.colors.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: Theme.colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    footerInfo: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
    },
    bottomVersion: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        opacity: 0.3,
    },
    versionText: {
        color: Theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    }
});
