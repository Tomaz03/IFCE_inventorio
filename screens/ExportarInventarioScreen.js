import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Theme } from '../constants/Theme';
import { ArrowLeft, FileSpreadsheet, FileText, Download, FileJson } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import XLSX from 'xlsx';

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

            // Flatten data for export
            const exportData = data.map(item => ({
                ...item,
                usuario_nome: item.profiles?.full_name || '',
                usuario_email: item.profiles?.email || '',
                profiles: undefined // remove object
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventario");

            if (Platform.OS === 'web') {
                console.log('Platform is Web, using XLSX.writeFile');
                try {
                    XLSX.writeFile(wb, 'inventario_ifce.xlsx');
                    console.log('XLSX.writeFile called successfully');
                    Alert.alert('Sucesso', 'O download da planilha Excel deve ter começado.');
                } catch (webError) {
                    console.error('Error in XLSX.writeFile:', webError);
                    throw new Error('Erro ao gerar arquivo no navegador: ' + webError.message);
                }
            } else {
                const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
                const uri = FileSystem.cacheDirectory + 'inventario_ifce.xlsx';
                await FileSystem.writeAsStringAsync(uri, wbout, {
                    encoding: 'base64'
                });

                await Sharing.shareAsync(uri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Exportar Inventário Excel'
                });
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao exportar Excel: ' + error.message);
        }
        setLoading(false);
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

            // Flatten data
            const exportData = data.map(item => ({
                ...item,
                usuario_nome: item.profiles?.full_name || '',
                usuario_email: item.profiles?.email || '',
                profiles: undefined
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);

            if (Platform.OS === 'web') {
                console.log('Platform is Web, using XLSX.writeFile for CSV');
                try {
                    XLSX.writeFile(wb, 'inventario_ifce.csv', { bookType: 'csv' });
                    Alert.alert('Sucesso', 'O download do arquivo CSV deve ter começado.');
                } catch (webError) {
                    console.error('Error in XLSX.writeFile (CSV):', webError);
                    throw new Error('Erro ao gerar CSV: ' + webError.message);
                }
            } else {
                const uri = FileSystem.cacheDirectory + 'inventario_ifce.csv';
                await FileSystem.writeAsStringAsync(uri, csv, {
                    encoding: 'utf8'
                });

                await Sharing.shareAsync(uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Exportar Inventário CSV'
                });
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao exportar CSV: ' + error.message);
        }
        setLoading(false);
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

            // Create simplistic table rows (limiting columns for PDF width)
            const rows = data.map((item, index) => {
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

            const { uri } = await Print.printToFileAsync({ html });

            if (Platform.OS === 'web') {
                // printToFileAsync on web might not behave as expected for "downloading"
                // but usually print() works better for web. 
                // However, printToFileAsync on web often returns a blob URL or triggers a print dialog.
                await Print.printAsync({ html });
            } else {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao exportar PDF: ' + error.message);
        }
        setLoading(false);
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
