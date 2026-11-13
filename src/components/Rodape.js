import { Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORES } from '../cores';

// Crédito obrigatório: os dados são da SPTrans
export default function Rodape() {
  const margens = useSafeAreaInsets();

  return (
    <Text style={[styles.rodape, { paddingBottom: margens.bottom + 8 }]}>
      Dados fornecidos pela SPTrans (API Olho Vivo)
    </Text>
  );
}

const styles = StyleSheet.create({
  rodape: {
    textAlign: 'center',
    fontSize: 13,
    color: CORES.textoFraco,
    paddingTop: 8,
    backgroundColor: CORES.fundo,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
});
