import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput, StatusBar
} from 'react-native';
import {
    Search,
    RotateCcw,
    ChevronRight,
    Plus,
    LayoutGrid,
    Building2,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

const MOCK_DATA = [
    { name: 'ACARAU', count: 128 },
    { name: 'ACOPIARA', count: 64 },
    { name: 'ARACATI', count: 106 },
    { name: 'BATURITE', count: 45 },
    { name: 'BOAVIAGEM', count: 67 },
    { name: 'CAMOCIM', count: 35 },
    { name: 'CANINDE', count: 102 },
    { name: 'CAUCAIA', count: 85 },
    { name: 'CEDRO', count: 55 },
    { name: 'CRATEUS', count: 122 },
    { name: 'CRATO', count: 87 },
    { name: 'FORTALEZA', count: 429 },
    { name: 'GUARAMIRANGA', count: 69 },
    { name: 'HORIZONTE', count: 69 },
    { name: 'IGUATU', count: 172 },
    { name: 'ITAPIPOCA', count: 117 },
    { name: 'JAGUARIBE', count: 130 },
    { name: 'JAGUARUANA', count: 61 },
    { name: 'JUAZEIRO', count: 169 },
    { name: 'LIMOEIRO', count: 161 },
    { name: 'MARACANAU', count: 224 },
    { name: 'MARANGUAPE', count: 72 },
    { name: 'MORADANOVA', count: 72 },
    { name: 'PARACURU', count: 97 },
    { name: 'PECEM', count: 62 },
    { name: 'QUIXADA', count: 129 },
    { name: 'REITORIA', count: 227 },
    { name: 'SOBRAL', count: 197 },
    { name: 'TABULEIRO', count: 78 },
    { name: 'TAUA', count: 60 },
    { name: 'TIANGUA', count: 92 },
    { name: 'UBAJARA', count: 73 },
    { name: 'UMIRIM', count: 37 },
];

export default function AmbientesScreen({ navigation }) {
    const [ambientesData, setAmbientesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchInput, setShowSearchInput] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!refreshing) setLoading(true);
        setTimeout(() => {
            setAmbientesData(MOCK_DATA);
            setLoading(false);
            setRefreshing(false);
        }, 500);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleSearch = () => {
        setShowSearchInput(prev => !prev);
        setSearchQuery('');
    };

    const filteredData = ambientesData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => console.log('Navegar para detalhes do ambiente:', item.name)}
        >
            <View style={styles.cardLeft}>
                <View>
                    <Text style={styles.itemName}>{item.name || 'AMBIENTE GERAL'}</Text>
                    <Text style={styles.itemSubtitle}>LOCALIZAÇÃO FÍSICA</Text>
                </View>
            </View>
            <View style={styles.cardRight}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.count}</Text>
                </View>
                <ChevronRight size={20} color={Theme.colors.border} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <LayoutGrid size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {showSearchInput ? (
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Buscar ambiente..."
                        placeholderTextColor={Theme.colors.textSecondary}
                        autoFocus
                    />
                ) : (
                    <Text style={styles.headerTitle}>Ambientes</Text>
                )}

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={toggleSearch} style={styles.headerIconButton}>
                        <Search size={20} color={showSearchInput ? Theme.colors.primary : Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    {!showSearchInput && (
                        <TouchableOpacity onPress={onRefresh} style={styles.headerIconButton}>
                            <RotateCcw size={20} color={Theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.name + index}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.titleRow}>
                                <View style={styles.titleAccent} />
                                <Text style={styles.title}>Lista de Locais</Text>
                            </View>
                            <TouchableOpacity style={styles.viewAllBtn}>
                                <Text style={styles.viewAllText}>POR BLOCO</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Nenhum ambiente encontrado.</Text>
                        </View>
                    }
                />
            )}

            {/* Floating ADD Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <Plus size={32} color="#fff" />
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
        marginTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerLeft: { width: 44 },
    headerActions: { flexDirection: 'row', gap: 10, width: 80, justifyContent: 'flex-end' },
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
        color: Theme.colors.textPrimary,
        fontSize: 14,
        paddingHorizontal: 12,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    listContent: { padding: 20, paddingBottom: 120 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.primary, borderRadius: 2 },
    title: { fontSize: 18, fontWeight: '900', color: '#fff' },
    viewAllBtn: { padding: 4 },
    viewAllText: { fontSize: 11, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 0.5 },

    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        padding: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.primary,
        borderLeftWidth: 4,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    itemName: { color: Theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold' },
    itemSubtitle: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '900', marginTop: 2 },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    badgeText: { color: Theme.colors.primary, fontSize: 13, fontWeight: '900' },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: Theme.colors.textSecondary, fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
});
