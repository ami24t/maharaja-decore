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

## Notas

- O formulário é apenas protótipo e mostra confirmação na página.
- Valores e estoque são apresentados como "sob consulta" para não inventar preços.
- Em produção, o próximo passo natural é ligar cada produto ao WhatsApp, estoque real, frete por CEP, retirada na loja, Pix/cartão e Instagram Shopping.
