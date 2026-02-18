import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, StatusBar
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { ChevronDown, MapPin, User, Mail, ChevronRight, Check } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

const CAMPUS_KEY = 'ifce_selected_campus';

const CAMPI = [
    'REITORIA', 'ACARAÚ', 'ACOPIARA', 'ARACATI', 'BATURITÉ', 'BOA VIAGEM',
    'CAMOCIM', 'CANINDÉ', 'CAUCAIA', 'CEDRO', 'CRATEÚS', 'CRATO',
    'FORTALEZA', 'GUARAMIRANGA', 'HORIZONTE', 'IGUATU', 'ITAPIPOCA',
    'JAGUARIBE', 'JAGUARUANA', 'JUAZEIRO DO NORTE', 'LIMOEIRO DO NORTE',
    'MARACANAÚ', 'MARANGUAPE', 'MOMBAÇA', 'MORADA NOVA', 'PARACURU',
    'PECÉM', 'QUIXADÁ', 'SOBRAL', 'TABULEIRO DO NORTE', 'TAUÁ',
    'TIANGUÁ', 'UBAJARA', 'UMIRIM'
];

export default function CampusSelectionScreen({ navigation }) {
    const [selectedCampus, setSelectedCampus] = useState('REITORIA');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                } else {
                    console.warn('CampusSelection: No user session found');
                    // Fallback to avoid infinite loading if user is somehow null
                    // but the screen is mounted (shouldn't happen with session check in App.js)
                }

                let saved = null;
                if (Platform.OS === 'web') {
                    saved = await AsyncStorage.getItem(CAMPUS_KEY);
                } else {
                    saved = await SecureStore.getItemAsync(CAMPUS_KEY);
                }

                if (saved) {
                    setSelectedCampus(saved);
                }
            } catch (err) {
                console.error('CampusSelection initialization error:', err);
                Alert.alert('Erro de Configuração', 'Ocorreu um problema ao carregar suas preferências.');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (Platform.OS === 'web') {
                await AsyncStorage.setItem(CAMPUS_KEY, selectedCampus);
            } else {
                await SecureStore.setItemAsync(CAMPUS_KEY, selectedCampus);
            }

            navigation.replace('MainApp', {
                screen: 'Meus Dados',
                params: { campus: selectedCampus }
            });
        } catch (error) {
            console.error('Error saving campus:', error);
            Alert.alert('Erro', 'Não foi possível salvar sua preferência.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Configurando ambiente...</Text>
            </View>
        );
    }

    const email = user.email;
    const nome = user.user_metadata?.full_name || email?.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || 'Servidor IFCE';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Configuração</Text>
                <Text style={styles.headerSubtitle}>Personalize sua experiência de auditoria</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <User size={20} color={Theme.colors.primary} />
                        <Text style={styles.cardTitle}>Dados do Inventariante</Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>NOME IDENTIFICADO</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>{nome}</Text>
                                <Check size={16} color={Theme.colors.primary} />
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>CONTATO INSTITUCIONAL</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>{email}</Text>
                                <Mail size={16} color={Theme.colors.textSecondary} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.selectionGroup}>
                        <Text style={styles.selectionLabel}>CAMPUS DE ATUAÇÃO</Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, showOptions && styles.pickerButtonActive]}
                            onPress={() => setShowOptions(!showOptions)}
                        >
                            <View style={styles.pickerContent}>
                                <MapPin size={18} color={Theme.colors.primary} />
                                <Text style={styles.pickerText}>{selectedCampus}</Text>
                            </View>
                            <ChevronDown size={20} color={showOptions ? Theme.colors.primary : Theme.colors.textSecondary} />
                        </TouchableOpacity>

                        {showOptions && (
                            <View style={styles.optionsWrapper}>
                                <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true}>
                                    {CAMPI.map((campus) => (
                                        <TouchableOpacity
                                            key={campus}
                                            style={[
                                                styles.optionItem,
                                                selectedCampus === campus && styles.optionItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedCampus(campus);
                                                setShowOptions(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.optionText,
                                                selectedCampus === campus && styles.optionTextSelected
                                            ]}>{campus}</Text>
                                            {selectedCampus === campus && <Check size={16} color={Theme.colors.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.noticeBox}>
                    <Text style={styles.noticeText}>
                        * Esta configuração define o campus padrão para as buscas e novos inventários, mas você pode alterá-lo a qualquer momento.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.saveButtonContent}>
                            <Text style={styles.saveText}>Confirmar</Text>
                            <ChevronRight size={18} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    loadingContainer: { flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        backgroundColor: Theme.colors.glass,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: { color: Theme.colors.textPrimary, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    headerSubtitle: { color: Theme.colors.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '600' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
    cardTitle: { color: Theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
    infoGroup: { gap: 16 },
    infoItem: { gap: 8 },
    infoLabel: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    infoText: { color: Theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 24 },
    selectionGroup: { gap: 12 },
    selectionLabel: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    pickerButtonActive: { borderColor: Theme.colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    pickerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pickerText: { color: Theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
    optionsWrapper: {
        marginTop: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    optionsScroll: { maxHeight: 250 },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    optionItemSelected: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    optionText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
    optionTextSelected: { color: Theme.colors.primary, fontWeight: '800' },
    noticeBox: { marginTop: 24, paddingHorizontal: 8 },
    noticeText: { color: Theme.colors.textSecondary, fontSize: 11, fontStyle: 'italic', lineHeight: 18 },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        backgroundColor: Theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    cancelText: { color: Theme.colors.textSecondary, fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    saveButton: {
        flex: 1.5,
        height: 56,
        borderRadius: 16,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    saveText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
});
