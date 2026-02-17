import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, TextInput, ActivityIndicator, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Search, RotateCcw, ChevronRight, MapPin, ClipboardList, User } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function InventariosListScreen({ route, navigation }) {
    const { campus } = route.params || { campus: 'REITORIA' };
    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [campus]);

    async function loadData() {
        if (!refreshing) setLoading(true);
        try {
            let query = supabase
                .from('inventario')
                .select(`
                    *,
                    profiles (
                        full_name,
                        email
                    )
                `);

            if (campus) {
                query = query.eq('campus_inventariado', campus);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const groupedMap = {};
                data.forEach(item => {
                    let campusKey = 'Sem Carga Patrimonial';

                    if (item.registrado_suap === 'SIM') {
                        campusKey = item.campus_suap || item.campus_inventariado || 'Indefinido';
                    } else if (item.registrado_suap === 'NÃO') {
                        campusKey = 'Sem Carga Patrimonial';
                    } else if (item.tombo && isNaN(Number(item.tombo))) {
                        campusKey = 'Sem Carga Patrimonial';
                    }

                    if (!groupedMap[campusKey]) {
                        groupedMap[campusKey] = {
                            name: campusKey,
                            items: []
                        };
                    }
                    groupedMap[campusKey].items.push(item);
                });

                const list = Object.values(groupedMap);
                list.sort((a, b) => a.name.localeCompare(b.name));
                setInventarios(list);
            }
        } catch (err) {
            console.error('Erro ao carregar detalhamento:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getFilteredData = () => {
        if (!searchQuery) return inventarios;

        const query = searchQuery.toLowerCase();
        return inventarios.map(group => {
            const filteredItems = group.items.filter(item =>
                item.tombo.toLowerCase().includes(query) ||
                (item.descricao_suap && item.descricao_suap.toLowerCase().includes(query)) ||
                (item.descricao_nova && item.descricao_nova.toLowerCase().includes(query)) ||
                (item.profiles?.email && item.profiles.email.toLowerCase().includes(query))
            );
            return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);
    };

    const filteredData = getFilteredData();

    const renderItem = ({ item: group }) => (
        <View style={styles.groupContainer}>
            <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                    <ClipboardList size={16} color={Theme.colors.primary} />
                    <Text style={styles.groupTitle}>{group.name}</Text>
                </View>
                <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>{group.items.length}</Text>
                </View>
            </View>

            <View style={styles.itemsCard}>
                {group.items.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.itemRow,
                            index !== group.items.length - 1 && styles.itemSeparator
                        ]}
                        onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.tombo })}
                    >
                        <View style={styles.itemContent}>
                            <View style={styles.itemTopRow}>
                                <Text style={styles.tombo}>{item.tombo}</Text>
                                <View style={styles.userTag}>
                                    <User size={10} color={Theme.colors.textSecondary} />
                                    <Text style={styles.userName} numberOfLines={1}>
                                        {item.profiles?.email?.split('@')[0] || 'Unknown'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.description} numberOfLines={2}>
                                {item.descricao_nova || item.descricao_suap || 'Sem descrição'}
                            </Text>

                            <View style={styles.itemMeta}>
                                <MapPin size={12} color={Theme.colors.textSecondary} />
                                <Text style={styles.campusTag}>{item.campus_inventariado}</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={Theme.colors.border} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        <Search size={18} color={Theme.colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar tombo, descrição ou servidor..."
                            placeholderTextColor="rgba(148, 163, 184, 0.5)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                        <RotateCcw size={20} color={Theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>Carregando inventários...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.name}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Theme.colors.primary}
                            colors={[Theme.colors.primary]}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <ClipboardList size={48} color={Theme.colors.border} strokeWidth={1} />
                            <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Theme.colors.glass,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1,
        height: '100%',
        color: Theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    refreshButton: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40
    },
    groupContainer: {
        marginBottom: 24,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    groupTitle: {
        color: Theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    groupBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    groupBadgeText: {
        color: Theme.colors.primary,
        fontSize: 11,
        fontWeight: '800'
    },
    itemsCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Theme.colors.surface,
    },
    itemSeparator: {
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    itemContent: { flex: 1 },
    itemTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    tombo: {
        color: Theme.colors.primary,
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    userTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    userName: {
        color: Theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        maxWidth: 100,
    },
    description: {
        color: Theme.colors.textPrimary,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
        marginBottom: 8,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    campusTag: {
        color: Theme.colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    loadingText: {
        color: Theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        color: Theme.colors.textSecondary,
        fontSize: 15,
        fontWeight: '600'
    },
});
