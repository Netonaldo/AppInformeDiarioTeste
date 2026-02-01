# AppInformediario

Aplicação web para **Informe de Produção**, **Equipe de Produção** e **Coleta de Dados**, com validação de matrícula via planilha base.

## Requisitos
- Node.js 18+

## Como rodar
```powershell
npm install
npm run dev
```

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
