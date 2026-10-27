# CampusNav — navegação indoor 3D

Protótipo de navegação interna para universidades, no estilo dos apps de trânsito:
pesquise um ambiente, veja os andares em camadas 3D e siga a rota entre andares e blocos.

Next.js (App Router) + React Three Fiber + Tailwind CSS v4 + Zustand + TypeScript.
Segue as cores, componentes e convenções do Oxystage (paleta Oxygeni, DM Sans, Lucide).

## Rodando

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm dev:celular  # HTTPS na rede local, para testar a navegação por passos no celular
pnpm test         # testes do grafo, A*, instruções e navegação por passos
pnpm build
```

## Testando no celular (navegação por passos)

Os sensores de movimento só funcionam em página segura (HTTPS). Com o celular e o
computador na mesma rede Wi-Fi:

1. Rode `pnpm dev:celular`. Na primeira vez o Next gera um certificado local (pode pedir senha).
2. No celular, abra `https://<IP do computador>:3000` (veja o IP com `hostname -I`).
   O navegador vai avisar que o certificado não é confiável: aceite para continuar.
3. Escolha onde você está (ex.: Recepção), busque o destino e, no painel da rota,
   selecione **Andando** → **Iniciar navegação**. No iPhone, permita o acesso ao movimento.
4. Ande segurando o celular: cada passo avança o marcador pela rota.

A posição é **estimada** e fica presa à rota: o app conta passos × tamanho do passo, então
não percebe se você sair do caminho. Se o marcador adiantar ou atrasar, ajuste o tamanho do
passo no painel (fica salvo) ou use os botões ↶ (volta 2 m) e ⏭ (próxima instrução).

## O que o protótipo faz

- Dois locais (seletor no topo): **Oxygeni Hub** (térreo, medido sobre a planta baixa) e um
  **campus demo** fictício.
- Campus demo com **Bloco A** (térreo a 3º andar) e **Bloco B** (térreo a 2º andar, em L),
  ligados por uma passagem coberta (térreo) e uma passarela (1º andar).
- Mapa 3D com andares em camadas: selecione bloco/andar, separe os andares, gire, aproxime.
- Modos **2D** (planta), **2.5D** (câmera inclinada) e **3D** (andares empilhados), com transições animadas.
- Busca por nome, tipo, sinônimos ("xerox", "lanche"), bloco e andar; resultados ordenados pela distância a pé.
- Rotas pelo **A\*** sobre um grafo de corredores, portas, escadas, elevadores e passagens.
  Opção de **rota acessível** (sem escadas).
- Rota desenhada em 3D (linha azul animada), trocas de andar destacadas em amarelo.
- Navegação estilo Waze: câmera segue o usuário, instruções ("Vire à direita no
  corredor lateral", "Suba de elevador até o 3º andar"), confirmação na troca de andar.
- Dois modos de acompanhamento:
  - **Andando:** conta os passos pelo acelerômetro do celular e avança pela rota.
  - **Simulação:** o marcador anda sozinho (1×/2×/4×) ou instrução por instrução.

> O ponto de partida é informado pelo usuário (lista ou clique no mapa). Não há GPS:
> dentro de prédios ele erra mais do que o tamanho das salas.

## Estrutura

```
src/
├── app/                      # layout (DM Sans, Lucide), página única e globals.css (paleta)
├── components/
│   ├── brand/Logo.tsx
│   └── ui/                   # Button, Modal, SearchField, Surface, IconButton, Spinner…
├── config/site.ts
├── mocks/
│   ├── oxygeni-hub.ts        # Oxygeni Hub (térreo), medido sobre a planta
│   └── campus/               # Campus demo: blocos, corredores, saídas e ligações
├── store/navigation.ts       # Estado global (Zustand): modo, andar, origem, destino, navegação
├── lib/format.ts             # Distância, tempo, horário de chegada
└── features/
    ├── campus/               # Tipos, montagem (portas/ids), rótulos, ícones, api.ts
    ├── navigation/           # Grafo, A*, rota, instruções, painéis e banner de navegação
    ├── location/             # LocationProvider, progresso na rota, contador de passos, origem
    ├── map/                  # Cena 3D: andares, paredes, rota, marcadores, câmera, rótulos HTML
    ├── map-controls/         # Modos 2D/2.5D/3D, zoom, rotação, seletor de bloco e andar
    └── search/               # Busca e barra "Para onde você quer ir?"
```

### Coordenadas

Tudo está em metros no plano do chão (`x`, `z`). As mesmas coordenadas desenham o mapa e
geram o grafo, então a rota sempre acompanha os corredores. A altura vem só do andar
(`floorY(level, explode)` em `features/map/layout.ts`), inclusive quando os andares se separam.

### Grafo e rotas

`features/navigation/graph.ts` cria, para cada andar, nós no eixo dos corredores (em frente a
cada porta, cruzamentos e pontas) e um ramal *corredor → porta → centro da sala*. Como os ramais
são becos sem saída, nenhuma rota atravessa salas. Escadas e elevadores com o mesmo `shaftId`
ligam os andares; o custo é o tempo estimado (o elevador cobra a espera ao embarcar).

### Integrações futuras

- **Backend (NestJS/Spring + PostgreSQL):** `features/campus/api.ts` é o único ponto que lê os
  mocks. Troque por um `fetch` que devolva o mesmo `CampusSpec`.
- **Localização real (QR Code, beacons BLE, Wi-Fi RTT):** implemente `LocationProvider`
  (`features/location/types.ts`). Hoje existe o `RouteProgressProvider`, usado pela
  simulação e pela contagem de passos (`StepDetector`).

### Novo local, andar ou sala

Locais ficam em `features/campus/sites.ts`; os dados, em `src/mocks/`. Salas abertas (sem
paredes) usam `open: true`; uma sala na ponta do corredor recebe a porta na parede que o fecha.
Edite os arquivos de `src/mocks/`. Cada sala precisa encostar no corredor indicado em
`corridor` (o montador valida e calcula a porta). Rode `pnpm test` para checar que todos os
destinos continuam alcançáveis.
