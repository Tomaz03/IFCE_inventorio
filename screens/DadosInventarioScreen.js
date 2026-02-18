import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, RefreshControl, Alert, Platform
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
            const statRow = (label, value, color = '#000') =>
                `<tr><td style="padding:10px 12px;border:1px solid #bbb;font-size:12px;color:#000;">${label}</td>
                 <td style="padding:10px 12px;border:1px solid #bbb;font-size:14px;font-weight:bold;text-align:right;color:${color};">${value}</td></tr>`;

            const html = `
            <html>
            <head><meta charset="utf-8"><style>
                @media print { body { padding: 0; margin: 0; } }
                body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #000; background-color: #fff; line-height: 1.5; }
                .header { border-bottom: 4px solid #064e3b; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
                h1 { color: #064e3b; font-size: 24px; margin-bottom: 5px; text-transform: uppercase; font-weight: bold; }
                .meta { color: #000; font-size: 12px; font-weight: 500; margin-bottom: 20px; }
                h2 { color: #064e3b; font-size: 16px; margin-top: 25px; margin-bottom: 10px; border-left: 5px solid #064e3b; padding-left: 10px; background-color: #f1f8f5; padding-top: 5px; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
                td { overflow-wrap: break-word; }
                .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #000; border-top: 1px solid #ccc; padding-top: 15px; }
            </style></head>
            <body>
                <div class="header">
                    <h1>📊 Estatísticas do Inventário</h1>
                    <div class="meta">Relatório Analítico - Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
                </div>

                <h2>📦 Resumo Geral</h2>
                <table>
                    ${statRow('Total de bens sob responsabilidade da unidade', stats.totalBens?.toLocaleString(), '#000')}
                    ${statRow('Bens localizados e conferidos (inventariados)', stats.totalInventariados?.toLocaleString(), '#064e3b')}
                    ${statRow('Bens não localizados (não inventariados)', stats.naoLocalizados?.toLocaleString(), '#ef4444')}
                </table>

                <h2>⚠️ Divergências Identificadas</h2>
                <table>
                    ${statRow('Divergência de setor (sala)', stats.divSetor, '#000')}
                    ${statRow('Divergência de responsável pela carga', stats.divResponsavel, '#000')}
                    ${statRow('Divergência de número de série', stats.divNumeroSerie, '#000')}
                    ${statRow('Divergência de descrição do bem', stats.divDescricao, '#000')}
                    ${statRow('Divergência de estado de conservação', stats.divEstadoConservacao, '#000')}
                    ${statRow('Divergência campus inventariado vs carga contábil', stats.divCampus, '#000')}
                </table>

                <h2>🔧 Estado de Conservação</h2>
                <table>
                    ${statRow('Bens irrecuperáveis / antieconômicos', stats.irrecuperaveis, '#ef4444')}
                    ${statRow('Bens ociosos', stats.ociosos, '#ef4444')}
                </table>

                <h2>🏷️ Etiqueta Patrimonial</h2>
                <table>
                    ${statRow('Possui etiqueta de tombamento da instituição', stats.possuiEtiqueta, '#000')}
                    ${statRow('Etiqueta rasurada, descolando ou fora do padrão', stats.etiquetaRasurada, '#000')}
                    ${statRow('Etiqueta em local de difícil visualização', stats.etiquetaDificil, '#000')}
                    ${statRow('Múltiplas numerações', stats.etiquetaMultipla, '#000')}
                </table>

                <div class="footer">Documento Oficial Gerado pelo Sistema de Inventário Patrimonial IFCE</div>
            </body>
            </html>`;

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 500);
                } else {
                    alert('Erro: Bloqueador de pop-ups impediu a geração do PDF.');
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html, base64: false });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
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
                        {exporting ? <ActivityIndicator size="small" color={Theme.colors.primary} /> : <Download size={18} color={Theme.colors.primary} />}
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

                        <View style={[styles.summaryCard, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <AlertCircle size={24} color="#ef4444" />
                            </View>
                            <Text style={styles.summaryLabel}>NÃO LOCALIZADOS</Text>
                            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{stats.naoLocalizados?.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.titleAccent, { backgroundColor: '#f59e0b' }]} />
                        <Text style={styles.sectionTitle}>Divergências Identificadas</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        <StatCard icon={MapPin} label="Setor (Sala)" value={stats.divSetor} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                        <StatCard icon={UserCheck} label="Responsável" value={stats.divResponsavel} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                        <StatCard icon={Hash} label="Número de Série" value={stats.divNumeroSerie} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                        <StatCard icon={FileText} label="Descrição do Bem" value={stats.divDescricao} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                        <StatCard icon={AlertTriangle} label="Estado Conservação" value={stats.divEstadoConservacao} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                        <StatCard icon={Building2} label="Campus Físico/Contábil" value={stats.divCampus} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" borderColor="rgba(245, 158, 11, 0.2)" />
                    </View>

                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.titleAccent, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.sectionTitle}>Estado de Conservação</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        <StatCard icon={Ban} label="Irrecuperáveis" value={stats.irrecuperaveis} color="#ef4444" bgColor="rgba(239, 68, 68, 0.1)" borderColor="rgba(239, 68, 68, 0.2)" />
                        <StatCard icon={Clock} label="Bens Ociosos" value={stats.ociosos} color="#ef4444" bgColor="rgba(239, 68, 68, 0.1)" borderColor="rgba(239, 68, 68, 0.2)" />
                    </View>

                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.titleAccent, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.sectionTitle}>Etiqueta Patrimonial</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        <StatCard icon={Sticker} label="Possui Etiqueta" value={stats.possuiEtiqueta} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                        <StatCard icon={AlertTriangle} label="Rasurada/Fora Padrão" value={stats.etiquetaRasurada} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                        <StatCard icon={Eye} label="Difícil Visualização" value={stats.etiquetaDificil} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                        <StatCard icon={Layers} label="Múltiplas Numerações" value={stats.etiquetaMultipla} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" borderColor="rgba(59, 130, 246, 0.2)" />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
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
    scrollContent: { padding: 20 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 16 },
    titleAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: Theme.colors.primary },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
    summaryGrid: { gap: 12 },
    summaryCard: {
        backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 20,
        flexDirection: 'column', alignItems: 'center', borderWidth: 1,
    },
    summaryIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    summaryLabel: { fontSize: 11, fontWeight: '800', color: Theme.colors.textSecondary, letterSpacing: 1 },
    summaryValue: { fontSize: 32, fontWeight: '900', marginTop: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
        backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12, width: '48.2%', borderWidth: 1,
    },
    statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statInfo: { flex: 1 },
    statLabel: { fontSize: 10, fontWeight: '700', color: Theme.colors.textSecondary },
    statValue: { fontSize: 16, fontWeight: '900', marginTop: 2 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});