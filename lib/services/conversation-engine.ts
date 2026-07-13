import type {
  ConversationState,
  ConversationSession,
  Product,
  Category,
  Cart,
  ChatMessage,
  DeliveryMethod,
  PaymentMethod,
  CreateOrderPayload,
} from '@/lib/types/database';
import { CartService } from './cart-service';
import { PaymentService } from './payment-service';

// Conversation engine — a state machine that controls the chat flow.
// Each state determines how the bot responds and what state to transition to next.
// The engine never invents products or prices; it works with real catalog data.
export class ConversationEngine {
  static createSession(companyId: string): ConversationSession {
    return {
      id: crypto.randomUUID(),
      company_id: companyId,
      state: 'INICIO',
      messages: [],
      cart: CartService.createEmptyCart(),
      offered_categories: [],
    };
  }

  static getWelcomeMessage(companyName: string): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role: 'bot',
      content: `Olá! Bem-vindo(a) à ${companyName}! 👋\n\nSou seu assistente virtual. Posso te ajudar a fazer um pedido. Quer ver nosso cardápio?`,
      timestamp: new Date().toISOString(),
      quickReplies: ['Ver cardápio', 'Destaques', 'Falar com atendente'],
    };
  }

  // Process user input and return bot response(s) + new state
  static processInput(
    session: ConversationSession,
    input: string,
    catalog: { products: Product[]; categories: Category[] }
  ): { session: ConversationSession; messages: ChatMessage[] } {
    const messages: ChatMessage[] = [];
    const text = input.toLowerCase().trim();
    let newSession = { ...session, messages: [...session.messages] };

    switch (session.state) {
      case 'INICIO':
        return this.handleInicio(newSession, input, text, catalog, messages);
      case 'ESCOLHENDO_PRODUTO':
        return this.handleEscolhendoProduto(newSession, input, text, catalog, messages);
      case 'OFERECENDO_ADICIONAIS':
        return this.handleOferecendoAdicionais(newSession, input, text, catalog, messages);
      case 'CONFIRMANDO_PEDIDO':
        return this.handleConfirmandoPedido(newSession, input, text, messages);
      case 'COLETANDO_NOME':
        return this.handleColetandoNome(newSession, input, messages);
      case 'COLETANDO_TELEFONE':
        return this.handleColetandoTelefone(newSession, input, messages);
      case 'ESCOLHENDO_ENTREGA':
        return this.handleEscolhendoEntrega(newSession, input, text, messages);
      case 'COLETANDO_ENDERECO':
        return this.handleColetandoEndereco(newSession, input, messages);
      case 'ESCOLHENDO_PAGAMENTO':
        return this.handleEscolhendoPagamento(newSession, input, text, messages);
      case 'RESUMO':
        return this.handleResumo(newSession, input, text, messages);
      default:
        messages.push(this.createBotMessage('Algo deu errado. Vamos recomeçar?'));
        newSession.state = 'INICIO';
        return { session: newSession, messages };
    }
  }

  // ============ State handlers ============

  private static handleInicio(
    session: ConversationSession,
    input: string,
    text: string,
    catalog: { products: Product[]; categories: Category[] },
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    // User wants to see the menu
    if (text.includes('cardápio') || text.includes('cardapio') || text.includes('ver') || text.includes('menu') || text.includes('produtos')) {
      return this.showMenu(session, catalog, messages);
    }

    // User wants to see featured items
    if (text.includes('destaque') || text.includes('destaques') || text.includes('recomendad')) {
      return this.showFeatured(session, catalog, messages);
    }

    // User wants to talk to a human
    if (text.includes('atendente') || text.includes('humano') || text.includes('pessoa')) {
      messages.push(this.createBotMessage(
        'Entendo! No momento nosso atendimento humano está indisponível, mas eu posso te ajudar com seu pedido. Quer ver nosso cardápio?'
      ));
      return { session, messages };
    }

    // Default: show menu
    return this.showMenu(session, catalog, messages);
  }

  private static showMenu(
    session: ConversationSession,
    catalog: { products: Product[]; categories: Category[] },
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    if (catalog.products.length === 0) {
      messages.push(this.createBotMessage(
        'No momento não temos produtos cadastrados no cardápio. Por favor, tente novamente em alguns instantes.'
      ));
      return { session, messages };
    }

    // Group products by category
    const featured = catalog.products.filter((p) => p.is_featured);
    const regular = catalog.products.filter((p) => !p.is_featured);

    let content = 'Aqui está nosso cardápio:\n\n';
    if (featured.length > 0) {
      content += '⭐ *Destaques:*\n';
      featured.forEach((p) => {
        content += `• ${p.name} — R$ ${Number(p.price).toFixed(2)}\n`;
        if (p.description) content += `  ${p.description}\n`;
      });
      content += '\n';
    }

    // Group by category
    const byCategory = new Map<string, Product[]>();
    catalog.products.forEach((p) => {
      const catName = p.category?.name || 'Outros';
      if (!byCategory.has(catName)) byCategory.set(catName, []);
      byCategory.get(catName)!.push(p);
    });

    byCategory.forEach((products, catName) => {
      content += `*${catName}:*\n`;
      products.forEach((p) => {
        content += `• ${p.name} — R$ ${Number(p.price).toFixed(2)}\n`;
      });
      content += '\n';
    });

    content += 'Digite o nome do produto que deseja pedir!';

    messages.push(this.createBotMessage(content, catalog.products));
    session.state = 'ESCOLHENDO_PRODUTO';
    return { session, messages };
  }

  private static showFeatured(
    session: ConversationSession,
    catalog: { products: Product[]; categories: Category[] },
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    const featured = catalog.products.filter((p) => p.is_featured);

    if (featured.length === 0) {
      return this.showMenu(session, catalog, messages);
    }

    let content = '⭐ *Nossos destaques:*\n\n';
    featured.forEach((p) => {
      content += `• ${p.name} — R$ ${Number(p.price).toFixed(2)}\n`;
      if (p.description) content += `  ${p.description}\n`;
    });
    content += '\nDigite o nome do produto que deseja pedir!';

    messages.push(this.createBotMessage(content, featured));
    session.state = 'ESCOLHENDO_PRODUTO';
    return { session, messages };
  }

  private static handleEscolhendoProduto(
    session: ConversationSession,
    input: string,
    text: string,
    catalog: { products: Product[]; categories: Category[] },
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    // Check if user wants to see the menu again
    if (text.includes('cardápio') || text.includes('cardapio') || text.includes('ver menu') || text.includes('ver cardápio')) {
      return this.showMenu(session, catalog, messages);
    }

    // Check if user wants to finish / checkout
    if (text.includes('finalizar') || text.includes('concluir') || text.includes('fechar pedido') || text.includes('checkout')) {
      if (CartService.isEmpty(session.cart)) {
        messages.push(this.createBotMessage('Seu carrinho está vazio. Escolha um produto primeiro!'));
        return { session, messages };
      }
      return this.transitionToCheckout(session, messages);
    }

    // Check if user wants to see cart
    if (text.includes('carrinho') || text.includes('meu pedido')) {
      const summary = CartService.formatSummary(session.cart);
      messages.push(this.createBotMessage(`🛒 *Seu carrinho:*\n\n${summary}`));
      return { session, messages };
    }

    // Try to match a product by name
    const matchedProduct = this.findProduct(text, catalog.products);

    if (matchedProduct) {
      // Safety check: never sell unavailable products
      if (!matchedProduct.is_available) {
        messages.push(this.createBotMessage(
          `Desculpe, ${matchedProduct.name} está indisponível no momento. Que tal escolher outro produto?`
        ));
        return { session, messages };
      }

      // Add to cart
      session.cart = CartService.addItem(session.cart, matchedProduct, 1);
      const summary = CartService.formatSummary(session.cart);

      messages.push(this.createBotMessage(
        `✅ *${matchedProduct.name}* adicionado ao carrinho!\n\n${summary}\n\nQuer adicionar mais alguma coisa? Digite o nome do produto ou "finalizar pedido".`
      ));

      // Transition to offering add-ons
      session.state = 'OFERECENDO_ADICIONAIS';
      session.last_offered_category = matchedProduct.category?.name || null;
      session.offered_categories = [];
      if (matchedProduct.category?.id) {
        session.offered_categories.push(matchedProduct.category.id);
      }

      return { session, messages };
    }

    // No match — suggest products
    const suggestions = catalog.products
      .filter((p) => p.name.toLowerCase().includes(text.split(' ')[0]))
      .slice(0, 3);

    if (suggestions.length > 0) {
      let content = 'Você quis dizer algum destes?\n\n';
      suggestions.forEach((p) => {
        content += `• ${p.name} — R$ ${Number(p.price).toFixed(2)}\n`;
      });
      messages.push(this.createBotMessage(content, suggestions));
    } else {
      messages.push(this.createBotMessage(
        'Não encontrei esse produto no nosso cardápio. Pode digitar o nome novamente? Ou digite "ver cardápio" para ver as opções.'
      ));
    }

    return { session, messages };
  }

  private static handleOferecendoAdicionais(
    session: ConversationSession,
    input: string,
    text: string,
    catalog: { products: Product[]; categories: Category[] },
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    // User wants to finish
    if (text.includes('finalizar') || text.includes('concluir') || text.includes('fechar pedido') || text.includes('não') || text.includes('nao') || text.includes('so isso') || text.includes('só isso')) {
      return this.transitionToCheckout(session, messages);
    }

    // User wants to see menu again
    if (text.includes('cardápio') || text.includes('cardapio') || text.includes('ver menu')) {
      return this.showMenu(session, catalog, messages);
    }

    // Try to match a product
    const matchedProduct = this.findProduct(text, catalog.products);

    if (matchedProduct) {
      if (!matchedProduct.is_available) {
        messages.push(this.createBotMessage(
          `Desculpe, ${matchedProduct.name} está indisponível no momento.`
        ));
        return { session, messages };
      }

      session.cart = CartService.addItem(session.cart, matchedProduct, 1);
      const summary = CartService.formatSummary(session.cart);

      messages.push(this.createBotMessage(
        `✅ *${matchedProduct.name}* adicionado!\n\n${summary}\n\nQuer mais alguma coisa? Ou digite "finalizar pedido".`
      ));

      if (matchedProduct.category?.id && !session.offered_categories.includes(matchedProduct.category.id)) {
        session.offered_categories.push(matchedProduct.category.id);
      }

      return { session, messages };
    }

    // Offer complementary categories
    const complementary = this.getComplementaryProducts(session, catalog);
    if (complementary.length > 0) {
      let content = 'Talvez você goste de adicionar:\n\n';
      complementary.slice(0, 4).forEach((p) => {
        content += `• ${p.name} — R$ ${Number(p.price).toFixed(2)}\n`;
      });
      content += '\nDigite o nome do produto ou "finalizar pedido".';
      messages.push(this.createBotMessage(content, complementary.slice(0, 4)));
      return { session, messages };
    }

    // No suggestions — go to checkout
    return this.transitionToCheckout(session, messages);
  }

  private static getComplementaryProducts(
    session: ConversationSession,
    catalog: { products: Product[]; categories: Category[] }
  ): Product[] {
    // Suggest products from categories the user hasn't ordered from yet
    const orderedCategoryIds = new Set(
      session.cart.items
        .map((item) => catalog.products.find((p) => p.id === item.product_id)?.category_id)
        .filter(Boolean)
    );

    return catalog.products.filter(
      (p) =>
        p.is_available &&
        p.category_id &&
        !orderedCategoryIds.has(p.category_id) &&
        !session.offered_categories.includes(p.category_id)
    );
  }

  private static handleConfirmandoPedido(
    session: ConversationSession,
    input: string,
    text: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    if (text.includes('sim') || text.includes('confirmar') || text.includes('pode ser') || text.includes('isso mesmo')) {
      session.state = 'COLETANDO_NOME';
      messages.push(this.createBotMessage('Perfeito! Para finalizar, preciso de alguns dados.\n\nQual é o seu *nome*?'));
      return { session, messages };
    }

    if (text.includes('não') || text.includes('nao') || text.includes('cancelar') || text.includes('mudar')) {
      session.state = 'ESCOLHENDO_PRODUTO';
      messages.push(this.createBotMessage('Sem problema! O que gostaria de alterar? Digite o nome do produto para adicionar ou remover.'));
      return { session, messages };
    }

    messages.push(this.createBotMessage('Quer confirmar o pedido? Responda "sim" para continuar ou "não" para alterar.'));
    return { session, messages };
  }

  private static handleColetandoNome(
    session: ConversationSession,
    input: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    const name = input.trim();
    if (name.length < 2) {
      messages.push(this.createBotMessage('Por favor, digite um nome válido.'));
      return { session, messages };
    }

    session.cart.customer_name = name;
    session.state = 'COLETANDO_TELEFONE';
    messages.push(this.createBotMessage(`Obrigado, ${name}! Qual é o seu *telefone* (com DDD)?`));
    return { session, messages };
  }

  private static handleColetandoTelefone(
    session: ConversationSession,
    input: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    const phone = input.trim().replace(/\D/g, '');
    if (phone.length < 8) {
      messages.push(this.createBotMessage('Por favor, digite um telefone válido com DDD. Ex: (11) 99999-9999'));
      return { session, messages };
    }

    session.cart.customer_phone = input.trim();
    session.state = 'ESCOLHENDO_ENTREGA';
    messages.push(this.createBotMessage(
      'Como você quer receber seu pedido?',
      undefined,
      ['Entrega', 'Retirada no local']
    ));
    return { session, messages };
  }

  private static handleEscolhendoEntrega(
    session: ConversationSession,
    input: string,
    text: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    if (text.includes('entrega') || text.includes('entregar') || text.includes('receber em casa')) {
      session.cart.delivery_method = 'delivery';
      session.state = 'COLETANDO_ENDERECO';
      messages.push(this.createBotMessage('Qual é o seu *endereço completo*? (Rua, número, bairro, cidade)'));
      return { session, messages };
    }

    if (text.includes('retirada') || text.includes('retirar') || text.includes('buscar') || text.includes('local')) {
      session.cart.delivery_method = 'pickup';
      session.state = 'ESCOLHENDO_PAGAMENTO';
      const methods = PaymentService.getAllMethods();
      let content = 'Perfeito! Você vai retirar no local.\n\nQual a *forma de pagamento*?\n\n';
      methods.forEach((m) => {
        content += `• ${PaymentService.getLabel(m)}\n`;
      });
      messages.push(this.createBotMessage(content));
      return { session, messages };
    }

    messages.push(this.createBotMessage('Você prefere *entrega* ou *retirada no local*?', undefined, ['Entrega', 'Retirada no local']));
    return { session, messages };
  }

  private static handleColetandoEndereco(
    session: ConversationSession,
    input: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    const address = input.trim();
    if (address.length < 5) {
      messages.push(this.createBotMessage('Por favor, digite um endereço completo. Ex: Rua das Flores, 123, Centro, São Paulo'));
      return { session, messages };
    }

    session.cart.delivery_address = address;
    session.state = 'ESCOLHENDO_PAGAMENTO';
    const methods = PaymentService.getAllMethods();
    let content = 'Endereço registrado!\n\nQual a *forma de pagamento*?\n\n';
    methods.forEach((m) => {
      content += `• ${PaymentService.getLabel(m)}\n`;
    });
    messages.push(this.createBotMessage(content));
    return { session, messages };
  }

  private static handleEscolhendoPagamento(
    session: ConversationSession,
    input: string,
    text: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    let method: PaymentMethod | null = null;

    if (text.includes('pix')) method = 'pix';
    else if (text.includes('dinheiro')) method = 'cash';
    else if (text.includes('cartão') || text.includes('cartao')) method = 'card';
    else if (text.includes('vale') || text.includes('refeição') || text.includes('refeicao') || text.includes('ticket')) method = 'meal_voucher';

    if (!method) {
      messages.push(this.createBotMessage('Por favor, escolha uma forma de pagamento: PIX, Dinheiro, Cartão ou Vale-refeição.'));
      return { session, messages };
    }

    session.cart.payment_method = method;
    session.state = 'RESUMO';

    const summary = CartService.formatSummary(session.cart);
    let content = `📋 *Resumo do pedido:*\n\n`;
    content += `Nome: ${session.cart.customer_name}\n`;
    content += `Telefone: ${session.cart.customer_phone}\n`;
    if (session.cart.delivery_method === 'delivery') {
      content += `Endereço: ${session.cart.delivery_address}\n`;
      content += `Entrega: Delivery\n`;
    } else {
      content += `Entrega: Retirada no local\n`;
    }
    content += `Pagamento: ${PaymentService.getLabel(method)}\n\n`;
    content += summary;
    content += `\n\nTudo certo? Responda "confirmar" para finalizar o pedido.`;

    messages.push(this.createBotMessage(content, undefined, ['Confirmar', 'Cancelar']));
    return { session, messages };
  }

  private static handleResumo(
    session: ConversationSession,
    input: string,
    text: string,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    if (text.includes('confirmar') || text.includes('sim') || text.includes('tudo certo') || text.includes('pode ser')) {
      // This will be handled by the caller (hook) to create the actual order
      session.state = 'FINALIZADO';
      messages.push(this.createBotMessage('🎉 *Pedido confirmado com sucesso!*\n\nSeu pedido foi enviado para a cozinha. Em breve você receberá uma notificação com o status.'));
      return { session, messages };
    }

    if (text.includes('cancelar') || text.includes('não') || text.includes('nao')) {
      session.state = 'ESCOLHENDO_PRODUTO';
      messages.push(this.createBotMessage('Pedido cancelado. Quer fazer alguma alteração?'));
      return { session, messages };
    }

    messages.push(this.createBotMessage('Responda "confirmar" para finalizar ou "cancelar" para voltar.'));
    return { session, messages };
  }

  // ============ Helpers ============

  private static transitionToCheckout(
    session: ConversationSession,
    messages: ChatMessage[]
  ): { session: ConversationSession; messages: ChatMessage[] } {
    if (CartService.isEmpty(session.cart)) {
      messages.push(this.createBotMessage('Seu carrinho está vazio. Escolha um produto primeiro!'));
      session.state = 'ESCOLHENDO_PRODUTO';
      return { session, messages };
    }

    const summary = CartService.formatSummary(session.cart);
    messages.push(this.createBotMessage(
      `📋 *Confirme seu pedido:*\n\n${summary}\n\nQuer confirmar? Responda "sim" para continuar.`,
      undefined,
      ['Sim, confirmar', 'Não, quero alterar']
    ));
    session.state = 'CONFIRMANDO_PEDIDO';
    return { session, messages };
  }

  // Find a product by name (fuzzy match)
  private static findProduct(text: string, products: Product[]): Product | null {
    // Exact match
    const exact = products.find((p) => p.name.toLowerCase() === text);
    if (exact) return exact;

    // Contains match (product name in text or text in product name)
    const contains = products.find(
      (p) => text.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(text)
    );
    if (contains) return contains;

    // Word match — check if any significant word from the product name is in the text
    for (const product of products) {
      const words = product.name.toLowerCase().split(' ').filter((w) => w.length > 3);
      if (words.some((w) => text.includes(w))) return product;
    }

    return null;
  }

  private static createBotMessage(content: string, products?: Product[], quickReplies?: string[]): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role: 'bot',
      content,
      timestamp: new Date().toISOString(),
      products,
      quickReplies,
    };
  }

  // Build the order payload from the session
  static buildOrderPayload(session: ConversationSession): CreateOrderPayload {
    const items = session.cart.items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    return {
      company_id: session.company_id,
      customer_name: session.cart.customer_name,
      customer_phone: session.cart.customer_phone,
      delivery_address: session.cart.delivery_method === 'pickup' ? null : session.cart.delivery_address,
      delivery_method: session.cart.delivery_method,
      payment_method: session.cart.payment_method,
      items,
      total: CartService.getTotal(session.cart),
      notes: session.cart.notes,
    };
  }
}
