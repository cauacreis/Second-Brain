# 🧠 Second Brain Bridge

Um ecossistema Open Source desenhado para unificar as suas anotações e automatizar a construção do seu "Segundo Cérebro" (Second Brain). Ele conecta o seu servidor privado do Discord e as suas sessões de Inteligência Artificial (Antigravity/Gemini) diretamente no seu cofre local do Obsidian.

---

## 🌟 Principais Funcionalidades

### 1. 🤖 Bot do Discord sob Demanda
Em vez de ter informações espalhadas por vários lugares, este projeto transforma o seu **Obsidian** no núcleo central do seu conhecimento acadêmico e pessoal.
O bot (feito em Node.js com a API do Gemini) atua como seu assistente de clipping. **Ele não é um bot intrusivo:** ele só escuta e age quando é ativamente **mencionado** com `@SecondBrainBot`.

### 2. 📁 Sincronização Nativa e Offline (Zero Links Quebrados)
Ao exportar canais, o bot não gera links da web para seus anexos. Ele **baixa os arquivos físicos** (imagens `.png`, `.jpg`, documentos `.pdf`, `.docx`) diretamente para a subpasta do Obsidian correspondente àquele assunto e cria links amigáveis e nativos (ex: `![[imagem.png]]`). 

### 3. 🧠 Integração Nativa (Skill) com Antigravity
Através de uma configuração especial (Skill), o assistente local Antigravity aprende a pesquisar, ler e salvar dados de forma autônoma no seu Obsidian, utilizando o mesmo padrão estrutural.

---

## 🎮 Comandos e Como Usar o Bot

O bot possui **3 gatilhos** precisos para você extrair o que importa do Discord para o seu Obsidian.

1. **Transcrever Canal (Modo Padrão):** 
   - **Como usar:** Em qualquer canal, envie uma mensagem marcando o bot (ex: `@SecondBrainBot salva isso pra mim`).
   - **O que faz:** Ele lê as últimas 100 mensagens daquele canal, baixa os anexos, formata o texto corrigindo a ortografia via IA, e cria uma nota chamada `nome-do-canal.md` na sua Inbox do Obsidian.

2. **Salvar Mensagem Específica:**
   - **Como usar:** Encontre uma mensagem importante que alguém enviou. Clique em **Responder**, marque o `@SecondBrainBot` e envie.
   - **O que faz:** O bot ignora o resto do histórico e salva apenas aquela única mensagem (junto com seus anexos específicos) no seu Obsidian.

3. **Exportar Categoria Inteira (Backup em Massa):**
   - **Como usar:** Em qualquer canal, envie `@SecondBrainBot exportar categoria` ou `@SecondBrainBot backup categoria`.
   - **O que faz:** O bot mapeia todos os canais de texto pertencentes à categoria atual. Ele iterará sobre cada canal (com uma pausa de segurança de 35s entre eles para evitar rate limit da API), criará uma subpasta individual para cada canal no Obsidian, e baixará todos os históricos e arquivos de forma incrivelmente organizada.

---

## 🛠️ Como usar a Skill no Antigravity

A Skill do Second Brain permite que o assistente Antigravity interaja de forma invisível e natural com o seu cofre Obsidian.

1. **Instalação:** A skill já se encontra localizada no seu diretório local do Antigravity (`~/.gemini/config/skills/second_brain/SKILL.md`).
2. **Ativação:** Ela é passiva e ativada por gatilho de contexto da sua fala. 
3. **Uso no dia a dia:** Sempre que você pedir ao Antigravity algo como: 
   - *"Pesquise no meu Second Brain sobre Arquitetura da Informação"*
   - *"Salve um resumo deste código no meu Obsidian na pasta de Projetos"*
   - *"Leia as anotações de Algoritmos no meu Obsidian e tire uma dúvida"*
   A IA ativará a skill automaticamente e usará as ferramentas de sistema para buscar e gerar arquivos `.md` perfeitamente compatíveis com o seu cofre.

---

## 🏗️ Arquitetura do Obsidian (Método PARA)

Para garantir escalabilidade, recomendamos que o seu Vault siga a estrutura de produtividade PARA:
- `00_Inbox`: Caixa de entrada rápida (onde o bot salva as mensagens por padrão).
- `10_Projetos`: Esforços ativos com começo e fim (ex: TCC).
- `20_Areas`: Tópicos contínuos e áreas de responsabilidade (ex: `faculdade`, `finanças`).
- `30_Recursos`: Ferramentas, links e tutoriais guardados para o futuro.
- `40_Arquivo`: Coisas finalizadas.

---

## 🚀 Como instalar e rodar o Bot localmente

O código fonte do bot está na pasta `/bot`.

### Pré-requisitos
- **Node.js** (v18 ou superior).
- Uma conta no [Discord Developer Portal](https://discord.com/developers/applications) (Com Bot Token gerado e *Message Content Intent* habilitado).
- Uma API Key do [Google AI Studio](https://aistudio.google.com/app/apikey).

### Passo a Passo
1. Entre na pasta do bot no seu terminal: 
   ```bash
   cd bot
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo chamado `.env` (use o `.env.example` como base) e preencha com seus dados e diretório:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   GEMINI_API_KEY=sua_chave_gemini_aqui
   OBSIDIAN_VAULT_PATH=C:/Caminho/Para/Seu/Vault/Do/Obsidian
   ```
4. Execute o bot:
   ```bash
   npm start
   ```

*(Dica: Recomendamos usar gerenciadores de processo como o `pm2` para mantê-lo online trabalhando 24/7 em background no seu PC)*

---

## 🛡️ Segurança e Privacidade
Este projeto foi construído pensando em **100% de privacidade**:
* O bot roda localmente na sua própria máquina (não há servidores na nuvem espionando seus dados de chat).
* Os arquivos do Obsidian nunca saem do seu SSD local.
* O arquivo `.gitignore` já bloqueia o envio das suas chaves de acesso sensíveis (`.env`) e do seu próprio Vault de anotações pessoais (`Conhecimento/`) para repositórios públicos do GitHub.

---
*Feito com 💡 pela IA Antigravity e Cauã.*
