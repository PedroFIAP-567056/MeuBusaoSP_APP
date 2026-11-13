import { useState, useEffect } from 'react';
import { View, Text, FlatList, Switch, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { buscarNaApi, minutosAte } from '../api';
import { distanciaEmMetros, minutosAPe, textoDistancia } from '../localizacao';
import { pedirPermissaoNotificacao, avisar } from '../notificacao';
import CartaoLinha from '../components/CartaoLinha';
import Rodape from '../components/Rodape';
import { CORES } from '../cores';

const FOLGA_EM_MINUTOS = 2;
const TEMPO_MAXIMO_A_PE = 30; // mais longe que isso, o aviso não faz sentido

export default function PontoScreen({ route }) {
  const ponto = route.params.ponto;
  const [previsao, setPrevisao] = useState(null);
  const [erro, setErro] = useState('');
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [soAcessiveis, setSoAcessiveis] = useState(false);
  const [linhaAvisar, setLinhaAvisar] = useState(null); // cl (código) da linha escolhida

  // Previsão de chegada: carrega agora e de novo a cada 30 segundos
  useEffect(() => {
    async function carregarPrevisao() {
      const dados = await buscarNaApi(`Previsao/Parada?codigoParada=${ponto.cp}`);
      if (dados.erro) {
        setErro(dados.erro);
        return;
      }
      setErro('');
      setPrevisao(dados);
    }

    carregarPrevisao();
    const timer = setInterval(carregarPrevisao, 30000);
    return () => clearInterval(timer); // para de atualizar quando sai da tela
  }, []);

  // GPS contínuo: atualiza a distância até o ponto enquanto o usuário anda
  useEffect(() => {
    let assinatura = null;
    let saiuDaTela = false;

    async function acompanharPosicao() {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) return;

      const novaAssinatura = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (local) => setMinhaPosicao(local.coords)
      );

      if (saiuDaTela) {
        novaAssinatura.remove();
      } else {
        assinatura = novaAssinatura;
      }
    }

    acompanharPosicao();
    return () => {
      saiuDaTela = true;
      if (assinatura) assinatura.remove();
    };
  }, []);

  let distancia = null;
  let tempoAPe = 0;
  if (minhaPosicao) {
    distancia = distanciaEmMetros(minhaPosicao.latitude, minhaPosicao.longitude, ponto.py, ponto.px);
    tempoAPe = minutosAPe(distancia);
  }

  function onibusDaLinha(linha) {
    if (soAcessiveis) return linha.vs.filter((o) => o.a);
    return linha.vs;
  }

  // Toda vez que chega previsão nova ou o usuário anda, confere se já é hora de sair
  useEffect(() => {
    if (linhaAvisar === null || !previsao || !previsao.p) return;

    const linha = previsao.p.l.find((l) => l.cl === linhaAvisar);
    if (!linha) return;

    // só interessa o primeiro ônibus que ainda dá tempo de pegar andando até o ponto
    const onibus = onibusDaLinha(linha).filter((o) => minutosAte(previsao.hr, o.t) >= tempoAPe);
    if (onibus.length === 0) return;

    const minutos = minutosAte(previsao.hr, onibus[0].t);

    if (minutos <= tempoAPe + FOLGA_EM_MINUTOS) {
      const chegada = minutos <= 0 ? 'está chegando' : `chega em ${minutos} min`;
      if (tempoAPe > 1) {
        avisar('Hora de sair!', `O ${linha.c} ${chegada} e você leva ${tempoAPe} min a pé até o ponto.`);
      } else {
        avisar('Seu ônibus está chegando!', `O ${linha.c} ${chegada} no ponto ${ponto.np}.`);
      }
      setLinhaAvisar(null); // avisa uma vez só
    }
  }, [previsao, tempoAPe, linhaAvisar, soAcessiveis]);

  async function escolherLinha(linha) {
    if (linhaAvisar === linha.cl) {
      setLinhaAvisar(null);
      return;
    }

    if (tempoAPe > TEMPO_MAXIMO_A_PE) {
      Alert.alert(
        'Ponto muito longe',
        `Você está a ${textoDistancia(distancia)} (${tempoAPe} min a pé). Escolha um ponto mais perto para usar o aviso.`
      );
      return;
    }

    const permitiu = await pedirPermissaoNotificacao();
    if (!permitiu) {
      Alert.alert(
        'Notificações desligadas',
        'Sem permissão de notificação, vamos avisar só com vibração e alerta enquanto o app estiver aberto.'
      );
    }
    setLinhaAvisar(linha.cl);
  }

  // quando não tem nenhum ônibus previsto, o "p" vem null
  let linhas = [];
  if (previsao && previsao.p) {
    linhas = previsao.p.l.filter((linha) => onibusDaLinha(linha).length > 0);
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.nome}>{ponto.np}</Text>
        <Text style={styles.texto}>{ponto.ed}</Text>

        {distancia !== null ? (
          <Text style={styles.distancia}>
            Você está a {textoDistancia(distancia)} ({tempoAPe} min a pé)
          </Text>
        ) : (
          <Text style={styles.texto}>Ative a localização para calcular a hora de sair.</Text>
        )}

        {previsao && <Text style={styles.texto}>Atualizado às {previsao.hr} (a cada 30 s)</Text>}

        <View style={styles.filtro}>
          <Text style={styles.textoFiltro}>Só ônibus acessíveis</Text>
          <Switch value={soAcessiveis} onValueChange={setSoAcessiveis} />
        </View>
      </View>

      {linhaAvisar !== null && (
        <Text style={styles.aviso}>
          Vamos vibrar e te avisar quando for hora de ir para o ponto. Deixe o app aberto.
        </Text>
      )}

      {erro !== '' && <Text style={styles.mensagem}>{erro}</Text>}

      {previsao === null && erro === '' ? (
        <ActivityIndicator size="large" color={CORES.primaria} style={styles.carregando} />
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(item) => String(item.cl)}
          renderItem={({ item }) => (
            <CartaoLinha
              linha={item}
              onibus={onibusDaLinha(item)}
              horaAtual={previsao.hr}
              avisando={linhaAvisar === item.cl}
              onAvisar={() => escolherLinha(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.mensagem}>Nenhum ônibus previsto agora.</Text>}
          contentContainerStyle={styles.lista}
        />
      )}

      <Rodape />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  cabecalho: { padding: 16, backgroundColor: CORES.cartao, borderBottomWidth: 1, borderBottomColor: CORES.borda },
  nome: { fontSize: 22, fontWeight: 'bold', color: CORES.texto },
  texto: { fontSize: 15, color: CORES.textoFraco, marginTop: 4 },
  distancia: { fontSize: 18, fontWeight: 'bold', color: CORES.primaria, marginTop: 8 },
  filtro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  textoFiltro: { fontSize: 16, color: CORES.texto },
  aviso: {
    fontSize: 16,
    color: CORES.sucesso,
    backgroundColor: CORES.sucessoClaro,
    padding: 12,
    margin: 12,
    marginBottom: 0,
    borderRadius: 10,
  },
  mensagem: { fontSize: 17, color: CORES.textoFraco, textAlign: 'center', margin: 20 },
  carregando: { marginTop: 30 },
  lista: { paddingBottom: 12 },
});
