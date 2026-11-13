// Alertas para o usuário: notificação (expo-notifications), vibração e Alert
import { Alert, Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

// Mostra a notificação mesmo com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Devolve true se o usuário deixou o app mandar notificações
export async function pedirPermissaoNotificacao() {
  // no Android 13+ é preciso ter um canal criado antes de pedir a permissão
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Avisos de ônibus',
        importance: Notifications.AndroidImportance.MAX,
      });
    } catch (erro) {
      // se não der para criar o canal, o Expo usa um canal padrão
    }
  }

  try {
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;

    const resposta = await Notifications.requestPermissionsAsync();
    return resposta.granted;
  } catch (erro) {
    return false;
  }
}

export async function avisar(titulo, texto) {
  Vibration.vibrate([0, 500, 200, 500]);
  Alert.alert(titulo, texto);

  try {
    // notificação local, criada pelo próprio app (trigger null = mostrar agora)
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: texto },
      trigger: null,
    });
  } catch (erro) {
    // sem permissão de notificação: o Alert e a vibração já avisaram
  }
}
