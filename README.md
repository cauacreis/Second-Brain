# 🧠 Second Brain Bridge

Um ecossistema Open Source desenhado para unificar as suas anotações. Ele conecta o seu servidor privado do Discord e as suas sessões de Inteligência Artificial (Antigravity/Gemini) diretamente no seu cofre do Obsidian.

## 🌟 O que esse projeto faz?

Em vez de ter informações espalhadas por vários lugares, este projeto transforma o seu **Obsidian** no núcleo central do seu conhecimento:
1. **Ponte Discord:** Um Bot em Node.js com IA que obedece aos seus comandos no Discord. Ele só age quando mencionado, podendo salvar uma mensagem específica, transcrever as últimas 100 mensagens de um canal, ou até exportar todos os canais de uma Categoria inteira direto para o seu Obsidian.
2. **Ponte Antigravity:** Uma configuração (Skill) que ensina o seu assistente local Antigravity a ler, pesquisar e salvar dados no seu Obsidian, não importa em qual projeto você esteja trabalhando.
3. **Suporte a Anexos Offline:** Se você enviar imagens, PDFs ou documentos no Discord, o bot fará o download físico desses arquivos e os salvará diretamente na mesma pasta da sua anotação no Obsidian, gerando links nativos (`![[imagem.png]]`). Adeus links quebrados!

---

## 🏗️ Arquitetura do Obsidian (Método PARA)

Para que a inteligência artificial (e você) se encontrem facilmente, recomendamos que o seu Vault do Obsidian tenha as seguintes pastas:
- `00_Inbox`: Caixa de entrada para pensamentos não categorizados.
- `10_Projetos`: Esforços ativos com começo e fim.
- `20_Areas`: Tópicos contínuos e áreas de interesse (ex: Programação, Finanças).
- `30_Recursos`: Ferramentas, links e tutoriais guardados para o futuro.
- `40_Arquivo`: Coisas finalizadas.

---

## 🤖 Como rodar o Bot do Discord

O código do bot está na pasta `/bot`. Para ligá-lo, siga os passos:

### Pré-requisitos
- Node.js instalado no computador.
- Uma conta no [Discord Developer Portal](https://discord.com/developers/applications) para criar seu Bot e pegar o Token.
- Uma API Key do [Google AI Studio](https://aistudio.google.com/app/apikey).

### Passo 1: Configuração do ambiente
1. Entre na pasta do bot: `cd bot`
2. Instale as dependências: `npm install`
3. Crie um arquivo chamado `.env` (use o `.env.example` como base) e preencha:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   GEMINI_API_KEY=sua_chave_gemini_aqui
   OBSIDIAN_VAULT_PATH=C:/Caminho/Para/Seu/Vault/Do/Obsidian
   ```

### Passo 2: Rodando
Execute o comando:
```bash
npm start
```
Pronto! O bot agora está online e escutando. Ele só responde se for **mencionado** (`@SecondBrainBot`). Você tem 3 comandos à disposição:
1. **Salvar mensagem:** Responda a uma mensagem marcando o bot para salvar apenas ela.
2. **Exportar Categoria:** Escreva `@SecondBrainBot categoria` em qualquer canal para fazer o backup de todos os canais daquela categoria.
3. **Transcrever Canal:** Apenas marque `@SecondBrainBot` no chat para transcrever as últimas 100 mensagens daquele canal.

---

## 🛡️ Segurança e Privacidade
Este projeto foi construído pensando em 100% de privacidade:
* O bot roda localmente na sua máquina.
* Nenhum dado é salvo em bancos de dados de terceiros.
* O arquivo `.gitignore` já está configurado para **NUNCA** subir o seu `.env` ou o seu cofre para a internet.

---
Feito com 💡 pelo Antigravity e Cauã.
