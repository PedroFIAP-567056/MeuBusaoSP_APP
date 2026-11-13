import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { minutosAPe, textoDistancia } from '../localizacao';
import { CORES } from '../cores';

// Um ponto de ônibus da lista da tela inicial
export default function CartaoPonto({ ponto, onPress }) {
  return (
    <TouchableOpacity style={styles.cartao} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.nome}>{ponto.np}</Text>
        <Text style={styles.endereco}>{ponto.ed}</Text>
      </View>

      {ponto.distancia !== undefined && (
        <View style={styles.distancia}>
          <Text style={styles.metros}>{textoDistancia(ponto.distancia)}</Text>
          <Text style={styles.endereco}>{minutosAPe(ponto.distancia)} min a pé</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.cartao,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  info: { flex: 1 },
  nome: { fontSize: 18, fontWeight: 'bold', color: CORES.texto },
  endereco: { fontSize: 15, color: CORES.textoFraco, marginTop: 2 },
  distancia: { alignItems: 'flex-end', marginLeft: 12 },
  metros: { fontSize: 18, fontWeight: 'bold', color: CORES.primaria },
});
