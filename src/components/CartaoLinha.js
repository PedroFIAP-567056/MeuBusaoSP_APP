import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { minutosAte } from '../api';
import { CORES } from '../cores';

// Uma linha que passa no ponto, com os próximos ônibus
// linha.c = letreiro, linha.lt0 = destino, onibus[].t = hora prevista, onibus[].a = acessível
export default function CartaoLinha({ linha, onibus, horaAtual, avisando, onAvisar }) {
  return (
    <View style={styles.cartao}>
      <View style={styles.topo}>
        <Text style={styles.letreiro}>{linha.c}</Text>
        <Text style={styles.destino}>para {linha.lt0}</Text>
      </View>

      <View style={styles.tempos}>
        {onibus.slice(0, 3).map((o) => {
          const minutos = minutosAte(horaAtual, o.t);
          return (
            <View key={o.p} style={styles.tempo}>
              <Text style={styles.minutos}>{minutos <= 0 ? 'Chegando' : minutos + ' min'}</Text>
              <Text style={styles.detalhe}>{o.t}{o.a ? ' · acessível' : ''}</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.botao, avisando && styles.botaoAtivo]}
        onPress={onAvisar}
      >
        <Text style={[styles.textoBotao, avisando && styles.textoBotaoAtivo]}>
          {avisando ? 'Avisando (toque para cancelar)' : 'Me avisar a hora de sair'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: CORES.cartao,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  topo: { flexDirection: 'row', alignItems: 'center' },
  letreiro: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: CORES.primaria,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  destino: { flex: 1, fontSize: 16, color: CORES.texto, marginLeft: 10 },
  tempos: { flexDirection: 'row', marginTop: 12 },
  tempo: { marginRight: 24 },
  minutos: { fontSize: 22, fontWeight: 'bold', color: CORES.texto },
  detalhe: { fontSize: 14, color: CORES.textoFraco },
  botao: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CORES.primaria,
    alignItems: 'center',
  },
  botaoAtivo: { backgroundColor: CORES.sucesso, borderColor: CORES.sucesso },
  textoBotao: { fontSize: 16, fontWeight: 'bold', color: CORES.primaria },
  textoBotaoAtivo: { color: '#FFFFFF' },
});
