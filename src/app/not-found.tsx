import { Portaria } from "@/components/ui/Portaria";

/**
 * 404 genérico de propósito: a mensagem é idêntica para link inexistente, token
 * errado e proposta em rascunho. A resposta nunca confirma se um endereço
 * existe, que é a contrapartida de a URL ser a única autorização.
 *
 * O texto aposta na causa mais provável, que é link truncado no aplicativo de
 * mensagem, porque é a única coisa que quem chegou aqui consegue resolver
 * sozinho.
 */
export default function NaoEncontrada() {
  return (
    <Portaria
      etiqueta="404"
      titulo="Este link não abre uma proposta"
      texto={
        <>
          O endereço pode ter vindo pela metade, o que acontece bastante quando um link
          passa por aplicativo de mensagem. Vale conferir se ele veio inteiro, até o fim.
        </>
      }
      nota={
        <>
          Se estiver correto e ainda assim não abrir, responda a conversa em que você
          recebeu o link, ou peça outro por um dos canais acima.
        </>
      }
      mensagemDeContato="Olá! O link da proposta que recebi não está abrindo. Podem me mandar de novo?"
    />
  );
}
