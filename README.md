# AppInformediario

Aplicação web para **Informe de Produção**, **Equipe de Produção** e **Coleta de Dados**, com validação de matrícula via planilha base.

## Requisitos
- Node.js 18+

## Como rodar
```powershell
npm install
npm run dev
```

Depois, abra `http://localhost:5173` no navegador.

## Fluxo de uso
1. A base `APPsInformeProducao.xlsx` é carregada automaticamente.
2. Digite a matrícula e clique em **Entrar**.
3. Use as abas para registrar **Informe**, **Equipe** e **Coletas**.

## Atalhos na pasta
- `Abrir-AppInformediario.cmd`: inicia o servidor (`npm run dev`) e abre o navegador.
- `Abrir-AppInformediario.lnk`: atalho do Windows para o comando acima.

## Planilha base
- Formato CSV ou XLSX
- Precisa ter uma coluna com o nome que contenha **matricula** (ex: `matricula`)
- Para preenchimento automático de nome, use uma coluna **nome** ou **name**

### Base automática
- O arquivo `APPsInformeProducao.xlsx` é carregado automaticamente a partir da pasta `public`.
- Se não existir, faça upload manual pelo login.

## Teste rápido
```powershell
npm run smoke
```

## Exportações
- **Informes**: exporta CSV ou Excel pela aba Informe de Produção.
- **Equipe**: exporta CSV ou Excel pela aba Equipe de Produção.
- **Coletas**: exporta CSV pela aba Coletar Dados.

## Estrutura do projeto
- `src/`: código da aplicação React.
- `public/`: arquivos estáticos (base automática).
- `scripts/`: scripts utilitários (smoke test).

## Problemas comuns
- **Matrícula não encontrada**: confira a coluna `matricula` na planilha base.
- **Base não carrega**: confirme `public/APPsInformeProducao.xlsx`.
