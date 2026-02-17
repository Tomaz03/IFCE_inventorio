import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, RefreshControl, Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import {
    User,
    Users,
    BadgeCheck,
    Mail,
    MapPin,
    ChevronRight,
    Plus,
    LogOut,
    ScanBarcode,
    Settings,
    Bell,
    LayoutGrid,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    ClipboardList
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

const CAMPUS_KEY = 'ifce_selected_campus';

export default function MeusDadosScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [campus, setCampus] = useState('REITORIA');
    const [bens, setBens] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [inventarioCount, setInventarioCount] = useState(0);
    const [profile, setProfile] = useState(null);
    const [assignedBens, setAssignedBens] = useState([]);
    const [cargaTotal, setCargaTotal] = useState(0);
    const [effectiveSearchName, setEffectiveSearchName] = useState('');

    useEffect(() => {
        const loadCampus = async () => {
            const saved = await AsyncStorage.getItem(CAMPUS_KEY);
            if (saved) setCampus(saved);
        };
        loadCampus();
        loadUserData();
    }, []);

    async function loadUserData() {
        setRefreshing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            const { count } = await supabase
                .from('inventario')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setInventarioCount(count || 0);

            // --- SMART SEARCH FOR PATRIMONIO ---
            // Always use full_name from profiles table (exact match with DB)
            const searchName = profileData?.full_name || user.user_metadata?.full_name || 'Usuário';
            setEffectiveSearchName(searchName);

            // Fetch total count
            const { data: countData, error: countError } = await supabase
                .rpc('count_patrimonio_by_name', {
                    search_text: searchName
                });

            if (!countError && countData !== null) {
                setCargaTotal(countData);
            }

            // Fetch first 6 items
            const { data: bensData, error: bensError } = await supabase
                .rpc('search_patrimonio_by_name', {
                    search_text: searchName,
                    limit_count: 6
                });

            if (bensError) throw bensError;

            if (bensData && bensData.length > 0) {
                const tombos = bensData.map(b => b.numero);

                // Check which of these are already inventoried
                const { data: invData } = await supabase
                    .from('inventario')
                    .select('tombo')
                    .in('tombo', tombos);

                const inventoriedTombos = new Set((invData || []).map(i => i.tombo));

                const bensWithStatus = bensData.map(b => ({
                    ...b,
                    inventariado: inventoriedTombos.has(b.numero)
                }));

                setBens(bensWithStatus);
            }

            // --- FETCH ASSIGNED ASSETS FROM INVENTARIO ---
            const { data: assignedData } = await supabase
                .from('inventario')
                .select('id, tombo, descricao_suap, descricao_nova, responsavel_novo')
                .ilike('responsavel_novo', `%${searchName}%`)
                .limit(10);

            if (assignedData) {
                setAssignedBens(assignedData);
            }

        } catch (err) {
            console.error('Error loading user data:', err);
            Alert.alert('Erro', 'Não foi possível carregar seus dados.');
        }
        setRefreshing(false);
    }

    function handleNovoInventario() {
        navigation.navigate('InventarioForm', { campus });
    }

    function handleVerTudo() {
        navigation.navigate('CargaPatrimonial', {
            searchName: effectiveSearchName || user?.user_metadata?.full_name || ''
        });
    }

    function handleChangeCampus() {
        navigation.navigate('CampusSelection');
    }

    function handleLogout() {
        Alert.alert('Sair', 'Deseja realmente sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', onPress: () => supabase.auth.signOut(), style: 'destructive' },
        ]);
    }

    const email = user?.email || 'N/A';
    const matricula = '2231581';
    const nome = user?.user_metadata?.full_name || 'Inventariante';

    return (
        <View style={styles.container}>
            {/* Header Glassmorphism style */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <LayoutGrid size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meus Dados</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <Bell size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <Settings size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUserData} tintColor={Theme.colors.primary} />}
            >
                {/* Premium Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <User size={40} color={Theme.colors.primary} />
                            </View>
                            <View style={styles.verifiedBadge}>
                                <BadgeCheck size={12} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName} numberOfLines={2}>{nome}</Text>
                            <View style={styles.matriculaBadge}>
                                <Text style={styles.matriculaText}>MATRÍCULA: {matricula}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.profileStats}>
                        <View style={styles.statBoxVertical}>
                            <View style={styles.statIconWrapper}>
                                <BadgeCheck size={16} color={Theme.colors.primary} />
                            </View>
                            <View style={styles.statInfoVertical}>
                                <Text style={styles.statLabel}>PERFIL DO USUÁRIO</Text>
                                <Text style={styles.statValueLarge}>{profile?.role === 'admin' ? 'Administrador' : 'Inventariante'}</Text>
                            </View>
                        </View>

                        <View style={styles.statBoxVertical}>
                            <View style={styles.statIconWrapper}>
                                <MapPin size={16} color={Theme.colors.primary} />
                            </View>
                            <View style={styles.statInfoVertical}>
                                <Text style={styles.statLabel}>CAMPUS ATUAL</Text>
                                <Text style={styles.statValueLarge}>{campus}</Text>
                            </View>
                        </View>

                        <View style={styles.statBoxVertical}>
                            <View style={styles.statIconWrapper}>
                                <ScanBarcode size={16} color={Theme.colors.primary} />
                            </View>
                            <View style={styles.statInfoVertical}>
                                <Text style={styles.statLabel}>ITENS INVENTARIADOS POR VOCÊ</Text>
                                <Text style={[styles.statValueLarge, { color: Theme.colors.primary }]}>{inventarioCount}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.profileFooter}>
                        <View style={styles.footerItem}>
                            <View style={styles.footerIconWrapper}>
                                <Mail size={14} color={Theme.colors.primary} />
                            </View>
                            <Text style={styles.footerText} numberOfLines={1}>{email}</Text>
                        </View>
                        <View style={styles.footerItem}>
                            <View style={styles.footerIconWrapper}>
                                <MapPin size={14} color={Theme.colors.primary} />
                            </View>
                            <View style={styles.campusControl}>
                                <Text style={styles.footerText}>Campus: <Text style={styles.boldText}>{campus}</Text></Text>
                                <TouchableOpacity onPress={handleChangeCampus} style={styles.alterButton}>
                                    <Text style={styles.alterButtonText}>ALTERAR</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Admin Action Button */}
                        {profile?.role === 'admin' && (
                            <TouchableOpacity
                                style={styles.adminActionButton}
                                onPress={() => navigation.navigate('GerenciarInventario')}
                            >
                                <View style={styles.adminActionIconWrapper}>
                                    <ClipboardList size={16} color="#fff" />
                                </View>
                                <Text style={styles.adminActionText}>Gerenciar Inventário</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Quick Action Button */}
                <TouchableOpacity style={styles.primaryActionButton} onPress={handleNovoInventario}>
                    <View style={styles.plusIconWrapper}>
                        <Plus size={16} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.primaryActionText}>Novo Inventário</Text>
                </TouchableOpacity>

                {/* Bens na Carga Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.titleAccent} />
                        <Text style={styles.sectionTitle}>Carga Patrimonial</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{cargaTotal} itens</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleVerTudo}>
                        <Text style={styles.viewAllText}>VER TUDO</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bensList}>
                    {bens.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.benCard}
                            onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.numero })}
                        >
                            <View style={[styles.benTomboBox, { backgroundColor: item.inventariado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 148, 0.1)', borderColor: item.inventariado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 148, 0.2)' }]}>
                                <Text style={[styles.benTomboText, { color: item.inventariado ? Theme.colors.primary : Theme.colors.error }]}>#{item.numero}</Text>
                            </View>
                            <View style={styles.benInfo}>
                                <View style={styles.benStatusRow}>
                                    <View style={[styles.statusBadge, { backgroundColor: item.inventariado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 148, 0.1)', borderColor: item.inventariado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 148, 0.2)' }]}>
                                        <Text style={[styles.statusBadgeText, { color: item.inventariado ? Theme.colors.primary : Theme.colors.error }]}>
                                            {item.inventariado ? 'ATIVO' : 'PENDENTE'}
                                        </Text>
                                    </View>
                                    <ChevronRight size={18} color={Theme.colors.border} />
                                </View>
                                <Text style={styles.benName} numberOfLines={1}>{item.descricao?.toUpperCase()}</Text>
                                <Text style={styles.benSubtitle} numberOfLines={1}>Inventariado em: 2024</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {bens.length === 0 && (
                        <Text style={styles.emptyText}>Nenhum bem encontrado na sua carga.</Text>
                    )}
                </View>

                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.titleAccent, { backgroundColor: Theme.colors.primary }]} />
                        <Text style={styles.sectionTitle}>Patrimônio Atribuído</Text>
                        {assignedBens.length > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                                <Text style={[styles.countBadgeText, { color: '#60a5fa' }]}>{assignedBens.length} itens</Text>
                            </View>
                        )}
                    </View>
                </View>

                {assignedBens.map((item, index) => (
                    <View key={item.id || index} style={[styles.respCard, { marginBottom: 12 }]}>
                        <View style={styles.respHeader}>
                            <View style={styles.respBadge}>
                                <View style={[styles.respIconBox, { backgroundColor: Theme.colors.primary }]}>
                                    <CheckCircle2 size={12} color="#fff" />
                                </View>
                                <Text style={[styles.respBadgeText, { color: Theme.colors.primary }]}>Atribuído</Text>
                            </View>
                            <Text style={styles.respTombo}>#{item.tombo}</Text>
                        </View>

                        <View style={styles.respContent}>
                            <Text style={styles.respLabel}>Descrição</Text>
                            <Text style={styles.respValue} numberOfLines={2}>
                                {item.descricao_nova || item.descricao_suap || 'SEM DESCRIÇÃO'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.respButton, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
                            onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.tombo })}
                        >
                            <Text style={[styles.respButtonText, { color: '#fff' }]}>VISUALIZAR DETALHES</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {assignedBens.length === 0 && (
                    <View style={[styles.respCard, { opacity: 0.6, borderStyle: 'dashed' }]}>
                        <Text style={[styles.emptyText, { padding: 0 }]}>Nenhum patrimônio atribuído a você durante o inventário.</Text>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color={Theme.colors.textSecondary} />
                    <Text style={styles.logoutText}>SAIR DA CONTA</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versão 2.4.0 • Inventory App © 2026</Text>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleNovoInventario}>
                <ScanBarcode size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        height: 60,
        backgroundColor: Theme.colors.glass,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 0,
        marginTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
    headerIconButton: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    headerActions: { flexDirection: 'row', gap: 10 },
    content: { flex: 1 },
    scrollContent: { padding: 20 },

    // Profile Card
    profileCard: {
        backgroundColor: '#064e3b', // Deep Emerald
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 72,
        height: 72,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        backgroundColor: Theme.colors.primary,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#064e3b',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 24 },
    matriculaBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    matriculaText: { fontSize: 10, fontWeight: '900', color: '#6ee7b7' },

    profileStats: {
        gap: 12,
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    statBoxVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    statIconWrapper: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statInfoVertical: { flex: 1 },
    statLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    statValueLarge: { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 2 },

    profileFooter: { gap: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    footerIconWrapper: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footerText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    boldText: { fontWeight: '900', color: '#fff' },
    campusControl: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alterButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    alterButtonText: { fontSize: 10, fontWeight: '900', color: '#fff' },

    adminActionButton: {
        marginTop: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    adminActionIconWrapper: {
        width: 28,
        height: 28,
        backgroundColor: Theme.colors.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminActionText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5
    },

    primaryActionButton: {
        backgroundColor: Theme.colors.surface,
        marginTop: 20,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    plusIconWrapper: {
        width: 24,
        height: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryActionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.primary, borderRadius: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', tracking: -0.5 },
    countBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    countBadgeText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.primary },
    viewAllText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.primary, textTransform: 'uppercase' },

    bensList: { gap: 12 },
    benCard: {
        backgroundColor: Theme.colors.surface,
        padding: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    benTomboBox: {
        width: 60,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    benTomboText: { fontSize: 12, fontWeight: '900' },
    benInfo: { flex: 1 },
    benStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    statusBadgeText: { fontSize: 9, fontWeight: '900' },
    benName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.text, marginTop: 2 },
    benSubtitle: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 0 },

    respCard: {
        backgroundColor: 'rgba(244, 63, 148, 0.05)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 148, 0.1)',
        position: 'relative',
        overflow: 'hidden',
    },
    respHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    respBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    respIconBox: {
        width: 24,
        height: 24,
        backgroundColor: Theme.colors.error,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    respBadgeText: { fontSize: 11, fontWeight: '900', color: Theme.colors.error, textTransform: 'uppercase' },
    respTombo: { fontSize: 13, fontWeight: '900', color: Theme.colors.textSecondary },
    respContent: { marginBottom: 20 },
    respLabel: { fontSize: 10, fontWeight: '900', color: Theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    respValue: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
    respButton: { backgroundColor: Theme.colors.error, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    respButtonText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    logoutButton: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    logoutText: { color: Theme.colors.textSecondary, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    versionText: {
        textAlign: 'center',
        fontSize: 10,
        color: Theme.colors.textSecondary,
        marginTop: 0,
        fontWeight: '900',
        opacity: 0.4,
        textTransform: 'uppercase',
        letterSpacing: 1
    },

    emptyText: { textAlign: 'center', color: Theme.colors.textSecondary, padding: 20 },

    fab: {
        position: 'absolute',
        bottom: 110, // Adjusted for new tab bar height
        right: 24,
        width: 64,
        height: 64,
        backgroundColor: Theme.colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
});
