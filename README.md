# 🚚 Controle de Cargas

Dashboard web para **acompanhamento operacional de cargas**, desenvolvido com HTML, CSS e JavaScript a partir de um cenário prático de logística.

A aplicação transforma dados de uma planilha Excel em informações visuais para facilitar o acompanhamento da operação, reunindo **KPIs, filtros, gráficos, status, detalhes das cargas e histórico de alterações** em uma única interface.

> ⚠️ Todos os dados utilizados no projeto são fictícios e destinados exclusivamente a estudo, demonstração técnica e portfólio.

## 🎯 Objetivo

O projeto foi criado para explorar como uma rotina operacional baseada em planilhas pode evoluir para uma interface mais visual e interativa.

A proposta é centralizar informações de carregamento e permitir uma leitura rápida da operação, mantendo a planilha como fonte de dados nesta versão e deixando o projeto preparado conceitualmente para uma futura integração com banco de dados, API ou ERP.

## ✨ Funcionalidades

- Importação de arquivos `.xlsx`
- Leitura dos dados com ExcelJS
- Identificação automática do status pela cor da célula da planilha
- Pesquisa por OC
- Filtro por transportadora
- Filtro por status
- Filtro por data
- KPIs atualizados a partir dos dados carregados
- Gráfico de distribuição por status
- Gráfico de cargas por transportadora
- Tabela operacional de cargas
- Visualização detalhada de cada OC
- Alteração manual de status
- Alteração de doca
- Registro de observações
- Histórico de alterações por OC
- Persistência local das cargas e alterações no navegador
- Atualização da planilha sem perder alterações manuais já registradas

## 📊 Indicadores

O painel apresenta:

- **Total de cargas**
- **Cargas carregadas**
- **Cargas dentro do prazo**
- **Cargas atrasadas**
- **Peso total**
- **Valor total das vendas**

## 🚦 Regras visuais de status

O sistema interpreta as cores da planilha e converte cada carga para um status operacional:

| Cor na planilha | Status |
| --- | --- |
| 🟢 Verde | Carregado |
| 🟡 Amarelo | Dentro do prazo |
| 🔴 Vermelho | Atrasado |

Essa regra transforma uma sinalização visual existente na planilha em informação estruturada para filtros, indicadores e gráficos.

## 🧠 Fluxo da aplicação

```text
Planilha Excel (.xlsx)
        ↓
      ExcelJS
        ↓
Leitura e tratamento dos dados
        ↓
     JavaScript
        ↓
 ┌──────┼──────────┐
 ↓      ↓          ↓
KPIs  Gráficos   Tabela
                   ↓
          Detalhes da carga
                   ↓
       Alterações + Histórico
                   ↓
             LocalStorage
```

## 🛠️ Tecnologias

- **HTML5** — estrutura da aplicação
- **CSS3** — layout e identidade visual
- **JavaScript** — regras, filtros, indicadores e interações
- **ExcelJS** — leitura da planilha Excel
- **Chart.js** — geração dos gráficos
- **LocalStorage** — persistência local no navegador
- **Git / GitHub** — versionamento

## 📂 Estrutura

```text
Controle-de-Cargas/
├── index.html
├── style.css
├── script.js
└── README.md
```

### `index.html`

Estrutura os KPIs, filtros, gráficos, tabela de cargas e modal de detalhes.

### `script.js`

Concentra a leitura da planilha, tratamento dos dados, filtros, gráficos, persistência, histórico e regras de negócio da interface.

### `style.css`

Define o layout responsivo, cores, cards, tabela, modal e estilos dos diferentes status.

## ▶️ Como executar

Este é um projeto front-end e não exige instalação de dependências locais.

Clone o repositório:

```bash
git clone https://github.com/MarcosPhilipe2/Controle-de-Cargas.git
cd Controle-de-Cargas
```

Depois, abra o arquivo `index.html` no navegador.

Para utilizar o dashboard com dados, importe uma planilha `.xlsx` compatível com a estrutura esperada pelo projeto.

As bibliotecas ExcelJS e Chart.js são carregadas via CDN, portanto é necessário acesso à internet para utilizá-las dessa forma.

## 💾 Persistência

O projeto utiliza o `localStorage` do navegador para manter:

- base de cargas importada;
- alterações manuais;
- histórico por OC.

Isso permite atualizar a página sem precisar importar novamente a planilha em todas as utilizações no mesmo navegador.

> O `localStorage` é adequado para este protótipo, mas não substitui um banco de dados em uma aplicação multiusuário.

## 🔄 Evolução do projeto

Este projeto nasceu da ideia de transformar um acompanhamento operacional feito em planilha em uma aplicação mais visual.

Uma evolução natural seria substituir o armazenamento local e a importação manual por uma arquitetura com:

```text
ERP / Sistema Operacional
          ↓
         API
          ↓
     Banco de Dados
          ↓
 Aplicação / Dashboard
```

## 🗺️ Próximas evoluções

- Banco de dados centralizado
- API para atualização automática
- Integração com ERP
- Autenticação de usuários
- Perfis e permissões
- Identificação do usuário responsável por cada alteração
- Indicadores históricos
- Relatórios operacionais
- Indicadores de produtividade

## 💼 O que este projeto demonstra

Este projeto combina conhecimentos de desenvolvimento web com experiência prática em logística.

Entre os conceitos aplicados estão:

- manipulação de dados;
- leitura de arquivos Excel;
- regras de negócio;
- persistência no navegador;
- filtros e busca;
- construção de dashboards;
- visualização de indicadores;
- organização de informações operacionais;
- versionamento com Git.

## 👨‍💻 Autor

**Marcos Philipe Tavares**

Projeto desenvolvido como parte do meu portfólio em Tecnologia, Dados e Automação, aplicando desenvolvimento web a um cenário de operação logística.
