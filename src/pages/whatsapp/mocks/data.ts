
import { Conversation } from "../types/whatsapp.types";

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        clientId: "mock-1",
        clientName: "João Silva",
        phoneNumber: "5511999999999",
        primeiroNome: "João",
        status: "novo_cadastro",
        unitId: "unit-1",
        lastMessage: "Olá, gostaria de saber mais sobre o curso.",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min atrás
        lastMessageFromMe: false,
        totalMessages: 3,
        tipoAtendimento: "humano",
        unreadCount: 1,
        isNewLead: true,
        isUnregistered: false,
        isGroup: false,
        quantidadeCadastros: 1,
        leadSource: "Instagram",
        email: "joao.silva@email.com",
        observations: "Interessado no curso de inglês",
        unitName: "Unidade Centro",
        registrationName: "João da Silva"
    },
    {
        clientId: "mock-2",
        clientName: "Maria Oliveira",
        phoneNumber: "5511988888888",
        primeiroNome: "Maria",
        status: "negociacao",
        unitId: "unit-1",
        lastMessage: "Certo, vou verificar minha agenda.",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
        lastMessageFromMe: true,
        totalMessages: 15,
        tipoAtendimento: "humano",
        unreadCount: 0,
        isNewLead: false,
        isUnregistered: false,
        isGroup: false,
        quantidadeCadastros: 1,
        leadSource: "Indicação",
        email: "maria.oli@email.com"
    },
    {
        clientId: "phone_5511977777777",
        clientName: "+55 11 97777-7777",
        phoneNumber: "5511977777777",
        primeiroNome: "??",
        status: "não-cadastrado",
        unitId: "unit-1",
        lastMessage: "Qual o valor da mensalidade?",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
        lastMessageFromMe: false,
        totalMessages: 1,
        tipoAtendimento: "humano",
        unreadCount: 1,
        isNewLead: false,
        isUnregistered: true,
        isGroup: false,
        quantidadeCadastros: 0,
        leadSource: "WhatsApp"
    },
    {
        clientId: "group-1",
        clientName: "Equipe Pedagógica",
        phoneNumber: "group-1", // ID do grupo
        primeiroNome: "Equipe",
        status: "grupo",
        unitId: "unit-1",
        lastMessage: "Reunião confirmada para amanhã às 14h",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
        lastMessageFromMe: false,
        totalMessages: 50,
        tipoAtendimento: "humano",
        unreadCount: 3,
        isNewLead: false,
        isUnregistered: false,
        isGroup: true,
        quantidadeCadastros: 0,
        leadSource: "Interno"
    }
];

export const MOCK_MESSAGES = {
    "mock-1": [
        { id: "m1", mensagem: "Olá, bom dia!", created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), from_me: false, lida: true },
        { id: "m2", mensagem: "Bom dia, João! Como posso ajudar?", created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), from_me: true, lida: true },
        { id: "m3", mensagem: "Olá, gostaria de saber mais sobre o curso.", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), from_me: false, lida: false }
    ],
    "mock-2": [
        { id: "m4", mensagem: "Podemos agendar uma visita?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), from_me: false, lida: true },
        { id: "m5", mensagem: "Certo, vou verificar minha agenda.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), from_me: true, lida: true }
    ],
    "phone_5511977777777": [
        { id: "m6", mensagem: "Qual o valor da mensalidade?", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), from_me: false, lida: false }
    ],
    "group-1": [
        { id: "m7", mensagem: "Pessoal, precisamos definir a pauta da reunião.", created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), from_me: false, lida: true, created_by_name: "Ana" },
        { id: "m8", mensagem: "Eu sugiro falarmos sobre as novas matrículas.", created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), from_me: false, lida: true, created_by_name: "Carlos" },
        { id: "m9", mensagem: "Reunião confirmada para amanhã às 14h", created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), from_me: true, lida: true }
    ]
};
