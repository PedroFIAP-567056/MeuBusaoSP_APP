// Acesso à API Olho Vivo da SPTrans
const URL_API = 'https://api.olhovivo.sptrans.com.br/v2.1';

// O token fica no arquivo .env (que não vai para o GitHub)
const TOKEN = process.env.EXPO_PUBLIC_OLHOVIVO_TOKEN;

let logado = false;

// A API responde true e devolve um cookie de sessão,
// que o celular guarda e manda sozinho nas próximas chamadas
async function autenticar() {
  const resposta = await fetch(`${URL_API}/Login/Autenticar?token=${TOKEN}`, {
    method: 'POST',
    credentials: 'include',
  });
  logado = await resposta.json();
}

// Exemplo: buscarNaApi('Parada/Buscar?termosBusca=Paulista')
export async function buscarNaApi(rota) {
  try {
    if (!logado) {
      await autenticar();
    }
    if (!logado) {
      return { erro: 'Não foi possível entrar na API da SPTrans. Confira o token no arquivo .env' };
    }

    const url = `${URL_API}/${rota}`;
    let resposta = await fetch(url, { credentials: 'include' });

    // a sessão expirou: faz login de novo e tenta mais uma vez
    if (resposta.status === 401) {
      await autenticar();
      resposta = await fetch(url, { credentials: 'include' });
    }

    if (!resposta.ok) {
      return { erro: 'A API da SPTrans retornou erro ' + resposta.status };
    }

    return await resposta.json();
  } catch (erro) {
    return { erro: 'Sem conexão com a internet. Tente novamente.' };
  }
}

// Minutos entre dois horários "HH:MM"
export function minutosAte(horarioAtual, horarioChegada) {
  const [hAtual, mAtual] = horarioAtual.split(':');
  const [hChegada, mChegada] = horarioChegada.split(':');

  const totalMinutosChegada = (hChegada * 60) + Number(mChegada);
  const totalMinutosAtual = (hAtual * 60) + Number(mAtual);

  let minutos = totalMinutosChegada - totalMinutosAtual;

  // passou da meia-noite (ex: agora 23:58, chega 00:03)
  if (minutos < -720) minutos += 1440;

  return minutos;
}
