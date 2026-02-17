import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Image, ActivityIndicator, Switch, Pressable, Keyboard
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
// Fix: Usar API legacy pois a nova (v18+) depreciou readAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

// Função inline para converter base64 em ArrayBuffer (evita dependência externa)
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
    const [scanTarget, setScanTarget] = useState('tombo'); // 'tombo' or 'auxiliar'
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [showRoomList, setShowRoomList] = useState(false);
    const [filteredResponsaveis, setFilteredResponsaveis] = useState([]);
    const [showRespList, setShowRespList] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        console.warn('>>> InventarioFormScreen CARREGADO (código novo v2) <<<');
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
                // Conversion logic for transition from boolean to string
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
                    .ilike('sala', `${text}%`)
                    .order('sala', { ascending: true })
                    .limit(50);
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
                    .ilike('responsavel', `${text}%`)
                    .order('responsavel', { ascending: true })
                    .limit(50);
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

                // Verificação de Pendência de Carga
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
        if (!uri || uri.startsWith('http')) return uri; // Mantém se já for uma URL
        console.log('Iniciando upload de:', uri);
        try {
            // Lê o arquivo como base64 usando expo-file-system (mais confiável que fetch/blob no React Native)
            // Fix: Usar string literal 'base64' pois FileSystem.EncodingType pode estar undefined em algumas versões
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            console.log('Arquivo lido como base64, tamanho:', base64.length, 'chars');

            // Converte base64 para ArrayBuffer usando função inline
            const arrayBuffer = base64ToArrayBuffer(base64);
            console.warn('ArrayBuffer criado, enviando para Supabase...');

            const { data, error } = await supabase.storage
                .from('inventory-photos')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error('Erro no upload Supabase:', error);
                throw error;
            }

            console.log('Upload concluído, obtendo URL pública...');
            const { data: { publicUrl } } = supabase.storage.from('inventory-photos').getPublicUrl(fileName);
            console.log('URL pública gerada:', publicUrl);
            return publicUrl;
        } catch (err) {
            console.error('Erro na função uploadPhoto:', err);
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
        // Foto agora é opcional - apenas aviso
        if (!foto1 && !isEdit) {
            console.log('AVISO: foto1 está vazia, enviando sem foto');
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
                console.warn('ERRO no upload:', uploadErr.message);
                // Continua sem foto em vez de abortar
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

            if (result.error) {
                console.warn('ERRO Supabase:', result.error.message);
                throw result.error;
            }

            Alert.alert('Sucesso!', 'Inventário salvo com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            console.warn('ERRO GERAL handleSave:', err.message);
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
            <View style={styles.scannerContainer}>
                <CameraView
                    style={styles.scanner}
                    barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr', 'interleaved2of5', 'codabar'] }}
                    onBarcodeScanned={handleBarcodeScan}
                />
                <View style={styles.scannerOverlay}>
                    <Text style={styles.scannerText}>Aponte para o código de barras</Text>
                    <TouchableOpacity style={styles.scannerClose} onPress={() => setShowScanner(false)}>
                        <Text style={styles.scannerCloseText}>✕ Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Tem Etiqueta?<Text style={styles.required}>*</Text></Text>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, temEtiqueta === 'NÃO' && styles.toggleBtnActive]}
                        onPress={() => setTemEtiqueta('NÃO')}
                    >
                        <Text style={[styles.toggleText, temEtiqueta === 'NÃO' && styles.toggleTextActive]}>NÃO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, temEtiqueta === 'SIM' && styles.toggleBtnActive]}
                        onPress={() => setTemEtiqueta('SIM')}
                    >
                        <Text style={[styles.toggleText, temEtiqueta === 'SIM' && styles.toggleTextActive]}>SIM</Text>
                    </TouchableOpacity>
                </View>

                {temEtiqueta === 'SIM' && (
                    <View style={styles.situacaoContainer}>
                        <Text style={styles.label}>Situação da Etiqueta</Text>
                        <TextInput
                            style={styles.input}
                            value={situacaoEtiqueta}
                            onChangeText={setSituacaoEtiqueta}
                            placeholder="Descreva a situação da etiqueta..."
                            placeholderTextColor="#666"
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

                <Text style={styles.label}>Tombo<Text style={styles.required}>*</Text></Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, styles.inputFlex, tombo && registradoSuap !== null && { borderColor: registradoSuap === 'SIM' ? '#00E676' : '#ff4444' }]}
                        value={tombo}
                        onChangeText={setTombo}
                        onBlur={() => buscarTombo(tombo)}
                        placeholder="Número do tombamento ou descrição (ex: Sem tombamento)"
                        placeholderTextColor="#666"
                        keyboardType="default"
                        autoCapitalize="sentences"
                    />
                    <TouchableOpacity style={styles.scanButton} onPress={() => openScanner('tombo')}>
                        <Text style={styles.scanIcon}>⊞</Text>
                    </TouchableOpacity>
                </View>

                {pendenciaCarga && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ Bem com pendência de carga</Text>
                        <Text style={styles.errorSubText}>Campus SUAP ({patrimonio?.campus}) ≠ Inventariante ({campusParam})</Text>
                    </View>
                )}

                <Text style={styles.label}>Tombo Auxiliar</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, styles.inputFlex]}
                        value={tomboAuxiliar}
                        onChangeText={setTomboAuxiliar}
                        placeholder="Tombo auxiliar (opcional)"
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity style={styles.scanButton} onPress={() => openScanner('auxiliar')}>
                        <Text style={styles.scanIcon}>⊞</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Registrado no SUAP?<Text style={styles.required}>*</Text></Text>
                {searching ? (
                    <ActivityIndicator color="#00E676" style={{ marginVertical: 12 }} />
                ) : (
                    <View style={[styles.suapBadge, { backgroundColor: registradoSuap === 'SIM' ? '#00E676' : registradoSuap === 'NÃO' ? '#ff9800' : '#444' }]}>
                        <Text style={styles.suapBadgeText}>
                            {registradoSuap === null ? 'Aguardando busca...' : registradoSuap}
                        </Text>
                    </View>
                )}

                {registradoSuap === 'SIM' && (
                    <>
                        <Text style={styles.label}>Descrição SUAP</Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{descricaoSuap}</Text>
                        </View>
                        <Text style={styles.label}>Descrição SUAP confere?<Text style={styles.required}>*</Text></Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, descricaoConfere === 'NÃO' && styles.toggleBtnActiveGreen]}
                                onPress={() => setDescricaoConfere('NÃO')}
                            >
                                <Text style={[styles.toggleText, descricaoConfere === 'NÃO' && styles.toggleTextActive]}>NÃO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, descricaoConfere === 'SIM' && styles.toggleBtnActive]}
                                onPress={() => setDescricaoConfere('SIM')}
                            >
                                <Text style={[styles.toggleText, descricaoConfere === 'SIM' && styles.toggleTextActive]}>SIM</Text>
                            </TouchableOpacity>
                        </View>
                        {descricaoConfere === 'NÃO' && (
                            <>
                                <Text style={styles.label}>Descrição Nova<Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={descricaoNova}
                                    onChangeText={setDescricaoNova}
                                    placeholder="Nova descrição do bem"
                                    placeholderTextColor="#666"
                                    multiline
                                />
                            </>
                        )}

                        <Text style={styles.label}>Nº de Série SUAP<Text style={styles.required}>*</Text></Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{numeroSerieSuap || '(vazio)'}</Text>
                        </View>
                        <Text style={styles.label}>Nº de Série SUAP confere?<Text style={styles.required}>*</Text></Text>
                        <View style={styles.toggleRow3}>
                            {['sim', 'nao', 'nsa'].map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.toggleBtn3, numeroSerieConfere === opt && styles.toggleBtnActive]}
                                    onPress={() => setNumeroSerieConfere(opt)}
                                >
                                    <Text style={[styles.toggleText, numeroSerieConfere === opt && styles.toggleTextActive]}>
                                        {opt === 'sim' ? 'Sim' : opt === 'nao' ? 'Não' : 'NSA'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {numeroSerieConfere === 'nao' && (
                            <>
                                <Text style={styles.label}>Novo Nº de Série</Text>
                                <TextInput
                                    style={styles.input}
                                    value={numeroSerieNovo}
                                    onChangeText={setNumeroSerieNovo}
                                    placeholder="Novo número de série"
                                    placeholderTextColor="#666"
                                />
                            </>
                        )}

                        <Text style={styles.label}>Sala SUAP<Text style={styles.required}>*</Text></Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{salaSuap || '(vazio)'}</Text>
                        </View>
                        <Text style={styles.label}>Sala SUAP confere?<Text style={styles.required}>*</Text></Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, salaConfere === 'NÃO' && styles.toggleBtnActiveGreen]}
                                onPress={() => setSalaConfere('NÃO')}
                            >
                                <Text style={[styles.toggleText, salaConfere === 'NÃO' && styles.toggleTextActive]}>NÃO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, salaConfere === 'SIM' && styles.toggleBtnActive]}
                                onPress={() => setSalaConfere('SIM')}
                            >
                                <Text style={[styles.toggleText, salaConfere === 'SIM' && styles.toggleTextActive]}>SIM</Text>
                            </TouchableOpacity>
                        </View>
                        {salaConfere === 'NÃO' && (
                            <View style={{ zIndex: 1000 }}>
                                <Text style={styles.label}>Nova Sala<Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={salaNova}
                                    onChangeText={handleSalaSearch}
                                    placeholder="Comece a digitar o nome da sala..."
                                    placeholderTextColor="#666"
                                />
                                {showRoomList && filteredRooms.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        {filteredRooms.map((room) => (
                                            <TouchableOpacity key={room} style={styles.suggestionItem} onPress={() => selectRoom(room)}>
                                                <Text style={styles.suggestionText}>{room}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={styles.label}>Estado de Conservação SUAP<Text style={styles.required}>*</Text></Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{estadoConservacaoSuap || '(vazio)'}</Text>
                        </View>
                        <Text style={styles.label}>Estado de Conservação SUAP confere?<Text style={styles.required}>*</Text></Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, estadoConservacaoConfere === 'NÃO' && styles.toggleBtnActiveGreen]}
                                onPress={() => setEstadoConservacaoConfere('NÃO')}
                            >
                                <Text style={[styles.toggleText, estadoConservacaoConfere === 'NÃO' && styles.toggleTextActive]}>NÃO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, estadoConservacaoConfere === 'SIM' && styles.toggleBtnActive]}
                                onPress={() => setEstadoConservacaoConfere('SIM')}
                            >
                                <Text style={[styles.toggleText, estadoConservacaoConfere === 'SIM' && styles.toggleTextActive]}>SIM</Text>
                            </TouchableOpacity>
                        </View>
                        {estadoConservacaoConfere === 'NÃO' && (
                            <View style={styles.situacaoContainer}>
                                <Text style={styles.label}>Novo Estado de Conservação<Text style={styles.required}>*</Text></Text>
                                <View style={styles.radioGroup}>
                                    {['Bom', 'Ocioso', 'Antieconômico', 'Irrecuperável', 'Recuperável', 'Não é possível informar'].map((option) => (
                                        <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setEstadoConservacaoNovo(option)}>
                                            <View style={[styles.radioButton, estadoConservacaoNovo === option && styles.radioButtonSelected]}>
                                                {estadoConservacaoNovo === option && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={styles.radioText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Text style={styles.label}>Responsável SUAP<Text style={styles.required}>*</Text></Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{responsavelSuap || '(vazio)'}</Text>
                        </View>
                        <Text style={styles.label}>Responsável SUAP confere?<Text style={styles.required}>*</Text></Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, responsavelConfere === 'NÃO' && styles.toggleBtnActiveGreen]}
                                onPress={() => setResponsavelConfere('NÃO')}
                            >
                                <Text style={[styles.toggleText, responsavelConfere === 'NÃO' && styles.toggleTextActive]}>NÃO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, responsavelConfere === 'SIM' && styles.toggleBtnActive]}
                                onPress={() => setResponsavelConfere('SIM')}
                            >
                                <Text style={[styles.toggleText, responsavelConfere === 'SIM' && styles.toggleTextActive]}>SIM</Text>
                            </TouchableOpacity>
                        </View>
                        {responsavelConfere === 'NÃO' && (
                            <View style={{ zIndex: 1000 }}>
                                <Text style={styles.label}>Novo Responsável<Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={responsavelNovo}
                                    onChangeText={handleRespSearch}
                                    placeholder="Comece a digitar o nome do responsável..."
                                    placeholderTextColor="#666"
                                />
                                {showRespList && filteredResponsaveis.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        {filteredResponsaveis.map((resp) => (
                                            <TouchableOpacity key={resp} style={styles.suggestionItem} onPress={() => selectResponsavel(resp)}>
                                                <Text style={styles.suggestionText}>{resp}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {registradoSuap === 'NÃO' && (
                    <>
                        <Text style={styles.label}>Descrição do Bem<Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={descricaoNova}
                            onChangeText={setDescricaoNova}
                            placeholder="Descreva o bem (Marca, Modelo, Cor...)"
                            placeholderTextColor="#666"
                            multiline
                        />

                        <Text style={styles.label}>Nº de Série</Text>
                        <TextInput
                            style={styles.input}
                            value={numeroSerieNovo}
                            onChangeText={setNumeroSerieNovo}
                            placeholder="Número de série (se houver)"
                            placeholderTextColor="#666"
                        />

                        <View style={{ position: 'relative', zIndex: 2000 }}>
                            <Text style={styles.label}>Sala<Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={salaNova}
                                onChangeText={handleSalaSearch}
                                placeholder="Digite a sala"
                                placeholderTextColor="#666"
                                onFocus={() => setShowRoomList(true)}
                            />
                            {showRoomList && filteredRooms.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    {filteredRooms.map((room) => (
                                        <TouchableOpacity key={room} style={styles.suggestionItem} onPress={() => selectRoom(room)}>
                                            <Text style={styles.suggestionText}>{room}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <Text style={styles.label}>Estado de Conservação<Text style={styles.required}>*</Text></Text>
                        <View style={styles.chipContainer}>
                            {['Bom', 'Regular', 'Ruim', 'Ocioso', 'Irrecuperável'].map((estado) => (
                                <TouchableOpacity
                                    key={estado}
                                    style={[styles.chip, estadoConservacaoNovo === estado && styles.chipActive]}
                                    onPress={() => setEstadoConservacaoNovo(estado)}
                                >
                                    <Text style={[styles.chipText, estadoConservacaoNovo === estado && styles.chipTextActive]}>
                                        {estado}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ position: 'relative', zIndex: 1000, marginTop: 16 }}>
                            <Text style={styles.label}>Responsável<Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={responsavelNovo}
                                onChangeText={handleRespSearch}
                                placeholder="Digite o nome do responsável"
                                placeholderTextColor="#666"
                                onFocus={() => {
                                    if (responsavelNovo.length > 2) handleRespSearch(responsavelNovo);
                                }}
                            />
                            {showRespList && filteredResponsaveis.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    {filteredResponsaveis.map((resp) => (
                                        <TouchableOpacity key={resp} style={styles.suggestionItem} onPress={() => selectResponsavel(resp)}>
                                            <Text style={styles.suggestionText}>{resp}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}

                <Text style={styles.label}>Observações</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={observacoes}
                    onChangeText={setObservacoes}
                    placeholder="Observações (opcional)"
                    placeholderTextColor="#666"
                    multiline
                />

                <Text style={styles.label}>Foto 1 do Bem<Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto(1)}>
                    {foto1 ? <Image source={{ uri: foto1 }} style={styles.photoImage} /> : <Text style={styles.photoIcon}>📷</Text>}
                </TouchableOpacity>

                <Text style={styles.label}>Foto 2 do Bem</Text>
                <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto(2)}>
                    {foto2 ? <Image source={{ uri: foto2 }} style={styles.photoImage} /> : <Text style={styles.photoIcon}>📷</Text>}
                </TouchableOpacity>

                <Text style={styles.label}>Campus SUAP de quem está inventariando<Text style={styles.required}>*</Text></Text>
                <View style={styles.readOnlyField}><Text style={styles.readOnlyTextGreen}>{campusParam}</Text></View>

                <Text style={styles.label}>Campus que está sendo Inventariado<Text style={styles.required}>*</Text></Text>
                <View style={styles.readOnlyField}><Text style={styles.readOnlyTextGreen}>{campusParam}</Text></View>

                <Text style={styles.label}>Sobre a Etiqueta de Item Inventariado</Text>
                <View style={styles.disclaimerBox}>
                    <Text style={styles.disclaimerText}>
                        Escolha um ponto visível e de fácil acesso para COLAR O ADESIVO que indique que o item foi inventariado em 2025 e clique em SALVAR.
                    </Text>
                </View>

                <Text style={styles.label}>Sobre a Veracidade das Informações Prestadas</Text>
                <View style={styles.disclaimerBox}>
                    <Text style={styles.disclaimerText}>
                        Declaro para os devidos fins, sob as penas da lei, que as informações por mim prestadas no presente instrumento são verdadeiras e autênticas.
                    </Text>
                </View>
                <View style={{ height: 80 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <Pressable style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                    style={[styles.saveButton, { backgroundColor: '#FFEA00', borderRadius: 8 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={[styles.saveText, { color: '#000' }]}>ENVIAR INVENTÁRIO</Text>}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },
    label: { color: '#fff', fontSize: 14, marginTop: 16, marginBottom: 6 },
    required: { color: '#00E676', fontSize: 14 },
    input: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 14,
        color: '#fff',
        fontSize: 15,
    },
    inputFlex: { flex: 1 },
    inputRow: { flexDirection: 'row', gap: 8 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    scanButton: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanIcon: { fontSize: 22, color: '#888' },
    toggleRow: { flexDirection: 'row', gap: 12 },
    toggleBtn: {
        flex: 1,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
    toggleBtnActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    toggleBtnActiveGreen: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    toggleText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    toggleTextActive: { color: '#000' },
    toggleRow3: { flexDirection: 'row', gap: 8 },
    toggleBtn3: {
        flex: 1,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
    suapBadge: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    suapBadgeText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    readOnlyField: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 14,
    },
    readOnlyText: { color: '#999', fontSize: 14 },
    readOnlyTextGreen: { color: '#00E676', fontSize: 14 },
    tomboContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        backgroundColor: '#1e1e1e',
        marginBottom: 16,
    },
    tomboContainerError: {
        borderColor: '#ff4444',
        borderWidth: 2,
    },
    errorBanner: {
        backgroundColor: '#3e1e1e',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    errorText: { color: '#ff4444', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    errorSubText: { color: '#ffaaaa', fontSize: 12, textAlign: 'center', marginTop: 4 },
    photoBox: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoIcon: { fontSize: 30 },
    photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    disclaimerBox: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 14,
    },
    disclaimerText: { color: '#888', fontSize: 13, lineHeight: 20 },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingBottom: 40, // Increased padding for bottom navigation
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
        elevation: 10,
        zIndex: 10,
    },
    cancelButton: { paddingVertical: 8, paddingHorizontal: 20 },
    cancelText: { color: '#fff', fontSize: 16 },
    saveButton: { paddingVertical: 8, paddingHorizontal: 20 },
    saveText: { color: '#00E676', fontSize: 16, fontWeight: 'bold' },
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    scanner: { flex: 1 },
    scannerOverlay: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scannerText: { color: '#fff', fontSize: 16, marginBottom: 20 },
    scannerClose: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    scannerCloseText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    situacaoContainer: {
        backgroundColor: '#1a1a1a',
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    chip: {
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    chipActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    chipText: {
        color: '#ccc',
        fontSize: 12,
    },
    chipTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },
    radioGroup: {
        marginTop: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    radioButton: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#00E676',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioButtonSelected: {
        backgroundColor: 'transparent',
    },
    radioInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#00E676',
    },
    radioText: {
        color: '#fff',
        fontSize: 15,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#00E676',
        borderRadius: 8,
        zIndex: 9999,
        elevation: 15,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    suggestionText: {
        color: '#fff',
        fontSize: 14,
    },
});
