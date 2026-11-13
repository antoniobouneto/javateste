# GeoDiário (Flutter)

Aplicação Flutter (Dart) para registrar momentos com foto, título, data/hora e localização GPS. Os registros são armazenados localmente no dispositivo em um banco **SQLite** e podem ser consultados em lista, no mapa ou em uma tela de detalhes.

> **Código-fonte completo do projeto Flutter**: todo o código-fonte está neste diretório, com a implementação principal em `lib/` (`main.dart`, `models/`, `services/`) e configurações do projeto em `pubspec.yaml`, `android/`, `ios/`, `web/`, etc.

## Descrição das funcionalidades implementadas

- **Lista de registros**
  - Exibição dos registros salvos em cards (miniatura, título, data/hora e coordenadas), ordenados do mais recente para o mais antigo.
  - Busca por **título** ou **endereço** com opção de limpar a busca.
  - Estado vazio com atalho para criar o primeiro registro.
  - Contador de registros no cabeçalho e alternância entre visualização em **Lista** e **Mapa**.
  - Botão de ação flutuante (**Novo registro**) na tela de lista.

- **Criação de registro (formulário)**
  - **Fotografia do momento**: captura pela câmera ou seleção de imagem da galeria (via seletor de imagens), com pré-visualização e opção de trocar a foto. A imagem é armazenada como *data URL* em Base64.
  - **Título/descrição**: campo de texto obrigatório.
  - **Localização geográfica (GPS)**: obtenção das coordenadas atuais pelo GPS do dispositivo, com exibição de latitude/longitude e endereço (quando disponível).
  - **Coordenadas manuais**: ajuste/definição manual de latitude e longitude.
  - **Geocodificação reversa**: consulta ao serviço Nominatim (OpenStreetMap) para obter o endereço aproximado a partir das coordenadas (opcional; falhas não impedem o registro).
  - **Data e hora**: registradas automaticamente no momento em que o registro é salvo (exibidas em prévia no formulário).
  - **Validação**: o salvamento só é habilitado quando título, foto e localização estão preenchidos.
  - Feedback de sucesso ao salvar.

- **Detalhes do registro**
  - Visualização da foto, título, endereço (quando disponível), data/hora e coordenadas (latitude/longitude).
  - **Mapa incorporado** (OpenStreetMap via `flutter_map`) centralizado no local do registro com marcador.
  - **Links externos** para abrir o local no Google Maps e no OpenStreetMap.
  - **Compartilhamento** das informações do registro (título e coordenadas).
  - **Exclusão** do registro com diálogo de confirmação e remoção permanente do dispositivo, com feedback de sucesso.

- **Mapa de registros**
  - Mapa com **marcadores** de todos os registros salvos.
  - Seleção de registros por toque nos marcadores ou por chips/lista de seleção.
  - Cartão do registro ativo com miniatura, coordenadas e atalho para ver os detalhes completos.

- **Persistência e dados iniciais**
  - Armazenamento local em **SQLite** (sem sincronização remota).
  - Inserção automática de **registros de demonstração** quando o banco está vazio, para facilitar a visualização inicial do app.

## Bibliotecas utilizadas

| Biblioteca | Uso |
| --- | --- |
| `flutter` (SDK) | Framework de UI e execução da aplicação. |
| `cupertino_icons` | Ícones no estilo iOS (suporte do Material/Cupertino). |
| `sqflite` | Banco de dados SQLite local para persistência dos registros. |
| `path` | Composição de caminhos do sistema de arquivos (ex.: caminho do banco). |
| `path_provider` | Acesso a diretórios do dispositivo (suporte a armazenamento de arquivos). |
| `image_picker` | Captura de foto pela câmera e seleção de imagens da galeria. |
| `geolocator` | Obtenção da localização/GPS do dispositivo e verificação de permissões/serviço. |
| `http` | Requisições HTTP para geocodificação reversa (Nominatim). |
| `flutter_map` | Exibição de mapas interativos com camadas/tiles. |
| `latlong2` | Representação de coordenadas geográficas (`LatLng`) para o mapa. |
| `intl` | Formatação de data e hora. |
| `share_plus` | Compartilhamento de informações do registro. |
| `url_launcher` | Abertura de links externos (Google Maps, OpenStreetMap). |

Dependências de desenvolvimento: `flutter_test` e `flutter_lints`.

## Estrutura da tabela SQLite

- **Banco**: `geodiario_db.db`
- **Tabela**: `records`

| Coluna | Tipo | Restrições/Observações | Descrição |
| --- | --- | --- | --- |
| `id` | `TEXT` | `PRIMARY KEY` | Identificador único do registro (timestamp em milissegundos). |
| `title` | `TEXT` | `NOT NULL` | Título/descrição do momento. |
| `imageData` | `TEXT` | `NOT NULL` | Imagem do registro armazenada como *data URL* Base64 (ou URL nas entradas de demonstração). |
| `latitude` | `REAL` | `NOT NULL` | Latitude (coordenada geográfica). |
| `longitude` | `REAL` | `NOT NULL` | Longitude (coordenada geográfica). |
| `createdAt` | `TEXT` | `NOT NULL` | Data/hora de criação em formato ISO 8601. |
| `address` | `TEXT` | opcional (pode ser nulo) | Endereço aproximado obtido por geocodificação reversa. |

Definição utilizada na criação:

```sql
CREATE TABLE records(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  imageData TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  createdAt TEXT NOT NULL,
  address TEXT
);
```

## Estrutura do projeto (resumo)

```text
lib/
  main.dart                    Ponto de entrada, estado/navegação e telas (lista, mapa, formulário, detalhe)
  models/
    diary_entry.dart           Modelos DiaryEntry e LocationDataResult
  services/
    storage_service.dart       Persistência SQLite (CRUD, ordenação e seed inicial)
    geocoding_service.dart     Geocodificação reversa via Nominatim
pubspec.yaml                   Metadados e dependências do projeto
```

## Como executar

Pré-requisitos: [Flutter SDK](https://docs.flutter.dev/get-started/install) instalado e configurado.

```bash
flutter pub get
flutter run
```

### Observações de plataforma
- **Câmera e localização**: conceda as permissões solicitadas pelo sistema. Em Android/iOS, garanta que as permissões de câmera, localização e acesso à internet estejam declaradas nas configurações de plataforma (`AndroidManifest.xml` / `Info.plist`) conforme exigido pelos plugins utilizados.
- **Mapas e geocodificação**: dependem de conexão com a internet (tiles do OpenStreetMap e serviço Nominatim).
- **Windows**: a compilação com plugins pode exigir o *Modo de Desenvolvedor* habilitado para suporte a *symlinks*.
- Os dados são locais ao dispositivo; não há backup ou sincronização remota implementada.
