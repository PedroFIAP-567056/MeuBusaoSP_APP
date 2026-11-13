import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import InicioScreen from './src/screens/InicioScreen';
import PontoScreen from './src/screens/PontoScreen';
import { CORES } from './src/cores';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: CORES.primaria },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="Inicio" component={InicioScreen} options={{ title: 'Meu Busão SP' }} />
          <Stack.Screen name="Ponto" component={PontoScreen} options={{ title: 'Próximos ônibus' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
