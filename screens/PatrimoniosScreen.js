import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
    Search,
    RotateCcw,
    ChevronRight,
    ArrowLeft,
    LayoutGrid,
    Tag,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

const MOCK_DATA = [
    { name: 'ACARAU', count: 10176 },
    { name: 'ACOPIARA', count: 4332 },
    { name: 'ARACATI', count: 7821 },
    { name: 'BATURITE', count: 9555 },
    { name: 'BOAVIAGEM', count: 8122 },
    { name: 'CAMOCIM', count: 7123 },
    { name: 'CANINDE', count: 15547 },
    { name: 'CAUCAIA', count: 8440 },
    { name: 'CEDRO', count: 6284 },
    { name: 'CRATEUS', count: 12795 },
    { name: 'CRATO', count: 18094 },
    { name: 'FORTALEZA', count: 66894 },
    { name: 'GUARAMIRANGA', count: 2098 },
    { name: 'HORIZONTE', count: 5380 },
    { name: 'IGUATU', count: 4317 },
    { name: 'ITAPIPOCA', count: 6923 },
    { name: 'JAGUARIBE', count: 4218 },
    { name: 'JAGUARUANA', count: 2535 },
    { name: 'JUAZEIRO', count: 27875 },
    { name: 'LIMOEIRO', count: 6289 },
    { name: 'MARACANAU', count: 26001 },
    { name: 'MARANGUAPE', count: 4632 },
    { name: 'MOMBACA', count: 541 },
    { name: 'MORADANOVA', count: 10753 },
    { name: 'PARACURU', count: 5580 },
    { name: 'PECEM', count: 1678 },
    { name: 'QUIXADA', count: 14863 },
    { name: 'REITORIA', count: 7734 },
    { name: 'SOBRAL', count: 18504 },
    { name: 'TABULEIRO', count: 5419 },
    { name: 'TAUA', count: 7491 },
    { name: 'TIANGUA', count: 13537 },
    { name: 'UBAJARA', count: 8177 },
    { name: 'UMIRIM', count: 2814 },
];

export default function PatrimoniosScreen({ navigation, route }) {
    const [viewState, setViewState] = useState('LIST'); // LIST, SUMMARY, ITEMS, MY_LOAD
    const [patrimonios, setPatrimonios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCampus, setSelectedCampus] = useState(null);
    const [summary, setSummary] = useState({ pending: 0, inventoried: 0 });
    const [itemsList, setItemsList] = useState([]);
    const [showSearchInput, setShowSearchInput] = useState(false);

    useEffect(() => {
        if (route.params?.context === 'MY_LOAD' && route.params?.initialQuery) {
            setSearchQuery(route.params.initialQuery);
            loadMyPatrimony(route.params.initialQuery);
        } else {
            loadData();
        }
    }, [route.params]);

    const loadData = async () => {
        if (!refreshing) setLoading(true);
        setTimeout(() => {
            setPatrimonios(MOCK_DATA);
            setLoading(false);
            setRefreshing(false);
        }, 300);
    };

    const loadCampusSummary = async (campus) => {
        setSelectedCampus(campus);
        setLoading(true);
        setShowSearchInput(false);
        setSearchQuery('');
        try {
            const totalSuap = MOCK_DATA.find(c => c.name === campus)?.count || 0;

            let query = supabase.from('inventario').select('id, tombo', { count: 'exact' });

            if (campus === 'REITORIA') {
                query = query.or('campus_suap.is.null,campus_suap.ilike.REITORIA');
                query = query.or('campi_conciliados.eq.SIM,campi_conciliados.is.null');
            } else {
                query = query.ilike('campus_suap', campus);
                query = query.eq('campi_conciliados', 'SIM');
            }

            const { data, error } = await query;
            if (error) throw error;

            const isNumeric = (str) => /^\d+$/.test(str);
            const inventoriedData = data?.filter(item => isNumeric(item.tombo)) || [];
            const inventoriedCount = inventoriedData.length;

            setSummary({
                inventoried: inventoriedCount,
                pending: Math.max(0, totalSuap - inventoriedCount)
            });
            setViewState('SUMMARY');
        } catch (err) {
            console.error('Erro em loadCampusSummary:', err);
            setSummary({ inventoried: 0, pending: 0 });
            setViewState('SUMMARY');
        } finally {
            setLoading(false);
        }
    };

    const loadInventoriedItems = async () => {
        setLoading(true);
        setShowSearchInput(false);
        setSearchQuery('');
        try {
            let query = supabase.from('inventario').select('tombo, descricao_suap, id');

            if (selectedCampus === 'REITORIA') {
                query = query.or('campus_suap.is.null,campus_suap.ilike.REITORIA');
                query = query.or('campi_conciliados.eq.SIM,campi_conciliados.is.null');
            } else {
                query = query.ilike('campus_suap', selectedCampus);
                query = query.eq('campi_conciliados', 'SIM');
            }

            const { data, error } = await query;
            if (error) throw error;

            const isNumeric = (str) => /^\d+$/.test(str);
            const filteredData = data?.filter(item => isNumeric(item.tombo)) || [];

            setItemsList(filteredData);
            setViewState('ITEMS');
        } catch (err) {
            console.error('Erro em loadInventoriedItems:', err);
            setItemsList([]);
            setViewState('ITEMS');
        } finally {
            setLoading(false);
        }
    };

    const loadMyPatrimony = async (query = searchQuery) => {
        setLoading(true);
        setViewState('MY_LOAD');
        try {
            // Call the RPC to get ALL items (limit 1000)
            const { data, error } = await supabase.rpc('search_patrimonio_by_name', {
                search_text: query,
                limit_count: 1000
            });

            if (error) throw error;
            setItemsList(data || []);

            // Note: We are reusing itemsList for the My Load view
        } catch (err) {
            console.error('Error loading my patrimony:', err);
            setItemsList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (viewState === 'LIST') loadData();
        else if (viewState === 'SUMMARY') loadCampusSummary(selectedCampus);
        else if (viewState === 'ITEMS') loadInventoriedItems();
        else if (viewState === 'MY_LOAD') loadMyPatrimony(searchQuery);
    };

    const toggleSearch = () => {
        setShowSearchInput(prev => !prev);
        setSearchQuery('');
    };

    const handleBack = () => {
        if (showSearchInput) {
            setShowSearchInput(false);
            setSearchQuery('');
            return;
        }

        if (viewState === 'ITEMS' || viewState === 'MY_LOAD') {
            navigation.goBack();
        } else if (viewState === 'SUMMARY') {
            setViewState('LIST');
        } else {
            navigation.goBack();
        }
    };

    const filteredCampuses = searchQuery
        ? patrimonios.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : patrimonios;

    const filteredItems = searchQuery
        ? itemsList.filter(item => {
            const tombo = item.tombo || item.numero || '';
            const descricao = item.descricao_suap || item.descricao || '';
            const responsavel = item.responsavel || '';

            return (
                tombo.includes(searchQuery) ||
                descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                responsavel.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        : itemsList;

    const renderCampusList = () => (
        <FlatList
            data={filteredCampuses}
            keyExtractor={(item, index) => item.name + index}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => loadCampusSummary(item.name)}
                >
                    <View style={styles.cardLeft}>
                        <View>
                            <Text style={styles.campusName}>{item.name}</Text>
                            <Text style={styles.campusSubtitle}>SISTEMA SUAP</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.count.toLocaleString()}</Text>
                        </View>
                        <ChevronRight size={20} color={Theme.colors.border} />
                    </View>
                </TouchableOpacity>
            )}
            ListHeaderComponent={
                <View style={styles.listHeader}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleAccent} />
                        <Text style={styles.title}>Lista de Bens por Campi</Text>
                    </View>
                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>VER TODOS</Text>
                    </TouchableOpacity>
                </View>
            }
        />
    );

    const renderCampusSummary = () => (
        <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
                <View style={styles.summaryTitleBox}>
                    <Text style={styles.summaryLabel}>CAMPUS SELECIONADO</Text>
                    <Text style={styles.summaryTitle}>{selectedCampus}</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <RotateCcw size={18} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.summaryGrid}>
                {/* Pending Card */}
                <TouchableOpacity style={[styles.statusCard, { borderColor: 'rgba(244, 63, 148, 0.1)' }]}>
                    <View style={[styles.statusIconBox, { backgroundColor: 'rgba(244, 63, 148, 0.1)' }]}>
                        <AlertCircle size={24} color={Theme.colors.error} />
                    </View>
                    <Text style={styles.statusLabel}>PENDENTE</Text>
                    <Text style={[styles.statusValue, { color: Theme.colors.error }]}>{summary.pending.toLocaleString()}</Text>
                    <View style={styles.statusFooter}>
                        <Text style={styles.statusFooterText}>ITENS NO SUAP</Text>
                    </View>
                </TouchableOpacity>

                {/* Inventoried Card */}
                <TouchableOpacity
                    style={[styles.statusCard, { borderColor: 'rgba(16, 185, 129, 0.1)' }]}
                    onPress={loadInventoriedItems}
                >
                    <View style={[styles.statusIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <CheckCircle2 size={24} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.statusLabel}>INVENTARIADO</Text>
                    <Text style={[styles.statusValue, { color: Theme.colors.primary }]}>{summary.inventoried.toLocaleString()}</Text>
                    <View style={styles.statusFooter}>
                        <Text style={[styles.statusFooterText, { color: Theme.colors.primary }]}>CLIQUE PARA VER LISTA</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.actionSection}>
                <TouchableOpacity style={styles.primaryBtn} onPress={loadInventoriedItems}>
                    <Tag size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryBtnText}>Visualizar Itens Coletados</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderItemsList = () => (
        <FlatList
            data={filteredItems}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('PatrimonioDetail', { numero: item.tombo || item.numero })} // Handle both fields
                >
                    <View style={styles.cardLeft}>
                        <View>
                            <Text style={styles.assetTombo}>#{item.tombo || item.numero}</Text>
                            <Text style={styles.assetDesc} numberOfLines={1}>{(item.descricao_suap || item.descricao)?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={Theme.colors.border} />
                </TouchableOpacity>
            )}
            ListHeaderComponent={
                <View style={styles.listHeader}>
                    <View style={styles.titleRow}>
                        <View style={[styles.titleAccent, { backgroundColor: Theme.colors.primary }]} />
                        <Text style={styles.title}>{viewState === 'MY_LOAD' ? 'Itens da Carga' : 'Itens Inventariados'}</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{filteredItems.length}</Text>
                        </View>
                    </View>
                </View>
            }
        />
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerIconButton}>
                        {viewState === 'LIST' && !showSearchInput ? <LayoutGrid size={20} color={Theme.colors.textSecondary} /> : <ArrowLeft size={20} color={Theme.colors.textSecondary} />}
                    </TouchableOpacity>
                </View>

                {showSearchInput ? (
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Buscar por campus ou tombo..."
                        placeholderTextColor={Theme.colors.textSecondary}
                        autoFocus
                    />
                ) : (
                    <Text style={styles.headerTitle}>
                        {viewState === 'ITEMS' ? selectedCampus :
                            viewState === 'SUMMARY' ? 'Resumo' :
                                viewState === 'MY_LOAD' ? 'Minha Carga' : 'Patrimônios'}
                    </Text>
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

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {viewState === 'LIST' && renderCampusList()}
                    {viewState === 'SUMMARY' && renderCampusSummary()}
                    {(viewState === 'ITEMS' || viewState === 'MY_LOAD') && renderItemsList()}
                </View>
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
    listContent: { padding: 20, paddingBottom: 100 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.accent, borderRadius: 2 },
    title: { fontSize: 18, fontWeight: '900', color: '#fff' },
    countBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    },
    countBadgeText: { fontSize: 12, fontWeight: '900', color: Theme.colors.primary },
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
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    accentBar: { width: 4, height: 32, backgroundColor: Theme.colors.accent, borderRadius: 4 },
    campusName: { color: Theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
    campusSubtitle: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '900', marginTop: 2 },
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

    // SUMMARY VIEW
    summaryContainer: { flex: 1, padding: 20 },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: 20,
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    summaryTitleBox: { flex: 1 },
    summaryLabel: { fontSize: 10, fontWeight: '900', color: Theme.colors.textSecondary, letterSpacing: 1 },
    summaryTitle: { fontSize: 24, fontWeight: '900', color: Theme.colors.primary, marginTop: 4 },
    refreshBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },

    summaryGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    statusCard: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    statusIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statusLabel: { fontSize: 9, fontWeight: '900', color: Theme.colors.textSecondary, letterSpacing: 1 },
    statusValue: { fontSize: 22, fontWeight: '900', marginVertical: 4 },
    statusFooter: { marginTop: 8 },
    statusFooterText: { fontSize: 9, fontWeight: '900', color: Theme.colors.textSecondary },

    actionSection: { gap: 12 },
    primaryBtn: {
        backgroundColor: Theme.colors.primary,
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    assetTombo: { color: Theme.colors.primary, fontSize: 14, fontWeight: '900' },
    assetDesc: { color: Theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginTop: 4 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
