# 🔐 Null - Gerenciador de Senhas Offline Zero-Knowledge

O **Null** é um aplicativo mobile (React Native / Expo) desenvolvido para gerenciamento estritamente pessoal e **100% offline** de credenciais e senhas, com foco total em **segurança da informação, privacidade absoluta e arquitetura Zero-Knowledge**.

---

## 🛡️ Pilares de Segurança & Criptografia

- **Criptografia Principal**: Algoritmo **AES-256-GCM** (ou modo AEAD equivalente com chave de 256 bits).
- **Derivação de Chave**: **PBKDF2-HMAC-SHA256** com **100.000 iterações** e **Salt CSPRNG único de 32 bytes (256-bit)** gerado por acesso.
- **Arquitetura Per-Item Encryption (Criptografia por Acesso)**:
  - Cada credencial (ex: Nubank, Instagram) possui sua própria chave AES-256 derivada a partir de uma **Senha Mestre específica definida no cadastro daquele item**.
  - O aplicativo abre diretamente na Tela Inicial exibindo a string do **Ciphertext (texto criptografado)** no cartão de cada acesso.
- **Descriptografia Sob Demanda**:
  - Para revelar ou copiar a senha do serviço, o usuário insere a Senha Mestre referente àquele item.
  - A senha descriptografada existe exclusivamente na memória RAM temporária durante o momento de visualização/cópia.
- **Limpeza Automática do Clipboard (Área de Transferência)**:
  - Ao copiar qualquer senha, o aplicativo inicia uma contagem regressiva visível no topo e **apaga o texto copiado da área de transferência após 1 minuto (60 segundos)**.
- **Proteção em Nível de SO (`FLAG_SECURE`)**:
  - Impede a realização de capturas de tela (*print screen*) ou gravação de tela dentro do aplicativo no Android e iOS (`expo-screen-capture`).
- **Validação de Integridade de Backup (SHA-256 Checksum)**:
  - O arquivo de backup exportado contém apenas o payload criptografado juntamente com um hash **SHA-256** para prevenir corrupção de dados ou adulteração externa.
- **Comparação em Tempo Constante**:
  - Validação de tags de autenticação MAC via algoritmos de tempo constante (`constantTimeCompare`) para mitigar vulnerabilidades a ataques de canal lateral (*Timing Side-Channel Attacks*).

---

## ✨ Funcionalidades Principais

1. **Dashboard Inicial Descomplicado**:
   - Exibição limpa de todos os acessos cadastrados com filtro por pesquisa e categorias.
   - Marcação de acessos favoritos.
2. **Gerenciador Dinâmico de Categorias**:
   - Criação e exclusão de categorias personalizadas (ex: Jogos, Cripto, Trabalho).
   - Botão para restaurar a lista de categorias padrão com 1 clique (Categorias padrão: *Redes Sociais, Financeiro, Email, Trabalho, Streaming, Outros*).
3. **Gerador de Senhas Fortes (CSPRNG)**:
   - Gerador aleatório criptograficamente seguro com opção de personalizar tamanho (12 a 32 caracteres), letras maiúsculas, minúsculas, números e símbolos especiais.
   - Cálculo automático de entropia em bits (*Fraca, Média, Forte, Ultra Segura*).
4. **Backup e Restauração Offline Multicanal**:
   - **Exportar**: Salvar o arquivo `.json` criptografado via **Google Drive**, **WhatsApp**, **Telegram**, **E-mail** ou área de transferência.
   - **Importar**: Carregar arquivos de backup `.json` direto dos **Arquivos do Celular**, **Google Drive** ou colar o texto criptografado.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: React Native (Expo SDK 57)
- **Linguagem**: TypeScript
- **Criptografia**: WebCrypto API / `crypto-js` / CSPRNG (`expo-crypto`)
- **Estilização**: React Native Stylesheet (Design Dark Cyberpunk / HSL Palette)
- **Ícones**: `lucide-react-native`
- **Armazenamento Local**: `@react-native-async-storage/async-storage`

---

## 🚀 Como Executar em Desenvolvimento

### Pré-requisitos
- Node.js (v18+)
- Aplicativo **Expo Go** instalado no seu celular Android ou iOS.

### Passos
1. Acesse a pasta do projeto:
   ```bash
   cd cofre-senhas
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor do Expo:
   ```bash
   npm start
   ```

4. Abra o **Expo Go** no seu celular e escaneie o QrCode exibido no terminal.

---

## 📱 Como Gerar o Instalador (.APK) para Instalar no Celular Sem a Play Store

Se você deseja gerar um instalador estático **.APK** para ter o aplicativo instalado permanentemente no seu Android sem precisar publicar na Google Play Store, siga os passos abaixo usando o **EAS Build** (serviço gratuito do Expo):

### Passo 1: Instalar o CLI do EAS
```bash
npm install -g eas-cli
```

### Passo 2: Fazer Login na sua conta do Expo
```bash
eas login
```

### Passo 3: Configurar o Projeto no EAS
Execute o comando abaixo na raiz do projeto para criar o arquivo `eas.json`:
```bash
eas build:configure
```

### Passo 4: Atualizar o arquivo `eas.json` para Gerar o Arquivo .APK
Abra o arquivo `eas.json` que foi criado e certifique-se de que o perfil `preview` está configurado para gerar `apk`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Passo 5: Gerar o APK
Execute o comando de build para Android:
```bash
eas build -p android --profile preview
```

### Passo 6: Baixar e Instalar no Celular
Assim que o processo terminar no servidor do Expo (leva cerca de 3 a 5 minutos), um **link de download do arquivo .APK** será gerado no terminal. Basta abrir o link no seu celular Android, baixar o arquivo `.apk` e clicar em **Instalar**!

---

## 📄 Licença
Uso estritamente pessoal e privado.
