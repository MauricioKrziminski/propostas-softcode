import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { COR, FONTE } from "./tema";
import { ETAPAS } from "@/lib/proposta/processo";
import { CONTATO } from "@/lib/contato";
import { formatarDataLonga, formatarValor } from "@/lib/proposta/formatar";
import { caminhoPublico, type Proposta } from "@/lib/proposta/schema";

/**
 * O PDF da proposta.
 *
 * NÃO é uma cópia da tela: é uma tradução. O `@react-pdf/renderer` tem motor
 * próprio: flexbox sim, grid não, pseudo-elemento não, variável CSS não. Tentar
 * reproduzir vidro, parallax e seção travada seria trabalho perdido para um
 * resultado pior. O que atravessa é o design system: as mesmas cores, a mesma
 * tipografia (Fraunces no display, Satoshi no texto), o mesmo ritmo de
 * etiquetas numeradas e filete de acento.
 *
 * O que o papel ganha e a tela não tem: capa própria, sumário com página,
 * numeração de rodapé e um bloco de assinatura, porque cliente corporativo
 * anexa isto num processo interno.
 */

const raiz = path.join(process.cwd(), "src", "lib", "pdf");

/**
 * A logo entra como BUFFER, não como caminho.
 *
 * Com um caminho absoluto o `Image` do react-pdf tenta buscar por `fetch` e
 * falha em SILÊNCIO: o PDF sai válido, do mesmo tamanho, só que sem a imagem,
 * defeito que nenhuma verificação de status pegaria. Lido uma vez, no módulo.
 */
const LOGO = {
  data: fs.readFileSync(path.join(raiz, "logo-softcode-claro.png")),
  format: "png" as const,
};

Font.register({
  family: FONTE.display,
  src: path.join(raiz, "fontes", "Fraunces-Bold.ttf"),
  fontWeight: 700,
});
Font.register({
  family: FONTE.texto,
  src: path.join(raiz, "fontes", "Satoshi-Regular.ttf"),
});

/** Sem isto, palavra longa estoura a caixa em vez de hifenizar. */
Font.registerHyphenationCallback((palavra) => [palavra]);

const e = StyleSheet.create({
  pagina: {
    backgroundColor: COR.fundo,
    color: COR.texto,
    fontFamily: FONTE.texto,
    fontSize: 10,
    lineHeight: 1.55,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
  },
  capa: {
    backgroundColor: COR.noite,
    color: "#e8eef6",
    padding: 48,
    height: "100%",
    justifyContent: "space-between",
  },
  capaEtiqueta: {
    fontSize: 8,
    letterSpacing: 2.5,
    color: COR.acentoClaro,
    textTransform: "uppercase",
  },
  capaNome: {
    fontFamily: FONTE.display,
    fontWeight: 700,
    fontSize: 46,
    color: "#e8eef6",
    marginTop: 10,
    lineHeight: 1.05,
  },
  capaProjeto: { fontSize: 13, color: "#8fa3bb", marginTop: 14 },
  regua: { height: 3, width: 64, backgroundColor: COR.acentoClaro },

  secaoTitulo: {
    fontFamily: FONTE.display,
    fontWeight: 700,
    fontSize: 17,
    color: COR.navy,
    marginTop: 4,
  },
  etiqueta: {
    fontSize: 7.5,
    letterSpacing: 2,
    color: COR.acento,
    textTransform: "uppercase",
  },
  cabecalhoSecao: { marginBottom: 12 },
  fileteSecao: { height: 1.5, width: 40, backgroundColor: COR.acento, marginTop: 8 },

  paragrafo: { marginBottom: 8, color: COR.texto },
  neblina: { color: COR.neblina },

  /* O marcador de lista é um FILETE DESENHADO, não um caractere.
     Com um travessão dentro de um Text de 10pt de largura o traço encostava
     na palavra seguinte, e pior: disputava leitura com a pontuação do próprio
     item. Desenhado, ele é curto, fino, azul e tem folga garantida por caixa
     própria. */
  itemLinha: { flexDirection: "row", marginBottom: 5 },
  marcadorCaixa: { width: 16, paddingTop: 7 },
  marcador: { height: 1.5, width: 7, backgroundColor: COR.acento },

  citacao: {
    backgroundColor: COR.azulClaro,
    borderLeftWidth: 2,
    borderLeftColor: COR.acento,
    padding: 14,
    marginTop: 10,
  },
  citacaoTexto: { fontFamily: FONTE.display, fontWeight: 700, fontSize: 13, color: COR.navy },

  cartao: {
    borderWidth: 1,
    borderColor: COR.linha,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  cartaoDestaque: { borderColor: COR.acento, backgroundColor: COR.azulClaro },
  /* `lineHeight` explícito: a Fraunces Bold em 20pt desenha fora da caixa que o
     react-pdf calcula, e a linha seguinte (a forma de pagamento) subia por cima
     do valor. Margem embaixo separa o preço do que vem depois. */
  valor: {
    fontFamily: FONTE.display,
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.45,
    color: COR.navy,
    marginTop: 10,
    marginBottom: 4,
  },
  valorDestaque: { color: COR.acento },

  linhaTabela: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
    paddingVertical: 6,
  },

  /* Rodapé SEM `position: absolute`. Com absolute + left/right, o layout
     estourava ("unsupported number: -2.07e+21") quando o documento inteiro era
     montado, reproduzia só com o conteúdo real, nunca com texto sintético.
     Um Text `fixed` no fluxo é o caminho robusto: repete em toda página e não
     depende de cálculo de caixa absoluta. */
  rodape: {
    fontSize: 7.5,
    color: COR.neblina,
    borderTopWidth: 1,
    borderTopColor: COR.linha,
    paddingTop: 8,
    marginTop: 20,
    textAlign: "center",
  },
  assinaturaBloco: { flexDirection: "row", gap: 24, marginTop: 28 },
  assinaturaCol: { flex: 1 },
  assinaturaLinha: { borderTopWidth: 1, borderTopColor: COR.navy, marginTop: 36, paddingTop: 6 },
});

function Cabecalho({ etiqueta, titulo }: { etiqueta: string; titulo: string }) {
  return (
    <View style={e.cabecalhoSecao}>
      <Text style={e.etiqueta}>{etiqueta}</Text>
      <Text style={e.secaoTitulo}>{titulo}</Text>
      <View style={e.fileteSecao} />
    </View>
  );
}

/**
 * Item de lista. O marcador é desenhado (ver `marcador` no StyleSheet) e mora
 * numa coluna própria, então nunca encosta no texto. `divisoria` troca o
 * espaçamento por uma linha entre itens: é o formato de "Fora do escopo".
 */
function Item({
  children,
  divisoria,
}: {
  children: React.ReactNode;
  divisoria?: boolean;
}) {
  return (
    <View style={divisoria ? e.linhaTabela : e.itemLinha}>
      <View style={e.marcadorCaixa}>
        <View style={e.marcador} />
      </View>
      <Text style={{ flex: 1 }}>{children}</Text>
    </View>
  );
}

function Rodape({ caminho }: { caminho: string }) {
  return (
    <Text
      style={e.rodape}
      fixed
      render={({ pageNumber, totalPages }) =>
        `proposta.softcodedev.com.br/${caminho}    ·    ${pageNumber} de ${totalPages}`
      }
    />
  );
}

export function DocumentoProposta({ proposta }: { proposta: Proposta }) {
  const { conteudo, cliente } = proposta;
  const caminho = caminhoPublico(proposta);

  /** A numeração acompanha a ordem real, como na tela. */
  let n = 0;
  const proximo = () => String(++n).padStart(2, "0");

  return (
    <Document
      title={`Proposta para ${cliente.empresa}`}
      author="SoftCode"
      subject={proposta.tituloProjeto}
    >
      {/* ── capa ── */}
      <Page size="A4" style={{ padding: 0 }}>
        <View style={e.capa}>
          <View>
            {/* Este `Image` é o do @react-pdf, não o do DOM: não existe `alt`
                em PDF, e a regra de acessibilidade do JSX não sabe disso. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={LOGO} style={{ width: 104, height: 104 }} />
          </View>

          <View>
            <Text style={e.capaEtiqueta}>Proposta para</Text>
            <Text style={e.capaNome}>{cliente.empresa}</Text>
            <View style={[e.regua, { marginTop: 20 }]} />
            <Text style={e.capaProjeto}>{proposta.tituloProjeto}</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={e.capaEtiqueta}>Emissão</Text>
              <Text style={{ marginTop: 4 }}>{formatarDataLonga(proposta.emitidaEm)}</Text>
            </View>
            <View>
              <Text style={e.capaEtiqueta}>Validade</Text>
              <Text style={{ marginTop: 4 }}>{formatarDataLonga(proposta.validaAte)}</Text>
            </View>
            <View>
              <Text style={e.capaEtiqueta}>Aos cuidados de</Text>
              <Text style={{ marginTop: 4 }}>{cliente.nome}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── corpo ── */}
      <Page size="A4" style={e.pagina}>

        {conteudo.entendimento && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.entendimento.titulo ?? "O que entendemos"}
            />
            {conteudo.entendimento.paragrafos.map((p, i) => (
              <Text key={i} style={e.paragrafo}>
                {p}
              </Text>
            ))}
            {conteudo.entendimento.citacaoCliente && (
              <View style={e.citacao} wrap={false}>
                <Text style={e.citacaoTexto}>
                  “{conteudo.entendimento.citacaoCliente.texto}”
                </Text>
                {conteudo.entendimento.citacaoCliente.autor && (
                  <Text style={[e.neblina, { marginTop: 6, fontSize: 9 }]}>
                    {conteudo.entendimento.citacaoCliente.autor}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {conteudo.solucao && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.solucao.titulo ?? "A solução proposta"}
            />
            <Text style={e.paragrafo}>{conteudo.solucao.resumo}</Text>
            {conteudo.solucao.pilares.map((pilar) => (
              <View key={pilar.titulo} style={e.cartao} wrap={false}>
                <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 11, color: COR.navy }}>
                  {pilar.titulo}
                </Text>
                <Text style={[e.neblina, { marginTop: 3 }]}>{pilar.descricao}</Text>
              </View>
            ))}
          </View>
        )}

        {conteudo.escopo && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.escopo.titulo ?? "Escopo detalhado"}
            />
            {conteudo.escopo.introducao && (
              <Text style={e.paragrafo}>{conteudo.escopo.introducao}</Text>
            )}
            {conteudo.escopo.modulos.map((modulo, i) => (
              <View key={modulo.titulo} style={e.cartao}>
                <Text style={e.etiqueta}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 11, color: COR.navy, marginTop: 2 }}>
                  {modulo.titulo}
                </Text>
                <Text style={[e.neblina, { marginTop: 3, marginBottom: 6 }]}>
                  {modulo.resumo}
                </Text>
                {modulo.itens.map((item, j) => (
                  <Item key={j}>{item}</Item>
                ))}
                {modulo.entregaveis && modulo.entregaveis.length > 0 && (
                  <View style={{ marginTop: 6, backgroundColor: COR.azulClaro, padding: 8 }}>
                    <Text style={e.etiqueta}>Você recebe</Text>
                    {modulo.entregaveis.map((it, j) => (
                      <Text key={j} style={{ marginTop: 2 }}>
                        {it}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {conteudo.processo?.mostrar && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.processo.titulo ?? "Como trabalhamos"}
            />
            {conteudo.processo.introducao && (
              <Text style={e.paragrafo}>{conteudo.processo.introducao}</Text>
            )}
            {ETAPAS.map((etapa) => (
              <View key={etapa.numero} style={e.cartao} wrap={false}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: FONTE.display,
                      fontWeight: 700,
                      fontSize: 22,
                      color: COR.linhaAzul,
                      width: 34,
                    }}
                  >
                    {String(etapa.numero).padStart(2, "0")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 11, color: COR.navy }}>
                      {etapa.titulo}
                    </Text>
                    <Text style={[e.neblina, { marginTop: 3 }]}>{etapa.descricao}</Text>
                    <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={e.etiqueta}>Você recebe</Text>
                        <Text style={{ marginTop: 2 }}>{etapa.entrega}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[e.etiqueta, { color: COR.neblina }]}>Sua parte</Text>
                        <Text style={[e.neblina, { marginTop: 2 }]}>{etapa.suaParte}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {conteudo.cronograma && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.cronograma.titulo ?? "Cronograma"}
            />
            {conteudo.cronograma.fases.map((fase, i) => {
              const maior = Math.max(...conteudo.cronograma!.fases.map((f) => f.semanas));
              return (
                <View key={fase.nome} style={{ marginBottom: 10 }} wrap={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 10.5, color: COR.navy }}>
                      {String(i + 1).padStart(2, "0")}  {fase.nome}
                    </Text>
                    <Text style={e.neblina}>{fase.duracao}</Text>
                  </View>
                  {/* A barra impressa carrega a MESMA proporção da tela: é o
                      único jeito de o cronograma continuar comparável no papel. */}
                  <View style={{ height: 4, backgroundColor: COR.linha, marginTop: 4 }}>
                    <View
                      style={{
                        height: 4,
                        width: `${(fase.semanas / maior) * 100}%`,
                        backgroundColor: COR.acento,
                      }}
                    />
                  </View>
                  {fase.descricao && (
                    <Text style={[e.neblina, { marginTop: 4 }]}>{fase.descricao}</Text>
                  )}
                </View>
              );
            })}
            {conteudo.cronograma.observacao && (
              <Text style={[e.neblina, { marginTop: 8 }]}>
                {conteudo.cronograma.observacao}
              </Text>
            )}
          </View>
        )}

        {conteudo.investimento && (
          <View style={{ marginBottom: 26 }} break>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.investimento.titulo ?? "Investimento"}
            />
            {conteudo.investimento.introducao && (
              <Text style={e.paragrafo}>{conteudo.investimento.introducao}</Text>
            )}
            {conteudo.investimento.opcoes.map((opcao) => (
              <View
                key={opcao.id}
                style={[e.cartao, ...(opcao.destaque ? [e.cartaoDestaque] : [])]}
                wrap={false}
              >
                {opcao.destaque && <Text style={e.etiqueta}>Recomendada</Text>}
                <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 13, color: COR.navy }}>
                  {opcao.nome}
                </Text>
                <Text style={[e.neblina, { marginTop: 2 }]}>{opcao.resumo}</Text>
                <Text style={[e.valor, ...(opcao.destaque ? [e.valorDestaque] : [])]}>
                  {formatarValor(opcao.valorCentavos)}
                </Text>
                {opcao.formaPagamento && (
                  <Text style={[e.neblina, { fontSize: 9 }]}>{opcao.formaPagamento}</Text>
                )}
                {opcao.prazo && (
                  <Text style={[e.neblina, { fontSize: 9 }]}>Prazo: {opcao.prazo}</Text>
                )}
                <View style={{ marginTop: 6 }}>
                  {opcao.itens.map((item, j) => (
                    <Item key={j}>{item}</Item>
                  ))}
                </View>
              </View>
            ))}
            {conteudo.investimento.observacoes?.map((o, i) => (
              <Text key={i} style={[e.neblina, { fontSize: 9, marginTop: 3 }]}>
                {o}
              </Text>
            ))}
          </View>
        )}

        {conteudo.foraDoEscopo && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.foraDoEscopo.titulo ?? "Fora do escopo"}
            />
            {conteudo.foraDoEscopo.itens.map((item, i) => (
              <Item key={i} divisoria>
                {item}
              </Item>
            ))}
            {conteudo.foraDoEscopo.nota && (
              <Text style={[e.neblina, { marginTop: 8 }]}>{conteudo.foraDoEscopo.nota}</Text>
            )}
          </View>
        )}

        {conteudo.responsabilidades && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.responsabilidades.titulo ?? "O que precisamos de você"}
            />
            {conteudo.responsabilidades.introducao && (
              <Text style={e.paragrafo}>{conteudo.responsabilidades.introducao}</Text>
            )}
            {conteudo.responsabilidades.itens.map((it, i) => (
              <View key={i} style={e.linhaTabela} wrap={false}>
                <Text style={[e.etiqueta, { width: 22 }]}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text>{it.item}</Text>
                  {it.detalhe && (
                    <Text style={[e.neblina, { fontSize: 9 }]}>{it.detalhe}</Text>
                  )}
                </View>
              </View>
            ))}
            {conteudo.responsabilidades.nota && (
              <Text style={[e.neblina, { marginTop: 8 }]}>
                {conteudo.responsabilidades.nota}
              </Text>
            )}
          </View>
        )}

        {conteudo.sobre && (
          <View style={{ marginBottom: 26 }}>
            <Cabecalho
              etiqueta={proximo()}
              titulo={conteudo.sobre.titulo ?? "Sobre a SoftCode"}
            />
            <Text style={e.paragrafo}>{conteudo.sobre.texto}</Text>
            {conteudo.sobre.cases?.map((caso) => (
              <View key={caso.cliente} style={e.cartao} wrap={false}>
                <Text>{caso.resultado}</Text>
                <Text style={{ fontFamily: FONTE.display, fontWeight: 700, fontSize: 10.5, color: COR.navy, marginTop: 6 }}>
                  {caso.cliente}
                </Text>
                <Text style={[e.etiqueta, { color: COR.neblina, marginTop: 1 }]}>
                  {caso.segmento}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── aceite: o que a tela não tem e o papel precisa ── */}
        <View break>
          <Cabecalho etiqueta={proximo()} titulo={conteudo.aceite?.titulo ?? "Aceite"} />
          {conteudo.aceite?.texto && <Text style={e.paragrafo}>{conteudo.aceite.texto}</Text>}

          {conteudo.investimento && (
            <View style={{ marginTop: 8 }}>
              <Text style={e.etiqueta}>Opção escolhida</Text>
              {conteudo.investimento.opcoes.map((o) => (
                <View key={o.id} style={e.linhaTabela}>
                  <Text style={{ width: 16 }}>☐</Text>
                  <Text style={{ flex: 1 }}>{o.nome}</Text>
                  <Text>{formatarValor(o.valorCentavos)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={e.assinaturaBloco}>
            <View style={e.assinaturaCol}>
              <View style={e.assinaturaLinha}>
                <Text style={e.etiqueta}>Contratante</Text>
                <Text style={{ marginTop: 3 }}>{cliente.empresa}</Text>
                <Text style={[e.neblina, { fontSize: 9, marginTop: 8 }]}>
                  Nome: ______________________
                </Text>
                <Text style={[e.neblina, { fontSize: 9, marginTop: 4 }]}>
                  Data: ______/______/________
                </Text>
              </View>
            </View>
            <View style={e.assinaturaCol}>
              <View style={e.assinaturaLinha}>
                <Text style={e.etiqueta}>Contratada</Text>
                <Text style={{ marginTop: 3 }}>SoftCode</Text>
                <Text style={[e.neblina, { fontSize: 9, marginTop: 8 }]}>
                  Nome: ______________________
                </Text>
                <Text style={[e.neblina, { fontSize: 9, marginTop: 4 }]}>
                  Data: ______/______/________
                </Text>
              </View>
            </View>
          </View>

          <Text style={[e.neblina, { fontSize: 8, marginTop: 20 }]}>
            Esta proposta é válida até {formatarDataLonga(proposta.validaAte)}. Também é
            possível aceitar pela versão on-line, em
            proposta.softcodedev.com.br/{caminho}, onde o aceite fica registrado com data,
            hora, IP e navegador. Dúvidas sobre seus dados: {CONTATO.emailDados}.
          </Text>
        </View>
        <Rodape caminho={caminho} />
      </Page>
    </Document>
  );
}
