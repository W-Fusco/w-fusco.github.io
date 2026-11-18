# Site de Wilson Fusco

Site estático publicado em `https://w-fusco.github.io/`. O visual e a estrutura seguem a direção da conversa de referência, sem reutilizar os dados pessoais ou as publicações do amigo. O conteúdo biográfico foi extraído do Currículo Lattes de Wilson Fusco, atualizado em 17/11/2026.

## Personalizar

Edite `data/profile.json` com biografia, temas, projetos, ensino, currículo, apresentações e links. `data/auto/stats.json` é gerado a partir do perfil OpenAlex associado ao ORCID `0000-0002-1418-0423`. A página inicial mostra três trabalhos recentes; a página de publicações mostra 20 trabalhos recentes, cinco trabalhos mais citados e indicadores do OpenAlex. O livro organizado de 2026 permanece em `data/manual_publications.json` enquanto não for encontrado no OpenAlex.

Para ver o site localmente, sirva esta pasta por HTTP, por exemplo com `python -m http.server 8000`, e abra `http://localhost:8000`. Abrir o arquivo HTML diretamente pode impedir a leitura dos arquivos JSON pelo navegador.

## Atualização automática

O fluxo `.github/workflows/publish.yml` roda diariamente e também após alterações na branch `main`. Ele consulta o OpenAlex, valida o nome e o ORCID, atualiza `data/auto/stats.json` e publica o site no GitHub Pages. A configuração de Pages deve usar **GitHub Actions** como fonte de publicação. O fluxo funciona sem chave para as consultas atuais. Uma chave gratuita pode ser adicionada como segredo `OPENALEX_API_KEY` para aumentar a margem de uso; nunca coloque a chave no repositório.

Para atualizar localmente: `node scripts/fetch-stats.mjs`. Se a consulta falhar ou o perfil não corresponder ao nome e ORCID esperados, o arquivo de dados existente é preservado.

## Dados opcionais

- Fotografia profissional, se desejar.
- Endereço de e-mail público, se desejar exibir um contato direto.

Nenhuma informação pessoal do site de referência foi copiada para este projeto.
