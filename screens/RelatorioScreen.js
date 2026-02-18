import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, RefreshControl, Alert, TextInput, Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, Save, Edit3, Download, FileText, CheckCircle2, AlertCircle, Package, RefreshCw, MapPin, UserCheck, Hash, Wrench, Building2, Clock, Ban, Sticker, AlertTriangle, Eye, Layers, Plus, Trash2, Calendar, FileType, Code
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const REPORT_KEY = 'relatorio_reitoria_2025';

export default function RelatorioScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingHTML, setExportingHTML] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({});

    // Estados para cada seção do relatório
    const [comissao, setComissao] = useState([]);
    const [portaria, setPortaria] = useState('');
    const [periodo, setPeriodo] = useState({ inicio: '', termino: '', prazo: '' });
    const [metodologia, setMetodologia] = useState('');
    const [contabilidade, setContabilidade] = useState([]);
    const [achados, setAchados] = useState('');
    const [dificuldades, setDificuldades] = useState('');
    const [setoresInconsistentes, setSetoresInconsistentes] = useState([]);
    const [recomendacoes, setRecomendacoes] = useState('');
    const [parecer, setParecer] = useState('');
    const [anexos, setAnexos] = useState('');

    const [editingSection, setEditingSection] = useState(null); // 'topico1', 'topico2', etc.

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        if (!refreshing) setLoading(true);
        try {
            await Promise.all([loadStats(), loadReportData()]);
        } catch (err) {
            console.error('Error loading data:', err);
        }
        setLoading(false);
        setRefreshing(false);
    }

    async function loadReportData() {
        try {
            const { data, error } = await supabase
                .from('relatorio_estruturado')
                .select('*')
                .eq('chave', REPORT_KEY)
                .single();

            if (data) {
                setComissao(data.topico1_comissao || []);
                setPortaria(data.topico1_portaria || '');
                setPeriodo(data.topico2_periodo || { inicio: '', termino: '', prazo: '' });
                setMetodologia(data.topico3_metodologia || '');
                setContabilidade(data.topico5_contabilidade || []);
                setAchados(data.topico6_1_achados || '');
                setDificuldades(data.topico6_2_dificuldades || '');
                setSetoresInconsistentes(data.topico6_3_setores || []);
                setRecomendacoes(data.topico7_recomendacoes || '');
                setParecer(data.topico8_parecer || '');
                setAnexos(data.topico9_anexos || '');
            } else {
                // Initialize with values if DB is empty
                setComissao([
                    { funcao: "Presidente", nome: "Francisco Tomaz de Aquino Junior", siape: "2231581", email: "francisco.tomaz@ifce.edu.br" },
                    { funcao: "Secretário(a)", nome: "Ana Rebeca Coelho Mascarenhas Abdala", siape: "2231303", email: "pamella.rabelo@ifce.edu.br" },
                    { funcao: "Membro", nome: "Emanuel Araújo Bezerra", siape: "1985902", email: "emanuel.bezerra@ifce.edu.br" }
                ]);
                setPortaria('Portaria de designação: nº 1015/PROAP/REITORIA, de 2025.');
                setPeriodo({ inicio: '30/10/2025', termino: '31/01/2026', prazo: '93 dias' });
                setMetodologia('A Comissão de Inventário utilizou o método padronizado do IFCE, conforme orientações da Pró-Reitoria de Administração e Planejamento (PROAP), utilizando:\nApp digital para coleta de dados;\nFotografia digital de todos os bens inventariados;\nPlanilhas de controle com número de tombamento, localização, responsável e estado de conservação;\nIntegração dos resultados com os registros de Gestão patrimonial e conciliação contábil junto ao setor de Contabilidade.');
                setAchados('O inventário realizado na Reitoria identificou um total de 3.915 bens inventariados, dos quais 3.850 foram localizados e conferidos e 9 bens não foram localizados, sendo necessário procedimento de apuração para estes últimos.');
                setDificuldades('Durante o processo de inventário, a Comissão enfrentou as seguintes dificuldades operacionais: Implementação de novo sistema (App Sheets), período de férias em dezembro/janeiro, e etiquetas em más condições.');
                setSetoresInconsistentes([
                    { setor: 'PROAP - DEMAS - Depósito', total: '328', inconsistencias: 'Divergências de localização' },
                    { setor: 'Polo de Inovação', total: '144', inconsistencias: 'Divergências de responsável' },
                    { setor: 'Gabinete da Reitoria', total: '130', inconsistencias: 'Etiquetas e conservação' }
                ]);
                setRecomendacoes('1. Regularização cadastral dos bens com divergências no Sistema de gestão patrimonial.\n2. Abertura de processo de apuração para os bens não localizados.\n3. Encaminhamento dos bens inservíveis à Comissão de Desfazimento.\n4. Atualização e padronização das etiquetas patrimoniais.');
                setParecer('A Comissão conclui que o inventário de bens móveis referente ao exercício de 2025 foi realizado de forma satisfatória seguindo os padrões e metodologias estabelecidas pela PROAP.');
                setAnexos('Planilha em anexo, detalhando os pontos levantados de cada item encontrado.');
            }
        } catch (e) {
            console.error('Error fetching report data:', e);
        }
    }

    async function saveSection() {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('relatorio_estruturado')
                .upsert({
                    chave: REPORT_KEY,
                    topico1_comissao: comissao,
                    topico1_portaria: portaria,
                    topico2_periodo: periodo,
                    topico3_metodologia: metodologia,
                    topico5_contabilidade: contabilidade,
                    topico6_1_achados: achados,
                    topico6_2_dificuldades: dificuldades,
                    topico6_3_setores: setoresInconsistentes,
                    topico7_recomendacoes: recomendacoes,
                    topico8_parecer: parecer,
                    topico9_anexos: anexos,
                    ultima_atualizacao: new Date().toISOString()
                }, { onConflict: 'chave' });

            if (error) throw error;
            setEditingSection(null);
            Alert.alert('Sucesso', 'Seção salva com sucesso no banco de dados.');
        } catch (e) {
            console.error('Error saving:', e);
            Alert.alert('Erro', 'Não foi possível salvar as alterações.');
        }
        setSaving(false);
    }

    async function loadStats() {
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

            setStats({
                totalBens: totalBens || 0,
                totalInventariados: totalInventariados || 0,
                naoLocalizados,
                divSetor: items.filter(i => i.sala_nova && i.sala_nova.trim() !== '').length,
                divResponsavel: items.filter(i => i.responsavel_novo && i.responsavel_novo.trim() !== '').length,
                divSerie: items.filter(i => i.numero_serie_novo && i.numero_serie_novo.trim() !== '').length,
                divDesc: items.filter(i => i.descricao_nova && i.descricao_nova.trim() !== '').length,
                divEstado: items.filter(i => i.estado_conservacao_novo && i.estado_conservacao_novo.trim() !== '').length,
                irrecuperaveis: items.filter(i => {
                    const ec = (i.estado_conservacao_novo || '').toLowerCase();
                    return ec.includes('irrecuperável') || ec.includes('irrecuperavel') || ec.includes('antiecon');
                }).length,
                ociosos: items.filter(i => (i.estado_conservacao_novo || '').toLowerCase().includes('ocioso')).length,
                divCampus: items.filter(i => {
                    const cc = (i.campi_conciliados || '').toUpperCase();
                    return cc.includes('NÃO') || cc.includes('NAO');
                }).length,
                possuiEtiqueta: items.filter(i => (i.tem_etiqueta || '').toUpperCase() === 'SIM').length,
                etiquetaRasurada: items.filter(i => {
                    const se = (i.situacao_etiqueta || '').toLowerCase();
                    return se.includes('rasurada') || se.includes('descolando') || se.includes('fora do padr');
                }).length,
                etiquetaDificil: items.filter(i => {
                    const se = (i.situacao_etiqueta || '').toLowerCase();
                    return se.includes('dif') && se.includes('visualiza');
                }).length,
                etiquetaMultipla: items.filter(i => (i.situacao_etiqueta || '').toLowerCase().includes('multipla') || (i.situacao_etiqueta || '').toLowerCase().includes('múltipla')).length,
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }

    const getHTMLContent = () => {
        const htmlRow = (label, value) => `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px;">${label}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px; font-weight: bold; text-align: right;">${value}</td>
            </tr>
        `;

        const sectionHeaderHTML = (title) => `<tr><th colspan="2" style="background-color: #f1f8f5; color: #064e3b; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">${title}</th></tr>`;

        return `
        <html>
        <head><meta charset="utf-8"><style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .top-header { border-bottom: 2px solid #064e3b; padding-bottom: 15px; margin-bottom: 30px; }
            h1 { color: #064e3b; font-size: 20px; text-align: center; margin-bottom: 5px; }
            h2 { color: #555; font-size: 14px; text-align: center; margin-bottom: 0px; text-transform: uppercase; }
            .section-title { font-size: 16px; color: #064e3b; margin-top: 30px; border-left: 5px solid #064e3b; padding-left: 12px; margin-bottom: 15px; font-weight: bold; }
            p { font-size: 11px; white-space: pre-wrap; margin-bottom: 15px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f1f8f5; font-weight: bold; color: #064e3b; text-transform: uppercase; padding: 10px; border: 1px solid #ddd; font-size: 10px; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; font-size: 10px; }
            .footer { margin-top: 60px; font-size: 9px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
            .sub-section { font-size: 13px; font-weight: bold; color: #333; margin-top: 20px; margin-bottom: 10px; }
        </style></head>
        <body>
            <div class="top-header">
                <h1>INSTITUTO FEDERAL DO CEARÁ - REITORIA</h1>
                <h2>RELATÓRIO DE INVENTÁRIO PATRIMONIAL - 2025/2026</h2>
            </div>
            
            <div class="section-title">1. Identificação da Comissão de Inventário</div>
            <table>
                <thead><tr><th>Função</th><th>Nome Completo</th><th>SIA PE/Matrícula</th><th>E-mail</th></tr></thead>
                <tbody>
                    ${comissao.map(m => `<tr><td>${m.funcao}</td><td>${m.nome}</td><td>${m.siape}</td><td>${m.email}</td></tr>`).join('')}
                </tbody>
            </table>
            <p>${portaria}</p>
            
            <div class="section-title">2. Período de realização do inventário</div>
            <p>Início: ${periodo.inicio}\nTérmino: ${periodo.termino}\nPrazo total de execução: ${periodo.prazo}</p>
            
            <div class="section-title">3. Metodologia Adotada</div>
            <p>${metodologia}</p>
            
            <div class="section-title">4. Resultado geral do inventário</div>
            <table>
                <thead><tr><th style="width: 75%;">Descrição do Indicador</th><th style="text-align: right;">Quantidade</th></tr></thead>
                <tbody>
                    ${sectionHeaderHTML('Resumo Geral')}
                    ${htmlRow('Total de bens sob responsabilidade da unidade', stats.totalBens)}
                    ${htmlRow('Bens localizados e conferidos (inventariados)', stats.totalInventariados)}
                    ${htmlRow('Bens não localizados (não inventariados)', stats.naoLocalizados)}
                    
                    ${sectionHeaderHTML('Divergências')}
                    ${htmlRow('Divergência de setor (sala)', stats.divSetor)}
                    ${htmlRow('Divergência de responsável pela carga', stats.divResponsavel)}
                    ${htmlRow('Divergência de número de série', stats.divSerie)}
                    ${htmlRow('Divergência de descrição do bem', stats.divDesc)}
                    ${htmlRow('Divergência de estado de conservação', stats.divEstado)}
                    ${htmlRow('Divergência campus físico vs contábil', stats.divCampus)}
                    
                    ${sectionHeaderHTML('Estado de Conservação')}
                    ${htmlRow('Bens irrecuperáveis / antieconômicos', stats.irrecuperaveis)}
                    ${htmlRow('Bens ociosos', stats.ociosos)}
                    
                    ${sectionHeaderHTML('Etiqueta Patrimonial')}
                    ${htmlRow('Possui etiqueta de tombamento', stats.possuiEtiqueta)}
                    ${htmlRow('Etiqueta rasurada ou fora do padrão', stats.etiquetaRasurada)}
                    ${htmlRow('Etiqueta em local de difícil visualização', stats.etiquetaDificil)}
                    ${htmlRow('Múltiplas numerações', stats.etiquetaMultipla)}
                </tbody>
            </table>

            <div class="section-title">5. Compatibilidade contábil</div>
            <table>
                <thead><tr><th>CONTA CONTÁBIL</th><th>STATUS</th><th style="text-align: right;">VALOR TOTAL</th></tr></thead>
                <tbody>
                    ${contabilidade.map(c => `<tr><td>${c.conta}</td><td>${c.status}</td><td style="text-align: right;">${c.valor}</td></tr>`).join('')}
                </tbody>
            </table>
            
            <div class="section-title">6. Principais Constatações</div>
            <div class="sub-section">6.1 Principais Achados do Inventário</div>
            <p>${achados}</p>
            
            <div class="sub-section">6.2 Dificuldades Operacionais e Limitações</div>
            <p>${dificuldades}</p>

            <div class="sub-section">6.3 Setores com Maior Incidência de Inconsistências</div>
            <table>
                <thead><tr><th>Setor</th><th>Total de Bens</th><th>Principais Inconsistências</th></tr></thead>
                <tbody>
                    ${setoresInconsistentes.map(s => `<tr><td>${s.setor}</td><td>${s.total}</td><td>${s.inconsistencias}</td></tr>`).join('')}
                </tbody>
            </table>
            
            <div class="section-title">7. Recomendações</div>
            <p>${recomendacoes}</p>
            
            <div class="section-title">8. Parecer conclusivo da comissão</div>
            <p>${parecer}</p>
            
            <div class="section-title">9. Anexos Complementares</div>
            <p>${anexos}</p>

            <div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        </body>
        </html>`;
    };

    async function exportPDF() {
        setExporting(true);
        try {
            const html = getHTMLContent();
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (err) {
            console.error('Export error:', err);
            Alert.alert('Erro', 'Não foi possível exportar o PDF.');
        }
        setExporting(false);
    }

    async function exportHTML() {
        setExportingHTML(true);
        try {
            const html = getHTMLContent();
            const fileName = `Relatorio_Inventario_${REPORT_KEY}.html`;

            if (Platform.OS === 'web') {
                console.log('Exporting HTML for Web...');
                const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                Alert.alert('Sucesso', 'Download do relatório HTML iniciado.');
            } else {
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(fileUri, html);
                await Sharing.shareAsync(fileUri, { UTI: 'public.html', mimeType: 'text/html' });
            }
        } catch (err) {
            console.error('HTML Export error:', err);
            Alert.alert('Erro', 'Não foi possível exportar o arquivo HTML.');
        }
        setExportingHTML(false);
    }

    const SectionHeader = ({ num, title, id, icon: Icon = FileText }) => (
        <View style={styles.sectionHeaderWrap}>
            <View style={styles.sectionHeaderMain}>
                <View style={styles.sectionIconBox}>
                    <Icon size={18} color={Theme.colors.primary} />
                </View>
                <Text style={styles.sectionHeaderText}>{num}. {title}</Text>
            </View>
            <TouchableOpacity
                style={[styles.miniEditBtn, editingSection === id && styles.miniSaveBtn]}
                onPress={() => editingSection === id ? saveSection() : setEditingSection(id)}
            >
                {editingSection === id ? (
                    saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={14} color="#fff" />
                ) : (
                    <Edit3 size={14} color={Theme.colors.primary} />
                )}
                <Text style={[styles.miniEditBtnText, editingSection === id && { color: '#fff' }]}>
                    {editingSection === id ? 'SALVAR' : 'EDITAR'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Sincronizando dados...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.appHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                    <ArrowLeft size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Relatório do Inventário</Text>
                    <Text style={styles.headerSubtitle}>GESTÃO DE DADOS E EXPORTAÇÃO</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={exportHTML} style={[styles.headerIconButton, styles.codeButton]} disabled={exportingHTML}>
                        {exportingHTML ? <ActivityIndicator size="small" color="#fff" /> : <Code size={20} color="#fff" />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportPDF} style={[styles.headerIconButton, styles.exportButton]} disabled={exporting}>
                        {exporting ? <ActivityIndicator size="small" color="#fff" /> : <Download size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Theme.colors.primary} />}
            >
                {/* Tópico 1 */}
                <View style={styles.card}>
                    <SectionHeader num="1" title="Comissão de Inventário" id="topico1" icon={UserCheck} />

                    {editingSection === 'topico1' ? (
                        <View>
                            {comissao.map((m, idx) => (
                                <View key={idx} style={styles.memberEditForm}>
                                    <TextInput style={styles.input} value={m.nome} onChangeText={(val) => {
                                        const newC = [...comissao]; newC[idx].nome = val; setComissao(newC);
                                    }} placeholder="Nome Completo" placeholderTextColor="#555" />
                                    <View style={styles.memberFormRow}>
                                        <TextInput style={[styles.input, { flex: 0.5 }]} value={m.funcao} onChangeText={(val) => {
                                            const newC = [...comissao]; newC[idx].funcao = val; setComissao(newC);
                                        }} placeholder="Função" placeholderTextColor="#555" />
                                        <TextInput style={[styles.input, { flex: 0.5 }]} value={m.siape} onChangeText={(val) => {
                                            const newC = [...comissao]; newC[idx].siape = val; setComissao(newC);
                                        }} placeholder="SIA PE" placeholderTextColor="#555" />
                                    </View>
                                    <View style={[styles.memberFormRow, { marginTop: 0 }]}>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={m.email} onChangeText={(val) => {
                                            const newC = [...comissao]; newC[idx].email = val; setComissao(newC);
                                        }} placeholder="E-mail Institucional" placeholderTextColor="#555" />
                                        <TouchableOpacity onPress={() => setComissao(comissao.filter((_, i) => i !== idx))} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addMemberBtn} onPress={() => setComissao([...comissao, { funcao: 'Membro', nome: '', siape: '', email: '' }])}>
                                <Plus size={16} color={Theme.colors.primary} />
                                <Text style={styles.addMemberBtnText}>ADICIONAR MEMBRO</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Portaria de Designação</Text>
                            <TextInput
                                style={[styles.input, { minHeight: 60 }]}
                                multiline
                                value={portaria}
                                onChangeText={setPortaria}
                                placeholderTextColor="#555"
                            />
                        </View>
                    ) : (
                        <View style={styles.previewTable}>
                            <View style={[styles.row, styles.tableHeader]}>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Função</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.7 }]}>Nome</Text>
                            </View>
                            {comissao.map((m, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={[styles.cell, { flex: 0.3 }]}>{m.funcao}</Text>
                                    <Text style={[styles.cell, { flex: 0.7 }]}>{m.nome}</Text>
                                </View>
                            ))}
                            <Text style={styles.portariaText}>{portaria}</Text>
                        </View>
                    )}
                </View>

                {/* Tópico 2 */}
                <View style={styles.card}>
                    <SectionHeader num="2" title="Período de Realização" id="topico2" icon={Calendar} />
                    {editingSection === 'topico2' ? (
                        <View style={styles.periodEditRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.labelMini}>INÍCIO</Text>
                                <TextInput style={styles.input} value={periodo.inicio} onChangeText={v => setPeriodo({ ...periodo, inicio: v })} placeholder="dd/mm/aaaa" />
                            </View>
                            <View style={{ flex: 1, marginHorizontal: 10 }}>
                                <Text style={styles.labelMini}>TÉRMINO</Text>
                                <TextInput style={styles.input} value={periodo.termino} onChangeText={v => setPeriodo({ ...periodo, termino: v })} placeholder="dd/mm/aaaa" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.labelMini}>PRAZO</Text>
                                <TextInput style={styles.input} value={periodo.prazo} onChangeText={v => setPeriodo({ ...periodo, prazo: v })} placeholder="90 dias" />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.periodPreview}>
                            <View style={styles.periodItem}>
                                <Text style={styles.periodLabel}>INÍCIO</Text>
                                <Text style={styles.periodVal}>{periodo.inicio}</Text>
                            </View>
                            <View style={styles.dividerV} />
                            <View style={styles.periodItem}>
                                <Text style={styles.periodLabel}>TÉRMINO</Text>
                                <Text style={styles.periodVal}>{periodo.termino}</Text>
                            </View>
                            <View style={styles.dividerV} />
                            <View style={styles.periodItem}>
                                <Text style={styles.periodLabel}>PRAZO</Text>
                                <Text style={styles.periodVal}>{periodo.prazo}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Tópico 3 */}
                <View style={styles.card}>
                    <SectionHeader num="3" title="Metodologia Adotada" id="topico3" icon={FileType} />
                    {editingSection === 'topico3' ? (
                        <TextInput style={styles.textArea} multiline value={metodologia} onChangeText={setMetodologia} />
                    ) : (
                        <Text style={styles.reportText}>{metodologia}</Text>
                    )}
                </View>

                {/* Tópico 4 */}
                <View style={[styles.card, { backgroundColor: 'rgba(16, 185, 129, 0.03)' }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleWithIcon}>
                            <RefreshCw size={18} color={Theme.colors.primary} />
                            <Text style={styles.cardTitle}>4. Resultado geral (Dados Ao Vivo)</Text>
                        </View>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>SINCRO</Text>
                        </View>
                    </View>
                    <View style={styles.previewTable}>
                        <View style={[styles.row, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}><Text style={styles.tableCategoryTitle}>📦 RESUMO GERAL</Text></View>
                        <StatRow label="Bens sob responsabilidade" value={stats.totalBens} />
                        <StatRow label="Bens conferidos (inventariados)" value={stats.totalInventariados} highlight={Theme.colors.primary} />
                        <StatRow label="Bens não localizados" value={stats.naoLocalizados} highlight={Theme.colors.error} />

                        <View style={[styles.row, { backgroundColor: 'rgba(245, 158, 11, 0.1)', marginTop: 10 }]}><Text style={[styles.tableCategoryTitle, { color: '#f59e0b' }]}>⚠️ DIVERGÊNCIAS</Text></View>
                        <StatRow label="Divergência de setor (sala)" value={stats.divSetor} />
                        <StatRow label="Divergência de responsável" value={stats.divResponsavel} />
                        <StatRow label="Divergência de número de série" value={stats.divSerie} />
                        <StatRow label="Divergência de descrição" value={stats.divDesc} />
                        <StatRow label="Divergência estado conservação" value={stats.divEstado} />
                        <StatRow label="Divergência campus físico/contábil" value={stats.divCampus} />

                        <View style={[styles.row, { backgroundColor: 'rgba(244, 63, 148, 0.1)', marginTop: 10 }]}><Text style={[styles.tableCategoryTitle, { color: Theme.colors.error }]}>🔧 ESTADO DE CONSERVAÇÃO</Text></View>
                        <StatRow label="Bens Irrecuperáveis" value={stats.irrecuperaveis} highlight={Theme.colors.error} />
                        <StatRow label="Bens Ociosos" value={stats.ociosos} />

                        <View style={[styles.row, { backgroundColor: 'rgba(59, 130, 246, 0.1)', marginTop: 10 }]}><Text style={[styles.tableCategoryTitle, { color: '#3b82f6' }]}>🏷️ ETIQUETA PATRIMONIAL</Text></View>
                        <StatRow label="Possui etiqueta de tombamento" value={stats.possuiEtiqueta} />
                        <StatRow label="Etiqueta rasurada/fora padrão" value={stats.etiquetaRasurada} />
                        <StatRow label="Local de difícil visualização" value={stats.etiquetaDificil} />
                        <StatRow label="Múltiplas numerações" value={stats.etiquetaMultipla} border={false} />
                    </View>
                </View>

                {/* Tópico 5 */}
                <View style={styles.card}>
                    <SectionHeader num="5" title="Compatibilidade Contábil" id="topico5" icon={Building2} />
                    {editingSection === 'topico5' ? (
                        <View>
                            {contabilidade.map((c, i) => (
                                <View key={i} style={styles.memberFormRow}>
                                    <TextInput style={[styles.input, { flex: 0.4 }]} value={c.conta} onChangeText={v => { const n = [...contabilidade]; n[i].conta = v; setContabilidade(n); }} placeholder="Conta" />
                                    <TextInput style={[styles.input, { flex: 0.3 }]} value={c.status} onChangeText={v => { const n = [...contabilidade]; n[i].status = v; setContabilidade(n); }} placeholder="Status" />
                                    <TextInput style={[styles.input, { flex: 0.3 }]} value={c.valor} onChangeText={v => { const n = [...contabilidade]; n[i].valor = v; setContabilidade(n); }} placeholder="R$" />
                                    <TouchableOpacity onPress={() => setContabilidade(contabilidade.filter((_, idx) => idx !== i))}>
                                        <Trash2 size={16} color={Theme.colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addMemberBtn} onPress={() => setContabilidade([...contabilidade, { conta: '', status: 'Encontrado', valor: 'R$ 0,00' }])}>
                                <Plus size={16} color={Theme.colors.primary} />
                                <Text style={styles.addMemberBtnText}>ADICIONAR CONTA</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.previewTable}>
                            <View style={[styles.row, styles.tableHeader]}>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.4 }]}>Conta</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Status</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.3, textAlign: 'right' }]}>Valor</Text>
                            </View>
                            {contabilidade.map((c, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={[styles.cell, { flex: 0.4 }]}>{c.conta}</Text>
                                    <Text style={[styles.cell, { flex: 0.3 }]}>{c.status}</Text>
                                    <Text style={[styles.cell, { flex: 0.3, textAlign: 'right' }]}>{c.valor}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Tópico 6 */}
                <View style={styles.card}>
                    <SectionHeader num="6" title="Principais Constatações" id="topico6" icon={AlertCircle} />
                    <Text style={styles.sublabel}>6.1 Principais Achados</Text>
                    {editingSection === 'topico6' ? (
                        <TextInput style={styles.textArea} multiline value={achados} onChangeText={setAchados} />
                    ) : (
                        <Text style={styles.reportText}>{achados}</Text>
                    )}
                    <Text style={[styles.sublabel, { marginTop: 15 }]}>6.2 Dificuldades Operacionais</Text>
                    {editingSection === 'topico6' ? (
                        <TextInput style={styles.textArea} multiline value={dificuldades} onChangeText={setDificuldades} />
                    ) : (
                        <Text style={styles.reportText}>{dificuldades}</Text>
                    )}

                    <Text style={[styles.sublabel, { marginTop: 15 }]}>6.3 Setores com Inconsistências</Text>
                    {editingSection === 'topico6' ? (
                        <View>
                            {setoresInconsistentes.map((s, idx) => (
                                <View key={idx} style={[styles.memberEditForm, { backgroundColor: 'rgba(245, 158, 11, 0.05)' }]}>
                                    <TextInput style={styles.input} value={s.setor} onChangeText={(val) => {
                                        const newS = [...setoresInconsistentes]; newS[idx].setor = val; setSetoresInconsistentes(newS);
                                    }} placeholder="Setor" />
                                    <View style={styles.memberFormRow}>
                                        <TextInput style={[styles.input, { flex: 0.3 }]} value={s.total} onChangeText={(val) => {
                                            const newS = [...setoresInconsistentes]; newS[idx].total = val; setSetoresInconsistentes(newS);
                                        }} placeholder="Total Bens" keyboardType="numeric" />
                                        <TextInput style={[styles.input, { flex: 0.7 }]} value={s.inconsistencias} onChangeText={(val) => {
                                            const newS = [...setoresInconsistentes]; newS[idx].inconsistencias = val; setSetoresInconsistentes(newS);
                                        }} placeholder="Principais Inconsistências" />
                                        <TouchableOpacity onPress={() => setSetoresInconsistentes(setoresInconsistentes.filter((_, i) => i !== idx))}>
                                            <Trash2 size={16} color={Theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addMemberBtn} onPress={() => setSetoresInconsistentes([...setoresInconsistentes, { setor: '', total: '', inconsistencias: '' }])}>
                                <Plus size={16} color={Theme.colors.primary} />
                                <Text style={styles.addMemberBtnText}>ADICIONAR SETOR</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.previewTable}>
                            <View style={[styles.row, styles.tableHeader]}>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.5 }]}>Setor</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.2 }]}>Bens</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Resumo</Text>
                            </View>
                            {setoresInconsistentes.map((s, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={[styles.cell, { flex: 0.5 }]}>{s.setor}</Text>
                                    <Text style={[styles.cell, { flex: 0.2 }]}>{s.total}</Text>
                                    <Text style={[styles.cell, { flex: 0.3 }]}>{s.inconsistencias}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Tópicos 7, 8 e 9 */}
                {[
                    { num: '7', title: 'Recomendações', id: 'topico7', val: recomendacoes, set: setRecomendacoes, icon: CheckCircle2 },
                    { num: '8', title: 'Parecer Conclusivo', id: 'topico8', val: parecer, set: setParecer, icon: Package },
                    { num: '9', title: 'Anexos Complementares', id: 'topico9', val: anexos, set: setAnexos, icon: Layers },
                ].map((sec) => (
                    <View key={sec.id} style={styles.card}>
                        <SectionHeader num={sec.num} title={sec.title} id={sec.id} icon={sec.icon} />
                        {editingSection === sec.id ? (
                            <TextInput style={styles.textArea} multiline value={sec.val} onChangeText={sec.set} />
                        ) : (
                            <Text style={styles.reportText}>{sec.val}</Text>
                        )}
                    </View>
                ))}

                <View style={{ height: 160 }} />
            </ScrollView>

            <View style={styles.footerFloat}>
                <View style={styles.footerActions}>
                    <TouchableOpacity style={[styles.pdfFullBtn, { flex: 0.4, backgroundColor: '#4b5563' }]} onPress={exportHTML} disabled={exportingHTML}>
                        {exportingHTML ? <ActivityIndicator size="small" color="#fff" /> : <Code size={20} color="#fff" />}
                        <Text style={styles.pdfFullBtnText}>CÓDIGO HTML</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pdfFullBtn, { flex: 0.6 }]} onPress={exportPDF} disabled={exporting}>
                        {exporting ? <ActivityIndicator size="small" color="#fff" /> : <Download size={20} color="#fff" />}
                        <Text style={styles.pdfFullBtnText}>PDF PROFISSIONAL</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function StatRow({ label, value, highlight, border = true }) {
    return (
        <View style={[styles.previewTableRow, border === false && { borderBottomWidth: 0 }]}>
            <Text style={styles.tableRowLabel}>{label}</Text>
            <Text style={[styles.tableRowValue, highlight ? { color: highlight } : { color: '#fff' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    appHeader: {
        height: 100, backgroundColor: Theme.colors.surface,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: Theme.colors.border,
    },
    headerIconButton: {
        width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border,
    },
    exportButton: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.3)' },
    codeButton: { backgroundColor: 'rgba(75, 85, 99, 0.2)', borderColor: 'rgba(75, 85, 99, 0.3)' },
    headerTitleContainer: { flex: 1, marginLeft: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' },
    headerSubtitle: { fontSize: 10, color: Theme.colors.primary, fontWeight: '700', marginTop: 2 },
    content: { flex: 1, padding: 16 },
    card: {
        backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 16,
    },
    sectionHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionHeaderMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
    sectionHeaderText: { fontSize: 15, fontWeight: '900', color: '#fff' },
    miniEditBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', flexDirection: 'row', alignItems: 'center', gap: 6 },
    miniSaveBtn: { backgroundColor: Theme.colors.primary },
    miniEditBtnText: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary },
    reportText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18, textAlign: 'justify' },
    textArea: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 15, color: '#fff', fontSize: 13, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Theme.colors.primary },
    input: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    label: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 6, marginTop: 10 },
    labelMini: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
    previewTable: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, paddingHorizontal: 12 },
    tableHeader: { backgroundColor: 'rgba(255,255,255,0.03)' },
    cell: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
    headerCell: { fontWeight: 'bold', color: Theme.colors.primary, textTransform: 'uppercase', fontSize: 9 },
    portariaText: { fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    memberEditForm: { padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
    memberFormRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 10, justifyContent: 'center', marginTop: 5 },
    addMemberBtnText: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary },
    trashBtn: { padding: 8 },
    periodEditRow: { flexDirection: 'row', justifyContent: 'space-between' },
    periodPreview: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    periodItem: { flex: 1, alignItems: 'center' },
    periodLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
    periodVal: { fontSize: 13, fontWeight: 'bold', color: Theme.colors.primary },
    dividerV: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: '#fff' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.primary },
    liveText: { fontSize: 9, fontWeight: '900', color: Theme.colors.primary },
    previewTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    tableRowLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 0.8 },
    tableRowValue: { fontSize: 13, fontWeight: '900' },
    tableCategoryTitle: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1 },
    sublabel: { fontSize: 12, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8 },
    footerFloat: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: Theme.colors.background, borderTopWidth: 1, borderTopColor: Theme.colors.border },
    footerActions: { flexDirection: 'row', gap: 12 },
    pdfFullBtn: { backgroundColor: Theme.colors.primary, padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
    pdfFullBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.2 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
    loadingText: { marginTop: 12, color: Theme.colors.textSecondary, fontSize: 14 },
});
