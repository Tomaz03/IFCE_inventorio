import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { MapPin, User, Tag, Info, Calendar, CheckCircle, XCircle, ChevronLeft, Edit3, ClipboardCheck, AlertTriangle } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

function QuestionDetail({ label, value }) {
    const isNo = value?.toString().toUpperCase().startsWith('NÃO');
    return (
        <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>{label}</Text>
            <View style={[styles.questionValueBadge, isNo ? styles.badgeNo : styles.badgeYes]}>
                <Text style={[styles.questionValueText, isNo ? styles.textNo : styles.textYes]}>{value}</Text>
            </View>
        </View>
    );
}

function ComparisonRow({ label, suap, conferido, novo }) {
    const isDifferent = conferido?.toString().toUpperCase().startsWith('NÃO');
    return (
        <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonLabel}>{label}</Text>
            <View style={styles.comparisonBox}>
                <View style={styles.comparisonRow}>
                    <Text style={styles.compValueLabel}>SUAP:</Text>
                    <Text style={styles.compValueText}>{suap || 'Não informado'}</Text>
                </View>
                <View style={styles.comparisonRow}>
                    <Text style={styles.compValueLabel}>Confere:</Text>
                    <View style={[styles.miniBadge, isDifferent ? styles.badgeNo : styles.badgeYes]}>
                        <Text style={[styles.miniBadgeText, isDifferent ? styles.textNo : styles.textYes]}>{conferido}</Text>
                    </View>
                </View>
                {isDifferent && (
                    <View style={styles.comparisonRow}>
                        <Text style={styles.compValueLabel}>Novo:</Text>
                        <Text style={styles.compValueTextPrimary}>{novo || 'N/A'}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function PatrimonioDetailScreen({ route, navigation }) {
    const { numero } = route.params;
    const [loading, setLoading] = useState(true);
    const [patrimonio, setPatrimonio] = useState(null);
    const [inventariado, setInventariado] = useState(false);
    const [inventarioData, setInventarioData] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [numero])
    );

    async function loadData() {
        setLoading(true);
        try {
            // 1. Fetch from Inventario
            const { data: censusRecord, error: censusError } = await supabase
                .from('inventario')
                .select(`
                    id, tombo, user_id, created_at, 
                    tem_etiqueta, situacao_etiqueta, campi_conciliados,
                    registrado_suap, 
                    descricao_suap, descricao_confere, descricao_nova,
                    numero_serie_suap, numero_serie_confere, numero_serie_novo,
                    sala_suap, sala_confere, sala_nova,
                    estado_conservacao_suap, estado_conservacao_confere, estado_conservacao_novo,
                    responsavel_suap, responsavel_confere, responsavel_novo,
                    observacoes, campus_suap, campus_inventariado,
                    foto1_url, foto2_url,
                    profiles:user_id (
                        full_name
                    )
                `)
                .eq('tombo', numero)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (censusError) console.error('Error fetching census:', censusError);

            // 2. Fetch from Patrimonio SUAP
            const { data: suapRecord, error: suapError } = await supabase
                .from('patrimonio_suap')
                .select('*')
                .eq('numero', numero)
                .maybeSingle();

            if (suapError) console.error('Error fetching suap:', suapError);

            if (suapRecord) {
                setPatrimonio(suapRecord);
            }

            if (censusRecord) {
                setInventariado(true);
                setInventarioData(censusRecord);

                setPatrimonio(prev => ({
                    ...(prev || {}),
                    numero: censusRecord.tombo,
                    descricao: censusRecord.descricao_nova || censusRecord.descricao_suap || prev?.descricao || 'Sem descrição',
                    responsavel: censusRecord.responsavel_novo || censusRecord.responsavel_suap || prev?.responsavel || 'Não informado',
                    campus: censusRecord.campus_suap || censusRecord.campus_inventariado || prev?.campus || 'Não informado',
                    sala: censusRecord.sala_nova || censusRecord.sala_suap || prev?.sala || 'Não informada',
                    estado_conservacao: censusRecord.estado_conservacao_novo || censusRecord.estado_conservacao_suap || prev?.estado_conservacao || 'Não informado'
                }));
            }

            if (!suapRecord && !censusRecord) {
                throw new Error('Patrimônio não encontrado.');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                setUserProfile(profile);
            }
        } catch (err) {
            console.error('[DEBUG] Erro geral em PatrimonioDetail:', err);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do patrimônio.');
            navigation.goBack();
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Buscando detalhes...</Text>
            </View>
        );
    }

    if (!patrimonio) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Bem</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusSection}>
                    {inventariado ? (
                        <View style={[styles.statusBadge, styles.badgeSuccess]}>
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.statusBadgeText}>INVENTARIADO</Text>
                        </View>
                    ) : (
                        <View style={[styles.statusBadge, styles.badgeWarning]}>
                            <AlertTriangle size={18} color="#fff" />
                            <Text style={styles.statusBadgeText}>PENDENTE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.mainCard}>
                    <View style={styles.tomboRow}>
                        <Tag size={20} color={Theme.colors.primary} />
                        <Text style={styles.tomboText}>{patrimonio.numero}</Text>
                    </View>
                    <Text style={styles.descriptionText}>{patrimonio.descricao}</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                        <InfoItem icon={<MapPin size={14} color={Theme.colors.textSecondary} />} label="Campus" value={patrimonio.campus} />
                        <InfoItem icon={<Calendar size={14} color={Theme.colors.textSecondary} />} label="Data do Inventário" value={inventariado ? new Date(inventarioData.created_at).toLocaleDateString('pt-BR') : 'N/A'} />
                    </View>
                </View>

                {inventariado && inventarioData && (
                    <View style={styles.inventoryContainer}>
                        <View style={styles.sectionHeader}>
                            <ClipboardCheck size={20} color={Theme.colors.primary} />
                            <Text style={styles.sectionTitle}>RESULTADO DO INVENTÁRIO</Text>
                        </View>

                        <View style={styles.photoGrid}>
                            {inventarioData.foto1_url && (
                                <View style={styles.photoCard}>
                                    <Image source={{ uri: inventarioData.foto1_url }} style={styles.photo} />
                                    <View style={styles.photoTag}><Text style={styles.photoTagText}>FOTO 01</Text></View>
                                </View>
                            )}
                            {inventarioData.foto2_url && (
                                <View style={styles.photoCard}>
                                    <Image source={{ uri: inventarioData.foto2_url }} style={styles.photo} />
                                    <View style={styles.photoTag}><Text style={styles.photoTagText}>FOTO 02</Text></View>
                                </View>
                            )}
                        </View>

                        <View style={styles.resultsCard}>
                            <QuestionDetail label="Presença de Etiqueta" value={inventarioData.tem_etiqueta} />
                            {inventarioData.tem_etiqueta === 'SIM' && (
                                <QuestionDetail label="Estado da Etiqueta" value={inventarioData.situacao_etiqueta} />
                            )}
                            <QuestionDetail label="Base SUAP Ativa" value={inventarioData.registrado_suap} />

                            <View style={styles.cardDivider} />

                            <ComparisonRow label="Descrição Técnica" suap={inventarioData.descricao_suap} conferido={inventarioData.descricao_confere} novo={inventarioData.descricao_nova} />
                            <ComparisonRow label="Número de Série" suap={inventarioData.numero_serie_suap} conferido={inventarioData.numero_serie_confere} novo={inventarioData.numero_serie_novo} />
                            <ComparisonRow label="Ambiente de Alocação" suap={inventarioData.sala_suap} conferido={inventarioData.sala_confere} novo={inventarioData.sala_nova} />
                            <ComparisonRow label="Estado de Conservação" suap={inventarioData.estado_conservacao_suap} conferido={inventarioData.estado_conservacao_confere} novo={inventarioData.estado_conservacao_novo} />
                            <ComparisonRow label="Responsável pelo Bem" suap={inventarioData.responsavel_suap} conferido={inventarioData.responsavel_confere} novo={inventarioData.responsavel_novo} />
                            <ComparisonRow
                                label="PENDÊNCIA DE CARGA"
                                suap="O campus inventariante é o mesmo da carga patrimonial ?"
                                conferido={inventarioData.campi_conciliados || 'SIM'}
                                novo={inventarioData.campus_inventariado}
                            />

                            <View style={styles.cardDivider} />

                            <View style={styles.obsBox}>
                                <Text style={styles.obsLabel}>Observações do Agente</Text>
                                <Text style={styles.obsText}>{inventarioData.observacoes || 'Nenhuma observação registrada pelo auditor.'}</Text>
                            </View>

                            <View style={styles.auditorInfo}>
                                <User size={12} color={Theme.colors.textSecondary} />
                                <Text style={styles.auditorText}>Auditado por: {inventarioData.profiles?.full_name || 'Agente Local'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                {!inventariado ? (
                    <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={() => navigation.navigate('InventarioForm', { tombo: patrimonio.numero, campus: patrimonio.campus })}
                    >
                        <Edit3 size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>INICIAR INVENTÁRIO</Text>
                    </TouchableOpacity>
                ) : (
                    (userProfile?.role === 'admin' || userProfile?.id === inventarioData?.user_id) && (
                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={() => navigation.navigate('InventarioForm', {
                                tombo: patrimonio.numero,
                                campus: patrimonio.campus,
                                isEdit: true,
                                inventarioId: inventarioData.id
                            })}
                        >
                            <Edit3 size={20} color={Theme.colors.primary} />
                            <Text style={styles.secondaryActionText}>EDITAR INVENTÁRIO</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>
        </View>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <View style={styles.infoItem}>
            {icon}
            <View>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{value || 'Indefinido'}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background, gap: 12 },
    loadingText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
    header: {
        height: 100,
        backgroundColor: Theme.colors.glass,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    headerTitle: { color: Theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    statusSection: { alignItems: 'center', marginBottom: 20 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
    },
    badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: Theme.colors.primary },
    badgeWarning: { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: Theme.colors.error },
    statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    mainCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 24,
    },
    tomboRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    tomboText: { color: Theme.colors.primary, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
    descriptionText: { color: Theme.colors.textPrimary, fontSize: 16, lineHeight: 24, fontWeight: '500' },
    divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 20 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: '45%' },
    infoLabel: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '600' },
    inventoryContainer: { gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    sectionTitle: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    photoGrid: { flexDirection: 'row', gap: 12 },
    photoCard: { flex: 1, aspectRatio: 1.2, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border },
    photo: { width: '100%', height: '100%' },
    photoTag: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    photoTagText: { color: '#fff', fontSize: 8, fontWeight: '900' },
    resultsCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    questionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    questionLabel: { color: Theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    questionValueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeYes: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    badgeNo: { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderWidth: 1, borderColor: 'rgba(244, 63, 148, 0.2)' },
    questionValueText: { fontSize: 12, fontWeight: '900' },
    textYes: { color: Theme.colors.primary },
    textNo: { color: Theme.colors.error },
    cardDivider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 12 },
    comparisonContainer: { marginBottom: 16 },
    comparisonLabel: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    comparisonBox: { backgroundColor: 'rgba(30, 41, 59, 0.2)', borderRadius: 16, padding: 12, gap: 8 },
    comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    compValueLabel: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '700', width: 60 },
    compValueText: { color: Theme.colors.textPrimary, fontSize: 12, flex: 1, fontWeight: '500' },
    compValueTextPrimary: { color: Theme.colors.primary, fontSize: 13, fontWeight: '700', flex: 1 },
    miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    miniBadgeText: { fontSize: 10, fontWeight: '900' },
    obsBox: { backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 16, padding: 16, marginBottom: 16 },
    obsLabel: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    obsText: { color: Theme.colors.textPrimary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
    auditorInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 },
    auditorText: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    primaryActionButton: {
        height: 56,
        backgroundColor: Theme.colors.primary,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    secondaryActionButton: {
        height: 56,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Theme.colors.primary,
    },
    secondaryActionText: { color: Theme.colors.primary, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
