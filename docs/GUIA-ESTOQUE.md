# Guia de Estoque — Maharaja Decor

Como colocar **todo o estoque da loja** no site, e como manter preços e
quantidades atualizados no dia a dia.

---

## 1. O jeito rápido (dia a dia): o Painel Admin

Para mudanças pontuais — preço, quantidade, marcar esgotado — use o painel:

**https://backend-production-462f.up.railway.app/app**

- **Products** → clique na peça → **Edit** para título/descrição/foto.
- Preço: na peça → **Variants** → editar o preço em BRL.
- Quantidade: menu **Inventory** → buscar a peça → ajustar a quantidade.
  Quantidade **0 = "Esgotado"** no site automaticamente (e volta a "Disponível"
  quando repõe). O site reflete em até 1 minuto.
- **Orders**: todos os pedidos do site chegam aqui.

> Atenção ao criar peça manualmente pelo painel: o site precisa dos campos de
> **Metadata** (`purchase_mode`, `storefront_image`...). Prefira o fluxo em
> lote abaixo, que preenche tudo sozinho.

## 2. O jeito em lote: planilha + fotos

Para cadastrar muitas peças de uma vez (o estoque inteiro da loja):

### Passo A — Fotografe as peças

- Fundo escuro liso (como as fotos atuais das estátuas) valoriza a peça.
- Uma foto de frente por peça; verso é opcional (bom para peças trabalhadas
  atrás, como o Buda com mandala).
- Pelo celular está ótimo. Envie/salve os arquivos numa pasta `fotos/` ao lado
  da planilha.

### Passo B — Preencha a planilha

Modelo: `docs/estoque-modelo.csv` (abra no Excel; salve como
**"CSV (separado por ponto e vírgula)"**, o padrão brasileiro).

| Coluna | O que é | Exemplo |
|---|---|---|
| `handle` | Código da peça (deixe vazio para gerar do título) | `shiva-meditando` |
| `titulo` | Nome no site | `Shiva meditando` |
| `descricao` | Texto da página da peça | `Estátua de Shiva...` |
| `categorias` | Uma ou mais, separadas por vírgula | `Sagrado,Estátuas` |
| `preco` | Em reais. **Vazio = "Sob consulta"** (venda pelo WhatsApp) | `980` ou vazio |
| `quantidade` | Unidades em estoque | `1` |
| `peso_gramas` | Peso aproximado (para frete futuro) | `2500` |
| `foto` | Caminho da foto de frente | `fotos/shiva.jpg` |
| `foto_verso` | Foto do verso (opcional) | `fotos/shiva-verso.jpg` |

Categorias existentes: **Sagrado, Estátuas, Fontes, Artesanato, Aromas,
Decoração** (outras podem ser criadas no painel antes de importar).

### Passo C — Rode a importação

No computador (pasta do site):

```bash
set MAHARAJA_ADMIN_EMAIL=admin@maharajadecor.local
set MAHARAJA_ADMIN_PASSWORD=***
node scripts/import-stock.mjs caminho/para/planilha.csv
```

O script:
- **cria** peças novas (foto copiada para o site, preço, estoque, categoria,
  página no catálogo, entrada no sitemap do Google);
- **atualiza** preço + quantidade de peças que já existem (pode rodar a mesma
  planilha sempre — ela vira sua ferramenta de manutenção);
- resume no final o que criou/atualizou/falhou.

Depois de criar peças novas, publique as fotos:

```bash
git add assets/img sitemap.xml && git commit -m "estoque: novas pecas" && git push
vercel deploy --prod --yes
```

### Passo D (opcional) — Modelo 3D

Peças de destaque podem ganhar o "Ver em 3D":

```bash
set MESHY_API_KEY=***
node scripts/meshy-generate.mjs <handle> assets/img/maharaja/products/<handle>.jpg
```

Depois anexe o modelo à peça (o time técnico roda
`scratchpad/attach-models.ps1` ou define `storefront_model` na metadata pelo
painel) e publique como acima. Cada geração consome ~30 créditos Meshy.

---

## Perguntas rápidas

**Vendi uma peça na loja física — e agora?**
Painel → Inventory → peça → diminua a quantidade. Chegou em 0, o site mostra
"Esgotado" sozinho.

**Quero mudar só um preço.**
Painel → Products → peça → Variants → preço. No site em ~1 minuto.

**A peça é grande demais para vender online (frete difícil).**
Deixe `preco` vazio na planilha (ou `purchase_mode = whatsapp` na metadata):
a peça aparece como "Sob consulta" e o botão vira WhatsApp.

**Rodei a planilha duas vezes — estraga algo?**
Não. Peças existentes só têm preço/quantidade atualizados.
