import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Theme } from '../constants/Theme';
import { ArrowLeft, FileSpreadsheet, FileText, Download } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export default function ExportarInventarioScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    async function fetchInventoryData() {
        const { data, error } = await supabase
            .from('inventario')
            .select(`
                *,
                profiles:user_id (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }
        return data || [];
    }

    async function exportExcel() {
        setLoading(true);
        try {
            const data = await fetchInventoryData();
            if (data.length === 0) {
                Alert.alert('Aviso', 'Não há dados para exportar.');
                setLoading(false);
                return;
            }

            // Flatten data for export (mantendo os nomes originais das colunas)
            const exportData = data.map(item => ({
                id: item.id,
                tombo: item.tombo,
                descricao_suap: item.descricao_suap,
                descricao_nova: item.descricao_nova,
                local_suap: item.sala_suap,
                local_novo: item.sala_nova,
                responsavel_suap: item.responsavel_suap,
                responsavel_novo: item.responsavel_novo,
                estado_conservacao: item.estado_conservacao_novo,
                situacao_etiqueta: item.situacao_etiqueta,
                campus: item.campus_inventariado,
                data_inventario: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '',
                inventariante_nome: item.profiles?.full_name || '',
                inventariante_email: item.profiles?.email || ''
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventario");

            if (Platform.OS === 'web') {
                // Correção robusta para download no navegador
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'inventario_ifce.xlsx';
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                // No Web, o Alert.alert do React Native pode falhar. Usando alert nativo.
                if (typeof alert !== 'undefined') {
                    alert('Sucesso: O download da planilha Excel foi iniciado.');
                }
            } else {
                // Mobile (iOS/Android)
                const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
                const uri = FileSystem.cacheDirectory + 'inventario_ifce.xlsx';
                await FileSystem.writeAsStringAsync(uri, wbout, {
                    encoding: FileSystem.EncodingType.Base64
                });

                await Sharing.shareAsync(uri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Exportar Inventário Excel'
                });
            }

        } catch (error) {
            console.error('Erro na exportação Excel:', error);
            const errorMsg = 'Falha ao exportar Excel: ' + error.message;
            if (Platform.OS === 'web') {
                alert(errorMsg);
            } else {
                Alert.alert('Erro', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }

    async function exportCSV() {
        setLoading(true);
        try {
            const data = await fetchInventoryData();
            if (data.length === 0) {
                Alert.alert('Aviso', 'Não há dados para exportar.');
                setLoading(false);
                return;
            }

            // Flatten data (mantendo nomes originais das colunas conforme código inicial)
            const exportData = data.map(item => ({
                tombo: item.tombo,
                descricao: item.descricao_nova || item.descricao_suap || '',
                local: item.sala_nova || item.sala_suap || '',
                responsavel: item.responsavel_novo || item.responsavel_suap || '',
                estado: item.estado_conservacao_novo || '',
                campus: item.campus_inventariado || '',
                data: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '',
                inventariante: item.profiles?.full_name || ''
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);

            if (Platform.OS === 'web') {
                // Adicionando BOM para compatibilidade de acentos no Excel Windows
                const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inventario_ifce.csv';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                alert('Sucesso: O download do arquivo CSV foi iniciado.');
            } else {
                const uri = FileSystem.cacheDirectory + 'inventario_ifce.csv';
                await FileSystem.writeAsStringAsync(uri, csv, {
                    encoding: FileSystem.EncodingType.UTF8
                });

                await Sharing.shareAsync(uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Exportar Inventário CSV'
                });
            }

        } catch (error) {
            console.error('Erro na exportação CSV:', error);
            const errorMsg = 'Falha ao exportar CSV: ' + error.message;
            if (Platform.OS === 'web') {
                alert(errorMsg);
            } else {
                Alert.alert('Erro', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }

    async function exportPDF() {
        setLoading(true);
        try {
            const data = await fetchInventoryData();
            if (data.length === 0) {
                Alert.alert('Aviso', 'Não há dados para exportar.');
                setLoading(false);
                return;
            }

            const rows = data.map((item) => {
                const user = item.profiles?.full_name || item.profiles?.email || 'N/A';
                const date = new Date(item.created_at).toLocaleDateString('pt-BR');
                return `
                    <tr>
                        <td>${item.tombo || '-'}</td>
                        <td>${item.descricao_nova || item.descricao_suap || '-'}</td>
                        <td>${item.sala_nova || item.sala_suap || '-'}</td>
                        <td>${item.responsavel_novo || item.responsavel_suap || '-'}</td>
                        <td>${item.estado_conservacao_novo || '-'}</td>
                        <td>${user}</td>
                        <td>${date}</td>
                    </tr>
                `;
            }).join('');

            const html = `
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
                        h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; font-size: 10px; }
                        th { background-color: #f1f5f9; text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; }
                        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h1>Relatório Completo de Inventário</h1>
                    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%">Tombo</th>
                                <th style="width: 25%">Descrição</th>
                                <th style="width: 12%">Local</th>
                                <th style="width: 15%">Responsável</th>
                                <th style="width: 10%">Estado</th>
                                <th style="width: 15%">Inventariante</th>
                                <th style="width: 15%">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }

        } catch (error) {
            console.error('Erro na exportação PDF:', error);
            const errorMsg = 'Falha ao exportar PDF: ' + error.message;
            if (Platform.OS === 'web') {
                alert(errorMsg);
            } else {
                Alert.alert('Erro', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Exportar Dados</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Selecione o formato para exportar a tabela completa do inventário.
                    Isso incluirá todos os registros feitos por todos os usuários.
                </Text>

                <View style={styles.cardContainer}>
                    <TouchableOpacity
                        style={[styles.card, { borderColor: '#10b981' }]}
                        onPress={exportExcel}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <FileSpreadsheet size={32} color="#10b981" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Planilha Excel (.xlsx)</Text>
                            <Text style={styles.cardSubtitle}>Melhor para formatação e compatibilidade.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { borderColor: '#3b82f6' }]}
                        onPress={exportCSV}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <FileText size={32} color="#3b82f6" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Arquivo CSV (.csv)</Text>
                            <Text style={styles.cardSubtitle}>Texto separado por vírgulas, leve e universal.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { borderColor: '#f43f5e' }]}
                        onPress={exportPDF}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                            <Download size={32} color="#f43f5e" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Documento PDF (.pdf)</Text>
                            <Text style={styles.cardSubtitle}>Lista formatada para leitura e impressão.</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Gerando arquivo...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Theme.colors.secondaryBackground,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        marginBottom: 30,
        lineHeight: 24,
    },
    cardContainer: {
        gap: 15,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: Theme.colors.textSecondary,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        borderRadius: 16,
    },
    loadingText: {
        marginTop: 10,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});