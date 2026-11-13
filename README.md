# Meu Busão SP

Trabalho da Global Solution 2026.2 de Cross-Platform Application Development (FIAP).

App mobile em React Native (Expo) que usa a API Olho Vivo da SPTrans, o GPS e os alertas do
celular para quem anda de ônibus em São Paulo **não perder o ônibus**.

**Vídeo do app funcionando:** https://www.youtube.com/shorts/L423pK_XS6o

## O que o app faz

**Pontos perto de mim**
- Usa o GPS para descobrir onde o usuário está
- Como a API não busca pontos por coordenada, o app pega a posição de todos os ônibus da cidade,
  separa as linhas que têm ônibus passando a menos de 1 km do usuário e busca os pontos dessas linhas
- Ordena os pontos do mais perto para o mais longe
- Mostra a distância e quantos minutos a pé até cada ponto
- Também dá para buscar digitando o nome de uma rua ou ponto

**Próximos ônibus do ponto**
- Mostra as linhas que vão passar e em quantos minutos chegam os próximos ônibus
- Atualiza sozinho a cada 30 segundos
- Acompanha o GPS enquanto o usuário anda e atualiza a distância até o ponto
- Filtro para mostrar só ônibus acessíveis

**Me avisar a hora de sair**
- O usuário escolhe a linha que quer pegar
- O app compara o tempo que o ônibus leva para chegar com o tempo que o usuário leva a pé até o ponto (GPS)
- Quando chega a hora de sair (tempo a pé + 2 minutos de folga), o celular vibra, mostra um alerta e
  manda uma notificação: *"Hora de sair! O 875A-10 chega em 7 min e você leva 5 min a pé até o ponto."*
- Se o usuário já está no ponto, avisa quando o ônibus estiver chegando

## Permissões

- **Localização**: pedida quando o usuário toca em "Pontos perto de mim". Se negar, o app explica
  por que precisa dela, e se negar de vez mostra um botão para abrir as configurações do celular.
  Se o GPS estiver desligado, o app avisa para ligar.
- **Notificação**: pedida só quando o usuário ativa um aviso. Se negar, o app continua avisando
  com vibração e alerta na tela.

## Arquivos

- `App.js`: navegação entre as telas
- `src/screens/InicioScreen.js`: tela inicial, busca de pontos perto do usuário
- `src/screens/PontoScreen.js`: previsão de chegada e aviso da hora de sair
- `src/components/`: cartão do ponto, cartão da linha e rodapé com o crédito da SPTrans
- `src/api.js`: login e chamadas da API Olho Vivo
- `src/localizacao.js`: GPS (expo-location) e cálculo de distância
- `src/notificacao.js`: notificação (expo-notifications), vibração e alerta
- `src/cores.js`: cores do app

## Endpoints usados

- `POST /Login/Autenticar?token=` faz o login (a API guarda a sessão em um cookie)
- `GET /Posicao` posição de todos os ônibus, para achar as linhas que passam perto do usuário
- `GET /Parada/BuscarParadasPorLinha?codigoLinha=` pontos de cada uma dessas linhas
- `GET /Previsao/Linha?codigoLinha=` pontos da linha, quando a lista acima vem vazia
- `GET /Parada/Buscar?termosBusca=` busca de pontos digitando o nome da rua
- `GET /Previsao/Parada?codigoParada=` previsão de chegada das linhas no ponto

## Limitação da API

A API Olho Vivo não busca pontos por coordenada, e a base de pontos dela só cobre parte das
paradas da cidade: `Parada/BuscarParadasPorLinha` costuma vir vazio, alguns pontos vêm sem nome
e pontos de ruas de bairro podem não aparecer nem buscando pelo nome. Por isso o "Pontos perto de
mim" pode mostrar pontos mais longe que o ponto realmente mais próximo.

Uma melhoria futura é usar a lista completa de pontos do GTFS da SPTrans (cerca de 22 mil pontos)
para achar o ponto mais próximo, e continuar usando a API Olho Vivo para a previsão em tempo real.

## Como rodar

1. Gere um token na [área de desenvolvedores da SPTrans](https://www.sptrans.com.br/desenvolvedores/)
2. Na pasta do projeto, crie um arquivo `.env` com o token (esse arquivo não vai para o GitHub):

   ```
   EXPO_PUBLIC_OLHOVIVO_TOKEN=seu_token
   ```

3. Instale as dependências e rode:

   ```
   npm install
   npx expo start
   ```

4. Leia o QR Code com o app Expo Go (Android) ou com a câmera (iPhone). O celular e o computador
   precisam estar na mesma rede Wi-Fi; se não for possível, use `npx expo start --tunnel`.

O aviso funciona com o app aberto (no Expo Go o app não roda em segundo plano).

## Tecnologias

React Native, Expo, React Navigation, expo-location, expo-notifications e a API Olho Vivo.

Dados fornecidos pela SPTrans.

Integrantes: ver `participantes.txt`.
