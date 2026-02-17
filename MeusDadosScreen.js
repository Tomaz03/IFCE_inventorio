import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, RefreshControl, Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import { ScanBarcode } from 'lucide-react-native';

const CAMPUS_KEY = 'ifce_selected_campus';

export default function MeusDadosScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [campus, setCampus] = useState('REITORIA');
    const [bens, setBens] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [inventarioCount, setInventarioCount] = useState(0);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const loadCampus = async () => {
            const saved = await SecureStore.getItemAsync(CAMPUS_KEY);
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

            // Load profile data
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // Load user's inventario count
            const { count } = await supabase
                .from('inventario')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setInventarioCount(count || 0);

            // Load bens na carga (items where this user is responsible)
            // Using the full name provided by the user for hardcoded match if metadata is empty
            const searchName = user.user_metadata?.full_name || 'Francisco Tomaz de Aquino Junior';

            const { data: bensData } = await supabase
                .from('patrimonio_suap')
                .select('numero, descricao')
                .ilike('responsavel', `%${searchName}%`)
                .limit(50);

            if (bensData) {
                // Check status in inventario table for ANY server having inventoried it
                const tombos = bensData.map(b => b.numero);
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

        } catch (err) {
            console.error('Error loading user data:', err);
            Alert.alert('Erro de Conexão', 'Não foi possível carregar seus dados. Verifique a permissão no banco.');
        }
        setRefreshing(false);
    }

    function handleNovoInventario() {
        navigation.navigate('InventarioForm', { campus });
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

    const email = user?.email || '';
    const matricula = '2231581';
    const nome = user?.user_metadata?.full_name || 'Francisco Tomaz de Aquino Junior';

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUserData} tintColor="#00E676" />}
        >
            {/* Profile Card */}
            <View style={styles.profileCard}>
                <Text style={styles.profileName}>{nome}</Text>
                <Text style={styles.profileMatricula}>{matricula}</Text>
                <View style={[styles.roleBadgeContainer, { backgroundColor: profile?.role === 'admin' ? '#FFEA00' : '#333' }]}>
                    <Text style={[styles.profileRole, { color: profile?.role === 'admin' ? '#000' : '#ccc' }]}>
                        {profile?.role === 'admin' ? 'Administrador' : 'Inventariante'}
                    </Text>
                </View>

                {profile?.role === 'admin' && (
                    <TouchableOpacity
                        style={styles.adminButton}
                        onPress={() => navigation.navigate('GerenciarUsuarios')}
                    >
                        <Text style={styles.adminButtonText}>GERENCIAR USUÁRIOS</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.profileActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleNovoInventario}>
                        <Text style={styles.actionButtonText}>NOVO{'\n'}INVENTÁRIO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleChangeCampus}>
                        <Text style={styles.actionButtonText}>MUDAR CAMPUS{'\n'}INVENTARIANDO</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>E-mail para{'\n'}Contato</Text>
                    <Text style={styles.infoValue}>{email}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Matrícula</Text>
                    <Text style={styles.infoValueBold}>{matricula}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Campus SUAP</Text>
                    <Text style={styles.infoValueBold}>REITORIA</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Campus{'\n'}Inventariando</Text>
                    <Text style={styles.infoValueBold}>{campus}</Text>
                    <TouchableOpacity onPress={handleChangeCampus}>
                        <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Seu Campus Registro</Text>
                    <Text style={styles.infoValueBold}>{profile?.campus || 'Não definido'}</Text>
                </View>
            </View>

            {/* Bens na carga */}
            <View style={styles.bensSection}>
                <View style={styles.bensSectionHeader}>
                    <Text style={styles.bensSectionTitle}>Bens na minha carga</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{bens.length}</Text>
                    </View>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 0.3 }]}>NUMERO ↑</Text>
                    <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>DESCRICAO</Text>
                </View>

                {bens.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.tableRow}
                        onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.numero })}
                    >
                        <Text style={[
                            styles.tableNumero,
                            { flex: 0.3, color: item.inventariado ? '#00E676' : '#ff4444' }
                        ]}>
                            {item.numero}
                        </Text>
                        <Text style={[styles.tableDescricao, { flex: 0.65 }]} numberOfLines={1}>
                            {item.descricao}
                        </Text>
                        <Text style={styles.tableArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Inventários feitos */}
            <View style={styles.inventariosSection}>
                <Text style={styles.inventariosSectionTitle}>
                    Bens inventariados por mim: <Text style={styles.badge2}>{inventarioCount}</Text>
                </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.fab}
                onPress={handleNovoInventario}
            >
                <ScanBarcode size={30} color="#000" />
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    profileCard: {
        backgroundColor: '#1e1e1e',
        padding: 20,
        margin: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    profileMatricula: { fontSize: 14, color: '#888', marginTop: 4 },
    roleBadgeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    profileRole: { fontSize: 12, fontWeight: 'bold' },
    adminButton: {
        backgroundColor: '#333',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFEA00',
    },
    adminButtonText: { color: '#FFEA00', fontSize: 12, fontWeight: 'bold' },
    profileActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    actionButton: { paddingVertical: 8 },
    actionButtonText: { color: '#00E676', fontSize: 12, fontWeight: 'bold' },
    infoSection: {
        backgroundColor: '#1e1e1e',
        marginHorizontal: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: { color: '#888', fontSize: 13, flex: 0.4 },
    infoValue: { color: '#fff', fontSize: 14, flex: 0.55, textAlign: 'right' },
    infoValueBold: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 0.55, textAlign: 'right' },
    editIcon: { fontSize: 18, marginLeft: 8 },
    divider: { height: 1, backgroundColor: '#333' },
    bensSection: {
        backgroundColor: '#1e1e1e',
        margin: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    bensSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    bensSectionTitle: { fontSize: 14, color: '#ccc' },
    badge: {
        backgroundColor: '#00E676',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
    tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
    tableHeaderText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    tableNumero: { color: '#00E676', fontSize: 14, fontStyle: 'italic' },
    tableDescricao: { color: '#ccc', fontSize: 13 },
    tableArrow: { color: '#888', fontSize: 20 },
    inventariosSection: {
        backgroundColor: '#1e1e1e',
        marginHorizontal: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    inventariosSectionTitle: { color: '#ccc', fontSize: 14 },
    badge2: { color: '#00E676', fontWeight: 'bold' },
    logoutButton: {
        margin: 12,
        padding: 16,
        backgroundColor: '#2a1a1a',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#5a2a2a',
    },
    logoutText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#00E676',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
