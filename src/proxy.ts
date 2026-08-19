import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Duas coisas simples, e nenhuma delas é autorização.
 *
 * 1. `/admin` continua respondendo, redirecionando para `/painel`. O endereço
 *    mudou depois que o painel virou português como o resto do produto, e link
 *    salvo no navegador não pode morrer por causa disso.
 *
 * 2. Checagem OTIMISTA: quem não tem o cookie de sessão vai para `/painel`, que
 *    é onde mora a tela de entrada. Isso evita renderizar uma página inteira
 *    para depois descobrir que não há sessão.
 *
 * O que ela NÃO faz é verificar a assinatura do cookie. Autorização é
 * `exigirAdmin()`, em `src/lib/admin/guarda.ts`, chamado dentro de cada página e
 * de cada action: cookie forjado passa por aqui e morre lá. No Next 16 o antigo
 * middleware se chama proxy, e roda em Node por padrão.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  if (request.cookies.has("sessao_admin")) return NextResponse.next();

  return NextResponse.redirect(new URL("/painel", request.url));
}

export const config = {
  /* `/painel` fica de fora: é a própria tela de entrada, e mandá-la para si
     mesma seria um laço de redirecionamento. */
  matcher: ["/admin", "/admin/:path*", "/painel/:path+"],
};
