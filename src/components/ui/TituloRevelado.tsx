/**
 * Título com reveal por recorte, não fade do bloco todo.
 *
 * Cada palavra ganha seu próprio `overflow: hidden` e sobe de dentro dele, com
 * o atraso vindo do índice — o texto se monta linha a linha em vez de aparecer
 * inteiro. Server Component: zero JS.
 *
 * Sem suporte a scroll-driven ou com reduced-motion, as palavras já estão na
 * posição final e o recorte não faz diferença nenhuma.
 */
export function TituloRevelado({
  texto,
  className = "",
  como: Tag = "h2",
}: {
  texto: string;
  className?: string;
  como?: "h1" | "h2" | "h3";
}) {
  const palavras = texto.split(" ");

  return (
    <Tag className={className}>
      {palavras.map((palavra, i) => (
        <span key={i} className="palavra-clip">
          <span
            className="palavra-sobe"
            style={{ ["--i" as string]: Math.min(i, 8) }}
          >
            {palavra}
          </span>
          {i < palavras.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
