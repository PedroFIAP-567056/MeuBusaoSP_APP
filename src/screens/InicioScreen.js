import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { buscarNaApi } from '../api';
import { pegarLocalizacao, distanciaEmMetros } from '../localizacao';
import CartaoPonto from '../components/CartaoPonto';
import Rodape from '../components/Rodape';
import { CORES } from '../cores';

export default function InicioScreen({ navigation }) {
  const [termo, setTermo] = useState('');
  const [pontos, setPontos] = useState([]);
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('Toque em "Pontos perto de mim" ou digite o nome de uma rua.');
  const [gpsBloqueado, setGpsBloqueado] = useState(false);

  async function buscarPertoDeMim() {
    setCarregando(true);
    setPontos([]);
    setMensagem('Pegando sua localização...');

    const local = await pegarLocalizacao();
    if (local.erro) {
      setMensagem(local.erro);
      setGpsBloqueado(local.bloqueado === true);
      setCarregando(false);
      return;
    }
    setGpsBloqueado(false);
    setMinhaPosicao(local);

    // A API não busca pontos por coordenada. Então:
    // 1. pegamos a posição de todos os ônibus da cidade agora
    setMensagem('Procurando ônibus passando perto de você...');
    const posicoes = await buscarNaApi('Posicao');
    if (posicoes.erro) {
      setMensagem(posicoes.erro);
      setCarregando(false);
      return;
    }

    // 2. guardamos as linhas que têm algum ônibus a menos de 1 km do usuário
    const linhasPerto = [];
    for (const linha of posicoes.l) {
      let menorDistancia = Infinity;
      for (const onibus of linha.vs) {
        const metros = distanciaEmMetros(local.latitude, local.longitude, onibus.py, onibus.px);
        if (metros < menorDistancia) menorDistancia = metros;
      }
      if (menorDistancia < 1000) {
        linhasPerto.push({ cl: linha.cl, distancia: menorDistancia });
      }
    }
    linhasPerto.sort((a, b) => a.distancia - b.distancia);

    if (linhasPerto.length === 0) {
      setMensagem('Nenhum ônibus passando perto de você agora. Digite o nome de uma rua próxima.');
      setCarregando(false);
      return;
    }

    // 3. buscamos os pontos das linhas mais perto, sem repetir o mesmo ponto (cp)
    setMensagem('Buscando os pontos dessas linhas...');
    const todos = [];
    for (const linha of linhasPerto.slice(0, 8)) {
      let paradas = await buscarNaApi(`Parada/BuscarParadasPorLinha?codigoLinha=${linha.cl}`);

      // essa lista costuma vir vazia; aí usamos os pontos da previsão da linha
      if (paradas.erro || paradas.length === 0) {
        const previsaoLinha = await buscarNaApi(`Previsao/Linha?codigoLinha=${linha.cl}`);
        if (previsaoLinha.erro || !previsaoLinha.ps) continue;
        paradas = previsaoLinha.ps;
      }

      for (const parada of paradas) {
        if (!todos.some((p) => p.cp === parada.cp)) {
          todos.push(parada);
        }
      }
    }

    // 4. mostrarPontos ordena pela distância, então os pontos do bairro ficam em cima
    setCarregando(false);
    mostrarPontos(todos, local, 'Nenhum ponto encontrado perto de você. Digite o nome de uma rua próxima.');
  }

  async function buscarPontos(texto, posicao) {
    if (texto.trim() === '') return;
    setCarregando(true);
    setPontos([]);
    setMensagem('Buscando pontos...');

    const dados = await buscarNaApi(`Parada/Buscar?termosBusca=${encodeURIComponent(texto)}`);
    setCarregando(false);

    if (dados.erro) {
      setMensagem(dados.erro);
      return;
    }
    mostrarPontos(dados, posicao, `Nenhum ponto encontrado para "${texto}". Tente o nome de outra rua.`);
  }

  function mostrarPontos(paradas, posicao, mensagemVazia) {
    if (paradas.length === 0) {
      setMensagem(mensagemVazia);
      setPontos([]);
      return;
    }

    // alguns pontos vêm da API sem nome
    let lista = paradas.map((p) => ({ ...p, np: p.np || `Ponto ${p.cp}` }));

    if (posicao) {
      // py = latitude, px = longitude
      lista = lista.map((p) => ({
        ...p,
        distancia: distanciaEmMetros(posicao.latitude, posicao.longitude, p.py, p.px),
      }));
      lista.sort((a, b) => a.distancia - b.distancia);
    }

    setPontos(lista.slice(0, 20));
    setMensagem('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <TouchableOpacity style={styles.botaoGps} onPress={buscarPertoDeMim} disabled={carregando}>
          <Text style={styles.textoBotaoGps}>Pontos perto de mim</Text>
        </TouchableOpacity>

        <View style={styles.busca}>
          <TextInput
            style={styles.campo}
            placeholder="Nome da rua ou do ponto"
            placeholderTextColor={CORES.textoFraco}
            value={termo}
            onChangeText={setTermo}
            onSubmitEditing={() => buscarPontos(termo, minhaPosicao)}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.botaoBuscar} onPress={() => buscarPontos(termo, minhaPosicao)}>
            <Text style={styles.textoBotaoBuscar}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {carregando && <ActivityIndicator size="large" color={CORES.primaria} style={styles.carregando} />}

      {mensagem !== '' && <Text style={styles.mensagem}>{mensagem}</Text>}

      {gpsBloqueado && (
        <TouchableOpacity style={styles.botaoConfig} onPress={() => Linking.openSettings()}>
          <Text style={styles.textoBotaoBuscar}>Abrir configurações do celular</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={pontos}
        keyExtractor={(item) => String(item.cp)}
        renderItem={({ item }) => (
          <CartaoPonto ponto={item} onPress={() => navigation.navigate('Ponto', { ponto: item })} />
        )}
        contentContainerStyle={styles.lista}
      />

      <Rodape />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  topo: { padding: 12, backgroundColor: CORES.cartao, borderBottomWidth: 1, borderBottomColor: CORES.borda },
  botaoGps: {
    backgroundColor: CORES.primaria,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotaoGps: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  busca: { flexDirection: 'row', marginTop: 12 },
  campo: {
    flex: 1,
    fontSize: 17,
    color: CORES.texto,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  botaoBuscar: {
    marginLeft: 8,
    backgroundColor: CORES.texto,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textoBotaoBuscar: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  carregando: { marginTop: 20 },
  mensagem: { fontSize: 17, color: CORES.textoFraco, textAlign: 'center', margin: 20 },
  botaoConfig: {
    alignSelf: 'center',
    backgroundColor: CORES.texto,
    padding: 12,
    borderRadius: 10,
  },
  lista: { paddingBottom: 12 },
});
