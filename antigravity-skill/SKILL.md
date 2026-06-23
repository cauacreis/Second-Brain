---
name: "Obsidian Second Brain"
description: "Acessa e gerencia o Second Brain do usuário no Obsidian, armazenando informações, pesquisas e anotações de qualquer projeto."
---
# Obsidian Second Brain

Você (Antigravity) tem acesso ao Second Brain do usuário, que é um Vault do Obsidian. Você deve usar esta skill quando o usuário pedir para "salvar", "anotar", "buscar" ou "consultar" informações no "Obsidian", "Second Brain", "Cofre" ou "Notas".

## Caminho do Vault
O caminho absoluto para o Vault do usuário é:
`C:\Users\Cauã Felype\Documents\obsidian\Conhecimento`

## Estrutura do Vault
O Vault segue uma estrutura baseada no método PARA:
- `00_Inbox/`: Para resumos, anotações rápidas, memórias e pensamentos não categorizados.
- `10_Projetos/`: Notas sobre projetos em andamento (com começo, meio e fim). **REGRA DE OURO:** Sempre crie uma subpasta dedicada para cada projeto (ex: `10_Projetos/OrenAI/Diario_OrenAI.md`). Nunca deixe arquivos soltos nessa raiz.
- `20_Areas/`: Notas sobre áreas de interesse e responsabilidade contínua (ex: `Java`, `Desenvolvimento Web`).
- `30_Recursos/`: Referências, links, artigos, tutoriais, snippets de código úteis.
- `40_Arquivo/`: Projetos finalizados ou notas inativas.
- `99_AI_Templates/`: Templates para padronização de anotações.

## Diretrizes de Ação (Como atuar)

### 1. Salvar / Criar Notas
Quando o usuário pedir para criar ou salvar uma nota:
* Escolha a pasta mais adequada. Se for uma ideia ou rascunho rápido, jogue na `00_Inbox`.
* Crie um arquivo com a extensão `.md` (exemplo: `Ideia_Aplicativo_Delivery.md`).
* **MUITO IMPORTANTE:** Adicione o seguinte Frontmatter (YAML) no topo do arquivo, substituindo a data pela atual:

```yaml
---
aliases: []
tags: [#antigravity-brain]
criado_em: YYYY-MM-DD
---
```
* Após o cabeçalho YAML, inicie a nota com um `# Título da Nota`.

### 2. Buscar / Consultar Notas
Quando o usuário pedir para consultar algo do passado ou buscar no Second Brain:
* Use a ferramenta `grep_search` apontando o `SearchPath` para `C:\Users\Cauã Felype\Documents\obsidian\Conhecimento`.
* Busque por palavras-chave relacionadas à pergunta do usuário.
* Se encontrar arquivos relevantes, use `view_file` para ler os arquivos e retornar um resumo estruturado para o usuário.

### 3. Modificar e Formatar Notas
* Se o usuário pedir para adicionar mais informações a um tópico já existente, busque a nota e use `multi_replace_file_content` ou `replace_file_content` para atualizar a nota, em vez de criar uma nova.
* **Organização Contextual de Anexos (MUITO IMPORTANTE):** Ao formatar notas brutas (como transcrições do Discord) que contêm links de imagens (`![[imagem.png]]`) e PDFs (`[[arquivo.pdf]]`), **NUNCA** agrupe todos os anexos no final ou no início do arquivo em um bloco único chamado "Anexos".
* Você deve **distribuir os anexos contextualmente** ao longo dos tópicos da nota. Se o texto fala sobre "Laços de Repetição", coloque o PDF ou imagem referente a "Laços de Repetição" imediatamente abaixo dessa seção. Cada anexo deve ilustrar ou complementar a seção correspondente.

### 4. Criação e Uso de Templates (Conteúdo/YouTube)
* Quando o usuário pedir para planejar ou criar um conteúdo estruturado (como um roteiro para o YouTube), verifique a pasta `99_AI_Templates/`.
* Exemplo: Para roteiros, leia o arquivo `Template_Roteiro_YouTube.md`, preencha as etapas seguindo as Fórmulas Validadas de CTR (gatilhos de emoção, curiosidade) exigidas pelo template, e salve o arquivo final dentro de sua respectiva área, como `20_Areas/Canal YouTube/Roteiros/`.
