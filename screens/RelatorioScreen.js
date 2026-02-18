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
import * as FileSystem from 'expo-file-system';

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
                <td style="padding: 10px; border: 1px solid #bbb; font-size: 11px; color: #000;">${label}</td>
                <td style="padding: 10px; border: 1px solid #bbb; font-size: 11px; font-weight: bold; text-align: right; color: #000;">${value}</td>
            </tr>
        `;

        const sectionHeaderHTML = (title) => `<tr><th colspan="2" style="background-color: #f1f8f5; color: #064e3b; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; border: 1px solid #bbb;">${title}</th></tr>`;

        return `
        <html>
        <head><meta charset="utf-8"><style>
            @media print { body { padding: 0; margin: 0; } }
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #000; line-height: 1.5; background: #fff; }
            .top-header { border-bottom: 3px solid #064e3b; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            h1 { color: #064e3b; font-size: 22px; margin-bottom: 5px; font-weight: bold; }
            h2 { color: #222; font-size: 15px; margin-bottom: 0px; text-transform: uppercase; font-weight: bold; }
            .section-title { font-size: 16px; color: #064e3b; margin-top: 30px; border-left: 6px solid #064e3b; padding-left: 12px; margin-bottom: 15px; font-weight: bold; background-color: #f9f9f9; padding-top: 5px; padding-bottom: 5px; }
            p { font-size: 12px; white-space: pre-wrap; margin-bottom: 15px; text-align: justify; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
            th { background-color: #f1f8f5; font-weight: bold; color: #064e3b; text-transform: uppercase; padding: 10px; border: 1px solid #bbb; font-size: 10px; text-align: left; }
            td { padding: 8px; border: 1px solid #bbb; font-size: 10px; color: #000; overflow-wrap: break-word; }
            .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #000; border-top: 1px solid #bbb; padding-top: 15px; }
            .sub-section { font-size: 14px; font-weight: bold; color: #000; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
            .highlight { font-weight: bold; color: #064e3b; }
        </style></head>
        <body>
            <div class="top-header">
                <h1>INSTITUTO FEDERAL DO CEARÁ - REITORIA</h1>
                <h2>RELATÓRIO DE INVENTÁRIO PATRIMONIAL - 2025/2026</h2>
            </div>
            
            <div class="section-title">1. Identificação da Comissão de Inventário</div>
            <table>
                <thead><tr><th style="width: 20%;">Função</th><th style="width: 35%;">Nome Completo</th><th style="width: 15%;">SIA PE</th><th style="width: 30%;">E-mail</th></tr></thead>
                <tbody>
                    ${comissao.map(m => `<tr><td>${m.funcao}</td><td class="highlight">${m.nome}</td><td>${m.siape}</td><td>${m.email}</td></tr>`).join('')}
                </tbody>
            </table>
            <p>${portaria}</p>
            
            <div class="section-title">2. Período de realização do inventário</div>
            <p><span class="highlight">Início:</span> ${periodo.inicio} | <span class="highlight">Término:</span> ${periodo.termino}\n<span class="highlight">Prazo total de execução:</span> ${periodo.prazo}</p>
            
            <div class="section-title">3. Metodologia Adotada</div>
            <p>${metodologia}</p>
            
            <div class="section-title">4. Resultado geral do inventário</div>
            <table>
                <thead><tr><th style="width: 75%;">Descrição do Indicador</th><th style="text-align: right; width: 25%;">Quantidade</th></tr></thead>
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
                <thead><tr><th style="width: 50%;">CONTA CONTÁBIL</th><th style="width: 25%;">STATUS</th><th style="text-align: right; width: 25%;">VALOR TOTAL</th></tr></thead>
                <tbody>
                    ${contabilidade.length > 0 ? contabilidade.map(c => `<tr><td>${c.conta}</td><td>${c.status}</td><td style="text-align: right; font-weight: bold;">${c.valor}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align: center;">Nenhum dado contábil registrado</td></tr>'}
                </tbody>
            </table>
            
            <div class="section-title">6. Principais Constatações</div>
            <div class="sub-section">6.1 Principais Achados do Inventário</div>
            <p>${achados}</p>
            
            <div class="sub-section">6.2 Dificuldades Operacionais e Limitações</div>
            <p>${dificuldades}</p>

            <div class="sub-section">6.3 Setores com Maior Incidência de Inconsistências</div>
            <table>
                <thead><tr><th style="width: 35%;">Setor</th><th style="width: 15%;">Total de Bens</th><th style="width: 50%;">Principais Inconsistências</th></tr></thead>
                <tbody>
                    ${setoresInconsistentes.map(s => `<tr><td class="highlight">${s.setor}</td><td>${s.total}</td><td>${s.inconsistencias}</td></tr>`).join('')}
                </tbody>
            </table>
            
            <div class="section-title">7. Recomendações</div>
            <p>${recomendacoes}</p>
            
            <div class="section-title">8. Parecer conclusivo da comissão</div>
            <p>${parecer}</p>
            
            <div class="section-title">9. Anexos Complementares</div>
            <p>${anexos}</p>

            <div class="footer">Documento oficial gerado pelo Sistema de Inventário IFCE\nGerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        </body>
        </html>`;
    };

    async function exportPDF() {
        setExporting(true);
        try {
            const html = getHTMLContent();
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

    async function exportHTML() {
        setExportingHTML(true);
        try {
            const html = getHTMLContent();
            const fileName = `Relatorio_Inventario_${REPORT_KEY}.html`;

            if (Platform.OS === 'web') {
                const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                alert('Sucesso: Download do relatório HTML iniciado.');
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

    const StatRow = ({ label, value, highlight, border = true }) => (
        <View style={[styles.row, border && styles.borderBottom]}>
            <Text style={styles.cellLabel}>{label}</Text>
            <Text style={[styles.cellValue, highlight && { color: highlight }]}>{value}</Text>
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.appTitle}>Relatório Estruturado</Text>
                    <Text style={styles.appSubtitle}>Exercício 2025/2026</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={exportHTML} style={styles.headerIconBtn} disabled={exportingHTML}>
                        {exportingHTML ? <ActivityIndicator size="small" color="#fff" /> : <Code size={20} color="#fff" />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportPDF} style={styles.headerIconBtn} disabled={exporting}>
                        {exporting ? <ActivityIndicator size="small" color="#fff" /> : <Download size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
            >
                <View style={styles.infoCard}>
                    <View style={styles.infoIcon}>
                        <AlertCircle size={20} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.infoText}>
                        Este relatório consolida os dados coletados durante o inventário. Você pode editar cada seção antes de exportar o documento final.
                    </Text>
                </View>

                {/* Tópico 1 */}
                <View style={styles.card}>
                    <SectionHeader num="1" title="Comissão de Inventário" id="topico1" icon={UserCheck} />

                    {editingSection === 'topico1' ? (
                        <View>
                            {comissao.map((m, i) => (
                                <View key={i} style={styles.memberEditForm}>
                                    <TextInput style={styles.input} value={m.funcao} onChangeText={v => { const n = [...comissao]; n[i].funcao = v; setComissao(n); }} placeholder="Função" />
                                    <TextInput style={styles.input} value={m.nome} onChangeText={v => { const n = [...comissao]; n[i].nome = v; setComissao(n); }} placeholder="Nome" />
                                    <View style={styles.memberFormRow}>
                                        <TextInput style={[styles.input, { flex: 0.4 }]} value={m.siape} onChangeText={v => { const n = [...comissao]; n[i].siape = v; setComissao(n); }} placeholder="SIAPE" />
                                        <TextInput style={[styles.input, { flex: 0.6 }]} value={m.email} onChangeText={v => { const n = [...comissao]; n[i].email = v; setComissao(n); }} placeholder="E-mail" />
                                        <TouchableOpacity onPress={() => setComissao(comissao.filter((_, idx) => idx !== i))}>
                                            <Trash2 size={16} color={Theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addMemberBtn} onPress={() => setComissao([...comissao, { funcao: '', nome: '', siape: '', email: '' }])}>
                                <Plus size={16} color={Theme.colors.primary} />
                                <Text style={styles.addMemberBtnText}>ADICIONAR MEMBRO</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.previewTable}>
                            <View style={[styles.row, styles.tableHeader]}>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Função</Text>
                                <Text style={[styles.cell, styles.headerCell, { flex: 0.7 }]}>Membro</Text>
                            </View>
                            {comissao.map((m, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={[styles.cell, { flex: 0.3 }]}>{m.funcao}</Text>
                                    <View style={{ flex: 0.7, padding: 8 }}>
                                        <Text style={styles.memberName}>{m.nome}</Text>
                                        <Text style={styles.memberInfo}>SIAPE: {m.siape} | {m.email}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.sublabel}>Portaria de Designação</Text>
                    {editingSection === 'topico1' ? (
                        <TextInput style={styles.input} multiline value={portaria} onChangeText={setPortaria} />
                    ) : (
                        <Text style={styles.reportText}>{portaria}</Text>
                    )}
                </View>

                {/* Tópico 2 */}
                <View style={styles.card}>
                    <SectionHeader num="2" title="Período de Realização" id="topico2" icon={Calendar} />
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.sublabel}>Início</Text>
                            {editingSection === 'topico2' ? (
                                <TextInput style={styles.input} value={periodo.inicio} onChangeText={t => setPeriodo({ ...periodo, inicio: t })} />
                            ) : (
                                <Text style={styles.reportText}>{periodo.inicio}</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sublabel}>Término</Text>
                            {editingSection === 'topico2' ? (
                                <TextInput style={styles.input} value={periodo.termino} onChangeText={t => setPeriodo({ ...periodo, termino: t })} />
                            ) : (
                                <Text style={styles.reportText}>{periodo.termino}</Text>
                            )}
                        </View>
                    </View>
                    <Text style={[styles.sublabel, { marginTop: 10 }]}>Prazo de Execução</Text>
                    {editingSection === 'topico2' ? (
                        <TextInput style={styles.input} value={periodo.prazo} onChangeText={t => setPeriodo({ ...periodo, prazo: t })} />
                    ) : (
                        <Text style={styles.reportText}>{periodo.prazo}</Text>
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
                        <Text style={styles.pdfFullBtnText}>EXPORTAR PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748b' },
    appHeader: {
        backgroundColor: Theme.colors.primary,
        paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    backBtn: { marginRight: 15 },
    appTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    appSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    headerActions: { flexDirection: 'row' },
    headerIconBtn: { marginLeft: 15, padding: 5 },
    content: { flex: 1, padding: 15 },
    infoCard: {
        backgroundColor: '#f1f5f9', borderRadius: 12, padding: 15,
        flexDirection: 'row', marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Theme.colors.primary
    },
    infoIcon: { marginRight: 12, paddingTop: 2 },
    infoText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 18 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    titleWithIcon: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.primary, marginRight: 5 },
    liveText: { fontSize: 9, fontWeight: 'bold', color: Theme.colors.primary },
    sectionHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionHeaderMain: { flexDirection: 'row', alignItems: 'center' },
    sectionIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionHeaderText: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    miniEditBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f1f5f9' },
    miniSaveBtn: { backgroundColor: Theme.colors.primary },
    miniEditBtnText: { fontSize: 10, fontWeight: 'bold', color: Theme.colors.primary, marginLeft: 4 },
    sublabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 15, marginBottom: 5, textTransform: 'uppercase' },
    reportText: { fontSize: 14, color: '#334155', lineHeight: 22 },
    textArea: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc', minHeight: 100, textAlignVertical: 'top' },
    input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 8 },
    previewTable: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', marginTop: 10 },
    tableHeader: { backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    row: { flexDirection: 'row', alignItems: 'center' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cell: { padding: 10, fontSize: 12, color: '#475569' },
    headerCell: { fontWeight: 'bold', color: '#1e293b' },
    cellLabel: { flex: 1, padding: 10, fontSize: 12, color: '#64748b' },
    cellValue: { padding: 10, fontSize: 13, fontWeight: 'bold', color: '#1e293b', textAlign: 'right' },
    tableCategoryTitle: { fontSize: 10, fontWeight: 'bold', color: Theme.colors.primary, padding: 6 },
    memberName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
    memberInfo: { fontSize: 11, color: '#64748b', marginTop: 2 },
    memberEditForm: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    memberFormRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, marginTop: 5 },
    addMemberBtnText: { fontSize: 11, fontWeight: 'bold', color: Theme.colors.primary, marginLeft: 6 },
    footerFloat: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(255,255,255,0.9)' },
    footerActions: { flexDirection: 'row', gap: 10 },
    pdfFullBtn: { backgroundColor: Theme.colors.primary, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
    pdfFullBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 10 }
});