'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, RotateCcw, ShoppingCart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CartService } from '@/lib/services/cart-service';
import type { ChatMessage } from '@/lib/types/database';

type ChatWidgetProps = {
  companyId: string;
  companyName: string;
};

export function ChatWidget({ companyId, companyName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showCart, setShowCart] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { session, messages, isTyping, loading, error, init, sendMessage, reset } = useChat(companyId, companyName);

  // Initialize chat when opened for the first time
  useEffect(() => {
    if (isOpen && !session) {
      init();
    }
  }, [isOpen, session, init]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend() {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  }

  function handleQuickReply(reply: string) {
    sendMessage(reply);
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const cartItemCount = session ? CartService.getItemCount(session.cart) : 0;
  const cartTotal = session ? CartService.getTotal(session.cart) : 0;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
          aria-label="Abrir chat"
        >
          <MessageSquare className="h-6 w-6" />
          {cartItemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {cartItemCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-card shadow-2xl sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-2xl sm:border sm:border-border animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{companyName}</p>
                <p className="flex items-center gap-1 text-xs opacity-90">
                  <span className="h-2 w-2 rounded-full bg-success bg-white animate-pulse-soft" />
                  Online agora
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {cartItemCount > 0 && (
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-primary-foreground/10"
                  aria-label="Carrinho"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold">
                    {cartItemCount}
                  </span>
                </button>
              )}
              <button
                onClick={reset}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-primary-foreground/10"
                aria-label="Reiniciar conversa"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-primary-foreground/10"
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cart drawer (toggle) */}
          {showCart && session && (
            <div className="border-b border-border bg-muted/50 p-3 max-h-[200px] overflow-y-auto animate-fade-in">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Carrinho</p>
              {session.cart.items.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between py-1 text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
                <span>Total</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/20 p-4 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onQuickReply={handleQuickReply} formatTime={formatTime} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={isTyping || loading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || loading}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Message bubble component
function MessageBubble({
  message,
  onQuickReply,
  formatTime,
}: {
  message: ChatMessage;
  onQuickReply: (reply: string) => void;
  formatTime: (ts: string) => string;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex items-start gap-2 max-w-[85%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {!isUser && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        <div>
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line',
              isUser
                ? 'rounded-tr-sm bg-primary text-primary-foreground'
                : 'rounded-tl-sm bg-muted'
            )}
          >
            {message.content}
          </div>

          {/* Product cards */}
          {message.products && message.products.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
                >
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-8 w-8 rounded object-cover" />
                  )}
                  <div>
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="text-xs text-primary font-semibold">R$ {Number(p.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick replies */}
          {message.quickReplies && message.quickReplies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => onQuickReply(reply)}
                  className="rounded-full border border-primary bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <p className={cn('mt-1 text-[10px] text-muted-foreground', isUser ? 'text-right' : 'text-left')}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
