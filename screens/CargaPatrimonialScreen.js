import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft,
    Search,
    ChevronRight,
    Package,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function CargaPatrimonialScreen({ navigation, route }) {
    const { searchName } = route.params || {};
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchInput, setShowSearchInput] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        if (!refreshing) setLoading(true);
        try {
            // Fetch ALL items for this person
            const { data: bensData, error: bensError } = await supabase
                .rpc('search_patrimonio_by_name', {
                    search_text: searchName,
                    limit_count: 10000
                });

            if (bensError) throw bensError;

            if (bensData && bensData.length > 0) {
                const tombos = bensData.map(b => b.numero);

                // Check which are inventoried
                const { data: invData } = await supabase
                    .from('inventario')
                    .select('tombo')
                    .in('tombo', tombos);

                const inventoriedTombos = new Set((invData || []).map(i => i.tombo));

                const bensWithStatus = bensData.map(b => ({
                    ...b,
                    inventariado: inventoriedTombos.has(b.numero)
                }));

                setItems(bensWithStatus);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Error loading carga patrimonial:', err);
            setItems([]);
        }
        setLoading(false);
        setRefreshing(false);
    }

    const onRefresh = () => {
        setRefreshing(true);
        loadItems();
    };

    const toggleSearch = () => {
        setShowSearchInput(prev => !prev);
        setSearchQuery('');
    };

    const filteredItems = searchQuery
        ? items.filter(item => {
            const tombo = item.numero || '';
            const descricao = item.descricao || '';
            return (
                tombo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                descricao.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        : items;

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            key={index}
            style={styles.benCard}
            onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.numero })}
        >
            <View style={[styles.benTomboBox, {
                backgroundColor: item.inventariado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 148, 0.1)',
                borderColor: item.inventariado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 148, 0.2)'
            }]}>
                <Text style={[styles.benTomboText, {
                    color: item.inventariado ? Theme.colors.primary : Theme.colors.error
                }]}>#{item.numero}</Text>
            </View>
            <View style={styles.benInfo}>
                <View style={styles.benStatusRow}>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.inventariado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 148, 0.1)',
                        borderColor: item.inventariado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 148, 0.2)'
                    }]}>
                        <Text style={[styles.statusBadgeText, {
                            color: item.inventariado ? Theme.colors.primary : Theme.colors.error
                        }]}>
                            {item.inventariado ? 'ATIVO' : 'PENDENTE'}
                        </Text>
                    </View>
                    <ChevronRight size={18} color={Theme.colors.border} />
                </View>
                <Text style={styles.benName} numberOfLines={1}>{item.descricao?.toUpperCase()}</Text>
                <Text style={styles.benSubtitle} numberOfLines={1}>Responsável: {item.responsavel}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <ArrowLeft size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {showSearchInput ? (
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Buscar por tombo ou descrição..."
                        placeholderTextColor={Theme.colors.textSecondary}
                        autoFocus
                    />
                ) : (
                    <Text style={styles.headerTitle}>Minha Carga</Text>
                )}

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={toggleSearch} style={styles.headerIconButton}>
                        <Search size={20} color={showSearchInput ? Theme.colors.primary : Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item, index) => (item.numero || index).toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.titleAccent} />
                                <Text style={styles.sectionTitle}>Itens da Carga</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{filteredItems.length} itens</Text>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhum item encontrado na sua carga.</Text>
                    }
                />
            )}
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
        marginTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerLeft: { width: 44 },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
        flex: 1,
        textAlign: 'center',
    },
    headerActions: { flexDirection: 'row', gap: 10, width: 44, justifyContent: 'flex-end' },
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
    searchInput: {
        flex: 1,
        color: Theme.colors.text,
        fontSize: 14,
        paddingHorizontal: 12,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginHorizontal: 10,
    },
    listContent: { padding: 20, paddingBottom: 100 },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.primary, borderRadius: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
    countBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    countBadgeText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.primary },

    // Card styles — exact match with MeusDadosScreen
    benCard: {
        backgroundColor: Theme.colors.surface,
        padding: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 12,
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

    emptyText: { textAlign: 'center', color: Theme.colors.textSecondary, padding: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
