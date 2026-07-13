'use client';

import { useState, useCallback, useRef } from 'react';
import type { ConversationSession, ChatMessage } from '@/lib/types/database';
import { ConversationEngine } from '@/lib/services/conversation-engine';
import { CatalogService } from '@/lib/services/catalog-service';
import { OrderService } from '@/lib/services/order-service';
import { ChatService } from '@/lib/services/chat-service';
import { CompanyService } from '@/lib/services/company-service';

// useChat — manages the conversation session, messages, cart state,
// and persists all messages to the database.
export function useChat(companyId: string, companyName: string) {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const catalogRef = useRef<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
  const welcomeMsgRef = useRef<string | null>(null);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [products, categories] = await Promise.all([
        CatalogService.getProducts(companyId),
        CatalogService.getCategories(companyId),
      ]);
      catalogRef.current = { products, categories };

      // Get custom welcome message from company settings
      let welcomeMessage = `Olá! Bem-vindo(a) à ${companyName}! 👋\n\nSou seu assistente virtual. Posso te ajudar a fazer um pedido. Quer ver nosso cardápio?`;
      try {
        const settings = await CompanyService.getSettings(companyId);
        if (settings?.welcome_message) {
          welcomeMessage = settings.welcome_message;
        }
      } catch {
        // Use default
      }
      welcomeMsgRef.current = welcomeMessage;

      const newSession = ConversationEngine.createSession(companyId);
      const welcome: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: welcomeMessage,
        timestamp: new Date().toISOString(),
        quickReplies: ['Ver cardápio', 'Destaques', 'Falar com atendente'],
      };
      newSession.messages = [welcome];
      setSession(newSession);
      setMessages([welcome]);

      // Persist conversation to DB
      try {
        const convId = await ChatService.createConversation(companyId, newSession);
        newSession.conversation_db_id = convId;
        setSession({ ...newSession });
        // Save welcome message
        await ChatService.saveMessage(convId, 'ai', welcomeMessage);
      } catch {
        // Non-fatal — chat works without persistence
      }
    } catch {
      setError('Falha ao carregar o catálogo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [companyId, companyName]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !session) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Save user message to DB
    if (session.conversation_db_id) {
      ChatService.saveMessage(session.conversation_db_id, 'customer', text).catch(() => {});
    }

    const updatedSession = { ...session, messages: [...session.messages, userMessage] };
    const { session: newSession, messages: botMessages } = ConversationEngine.processInput(
      updatedSession,
      text,
      catalogRef.current
    );

    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

    if (newSession.state === 'FINALIZADO' && newSession.cart.items.length > 0) {
      try {
        const payload = ConversationEngine.buildOrderPayload(newSession);
        const errors = OrderService.validate(payload);
        if (errors.length > 0) {
          setError(errors.join(' '));
          const errorMsg: ChatMessage = {
            id: crypto.randomUUID(), role: 'bot',
            content: `Ops! ${errors.join(' ')}`, timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setSession({ ...newSession, state: 'ESCOLHENDO_PRODUTO' });
          setIsTyping(false);
          return;
        }

        const order = await OrderService.create(payload);
        const orderSummary = OrderService.formatOrderSummary(order);
        const confirmMessage: ChatMessage = {
          id: crypto.randomUUID(), role: 'bot',
          content: `🎉 *Pedido confirmado!*\n\n${orderSummary}\n\nAguarde — em breve atualizaremos o status do seu pedido.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, ...botMessages.slice(0, -1), confirmMessage]);
        setSession({ ...newSession, state: 'FINALIZADO' });

        // Save bot confirmation to DB
        if (session.conversation_db_id) {
          await ChatService.saveMessage(session.conversation_db_id, 'ai', confirmMessage.content);
          await ChatService.completeConversation(session.conversation_db_id);
        }
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(), role: 'bot',
          content: 'Erro ao processar pedido. Tente novamente ou entre em contato.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setError('Erro ao criar pedido.');
      }
    } else {
      setMessages((prev) => [...prev, ...botMessages]);
      setSession(newSession);

      // Save bot messages to DB
      if (session.conversation_db_id) {
        for (const msg of botMessages) {
          ChatService.saveMessage(session.conversation_db_id, 'ai', msg.content).catch(() => {});
        }
        // Update conversation state
        ChatService.updateConversation(session.conversation_db_id, {
          state: newSession.state,
          cart_data: newSession.cart as any,
        }).catch(() => {});
      }
    }

    setIsTyping(false);
  }, [session]);

  const reset = useCallback(() => {
    const newSession = ConversationEngine.createSession(companyId);
    const welcome: ChatMessage = {
      id: crypto.randomUUID(), role: 'bot',
      content: welcomeMsgRef.current || `Olá! Bem-vindo(a) à ${companyName}! 👋\n\nPosso te ajudar a fazer um pedido. Quer ver nosso cardápio?`,
      timestamp: new Date().toISOString(),
      quickReplies: ['Ver cardápio', 'Destaques', 'Falar com atendente'],
    };
    newSession.messages = [welcome];
    setSession(newSession);
    setMessages([welcome]);
    setError(null);

    // Create new conversation in DB
    ChatService.createConversation(companyId, newSession).then((convId) => {
      newSession.conversation_db_id = convId;
      setSession({ ...newSession });
      ChatService.saveMessage(convId, 'ai', welcome.content).catch(() => {});
    }).catch(() => {});
  }, [companyId, companyName]);

  return { session, messages, isTyping, loading, error, init, sendMessage, reset };
}
