# O jardim do Estevão

Next.js App Router + TypeScript. Carta-convite → cadastro, parentesco, fralda, mimo opcional e recado → convite ao jardim → editor LPC em tela inteira → jardim interativo em tela inteira.

## Rodar localmente

```sh
npm ci
npm run dev -- --webpack
```

Abra http://localhost:3000. O `.env.local` desta instalação está conectado ao projeto Neon informado, branch `production`. O modo real está ativo: participações persistem no banco. A senha de `/familia` está na variável `FAMILY_PASSWORD` desse arquivo, que não é versionado.

Para demonstração descartável, use `NEXT_PUBLIC_DEMO_MODE=true` e reinicie. Inclui 12 convidados fictícios, 9 sentados. Dados existem somente em memória; atualizar a página reinicia o teste. Na família, a senha demo vem preenchida. Volte para `false` antes de publicar a lista real.

## Banco e deploy

Postgres.js nas rotas Node.js, conexão pooled `DATABASE_URL`. Migrações usam `DATABASE_URL_UNPOOLED`. Neon provê o banco; o Next.js será hospedado na Vercel.

```sh
neon login
neon deploy
npm run db:migrate
npm run build
npm start
```

`neon.ts` declara a configuração, `.neon` fixa projeto/branch e é ignorado pelo Git. Postgres já é incluído no projeto Neon. `neon deploy` sincroniza variáveis locais, mas não publica o Next.js na Vercel.

Migrações estão em `db/migrations`; o runner aplica cada uma uma vez e verifica checksum. Crie outro arquivo para mudanças futuras, sem alterar migrações aplicadas. A branch temporária `validacao-cha` foi usada para validar o esquema e expira após sete dias.

Na Vercel, importe o repositório como Next.js e configure `DATABASE_URL`, `FAMILY_PASSWORD` e `NEXT_PUBLIC_DEMO_MODE=false`. A conexão direta só é necessária onde executa migrações. Nunca exponha credenciais em variáveis `NEXT_PUBLIC_`. Nenhum deploy Vercel foi feito automaticamente.

## Onde editar

- `data/items.ts`: tamanhos, marcas aceitas, detalhes, quantidades e links opcionais dos presentes. São exemplos; ajuste antes de enviar convites. Preserve IDs já reservados.
- `data/relationships.ts`: parentesco/vínculo; o formulário aceita outro vínculo escrito.
- `app/page.tsx`: carta, convite e textos iniciais.
- `components/ParticipationForm.tsx`: formulário e acordeão dos mimos, incluindo outro presente livre.
- `components/ParticipationFlow.tsx`: etapas, envio e confirmação da cadeira.
- `components/CharacterCreator.tsx`: editor. `lib/character.ts`: categorias, traduções e cores. `data/lpc-catalog.json`: peças disponíveis.
- `components/Garden.tsx`: interação, zoom e personagens. `data/garden-layout.json`: dimensões e posições das 48 cadeiras.
- `scripts/prepare-garden-wide.mjs`: composição reproduzível do cenário; execute com Node.
- `app/experience.css`: editor e layout. `app/map-controls.css`: zoom. `app/form-details.css`: mimos e popup.
- `app/familia/page.tsx`: todas as participações, inclusive sem cadeira.

## Funcionamento

Cadastro salvo antes de oferecer o jardim. O navegador guarda somente o recibo para escolher/trocar a cadeira daquela participação. Limpar os dados do navegador perde a autorização; não há recuperação por contato nesta versão.

Todos os depoimentos são públicos. Contatos, parentesco e presentes ficam na área da família protegida por senha. Reserva não efetua compra nem confirma entrega. “Outro mimo” guarda texto livre sem estoque limitado.

Reservas são conferidas em transação; cadeiras têm restrição UNIQUE. Reenvio com mesmo recibo não duplica participação. Confirmar cadeira abre popup e mantém jardim aberto. Os detalhes permitem girar o personagem. O mapa começa em zoom máximo no altar; arraste, use Altar para voltar ou Ver tudo para enquadrar.

O editor usa peças LPC compatíveis com Homem/Mulher, dez tons de pele e recoloração. Não é o catálogo integral do Universal LPC. Capas não aparecem no editor; personagens antigos continuam compatíveis. Pose sentada é adaptação visual do sprite, não animação original de sentar.

## Arte e bibliotecas

- Universal LPC Spritesheet Character Generator, revisão `b029f677ca4007830a7ec8e4bdbd717b0d0eb361`: camadas e créditos individuais.
- LPC Trees, Plants, Wooden Furniture e Terrains: árvores e elementos; composição e elementos adicionais próprios.
- Motion: carta animada com suporte a movimento reduzido.
- Radix Dialog: popups com foco e teclado.
- Sharp: preparação reproduzível das imagens.

`/creditos` e `public/assets/ART-LICENSE.md` indicam atribuições/licenças. Fontes, manifestos e scripts acompanham os assets. Licenças da arte não abrangem dados dos convidados.

## Amazon

O campo opcional `url` abre o produto na loja. Não há sincronização de lista, preços ou confirmação de compra.

## Verificação

```sh
npm run typecheck
npm run build
npm start -- --port 3001
# Em outro terminal:
npm run test:database
```

O teste usa `API_BASE_URL` (padrão http://127.0.0.1:3001), endpoints reais e remove somente suas participações temporárias. Requer conexões Neon e `FAMILY_PASSWORD` no `.env.local`. O build usa Webpack explicitamente.
