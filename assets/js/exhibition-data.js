(function () {
    'use strict';

    window.MaharajaExhibition = {
        ambientes: [
            {
                slug: 'sala',
                eyebrow: 'Ambiente Maharaja',
                title: 'Sala com Ganesha, madeira e aroma.',
                subtitle: 'Uma sala ganha presença quando a escultura vira centro emocional, e não apenas objeto sobre o móvel.',
                heroImage: 'assets/img/maharaja/editorial/living-ganesha.jpg',
                alt: 'Sala brasileira com Ganesha em composição decorativa',
                intro: 'A sala é o lugar onde a Maharaja pode mostrar melhor sua força: uma peça sagrada, madeira, incenso, luz natural e objetos menores compondo uma cena viva.',
                thesis: 'Use Ganesha como eixo visual, complemente com base tátil e finalize com aroma ou luz baixa.',
                tags: ['Sala', 'Ganesha', 'Madeira', 'Incenso'],
                products: ['ganesha-de-resina', 'banco-pintado-a-mao', 'padmini-incenso-dhoop', 'pecas-decorativas', 'luminaria-turca'],
                steps: ['Escolha uma peça protagonista para o aparador ou canto principal.', 'Use madeira, tecido e pedra para dar profundidade.', 'Feche a cena com aroma, flor ou ponto de luz quente.'],
                related: [
                    { label: 'Altar em casa', type: 'ambientes', slug: 'altar' },
                    { label: 'Coleção sagrada', type: 'colecoes', slug: 'sagrado' },
                    { label: 'Peças decorativas', type: 'colecoes', slug: 'decoracao' }
                ]
            },
            {
                slug: 'jardim',
                eyebrow: 'Ambiente Maharaja',
                title: 'Jardim com Lakshmi, água e folhagem.',
                subtitle: 'A área externa vira pausa sensorial quando pedra, água e vegetação trabalham com uma peça simbólica.',
                heroImage: 'assets/img/maharaja/editorial/garden-lakshmi.jpg',
                alt: 'Jardim tropical com fonte de Lakshmi',
                intro: 'Jardins, varandas e corredores externos pedem peças que conversem com natureza, som e sombra. A fonte de Lakshmi cria movimento e um ponto de contemplação.',
                thesis: 'Comece pelo som da água, emoldure com folhagem e deixe a peça respirar.',
                tags: ['Jardim', 'Lakshmi', 'Água', 'Folhagem'],
                products: ['fonte-de-lakshmi', 'buda-de-bali', 'elefantes-de-madeira', 'pecas-decorativas'],
                steps: ['Posicione a fonte onde o som seja percebido na circulação.', 'Crie uma moldura natural com plantas e pedra.', 'Use objetos menores para dar escala e acabamento.'],
                related: [
                    { label: 'Piscina contemplativa', type: 'ambientes', slug: 'piscina' },
                    { label: 'Coleção fontes', type: 'colecoes', slug: 'fontes' },
                    { label: 'Estátuas para fora', type: 'colecoes', slug: 'estatuas' }
                ]
            },
            {
                slug: 'piscina',
                eyebrow: 'Ambiente Maharaja',
                title: 'Piscina com Buda, pedra e silêncio.',
                subtitle: 'Um espaço de lazer pode ganhar leitura de resort íntimo com poucos elementos e muita intenção.',
                heroImage: 'assets/img/maharaja/editorial/pool-buda.jpg',
                alt: 'Área de piscina com Buda e lanternas',
                intro: 'Na piscina, o Buda deve ser visto como presença calma. A composição pede pedra clara, água, plantas altas e luz discreta para criar sofisticação sem excesso.',
                thesis: 'Menos peças, mais escala: deixe o Buda comandar o silêncio visual.',
                tags: ['Piscina', 'Buda', 'Pedra', 'Luz'],
                products: ['buda-de-bali', 'fonte-de-lakshmi', 'luminaria-turca', 'pecas-decorativas'],
                steps: ['Escolha uma estátua com escala suficiente para a área.', 'Use pedra, água e plantas para criar continuidade.', 'Adicione luz baixa apenas como atmosfera noturna.'],
                related: [
                    { label: 'Jardim com água', type: 'ambientes', slug: 'jardim' },
                    { label: 'Coleção estátuas', type: 'colecoes', slug: 'estatuas' },
                    { label: 'Sagrado', type: 'colecoes', slug: 'sagrado' }
                ]
            },
            {
                slug: 'entrada',
                eyebrow: 'Ambiente Maharaja',
                title: 'Entrada com elefantes, flores e boas-vindas.',
                subtitle: 'A chegada da casa pode virar assinatura com símbolo, cor e uma composição de impacto imediato.',
                heroImage: 'assets/img/maharaja/editorial/entrance-elephants.jpg',
                alt: 'Entrada de casa com elefantes pintados à mão',
                intro: 'A entrada é perfeita para peças de proteção e prosperidade. Elefantes pintados à mão, flores, latão e madeira criam uma primeira impressão memorável.',
                thesis: 'Construa a chegada como um pequeno altar de boas-vindas.',
                tags: ['Entrada', 'Elefantes', 'Flores', 'Proteção'],
                products: ['elefantes-de-madeira', 'ganesha-de-resina', 'banco-pintado-a-mao', 'pecas-decorativas'],
                steps: ['Use pares ou grupos para criar ritmo de chegada.', 'Apoie as peças em madeira, latão ou pedra.', 'Inclua flores para trazer vida e cor brasileira.'],
                related: [
                    { label: 'Sala com Ganesha', type: 'ambientes', slug: 'sala' },
                    { label: 'Artesanato pintado', type: 'colecoes', slug: 'artesanato' },
                    { label: 'Coleção sagrada', type: 'colecoes', slug: 'sagrado' }
                ]
            },
            {
                slug: 'altar',
                eyebrow: 'Ambiente Maharaja',
                title: 'Altar afetivo com escultura, aroma e intenção.',
                subtitle: 'O altar contemporâneo pode ser religioso, afetivo ou decorativo: o importante é organizar presença.',
                heroImage: 'assets/img/maharaja/products/hero-altar.jpg',
                alt: 'Objetos decorativos para altar e mesa',
                intro: 'O altar reúne pequenas peças, incenso, flores e imagens sagradas. Ele funciona em aparadores, prateleiras, quartos e cantos de meditação.',
                thesis: 'Combine símbolo, base, aroma e um gesto diário simples.',
                tags: ['Altar', 'Ritual', 'Aroma', 'Símbolo'],
                products: ['ganesha-de-resina', 'padmini-incenso-dhoop', 'pecas-decorativas', 'buda-de-bali'],
                steps: ['Defina o símbolo central do altar.', 'Use poucos objetos de apoio para não perder foco.', 'Inclua incenso ou flor como gesto de ativação diária.'],
                related: [
                    { label: 'Sala com presença', type: 'ambientes', slug: 'sala' },
                    { label: 'Aromas e rituais', type: 'colecoes', slug: 'aromas' },
                    { label: 'Estátuas sagradas', type: 'colecoes', slug: 'estatuas' }
                ]
            }
        ],
        colecoes: [
            {
                slug: 'sagrado',
                eyebrow: 'Coleção Maharaja',
                title: 'Sagrado para casa, presente e altar.',
                subtitle: 'Ganesha, Buda, Lakshmi e aromas para compor proteção, presença e significado.',
                heroImage: 'assets/img/maharaja/editorial/living-ganesha.jpg',
                alt: 'Ganesha em sala brasileira',
                intro: 'A coleção sagrada deve ser apresentada com respeito e contexto: onde a peça entra, que atmosfera cria e como conversar com a casa brasileira.',
                thesis: 'O sagrado vende melhor quando aparece como experiência de casa, não como item isolado.',
                tags: ['Ganesha', 'Buda', 'Lakshmi', 'Altar'],
                products: ['ganesha-de-resina', 'buda-de-bali', 'fonte-de-lakshmi', 'padmini-incenso-dhoop'],
                steps: ['Escolha o símbolo que conversa com a intenção da casa.', 'Defina se a peça será protagonista ou detalhe de altar.', 'Finalize com aroma, flor ou luz para ativar o ritual.'],
                related: [
                    { label: 'Altar afetivo', type: 'ambientes', slug: 'altar' },
                    { label: 'Sala com Ganesha', type: 'ambientes', slug: 'sala' },
                    { label: 'Estátuas', type: 'colecoes', slug: 'estatuas' }
                ]
            },
            {
                slug: 'estatuas',
                eyebrow: 'Coleção Maharaja',
                title: 'Estátuas protagonistas para ambientes memoráveis.',
                subtitle: 'O foco central da marca: peças com presença para sala, jardim, entrada, piscina e altar.',
                heroImage: 'assets/img/maharaja/editorial/pool-buda.jpg',
                alt: 'Buda em área de piscina',
                intro: 'Estátuas são a espinha dorsal do novo e-commerce Maharaja. Elas criam o primeiro impacto visual, orientam a composição e dão assinatura ao ambiente.',
                thesis: 'Cada estátua precisa aparecer em escala, contexto e narrativa.',
                tags: ['Estátuas', 'Presença', 'Símbolo', 'Casa'],
                products: ['ganesha-de-resina', 'buda-de-bali', 'fonte-de-lakshmi', 'elefantes-de-madeira'],
                steps: ['Escolha o ambiente antes da peça.', 'Procure escala compatível com a distância de visão.', 'Monte base e respiro para a escultura comandar a cena.'],
                related: [
                    { label: 'Piscina com Buda', type: 'ambientes', slug: 'piscina' },
                    { label: 'Jardim com Lakshmi', type: 'ambientes', slug: 'jardim' },
                    { label: 'Coleção sagrada', type: 'colecoes', slug: 'sagrado' }
                ]
            },
            {
                slug: 'fontes',
                eyebrow: 'Coleção Maharaja',
                title: 'Fontes para jardim, varanda e pausa sensorial.',
                subtitle: 'Lakshmi, água e pedra clara para transformar áreas externas em lugares de presença.',
                heroImage: 'assets/img/maharaja/editorial/garden-lakshmi.jpg',
                alt: 'Fonte de Lakshmi em jardim tropical',
                intro: 'Fontes pedem uma apresentação mais sensorial: som, frescor, sombra, folhagem e a ideia de uma pausa dentro do cotidiano.',
                thesis: 'A água cria movimento; a escultura dá significado.',
                tags: ['Fontes', 'Água', 'Jardim', 'Lakshmi'],
                products: ['fonte-de-lakshmi', 'buda-de-bali', 'pecas-decorativas'],
                steps: ['Escolha um ponto onde a água seja vista e ouvida.', 'Use plantas para emoldurar sem esconder.', 'Combine com pedra, cerâmica ou luz quente.'],
                related: [
                    { label: 'Jardim com Lakshmi', type: 'ambientes', slug: 'jardim' },
                    { label: 'Piscina com Buda', type: 'ambientes', slug: 'piscina' },
                    { label: 'Estátuas', type: 'colecoes', slug: 'estatuas' }
                ]
            },
            {
                slug: 'artesanato',
                eyebrow: 'Coleção Maharaja',
                title: 'Madeira pintada à mão, cor e ofício.',
                subtitle: 'Elefantes, bancos e peças de apoio para trazer energia artesanal à casa.',
                heroImage: 'assets/img/maharaja/editorial/entrance-elephants.jpg',
                alt: 'Elefantes pintados à mão em entrada de casa',
                intro: 'O artesanato da Maharaja precisa aparecer com textura, cor e gesto humano. São peças que aquecem passagens, entradas e cantos de convivência.',
                thesis: 'A pintura manual é o detalhe que dá memória à decoração.',
                tags: ['Madeira', 'Pintura manual', 'Cor', 'Presente'],
                products: ['elefantes-de-madeira', 'banco-pintado-a-mao', 'pecas-decorativas'],
                steps: ['Escolha uma cor que dialogue com o ambiente.', 'Use a peça como ponto de apoio ou chegada.', 'Combine com flores, latão e madeira natural.'],
                related: [
                    { label: 'Entrada com elefantes', type: 'ambientes', slug: 'entrada' },
                    { label: 'Sala com madeira', type: 'ambientes', slug: 'sala' },
                    { label: 'Decoração', type: 'colecoes', slug: 'decoracao' }
                ]
            },
            {
                slug: 'aromas',
                eyebrow: 'Coleção Maharaja',
                title: 'Aromas e rituais para ativar a casa.',
                subtitle: 'Incensos e pequenos gestos para transformar a atmosfera do dia.',
                heroImage: 'assets/img/maharaja/products/incenso-padmini-dhoop.jpg',
                alt: 'Incenso Padmini Dhoop',
                intro: 'Aromas são a camada invisível da composição. Eles conectam decoração, memória e rotina, seja em altar, sala, quarto ou presente.',
                thesis: 'O ritual diário completa a curadoria visual.',
                tags: ['Aromas', 'Incenso', 'Ritual', 'Presente'],
                products: ['padmini-incenso-dhoop', 'ganesha-de-resina', 'pecas-decorativas', 'luminaria-turca'],
                steps: ['Defina o momento de uso: chegada, meditação ou presente.', 'Crie uma base segura para o incenso.', 'Combine aroma com símbolo, luz e objeto pequeno.'],
                related: [
                    { label: 'Altar afetivo', type: 'ambientes', slug: 'altar' },
                    { label: 'Sala com aroma', type: 'ambientes', slug: 'sala' },
                    { label: 'Coleção sagrada', type: 'colecoes', slug: 'sagrado' }
                ]
            },
            {
                slug: 'decoracao',
                eyebrow: 'Coleção Maharaja',
                title: 'Decoração e presentes com assinatura Maharaja.',
                subtitle: 'Peças pequenas, luz, madeira e objetos para completar composições ou presentear.',
                heroImage: 'assets/img/maharaja/products/hero-altar.jpg',
                alt: 'Peças decorativas para mesa e altar',
                intro: 'A coleção de decoração organiza o e-commerce para presentes, mesas, aparadores e detalhes que completam uma cena maior.',
                thesis: 'Os objetos menores dão ritmo e tornam a compra mais acessível.',
                tags: ['Decoração', 'Presente', 'Mesa', 'Aparador'],
                products: ['pecas-decorativas', 'luminaria-turca', 'banco-pintado-a-mao', 'padmini-incenso-dhoop'],
                steps: ['Escolha uma função: presente, mesa, altar ou canto de leitura.', 'Combine textura com luz ou aroma.', 'Use peças pequenas para conectar ambientes.'],
                related: [
                    { label: 'Sala completa', type: 'ambientes', slug: 'sala' },
                    { label: 'Aromas', type: 'colecoes', slug: 'aromas' },
                    { label: 'Artesanato', type: 'colecoes', slug: 'artesanato' }
                ]
            }
        ]
    };
}());
