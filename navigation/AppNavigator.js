import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import InventariosScreen from '../screens/InventariosScreen';
import PatrimoniosScreen from '../screens/PatrimoniosScreen';
import AmbientesScreen from '../screens/AmbientesScreen';
import MeusDadosScreen from '../screens/MeusDadosScreen';
import InventarioFormScreen from '../screens/InventarioFormScreen';
import CampusSelectionScreen from '../screens/CampusSelectionScreen';
import PatrimonioDetailScreen from '../screens/PatrimonioDetailScreen';
import InventariosListScreen from '../screens/InventariosListScreen';
import GerenciarUsuariosScreen from '../screens/GerenciarUsuariosScreen';
import CargaPatrimonialScreen from '../screens/CargaPatrimonialScreen';
import GerenciarInventarioScreen from '../screens/GerenciarInventarioScreen';
import RankingScreen from '../screens/RankingScreen';
import DadosInventarioScreen from '../screens/DadosInventarioScreen';
import ExportarInventarioScreen from '../screens/ExportarInventarioScreen';
import RelatorioScreen from '../screens/RelatorioScreen';

import {
    ClipboardList,
    Tag,
    Building2,
    User,
    ScanBarcode
} from 'lucide-react-native';
import { Theme } from '../constants/Theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
    const Icon = {
        'Inventários': ClipboardList,
        'Patrimônios': Tag,
        'Ambientes': Building2,
        'Meus Dados': User,
    }[label] || ClipboardList;

    return (
        <View style={styles.tabIconContainer}>
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Icon
                    size={22}
                    color={focused ? Theme.colors.primary : Theme.colors.textSecondary}
                    strokeWidth={focused ? 2.5 : 2}
                />
            </View>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
            {focused && <View style={styles.activeIndicator} />}
        </View>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Meus Dados"
            screenOptions={({ route }) => ({
                headerShown: false, // We'll handle headers in the screens for more control (glassmorphism)
                tabBarStyle: {
                    backgroundColor: Theme.colors.glass,
                    borderTopColor: Theme.colors.border,
                    height: 85,
                    paddingBottom: 20,
                    paddingTop: 12,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopWidth: 1,
                },
                tabBarShowLabel: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon label={route.name} focused={focused} />
                ),
            })}
        >
            <Tab.Screen name="Inventários" component={InventariosScreen} />
            <Tab.Screen name="Patrimônios" component={PatrimoniosScreen} />
            <Tab.Screen name="Ambientes" component={AmbientesScreen} />
            <Tab.Screen name="Meus Dados" component={MeusDadosScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="CampusSelection"
                screenOptions={{
                    headerStyle: { backgroundColor: Theme.colors.background },
                    headerTintColor: Theme.colors.text,
                    headerTitleStyle: { fontWeight: '800', fontSize: 18 },
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                }}
            >
                <Stack.Screen
                    name="CampusSelection"
                    component={CampusSelectionScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="MainApp"
                    component={TabNavigator}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="InventarioForm"
                    component={InventarioFormScreen}
                    options={{ headerTitle: 'Novo Inventário' }}
                />
                <Stack.Screen
                    name="PatrimonioDetail"
                    component={PatrimonioDetailScreen}
                    options={{ headerTitle: 'Detalhes do Bem' }}
                />
                <Stack.Screen
                    name="InventariosList"
                    component={InventariosListScreen}
                    options={({ route }) => ({
                        headerTitle: route.params?.campus || 'Inventários'
                    })}
                />
                <Stack.Screen
                    name="GerenciarUsuarios"
                    component={GerenciarUsuariosScreen}
                    options={{ headerTitle: 'Gerenciar Usuários' }}
                />
                <Stack.Screen
                    name="CargaPatrimonial"
                    component={CargaPatrimonialScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="GerenciarInventario"
                    component={GerenciarInventarioScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Ranking"
                    component={RankingScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DadosInventario"
                    component={DadosInventarioScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ExportarInventario"
                    component={ExportarInventarioScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Relatorio"
                    component={RelatorioScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: 80,
    },
    iconWrapper: {
        padding: 6,
        borderRadius: 12,
        marginBottom: 4,
    },
    iconWrapperActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    tabLabel: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tabLabelActive: {
        color: Theme.colors.primary,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -15,
        width: 20,
        height: 3,
        backgroundColor: Theme.colors.primary,
        borderRadius: 10,
    }
});
