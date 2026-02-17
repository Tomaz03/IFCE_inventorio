import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Image, ActivityIndicator, Pressable, Keyboard,
    StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

// Cores Modo Dark baseadas no formulariodeinventario.html (dark theme)
const COLORS = {
    primary: '#10b981', // Emerald 500
    primaryLight: 'rgba(16, 185, 129, 0.1)',
    primaryDark: '#059669',
    accent: '#6366f1', // Indigo
    background: '#020617', // Slate 950 (do HTML)
    surface: '#0f172a', // Slate 900 (do HTML)
    surfaceLight: '#1e293b', // Slate 800
    textMain: '#f1f5f9', // Slate 100
    textSecondary: '#94a3b8', // Slate 400
    textMuted: '#64748b', // Slate 500
    border: '#1e293b', // Slate 800
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
};

// Função inline para converter base64 em ArrayBuffer
function base64ToArrayBuffer(base64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
    const len = base64.length;
    let bufferLength = Math.floor(len * 0.75);
    if (base64[len - 1] === '=') bufferLength--;
    if (base64[len - 2] === '=') bufferLength--;
    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
}

export default function InventarioFormScreen({ route, navigation }) {
    const campusParam = route?.params?.campus || 'REITORIA';
    const isEdit = route?.params?.isEdit || false;
    const inventarioId = route?.params?.inventarioId || null;

    // Form state
    const [temEtiqueta, setTemEtiqueta] = useState(null); // null, 'SIM', 'NÃO'
    const [situacaoEtiqueta, setSituacaoEtiqueta] = useState('Normal');
    const [tombo, setTombo] = useState('');
    const [tomboAuxiliar, setTomboAuxiliar] = useState('');
    const [registradoSuap, setRegistradoSuap] = useState(null); // null, 'SIM', 'NÃO'

    // SUAP data
    const [patrimonio, setPatrimonio] = useState(null);
    const [pendenciaCarga, setPendenciaCarga] = useState(false);
    const [descricaoSuap, setDescricaoSuap] = useState('');
    const [descricaoConfere, setDescricaoConfere] = useState(null); // null, 'SIM', 'NÃO'
    const [descricaoNova, setDescricaoNova] = useState('');

    const [numeroSerieSuap, setNumeroSerieSuap] = useState('');
    const [numeroSerieConfere, setNumeroSerieConfere] = useState(null); // 'sim', 'nao', 'nsa'
    const [numeroSerieNovo, setNumeroSerieNovo] = useState('');

    const [salaSuap, setSalaSuap] = useState('');
    const [salaConfere, setSalaConfere] = useState(null); // null, 'SIM', 'NÃO'
    const [salaNova, setSalaNova] = useState('');

    const [estadoConservacaoSuap, setEstadoConservacaoSuap] = useState('');
    const [estadoConservacaoConfere, setEstadoConservacaoConfere] = useState(null); // null, 'SIM', 'NÃO'
    const [estadoConservacaoNovo, setEstadoConservacaoNovo] = useState('Bom');

    const [responsavelSuap, setResponsavelSuap] = useState('');
    const [responsavelConfere, setResponsavelConfere] = useState(null); // null, 'SIM', 'NÃO'
    const [responsavelNovo, setResponsavelNovo] = useState('');

    const [observacoes, setObservacoes] = useState('');
    const [foto1, setFoto1] = useState(null);
    const [foto2, setFoto2] = useState(null);

    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanTarget, setScanTarget] = useState('tombo');
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [showRoomList, setShowRoomList] = useState(false);
    const [filteredResponsaveis, setFilteredResponsaveis] = useState([]);
    const [showRespList, setShowRespList] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        if (isEdit && inventarioId) {
            carregarInventarioParaEdicao(inventarioId);
        } else if (route?.params?.tombo) {
            setTombo(route.params.tombo);
            buscarTombo(route.params.tombo);
        }
        buscarPerfil();
    }, [route?.params?.tombo, isEdit, inventarioId]);

    async function buscarPerfil() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) setUserProfile(data);
            }
        } catch (err) {
            console.log('Erro ao buscar perfil:', err);
        }
    }

    async function carregarInventarioParaEdicao(id) {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                const toSimNao = (val) => typeof val === 'boolean' ? (val ? 'SIM' : 'NÃO') : val;
                setTemEtiqueta(toSimNao(data.tem_etiqueta));
                setSituacaoEtiqueta(data.situacao_etiqueta || 'Normal');
                setTombo(data.tombo);
                setTomboAuxiliar(data.tombo_auxiliar || '');
                setRegistradoSuap(toSimNao(data.registrado_suap));
                setDescricaoSuap(data.descricao_suap || '');
                setDescricaoConfere(toSimNao(data.descricao_confere));
                setDescricaoNova(data.descricao_nova || '');
                setNumeroSerieSuap(data.numero_serie_suap || '');
                setNumeroSerieConfere(data.numero_serie_confere || 'nsa');
                setNumeroSerieNovo(data.numero_serie_novo || '');
                setSalaSuap(data.sala_suap || '');
                setSalaConfere(toSimNao(data.sala_confere));
                setSalaNova(data.sala_nova || '');
                setEstadoConservacaoSuap(data.estado_conservacao_suap || '');
                setEstadoConservacaoConfere(toSimNao(data.estado_conservacao_confere));
                setEstadoConservacaoNovo(data.estado_conservacao_novo || 'Bom');
                setResponsavelSuap(data.responsavel_suap || '');
                setResponsavelConfere(toSimNao(data.responsavel_confere));
                setResponsavelNovo(data.responsavel_novo || '');
                setObservacoes(data.observacoes || '');
                setFoto1(data.foto1_url);
                setFoto2(data.foto2_url);
            }
        } catch (err) {
            console.error('Erro ao carregar inventário para edição:', err);
            Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSalaSearch(text) {
        setSalaNova(text);
        if (text.length > 2) {
            try {
                const { data } = await supabase
                    .from('patrimonio_suap')
                    .select('sala')
                    .ilike('sala', `%${text}%`)
                    .eq('campus', campusParam)
                    .order('sala', { ascending: true })
                    .limit(1000);
                if (data) {
                    const unique = [...new Set(data.map(i => i.sala?.trim()).filter(Boolean))];
                    setFilteredRooms(unique);
                    setShowRoomList(unique.length > 0);
                }
            } catch (err) {
                console.log('Error searching rooms:', err);
            }
        } else {
            setShowRoomList(false);
        }
    }

    function selectRoom(room) {
        setSalaNova(room);
        setShowRoomList(false);
        Keyboard.dismiss();
    }

    async function handleRespSearch(text) {
        setResponsavelNovo(text);
        if (text.length > 2) {
            try {
                const { data } = await supabase
                    .from('patrimonio_suap')
                    .select('responsavel')
                    .ilike('responsavel', `%${text}%`)
                    .eq('campus', campusParam)
                    .order('responsavel', { ascending: true })
                    .limit(1000);
                if (data) {
                    const unique = [...new Set(data.map(i => i.responsavel?.trim()).filter(Boolean))];
                    setFilteredResponsaveis(unique);
                    setShowRespList(unique.length > 0);
                }
            } catch (err) {
                console.log('Error searching responsibles:', err);
            }
        } else {
            setShowRespList(false);
        }
    }

    function selectResponsavel(resp) {
        setResponsavelNovo(resp);
        setShowRespList(false);
        Keyboard.dismiss();
    }

    async function buscarTombo(tomboNum) {
        if (!tomboNum) return;
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('patrimonio_suap')
                .select('*')
                .eq('numero', tomboNum)
                .single();

            if (data) {
                setRegistradoSuap('SIM');
                setDescricaoSuap(data.descricao || '');
                setNumeroSerieSuap(data.numero_serie || '');
                setSalaSuap(data.sala || '');
                setEstadoConservacaoSuap(data.estado_conservacao || '');
                setResponsavelSuap(data.responsavel || '');
                setPatrimonio(data);

                const suapCampusNorm = (data.campus || 'REITORIA').toUpperCase();
                const currentCampusNorm = (campusParam || 'REITORIA').toUpperCase();

                if (suapCampusNorm !== currentCampusNorm) {
                    setPendenciaCarga(true);
                    Alert.alert('Atenção', `Bem com PENDÊNCIA DE CARGA.\nCampus SUAP: ${data.campus || 'REITORIA'}\nCampus Inventariante: ${campusParam}`);
                } else {
                    setPendenciaCarga(false);
                }
            } else {
                setRegistradoSuap('NÃO');
                setPatrimonio(null);
                setPendenciaCarga(false);
                setDescricaoSuap('');
                setNumeroSerieSuap('');
                setSalaSuap('');
                setEstadoConservacaoSuap('');
                setResponsavelSuap('');
            }
        } catch (err) {
            setRegistradoSuap('NÃO');
        } finally {
            setSearching(false);
        }
    }

    function handleBarcodeScan({ data }) {
        setShowScanner(false);
        if (scanTarget === 'tombo') {
            setTombo(data);
            buscarTombo(data);
        } else {
            setTomboAuxiliar(data);
        }
    }

    function openScanner(target) {
        if (!permission?.granted) {
            requestPermission();
            return;
        }
        setScanTarget(target);
        setShowScanner(true);
    }

    async function pickPhoto(photoNum) {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: false,
        });
        if (!result.canceled) {
            if (photoNum === 1) setFoto1(result.assets[0].uri);
            else setFoto2(result.assets[0].uri);
        }
    }

    async function uploadPhoto(uri, fileName) {
        if (!uri || uri.startsWith('http')) return uri;
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const arrayBuffer = base64ToArrayBuffer(base64);
            const { data, error } = await supabase.storage
                .from('inventory-photos')
                .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('inventory-photos').getPublicUrl(fileName);
            return publicUrl;
        } catch (err) {
            throw new Error(`Falha no upload da foto: ${err.message || 'Erro desconhecido'}`);
        }
    }

    async function handleSave() {
        if (temEtiqueta === null) {
            Alert.alert('Atenção', 'Selecione se o bem tem etiqueta.');
            return;
        }
        if (!tombo) {
            Alert.alert('Atenção', 'Informe o número do tombo.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('Usuário não autenticado.');

            const timestamp = Date.now();
            let foto1Url = foto1;
            let foto2Url = foto2;

            try {
                if (foto1 && !foto1.startsWith('http')) {
                    foto1Url = await uploadPhoto(foto1, `${user.id}/${timestamp}_1.jpg`);
                }
                if (foto2 && !foto2.startsWith('http')) {
                    foto2Url = await uploadPhoto(foto2, `${user.id}/${timestamp}_2.jpg`);
                }
            } catch (uploadErr) {
                foto1Url = null;
                foto2Url = null;
            }

            const record = {
                user_id: user.id,
                tem_etiqueta: temEtiqueta,
                situacao_etiqueta: temEtiqueta === 'SIM' ? situacaoEtiqueta : null,
                tombo,
                tombo_auxiliar: tomboAuxiliar || null,
                registrado_suap: registradoSuap,
                descricao_suap: descricaoSuap || null,
                descricao_confere: registradoSuap === 'SIM' ? descricaoConfere : null,
                descricao_nova: (registradoSuap === 'SIM' && descricaoConfere === 'NÃO') ? descricaoNova : (registradoSuap === 'NÃO' ? descricaoNova : null),
                numero_serie_suap: numeroSerieSuap || null,
                numero_serie_confere: registradoSuap === 'SIM' ? numeroSerieConfere : null,
                numero_serie_novo: (registradoSuap === 'SIM' && numeroSerieConfere === 'nao') ? numeroSerieNovo : (registradoSuap === 'NÃO' ? numeroSerieNovo : null),
                sala_suap: salaSuap || null,
                sala_confere: registradoSuap === 'SIM' ? salaConfere : null,
                sala_nova: (registradoSuap === 'SIM' && salaConfere === 'NÃO') ? salaNova : (registradoSuap === 'NÃO' ? salaNova : null),
                estado_conservacao_suap: estadoConservacaoSuap || null,
                estado_conservacao_confere: registradoSuap === 'SIM' ? estadoConservacaoConfere : null,
                estado_conservacao_novo: (registradoSuap === 'SIM' && estadoConservacaoConfere === 'NÃO') ? estadoConservacaoNovo : (registradoSuap === 'NÃO' ? estadoConservacaoNovo : null),
                responsavel_suap: responsavelSuap || null,
                responsavel_confere: registradoSuap === 'SIM' ? responsavelConfere : null,
                responsavel_novo: (registradoSuap === 'SIM' && responsavelConfere === 'NÃO') ? responsavelNovo : (registradoSuap === 'NÃO' ? responsavelNovo : null),
                observacoes: observacoes || null,
                campus_inventariado: campusParam,
                campus_inventariante: campusParam,
                foto1_url: foto1Url,
                foto2_url: foto2Url,
                campi_conciliados: pendenciaCarga ? 'NÃO (Bem com pendência de carga)' : 'SIM',
                campus_suap: patrimonio?.campus || null
            };

            let result;
            if (isEdit && inventarioId) {
                result = await supabase.from('inventario').update(record).eq('id', inventarioId).select();
            } else {
                result = await supabase.from('inventario').insert(record).select();
            }

            if (result.error) throw result.error;

            Alert.alert('Sucesso!', 'Inventário salvo com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            Alert.alert('Erro ao Salvar', err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        Alert.alert('Cancelar', 'Deseja descartar este inventário?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', onPress: () => navigation.goBack(), style: 'destructive' },
        ]);
    }

    if (showScanner) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.headerBackButton}>
                        <Text style={styles.headerBackIcon}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Leitor de Código</Text>
                        <Text style={styles.headerSubtitle}>APONTE PARA A ETIQUETA</Text>
                    </View>
                </View>

                <View style={styles.scannerContainer}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8']
                        }}
                        onBarcodeScanned={handleBarcodeScan}
                    />

                    {/* Overlay Moderno com Cutout */}
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scannerTop} />
                        <View style={styles.scannerMiddle}>
                            <View style={styles.scannerSide} />
                            <View style={styles.scannerCutout}>
                                <View style={styles.scannerFrame} />
                            </View>
                            <View style={styles.scannerSide} />
                        </View>
                        <View style={styles.scannerBottom}>
                            <Text style={styles.scannerText}>Posicione o código de barras no centro</Text>
                            <TouchableOpacity style={styles.scannerClose} onPress={() => setShowScanner(false)}>
                                <Text style={styles.scannerCloseText}>✕ Cancelar Leitura</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const FormLabel = ({ title, required, iconColor = COLORS.primary }) => (
        <View style={styles.labelWrapper}>
            <View style={[styles.labelDot, { backgroundColor: iconColor }]} />
            <Text style={styles.labelText}>{title.toUpperCase()}</Text>
            {required && <Text style={styles.labelRequired}>*</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.surface} />

            {/* Header Modernizado com Glassmorphism style */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
                    <Text style={styles.headerBackIcon}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Novo Inventário</Text>
                    <Text style={styles.headerSubtitle}>FORMULÁRIO DE COLETA</Text>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Pergunta: Tem Etiqueta? */}
                <View style={styles.section}>
                    <FormLabel title="Tem Etiqueta?" required />
                    <View style={styles.binaryToggleRow}>
                        <TouchableOpacity
                            style={[styles.binaryToggleBtn, temEtiqueta === 'NÃO' && styles.binaryToggleBtnActive]}
                            onPress={() => setTemEtiqueta('NÃO')}
                        >
                            <Text style={[styles.binaryToggleText, temEtiqueta === 'NÃO' && styles.binaryToggleTextActive]}>NÃO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.binaryToggleBtn, temEtiqueta === 'SIM' && styles.binaryToggleBtnActive]}
                            onPress={() => setTemEtiqueta('SIM')}
                        >
                            {temEtiqueta === 'SIM' && <Text style={styles.checkIcon}>✓</Text>}
                            <Text style={[styles.binaryToggleText, temEtiqueta === 'SIM' && styles.binaryToggleTextActive]}>SIM</Text>
                        </TouchableOpacity>
                    </View>

                    {temEtiqueta === 'SIM' && (
                        <View style={styles.dynamicSubSection}>
                            <Text style={styles.subLabel}>Situação da Etiqueta</Text>
                            <TextInput
                                style={styles.input}
                                value={situacaoEtiqueta}
                                onChangeText={setSituacaoEtiqueta}
                                placeholder="Descreva a situação..."
                                placeholderTextColor={COLORS.textMuted}
                            />
                            <View style={styles.chipContainer}>
                                {['Normal', 'Rasurada', 'Padrão Antigo', 'Local Difícil', 'Sem etiqueta'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.chip, situacaoEtiqueta === opt && styles.chipActive]}
                                        onPress={() => setSituacaoEtiqueta(opt)}
                                    >
                                        <Text style={[styles.chipText, situacaoEtiqueta === opt && styles.chipTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Campos de Tombo */}
                <View style={styles.section}>
                    <FormLabel title="Tombo" required />
                    <View style={styles.inputWithAction}>
                        <TextInput
                            style={[styles.input, styles.flexInput, tombo && registradoSuap !== null && { borderColor: registradoSuap === 'SIM' ? COLORS.primary : COLORS.error }]}
                            value={tombo}
                            onChangeText={setTombo}
                            onBlur={() => buscarTombo(tombo)}
                            placeholder="Número do tombamento ou descrição (ex: Sem tombamento)"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="default"
                        />
                        <TouchableOpacity style={styles.actionIconBtn} onPress={() => openScanner('tombo')}>
                            <Text style={styles.actionIcon}>[ ]</Text>
                        </TouchableOpacity>
                    </View>

                    {pendenciaCarga && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>⚠️ Bem com pendência de carga</Text>
                            <Text style={styles.errorSubText}>Campus SUAP ({patrimonio?.campus}) ≠ Inventariante ({campusParam})</Text>
                        </View>
                    )}

                    <View style={styles.marginTop16}>
                        <FormLabel title="Tombo Auxiliar" iconColor={COLORS.textMuted} />
                        <View style={styles.inputWithAction}>
                            <TextInput
                                style={[styles.input, styles.flexInput]}
                                value={tomboAuxiliar}
                                onChangeText={setTomboAuxiliar}
                                placeholder="Opcional"
                                placeholderTextColor={COLORS.textMuted}
                            />
                            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: COLORS.surfaceLight }]} onPress={() => openScanner('auxiliar')}>
                                <Text style={[styles.actionIcon, { color: COLORS.textMuted }]}>[ ]</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Status SUAP */}
                <View style={styles.section}>
                    <FormLabel title="Registrado no SUAP?" required />
                    {searching ? (
                        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.suapStatusBtn,
                                registradoSuap === 'SIM' ? styles.suapStatusBtnSim : (registradoSuap === 'NÃO' ? styles.suapStatusBtnNao : {})
                            ]}
                            onPress={() => setRegistradoSuap(registradoSuap === 'SIM' ? 'NÃO' : 'SIM')}
                        >
                            <Text style={styles.suapStatusIcon}>{registradoSuap === 'SIM' ? '☁' : '☁/'}</Text>
                            <Text style={[styles.suapStatusText, registradoSuap === 'SIM' ? styles.suapStatusTextSim : (registradoSuap === 'NÃO' ? styles.suapStatusTextNao : {})]}>
                                {registradoSuap === null ? 'AGUARDANDO BUSCA...' : registradoSuap}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.hintText}>Toque para alternar o status de registro</Text>
                </View>

                {/* Seções Condicionais - Registrado no SUAP SIM */}
                {registradoSuap === 'SIM' && (
                    <View style={styles.suapFieldsContainer}>
                        {/* Descrição */}
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Descrição SUAP" />
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>{descricaoSuap || '(vazio)'}</Text>
                            </View>
                            <Text style={styles.subLabel}>Descrição SUAP confere? *</Text>
                            <View style={styles.binaryToggleRowSmall}>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, descricaoConfere === 'NÃO' && styles.binaryToggleBtnActive]}
                                    onPress={() => setDescricaoConfere('NÃO')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, descricaoConfere === 'NÃO' && styles.binaryToggleTextActive]}>NÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, descricaoConfere === 'SIM' && styles.binaryToggleBtnActive]}
                                    onPress={() => setDescricaoConfere('SIM')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, descricaoConfere === 'SIM' && styles.binaryToggleTextActive]}>SIM</Text>
                                </TouchableOpacity>
                            </View>
                            {descricaoConfere === 'NÃO' && (
                                <TextInput
                                    style={[styles.input, styles.textArea, styles.marginTop12]}
                                    value={descricaoNova}
                                    onChangeText={setDescricaoNova}
                                    placeholder="Nova descrição do bem"
                                    placeholderTextColor={COLORS.textMuted}
                                    multiline
                                />
                            )}
                        </View>

                        {/* Número de Série */}
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Nº de Série SUAP" required />
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>{numeroSerieSuap || '(vazio)'}</Text>
                            </View>
                            <Text style={styles.subLabel}>Nº de Série SUAP confere? *</Text>
                            <View style={styles.tripleToggleRow}>
                                {['sim', 'nao', 'nsa'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.tripleToggleBtn, numeroSerieConfere === opt && styles.binaryToggleBtnActive]}
                                        onPress={() => setNumeroSerieConfere(opt)}
                                    >
                                        <Text style={[styles.binaryToggleTextSmall, numeroSerieConfere === opt && styles.binaryToggleTextActive]}>
                                            {opt === 'sim' ? 'SIM' : opt === 'nao' ? 'NÃO' : 'NSA'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {numeroSerieConfere === 'nao' && (
                                <TextInput
                                    style={[styles.input, styles.marginTop12]}
                                    value={numeroSerieNovo}
                                    onChangeText={setNumeroSerieNovo}
                                    placeholder="Novo número de série"
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            )}
                        </View>

                        {/* Sala */}
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Sala SUAP" required />
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>{salaSuap || '(vazio)'}</Text>
                            </View>
                            <Text style={styles.subLabel}>Sala SUAP confere? *</Text>
                            <View style={styles.binaryToggleRowSmall}>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, salaConfere === 'NÃO' && styles.binaryToggleBtnActive]}
                                    onPress={() => setSalaConfere('NÃO')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, salaConfere === 'NÃO' && styles.binaryToggleTextActive]}>NÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, salaConfere === 'SIM' && styles.binaryToggleBtnActive]}
                                    onPress={() => setSalaConfere('SIM')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, salaConfere === 'SIM' && styles.binaryToggleTextActive]}>SIM</Text>
                                </TouchableOpacity>
                            </View>
                            {salaConfere === 'NÃO' && (
                                <View style={styles.marginTop12}>
                                    <TextInput
                                        style={styles.input}
                                        value={salaNova}
                                        onChangeText={handleSalaSearch}
                                        placeholder="Pesquisar nova sala..."
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                    {showRoomList && filteredRooms.length > 0 && (
                                        <View style={styles.suggestionsContainer}>
                                            <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
                                                {filteredRooms.map((item) => (
                                                    <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => selectRoom(item)}>
                                                        <Text style={styles.suggestionText}>{item}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Estado de Conservação */}
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Estado de Conservação SUAP" required />
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>{estadoConservacaoSuap || '(vazio)'}</Text>
                            </View>
                            <Text style={styles.subLabel}>Estado de Conservação SUAP confere? *</Text>
                            <View style={styles.binaryToggleRowSmall}>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, estadoConservacaoConfere === 'NÃO' && styles.binaryToggleBtnActive]}
                                    onPress={() => setEstadoConservacaoConfere('NÃO')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, estadoConservacaoConfere === 'NÃO' && styles.binaryToggleTextActive]}>NÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, estadoConservacaoConfere === 'SIM' && styles.binaryToggleBtnActive]}
                                    onPress={() => setEstadoConservacaoConfere('SIM')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, estadoConservacaoConfere === 'SIM' && styles.binaryToggleTextActive]}>SIM</Text>
                                </TouchableOpacity>
                            </View>
                            {estadoConservacaoConfere === 'NÃO' && (
                                <View style={styles.radioGroup}>
                                    {['Bom', 'Ocioso', 'Antieconômico', 'Irrecuperável', 'Recuperável', 'Não é possível informar'].map((option) => (
                                        <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setEstadoConservacaoNovo(option)}>
                                            <View style={styles.radioCircle}>
                                                {estadoConservacaoNovo === option && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.radioText, estadoConservacaoNovo === option && styles.radioTextActive]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Responsável */}
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Responsável SUAP" required />
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>{responsavelSuap || '(vazio)'}</Text>
                            </View>
                            <Text style={styles.subLabel}>Responsável SUAP confere? *</Text>
                            <View style={styles.binaryToggleRowSmall}>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, responsavelConfere === 'NÃO' && styles.binaryToggleBtnActive]}
                                    onPress={() => setResponsavelConfere('NÃO')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, responsavelConfere === 'NÃO' && styles.binaryToggleTextActive]}>NÃO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.binaryToggleBtnSmall, responsavelConfere === 'SIM' && styles.binaryToggleBtnActive]}
                                    onPress={() => setResponsavelConfere('SIM')}
                                >
                                    <Text style={[styles.binaryToggleTextSmall, responsavelConfere === 'SIM' && styles.binaryToggleTextActive]}>SIM</Text>
                                </TouchableOpacity>
                            </View>
                            {responsavelConfere === 'NÃO' && (
                                <View style={styles.marginTop12}>
                                    <TextInput
                                        style={styles.input}
                                        value={responsavelNovo}
                                        onChangeText={handleRespSearch}
                                        placeholder="Pesquisar novo responsável..."
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                    {showRespList && filteredResponsaveis.length > 0 && (
                                        <View style={styles.suggestionsContainer}>
                                            <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
                                                {filteredResponsaveis.map((item) => (
                                                    <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => selectResponsavel(item)}>
                                                        <Text style={styles.suggestionText}>{item}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Seções Condicionais - Registrado no SUAP NÃO */}
                {registradoSuap === 'NÃO' && (
                    <View style={styles.suapFieldsContainer}>
                        <View style={styles.fieldGroup}>
                            <FormLabel title="Descrição do Bem" required />
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={descricaoNova}
                                onChangeText={setDescricaoNova}
                                placeholder="Descreva o bem (Marca, Modelo, Cor...)"
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <FormLabel title="Nº de Série" />
                            <TextInput
                                style={styles.input}
                                value={numeroSerieNovo}
                                onChangeText={setNumeroSerieNovo}
                                placeholder="Número de série (se houver)"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <FormLabel title="Sala" required />
                            <TextInput
                                style={styles.input}
                                value={salaNova}
                                onChangeText={handleSalaSearch}
                                placeholder="Digite a sala"
                                placeholderTextColor={COLORS.textMuted}
                                onFocus={() => setShowRoomList(true)}
                            />
                            {showRoomList && filteredRooms.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
                                        {filteredRooms.map((item) => (
                                            <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => selectRoom(item)}>
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.fieldGroup}>
                            <FormLabel title="Estado de Conservação" required />
                            <View style={styles.chipContainer}>
                                {['Bom', 'Regular', 'Ruim', 'Ocioso', 'Irrecuperável'].map((estado) => (
                                    <TouchableOpacity
                                        key={estado}
                                        style={[styles.chip, estadoConservacaoNovo === estado && styles.chipActive]}
                                        onPress={() => setEstadoConservacaoNovo(estado)}
                                    >
                                        <Text style={[styles.chipText, estadoConservacaoNovo === estado && styles.chipTextActive]}>{estado}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <FormLabel title="Responsável" required />
                            <TextInput
                                style={styles.input}
                                value={responsavelNovo}
                                onChangeText={handleRespSearch}
                                placeholder="Digite o nome do responsável"
                                placeholderTextColor={COLORS.textMuted}
                                onFocus={() => { if (responsavelNovo.length > 2) handleRespSearch(responsavelNovo); }}
                            />
                            {showRespList && filteredResponsaveis.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
                                        {filteredResponsaveis.map((item) => (
                                            <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => selectResponsavel(item)}>
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Observações */}
                <View style={styles.section}>
                    <FormLabel title="Observações" iconColor={COLORS.textMuted} />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={observacoes}
                        onChangeText={setObservacoes}
                        placeholder="Detalhes adicionais sobre o estado do bem..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                    />
                </View>

                {/* Registro Fotográfico */}
                <View style={styles.section}>
                    <FormLabel title="Registro Fotográfico" required />
                    <View style={styles.photoGrid}>
                        <View style={styles.photoContainer}>
                            <Text style={styles.photoLabel}>FOTO PRINCIPAL *</Text>
                            <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto(1)}>
                                {foto1 ? (
                                    <Image source={{ uri: foto1 }} style={styles.photoImage} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <View style={styles.photoIconCircle}>
                                            <Text style={styles.photoIcon}>📷</Text>
                                        </View>
                                        <Text style={styles.photoAddText}>ADICIONAR</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.photoContainer}>
                            <Text style={styles.photoLabel}>FOTO AUXILIAR</Text>
                            <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto(2)}>
                                {foto2 ? (
                                    <Image source={{ uri: foto2 }} style={styles.photoImage} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <View style={styles.photoIconCircle}>
                                            <Text style={styles.photoIcon}>📷</Text>
                                        </View>
                                        <Text style={styles.photoAddText}>ADICIONAR</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Informações de Campus */}
                <View style={styles.campusInfoCard}>
                    <View style={styles.campusRow}>
                        <View style={styles.campusIconBox}>
                            <Text style={styles.campusIcon}>👤</Text>
                        </View>
                        <View>
                            <Text style={styles.campusLabel}>CAMPUS ORIGEM</Text>
                            <Text style={styles.campusValue}>{campusParam}</Text>
                        </View>
                    </View>
                    <View style={styles.campusDivider} />
                    <View style={styles.campusRow}>
                        <View style={styles.campusIconBox}>
                            <Text style={styles.campusIcon}>📍</Text>
                        </View>
                        <View>
                            <Text style={styles.campusLabel}>CAMPUS DESTINO</Text>
                            <Text style={styles.campusValue}>{campusParam}</Text>
                        </View>
                    </View>
                </View>

                {/* Avisos e Declaração */}
                <View style={styles.infoBoxBlue}>
                    <Text style={styles.infoIconBlue}>ℹ</Text>
                    <Text style={styles.infoTextBlue}>
                        <Text style={styles.fontBlack}>Etiqueta:</Text> Escolha um ponto visível e de fácil acesso para <Text style={styles.underline}>COLAR O ADESIVO</Text> de inventário 2025.
                    </Text>
                </View>

                <View style={styles.infoBoxAmber}>
                    <Text style={styles.infoIconAmber}>⚖</Text>
                    <Text style={styles.infoTextAmber}>
                        Declaro para os devidos fins que as informações por mim prestadas são verdadeiras e autênticas.
                    </Text>
                </View>

                {/* Ações Finais */}
                <View style={styles.finalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                        <Text style={styles.cancelBtnText}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.saveBtnIcon}>💾</Text>
                                <Text style={styles.saveBtnText}>SALVAR</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>INVENTORY APP SYSTEM V2.4</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    scrollContent: { padding: 24 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(30, 41, 59, 0.5)',
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerBackIcon: { fontSize: 20, color: COLORS.textSecondary, fontWeight: 'bold' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5 },

    // Labels
    labelWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    labelDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    labelText: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1.2 },
    labelRequired: { color: COLORS.error, marginLeft: 4, fontWeight: 'bold' },
    subLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginTop: 16, marginBottom: 8 },

    // Sections
    section: { marginBottom: 32 },
    dynamicSubSection: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    fieldGroup: { marginBottom: 24 },
    suapFieldsContainer: {
        padding: 20,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 3,
    },

    // Inputs
    input: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMain,
    },
    flexInput: { flex: 1 },
    inputWithAction: { flexDirection: 'row', gap: 12 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    actionIconBtn: {
        width: 52,
        height: 52,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIcon: { fontSize: 20, color: COLORS.primary },

    // Toggles
    binaryToggleRow: { flexDirection: 'row', gap: 16 },
    binaryToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    binaryToggleBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    binaryToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
    binaryToggleTextActive: { color: COLORS.primary, fontWeight: '900' },
    checkIcon: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold' },

    binaryToggleRowSmall: { flexDirection: 'row', gap: 12 },
    binaryToggleBtnSmall: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
    },
    binaryToggleTextSmall: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },

    tripleToggleRow: { flexDirection: 'row', gap: 8 },
    tripleToggleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
    },
    scannerTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    scannerMiddle: { flexDirection: 'row', height: 250 },
    scannerContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    scannerSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    scannerCutout: {
        width: 300,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: 'transparent',
    },
    scannerFrame: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
        backgroundColor: 'transparent'
    },
    scannerBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', paddingTop: 20 },

    // SUAP Status
    suapStatusBtn: {
        width: '100%',
        paddingVertical: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primaryLight,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 2,
    },
    suapStatusBtnSim: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
    suapStatusBtnNao: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: COLORS.warning },
    suapStatusIcon: { fontSize: 20, color: COLORS.primary },
    suapStatusText: { fontSize: 15, fontWeight: '900', color: COLORS.primary },
    suapStatusTextNao: { color: COLORS.warning },
    hintText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },

    // ReadOnly
    readOnlyBox: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    readOnlyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

    // Chips
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
    chipTextActive: { color: COLORS.textMain, fontWeight: '800' },

    // Radios
    radioGroup: { marginTop: 12, gap: 8 },
    radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
    radioText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    radioTextActive: { color: COLORS.textMain, fontWeight: '700' },

    // Photos
    photoGrid: { flexDirection: 'row', gap: 16 },
    photoContainer: { flex: 1 },
    photoLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
    photoBox: {
        aspectRatio: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoImage: { width: '100%', height: '100%' },
    photoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoIcon: { fontSize: 24 },
    photoAddText: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1 },

    // Campus Info
    campusInfoCard: {
        padding: 24,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginVertical: 32,
        gap: 20,
    },
    campusRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    campusIconBox: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 1,
    },
    campusIcon: { fontSize: 18 },
    campusLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1 },
    campusValue: { fontSize: 14, fontWeight: '800', color: COLORS.textMain },
    campusDivider: { height: 1, backgroundColor: COLORS.border, width: '100%' },

    // Info Boxes
    infoBoxBlue: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        marginBottom: 16,
        gap: 16,
    },
    infoIconBlue: { fontSize: 20, color: COLORS.info },
    infoTextBlue: { flex: 1, fontSize: 11, color: '#93c5fd', lineHeight: 18, fontWeight: '500' },

    infoBoxAmber: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
        marginBottom: 32,
        gap: 16,
    },
    infoIconAmber: { fontSize: 20, color: COLORS.warning },
    infoTextAmber: { flex: 1, fontSize: 11, color: '#fcd34d', lineHeight: 18, fontWeight: '600', fontStyle: 'italic' },

    fontBlack: { fontWeight: '900' },
    underline: { textDecorationLine: 'underline' },

    // Final Actions
    finalActions: { flexDirection: 'row', gap: 16, marginTop: 16 },
    cancelBtn: {
        flex: 1,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    cancelBtnText: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1.5 },
    saveBtn: {
        flex: 1.5,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnIcon: { fontSize: 16, color: '#fff' },
    saveBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

    // Footer
    footer: { marginTop: 40, alignItems: 'center', opacity: 0.4 },
    footerText: { fontSize: 10, fontWeight: '800', color: COLORS.textMain, letterSpacing: 2 },

    // Suggestions Corrected for Scroll
    suggestionsContainer: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 16,
        marginTop: 4,
        maxHeight: 250, // Aumentado para melhor visibilidade
        zIndex: 9999,
        elevation: 10,
        overflow: 'hidden',
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surfaceLight
    },
    suggestionText: { fontSize: 14, color: COLORS.textMain, fontWeight: '600' },

    // Error Banner
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    errorText: { color: COLORS.error, fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
    errorSubText: { color: COLORS.error, fontSize: 11, textAlign: 'center', marginTop: 4 },

    // Utils
    loader: { marginVertical: 20 },
    marginTop12: { marginTop: 12 },
    marginTop16: { marginTop: 16 },
});
