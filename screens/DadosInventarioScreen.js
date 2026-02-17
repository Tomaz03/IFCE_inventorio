import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, RefreshControl, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft,
    Package,
    CheckCircle2,
    AlertCircle,
    MapPin,
    UserCheck,
    Hash,
    FileText,
    AlertTriangle,
    Ban,
    Clock,
    Building2,
    Sticker,
    Eye,
    Layers,
    Wrench,
    Download,
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function DadosInventarioScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({});

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        if (!refreshing) setLoading(true);
        try {
            const { count: totalBens } = await supabase
                .from('patrimonio_suap')
                .select('*', { count: 'exact', head: true });

            const { count: totalInventariados } = await supabase
                .from('inventario')
                .select('*', { count: 'exact', head: true });

            const naoLocalizados = Math.max(0, (totalBens || 0) - (totalInventariados || 0));

            const { data: invData } = await supabase
                .from('inventario')
                .select('sala_nova, responsavel_novo, numero_serie_novo, descricao_nova, estado_conservacao_novo, campi_conciliados, situacao_etiqueta, tem_etiqueta');

            const items = invData || [];

            const divSetor = items.filter(i => i.sala_nova && i.sala_nova.trim() !== '').length;
            const divResponsavel = items.filter(i => i.responsavel_novo && i.responsavel_novo.trim() !== '').length;
            const divNumeroSerie = items.filter(i => i.numero_serie_novo && i.numero_serie_novo.trim() !== '').length;
            const divDescricao = items.filter(i => i.descricao_nova && i.descricao_nova.trim() !== '').length;
            const divEstadoConservacao = items.filter(i => i.estado_conservacao_novo && i.estado_conservacao_novo.trim() !== '').length;

            const irrecuperaveis = items.filter(i => {
                const ec = (i.estado_conservacao_novo || '').toLowerCase();
                return ec.includes('irrecuperável') || ec.includes('irrecuperavel') || ec.includes('antiecon');
            }).length;

            const ociosos = items.filter(i => {
                const ec = (i.estado_conservacao_novo || '').toLowerCase();
                return ec.includes('ocioso');
            }).length;

            const divCampus = items.filter(i => {
                const cc = (i.campi_conciliados || '').toUpperCase();
                return cc.includes('NÃO') || cc.includes('NAO');
            }).length;

            const possuiEtiqueta = items.filter(i => {
                const te = (i.tem_etiqueta || '').toUpperCase();
                return te === 'SIM';
            }).length;

            const etiquetaRasurada = items.filter(i => {
                const se = (i.situacao_etiqueta || '').toLowerCase();
                return se.includes('rasurada') || se.includes('descolando') || se.includes('fora do padr');
            }).length;

            const etiquetaDificil = items.filter(i => {
                const se = (i.situacao_etiqueta || '').toLowerCase();
                return se.includes('dif') && se.includes('visualiza');
            }).length;

            const etiquetaMultipla = items.filter(i => {
                const se = (i.situacao_etiqueta || '').toLowerCase();
                return se.includes('múltipla') || se.includes('multipla');
            }).length;

            setStats({
                totalBens: totalBens || 0,
                totalInventariados: totalInventariados || 0,
                naoLocalizados,
                divSetor,
                divResponsavel,
                divNumeroSerie,
                divDescricao,
                divEstadoConservacao,
                irrecuperaveis,
                ociosos,
                divCampus,
                possuiEtiqueta,
                etiquetaRasurada,
                etiquetaDificil,
                etiquetaMultipla,
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
        setLoading(false);
        setRefreshing(false);
    }

    async function exportPDF() {
        setExporting(true);
        try {
            const statRow = (label, value, color = '#0f172a') =>
                `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">${label}</td>
                 <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:bold;text-align:right;color:${color};">${value}</td></tr>`;

            const html = `
            <html>
            <head><meta charset="utf-8"><style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #6366f1; font-size: 22px; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
                h2 { color: #334155; font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
                h3 { color: #666; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                .summary { display: flex; gap: 16px; margin-bottom: 20px; }
                .summary-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
                .summary-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
                .summary-value { font-size: 28px; font-weight: 900; margin-top: 4px; }
            </style></head>
            <body>
                <h1>📊 Dados do Inventário</h1>
                <h3>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</h3>

                <h2>📦 Resumo Geral</h2>
                <table>
                    ${statRow('Total de bens sob responsabilidade da unidade', stats.totalBens?.toLocaleString(), '#6366f1')}
                    ${statRow('Bens localizados e conferidos (inventariados)', stats.totalInventariados?.toLocaleString(), '#10b981')}
                    ${statRow('Bens não localizados (não inventariados)', stats.naoLocalizados?.toLocaleString(), '#ef4444')}
                </table>

                <h2>⚠️ Divergências</h2>
                <table>
                    ${statRow('Divergência de setor (sala)', stats.divSetor, '#f59e0b')}
                    ${statRow('Divergência de responsável pela carga', stats.divResponsavel, '#f59e0b')}
                    ${statRow('Divergência de número de série', stats.divNumeroSerie, '#f59e0b')}
                    ${statRow('Divergência de descrição do bem', stats.divDescricao, '#f59e0b')}
                    ${statRow('Divergência de estado de conservação', stats.divEstadoConservacao, '#f59e0b')}
                    ${statRow('Divergência campus inventariado vs carga contábil', stats.divCampus, '#f59e0b')}
                </table>

                <h2>🔧 Estado de Conservação</h2>
                <table>
                    ${statRow('Bens irrecuperáveis / antieconômicos', stats.irrecuperaveis, '#ef4444')}
                    ${statRow('Bens ociosos', stats.ociosos, '#ef4444')}
                </table>

                <h2>🏷️ Etiqueta Patrimonial</h2>
                <table>
                    ${statRow('Possui etiqueta de tombamento da instituição', stats.possuiEtiqueta, '#3b82f6')}
                    ${statRow('Etiqueta rasurada, descolando ou fora do padrão', stats.etiquetaRasurada, '#3b82f6')}
                    ${statRow('Etiqueta em local de difícil visualização', stats.etiquetaDificil, '#3b82f6')}
                    ${statRow('Múltiplas numerações', stats.etiquetaMultipla, '#3b82f6')}
                </table>

                <p style="margin-top: 20px; font-size: 10px; color: #999;">IFCE - Sistema de Inventário Patrimonial</p>
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

    const StatCard = ({ icon: IconComponent, label, value, color = Theme.colors.primary, bgColor = 'rgba(16, 185, 129, 0.1)', borderColor = 'rgba(16, 185, 129, 0.2)' }) => (
        <View style={[styles.statCard, { borderColor }]}>
            <View style={[styles.statIconBox, { backgroundColor: bgColor }]}>
                <IconComponent size={18} color={color} />
            </View>
            <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <ArrowLeft size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Dados do Inventário</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={exportPDF} style={styles.headerIconButton} disabled={exporting || loading}>
                        <Download size={18} color={exporting ? Theme.colors.textSecondary : '#6366f1'} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={Theme.colors.primary} />}
                >
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.titleAccent} />
                        <Text style={styles.sectionTitle}>Resumo Geral</Text>
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={[styles.summaryCard, { borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
                            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Package size={24} color="#6366f1" />
                            </View>
                            <Text style={styles.summaryLabel}>TOTAL DE BENS</Text>
                            <Text style={[styles.summaryValue, { color: '#6366f1' }]}>{stats.totalBens?.toLocaleString()}</Text>
                        </View>

                        <View style={[styles.summaryCard, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <CheckCircle2 size={24} color={Theme.colors.primary} />
                            </View>
                            <Text style={styles.summaryLabel}>INVENTARIADOS</Text>
                            <Text style={[styles.summaryValue, { color: Theme.colors.primary }]}>{stats.totalInventariados?.toLocaleString()}</Text>
                        </View>
                    </View>

                    <StatCard icon={AlertCircle} label="Bens não localizados (não inventariados)" value={stats.naoLocalizados?.toLocaleString()} color={Theme.colors.error} bgColor="rgba(244, 63, 148, 0.1)" borderColor="rgba(244, 63, 148, 0.2)" />

                    <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                        <View style={[styles.titleAccent, { backgroundColor: '#f59e0b' }]} />
                        <Text style={styles.sectionTitle}>Divergências</Text>
                    </View>

                    <StatCard icon={MapPin} label="Divergência de setor (sala)" value={stats.divSetor} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    <StatCard icon={UserCheck} label="Divergência de responsável pela carga" value={stats.divResponsavel} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    <StatCard icon={Hash} label="Divergência de número de série" value={stats.divNumeroSerie} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    <StatCard icon={FileText} label="Divergência de descrição do bem" value={stats.divDescricao} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    <StatCard icon={Wrench} label="Divergência de estado de conservação" value={stats.divEstadoConservacao} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    <StatCard icon={Building2} label="Divergência campus inventariado vs carga contábil" value={stats.divCampus} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />

                    <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                        <View style={[styles.titleAccent, { backgroundColor: Theme.colors.error }]} />
                        <Text style={styles.sectionTitle}>Estado de Conservação</Text>
                    </View>

                    <StatCard icon={Ban} label="Bens irrecuperáveis / antieconômicos" value={stats.irrecuperaveis} color={Theme.colors.error} bgColor="rgba(244, 63, 148, 0.1)" borderColor="rgba(244, 63, 148, 0.2)" />
                    <StatCard icon={Clock} label="Bens ociosos" value={stats.ociosos} color={Theme.colors.error} bgColor="rgba(244, 63, 148, 0.1)" borderColor="rgba(244, 63, 148, 0.2)" />

                    <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                        <View style={[styles.titleAccent, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.sectionTitle}>Etiqueta Patrimonial</Text>
                    </View>

                    <StatCard icon={Sticker} label="Possui etiqueta de tombamento da instituição" value={stats.possuiEtiqueta} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                    <StatCard icon={AlertTriangle} label="Etiqueta rasurada, descolando ou fora do padrão" value={stats.etiquetaRasurada} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                    <StatCard icon={Eye} label="Etiqueta em local de difícil visualização" value={stats.etiquetaDificil} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                    <StatCard icon={Layers} label="Múltiplas numerações" value={stats.etiquetaMultipla} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        height: 60, backgroundColor: Theme.colors.glass,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, marginTop: 40,
        borderBottomWidth: 1, borderBottomColor: Theme.colors.border,
    },
    headerLeft: { width: 44 },
    headerRight: { width: 44, alignItems: 'flex-end' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text, flex: 1, textAlign: 'center' },
    headerIconButton: {
        width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: Theme.colors.border,
    },
    scrollContent: { padding: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.primary, borderRadius: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    summaryCard: {
        flex: 1, backgroundColor: Theme.colors.surface, borderRadius: 20,
        padding: 20, borderWidth: 1, alignItems: 'center',
    },
    summaryIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    summaryLabel: { fontSize: 9, fontWeight: '900', color: Theme.colors.textSecondary, letterSpacing: 1 },
    summaryValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
    statCard: {
        backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, marginBottom: 10,
    },
    statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.textSecondary, flex: 1, marginRight: 12 },
    statValue: { fontSize: 18, fontWeight: '900' },
});
