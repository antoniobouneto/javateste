# GeoDiário

Aplicação web para registrar momentos com uma foto, título, data/hora e localização GPS. Os registros ficam armazenados localmente no navegador e podem ser consultados em lista, no mapa ou em uma tela de detalhes.

## Funcionalidades

- Capturar uma foto usando a câmera do dispositivo ou escolher uma imagem existente.
- Obter a localização pelo GPS ou informar latitude e longitude manualmente.
- Consultar o endereço aproximado das coordenadas via serviço de geocodificação reversa do OpenStreetMap (Nominatim).
- Pesquisar registros por título ou endereço, visualizar detalhes, compartilhar informações e excluir registros.
- Ver um mapa OpenStreetMap centrado no registro selecionado.

## Arquitetura

O GeoDiário é uma aplicação frontend React executada no navegador. O fluxo principal é: `src/main.tsx` monta `App`; `App` carrega os registros pelo serviço `storage.ts` e controla a tela atual; os componentes de interface chamam as funções de armazenamento e devolvem as alterações para `App` por meio de callbacks.

```text
index.html                 Documento HTML e ponto de montagem (#root)
src/
  main.tsx                 Inicializa React e renderiza App
  App.tsx                  Estado global da interface e navegação entre telas
  components/
    Header.tsx             Navegação entre lista e mapa; ação para novo registro
    EntriesList.tsx        Lista e pesquisa de registros
    EntryForm.tsx          Formulário de criação e validação dos campos
    ImageCapture.tsx       Captura pela câmera ou seleção de arquivo
    LocationCapture.tsx    GPS, coordenadas manuais e consulta de endereço
    EntryDetail.tsx        Detalhes, compartilhamento, mapa e exclusão
    MapView.tsx            Mapa e seletor de registros
  services/
    storage.ts             Persistência local em IndexedDB, com fallback
  types/
    diary.ts               Tipos DiaryEntry e LocationDataResult
public/                    Ícones, splash e imagens estáticas
package.json               Dependências e comandos de desenvolvimento
vite.config.ts             Vite, plugins React/Tailwind e alias @
```

### Fluxo de criação e leitura

1. `EntryForm` coleta título, imagem e localização. O botão de salvar só fica habilitado quando os três dados estão preenchidos.
2. `ImageCapture` usa `getUserMedia` para abrir a câmera e converte a foto capturada em uma URL de dados (Data URL); também aceita imagens escolhidas no dispositivo.
3. `LocationCapture` usa a API de geolocalização do navegador. Opcionalmente consulta Nominatim para obter o endereço; se necessário, permite inserir as coordenadas manualmente.
4. Ao salvar, `EntryForm` monta um `DiaryEntry` com identificador, título, imagem, coordenadas e data/hora ISO e chama `insertEntry`.
5. `storage.ts` grava no IndexedDB. `App` atualiza a lista em memória e mostra os detalhes do registro.
6. Na inicialização, `App` chama `getAllEntries`; a lista é ordenada da data mais recente para a mais antiga. Se o IndexedDB não estiver disponível ou falhar, o serviço tenta usar `localStorage`.

### Persistência e formato dos dados

Os dados são mantidos no dispositivo/navegador e não há sincronização com uma conta ou banco de dados remoto implementada. O IndexedDB usa o banco `geodiario_db`, o object store `records` e `id` como chave. Imagens são armazenadas junto ao registro como Data URLs, o que pode consumir bastante espaço.

O tipo `DiaryEntry` define o formato persistido:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador do registro |
| `title` | Título ou descrição |
| `imageData` | Data URL da imagem (ou URL nas entradas de demonstração) |
| `latitude`, `longitude` | Coordenadas geográficas |
| `createdAt` | Data/hora em formato ISO 8601 |
| `address` | Endereço aproximado, opcional |

Quando o armazenamento está vazio e o navegador ainda não marcou `geodiario_initialized` no `localStorage`, `getAllEntries` insere dois registros de demonstração. Depois de limpar os dados, a chave de inicialização influencia se esses exemplos serão inseridos novamente.

## Como funciona a API

**Este projeto não implementa uma API HTTP própria nem endpoints REST.** A dependência Express aparece no `package.json`, mas não há servidor Express ou rotas de API no código da aplicação analisado. A interface funciona como frontend e utiliza estas APIs/serviços do navegador e externos:

- **IndexedDB** e, como alternativa em caso de falha, **localStorage**: persistência dos registros no navegador.
- **MediaDevices (`getUserMedia`)** e entrada de arquivo: acesso à câmera e seleção de fotos, sujeitos à permissão do usuário e às restrições do navegador.
- **Geolocation API**: obtenção das coordenadas, mediante permissão do usuário.
- **Nominatim / OpenStreetMap**: consulta HTTP de geocodificação reversa para converter coordenadas em um endereço legível. A consulta é opcional; se falhar, o registro pode continuar sem endereço.
- **OpenStreetMap**: mapas incorporados via `iframe`; a tela de detalhes também oferece links externos para OpenStreetMap e Google Maps.

A dependência `@google/genai` e as variáveis `GEMINI_API_KEY`, `APP_URL` e `GOOGLE_MAPS_API_KEY` estão listadas na configuração/template do projeto, mas não há integração com Gemini ou Google Maps API usada no fluxo atual da aplicação. As chaves não são necessárias para executar a interface localmente. Não coloque segredos no código frontend: qualquer variável incorporada ao bundle do navegador pode ser vista pelos usuários.

## Requisitos

- [Bun](https://bun.sh/) instalado (o repositório inclui `bun.lock`).
- Navegador moderno. Para câmera e geolocalização, conceda as permissões solicitadas; esses recursos normalmente exigem contexto seguro (HTTPS) ou `localhost`.

## Executar localmente

```bash
bun install
bun run dev
```

O Vite inicia o servidor na porta `3000`; abra `http://localhost:3000` no navegador.

Comandos adicionais:

```bash
bun run build    # gera a versão de produção em dist/
bun run preview  # serve localmente a versão compilada
bun run lint     # verifica os tipos com tsc --noEmit
```

Não há script de testes automatizados definido em `package.json`.

## Observações

- Os registros são locais ao navegador e dispositivo. Limpar os dados do site pode apagá-los; não há backup ou sincronização remota.
- O endereço depende de conexão com a internet e da disponibilidade/política do serviço Nominatim.
- Os mapas são carregados de OpenStreetMap e também dependem de conexão.
- A aplicação solicita câmera e geolocalização conforme `metadata.json`; o usuário precisa autorizar essas permissões.
