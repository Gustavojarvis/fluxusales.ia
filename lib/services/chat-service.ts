import { supabase } from '@/lib/supabase/client';
import type { Conversation, Message, ConversationSession } from '@/lib/types/database';

// Chat service — persists conversations and messages to the database.
// Each chat session gets a conversation record; every message is saved.
export class ChatService {
  // Create a conversation record in the DB
  static async createConversation(companyId: string, session: ConversationSession): Promise<string> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        company_id: companyId,
        state: session.state,
        cart_data: session.cart as any,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  // Update conversation state and cart
  static async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);
    if (error) throw new Error(error.message);
  }

  // Save a message
  static async saveMessage(conversationId: string, sender: 'customer' | 'ai' | 'system', content: string, metadata?: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender,
        content,
        metadata: metadata || {},
      });
    if (error) throw new Error(error.message);
  }

  // Mark conversation as completed
  static async completeConversation(conversationId: string): Promise<void> {
    await this.updateConversation(conversationId, { status: 'completed', state: 'FINALIZADO' });
  }

  // Mark conversation as abandoned (with cart data for recovery)
  static async abandonConversation(conversationId: string, cartData: Record<string, unknown>, lastMessage: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        status: 'abandoned',
        abandoned_cart: cartData,
        last_message: lastMessage,
      })
      .eq('id', conversationId);
    if (error) throw new Error(error.message);
  }

  // List conversations for a company (dashboard)
  static async listByCompany(companyId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Conversation[]) || [];
  }

  // Get messages for a conversation
  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Message[]) || [];
  }

  // Get abandoned carts for a company
  static async getAbandonedCarts(companyId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'abandoned')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Conversation[]) || [];
  }
}
