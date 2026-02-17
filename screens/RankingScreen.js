import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft,
    Trophy,
    Medal,
    Download,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function RankingScreen({ navigation }) {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadRanking();
    }, []);

    async function loadRanking() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('user_id');

            if (error) throw error;

            const countMap = {};
            (data || []).forEach(item => {
                countMap[item.user_id] = (countMap[item.user_id] || 0) + 1;
            });

            const userIds = Object.keys(countMap);
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds);

                const rankingData = (profiles || []).map(p => ({
                    id: p.id,
                    name: p.full_name || p.email || 'Usuário',
                    email: p.email || '',
                    count: countMap[p.id] || 0,
                }));

                rankingData.sort((a, b) => b.count - a.count);
                setRanking(rankingData);
            } else {
                setRanking([]);
            }
        } catch (err) {
            console.error('Error loading ranking:', err);
            setRanking([]);
        }
        setLoading(false);
    }

    async function exportPDF() {
        if (ranking.length === 0) {
            Alert.alert('Aviso', 'Nenhum dado para exportar.');
            return;
        }
        setExporting(true);
        try {
            const rows = ranking.map((item, i) =>
                `<tr>
                    <td style="text-align:center;font-weight:bold;">${i + 1}º</td>
                    <td>${item.name}</td>
                    <td>${item.email}</td>
                    <td style="text-align:center;font-weight:bold;">${item.count}</td>
                </tr>`
            ).join('');

            const html = `
            <html>
            <head><meta charset="utf-8"><style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #10b981; font-size: 22px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                h3 { color: #666; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th { background: #0f172a; color: #fff; padding: 10px 8px; text-align: left; font-size: 12px; }
                td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                tr:nth-child(even) { background: #f8fafc; }
                tr:nth-child(1) td { background: #fffbeb; }
                tr:nth-child(2) td { background: #f8fafc; }
                tr:nth-child(3) td { background: #fff7ed; }
            </style></head>
            <body>
                <h1>🏆 Ranking de Inventariantes</h1>
                <h3>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</h3>
                <table>
                    <thead><tr><th>Pos.</th><th>Nome</th><th>E-mail</th><th>Itens</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <p style="margin-top: 20px; font-size: 10px; color: #999;">Total de inventariantes: ${ranking.length}</p>
            </body>
            </html>`;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (err) {
            console.error('Export error:', err);
            Alert.alert('Erro', 'Não foi possível exportar o PDF.');
        }
        setExporting(false);
    }

    const getMedalColor = (position) => {
        if (position === 0) return '#fbbf24';
        if (position === 1) return '#94a3b8';
        if (position === 2) return '#d97706';
        return Theme.colors.textSecondary;
    };

    const renderItem = ({ item, index }) => {
        const medalColor = getMedalColor(index);
        const isTopThree = index < 3;

        return (
            <View style={[styles.rankCard, isTopThree && styles.rankCardTop]}>
                <View style={[styles.positionBox, { backgroundColor: isTopThree ? `${medalColor}20` : 'rgba(255,255,255,0.03)', borderColor: isTopThree ? `${medalColor}40` : Theme.colors.border }]}>
                    {isTopThree ? (
                        <Trophy size={18} color={medalColor} />
                    ) : (
                        <Text style={[styles.positionText, { color: Theme.colors.textSecondary }]}>{index + 1}º</Text>
                    )}
                </View>

                <View style={styles.rankInfo}>
                    <View style={styles.rankNameRow}>
                        {isTopThree && (
                            <Text style={[styles.positionBadge, { color: medalColor }]}>{index + 1}º</Text>
                        )}
                        <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <Text style={styles.rankEmail} numberOfLines={1}>{item.email}</Text>
                </View>

                <View style={[styles.countBox, { backgroundColor: isTopThree ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', borderColor: isTopThree ? 'rgba(16, 185, 129, 0.2)' : Theme.colors.border }]}>
                    <Text style={[styles.countNumber, { color: isTopThree ? Theme.colors.primary : Theme.colors.text }]}>{item.count}</Text>
                    <Text style={styles.countLabel}>itens</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <ArrowLeft size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Ranking</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={exportPDF} style={styles.headerIconButton} disabled={exporting || loading}>
                        <Download size={18} color={exporting ? Theme.colors.textSecondary : Theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={ranking}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.listHeaderRow}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.titleAccent, { backgroundColor: '#f59e0b' }]} />
                                <Text style={styles.sectionTitle}>Inventariantes</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{ranking.length}</Text>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Trophy size={48} color={Theme.colors.border} strokeWidth={1} />
                            <Text style={styles.emptyText}>Nenhum inventário realizado ainda.</Text>
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
    headerRight: { width: 44, alignItems: 'flex-end' },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.text,
        flex: 1,
        textAlign: 'center',
    },
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
    listContent: { padding: 20, paddingBottom: 40 },
    listHeaderRow: { marginBottom: 20 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleAccent: { width: 4, height: 20, borderRadius: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
    countBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
        borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    countBadgeText: { fontSize: 12, fontWeight: '900', color: '#f59e0b' },

    rankCard: {
        backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 12,
    },
    rankCardTop: { borderColor: 'rgba(16, 185, 129, 0.15)' },
    positionBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    positionText: { fontSize: 16, fontWeight: '900' },
    rankInfo: { flex: 1 },
    rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    positionBadge: { fontSize: 12, fontWeight: '900' },
    rankName: { fontSize: 14, fontWeight: '800', color: Theme.colors.text, flex: 1 },
    rankEmail: { fontSize: 11, color: Theme.colors.textSecondary, marginTop: 2, fontWeight: '500' },
    countBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    countNumber: { fontSize: 18, fontWeight: '900' },
    countLabel: { fontSize: 9, fontWeight: '700', color: Theme.colors.textSecondary, textTransform: 'uppercase' },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, gap: 16 },
    emptyText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
