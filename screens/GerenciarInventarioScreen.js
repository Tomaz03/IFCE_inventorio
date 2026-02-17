import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar
} from 'react-native';
import {
    ArrowLeft,
    Users,
    Trophy,
    BarChart3,
    ChevronRight,
    FileDown
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function GerenciarInventarioScreen({ navigation }) {

    const menuOptions = [
        {
            title: 'Gerenciar Usuários',
            subtitle: 'Promover, rebaixar e visualizar usuários',
            icon: Users,
            color: Theme.colors.primary,
            bgColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.2)',
            route: 'GerenciarUsuarios',
        },
        {
            title: 'Ranking',
            subtitle: 'Ranking dos inventariantes por itens coletados',
            icon: Trophy,
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
            route: 'Ranking',
        },
        {
            title: 'Dados do Inventário',
            subtitle: 'Estatísticas e indicadores detalhados',
            icon: BarChart3,
            color: '#6366f1',
            bgColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            route: 'DadosInventario',
        },
        {
            title: 'Exportar Dados',
            subtitle: 'Baixar inventário em Excel, CSV ou PDF',
            icon: FileDown,
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            route: 'ExportarInventario',
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <ArrowLeft size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Gerenciar Inventário</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.content}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={styles.sectionTitle}>Painel Administrativo</Text>
                </View>

                {menuOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuCard}
                            onPress={() => navigation.navigate(option.route)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: option.bgColor, borderColor: option.borderColor }]}>
                                <IconComponent size={24} color={option.color} />
                            </View>
                            <View style={styles.menuInfo}>
                                <Text style={styles.menuTitle}>{option.title}</Text>
                                <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
                            </View>
                            <ChevronRight size={20} color={Theme.colors.border} />
                        </TouchableOpacity>
                    );
                })}
            </View>
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
    headerRight: { width: 44 },
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
    content: { flex: 1, padding: 20 },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    titleAccent: { width: 4, height: 20, backgroundColor: Theme.colors.primary, borderRadius: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },

    menuCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 16,
    },
    menuIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    menuInfo: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.text },
    menuSubtitle: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, fontWeight: '500' },
});
