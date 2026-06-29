# Maharaja Decor Storefront Prototype

Protótipo estático em pt-BR para a Maharaja Decor, usando contexto e assets públicos das páginas oficiais da marca.

## O que está incluído

- Página principal em `index.html`
- Identidade verde/dourado baseada na marca em `assets/css/style.css`
- Layout responsivo em `assets/css/responsive.css`
- Assets locais em `assets/img/maharaja/`, incluindo imagens públicas da marca e cenas editoriais geradas para o álbum de ambientes
- Catálogo com produtos reais vistos nas redes: luminária turca, Fonte de Lakshmi, banco pintado à mão, Ganesha, Buda, incenso Padmini Dhoop, elefantes de madeira e objetos decorativos
- Álbum de ambientes com sala, jardim, piscina e entrada para mostrar as peças em contextos aspiracionais
- Categorias editoriais por clima da casa, com método de curadoria e ambientes recomendados
- Vitrine de produtos com peça protagonista, tags de uso por ambiente e filtros orientados à compra consultiva
- Seções de inspiração e loja refinadas como atlas de composição, experiência de visita e cartões editoriais da marca
- Páginas exclusivas em `produto/` para cada peça da vitrine, com galeria, história, significado, composição e relacionados
- Páginas de ambiente em `ambientes/`: sala, jardim, piscina, entrada e altar
- Páginas de coleção em `colecoes/`: sagrado, estátuas, fontes, artesanato, aromas e decoração
- Dados compartilhados do catálogo em `assets/js/product-data.js` e renderização das páginas em `assets/js/product-page.js`
- Dados e renderização das páginas de exposição em `assets/js/exhibition-data.js` e `assets/js/exhibition-page.js`
- Filtros, busca, ordenação, favoritos, lista de interesse persistida, menu mobile, seletor de ambiente e formulário de contato
- Conteúdo focado no Brasil: Alto Paraíso de Goiás, Chapada dos Veadeiros, WhatsApp, email, endereço e redes sociais

## Preview local

Pode abrir o `index.html` diretamente no navegador. Para usar servidor local:

```bash
php -S localhost:8000
```

Abra http://localhost:8000

## Fontes de conteúdo

- Instagram: https://www.instagram.com/maharaja_decor/
- Facebook: https://www.facebook.com/maharajadecor/
- Cenas editoriais em `assets/img/maharaja/editorial/`: imagens geradas para direção de arte, não fotos publicadas pela marca

## Estoque (Disponível / Esgotado) e sincronização com Instagram

O site mostra um selo **Disponível / Esgotado** em cada peça (vitrine da home,
páginas de produto e cards de coleção/ambiente). O estado vem de um único arquivo:

- `assets/data/stock.json` — fonte da verdade: `slug → "in_stock" | "sold_out"`.
  Pode ser editado à mão a qualquer momento; o site lê em tempo real.
- `assets/js/stock.js` — busca o `stock.json` e pinta o selo (falha de forma
  segura: se o arquivo faltar, nada é alterado).

### Atualização automática a partir do Instagram (cron)

> **Importante:** o Instagram **não** expõe estoque/inventário. A sincronização
> lê o **texto das legendas** dos posts via a **Instagram Graph API** oficial e
> deduz a disponibilidade por convenção. É um heurístico, não um feed de estoque.
> Não há scraping da página pública (frágil e contra os termos do Instagram).

Peças do cron:

- `.github/workflows/sync-stock.yml` — roda a cada 6h (e por acionamento manual).
- `scripts/sync-instagram-stock.mjs` — busca os posts, lê as legendas e reescreve
  `stock.json`; se mudou, o workflow faz commit/push (redeploy).
- `scripts/stock-map.json` — convenção editável: palavras-chave que ligam um post
  a uma peça, e marcadores como `esgotado` / `disponível`.

**Para ativar (3 passos):**

1. **Conta + token:** o @maharaja_decor precisa ser uma conta **Business** ligada a
   uma Página do Facebook. Crie um app no Meta for Developers, conceda
   `instagram_basic` + `pages_show_list` e gere um **token de longa duração**.
   Anote o **IG user id** (numérico) da conta Business.
2. **Secrets no GitHub:** em *Settings → Secrets and variables → Actions*, adicione
   `IG_TOKEN` e `IG_USER_ID`.
3. **Convenção de legenda:** ajuste `scripts/stock-map.json` ao vocabulário real da
   loja. Convenção: um post cuja legenda cite a peça (palavra-chave) **e** contenha
   `esgotado`/`vendido` marca **Esgotado**; com `disponível`/`novidade` marca
   **Disponível**. Sem marcador, o estado atual é mantido (nunca chuta).

Sem os secrets, o workflow roda verde e **não altera nada** — você pode editar o
`stock.json` manualmente nesse meio-tempo.

## Modelos 3D e movimento

### Visualizador 3D nas páginas de produto

Cada peça pode ter um modelo 3D girável (arrastar, zoom e **AR "ver na sua casa"** no
celular), usando o web component [`<model-viewer>`](https://modelviewer.dev/) do Google:

- A peça mostra o botão **"Ver em 3D"** quando o seu item em `assets/js/product-data.js`
  tem o campo `model`. A foto continua como *poster*; o modelo só é baixado quando o
  visitante clica (lazy-load) — assim a performance/Lighthouse é preservada.
- Hoje a **Luminária turca** traz um modelo de **exemplo** (lanterna, via CDN) só para
  demonstrar o recurso. As demais peças seguem com a galeria de fotos até terem modelo.

### Como adicionar um modelo real (AI image-to-3D)

1. **Gerar:** envie a foto do produto (em `assets/img/maharaja/products/`) para uma
   ferramenta de imagem→3D — Meshy, Luma, Rodin (Hyper3D) ou Tripo — e exporte `.glb`.
2. **Otimizar** (alvo < 3–5 MB) antes de comitar:
   ```bash
   npx gltf-transform optimize entrada.glb assets/models/<slug>.glb --texture-size 1024
   ```
3. **Plugar:** salve como `assets/models/<slug>.glb` e adicione ao produto em
   `product-data.js`: `model: 'assets/models/<slug>.glb'` (remova `modelPreview`). Pronto —
   o botão "Ver em 3D" passa a usar o modelo real.

Detalhes em `assets/models/README.md`.

### Movimento e transições

`assets/js/motion.js` adiciona, de forma sutil e com respeito a `prefers-reduced-motion`:
entrada suave de página, transição ao navegar entre páginas, parallax no herói e
inclinação 3D (tilt) nos cards ao passar o mouse (apenas em ponteiros finos).

## Notas

- O formulário é apenas protótipo e mostra confirmação na página.
- Valores seguem como "sob consulta" para não inventar preços; a disponibilidade
  agora aparece como Disponível/Esgotado (ver seção de Estoque acima).
- Em produção, o próximo passo natural é ligar cada produto ao WhatsApp, estoque real, frete por CEP, retirada na loja, Pix/cartão e Instagram Shopping.
