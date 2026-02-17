import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, TextInput, StatusBar, ScrollView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Search, RotateCcw, ChevronRight, MapPin, ClipboardList, Plus } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function InventariosScreen({ navigation }) {
    const [inventarios, setInventarios] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        loadInventarios();
    }, []);

    async function loadInventarios() {
        setRefreshing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            let query = supabase
                .from('inventario')
                .select('*');

            if (profile?.role !== 'admin' && profile?.campus) {
                query = query.eq('campus_inventariado', profile.campus);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (data) {
                const grouped = {};
                data.forEach(item => {
                    const campus = item.campus_inventariado || 'Sem Campus';
                    if (!grouped[campus]) grouped[campus] = [];
                    grouped[campus].push(item);
                });

                const list = Object.entries(grouped).map(([campus, items]) => ({
                    campus,
                    count: items.length,
                    items,
                }));
                list.sort((a, b) => a.campus.localeCompare(b.campus));
                setInventarios(list);
            }
        } catch (err) {
            console.log('Error:', err);
        }
        setRefreshing(false);
    }

    const filtered = searchQuery
        ? inventarios.filter(i => i.campus.toLowerCase().includes(searchQuery.toLowerCase()))
        : inventarios;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Glassmorphism Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Inventários</Text>
                    <TouchableOpacity onPress={loadInventarios} style={styles.refreshIconBox}>
                        <RotateCcw size={20} color={Theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        <Search size={18} color={Theme.colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar por campus..."
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                        />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInventarios} tintColor={Theme.colors.primary} />}
            >
                {/* Global Entry Card */}
                <TouchableOpacity
                    style={styles.allCard}
                    onPress={() => navigation.navigate('InventariosList', { campus: '' })}
                >
                    <View style={styles.allCardContent}>
                        <View style={styles.allCardIcon}>
                            <ClipboardList size={24} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.allCardTitle}>Todos os Registros</Text>
                            <Text style={styles.allCardSubtitle}>Visão geral de todos os campi</Text>
                        </View>
                    </View>
                    <ChevronRight size={24} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                {/* Campus Grid/List */}
                <View style={styles.sectionHeader}>
                    <MapPin size={16} color={Theme.colors.primary} />
                    <Text style={styles.sectionTitle}>POR UNIDADE / CAMPUS</Text>
                </View>

                {filtered.map((item) => (
                    <TouchableOpacity
                        key={item.campus}
                        style={styles.campusCard}
                        onPress={() => navigation.navigate('InventariosList', { campus: item.campus })}
                    >
                        <View style={styles.campusInfo}>
                            <Text style={styles.campusName}>{item.campus}</Text>
                            <Text style={styles.campusCount}>{item.count} itens inventariados</Text>
                        </View>
                        <View style={styles.campusBadge}>
                            <ChevronRight size={18} color={Theme.colors.primary} />
                        </View>
                    </TouchableOpacity>
                ))}

                {filtered.length === 0 && !refreshing && (
                    <View style={styles.emptyContainer}>
                        <ClipboardList size={48} color={Theme.colors.border} strokeWidth={1} />
                        <Text style={styles.emptyText}>Nenhuma inventario encontrada.</Text>
                    </View>
                )}
            </ScrollView>



            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('InventarioForm', { campus: 'REITORIA' })}
            >
                <Plus size={32} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
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
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { color: Theme.colors.textPrimary, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    refreshIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(30, 41, 59, 0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
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
    searchInput: { flex: 1, height: '100%', color: Theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    allCard: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    allCardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    allCardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    allCardTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
    allCardSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    campusCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    campusInfo: { gap: 4 },
    campusName: { color: Theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
    campusCount: { color: Theme.colors.primary, fontSize: 12, fontWeight: '700' },
    campusBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 16 },
    emptyText: { color: Theme.colors.textSecondary, fontSize: 15, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
});
