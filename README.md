# Null - Gerenciador de Senhas Offline Zero-Knowledge

O **Null** é um aplicativo mobile (React Native / Expo) desenvolvido para gerenciamento estritamente pessoal e **100% offline** de credenciais e senhas, com foco total em **segurança da informação, privacidade absoluta e arquitetura Zero-Knowledge**.

---

## Segurança & Criptografia

**Criptografia Principal**: Algoritmo **AES-256-GCM** (ou modo AEAD equivalente com chave de 256 bits).
**Derivação de Chave**: **PBKDF2-HMAC-SHA256** com **100.000 iterações** e **Salt CSPRNG único de 32 bytes (256-bit)** gerado por acesso.
**Arquitetura Per-Item Encryption (Criptografia por Acesso)**:
- Cada credencial (ex: Nubank, Instagram) possui sua própria chave AES-256 derivada a partir de uma **Senha Mestre específica definida no cadastro daquele item**.
- O aplicativo abre diretamente na Tela Inicial exibindo a string do **Ciphertext (texto criptografado)** no cartão de cada acesso.
**Descriptografia Sob Demanda**:
- Para revelar ou copiar a senha do serviço, o usuário insere a Senha Mestre referente àquele item.
- A senha descriptografada existe exclusivamente na memória RAM temporária durante o momento de visualização/cópia.
**Limpeza Automática do Clipboard (Área de Transferência)**:
- Ao copiar qualquer senha, o aplicativo inicia uma contagem regressiva visível no topo e apaga o texto copiado da área de transferência após 1 minuto.
**Proteção em Nível de SO (`FLAG_SECURE`)**:
- Impede a realização de capturas de tela (*print screen*) ou gravação de tela dentro do aplicativo no Android e iOS (`expo-screen-capture`).
**Validação de Integridade de Backup (SHA-256 Checksum)**:
- O arquivo de backup exportado contém apenas o payload criptografado juntamente com um hash **SHA-256** para prevenir corrupção de dados ou adulteração externa.
**Comparação em Tempo Constante**:
- Validação de tags de autenticação MAC via algoritmos de tempo constante (`constantTimeCompare`) para mitigar vulnerabilidades a ataques de canal lateral (*Timing Side-Channel Attacks*).

---

## Funcionalidades Principais

1. Dashboard Inicial Descomplicado
2. Gerenciador Dinâmico de Categorias
3. Gerador de Senhas Fortes (CSPRNG)
4. Backup e Restauração Offline Multicanal

---

## Tecnologias Utilizadas

- **Framework**: React Native (Expo SDK 57)
- **Linguagem**: TypeScript
- **Criptografia**: WebCrypto API / `crypto-js` / CSPRNG (`expo-crypto`)
- **Estilização**: React Native Stylesheet (Design Dark Cyberpunk / HSL Palette)
- **Ícones**: `lucide-react-native`
- **Armazenamento Local**: `@react-native-async-storage/async-storage`