import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { CatalogService } from '@/lib/services/catalog-service';
import { ConversationEngine } from '@/lib/services/conversation-engine';
import { OrderService } from '@/lib/services/order-service';
import type { ApiResponse, ConversationSession, ChatMessage } from '@/lib/types/database';

// POST /api/chat/message
// Receives a chat message and returns bot response(s).
// The conversation session is passed in the body (stateless API, stateful client).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, message } = body as { session: ConversationSession; message: string };

    if (!session?.company_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Sessão inválida. Empresa não identificada.' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Mensagem vazia.' },
        { status: 400 }
      );
    }

    // Fetch the company's catalog (real data from DB — never invent)
    const [products, categories] = await Promise.all([
      CatalogService.getProducts(session.company_id),
      CatalogService.getCategories(session.company_id),
    ]);

    // Process the message through the conversation engine
    const { session: newSession, messages: botMessages } = ConversationEngine.processInput(
      session,
      message,
      { products, categories }
    );

    // If the conversation reached FINALIZADO, create the order
    if (newSession.state === 'FINALIZADO' && newSession.cart.items.length > 0) {
      const payload = ConversationEngine.buildOrderPayload(newSession);
      const errors = OrderService.validate(payload);

      if (errors.length > 0) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: errors.join(' '),
          data: { session: newSession, messages: botMessages },
        });
      }

      const order = await OrderService.create(payload);
      const orderSummary = OrderService.formatOrderSummary(order);

      // Replace the generic confirmation with the real order summary
      botMessages[botMessages.length - 1] = {
        ...botMessages[botMessages.length - 1],
        content: `🎉 *Pedido confirmado!*\n\n${orderSummary}\n\nAguarde — em breve atualizaremos o status do seu pedido.`,
      };

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { session: newSession, messages: botMessages, order },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { session: newSession, messages: botMessages },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: `Falha de conexão: ${message}` },
      { status: 500 }
    );
  }
}

// GET /api/chat/message?company_id=xxx
// Returns a new conversation session with the welcome message
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const companyName = searchParams.get('company_name') || 'nossa loja';

    if (!companyId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Empresa não identificada.' },
        { status: 400 }
      );
    }

    const session = ConversationEngine.createSession(companyId);
    const welcome = ConversationEngine.getWelcomeMessage(companyName);
    session.messages = [welcome];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { session, messages: [welcome] },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Erro ao iniciar conversa.' },
      { status: 500 }
    );
  }
}
