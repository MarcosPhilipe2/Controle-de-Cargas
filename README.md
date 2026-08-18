# 📦 Controle de Cargas

Dashboard web desenvolvido para acompanhamento e controle operacional de cargas.

O projeto foi criado como um protótipo de uma solução para centralizar informações de carregamento, permitindo acompanhar indicadores, status das cargas, transportadoras e dados operacionais de forma visual e interativa.

> ⚠️ Todos os dados utilizados neste projeto são fictícios e foram criados exclusivamente para fins de demonstração e portfólio.

---

## 📊 Sobre o projeto

O Controle de Cargas transforma dados provenientes de uma planilha Excel em um dashboard operacional interativo.

A aplicação permite importar uma planilha e automaticamente atualizar indicadores, gráficos e a tabela de cargas.

O projeto foi desenvolvido pensando em uma possível evolução para integração com sistemas ERP.

---

## 🚀 Funcionalidades

- 📥 Importação de planilhas Excel
- 🔄 Atualização dos dados sem recarregar a aplicação
- 💾 Persistência dos dados no navegador
- 🔎 Pesquisa por OC
- 🚚 Filtro por transportadora
- 📅 Filtro por data
- 🟢 Filtro por status
- 📊 Indicadores operacionais (KPIs)
- 🍩 Gráfico de status das cargas
- 📈 Gráfico de cargas por transportadora
- 🟢 Identificação de cargas carregadas
- 🟡 Identificação de cargas dentro do prazo
- 🔴 Identificação de cargas atrasadas
- 📝 Tela de detalhes da carga
- ✏️ Alteração de status, doca e observações
- 🕒 Histórico de alterações por OC

---

## 📌 Indicadores

O dashboard apresenta os seguintes indicadores:

- Total de cargas
- Cargas carregadas
- Cargas dentro do prazo
- Cargas atrasadas
- Peso total
- Valor total das vendas

---

## 🎨 Status das cargas

| Status | Identificação |
|---|---|
| 🟢 Carregado | Carga já carregada |
| 🟡 Dentro do prazo | Carga dentro do prazo operacional |
| 🔴 Atrasado | Carga com carregamento atrasado |

---

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Chart.js
- ExcelJS
- LocalStorage
- Git
- GitHub
- Visual Studio Code

---

## 📂 Estrutura do projeto

```text
Controle-de-Cargas/
│
├── index.html
├── style.css
├── script.js
└── README.md


Planilha Excel
      ↓
    ExcelJS
      ↓
Tratamento dos dados
      ↓
   JavaScript
      ↓
 ┌────┴────┐
 ↓         ↓
KPIs    Gráficos
 ↓         ↓
 └────┬────┘
      ↓
Tabela de Cargas
      ↓
Detalhes / Histórico

O objetivo deste projeto é demonstrar a criação de uma solução web para acompanhamento operacional de cargas, transformando dados de uma planilha em informações visuais que facilitam o acompanhamento da operação.

Algumas melhorias planejadas para o projeto:

Integração com banco de dados
Integração com ERP
Autenticação de usuários
Controle de permissões
Registro de usuário responsável pelas alterações
API para atualização automática dos dados
Relatórios operacionais
Dashboard histórico
Indicadores de produtividade


Projeto feito por:
Marcos Philipe
Projeto desenvolvido para fins de estudo, demonstração técnica e portfólio
