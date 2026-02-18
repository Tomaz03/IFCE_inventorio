import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import { User, Shield, ShieldAlert, Search, ChevronRight, UserCheck } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function GerenciarUsuariosScreen() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadProfiles();
    }, []);

    async function loadProfiles() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setProfiles(data || []);
        } catch (err) {
            console.error('Erro ao carregar perfis:', err);
            Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
        } finally {
            setLoading(false);
        }
    }

    async function toggleRole(profile) {
        const newRole = profile.role === 'admin' ? 'user' : 'admin';

        Alert.alert(
            'Confirmar Alteração',
            `Deseja alterar o perfil de ${profile.full_name} para ${newRole.toUpperCase()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ role: newRole })
                                .eq('id', profile.id);

                            if (error) throw error;
                            loadProfiles();
                        } catch (err) {
                            Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
                        }
                    }
                }
            ]
        );
    }

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    <User color={Theme.colors.primary} size={24} />
                    {item.role === 'admin' && (
                        <View style={styles.adminIndicator}>
                            <Shield size={10} color="#fff" />
                        </View>
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{item.full_name || 'Usuário Sem Nome'}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <View style={[
                        styles.roleBadge,
                        item.role === 'admin' ? styles.badgeAdmin : styles.badgeUser
                    ]}>
                        <Text style={[
                            styles.roleText,
                            item.role === 'admin' ? styles.textAdmin : styles.textUser
                        ]}>
                            {item.role?.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.actionButton,
                    item.role === 'admin' ? styles.actionButtonAdmin : styles.actionButtonUser
                ]}
                onPress={() => toggleRole(item)}
            >
                {item.role === 'admin' ? (
                    <>
                        <ShieldAlert size={18} color={Theme.colors.error} />
                        <Text style={styles.actionTextAdmin}>REBAIXAR PARA USUÁRIO</Text>
                    </>
                ) : (
                    <>
                        <Shield size={18} color={Theme.colors.primary} />
                        <Text style={styles.actionTextUser}>PROMOVER A ADMIN</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Gerenciar Usuários</Text>
                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        <Search size={18} color={Theme.colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nome ou e-mail..."
                            placeholderTextColor="rgba(148, 163, 184, 0.4)"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>Carregando perfis...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProfiles}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <UserCheck size={48} color={Theme.colors.border} strokeWidth={1} />
                            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Theme.colors.glass,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: { color: Theme.colors.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 16 },
    searchWrapper: { flexDirection: 'row', alignItems: 'center' },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: Theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: Theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    list: { padding: 20 },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    adminIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Theme.colors.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.colors.surface,
    },
    textContainer: { flex: 1 },
    name: { color: Theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
    email: { color: Theme.colors.textSecondary, fontSize: 13, marginTop: 2, fontWeight: '500' },
    roleBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeAdmin: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    badgeUser: { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.2)' },
    roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    textAdmin: { color: Theme.colors.primary },
    textUser: { color: Theme.colors.textSecondary },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 1,
    },
    actionButtonAdmin: { backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 148, 0.2)' },
    actionButtonUser: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    actionTextAdmin: { fontSize: 11, fontWeight: '900', color: Theme.colors.error, letterSpacing: 0.5 },
    actionTextUser: { fontSize: 11, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 0.5 },
    emptyContainer: { alignItems: 'center', marginTop: 60, gap: 16 },
    emptyText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
